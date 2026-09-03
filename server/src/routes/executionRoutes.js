const express = require('express');
const { protect } = require('../middleware/auth');
const ec = require('../controllers/executionController');

const router = express.Router();
router.use(protect);

router.get('/', ec.listExecutions);
router.get('/:id', ec.getExecution);
router.get('/:id/timeline', ec.getTimeline);
router.post('/:id/pause', ec.pauseExecution);
router.post('/:id/resume', ec.resumeExecution);
router.post('/:id/cancel', ec.cancelExecution);

module.exports = router;
