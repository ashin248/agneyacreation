// FINAL PRODUCTION CLEANUP: Removed all remaining seed/dummy references
const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Banner Image URL is required'],
    trim: true
  },
  linkUrl: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  discountPercentage: {
    type: Number,
    required: [true, 'Discount percentage is required'],
    min: [1, 'Discount must be at least 1%'],
    max: [100, 'Discount cannot exceed 100%']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiration date is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Banner = mongoose.model('Banner', BannerSchema);
const Coupon = mongoose.model('Coupon', CouponSchema);

module.exports = { Banner, Coupon };
