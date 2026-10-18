const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
} = require('../controllers/orderController');

// Routes for creating and fetching current demo session orders
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

module.exports = router;
