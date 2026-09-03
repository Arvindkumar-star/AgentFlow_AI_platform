const BaseIntegration = require('./baseIntegration');
const env = require('../config/env');

class LinkedInIntegration extends BaseIntegration {
  constructor() {
    super('linkedin');
  }

  async getOAuthUrl(userId, state) {
    if (!env.LINKEDIN_CLIENT_ID) {
      throw Object.assign(
        new Error('LINKEDIN_CLIENT_ID is not configured in server/.env'),
        { code: 'INTEGRATION_NOT_CONNECTED' }
      );
    }
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.LINKEDIN_CLIENT_ID,
      redirect_uri: env.LINKEDIN_REDIRECT_URI,
      state: state || '',
      scope: 'openid profile email w_member_social',
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async handleCallback(code) {
    if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
      throw new Error('LinkedIn OAuth credentials (LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET) are not configured');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.LINKEDIN_REDIRECT_URI,
      client_id: env.LINKEDIN_CLIENT_ID,
      client_secret: env.LINKEDIN_CLIENT_SECRET,
    });

    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`LinkedIn OAuth error: ${data.error_description || data.error || res.statusText}`);
    }

    // Try fetching user profile info with the newly obtained access token
    let profileData = {};
    try {
      const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (profileRes.ok) {
        profileData = await profileRes.json();
      }
    } catch (_) {}

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || null,
      expiry_date: data.expires_in ? Date.now() + (data.expires_in * 1000) : null,
      metadata: {
        name: profileData.name || null,
        email: profileData.email || null,
        sub: profileData.sub || null,
        picture: profileData.picture || null,
      },
    };
  }

  async execute(action, params, credentials) {
    if (!credentials?.accessToken) {
      throw Object.assign(
        new Error('LinkedIn not connected. Connect via OAuth or paste your Access Token in Integrations.'),
        { code: 'INTEGRATION_NOT_CONNECTED' }
      );
    }

    const headers = {
      'Authorization': `Bearer ${credentials.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    };

    const resolvedAction = action || params.action || 'post';

    if (resolvedAction === 'post' || resolvedAction === 'share') {
      const text = params.text || params.message || params.content;
      if (!text?.trim()) {
        throw new Error('LinkedIn: missing "text" field. Add the post content to the node config.');
      }

      // First get the user's profile ID
      const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', { headers });
      if (!profileRes.ok) {
        throw new Error('LinkedIn: could not fetch profile. Check your access token.');
      }
      const profile = await profileRes.json();
      const personId = profile.sub;

      // Post a share
      const body = {
        author: `urn:li:person:${personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: text.trim() },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': params.visibility || 'PUBLIC' },
      };

      let res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST', headers,
        body: JSON.stringify(body),
      });
      let data = await res.json();
      if (!res.ok) {
        const errorMsg = data.message || JSON.stringify(data);
        // LinkedIn anti-spam rule: "Content is a duplicate of urn:li:share:..."
        if (errorMsg.includes('duplicate') || errorMsg.includes('Duplicate')) {
          const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
          const deduplicatedText = `${text.trim()}\n\n[#Update: ${timestamp}]`;
          body.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary.text = deduplicatedText;

          res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST', headers,
            body: JSON.stringify(body),
          });
          data = await res.json();

          if (!res.ok) {
            const match = (data.message || errorMsg).match(/urn:li:share:\d+/);
            if (match) {
              return { postId: match[0], author: personId, duplicateDetected: true, note: 'Post is already live on your LinkedIn feed.' };
            }
            throw new Error(`LinkedIn API error: ${data.message || JSON.stringify(data)}`);
          }
          return { postId: data.id, author: personId, deduplicated: true };
        }
        throw new Error(`LinkedIn API error: ${data.message || JSON.stringify(data)}`);
      }
      return { postId: data.id, author: personId };
    }

    if (resolvedAction === 'getProfile' || resolvedAction === 'profile') {
      const res = await fetch('https://api.linkedin.com/v2/userinfo', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`LinkedIn API error: ${data.message || JSON.stringify(data)}`);
      return { name: data.name, email: data.email, sub: data.sub };
    }

    throw new Error(`LinkedIn action "${resolvedAction}" not supported. Use "post" or "getProfile".`);
  }
}

module.exports = new LinkedInIntegration();
