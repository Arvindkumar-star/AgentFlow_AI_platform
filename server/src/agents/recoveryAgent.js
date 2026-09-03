/**
 * Recovery Agent
 * Classifies failures and decides whether to retry or escalate.
 * Pure — no HTTP, no Mongo.
 */

const FAILURE_TYPES = {
  MISSING_FIELDS: 'MISSING_FIELDS',
  API_FAILURE: 'API_FAILURE',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  RATE_LIMIT: 'RATE_LIMIT',
  TRANSIENT: 'TRANSIENT',
  INTEGRATION_NOT_CONNECTED: 'INTEGRATION_NOT_CONNECTED',
  ZK_CONSTRAINT_VIOLATION: 'ZK_CONSTRAINT_VIOLATION',
  HITL_USER_REJECTED: 'HITL_USER_REJECTED',
  UNKNOWN: 'UNKNOWN',
};

const DECISIONS = {
  RETRY_WITH_BACKOFF: 'retry_with_backoff',
  ESCALATE: 'escalate',
  SKIP: 'skip',
};

function classifyError(error) {
  const msg = (error?.message || '').toLowerCase();
  const code = error?.code || error?.errorCode || '';

  if (code === 'HITL_USER_REJECTED' || msg.includes('hitl_user_rejected') || msg.includes('rejected by human operator')) {
    return FAILURE_TYPES.HITL_USER_REJECTED;
  }
  if (
    code === 'ZK_CONSTRAINT_VIOLATION' ||
    msg.includes('zk_constraint_violation') ||
    msg.includes('spending limit violated') ||
    msg.includes('zk proof rejected') ||
    msg.includes('zk verification failed')
  ) {
    return FAILURE_TYPES.ZK_CONSTRAINT_VIOLATION;
  }
  if (code === 'INTEGRATION_NOT_CONNECTED' || msg.includes('not connected') || msg.includes('integration_not_connected')) {
    return FAILURE_TYPES.INTEGRATION_NOT_CONNECTED;
  }
  if (msg.includes('auth') || msg.includes('401') || msg.includes('token expired') || msg.includes('unauthorized')) {
    return FAILURE_TYPES.AUTH_EXPIRED;
  }
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
    return FAILURE_TYPES.RATE_LIMIT;
  }
  if (msg.includes('timeout') || msg.includes('econnreset') || msg.includes('network') || msg.includes('enotfound')) {
    return FAILURE_TYPES.TRANSIENT;
  }
  if (msg.includes('missing') || msg.includes('required field')) {
    return FAILURE_TYPES.MISSING_FIELDS;
  }
  if (msg.includes('api') || msg.includes('500') || msg.includes('503')) {
    return FAILURE_TYPES.API_FAILURE;
  }
  return FAILURE_TYPES.UNKNOWN;
}

function recoveryAgent(error, retryCount = 0, maxRetries = 3) {
  const failureType = classifyError(error);
  let decision;
  let backoffMs = 0;

  switch (failureType) {
    case FAILURE_TYPES.TRANSIENT:
    case FAILURE_TYPES.API_FAILURE:
      if (retryCount < maxRetries) {
        decision = DECISIONS.RETRY_WITH_BACKOFF;
        backoffMs = Math.pow(2, retryCount) * 1000; // exponential: 1s, 2s, 4s
      } else {
        decision = DECISIONS.ESCALATE;
      }
      break;

    case FAILURE_TYPES.RATE_LIMIT:
      if (retryCount < maxRetries) {
        decision = DECISIONS.RETRY_WITH_BACKOFF;
        backoffMs = 30000; // 30s for rate limits
      } else {
        decision = DECISIONS.ESCALATE;
      }
      break;

    case FAILURE_TYPES.AUTH_EXPIRED:
    case FAILURE_TYPES.INTEGRATION_NOT_CONNECTED:
    case FAILURE_TYPES.UNKNOWN:
      decision = DECISIONS.ESCALATE;
      break;

    case FAILURE_TYPES.MISSING_FIELDS:
      decision = DECISIONS.ESCALATE;
      break;

    default:
      decision = DECISIONS.ESCALATE;
  }

  return {
    failureType,
    decision,
    backoffMs,
    message: `[Recovery] ${failureType} → ${decision}${backoffMs ? ` (wait ${backoffMs}ms)` : ''}`,
  };
}

module.exports = { recoveryAgent, FAILURE_TYPES, DECISIONS };
