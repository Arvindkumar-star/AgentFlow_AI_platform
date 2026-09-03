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
      enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
      required: true,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    scopes: [{ type: String }],
    // All token values stored encrypted — NEVER store plaintext here
    encryptedAccessToken: { type: String },
    encryptedRefreshToken: { type: String },
    expiresAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

IntegrationSchema.index({ owner: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('Integration', IntegrationSchema);
