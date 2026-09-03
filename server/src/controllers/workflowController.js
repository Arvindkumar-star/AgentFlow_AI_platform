const workflowService = require('../services/workflowService');
const aiService = require('../services/aiService');
const executionService = require('../services/executionService');

async function getDashboard(req, res, next) {
  try {
    const stats = await workflowService.getDashboardStats(req.user._id);
    res.json({ success: true, ...stats });
  } catch (err) { next(err); }
}

async function listWorkflows(req, res, next) {
  try {
    const { page, limit, search, status } = req.query;
    const result = await workflowService.listWorkflows(req.user._id, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
      status,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function getWorkflow(req, res, next) {
  try {
    const workflow = await workflowService.getWorkflow(req.params.id, req.user._id);
    res.json({ success: true, workflow });
  } catch (err) { next(err); }
}

async function createWorkflow(req, res, next) {
  try {
    const workflow = await workflowService.createWorkflow(req.user._id, req.body);
    res.status(201).json({ success: true, workflow });
  } catch (err) { next(err); }
}

async function generateWorkflow(req, res, next) {
  try {
    const { prompt } = req.body;
    const generated = await aiService.generateWorkflow(prompt);
    // Auto-save the generated workflow
    const workflow = await workflowService.createWorkflow(req.user._id, {
      name: generated.name || 'AI Generated Workflow',
      description: generated.description || prompt,
      nodes: generated.nodes,
      edges: generated.edges,
      generatedFrom: prompt,
      status: 'draft',
    });
    res.status(201).json({ success: true, workflow, provider: generated.provider });
  } catch (err) { next(err); }
}

async function updateWorkflow(req, res, next) {
  try {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.user._id, req.body);
    res.json({ success: true, workflow });
  } catch (err) { next(err); }
}

async function duplicateWorkflow(req, res, next) {
  try {
    const workflow = await workflowService.duplicateWorkflow(req.params.id, req.user._id);
    res.status(201).json({ success: true, workflow });
  } catch (err) { next(err); }
}

async function executeWorkflow(req, res, next) {
  try {
    const execution = await executionService.startExecution(req.params.id, req.user._id, req.body?.inputs || {});
    res.status(202).json({ success: true, execution });
  } catch (err) { next(err); }
}

async function deleteWorkflow(req, res, next) {
  try {
    await workflowService.deleteWorkflow(req.params.id, req.user._id);
    res.json({ success: true, message: 'Workflow deleted' });
  } catch (err) { next(err); }
}

module.exports = {
  getDashboard, listWorkflows, getWorkflow, createWorkflow,
  generateWorkflow, updateWorkflow, duplicateWorkflow, executeWorkflow, deleteWorkflow,
};
