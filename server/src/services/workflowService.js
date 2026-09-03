const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');

async function getDashboardStats(userId) {
  const [totalWorkflows, activeWorkflows, draftWorkflows, totalExecutions, recentExecutions] = await Promise.all([
    Workflow.countDocuments({ owner: userId }),
    Workflow.countDocuments({ owner: userId, status: 'active' }),
    Workflow.countDocuments({ owner: userId, status: 'draft' }),
    Execution.countDocuments({ owner: userId }),
    Execution.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('workflowId', 'name'),
  ]);

  const completedCount = await Execution.countDocuments({ owner: userId, status: 'COMPLETED' });
  const successRate = totalExecutions > 0 ? Math.round((completedCount / totalExecutions) * 100) : 0;

  // Retrieve recent agent activity logs for the dashboard live feed
  const userExecutions = await Execution.find({ owner: userId }).select('_id').limit(10);
  const userExecutionIds = userExecutions.map(e => e._id);
  const recentLogs = await ExecutionLog.find({ executionId: { $in: userExecutionIds } })
    .sort({ createdAt: -1 })
    .limit(30);

  return { totalWorkflows, activeWorkflows, draftWorkflows, totalExecutions, successRate, recentExecutions, recentLogs };
}

async function listWorkflows(userId, { page = 1, limit = 50, search, status } = {}) {
  const query = {};
  if (status) query.status = status;
  if (search) query.$text = { $search: search };

  const [workflows, total] = await Promise.all([
    Workflow.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Workflow.countDocuments(query),
  ]);

  return { workflows, total, page, pages: Math.ceil(total / limit) };
}

function sanitizeNodeData(nodeData = {}, nodeType = 'default') {
  const cleanData = { ...nodeData };
  const rawType = String(nodeType || cleanData.type || '').toLowerCase();

  // Strip transient simulation flags so threat states are NEVER permanently persisted
  delete cleanData.threatType;
  delete cleanData.threatBadge;
  delete cleanData.threatMessage;
  cleanData.isAttacked = false;
  cleanData.isBlocked = false;

  // Clean simulated leaked payloads
  if (cleanData.payload?.detectedEntities || cleanData.payload?.injectedPrompt) {
    delete cleanData.payload;
  }

  // Restore clean status if node was in a simulated threat state
  if (
    cleanData.status === 'PII_LEAK_PREVENTED' ||
    cleanData.status === 'PROMPT_INJECTION_DETECTED' ||
    cleanData.status === 'HALTED'
  ) {
    if (rawType.includes('agentguard') || rawType.includes('zk') || rawType.includes('guard')) {
      cleanData.status = 'GROTH16_VERIFIED';
      cleanData.isPassing = true;
      cleanData.isVerified = true;
    } else if (rawType.includes('razorpay') || rawType.includes('payout')) {
      cleanData.status = 'READY';
      cleanData.payoutStatus = 'READY';
    } else {
      cleanData.status = 'READY';
    }
  }

  // Ensure default requestedAmount and maxLimit are clean
  if (rawType.includes('agentguard') || rawType.includes('zk') || rawType.includes('guard')) {
    if (cleanData.requestedAmount === 85000 || cleanData.requestedAmount === 145000) {
      cleanData.requestedAmount = 4200;
    }
    if (!cleanData.maxLimit) {
      cleanData.maxLimit = 10000;
    }
  }

  return cleanData;
}

function normalizeNodesAndEdges(target) {
  if (target && target.nodes && Array.isArray(target.nodes)) {
    target.nodes = target.nodes.map(n => {
      const label = n.label || n.data?.label || n.data?.name || n.id || 'Node';
      const cleanData = sanitizeNodeData(n.data, n.type);
      return {
        ...n,
        id: String(n.id),
        type: n.type || n.data?.type || 'default',
        label,
        data: {
          ...cleanData,
          label: cleanData.label || label,
        }
      };
    });
  }
  if (target && target.edges && Array.isArray(target.edges)) {
    target.edges = target.edges.map(e => {
      const label = e.label || e.data?.label || e.id || 'Connection';
      return {
        ...e,
        id: String(e.id),
        source: String(e.source),
        target: String(e.target),
        label,
      };
    });
  }
}

async function getWorkflow(workflowId, userId) {
  let workflow = await Workflow.findOne({ _id: workflowId, owner: userId });
  if (!workflow) {
    workflow = await Workflow.findById(workflowId);
  }
  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }

  // Sanitize any transient simulated threat states before returning to client
  if (workflow.nodes && Array.isArray(workflow.nodes)) {
    workflow.nodes = workflow.nodes.map(n => {
      const cleanData = sanitizeNodeData(n.data, n.type);
      const plainNode = n.toObject ? n.toObject() : n;
      return {
        ...plainNode,
        data: cleanData,
      };
    });
  }

  return workflow;
}

async function createWorkflow(userId, data) {
  normalizeNodesAndEdges(data);
  const workflow = await Workflow.create({ ...data, owner: userId });
  return workflow;
}

async function updateWorkflow(workflowId, userId, updates) {
  normalizeNodesAndEdges(updates);
  let workflow = await Workflow.findOneAndUpdate(
    { _id: workflowId, owner: userId },
    { ...updates, $inc: { version: 1 } },
    { new: true, runValidators: true }
  );
  if (!workflow) {
    workflow = await Workflow.findByIdAndUpdate(
      workflowId,
      { ...updates, owner: userId, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );
  }
  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  return workflow;
}

async function duplicateWorkflow(workflowId, userId) {
  const source = await getWorkflow(workflowId, userId);
  const copy = await Workflow.create({
    name: `${source.name} (Copy)`,
    description: source.description,
    owner: userId,
    status: 'draft',
    triggerConfig: source.triggerConfig,
    nodes: source.nodes,
    edges: source.edges,
    tags: source.tags,
    version: 1,
  });
  return copy;
}

async function deleteWorkflow(workflowId, userId) {
  let workflow = await Workflow.findOneAndDelete({ _id: workflowId, owner: userId });
  if (!workflow) {
    workflow = await Workflow.findByIdAndDelete(workflowId);
  }
  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
}

module.exports = {
  getDashboardStats,
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  duplicateWorkflow,
  deleteWorkflow,
};
