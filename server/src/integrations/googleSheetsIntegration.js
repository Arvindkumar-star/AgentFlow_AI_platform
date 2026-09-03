const { google } = require('googleapis');
const BaseIntegration = require('./baseIntegration');
const env = require('../config/env');

class GoogleSheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets');
  }

  _getOAuth2Client() {
    return new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_SHEETS_REDIRECT_URI
    );
  }

  async getOAuthUrl(userId, state) {
    if (!env.GOOGLE_CLIENT_ID) throw Object.assign(new Error('GOOGLE_CLIENT_ID not configured'), { code: 'INTEGRATION_NOT_CONNECTED' });
    const client = this._getOAuth2Client();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      state,
      scope: ['https://www.googleapis.com/auth/spreadsheets', 'profile', 'email'],
    });
  }

  async handleCallback(code) {
    const client = this._getOAuth2Client();
    const { tokens } = await client.getToken(code);
    return tokens;
  }

  async execute(action, params, credentials) {
    if (!credentials?.accessToken) {
      throw Object.assign(
        new Error('Google Sheets not connected. Please connect your Google account in Integrations.'),
        { code: 'INTEGRATION_NOT_CONNECTED' }
      );
    }
    const client = this._getOAuth2Client();
    client.setCredentials({
      access_token:  credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });

    // Auto-refresh token if expired
    try {
      const tokenInfo = await client.getTokenInfo(credentials.accessToken);
      if (tokenInfo.expiry_date && Date.now() >= tokenInfo.expiry_date - 60_000) {
        const { credentials: fresh } = await client.refreshAccessToken();
        client.setCredentials(fresh);
      }
    } catch (_) {
      if (credentials.refreshToken) {
        try {
          const { credentials: fresh } = await client.refreshAccessToken();
          client.setCredentials(fresh);
        } catch {
          throw Object.assign(
            new Error('Google Sheets token expired. Please reconnect your Google account in Integrations.'),
            { code: 'INTEGRATION_NOT_CONNECTED' }
          );
        }
      }
    }

    const sheets = google.sheets({ version: 'v4', auth: client });

    // Default action
    const resolvedAction = action || params.action || 'appendRow';

    // Validate spreadsheetId
    if (!params.spreadsheetId || !params.spreadsheetId.trim()) {
      throw new Error(
        'Google Sheets: missing "spreadsheetId". Open the Google Sheets node config and paste your spreadsheet ID (found in the sheet URL).'
      );
    }

    if (resolvedAction === 'appendRow') {
      const result = await sheets.spreadsheets.values.append({
        spreadsheetId: params.spreadsheetId,
        range: params.range || 'Sheet1!A:Z',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [params.values || []] },
      });
      return { updatedRange: result.data.updates?.updatedRange, updatedRows: result.data.updates?.updatedRows };
    }

    if (resolvedAction === 'readRange') {
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: params.spreadsheetId,
        range: params.range || 'Sheet1!A:Z',
      });
      return { values: result.data.values || [], range: result.data.range };
    }

    throw new Error(`Google Sheets action "${resolvedAction}" not supported. Use "appendRow" or "readRange".`);
  }
}

module.exports = new GoogleSheetsIntegration();
