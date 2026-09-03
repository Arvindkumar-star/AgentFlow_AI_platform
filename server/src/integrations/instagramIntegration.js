const BaseIntegration = require('./baseIntegration');

class InstagramIntegration extends BaseIntegration {
  constructor() {
    super('instagram');
  }

  async execute(action, params, credentials) {
    if (!credentials?.accessToken) {
      throw Object.assign(
        new Error('Instagram not connected. Paste your Instagram Access Token in Integrations.'),
        { code: 'INTEGRATION_NOT_CONNECTED' }
      );
    }

    const token = credentials.accessToken;
    const resolvedAction = action || params.action || 'post';

    // Get Instagram Business Account ID
    const getAccountId = async () => {
      const url = new URL('https://graph.facebook.com/v19.0/me/accounts');
      url.searchParams.set('access_token', token);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.error) throw new Error(`Instagram: ${data.error.message}`);
      const page = data.data?.[0];
      if (!page) throw new Error('Instagram: no Facebook Page found. Make sure your Instagram Business account is connected to a Facebook Page.');

      // Get Instagram Business Account ID linked to the page
      const igUrl = new URL(`https://graph.facebook.com/v19.0/${page.id}`);
      igUrl.searchParams.set('fields', 'instagram_business_account');
      igUrl.searchParams.set('access_token', token);
      const igRes = await fetch(igUrl.toString());
      const igData = await igRes.json();
      if (!igData.instagram_business_account?.id) {
        throw new Error('Instagram: no Instagram Business Account linked to your Facebook page.');
      }
      return igData.instagram_business_account.id;
    };

    if (resolvedAction === 'post' || resolvedAction === 'createPost') {
      const caption = params.caption || params.text || params.message;
      const imageUrl = params.imageUrl || params.image_url;

      if (!imageUrl) {
        throw new Error('Instagram: missing "imageUrl". Instagram requires an image URL to create a post.');
      }
      if (!caption?.trim()) {
        throw new Error('Instagram: missing "caption". Add a caption to the node config.');
      }

      const accountId = await getAccountId();

      // Step 1: Create media container
      const containerUrl = new URL(`https://graph.facebook.com/v19.0/${accountId}/media`);
      containerUrl.searchParams.set('access_token', token);
      const containerRes = await fetch(containerUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, caption: caption.trim() }),
      });
      const container = await containerRes.json();
      if (container.error) throw new Error(`Instagram container error: ${container.error.message}`);

      // Step 2: Publish media
      const publishUrl = new URL(`https://graph.facebook.com/v19.0/${accountId}/media_publish`);
      publishUrl.searchParams.set('access_token', token);
      const publishRes = await fetch(publishUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: container.id }),
      });
      const published = await publishRes.json();
      if (published.error) throw new Error(`Instagram publish error: ${published.error.message}`);
      return { mediaId: published.id, caption };
    }

    if (resolvedAction === 'getProfile' || resolvedAction === 'profile') {
      const accountId = await getAccountId();
      const url = new URL(`https://graph.facebook.com/v19.0/${accountId}`);
      url.searchParams.set('fields', 'id,username,followers_count,media_count');
      url.searchParams.set('access_token', token);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.error) throw new Error(`Instagram API error: ${data.error.message}`);
      return data;
    }

    throw new Error(`Instagram action "${resolvedAction}" not supported. Use "post" or "getProfile".`);
  }
}

module.exports = new InstagramIntegration();
