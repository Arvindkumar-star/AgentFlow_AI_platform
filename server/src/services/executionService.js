const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const Notification = require('../models/Notification');
const { orchestrate } = require('../agents/orchestrator');
const integrationService = require('./integrationService');
const { emitExecutionStatus } = require('../config/socket');

// In-memory status store for pause/cancel signals
const executionSignals = new Map();

async function startExecution(workflowId, userId, inputs = {}) {
  let workflow = await Workflow.findOne({ _id: workflowId, owner: userId });
  if (!workflow) {
    workflow = await Workflow.findById(workflowId);
  }
  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }

  const execution = await Execution.create({
    workflowId,
    workflowSnapshot: workflow.toObject(),
    owner: userId,
    status: 'PENDING',
    inputs,
    startTime: new Date(),
  });

  // Run in background (no await)
  runExecution(execution, workflow, userId, inputs).catch((err) => {
    console.error('Background execution error:', err.message);
  });

  return execution;
}

async function runExecution(execution, workflow, userId, inputs) {
  const execId = execution._id.toString();
  executionSignals.set(execId, 'RUNNING');

  try {
    await Execution.findByIdAndUpdate(execId, { status: 'RUNNING', startTime: new Date() });
    emitExecutionStatus(execId, 'RUNNING');

    const onStatusUpdate = async (command) => {
      if (command === 'CHECK_STATUS') return executionSignals.get(execId) || 'RUNNING';
      return null;
    };

    const result = await orchestrate({
      workflow,
      executionId: execution._id,
      userId,
      inputs,
      integrationService,
      onStatusUpdate,
    });

    const endTime = new Date();
    const duration = endTime - execution.startTime;

    const finalStatus = result.status || 'COMPLETED';
    await Execution.findByIdAndUpdate(execId, {
      status: finalStatus,
      endTime,
      duration,
      outputs: result.results,
    });

    emitExecutionStatus(execId, finalStatus, { duration, outputs: result.results });
    executionSignals.delete(execId);

    // Create success notification
    await Notification.create({
      owner: userId,
      workflowId: workflow._id,
      executionId: execution._id,
      type: finalStatus === 'COMPLETED' ? 'success' : 'failure',
      title: `Workflow ${finalStatus === 'COMPLETED' ? 'Completed' : 'Failed'}`,
      message: `"${workflow.name}" ${finalStatus === 'COMPLETED' ? 'ran successfully' : 'failed'}.`,
    });

  } catch (err) {
    await Execution.findByIdAndUpdate(execId, {
      status: 'FAILED',
      endTime: new Date(),
      error: err.message,
    });
    emitExecutionStatus(execId, 'FAILED', { error: err.message });
    executionSignals.delete(execId);

    await Notification.create({
      owner: userId,
      workflowId: workflow._id,
      executionId: execution._id,
      type: 'failure',
      title: 'Workflow Failed',
      message: `"${workflow.name}" failed: ${err.message}`,
    });
  }
}

async function listExecutions(userId, { page = 1, limit = 50, status, workflowId } = {}) {
  const query = {};
  if (status) query.status = status;
  if (workflowId) query.workflowId = workflowId;

  const [executions, total] = await Promise.all([
    Execution.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('workflowId', 'name'),
    Execution.countDocuments(query),
  ]);

  return { executions, total, page, pages: Math.ceil(total / limit) };
}

async function getExecution(executionId, userId) {
  let execution = await Execution.findOne({ _id: executionId, owner: userId }).populate('workflowId', 'name');
  if (!execution) {
    execution = await Execution.findById(executionId).populate('workflowId', 'name');
  }
  if (!execution) {
    const err = new Error('Execution not found');
    err.statusCode = 404;
    throw err;
  }
  return execution;
}

async function getTimeline(executionId, userId) {
  const execution = await getExecution(executionId, userId);
  const logs = await ExecutionLog.find({ executionId: execution._id }).sort({ createdAt: 1 });
  return logs;
}

async function pauseExecution(executionId, userId) {
  const execution = await getExecution(executionId, userId);
  if (execution.status !== 'RUNNING') {
    return { success: false, status: execution.status, message: `Execution cannot be paused (current status: ${execution.status})` };
  }
  executionSignals.set(executionId, 'PAUSED');
  await Execution.findByIdAndUpdate(executionId, { status: 'PAUSED' });
  emitExecutionStatus(executionId, 'PAUSED');
  return { success: true, status: 'PAUSED' };
}

async function resumeExecution(executionId, userId) {
  const execution = await getExecution(executionId, userId);
  if (execution.status !== 'PAUSED') {
    return { success: false, status: execution.status, message: `Execution cannot be resumed (current status: ${execution.status})` };
  }
  executionSignals.set(executionId, 'RUNNING');
  await Execution.findByIdAndUpdate(executionId, { status: 'RUNNING' });
  emitExecutionStatus(executionId, 'RUNNING');
  return { success: true, status: 'RUNNING' };
}

async function cancelExecution(executionId, userId) {
  const execution = await getExecution(executionId, userId);
  if (!['RUNNING', 'PAUSED', 'RETRYING'].includes(execution.status)) {
    return { success: false, status: execution.status, message: `Execution is already finished (current status: ${execution.status})` };
  }
  executionSignals.set(executionId, 'CANCELLED');
  await Execution.findByIdAndUpdate(executionId, { status: 'CANCELLED', endTime: new Date() });
  emitExecutionStatus(executionId, 'CANCELLED');
  return { success: true, status: 'CANCELLED' };
}

module.exports = {
  startExecution, listExecutions, getExecution,
  getTimeline, pauseExecution, resumeExecution, cancelExecution,
};
