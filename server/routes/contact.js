const express    = require('express');
const router     = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  submitContact,
  getMyMessages,
  getAllMessages,
  replyToMessage,
  markRead,
  deleteMessage
} = require('../controllers/contactController');

router.post('/',           protect, submitContact);
router.get('/my',          protect, getMyMessages);
router.get('/',            protect, adminOnly, getAllMessages);
router.post('/:id/reply',  protect, adminOnly, replyToMessage);
router.put('/:id/read',    protect, adminOnly, markRead);
router.delete('/:id',      protect, adminOnly, deleteMessage);

module.exports = router;