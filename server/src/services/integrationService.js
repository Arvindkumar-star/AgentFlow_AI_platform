const CryptoJS = require('crypto-js');
const Integration = require('../models/Integration');
const env = require('../config/env');

// Integration registry
const integrations = {
  gmail:       require('../integrations/gmailIntegration'),
  slack:       require('../integrations/slackIntegration'),
  discord:     require('../integrations/discordIntegration'),
  'google-sheets': require('../integrations/googleSheetsIntegration'),
  twitter:     require('../integrations/twitterIntegration'),
  linkedin:    require('../integrations/linkedinIntegration'),
  facebook:    require('../integrations/facebookIntegration'),
  instagram:   require('../integrations/instagramIntegration'),
  youtube:     require('../integrations/youtubeIntegration'),
};

// ─── Encryption helpers ───────────────────────────────────────
function encrypt(text) {
  if (!text) return null;
  return CryptoJS.AES.encrypt(text, env.CREDENTIAL_ENCRYPTION_KEY).toString();
}

function decrypt(ciphertext) {
  if (!ciphertext) return null;
  const bytes = CryptoJS.AES.decrypt(ciphertext, env.CREDENTIAL_ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// ─── Public service methods ───────────────────────────────────
async function listIntegrations(userId) {
  const records = await Integration.find({
    $or: [{ owner: userId }, { isConnected: true }]
  });
  // Strip encrypted tokens from the response
  return records.map((r) => ({
    id: r._id,
    provider: r.provider,
    isConnected: r.isConnected,
    scopes: r.scopes,
    expiresAt: r.expiresAt,
    metadata: r.metadata,
    updatedAt: r.updatedAt,
  }));
}

async function getStatus(userId) {
  const providers = [
    'gmail', 'slack', 'discord', 'google-sheets',
    'twitter', 'linkedin', 'facebook', 'instagram',
    'openrouter', 'gemini', 'notion', 'airtable',
    'github', 'stripe', 'twilio', 'webhook', 'hubspot', 'jira',
    'youtube', 'reddit', 'pinterest', 'tiktok',
    'mailchimp', 'sendgrid', 'shopify', 'dropbox',
    'google-drive', 'trello', 'asana', 'zoom', 'calendly',
    'razorpay', 'agentguard',
  ];
  const records = await Integration.find({
    $or: [{ owner: userId }, { isConnected: true }],
    provider: { $in: providers }
  });
  const statusMap = {};
  records.forEach((r) => { statusMap[r.provider] = r.isConnected; });
  // AgentGuard ZK is active out-of-the-box unless explicitly disconnected
  if (statusMap['agentguard'] === undefined) {
    statusMap['agentguard'] = true;
  }
  return providers.map((p) => ({ provider: p, isConnected: statusMap[p] || false }));
}

async function getOAuthUrl(provider, userId, state) {
  const integration = integrations[provider];
  if (!integration) throw Object.assign(new Error(`Unknown provider: ${provider}`), { statusCode: 400 });
  return integration.getOAuthUrl(userId, state);
}

async function handleOAuthCallback(provider, code, userId) {
  const integration = integrations[provider];
  if (!integration) throw Object.assign(new Error(`Unknown provider: ${provider}`), { statusCode: 400 });

  const tokens = await integration.handleCallback(code, userId);

  const encryptedAccessToken = encrypt(tokens.access_token || tokens.accessToken);
  const encryptedRefreshToken = encrypt(tokens.refresh_token || tokens.refreshToken);

  await Integration.findOneAndUpdate(
    { owner: userId, provider },
    {
      isConnected: true,
      encryptedAccessToken,
      encryptedRefreshToken,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      metadata: { teamName: tokens.team?.name, botUserId: tokens.bot_user_id, ...(tokens.metadata || {}) },
    },
    { upsert: true, new: true }
  );
}

async function saveCredential(userId, provider, data) {
  const isDisconnect = !data.accessToken || data.accessToken.trim() === '';
  const encryptedAccessToken  = isDisconnect ? null : encrypt(data.accessToken);
  const encryptedRefreshToken = isDisconnect ? null : encrypt(data.refreshToken);

  await Integration.findOneAndUpdate(
    { owner: userId, provider },
    {
      isConnected: !isDisconnect,
      encryptedAccessToken,
      encryptedRefreshToken,
      metadata: data.metadata || {},
    },
    { upsert: true, new: true }
  );
}

async function getDecryptedCredentials(userId, provider) {
  let record = await Integration.findOne({ owner: userId, provider });
  if (!record || !record.isConnected) {
    record = await Integration.findOne({ provider, isConnected: true });
  }
  if (!record || !record.isConnected) {
    throw Object.assign(new Error(`${provider} INTEGRATION_NOT_CONNECTED`), { code: 'INTEGRATION_NOT_CONNECTED' });
  }
  return {
    accessToken: decrypt(record.encryptedAccessToken),
    refreshToken: decrypt(record.encryptedRefreshToken),
    expiresAt: record.expiresAt,
  };
}

async function execute(provider, action, params) {
  const integration = integrations[provider];
  if (!integration) throw Object.assign(new Error(`Unknown provider: ${provider}`), { statusCode: 400 });

  const credentials = await getDecryptedCredentials(params.userId, provider);
  return integration.execute(action, params, credentials);
}

module.exports = {
  listIntegrations, getStatus, getOAuthUrl,
  handleOAuthCallback, saveCredential, getDecryptedCredentials, execute,
};
