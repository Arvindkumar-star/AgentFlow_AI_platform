const { Server } = require('socket.io');
const env = require('./env');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origin === env.CLIENT_URL ||
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Client joins a room per execution to receive live events
    socket.on('join:execution', (executionId) => {
      socket.join(`execution:${executionId}`);
      console.log(`📡 Socket ${socket.id} joined execution:${executionId}`);
    });

    socket.on('leave:execution', (executionId) => {
      socket.leave(`execution:${executionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialised — call initSocket(server) first');
  return io;
}

/**
 * Emit an agent event to all clients subscribed to an execution room.
 * @param {string} executionId
 * @param {object} event  { agent, level, message, metadata, nodeId }
 */
function emitAgentEvent(executionId, event) {
  if (!io) return;
  const payload = {
    executionId,
    timestamp: new Date().toISOString(),
    ...event,
  };
  io.to(`execution:${executionId}`).emit('agent:event', payload);
  io.emit('agent:event', payload);
}

/**
 * Emit execution status updates (RUNNING, COMPLETED, FAILED …)
 */
function emitExecutionStatus(executionId, status, extra = {}) {
  if (!io) return;
  const payload = {
    executionId,
    status,
    timestamp: new Date().toISOString(),
    ...extra,
  };
  io.to(`execution:${executionId}`).emit('execution:status', payload);
  io.emit('execution:status', payload);
}

module.exports = { initSocket, getIO, emitAgentEvent, emitExecutionStatus };
