const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    required: true,
    enum: ['AI', 'Data', 'Cloud', 'Security', 'Software', 'Emerging'],
    default: 'Emerging'
  },
  icon: { type: String, default: '📡' },
  price: {
    type: Number,
    default: 0
  },
  image: { type: String },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);