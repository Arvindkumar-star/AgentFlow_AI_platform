/**
 * Base Integration Interface
 * All providers must implement: connect(), disconnect(), execute()
 */
class BaseIntegration {
  constructor(provider) {
    this.provider = provider;
  }

  /** Initiate OAuth flow — returns redirect URL */
  async getOAuthUrl(userId) {
    throw new Error(`${this.provider}.getOAuthUrl() not implemented`);
  }

  /** Handle OAuth callback — exchange code for tokens */
  async handleCallback(code, userId) {
    throw new Error(`${this.provider}.handleCallback() not implemented`);
  }

  /** Disconnect — revoke tokens */
  async disconnect(userId) {
    throw new Error(`${this.provider}.disconnect() not implemented`);
  }

  /**
   * Execute an action (send, read, append, etc.)
   * @param {string} action
   * @param {object} params
   * @param {object} credentials  - Decrypted access/refresh tokens
   */
  async execute(action, params, credentials) {
    throw new Error(`${this.provider}.execute(${action}) not implemented`);
  }
}

module.exports = BaseIntegration;
