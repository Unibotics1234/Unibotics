const express    = require('express');
const router     = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  submitApplication,
  getAllApplications,
  updateStatus,
  deleteApplication
} = require('../controllers/joinController');

router.post('/',      submitApplication);
router.get('/',       protect, adminOnly, getAllApplications);
router.put('/:id',    protect, adminOnly, updateStatus);
router.delete('/:id', protect, adminOnly, deleteApplication);

module.exports = router;