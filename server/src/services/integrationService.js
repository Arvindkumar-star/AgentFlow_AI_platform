const axios = require('axios');
const Integration = require('../models/Integration');
const env = require('../config/env');
const { encryptCredential, decryptCredential, maskSecret } = require('../utils/crypto');

// Integration registry
const integrations = {
  gmail:           require('../integrations/gmailIntegration'),
  slack:           require('../integrations/slackIntegration'),
  discord:         require('../integrations/discordIntegration'),
  'google-sheets': require('../integrations/googleSheetsIntegration'),
  twitter:         require('../integrations/twitterIntegration'),
  linkedin:        require('../integrations/linkedinIntegration'),
  facebook:        require('../integrations/facebookIntegration'),
  instagram:       require('../integrations/instagramIntegration'),
  youtube:         require('../integrations/youtubeIntegration'),
};

const ALL_PROVIDERS = [
  'gmail', 'slack', 'discord', 'google-sheets',
  'twitter', 'linkedin', 'facebook', 'instagram',
  'openrouter', 'gemini', 'notion', 'airtable',
  'github', 'stripe', 'twilio', 'webhook', 'hubspot', 'jira',
  'youtube', 'reddit', 'pinterest', 'tiktok',
  'mailchimp', 'sendgrid', 'shopify', 'dropbox',
  'google-drive', 'trello', 'asana', 'zoom', 'calendly',
  'razorpay', 'agentguard',
];

// ─── Save BYOK Credentials ────────────────────────────────────
async function saveBYOKCredential(userId, provider, authType, payload) {
  if (!payload || Object.keys(payload).length === 0) {
    throw Object.assign(new Error('Credential payload cannot be empty'), { statusCode: 400 });
  }

  // Derive primary identifier to mask
  const primarySecret =
    payload.apiKey ||
    payload.token ||
    payload.botToken ||
    payload.webhookUrl ||
    payload.accessToken ||
    payload.keyId ||
    payload.secret ||
    Object.values(payload)[0];

  const maskedIdentifier = maskSecret(primarySecret);
  const encryptedData = encryptCredential(payload);

  const updated = await Integration.findOneAndUpdate(
    { owner: userId, provider },
    {
      owner: userId,
      provider,
      authType: authType || 'api_key',
      isBYOK: true,
      isConnected: true,
      status: 'active',
      encryptedData,
      maskedIdentifier,
      lastTestedAt: new Date(),
      metadata: { ...payload, ...(payload.metadata || {}) },
    },
    { upsert: true, new: true }
  );

  return {
    success: true,
    provider: updated.provider,
    isBYOK: true,
    isConnected: true,
    maskedIdentifier: updated.maskedIdentifier,
    lastTestedAt: updated.lastTestedAt,
  };
}

// ─── Delete / Disconnect BYOK Credentials ──────────────────────
async function deleteBYOKCredential(userId, provider) {
  await Integration.findOneAndUpdate(
    { owner: userId, provider },
    {
      isConnected: false,
      isBYOK: false,
      status: 'disconnected',
      encryptedData: null,
      encryptedAccessToken: null,
      encryptedRefreshToken: null,
      maskedIdentifier: null,
    }
  );
  return { success: true, provider, isConnected: false };
}

// ─── Get Decrypted Credentials for Execution ──────────────────
async function getDecryptedCredentials(userId, provider) {
  let record = null;
  if (userId) {
    record = await Integration.findOne({ owner: userId, provider, isConnected: true });
  }
  if (!record) {
    record = await Integration.findOne({ provider, isConnected: true });
  }

  // 1. If BYOK Custom Credentials Exist
  if (record?.encryptedData) {
    const decryptedPayload = decryptCredential(record.encryptedData);
    if (decryptedPayload) {
      return {
        isBYOK: true,
        authType: record.authType,
        ...decryptedPayload,
        // Map common aliases
        accessToken: decryptedPayload.accessToken || decryptedPayload.apiKey || decryptedPayload.botToken,
        webhookUrl: decryptedPayload.webhookUrl,
        botToken: decryptedPayload.botToken,
        apiKey: decryptedPayload.apiKey,
        keyId: decryptedPayload.keyId,
        keySecret: decryptedPayload.keySecret,
      };
    }
  }

  // 2. If OAuth Tokens Exist
  if (record?.encryptedAccessToken) {
    return {
      isBYOK: false,
      accessToken: decryptCredential(record.encryptedAccessToken),
      refreshToken: decryptCredential(record.encryptedRefreshToken),
      expiresAt: record.expiresAt,
      metadata: record.metadata,
    };
  }

  // 3. Fallback to System Environment Variables
  const envCreds = getSystemEnvFallback(provider);
  if (envCreds) {
    return { isBYOK: false, isSystemEnv: true, ...envCreds };
  }

  // 4. Default for out-of-the-box system modules (AgentGuard)
  if (provider === 'agentguard') {
    return { isBYOK: false, active: true };
  }

  throw Object.assign(
    new Error(`No active credentials found for ${provider}. Please configure custom credentials in Integrations.`),
    { code: 'MISSING_INTEGRATION_CREDENTIALS', statusCode: 401 }
  );
}

