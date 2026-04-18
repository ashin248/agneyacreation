const mongoose = require('mongoose');

// 1. Variation Sub-Schema
const variationSchema = new mongoose.Schema({
  sku: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  size: { 
    type: String, 
    default: null 
  },
  color: { 
    type: String, 
    default: null 
  },
  stock: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0 
  },
  priceModifier: { 
    type: Number, 
    default: 0 
  },
  imageUrl: { 
    type: String, 
    default: null 
  }
});

// 2. Bulk Pricing Sub-Schema
const bulkPricingSchema = new mongoose.Schema({
  minQty: { 
    type: Number, 
    required: true, 
    min: 2 
  },
  maxQty: { 
    type: Number,
    default: null
  },
  pricePerUnit: { 
    type: Number, 
    required: true,
    min: 0
  }
});

// 3. Main Product Schema
const productSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    category: { 
      type: String, 
      required: true, 
      index: true 
    },
    productType: { 
      type: String, 
      enum: ['ready_made', 'customizable'], 
      required: true 
    },
    originalPrice: { 
      type: Number, 
      default: 0,
      min: 0
    },
    basePrice: { 
      type: Number, 
      required: true,
      min: 0
    },
    gstRate: { 
      type: Number, 
      required: true, 
      enum: [0, 5, 12, 18, 28] 
    },
    galleryImages: [{ 
      type: String // Stores Cloudinary URLs for the product gallery
    }],

    // Embed the sub-schemas
    variations: [variationSchema], 
    bulkRules: [bulkPricingSchema],

    isBulkEnabled: { 
      type: Boolean, 
      default: false 
    },
    minOrder: {
      type: Number,
      default: 1,
      min: 1
    },
    isCustomizable: {
      type: Boolean,
      default: false
    },
    customizationType: { 
      type: String, 
      enum: ['None', '2D', '3D'], 
      default: 'None' 
    },
    baseModelId: {
      type: String, // ID referencing the front-end ProductLibrary.jsx
      default: null
    },
    model3d: {
      type: String, // GLB URL (Legacy/Custom)
      default: null
    },
    blankFrontImage: {
      type: String, // URL for 2D front view
      default: null
    },
    frontMaskImage: {
      type: String, // Mask for front-facing design clipping
      default: null
    },
    frontOverlayImage: {
      type: String, // Realistic overlay (handles/highlights) for front side
      default: null
    },
    blankBackImage: {
      type: String, // URL for 2D back view
      default: null
    },
    backMaskImage: {
      type: String, // Mask for back-facing design clipping
      default: null
    },
    backOverlayImage: {
      type: String, // Realistic overlay for back side
      default: null
    },
    base3DModelUrl: {
      type: String, // URL for the .glb/.gltf 3D model file
      default: null
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  }, 
  { 
    timestamps: true 
  }
);

// Prevent illogical data entry generically for bulk max constraint logic
bulkPricingSchema.path('maxQty').validate(function(value) {
  if (value === null) return true; // Allows empty max quantity limit
  return value >= this.minQty; 
}, 'Maximum quantity must be greater than or equal to the minimum quantity!');

module.exports = mongoose.model('Product', productSchema);
