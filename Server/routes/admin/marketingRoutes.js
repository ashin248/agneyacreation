const express = require('express');
const { getCoupons, addCoupon, toggleCouponStatus, getBanners, addBanner, toggleBannerStatus, deleteBanner } = require('../../controllers/marketingController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// --- COUPON ROUTES ---
// GET all coupons natively
router.get('/coupons', getCoupons);

// POST create a new discount rule
router.post('/coupons', addCoupon);

// PUT toggle coupon activation status
router.put('/coupons/:id/status', toggleCouponStatus);


// --- BANNERS ROUTES ---
// GET all homepage visual banners natively 
router.get('/banners', getBanners);

// POST map new graphical banners into existing MongoDB collections via Cloudinary
router.post('/banners', upload.single('bannerImage'), addBanner);

// DELETE permanently purge banner entities
router.delete('/banners/:id', deleteBanner);

// PUT toggle banner active booleans gracefully 
router.put('/banners/:id/status', toggleBannerStatus);

module.exports = router;