// ─── System Environment Fallback Helper ───────────────────────
function getSystemEnvFallback(provider) {
  switch (provider) {
    case 'discord':
      if (env.DISCORD_BOT_TOKEN) return { botToken: env.DISCORD_BOT_TOKEN };
      break;
    case 'slack':
      if (env.SLACK_BOT_TOKEN) return { botToken: env.SLACK_BOT_TOKEN };
      break;
    case 'razorpay':
      if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
        return { keyId: env.RAZORPAY_KEY_ID, keySecret: env.RAZORPAY_KEY_SECRET };
      }
      break;
    case 'openrouter':
      if (env.OPENROUTER_API_KEY) return { apiKey: env.OPENROUTER_API_KEY };
      break;
    case 'gemini':
      if (env.GEMINI_API_KEY) return { apiKey: env.GEMINI_API_KEY };
      break;
    default:
      return null;
  }
  return null;
}

// ─── Live Connection Test Diagnostic ──────────────────────────
async function testConnection(provider, payload) {
  try {
    switch (provider) {
      case 'discord': {
        if (payload.webhookUrl) {
          // Send test GET or parse webhook URL
          if (!payload.webhookUrl.includes('discord.com/api/webhooks')) {
            throw new Error('Invalid Discord Webhook URL format.');
          }
          return { success: true, message: 'Discord Webhook URL format is valid and ready.' };
        }
        if (payload.botToken) {
          const resp = await axios.get('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bot ${payload.botToken.trim()}` },
            timeout: 5000,
          });
          return {
            success: true,
            message: `Connected to Discord Bot: ${resp.data.username}#${resp.data.discriminator}`,
            botName: resp.data.username,
          };
        }
        throw new Error('Please provide either a Discord Webhook URL or Bot Token.');
      }

      case 'slack': {
        if (payload.webhookUrl) {
          if (!payload.webhookUrl.includes('hooks.slack.com/services')) {
            throw new Error('Invalid Slack Incoming Webhook URL format.');
          }
          return { success: true, message: 'Slack Incoming Webhook URL format is valid.' };
        }
        if (payload.botToken || payload.accessToken) {
          const token = (payload.botToken || payload.accessToken).trim();
          const resp = await axios.post(
            'https://slack.com/api/auth.test',
            {},
            { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
          );
          if (!resp.data.ok) {
            throw new Error(resp.data.error || 'Slack authentication failed.');
          }
          return {
            success: true,
            message: `Connected to Slack Workspace: ${resp.data.team} (${resp.data.user})`,
            team: resp.data.team,
          };
        }
        throw new Error('Please provide a Slack Webhook URL or Bot Token (xoxb-...).');
      }

      case 'razorpay': {
        const keyId = payload.keyId || payload.apiKey;
        const keySecret = payload.keySecret || payload.secret;
        if (!keyId || !keySecret) {
          throw new Error('Both Key ID and Key Secret are required for Razorpay.');
        }
        const authHeader = Buffer.from(`${keyId.trim()}:${keySecret.trim()}`).toString('base64');
        const resp = await axios.get('https://api.razorpay.com/v1/contacts?count=1', {
          headers: { Authorization: `Basic ${authHeader}` },
          timeout: 5000,
        });
        return { success: true, message: 'Razorpay API credentials verified successfully!' };
      }

      case 'openrouter':
      case 'openai': {
        const apiKey = payload.apiKey || payload.token;
        if (!apiKey) throw new Error('API Key is required.');
        const isOR = provider === 'openrouter' || apiKey.startsWith('sk-or-');
        const endpoint = isOR ? 'https://openrouter.ai/api/v1/models' : 'https://api.openai.com/v1/models';
        await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
          timeout: 6000,
        });
        return { success: true, message: `${isOR ? 'OpenRouter' : 'OpenAI'} API Key authenticated successfully!` };
      }

      case 'gemini': {
        const apiKey = payload.apiKey || payload.token;
        if (!apiKey) throw new Error('Gemini API Key is required.');
        await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`, {
          timeout: 6000,
        });
        return { success: true, message: 'Google Gemini API Key authenticated successfully!' };
      }

      default: {
        // Generic check: ensure key values are present and not empty
        const values = Object.values(payload).filter(v => typeof v === 'string' && v.trim().length > 0);
        if (values.length === 0) {
          throw new Error('Please fill in the required credential fields.');
        }
        return { success: true, message: `Configuration verified for ${provider}. Ready to save.` };
      }
    }
  } catch (err) {
    const errorMsg =
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Failed to connect with provided credentials.';
    return { success: false, message: errorMsg };
  }
}

// ─── Get Unified Status for All Integrations ──────────────────
async function getStatus(userId) {
  const records = await Integration.find({
    $or: [{ owner: userId }, { isConnected: true }],
  });

  const recordMap = {};
  records.forEach((r) => {
    recordMap[r.provider] = {
      isConnected: r.isConnected,
      isBYOK: r.isBYOK || false,
      authType: r.authType || 'manual',
      status: r.status || 'active',
      maskedIdentifier: r.maskedIdentifier || null,
      lastTestedAt: r.lastTestedAt || null,
      updatedAt: r.updatedAt,
    };
  });

  // AgentGuard ZK is enabled out-of-the-box
  if (!recordMap['agentguard']) {
    recordMap['agentguard'] = {
      isConnected: true,
      isBYOK: false,
      authType: 'manual',
      status: 'active',
      maskedIdentifier: 'Groth16 BN128 Circuit Ready',
    };
  }

  return ALL_PROVIDERS.map((p) => {
    const info = recordMap[p] || {
      isConnected: false,
      isBYOK: false,
      authType: 'manual',
      status: 'disconnected',
      maskedIdentifier: null,
    };
    return {
      provider: p,
      ...info,
    };
  });
}

// ─── OAuth Flow Helpers ───────────────────────────────────────
async function getOAuthUrl(provider, userId, state) {
  const integration = integrations[provider];
  if (!integration) throw Object.assign(new Error(`Unknown provider: ${provider}`), { statusCode: 400 });
  return integration.getOAuthUrl(userId, state);
}

async function handleOAuthCallback(provider, code, userId) {
  const integration = integrations[provider];
  if (!integration) throw Object.assign(new Error(`Unknown provider: ${provider}`), { statusCode: 400 });

  const tokens = await integration.handleCallback(code, userId);

  const encryptedAccessToken = encryptCredential(tokens.access_token || tokens.accessToken);
  const encryptedRefreshToken = encryptCredential(tokens.refresh_token || tokens.refreshToken);

  await Integration.findOneAndUpdate(
    { owner: userId, provider },
    {
      owner: userId,
      provider,
      authType: 'oauth2',
      isBYOK: false,
      isConnected: true,
      status: 'active',
      encryptedAccessToken,
      encryptedRefreshToken,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      maskedIdentifier: maskSecret(tokens.access_token || tokens.accessToken),
      metadata: { teamName: tokens.team?.name, botUserId: tokens.bot_user_id, ...(tokens.metadata || {}) },
    },
    { upsert: true, new: true }
  );
}

// ─── Execute Integration Action ───────────────────────────────
async function execute(provider, action, params) {
  const integration = integrations[provider];
  if (!integration) {
    throw Object.assign(new Error(`Integration provider '${provider}' is not implemented`), { statusCode: 400 });
  }

  const credentials = await getDecryptedCredentials(params.userId, provider);
  return integration.execute(action, params, credentials);
}

module.exports = {
  saveBYOKCredential,
  deleteBYOKCredential,
  getDecryptedCredentials,
  testConnection,
  getStatus,
  getOAuthUrl,
  handleOAuthCallback,
  execute,
};
