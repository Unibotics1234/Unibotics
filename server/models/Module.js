const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

moduleSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Module', moduleSchema);