const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Runs once on server start — ensures the owner email always has admin role
exports.ensureOwnerIsAdmin = async () => {
  try {
    const ownerEmail = process.env.OWNER_EMAIL;
    if (!ownerEmail) return;
    await User.updateOne(
      { email: ownerEmail.toLowerCase() },
      { $set: { role: 'admin' } }
    );
    console.log(`✅ Owner admin status verified: ${ownerEmail}`);
  } catch (err) {
    console.error('Failed to verify owner admin status:', err);
  }
};

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
};