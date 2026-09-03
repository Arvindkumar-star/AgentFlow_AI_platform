const { WebClient } = require('@slack/web-api');
const BaseIntegration = require('./baseIntegration');
const env = require('../config/env');
const axios = require('axios');

class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack');
  }

  async getOAuthUrl(userId, state) {
    if (!env.SLACK_CLIENT_ID) throw Object.assign(new Error('SLACK_CLIENT_ID not configured'), { code: 'INTEGRATION_NOT_CONNECTED' });
    const scopes = 'chat:write,channels:read,incoming-webhook,channels:history';
    return `https://slack.com/oauth/v2/authorize?client_id=${env.SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(env.SLACK_REDIRECT_URI)}&state=${encodeURIComponent(state || '')}`;
  }

  async handleCallback(code) {
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: env.SLACK_CLIENT_ID,
        client_secret: env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: env.SLACK_REDIRECT_URI,
      },
    });
    if (!response.data.ok) throw new Error(response.data.error || 'Slack OAuth failed');
    return {
      access_token: response.data.access_token,
      bot_user_id: response.data.bot_user_id,
      team: response.data.team,
    };
  }

  async execute(action, params, credentials) {
    const webhookUrl = params.webhookUrl || credentials?.webhookUrl;
    const token = credentials?.botToken || credentials?.accessToken || env.SLACK_BOT_TOKEN;

    if (webhookUrl) {
      const resp = await axios.post(webhookUrl, {
        text: params.message || params.text || 'Hello from Agentflow_AI!',
      });
      return { success: true, via: 'incoming-webhook', status: resp.status };
    }

    if (!token) {
      throw Object.assign(new Error('Slack is not connected. Please provide an Incoming Webhook URL or Bot Token in Integrations.'), { code: 'INTEGRATION_NOT_CONNECTED' });
    }

    const client = new WebClient(token);

    if (action === 'postMessage' || !action) {
      const result = await client.chat.postMessage({
        channel: params.channel || params.channelId || '#general',
        text: params.message || params.text || 'Hello from Agentflow_AI!',
      });
      return { ts: result.ts, channel: result.channel, ok: result.ok, success: true };
    }

    if (action === 'listChannels') {
      const result = await client.conversations.list({ limit: 100 });
      return { channels: result.channels, success: true };
    }

    throw new Error(`Slack action "${action}" not supported`);
  }
}

module.exports = new SlackIntegration();
