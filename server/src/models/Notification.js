const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
    },
    executionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Execution',
    },
    type: {
      type: String,
      enum: ['success', 'failure', 'warning', 'escalation', 'info'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ owner: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
