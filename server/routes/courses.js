const express         = require('express');
const router          = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');

router.get('/',          getAllCourses);
router.get('/:id',       getCourse);
router.post('/',         protect, adminOnly, createCourse);
router.put('/:id',       protect, adminOnly, updateCourse);
router.delete('/:id',   protect, adminOnly, deleteCourse);

module.exports = router;