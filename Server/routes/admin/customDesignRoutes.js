const express = require('express');
const router = express.Router();
const { 
    getDesignById, 
    updateDesignStatus, 
    getAllPendingDesigns, 
    getAllCustomDesigns,
    getQualityControlGuidelines 
} = require('../../controllers/admin/customDesignController');
const { protectAdmin } = require('../../middleware/authMiddleware');

// GET request for all custom designs
router.get('/', protectAdmin, getAllCustomDesigns);

// GET request for Quality Control Guidelines (mock)
router.get('/guidelines', protectAdmin, getQualityControlGuidelines);

// GET request to fetch all pending designs
router.get('/pending', protectAdmin, getAllPendingDesigns);

// GET request to fetch a specific design's details
router.get('/:id', protectAdmin, getDesignById);

// PATCH request to update design status and admin notes
router.patch('/:id/status', protectAdmin, updateDesignStatus);

module.exports = router;
