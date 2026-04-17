const express = require('express');
const { getAllOrders, getOrderById, updateOrderStatus } = require('../../controllers/orderController');
const { protectAdmin } = require('../../middleware/authMiddleware');

const router = express.Router();

// GET all orders
router.get('/', protectAdmin, getAllOrders);

// GET single order
router.get('/:id', protectAdmin, getOrderById);

// PUT update status
router.put('/:id/status', protectAdmin, updateOrderStatus);

module.exports = router;
