const express                 = require('express');
const router                  = express.Router();
const { protect, adminOnly }  = require('../middleware/auth');
const {
  getRequests,
  approveRequest,
  rejectRequest
} = require('../controllers/adminRequestController');

router.use(protect, adminOnly);

router.get('/',                getRequests);
router.put('/:id/approve',     approveRequest);
router.put('/:id/reject',      rejectRequest);

module.exports = router;