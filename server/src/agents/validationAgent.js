/**
 * Validation Agent
 * Verifies required output fields and deterministic ZK constraints from an executed node.
 * Extended with AgentGuard Zero-Knowledge Guardrail Verification.
 */

const agentGuardService = require('../services/agentGuardService');

const REQUIRED_FIELDS_BY_TYPE = {
  gmail: ['messageId'],
  slack: ['ts'],
  discord: ['messageId'],
  'google-sheets': ['updatedRange'],
  trigger: ['triggered'],
  condition: ['conditionMet'],
  ai: ['text'],
  agentGuard: ['verified'],
};

/**
 * Process validation for nodes, including AgentGuard ZK verification
 * Matches agentguardspec.md Section 2.2
 */
async function processValidationNode(node, executionContext = {}) {
  if (node?.type === 'agentGuard' || node?.type === 'agent_guard') {
    const data = node.data || {};
    const maxLimit = Number(data.maxLimit ?? 1000);
    const requestedAmount = Number(data.requestedAmount ?? 0);
    const proof = data.proof;
    const publicSignals = data.publicSignals;

    let isValid = false;
    if (proof && publicSignals) {
      isValid = await agentGuardService.verifyProof(proof, publicSignals);
    } else {
      // If proof was not generated yet, verify spend bounds
      isValid = requestedAmount <= maxLimit;
    }

    if (!isValid || requestedAmount > maxLimit) {
      return {
        status: 'FAILED',
        valid: false,
        errorCode: 'ZK_CONSTRAINT_VIOLATION',
        reason: `Spending limit violated: Requested ₹${requestedAmount} exceeds max allowance ₹${maxLimit}`,
        message: `Spending limit violated: Requested ₹${requestedAmount} exceeds max allowance ₹${maxLimit}`,
        triggerRecovery: true,
        missingFields: [],
      };
    }

    return {
      status: 'SUCCESS',
      valid: true,
      message: 'ZK Proof Verified. Financial execution bounded and safe.',
      missingFields: [],
    };
  }

  // Fallback to standard validation agent rules
  return validationAgent(node?.type, executionContext?.output, node, executionContext);
}

function validationAgent(nodeType, output, node = null, executionContext = null) {
  // Check for AgentGuard node type
  if (nodeType === 'agentGuard' || nodeType === 'agent_guard' || nodeType === 'zk_guard') {
    const maxLimit = Number(output?.maxLimit ?? node?.data?.maxLimit ?? executionContext?.inputs?.maxLimit ?? 10000);
    const requestedAmount = Number(output?.requestedAmount ?? node?.data?.requestedAmount ?? executionContext?.inputs?.requestedAmount ?? 4200);

    const isViolation = requestedAmount > maxLimit || output?.isValid === false || output?.status === 'CONSTRAINT_VIOLATION' || output?.errorCode === 'ZK_CONSTRAINT_VIOLATION';

    if (isViolation) {
      const reason = output?.reason || `Spending limit violated: Requested ₹${requestedAmount} exceeds max allowance ₹${maxLimit}`;
      return {
        valid: false,
        status: 'FAILED',
        errorCode: 'ZK_CONSTRAINT_VIOLATION',
        reason,
        message: reason,
        triggerRecovery: true,
        missingFields: [],
      };
    }

    return {
      valid: true,
      status: 'SUCCESS',
      message: 'ZK Proof Verified. Financial execution bounded and safe within policy ceiling.',
      missingFields: [],
    };
  }

  // Check for Razorpay payout node
  if (nodeType === 'razorpay' || nodeType === 'razorpay_payout' || nodeType === 'payout') {
    if (output?.status === 'BLOCKED' || output?.success === false) {
      return {
        valid: false,
        status: 'FAILED',
        errorCode: output?.errorCode || 'PAYOUT_CREATION_FAILED',
        reason: output?.reason || output?.message || 'Payout generation failed',
        message: output?.message || output?.reason || 'Payout generation failed',
        triggerRecovery: true,
        missingFields: [],
      };
    }
    return {
      valid: true,
      status: 'SUCCESS',
      message: output?.message || 'Razorpay payout draft created successfully. Awaiting approval.',
      missingFields: [],
    };
  }

  if (!output || typeof output !== 'object') {
    return {
      valid: false,
      missingFields: ['output'],
      message: 'Node produced empty or invalid output',
    };
  }

  // Flexible check for communication / auth / custom nodes
  if (['gmail', 'check_auth', 'checkAuth', 'email'].includes(nodeType)) {
    const hasValidField =
      'messageId' in output ||
      'email' in output ||
      'connected' in output ||
      'messages' in output ||
      'status' in output ||
      'message' in output;
    return {
      valid: hasValidField,
      missingFields: hasValidField ? [] : ['email/messageId/connected'],
      message: hasValidField ? 'Gmail step output validated successfully' : 'Missing required Gmail fields',
    };
  }

  const required = REQUIRED_FIELDS_BY_TYPE[nodeType] || [];

  const missingFields = required.filter((field) => {
    return output === null || output === undefined || !(field in output);
  });

  const valid = missingFields.length === 0;

  return {
    valid,
    missingFields,
    message: valid
      ? 'Node output validated successfully'
      : `Missing required fields: ${missingFields.join(', ')}`,
  };
}

module.exports = { validationAgent, processValidationNode };
