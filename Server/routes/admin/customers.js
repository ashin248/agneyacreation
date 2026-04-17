const express = require('express');
const { 
  getAllCustomers, toggleBlockStatus, getCustomerById, getCustomerOrders,
  getGstApplications, updateGstStatus 
} = require('../../controllers/customerController');

const router = express.Router();

// =======================================
// B2B GST ROUTES (Must precede /:id routes)
// =======================================
router.get('/gst-applications', getGstApplications);
// =======================================
// STANDARD CUSTOMER ROUTES
// =======================================
// GET all active/blocked customers safely (passwords hidden)
router.get('/', getAllCustomers);

// GET single customer profile cleanly bypassing queries
router.get('/:id', getCustomerById);

// GET isolated customer order history securely cross-referencing schemas
router.get('/:id/orders', getCustomerOrders);

// PUT toggle blocked boolean 
router.put('/:id/block', toggleBlockStatus);

// PUT target explicit GST evaluations securely over native nested endpoints
router.put('/:id/gst', updateGstStatus);


module.exports = router;
