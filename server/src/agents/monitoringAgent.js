/**
 * Monitoring Agent
 * Emits timeline events and writes ExecutionLog rows.
 * Receives persistence + socket functions via DI to stay pure.
 */

async function monitoringAgent({ executionId, workflowId, nodeId, agent, level, message, metadata, persistLog, emit }) {
  const logEntry = {
    executionId,
    workflowId,
    nodeId,
    agent: agent || 'monitoring',
    level: level || 'info',
    message,
    metadata: metadata || {},
  };

  // Persist to DB
  if (persistLog) {
    try {
      await persistLog(logEntry);
    } catch (err) {
      console.warn('⚠️  MonitoringAgent failed to persist log:', err.message);
    }
  }

  // Emit via Socket.IO
  if (emit) {
    emit(executionId.toString(), logEntry);
  }

  return logEntry;
}

module.exports = { monitoringAgent };
