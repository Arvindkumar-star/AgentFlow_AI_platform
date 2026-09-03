const BaseIntegration = require('./baseIntegration');
const env = require('../config/env');
const axios = require('axios');

class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  async getOAuthUrl() {
    if (!env.DISCORD_CLIENT_ID) throw Object.assign(new Error('DISCORD_CLIENT_ID not configured'), { code: 'INTEGRATION_NOT_CONNECTED' });
    const scopes = 'bot identify';
    const permissions = '2048'; // Send messages
    return `https://discord.com/api/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&permissions=${permissions}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(env.DISCORD_REDIRECT_URI)}&response_type=code`;
  }

  async handleCallback(code) {
    const response = await axios.post('https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.DISCORD_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data;
  }

  async execute(action, params, credentials) {
    const webhookUrl = params.webhookUrl || credentials?.webhookUrl;
    const botToken = credentials?.botToken || credentials?.accessToken || env.DISCORD_BOT_TOKEN;

    if (webhookUrl) {
      const response = await axios.post(
        webhookUrl,
        { content: params.message || 'Hello from Agentflow_AI!' },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return { success: true, via: 'webhook', status: response.status };
    }

    if (!botToken) {
      throw Object.assign(new Error('Discord is not configured. Please supply a Bot Token or Webhook URL in Integrations.'), { code: 'INTEGRATION_NOT_CONNECTED' });
    }

    if (action === 'postMessage' || !action) {
      const channelId = params.channelId || credentials?.channelId;
      if (!channelId) {
        throw new Error('Discord channelId is required when using Bot Token.');
      }
      const response = await axios.post(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        { content: params.message || 'Hello from Agentflow_AI!' },
        { headers: { Authorization: `Bot ${botToken.trim()}`, 'Content-Type': 'application/json' } }
      );
      return { messageId: response.data.id, channelId: response.data.channel_id, success: true };
    }

    throw new Error(`Discord action "${action}" not supported`);
  }
}

module.exports = new DiscordIntegration();
