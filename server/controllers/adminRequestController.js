const AdminRequest = require('../models/AdminRequest');
const User         = require('../models/User');

// GET /api/admin-requests
exports.getRequests = async (req, res) => {
  try {
    const filter   = req.query.all === 'true' ? {} : { status: 'pending' };
    const requests = await AdminRequest.find(filter)
      .populate('user', 'name email phone createdAt')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    console.error('getRequests error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
  }
};

// PUT /api/admin-requests/:id/approve
exports.approveRequest = async (req, res) => {
  try {
    const request = await AdminRequest.findById(req.params.id).populate('user');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `This request was already ${request.status}.` });
    }

    // Directly update using updateOne to bypass any model hooks that might interfere
    await User.updateOne(
      { _id: request.user._id },
      { $set: { role: 'admin' } }
    );

    request.status     = 'approved';
    request.reviewedAt = new Date();
    request.reviewNote = req.body.note || '';
    await request.save();

    res.json({
      success: true,
      message: `${request.user.name} has been granted admin access. They need to log out and back in to activate admin powers.`,
      data: request
    });
  } catch (err) {
    console.error('approveRequest error:', err);
    res.status(500).json({ success: false, message: 'Failed to approve request.' });
  }
};

// PUT /api/admin-requests/:id/reject
exports.rejectRequest = async (req, res) => {
  try {
    const request = await AdminRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `This request was already ${request.status}.` });
    }

    request.status     = 'rejected';
    request.reviewedAt = new Date();
    request.reviewNote = req.body.note || '';
    await request.save();

    res.json({ success: true, message: 'Request rejected.', data: request });
  } catch (err) {
    console.error('rejectRequest error:', err);
    res.status(500).json({ success: false, message: 'Failed to reject request.' });
  }
};