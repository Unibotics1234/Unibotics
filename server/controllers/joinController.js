const JoinApplication = require('../models/JoinApplication');
const User            = require('../models/User');

// POST /api/join
exports.submitApplication = async (req, res) => {
  try {
    const { name, email, phone, role, organization, message } = req.body;

    if (!name || !email || !phone || !role || !message) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    // Create or find a user account for this person
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    let accountCreated = false;

    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase().trim(),
        phone,
        password: '12345',
        registrationType: 'solo'
      });
      accountCreated = true;
    }

    // Check for duplicate application
    const existing = await JoinApplication.findOne({
      email: email.toLowerCase().trim(),
      status: { $in: ['pending', 'reviewed'] }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending application.'
      });
    }

    await JoinApplication.create({
      name, email, phone, role, organization, message,
      user: user._id
    });

    const responseMessage = accountCreated
      ? `Application submitted! A Unibotics account has been created for you with email "${email}" and default password "12345". You can log in now — course enrollment will be available after admin reviews your application.`
      : `Application submitted! Our team will reach out within 2 business days.`;

    res.status(201).json({ success: true, message: responseMessage });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }
    res.status(500).json({ success: false, message: 'Failed to submit application.' });
  }
};

// GET /api/join — admin only
exports.getAllApplications = async (req, res) => {
  try {
    const apps = await JoinApplication.find().sort({ createdAt: -1 });
    res.json({ success: true, count: apps.length, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
};

// PUT /api/join/:id — admin updates status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const app = await JoinApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
};

// DELETE /api/join/:id — admin only
exports.deleteApplication = async (req, res) => {
  try {
    await JoinApplication.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Application deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
};