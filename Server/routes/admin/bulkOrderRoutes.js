const express = require('express');
const router = express.Router();
const { 
    getInquiries, 
    updateInquiryStatus, 
    getB2BApplications,
    updateB2BApplicationStatus,
    getQuotes,
    createQuote,
    getB2BOrders,
    updateB2BOrderStatus
} = require('../../controllers/admin/bulkOrderController');
const { protectAdmin } = require('../../middleware/authMiddleware');

router.get('/inquiries', protectAdmin, getInquiries);
router.put('/inquiries/:id/status', protectAdmin, updateInquiryStatus);
// B2B Applications Routes
router.get('/applications', protectAdmin, getB2BApplications);
router.put('/applications/:id/status', protectAdmin, updateB2BApplicationStatus);
// Custom Quote Routes
router.get('/quotes', protectAdmin, getQuotes);
router.post('/quotes', protectAdmin, createQuote);

// B2B Orders Tracker Routes
router.get('/orders', protectAdmin, getB2BOrders);
router.put('/orders/:id/status', protectAdmin, updateB2BOrderStatus);
module.exports = router;
