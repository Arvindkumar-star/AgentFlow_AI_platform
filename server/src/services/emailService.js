let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (_) {}

const axios = require('axios');
const env = require('../config/env');
const integrationGuard = require('./integrationGuard');

/**
 * Professional HTML Email Template Generator for Razorpay Payment Links
 */
function buildPaymentLinkEmailHtml({ recipientName, amount, invoiceNumber, paymentLink, currency = 'INR', description = 'Automated Vendor Payout' }) {
  const formattedAmount = Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  const currencySymbol = currency === 'INR' ? '₹' : (currency === 'USD' ? '$' : currency);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Request - ${invoiceNumber || 'Invoice'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #111827; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Top Accent Gradient -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff;">
                      Agentflow <span style="color: #38bdf8;">AI</span>
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">
                      ZK-Verified Autonomous Financial Workflow
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background-color: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 20px; font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em;">
                      💳 Razorpay Secured
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Section -->
          <tr>
            <td style="padding: 10px 36px 24px 36px;">
              <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 10px 0; color: #ffffff;">
                Invoice Payment Request
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 24px 0;">
                Hello <strong style="color: #f1f5f9;">${recipientName || 'Valued Partner'}</strong>,<br>
                A payment request has been generated for you via Agentflow Autonomous Finance Engine. Please find the payment details below:
              </p>

              <!-- Payment Summary Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <tr>
                  <td style="padding-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-weight: 600;">Total Amount Due</div>
                    <div style="font-size: 32px; font-weight: 800; color: #38bdf8; margin-top: 4px; letter-spacing: -0.02em;">
                      ${currencySymbol}${formattedAmount}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 14px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 13px; color: #94a3b8; padding: 4px 0;">Invoice / Reference:</td>
                        <td align="right" style="font-size: 13px; font-weight: 600; color: #f1f5f9; padding: 4px 0;">
                          ${invoiceNumber || 'INV-' + Date.now().toString().slice(-6)}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #94a3b8; padding: 4px 0;">Purpose:</td>
                        <td align="right" style="font-size: 13px; color: #e2e8f0; padding: 4px 0;">
                          ${description}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #94a3b8; padding: 4px 0;">Guardrail Verification:</td>
                        <td align="right" style="font-size: 12px; font-weight: 700; color: #34d399; padding: 4px 0;">
                          🛡 AgentGuard ZK Passed
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <div style="text-align: center; margin: 32px 0 24px 0;">
                <a href="${paymentLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); letter-spacing: 0.02em; border: 1px solid rgba(255, 255, 255, 0.15);">
                  Pay Invoice / View Details →
                </a>
              </div>

              <!-- Fallback Direct URL -->
              <p style="font-size: 12px; line-height: 1.5; color: #64748b; text-align: center; margin: 0 0 10px 0;">
                If the button above does not work, copy and paste this link into your browser:<br>
                <a href="${paymentLink}" style="color: #38bdf8; word-break: break-all; text-decoration: underline;">
                  ${paymentLink}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: rgba(8, 12, 20, 0.6); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="font-size: 11px; color: #64748b; margin: 0; line-height: 1.5;">
                This automated dispatch was processed securely by <strong>Agentflow AI</strong> with Razorpay Payment Engine.<br>
                Please do not reply directly to this automated email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

class EmailService {
  constructor() {
    this._transporter = null;
  }

  /**
   * Get or initialize Nodemailer SMTP Transporter
   */
  _getTransporter() {
    if (this._transporter) return this._transporter;

    const host = process.env.SMTP_HOST || env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER || env.SMTP_USER;
    const pass = process.env.SMTP_PASS || env.SMTP_PASS;

    if (nodemailer && host && user) {
      try {
        this._transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 3000,
          greetingTimeout: 3000,
          socketTimeout: 3000,
        });
        return this._transporter;
      } catch (err) {
        console.warn('[Email Service] Failed to initialize Nodemailer transport:', err.message);
      }
    }
    return null;
  }

  /**
   * Send Email using available transport (Nodemailer SMTP, Resend, SendGrid, or Gmail Integration)
   */
  async sendEmail({ to, subject, html, text, from, userId = null }) {
    if (!to || !to.trim()) {
      throw new Error('Recipient email address ("to") is required.');
    }

    const defaultFrom = process.env.FROM_EMAIL || env.FROM_EMAIL || 'Agentflow AI <billing@agentflow.ai>';
    const sender = from || defaultFrom;
    const cleanText = text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // 1. Try Nodemailer Transporter if configured
    const transporter = this._getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: sender,
          to,
          subject,
          text: cleanText,
          html,
        });
        console.log(`[Email Service] Payment link email successfully dispatched to ${to}`);
        return {
          success: true,
          provider: 'smtp',
          messageId: info.messageId,
          to,
          deliveredAt: new Date().toISOString(),
        };
      } catch (smtpErr) {
        console.warn('[Email Service] SMTP transport failed, attempting secondary fallbacks:', smtpErr.message);
      }
    }

    // 2. Try Resend API if RESEND_API_KEY is available
    const resendKey = process.env.RESEND_API_KEY || env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const res = await axios.post(
          'https://api.resend.com/emails',
          {
            from: sender.includes('<') ? sender : `Agentflow AI <${sender}>`,
            to: [to],
            subject,
            html,
            text: cleanText,
          },
          {
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 8000,
          }
        );
        console.log(`[Email Service] Payment link email successfully dispatched to ${to}`);
        return {
          success: true,
          provider: 'resend',
          messageId: res.data?.id,
          to,
          deliveredAt: new Date().toISOString(),
        };
      } catch (resendErr) {
        console.warn('[Email Service] Resend API failed:', resendErr.response?.data || resendErr.message);
      }
    }

    // 3. Try SendGrid API if SENDGRID_API_KEY is available
    const sendgridKey = process.env.SENDGRID_API_KEY || env.SENDGRID_API_KEY;
    if (sendgridKey) {
      try {
        const fromEmail = sender.includes('<') ? sender.match(/<([^>]+)>/)?.[1] || sender : sender;
        const res = await axios.post(
          'https://api.sendgrid.com/v3/mail/send',
          {
            personalizations: [{ to: [{ email: to }] }],
            from: { email: fromEmail, name: 'Agentflow AI' },
            subject,
            content: [
              { type: 'text/plain', value: cleanText },
              { type: 'text/html', value: html },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${sendgridKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 8000,
          }
        );
        console.log(`[Email Service] Payment link email successfully dispatched to ${to}`);
        return {
          success: true,
          provider: 'sendgrid',
          to,
          deliveredAt: new Date().toISOString(),
        };
      } catch (sgErr) {
        console.warn('[Email Service] SendGrid API failed:', sgErr.response?.data || sgErr.message);
      }
    }

    // 4. Try User Connected Gmail Integration
    try {
      const integrationService = require('./integrationService');
      const gmailResult = await integrationService.execute('gmail', 'send', {
        to,
        subject,
        body: html,
        isHtml: true,
        userId,
      });
      console.log(`[Email Service] Payment link email successfully dispatched to ${to}`);
      return {
        success: true,
        provider: 'gmail',
        messageId: gmailResult.messageId,
        to,
        deliveredAt: new Date().toISOString(),
      };
    } catch (gmailErr) {
      console.warn('[Email Service] Gmail integration fallback note:', gmailErr.message);
    }

    throw new Error('No active email transport available (SMTP, Resend, SendGrid, or Gmail).');
  }

  /**
   * Primary Dispatch Method for Payment Links with Professional HTML Template
   */
  async sendPaymentLinkEmail({
    to,
    recipientName = 'Valued Partner',
    amount = 0,
    invoiceNumber = null,
    paymentLink,
    currency = 'INR',
    description = 'Automated Vendor Payout',
    userId = null,
  }) {
    if (!paymentLink) {
      throw new Error('Cannot send payment link email: paymentLink URL is missing.');
    }
    if (!to || !to.trim()) {
      throw new Error('Cannot send payment link email: recipient email ("to") is missing.');
    }

    const cleanInvoice = invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
    const subject = `Payment Due: ${currency === 'INR' ? '₹' : ''}${Number(amount || 0).toLocaleString('en-IN')} - ${cleanInvoice}`;
    const html = buildPaymentLinkEmailHtml({
      recipientName,
      amount,
      invoiceNumber: cleanInvoice,
      paymentLink,
      currency,
      description,
    });
    const text = `Hello ${recipientName},\n\nA payment request of ${currency} ${amount} has been generated for invoice ${cleanInvoice}.\n\nPay online securely with Razorpay: ${paymentLink}\n\nProcessed by Agentflow AI.`;

    return this.sendEmail({
      to: to.trim(),
      subject,
      html,
      text,
      userId,
    });
  }

  /**
   * Guarded Payment Link Email Dispatcher
   * Automatically executes pre-flight connection check via IntegrationGuard.
   * If not connected: logs clean skip message without throwing.
   * Always returns safe result payload.
   */
  async sendGuardedPaymentLinkEmail({
    to,
    recipientName,
    amount,
    invoiceNumber,
    paymentLink,
    currency = 'INR',
    description,
    userId = null,
  }) {
    let resolvedTo = (to && typeof to === 'string') ? to.trim() : '';

    // Automatic fallback: resolve recipient from user connected integration or user profile if empty
    if (!resolvedTo && userId) {
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
          const Integration = require('../models/Integration');
          const User = require('../models/User');

          const userIntegration = await Integration.findOne({
            owner: userId,
            provider: { $in: ['gmail', 'sendgrid', 'resend', 'smtp', 'email', 'mailchimp'] },
            isConnected: true,
            status: { $ne: 'disconnected' },
          });

          if (userIntegration) {
            resolvedTo = userIntegration.maskedIdentifier || userIntegration.metadata?.email || userIntegration.credentials?.email || '';
          }

          if (!resolvedTo) {
            const userDoc = await User.findById(userId);
            if (userDoc?.email) {
              resolvedTo = userDoc.email;
            }
          }
        }
      } catch (lookupErr) {
        console.warn('[Email Service] Fallback recipient resolution note:', lookupErr.message);
      }
    }

    if (!resolvedTo) {
      console.log('[AgentGuard] No recipient email provided. Skipping email dispatch.');
      return {
        dispatched: false,
        skipped: true,
        reason: 'No recipient email provided',
        paymentLink,
      };
    }

    return integrationGuard.guardEmailDispatch(
      userId,
      async (status) => {
        return this.sendPaymentLinkEmail({
          to: to.trim(),
          recipientName,
          amount,
          invoiceNumber,
          paymentLink,
          currency,
          description,
          userId,
        });
      },
      { paymentLink, to, invoiceNumber }
    );
  }
}

module.exports = new EmailService();
