const mongoose = require('mongoose');

// Unified generic schema aggregating global parameter blocks natively gracefully.
const SettingsSchema = new mongoose.Schema({
  companyProfile: {
    storeName: {
      type: String,
      default: 'Agneya'
    },
    supportEmail: {
      type: String,
      trim: true
    },
    supportPhone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    logoUrl: {
      type: String,
      trim: true
    }
  },
  shippingRules: [{
    region: String,
    cost: Number,
    minOrderForFreeShipping: Number
  }],
  legalAndTax: {
    gstPercentage: Number,
    termsAndConditions: String,
    privacyPolicy: String
  },
  paymentGateways: {
    razorpay: {
      isActive: { type: Boolean, default: false },
      keyId: String,
      keySecret: String
    },
    stripe: {
      isActive: { type: Boolean, default: false },
      publicKey: String,
      secretKey: String
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
