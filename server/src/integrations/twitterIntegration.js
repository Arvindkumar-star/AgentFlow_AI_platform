const BaseIntegration = require('./baseIntegration');

class TwitterIntegration extends BaseIntegration {
  constructor() {
    super('twitter');
  }

  async execute(action, params, credentials) {
    if (!credentials?.accessToken) {
      throw Object.assign(
        new Error('Twitter not connected. Paste your Bearer Token in Integrations.'),
        { code: 'INTEGRATION_NOT_CONNECTED' }
      );
    }

    const bearerToken = credentials.accessToken;
    const headers = {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    };

    const resolvedAction = action || params.action || 'tweet';

    if (resolvedAction === 'tweet' || resolvedAction === 'post') {
      const text = params.text || params.message || params.content;
      if (!text?.trim()) {
        throw new Error('Twitter: missing "text" field. Add the tweet content to the node config.');
      }

      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: text.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(`Twitter API error: ${data.detail || data.title || JSON.stringify(data)}`);
      }
      return { tweetId: data.data?.id, text: data.data?.text };
    }

    if (resolvedAction === 'getTimeline' || resolvedAction === 'read') {
      const res = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(params.query || 'from:me')}&max_results=${params.maxResults || 10}`,
        { headers }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(`Twitter API error: ${data.detail || JSON.stringify(data)}`);
      return { tweets: data.data || [], meta: data.meta };
    }

    throw new Error(`Twitter action "${resolvedAction}" not supported. Use "tweet" or "getTimeline".`);
  }
}

module.exports = new TwitterIntegration();
