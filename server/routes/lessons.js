const express    = require('express');
const router     = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { requireConfirmedEnrollment } = require('../middleware/courseAccess');
const Lesson     = require('../models/Lesson');
const {
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson
} = require('../controllers/lessonController');

// Resolves the lesson's course onto req.courseId before the enrollment gate runs
async function attachCourseId(req, res, next) {
  try {
    const lesson = await Lesson.findById(req.params.id).select('course');
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found.' });
    }
    req.courseId = lesson.course.toString();
    next();
  } catch (err) {
    console.error('attachCourseId error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify lesson.' });
  }
}

router.get('/:id',    protect, attachCourseId, requireConfirmedEnrollment, getLesson);
router.post('/',      protect, adminOnly, createLesson);
router.put('/:id',    protect, adminOnly, updateLesson);
router.delete('/:id', protect, adminOnly, deleteLesson);

module.exports = router;