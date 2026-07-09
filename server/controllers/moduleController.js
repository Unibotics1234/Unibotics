const Module = require('../models/Module');
const Lesson = require('../models/Lesson');

// GET /api/courses/:courseId/modules — public structure (titles only, no lesson content)
exports.getModulesForCourse = async (req, res) => {
  try {
    const modules = await Module.find({ course: req.params.courseId })
      .sort({ order: 1 })
      .lean();

    const modulesWithLessons = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await Lesson.find({ module: mod._id })
          .select('title order _id')
          .sort({ order: 1 })
          .lean();
        return { ...mod, lessons };
      })
    );

    res.json({ success: true, data: modulesWithLessons });
  } catch (err) {
    console.error('getModulesForCourse error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch modules.' });
  }
};

// POST /api/courses/:courseId/modules — admin only
exports.createModule = async (req, res) => {
  try {
    const { title, order } = req.body;
    const mod = await Module.create({ course: req.params.courseId, title, order: order || 0 });
    res.status(201).json({ success: true, data: mod });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create module.' });
  }
};

// DELETE /api/modules/:id — admin only
exports.deleteModule = async (req, res) => {
  try {
    await Lesson.deleteMany({ module: req.params.id }); // cascade delete lessons inside it
    await Module.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Module and its lessons deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete module.' });
  }
};