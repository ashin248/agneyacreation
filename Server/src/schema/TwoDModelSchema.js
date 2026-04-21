const mongoose = require('mongoose');

const twoDModelSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    category: { 
      type: String, 
      required: true, 
      index: true 
    },
    thumbnail: {
      type: String, // Cloudinary URL for the admin gallery
      required: true
    },
    // 2D Mockup Assets
    frontImage: {
      type: String, // Backdrop image (blank mockup)
      required: true
    },
    frontMask: {
      type: String, // Clipping mask (optional)
      default: null
    },
    frontOverlay: {
      type: String, // Realistic lighting overlay (optional)
      default: null
    },
    // Backside Assets (optional)
    backImage: {
      type: String,
      default: null
    },
    backMask: {
      type: String,
      default: null
    },
    backOverlay: {
      type: String,
      default: null
    },
    // Configuration for the Fabric.js canvas placement on the mockup
    canvasConfig: {
      width: { type: Number, default: 500 },
      height: { type: Number, default: 600 },
      offsetX: { type: Number, default: 0 }, // Relative offset from center
      offsetY: { type: Number, default: 0 },
      scale: { type: Number, default: 1 }
    },
    shapeConfig: { 
      type: mongoose.Schema.Types.Mixed, 
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

module.exports = mongoose.model('TwoDModel', twoDModelSchema);
