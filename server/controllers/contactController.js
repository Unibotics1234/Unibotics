const ContactMessage = require('../models/ContactMessage');

// POST /api/contact — requires login
exports.submitContact = async (req, res) => {
  try {
    const { name, email, org, msg } = req.body;

    if (!name || !email || !msg) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
    }

    await ContactMessage.create({
      user:    req.user._id,
      name,
      email,
      org,
      message: msg
    });

    res.status(201).json({ success: true, message: "Thanks! We'll be in touch soon." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to save message.' });
  }
};

// GET /api/contact/my — logged-in user sees their own messages + replies
exports.getMyMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
};

// GET /api/contact — admin sees all
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
};

// POST /api/contact/:id/reply — admin only
exports.replyToMessage = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ success: false, message: 'Reply cannot be empty.' });
    }

    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      {
        $push: { replies: { message: reply.trim(), sentBy: req.user.name || 'Admin' } },
        isRead: true
      },
      { new: true }
    );

    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });
    res.json({ success: true, message: 'Reply sent.', data: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send reply.' });
  }
};

// PUT /api/contact/:id/read — admin marks read
exports.markRead = async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id, { isRead: true }, { new: true }
    );
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });
    res.json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
};

// DELETE /api/contact/:id — admin only
exports.deleteMessage = async (req, res) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
};