const integrationService = require('../services/integrationService');
const env = require('../config/env');

async function listIntegrations(req, res, next) {
  try {
    const integrations = await integrationService.listIntegrations(req.user._id);
    res.json({ success: true, integrations });
  } catch (err) { next(err); }
}

async function getStatus(req, res, next) {
  try {
    const status = await integrationService.getStatus(req.user._id);
    res.json({ success: true, status });
  } catch (err) { next(err); }
}

async function oauthStart(req, res, next) {
  try {
    const { provider } = req.params;
    let clientOrigin = env.CLIENT_URL;
    if (req.query.origin) {
      clientOrigin = req.query.origin;
    } else if (req.headers.referer) {
      try { clientOrigin = new URL(req.headers.referer).origin; } catch (_) {}
    }

    // Encode userId + provider + clientOrigin into the state param (base64 JSON)
    const state = Buffer.from(JSON.stringify({
      userId: req.user._id.toString(),
      provider,
      clientOrigin,
    })).toString('base64');

    const url = await integrationService.getOAuthUrl(provider, req.user._id, state);
    res.redirect(url);
  } catch (err) {
    const msg = err.message || 'OAuth configuration missing';
    const hint = `To enable ${req.params.provider} OAuth, add the required credentials to your server .env file.`;
    res.redirect(`${env.CLIENT_URL}/integrations?error=${encodeURIComponent(msg)}&hint=${encodeURIComponent(hint)}`);
  }
}

async function oauthCallback(req, res, next) {
  let targetOrigin = env.CLIENT_URL;
  try {
    const { provider } = req.params;
    const { code, error, state } = req.query;

    // Decode userId & clientOrigin from state param
    let userId = null;
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
        userId = decoded.userId;
        if (decoded.clientOrigin) targetOrigin = decoded.clientOrigin;
      } catch (_) {}
    }

    if (error) {
      return res.redirect(`${targetOrigin}/integrations?error=${encodeURIComponent(error)}`);
    }

    if (!userId) {
      console.error('OAuth callback: missing or invalid state param');
      return res.redirect(`${targetOrigin}/integrations?error=not_authenticated`);
    }

    await integrationService.handleOAuthCallback(provider, code, userId);
    res.redirect(`${targetOrigin}/integrations?connected=${provider}`);
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.redirect(`${targetOrigin}/integrations?error=${encodeURIComponent(err.message)}`);
  }
}

async function oauthError(req, res) {
  const { error } = req.query;
  res.redirect(`${env.CLIENT_URL}/integrations?error=${encodeURIComponent(error || 'OAuth failed')}`);
}

async function getConfig(req, res) {
  res.json({
    success: true,
    configured: {
      gmail:           !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      'google-sheets': !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      slack:           !!(env.SLACK_CLIENT_ID && env.SLACK_CLIENT_SECRET),
      discord:         !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET),
      linkedin:        !!(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET),
      razorpay:        !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    },
  });
}

async function saveCredential(req, res, next) {
  try {
    const { provider, accessToken, refreshToken, metadata } = req.body;
    await integrationService.saveCredential(req.user._id, provider, { accessToken, refreshToken, metadata });
    res.json({ success: true, message: `${provider} credential saved` });
  } catch (err) { next(err); }
}

module.exports = { listIntegrations, getStatus, getConfig, oauthStart, oauthCallback, oauthError, saveCredential };
