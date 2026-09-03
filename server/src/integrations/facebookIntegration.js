const BaseIntegration = require('./baseIntegration');

class FacebookIntegration extends BaseIntegration {
  constructor() {
    super('facebook');
  }

  async execute(action, params, credentials) {
    if (!credentials?.accessToken) {
      throw Object.assign(
        new Error('Facebook not connected. Paste your Page Access Token in Integrations.'),
        { code: 'INTEGRATION_NOT_CONNECTED' }
      );
    }

    const token = credentials.accessToken;
    const resolvedAction = action || params.action || 'post';

    if (resolvedAction === 'post' || resolvedAction === 'pagePost') {
      const message = params.message || params.text || params.content;
      if (!message?.trim()) {
        throw new Error('Facebook: missing "message" field. Add the post content to the node config.');
      }

      const pageId = params.pageId || 'me';
      const url = new URL(`https://graph.facebook.com/v19.0/${pageId}/feed`);
      url.searchParams.set('access_token', token);

      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          link: params.link || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(`Facebook API error: ${data.error.message}`);
      return { postId: data.id };
    }

    if (resolvedAction === 'getPage' || resolvedAction === 'profile') {
      const url = new URL('https://graph.facebook.com/v19.0/me');
      url.searchParams.set('access_token', token);
      url.searchParams.set('fields', 'id,name,fan_count,category');
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.error) throw new Error(`Facebook API error: ${data.error.message}`);
      return data;
    }

    throw new Error(`Facebook action "${resolvedAction}" not supported. Use "post" or "getPage".`);
  }
}

module.exports = new FacebookIntegration();
