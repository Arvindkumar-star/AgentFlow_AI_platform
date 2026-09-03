require('dotenv').config();
// Environment, AI specifications, meaningful naming, and payment integrations updated
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const executionRoutes = require('./routes/executionRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const agentGuardRoutes = require('./routes/agentGuardRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const attackRoutes = require('./routes/attackRoutes');

const app = express();
const server = http.createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────
initSocket(server);

// ─── Security & utility middleware ────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(compression());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'Agentflow_AI API',
    status: 'running',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/agentguard', agentGuardRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/payouts', attackRoutes);
app.use('/api/attack', attackRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ─── Find a free port starting from `preferred` ───────────────
function findFreePort(preferred, maxTries = 10) {
  return new Promise((resolve, reject) => {
    const net = require('net');
    let port = preferred;
    const tryPort = () => {
      if (port >= preferred + maxTries) {
        return reject(new Error(`No free port found between ${preferred} and ${preferred + maxTries - 1}`));
      }
      const tester = net.createServer();
      tester.once('error', () => { tester.close(); port++; tryPort(); });
      tester.once('listening', () => { tester.close(() => resolve(port)); });
      tester.listen(port);
    };
    tryPort();
  });
}

// ─── Boot ─────────────────────────────────────────────────────
async function start() {
  await connectDB();

  const preferredPort = Number(env.PORT);
  const port = await findFreePort(preferredPort);

  if (port !== preferredPort) {
    console.warn(`⚠️  Port ${preferredPort} in use — binding to port ${port} instead.`);
    console.warn(`   Update NEXT_PUBLIC_SOCKET_URL=http://localhost:${port} in client/.env.local`);
  }

  server.listen(port, () => {
    console.log(`🚀 Agentflow_AI server running on port ${port} (${env.NODE_ENV})`);
  });
}

start();

module.exports = app;
