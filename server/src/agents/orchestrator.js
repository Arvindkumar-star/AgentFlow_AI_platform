/**
 * Orchestrator
 * Chains all agents: Planner → Execution → Validation → Recovery → Monitoring
 * Reports whether LangGraph is available.
 */

const { plannerAgent } = require('./plannerAgent');
const { executionAgent } = require('./executionAgent');
const { validationAgent } = require('./validationAgent');
const { recoveryAgent, DECISIONS } = require('./recoveryAgent');
const { monitoringAgent } = require('./monitoringAgent');
const ExecutionLog = require('../models/ExecutionLog');
const { emitAgentEvent } = require('../config/socket');

// Check LangGraph availability
let langGraphStatus = 'not-installed';
try {
  require('@langchain/langgraph');
  langGraphStatus = 'available';
} catch (_) {
  langGraphStatus = 'not-installed';
}

/**
 * Main orchestration function.
 * @param {object} workflow      - Workflow document (nodes, edges)
 * @param {string} executionId   - Execution document ID
 * @param {string} userId        - Owner user ID
 * @param {object} inputs        - Runtime inputs
 * @param {object} integrationService - DI
 * @param {function} onStatusUpdate   - Called when execution status changes
 */
async function orchestrate({ workflow, executionId, userId, inputs = {}, integrationService, onStatusUpdate }) {
  const workflowId = workflow._id || workflow.id;

  const persistLog = async (logEntry) => {
    try {
      await ExecutionLog.create(logEntry);
    } catch (_) {}
  };

  const emit = (eid, event) => {
    try { emitAgentEvent(eid, event); } catch (_) {}
  };

  const log = (agent, level, message, nodeId, metadata) =>
    monitoringAgent({ executionId, workflowId, nodeId, agent, level, message, metadata, persistLog, emit });

  // Convert Mongoose doc to clean plain object so subdocuments don't lose getters/properties
  const cleanWorkflow = workflow?.toObject ? workflow.toObject() : JSON.parse(JSON.stringify(workflow));

  // ─── PLANNER ──────────────────────────────────────────────────
  await log('planner', 'info', 'Planning execution order...');
  let plan;
  try {
    const result = plannerAgent(cleanWorkflow);
    plan = result.plan;
    await log('planner', 'success', `Plan ready: ${plan.length} steps (confidence: ${result.confidenceScore.toFixed(2)})`, null, { plan: plan.map((p) => p.nodeId), confidenceScore: result.confidenceScore });
  } catch (err) {
    await log('planner', 'error', `Planning failed: ${err.message}`);
    throw err;
  }

  const context = { userId, inputs, outputs: {} };
  const results = [];

  // ── Template variable resolver ─────────────────────────────────
  // Replaces {{nodeId.field}}, {{previousOutput.field}}, {{step.field}}
  // in any string value within a node's data object.
  const resolveTemplates = (data, previousOutput) => {
    if (!data || typeof data !== 'object') return data;
    const resolved = {};
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'string') {
        resolved[key] = val.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
          const parts = path.trim().split('.');
          // {{previousOutput.field}} or {{prev.field}}
          if (parts[0] === 'previousOutput' || parts[0] === 'prev') {
            return parts.slice(1).reduce((o, k) => o?.[k], previousOutput) ?? match;
          }
          // {{nodeId.field}}
          const [nid, ...rest] = parts;
          return rest.reduce((o, k) => o?.[k], context.outputs[nid]) ?? match;
        });
      } else {
        resolved[key] = val;
      }
    }
    return resolved;
  };

  // ─── NODE LOOP ────────────────────────────────────────────────
  for (const step of plan) {
    const rawNode = step.node?.toObject ? step.node.toObject() : step.node;
    const nodeId = String(step.nodeId || rawNode?.id || '');
    const nodeObj = {
      ...(rawNode || {}),
      id: nodeId,
      type: rawNode?.type || rawNode?.data?.type || 'default',
      label: rawNode?.label || rawNode?.data?.label || `Step ${step.step}`,
      data: { ...(rawNode?.data || {}) },
    };
    const stepNum = step.step;

    let retryCount = 0;
    const maxRetries = 3;
    let stepDone = false;

    // Previous node output (last completed step)
    const lastOutput = results.length > 0 ? results[results.length - 1].output : null;

    while (!stepDone) {
      // Check pause/cancel signal
      if (onStatusUpdate) {
        const currentStatus = await onStatusUpdate('CHECK_STATUS');
        if (currentStatus === 'PAUSED') {
          await log('monitoring', 'warning', `Execution paused at node: ${nodeObj.label}`, nodeId);
          // Wait until resumed
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        if (currentStatus === 'CANCELLED') {
          await log('monitoring', 'warning', 'Execution cancelled by user', nodeId);
          return { results, status: 'CANCELLED', langGraph: langGraphStatus };
        }
      }

      await log('execution', 'info', `Executing step ${stepNum}/${plan.length}: ${nodeObj.label}`, nodeId);

      try {
        // ─── Inject previous output + resolve templates ────────
        // Merge previous node output into this node's data so integrations
        // can access upstream results (e.g. Slack gets YouTube video URL).
        const enrichedData = {
          ...(lastOutput && typeof lastOutput === 'object' ? lastOutput : {}),
          ...(nodeObj.data || {}),
          _previousOutput: lastOutput,
        };
        const enrichedNode = {
          ...nodeObj,
          data: resolveTemplates(enrichedData, lastOutput),
        };

        // ─── EXECUTION AGENT ──────────────────────────────────
        const execResult = await executionAgent(enrichedNode, context, integrationService);
        context.outputs[nodeId] = execResult.output;

        // ─── VALIDATION AGENT ─────────────────────────────────
        await log('validation', 'info', `Validating output of ${nodeObj.label}`, nodeId);
        const validation = validationAgent(nodeObj.type, execResult.output, nodeObj, context);

        if (!validation.valid) {
          await log('validation', 'warning', validation.message, nodeId, {
            missingFields: validation.missingFields,
            errorCode: validation.errorCode,
          });

          // If a deterministic constraint fails with triggerRecovery (e.g. ZK Guardrail), escalate via recoveryAgent
          if (validation.triggerRecovery) {
            const err = new Error(validation.reason || validation.message);
            err.code = validation.errorCode || 'ZK_CONSTRAINT_VIOLATION';
            throw err;
          }
        } else {
          await log('validation', 'success', validation.message, nodeId);
        }

        results.push({
          nodeId,
          label: nodeObj.label,
          type: nodeObj.type,
          output: execResult.output,
          validation,
        });
        await log('execution', 'success', `Step ${stepNum} completed: ${nodeObj.label}`, nodeId, { output: execResult.output });
        stepDone = true;

      } catch (err) {
        // ─── RECOVERY AGENT ───────────────────────────────────
        const recovery = recoveryAgent(err, retryCount, maxRetries);
        await log('recovery', 'warning', recovery.message, nodeId, { failureType: recovery.failureType, retryCount, error: err.message });

        if (recovery.decision === DECISIONS.RETRY_WITH_BACKOFF) {
          retryCount++;
          await log('recovery', 'info', `Retrying in ${recovery.backoffMs}ms (attempt ${retryCount}/${maxRetries})`, nodeId);
          await new Promise((r) => setTimeout(r, recovery.backoffMs));
        } else {
          // Escalate — fail this node and continue
          results.push({ nodeId, label: nodeObj.label, type: nodeObj.type, output: null, error: err.message, failureType: recovery.failureType });
          await log('recovery', 'error', `Escalating: ${nodeObj.label} failed after ${retryCount} retries`, nodeId);
          stepDone = true;
        }
      }
    }
  }

  await log('monitoring', 'success', 'All steps completed', null, { totalSteps: plan.length });

  return { results, status: 'COMPLETED', langGraph: langGraphStatus };
}

module.exports = { orchestrate, langGraphStatus };
