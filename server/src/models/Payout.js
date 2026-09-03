const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema(
  {
    payoutId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    vendor: {
      type: String,
      default: 'AWS India',
    },
    accountNumber: {
      type: String,
      default: '11214311215411',
    },
    mode: {
      type: String,
      default: 'NEFT',
    },
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'PAID', 'REJECTED', 'CANCELLED'],
      default: 'PENDING_APPROVAL',
      index: true,
    },
    guardrail: {
      type: String,
      default: 'AgentGuard_ZK_Verified',
    },
    executionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Execution',
      index: true,
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
    },
    nodeId: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    otp: {
      type: String,
      default: '123456',
    },
    rejectionReason: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payout', PayoutSchema);
