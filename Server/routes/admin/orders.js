const express = require('express');
const { getAllOrders, getOrderById, updateOrderStatus, getRecentOrders, getSalesAnalytics } = require('../../controllers/orderController');

const router = express.Router();

// GET 7-day sales analytics (MUST BE BEFORE /:id)
router.get('/analytics', getSalesAnalytics);

// GET recent 5 orders (MUST BE BEFORE /:id)
router.get('/recent', getRecentOrders);

// GET all orders
router.get('/', getAllOrders);

// GET single order detailed fetch mapping parameterized ID
router.get('/:id', getOrderById);

// PUT update order status mapping logic
router.put('/:id/status', updateOrderStatus);


module.exports = router;
