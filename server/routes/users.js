const express    = require('express');
const router     = express.Router();
const { protect } = require('../middleware/auth');
const User       = require('../models/User');

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, country, studyLevel, avatar } = req.body;
    const updates = {};
    if (name)       updates.name       = name;
    if (phone)      updates.phone      = phone;
    if (country)    updates.country    = country;
    if (studyLevel) updates.studyLevel = studyLevel;
    if (avatar)     updates.avatar     = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, message: 'Profile updated.', data: user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

module.exports = router;