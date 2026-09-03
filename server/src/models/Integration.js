const mongoose = require('mongoose');

const IntegrationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    authType: {
      type: String,
      enum: ['oauth2', 'api_key', 'webhook', 'bot_token', 'service_account', 'manual'],
      default: 'manual',
    },
    isBYOK: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'invalid', 'disconnected', 'pending'],
      default: 'active',
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    // Encrypted JSON data holding flexible custom fields (e.g., botToken, webhookUrl, apiKey, secret)
    encryptedData: {
      type: String,
      default: null,
    },
    // Safe masked string displayed on frontend (e.g. sk-proj••••••••4f21)
    maskedIdentifier: {
      type: String,
      default: null,
    },
    lastTestedAt: {
      type: Date,
      default: null,
    },
    scopes: [{ type: String }],
    // OAuth token fields
    encryptedAccessToken: { type: String, default: null },
    encryptedRefreshToken: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

IntegrationSchema.index({ owner: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('Integration', IntegrationSchema);
