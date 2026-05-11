const mongoose = require('mongoose');

const phoneModelSchema = new mongoose.Schema({
  brand: { 
    type: String, 
    required: true, 
    index: true 
  },
  brandName: String,
  logo: String,
  theme: String,
  models: [{
    id: { type: String, required: true }, // Original ID
    name: { type: String, required: true },
    shape: {
      width: Number,
      height: Number,
      rx: Number
    },
    camera: {
      type: { type: String }, // 'lenses', 'rounded-rect', 'circle', etc.
      lenses: [{
        cx: Number,
        cy: Number,
        r: Number
      }],
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      rx: Number,
      cx: Number,
      cy: Number,
      r: Number
    },
    price: { type: Number, default: 399 },
    color: String,
    isAvailable: { type: Boolean, default: true }
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('PhoneModel', phoneModelSchema);
