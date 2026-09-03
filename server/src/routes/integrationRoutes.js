const express = require('express');
const { protect } = require('../middleware/auth');
const ic = require('../controllers/integrationController');

const router = express.Router();

// Public — tells frontend which OAuth providers are configured
router.get('/config', ic.getConfig);

// OAuth callbacks don't have Bearer token — they come from the browser redirect
router.get('/status', protect, ic.getStatus);
router.get('/', protect, ic.listIntegrations);
router.post('/', protect, ic.saveCredential);

// OAuth flows
router.get('/oauth/:provider/start', protect, ic.oauthStart);
router.get('/oauth/:provider/callback', ic.oauthCallback); // No protect — browser redirect
router.get('/oauth/error', ic.oauthError);

module.exports = router;
