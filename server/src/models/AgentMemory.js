const mongoose = require('mongoose');

const AgentMemorySchema = new mongoose.Schema(
  {
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
    executionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution', required: true },
    agentId: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed },
    confidenceScore: { type: Number, min: 0, max: 1, default: 1 },
  },
  { timestamps: true }
);

AgentMemorySchema.index({ executionId: 1, agentId: 1 });

module.exports = mongoose.model('AgentMemory', AgentMemorySchema);
