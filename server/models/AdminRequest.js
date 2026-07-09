const mongoose = require('mongoose');

const adminRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Please explain why you need admin access'],
    trim: true
  },
  organization: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedAt: { type: Date },
  reviewNote: { type: String, trim: true }
}, { timestamps: true });

// One pending request per user at a time — stops someone from spamming requests
adminRequestSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('AdminRequest', adminRequestSchema);