const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getActiveBanners, getStoreFrontPulse, getPublicProducts, getPublicProductById, getPublicCompanyProfile, submitCustomDesignRequest, createPublicOrder, trackPublicOrder, trackUnifiedOrder, syncUser, updateUser, deleteAddress, toggleWishlist, getWishlist, getUserOrders, createRazorpayOrder, verifyRazorpayPayment, handleBulkInquiry, removeBackgroundImage, uploadManualDesignAssets } = require('../../controllers/public/storefrontController');
const { getCategories } = require('../../controllers/categoryController');
const { protectUser } = require('../../middleware/userAuthMiddleware');
// Multer Config for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET /api/public/banners
router.get('/banners', getActiveBanners);

// GET /api/public/pulse (Banners + Offers)
router.get('/pulse', getStoreFrontPulse);

// GET /api/public/settings
router.get('/settings', getPublicCompanyProfile);

// GET /api/public/products
router.get('/products', getPublicProducts);

// GET /api/public/products/:id
router.get('/products/:id', getPublicProductById);

// GET /api/public/categories
router.get('/categories', getCategories);

// POST /api/public/custom-designs
router.post('/custom-designs', submitCustomDesignRequest);

// POST /api/public/orders
router.post('/orders', createPublicOrder);

// POST /api/public/orders/track
router.post('/orders/track', trackPublicOrder);

// POST /api/public/track-order (Unified Tracking)
router.post('/track-order', trackUnifiedOrder);

// POST /api/public/sync-user (Phone Auth Sync)
router.post('/sync-user', protectUser, syncUser);

// POST /api/public/update-user (Profile & Address Update)
router.post('/update-user', protectUser, updateUser);

// DELETE /api/public/user/address/:addressId
router.delete('/user/address/:addressId', protectUser, deleteAddress);

// POST /api/public/user/wishlist/toggle
router.post('/user/wishlist/toggle', protectUser, toggleWishlist);

// GET /api/public/user/wishlist/:phone
router.get('/user/wishlist/:phone', protectUser, getWishlist);

// GET /api/public/user/orders/:phone
router.get('/user/orders/:phone', protectUser, getUserOrders);

// POST /api/public/payment/razorpay-order
router.post('/payment/razorpay-order', createRazorpayOrder);

// POST /api/public/payment/verify
router.post('/payment/verify', verifyRazorpayPayment);

// POST /api/public/bulk-inquiry
router.post('/bulk-inquiry', handleBulkInquiry);

// POST /api/public/manual-design/upload
router.post('/manual-design/upload', upload.array('images', 10), uploadManualDesignAssets);

// POST /api/public/remove-bg
router.post('/remove-bg', upload.single('image'), removeBackgroundImage);

module.exports = router;
