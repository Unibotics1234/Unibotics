const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: { type: String, trim: true },
  country: { type: String, trim: true },
  studyLevel: {
    type: String,
    enum: ['School', 'ITI', 'Diploma', 'Undergraduate', 'Postgraduate', 'Professional', 'Other'],
    default: null
  },
  avatar: { type: String, default: null },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  teamName: { type: String },
  institution: { type: String },
  teamMembers: { type: Number },
  registrationType: {
    type: String,
    enum: ['solo', 'team'],
    default: 'solo'
  },
  // Password reset
  resetPasswordToken:   { type: String, select: false },
  resetPasswordExpires: { type: Date,   select: false }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);