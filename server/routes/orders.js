const express    = require('express');
const router     = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');

router.post('/',      protect, createOrder);
router.get('/my',     protect, getMyOrders);
router.get('/',       protect, adminOnly, getAllOrders);
router.put('/:id',    protect, adminOnly, updateOrderStatus);

module.exports = router;