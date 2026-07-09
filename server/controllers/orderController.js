const Order  = require('../models/Order');
const Course = require('../models/Course');

// POST /api/orders (user enrolls in a course)
exports.createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    // Check for duplicate order
    const existing = await Order.findOne({ user: req.user._id, course: courseId });
    if (existing) return res.status(409).json({ success: false, message: 'Already enrolled in this course.' });

    const order = await Order.create({
      user: req.user._id,
      course: courseId,
      amount: course.price
    });

    await order.populate('course', 'title');
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Enrollment failed.' });
  }
};

// GET /api/orders/my  (logged-in user sees own orders)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('course', 'title icon category')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

// GET /api/orders  (admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

// PUT /api/orders/:id  (admin updates status)
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
};