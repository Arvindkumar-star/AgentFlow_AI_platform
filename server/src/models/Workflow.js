const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true, default: 'default' },
  label: { 
    type: String, 
    required: true, 
    default: function() {
      return this.data?.label || this.data?.name || this.id || 'Connection';
    } 
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  type: { type: String, default: 'smoothstep' },
  animated: { type: Boolean, default: true },
  label: { type: String, default: 'Connection' },
}, { _id: false });

const WorkflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'draft',
    },
    triggerConfig: {
      type: { type: String, default: 'manual' },
      schedule: String,
      webhookUrl: String,
    },
    nodes: [NodeSchema],
    edges: [EdgeSchema],
    version: {
      type: Number,
      default: 1,
    },
    tags: [{ type: String, trim: true }],
    // Prompt used if generated via AI
    generatedFrom: { type: String },
  },
  { timestamps: true }
);

WorkflowSchema.index({ owner: 1, status: 1 });
WorkflowSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Workflow', WorkflowSchema);
