const env = require('../config/env');

let Queue, Worker, QueueEvents;
let useInMemory = false;

// Try BullMQ + Redis
if (env.REDIS_URL) {
  try {
    const bullmq = require('bullmq');
    Queue = bullmq.Queue;
    Worker = bullmq.Worker;
    QueueEvents = bullmq.QueueEvents;
    console.log('✅ BullMQ + Redis queue ready');
  } catch (err) {
    console.warn('⚠️  BullMQ not available:', err.message, '— using in-memory fallback');
    useInMemory = true;
  }
} else {
  console.log('ℹ️  REDIS_URL not set — using in-memory queue fallback');
  useInMemory = true;
}

// ─── In-memory fallback queue ─────────────────────────────────
const memQueue = [];
let processing = false;

async function processMemQueue(processor) {
  if (processing || memQueue.length === 0) return;
  processing = true;
  const job = memQueue.shift();
  try {
    await processor(job);
  } catch (err) {
    console.error('In-memory queue job failed:', err.message);
  }
  processing = false;
  if (memQueue.length > 0) processMemQueue(processor);
}

// ─── Exported queue interface ─────────────────────────────────
let executionQueue = null;

function getQueue() {
  if (!executionQueue && !useInMemory) {
    executionQueue = new Queue('executions', {
      connection: { url: env.REDIS_URL },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return executionQueue;
}

async function addJob(jobName, data, opts = {}) {
  if (useInMemory) {
    memQueue.push({ name: jobName, data });
    return { id: `mem-${Date.now()}` };
  }
  return getQueue().add(jobName, data, opts);
}

function startWorker(processor) {
  if (useInMemory) {
    // Poll in-memory queue every 500ms
    setInterval(() => processMemQueue(processor), 500);
    return;
  }
  const worker = new Worker('executions', processor, {
    connection: { url: env.REDIS_URL },
    concurrency: 5,
  });
  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });
  return worker;
}

module.exports = { addJob, startWorker, getQueue, useInMemory };
