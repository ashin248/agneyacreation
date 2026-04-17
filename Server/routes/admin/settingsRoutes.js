const express = require('express');
const { getCompanyProfile, updateCompanyProfile, getShippingRules, updateShippingRules, getLegalSettings, updateLegalSettings, getPaymentSettings, updatePaymentSettings } = require('../../controllers/settingsController');
const { protectAdmin } = require('../../middleware/authMiddleware');

const router = express.Router();

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Fetch structural settings generic datasets
// Fetch structural settings generic datasets
router.get('/company', protectAdmin, getCompanyProfile);

// Override configuration fields globally gracefully
router.put('/company', protectAdmin, upload.single('logoFile'), updateCompanyProfile);

// Shipping Rules
router.get('/shipping', protectAdmin, getShippingRules);
router.put('/shipping', protectAdmin, updateShippingRules);

// Legal & Tax
router.get('/legal', protectAdmin, getLegalSettings);
router.put('/legal', protectAdmin, updateLegalSettings);

// Payment Gateways
router.get('/payments', protectAdmin, getPaymentSettings);
router.put('/payments', protectAdmin, updatePaymentSettings);

module.exports = router;
