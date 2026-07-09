const mongoose = require('mongoose');

const joinSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
},
  phone: {
    type: String,
    required: [true, 'Phone is required']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['Mentor / Trainer', 'Intern', 'Institutional Partner', 'Channel Partner']
  },
  organization: { type: String, trim: true },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('JoinApplication', joinSchema);