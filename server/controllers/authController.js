const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const AdminRequest = require('../models/AdminRequest');
const crypto       = require('crypto');
// ── Generate JWT ─────────────────────────────────────────────────────────────
const signToken = (id) => jwt.sign(
  { id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// ── POST /api/auth/register ──────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const {
      name, email, password, confirm, phone,
      teamName, institution, members, registrationType
    } = req.body;

    if (password !== confirm) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const user = await User.create({
      name: name || teamName,
      email,
      password,
      phone,
      teamName,
      institution,
      teamMembers: members,
      registrationType: registrationType || 'solo'
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ── POST /api/auth/login ─────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user._id);
    res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ── POST /api/auth/admin-login ───────────────────────────────────────────────
// Any user whose role is 'admin' can log in here — not restricted to one email,
// since approved requesters become real admins too.
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials, or this account does not have admin access.' });
    }

    const token = signToken(user._id);
    res.json({
      success: true,
      message: 'Admin signed in successfully.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
};

// ── POST /api/auth/admin-register ────────────────────────────────────────────
// Does NOT create an admin account. Requires the person to already be logged in
// as a regular user, then logs a pending request the owner reviews separately.
exports.adminRegister = async (req, res) => {
  try {
    const { name, email, password, reason, organization } = req.body;

    if (!name || !email || !password || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password and reason are all required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Create regular user account if it doesn't exist
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    let accountCreated = false;

    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase().trim(),
        password,
        registrationType: 'solo'
      });
      accountCreated = true;
    }

    // Check for duplicate pending request
    const existingRequest = await AdminRequest.findOne({ user: user._id, status: 'pending' });
    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending admin access request.'
      });
    }

    await AdminRequest.create({
      user: user._id,
      reason: reason.trim(),
      organization: organization ? organization.trim() : undefined
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: accountCreated
        ? 'Account created and admin request submitted. You can now log in — admin powers will be granted after approval.'
        : 'Admin request submitted. The site owner will review it shortly.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};


// For logged-in users who know their current password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};