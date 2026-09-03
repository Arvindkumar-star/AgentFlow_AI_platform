const mongoose = require('mongoose');

const ExecutionSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
    },
    // Immutable snapshot of the workflow at the time of execution
    workflowSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
    },
    currentNode: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number }, // ms
    inputs: { type: mongoose.Schema.Types.Mixed, default: {} },
    outputs: { type: mongoose.Schema.Types.Mixed, default: {} },
    error: { type: String },
    retryCount: { type: Number, default: 0 },
    triggeredBy: {
      type: String,
      enum: ['manual', 'schedule', 'webhook', 'api'],
      default: 'manual',
    },
  },
  { timestamps: true }
);

ExecutionSchema.index({ workflowId: 1, createdAt: -1 });
ExecutionSchema.index({ owner: 1, status: 1 });

module.exports = mongoose.model('Execution', ExecutionSchema);
