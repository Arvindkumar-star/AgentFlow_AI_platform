const express = require('express');
const { protect } = require('../middleware/auth');
const ic = require('../controllers/integrationController');

const router = express.Router();

// Public / Config
router.get('/config', ic.getConfig);

// Status & List
router.get('/status', protect, ic.getStatus);
router.get('/', protect, ic.listIntegrations);

// BYOK & Quick Connect Endpoints
router.post('/:provider/byok', protect, ic.saveBYOK);
router.post('/:provider/quick-connect', protect, ic.quickConnect);
router.delete('/:provider/byok', protect, ic.deleteBYOK);
router.post('/:provider/test', protect, ic.testConnection);

// OAuth flows
router.get('/oauth/:provider/start', protect, ic.oauthStart);
router.get('/oauth/:provider/callback', ic.oauthCallback); // Browser redirect
router.get('/oauth/error', ic.oauthError);

module.exports = router;
