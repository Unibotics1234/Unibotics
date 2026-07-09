const User             = require('../models/User');
const ContactMessage   = require('../models/ContactMessage');
const JoinApplication  = require('../models/JoinApplication');
const Course           = require('../models/Course');
const Order            = require('../models/Order');

// GET /api/admin/dashboard — aggregate stats
exports.getDashboard = async (req, res) => {
  try {
    const [users, messages, applications, courses, orders] = await Promise.all([
      User.countDocuments(),
      ContactMessage.countDocuments({ isRead: false }),
      JoinApplication.countDocuments({ status: 'pending' }),
      Course.countDocuments({ isActive: true }),
      Order.countDocuments()
    ]);

    res.json({
      success: true,
      data: { totalUsers: users, unreadMessages: messages, pendingApplications: applications, activeCourses: courses, totalOrders: orders }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin accounts.' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
};