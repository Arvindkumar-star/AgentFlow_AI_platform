const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const wc = require('../controllers/workflowController');

const router = express.Router();

router.use(protect);

router.get('/dashboard', wc.getDashboard);
router.get('/', wc.listWorkflows);
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Workflow name is required')],
  validate,
  wc.createWorkflow
);
router.post(
  '/generate',
  [body('prompt').trim().notEmpty().withMessage('Prompt is required')],
  validate,
  wc.generateWorkflow
);
router.get('/:id', wc.getWorkflow);
router.put('/:id', wc.updateWorkflow);
router.post('/:id/duplicate', wc.duplicateWorkflow);
router.post('/:id/execute', wc.executeWorkflow);
router.delete('/:id', wc.deleteWorkflow);

module.exports = router;
