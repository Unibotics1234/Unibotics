const express    = require('express');
const router     = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getDashboard,
  getAllUsers,
  deleteUser
} = require('../controllers/adminController');

router.use(protect, adminOnly);   // all admin routes require auth + admin role

router.get('/dashboard',    getDashboard);
router.get('/users',        getAllUsers);
router.delete('/users/:id', deleteUser);

module.exports = router;