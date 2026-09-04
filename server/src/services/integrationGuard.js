const mongoose = require('mongoose');
const Integration = require('../models/Integration');
const env = require('../config/env');

/**
 * Integration Connection Pre-flight Guard
 * Checks whether required integrations (email, payouts, etc.) are connected before attempting dispatch.
 * Prevents unhandled exceptions & API crashes when integrations are unconfigured.
 */
class IntegrationGuardService {
  /**
   * Check if the user (or system) has an active, valid email integration configured.
   * Checks for:
   * 1. User BYOK / OAuth Integration record (Gmail, SendGrid, Resend, SMTP, Mailchimp)
   * 2. System-level SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS)
   * 3. System-level API keys (RESEND_API_KEY, SENDGRID_API_KEY)
   * 
   * @param {string|null} userId - The user ID executing the action
   * @returns {Promise<{ isConnected: boolean, provider: string, source: 'user_oauth'|'user_byok'|'system_smtp'|'system_api'|'unconnected', details?: any }>}
   */
  async checkEmailIntegration(userId = null) {
    try {
      // 1. Check User Integrations in MongoDB (if mongoose is connected and userId provided)
      if (mongoose.connection.readyState === 1) {
        if (userId) {
          const userIntegration = await Integration.findOne({
            owner: userId,
            provider: { $in: ['gmail', 'sendgrid', 'resend', 'smtp', 'email', 'mailchimp'] },
            isConnected: true,
            status: { $ne: 'disconnected' },
          });

          if (userIntegration) {
            return {
              isConnected: true,
              provider: userIntegration.provider,
              source: userIntegration.isBYOK ? 'user_byok' : (userIntegration.authType === 'oauth2' ? 'user_oauth' : 'user_byok'),
              authType: userIntegration.authType,
              maskedIdentifier: userIntegration.maskedIdentifier,
              integrationDoc: userIntegration,
            };
          }
        }

        // Check global/any active integration if not scoped to single user
        const anyActiveIntegration = await Integration.findOne({
          provider: { $in: ['gmail', 'sendgrid', 'resend', 'smtp', 'email', 'mailchimp'] },
          isConnected: true,
          status: { $ne: 'disconnected' },
        });

        if (anyActiveIntegration) {
          return {
            isConnected: true,
            provider: anyActiveIntegration.provider,
            source: anyActiveIntegration.isBYOK ? 'user_byok' : (anyActiveIntegration.authType === 'oauth2' ? 'user_oauth' : 'user_byok'),
            authType: anyActiveIntegration.authType,
            maskedIdentifier: anyActiveIntegration.maskedIdentifier,
            integrationDoc: anyActiveIntegration,
          };
        }
      }

      // 2. Check System SMTP Environment Variables
      const hasSystemSmtp = Boolean(
        (process.env.SMTP_HOST || env.SMTP_HOST) &&
        (process.env.SMTP_USER || env.SMTP_USER)
      );

      if (hasSystemSmtp) {
        return {
          isConnected: true,
          provider: 'smtp',
          source: 'system_smtp',
          host: process.env.SMTP_HOST || env.SMTP_HOST,
        };
      }

      // 3. Check System Resend / SendGrid Keys
      const hasResend = Boolean(process.env.RESEND_API_KEY || env.RESEND_API_KEY);
      if (hasResend) {
        return {
          isConnected: true,
          provider: 'resend',
          source: 'system_api',
        };
      }

      const hasSendgrid = Boolean(process.env.SENDGRID_API_KEY || env.SENDGRID_API_KEY);
      if (hasSendgrid) {
        return {
          isConnected: true,
          provider: 'sendgrid',
          source: 'system_api',
        };
      }

      // Not configured
      return {
        isConnected: false,
        provider: 'none',
        source: 'unconnected',
      };
    } catch (err) {
      console.warn('[AgentGuard] Error checking email integration status:', err.message);
      return {
        isConnected: false,
        provider: 'none',
        source: 'unconnected',
        error: err.message,
      };
    }
  }

  /**
   * Guarded Email Dispatcher
   * Pre-flights connection check. If connected -> executes dispatchFn.
   * If NOT connected -> logs clean notice and gracefully skips without throwing or breaking payment flow.
   * 
   * @param {string|null} userId 
   * @param {Function} dispatchFn - Async callback that dispatches the email
   * @param {object} context - Additional metadata (e.g., recipient, invoiceNumber)
   * @returns {Promise<{ dispatched: boolean, skipped?: boolean, result?: any, reason?: string }>}
   */
  async guardEmailDispatch(userId, dispatchFn, context = {}) {
    const status = await this.checkEmailIntegration(userId);

    if (!status.isConnected) {
      console.log('[AgentGuard] Email integration not connected for user. Skipping email dispatch.');
      return {
        dispatched: false,
        skipped: true,
        reason: 'Email integration not connected for user. Skipping email dispatch.',
        status,
        paymentLink: context.paymentLink || null,
      };
    }

    try {
      const result = await dispatchFn(status);
      return {
        dispatched: true,
        skipped: false,
        result,
        status,
        paymentLink: context.paymentLink || null,
      };
    } catch (dispatchErr) {
      console.error('[AgentGuard] Email dispatch failed after pre-flight check:', dispatchErr.message);
      return {
        dispatched: false,
        skipped: false,
        error: dispatchErr.message,
        paymentLink: context.paymentLink || null,
      };
    }
  }

  /**
   * Check connection status for any provider
   */
  async checkIntegrationConnected(userId, provider) {
    if (!provider) return false;
    try {
      if (mongoose.connection.readyState === 1) {
        if (userId) {
          const doc = await Integration.findOne({
            owner: userId,
            provider,
            isConnected: true,
            status: { $ne: 'disconnected' },
          });
          if (doc) return true;
        }

        const globalDoc = await Integration.findOne({
          provider,
          isConnected: true,
          status: { $ne: 'disconnected' },
        });
        return Boolean(globalDoc);
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}

module.exports = new IntegrationGuardService();
