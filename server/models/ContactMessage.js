const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  message:   { type: String, required: true },
  sentAt:    { type: Date, default: Date.now },
  sentBy:    { type: String, default: 'Admin' }
});

const contactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, lowercase: true, trim: true },
  org:     { type: String, trim: true },
  message: { type: String, required: true },
  isRead:  { type: Boolean, default: false },
  replies: [replySchema]
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactSchema);