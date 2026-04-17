const { Banner, Coupon } = require('../src/schema/MarketingSchema');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// --- COUPON LOGIC ---

// Create a new discount voucher securely
exports.addCoupon = async (req, res) => {
  try {
    const { code, discountPercentage, expiryDate } = req.body;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }

    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      discountPercentage,
      expiryDate
    });

    await newCoupon.save();
    return res.status(201).json({ success: true, message: 'Coupon created successfully!', data: newCoupon });
  } catch (error) {
    console.error('Create Coupon Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create coupon.' });
  }
};

// Fetch all promotional codes sorted by newest first
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    console.error('Fetch Coupons Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch coupons.' });
  }
};

// Toggle active status for specified coupon nodes natively
exports.toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return res.status(200).json({ 
      success: true, 
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully!`,
      data: coupon 
    });
  } catch (error) {
    console.error('Toggle Coupon Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update coupon status.' });
  }
};

// --- BANNERS LOGIC ---

// Fetch all active and inactive homepage banners securely
exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: banners });
  } catch (error) {
    console.error('Fetch Banners Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch banners' });
  }
};

// Add a new graphical banner with file upload to Cloudinary
exports.addBanner = async (req, res) => {
  try {
    const { title, linkUrl } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is legally required' });
    }

    // Upload to Cloudinary using streamifier
    const streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'banners' }, 
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );
            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };

    const uploadResult = await streamUpload(req);

    const newBanner = new Banner({ 
      title, 
      imageUrl: uploadResult.secure_url, 
      linkUrl 
    });

    await newBanner.save();

    return res.status(201).json({ success: true, message: 'Banner successfully created', data: newBanner });
  } catch (error) {
    console.error('Create Banner Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create banner' });
  }
};

// Permanently remove a banner entity
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    return res.status(200).json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete Banner Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete banner' });
  }
};

// Toggle banner visibility explicitly 
exports.toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner entity not localized' });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    return res.status(200).json({ 
      success: true, 
      message: `Banner accurately ${banner.isActive ? 'Activated' : 'Suspended'}`, 
      data: banner 
    });
  } catch (error) {
    console.error('Toggle Banner Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to transform Banner status' });
  }
};
