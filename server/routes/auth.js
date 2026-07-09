const express      = require('express');
const router       = express.Router();
const { protect }  = require('../middleware/auth');
const {
  register,
  login,
  adminLogin,
  adminRegister,
  getMe,
   changePassword
} = require('../controllers/authController');

router.post('/register',        register);
router.post('/login',           login);
router.post('/admin-login',     adminLogin);
router.post('/admin-register',   adminRegister);
router.get('/me',               protect, getMe);
router.post('/change-password',   protect, changePassword);
module.exports = router;