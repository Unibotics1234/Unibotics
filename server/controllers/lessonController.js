const Lesson = require('../models/Lesson');
const Module = require('../models/Module');

// GET /api/lessons/:id — full content, gated by requireConfirmedEnrollment
exports.getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found.' });
    res.json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch lesson.' });
  }
};

// POST /api/lessons — admin only
exports.createLesson = async (req, res) => {
  try {
    const { module: moduleId, title, content, order } = req.body;
    const mod = await Module.findById(moduleId);
    if (!mod) return res.status(404).json({ success: false, message: 'Module not found.' });

    const lesson = await Lesson.create({
      module: moduleId,
      course: mod.course,
      title, content, order: order || 0
    });
    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create lesson.' });
  }
};

// PUT /api/lessons/:id — admin only
exports.updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found.' });
    res.json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
};

// DELETE /api/lessons/:id — admin only
exports.deleteLesson = async (req, res) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Lesson deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
};