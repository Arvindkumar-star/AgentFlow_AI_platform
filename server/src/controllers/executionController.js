const executionService = require('../services/executionService');

async function listExecutions(req, res, next) {
  try {
    const { page, limit, status, workflowId } = req.query;
    const result = await executionService.listExecutions(req.user._id, {
      page: Number(page) || 1, limit: Number(limit) || 20, status, workflowId,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function getExecution(req, res, next) {
  try {
    const execution = await executionService.getExecution(req.params.id, req.user._id);
    res.json({ success: true, execution });
  } catch (err) { next(err); }
}

async function getTimeline(req, res, next) {
  try {
    const logs = await executionService.getTimeline(req.params.id, req.user._id);
    res.json({ success: true, logs });
  } catch (err) { next(err); }
}

async function pauseExecution(req, res, next) {
  try {
    await executionService.pauseExecution(req.params.id, req.user._id);
    res.json({ success: true, message: 'Execution paused' });
  } catch (err) { next(err); }
}

async function resumeExecution(req, res, next) {
  try {
    await executionService.resumeExecution(req.params.id, req.user._id);
    res.json({ success: true, message: 'Execution resumed' });
  } catch (err) { next(err); }
}

async function cancelExecution(req, res, next) {
  try {
    await executionService.cancelExecution(req.params.id, req.user._id);
    res.json({ success: true, message: 'Execution cancelled' });
  } catch (err) { next(err); }
}

module.exports = { listExecutions, getExecution, getTimeline, pauseExecution, resumeExecution, cancelExecution };
