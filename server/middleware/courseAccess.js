const Order = require('../models/Order');

exports.requireConfirmedEnrollment = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();

    const courseId = req.courseId || req.params.courseId;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required.' });
    }

    const order = await Order.findOne({
      user:   req.user._id,
      course: courseId,
      status: 'confirmed'
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'This course is locked. Your enrollment must be confirmed before you can access lesson content.',
        locked: true
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to verify enrollment.' });
  }
};