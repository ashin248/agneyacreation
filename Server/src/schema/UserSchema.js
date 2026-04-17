const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String
  },
  role: {
    type: String,
    enum: ['admin', 'customer'],
    default: 'customer'
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  addresses: [{
    name: { type: String, trim: true },
    mobile: { type: String, trim: true },
    email: { type: String, trim: true },
    houseNo: { type: String, trim: true },
    area: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, default: 'India', trim: true },
    pincode: { type: String, trim: true },
    type: { type: String, default: 'home' }, // home, work, other
    coords: {
      latitude: Number,
      longitude: Number
    },
    isDefault: { type: Boolean, default: false }
  }],
  businessProfile: {
    companyName: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    gstStatus: {
      type: String,
      enum: ['None', 'Pending', 'Verified', 'Rejected'],
      default: 'None'
    }
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
