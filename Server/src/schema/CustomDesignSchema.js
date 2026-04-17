const mongoose = require('mongoose');

const customDesignSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    designImage: {
        type: String,
        required: false // Storing Cloudinary URL (legacy/fallback)
    },
    appliedFrontDesign: {
        type: String,
        required: false // Storing Cloudinary URL for Front Design
    },
    appliedBackDesign: {
        type: String,
        required: false // Storing Cloudinary URL for Back Design
    },
    frontCanvasData: {
        type: mongoose.Schema.Types.Mixed,
        required: false // Storing raw 2D JSON payload and 3D Anchor coordinates
    },
    backCanvasData: {
        type: mongoose.Schema.Types.Mixed,
        required: false 
    },
    frontAnchors: {
        type: mongoose.Schema.Types.Mixed,
        required: false // Storing Three.js positional mapping for decals
    },
    backAnchors: {
        type: mongoose.Schema.Types.Mixed,
        required: false 
    },
    productType: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    address: {
        type: String,
        required: false
    },
    description: {
        type: String
    },
    isManual: {
        type: Boolean,
        default: false
    },
    adminNotes: {
        type: String,
        default: ''
    },
    printAssets: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'In Production', 'Shipped', 'Delivered', 'Draft'],
        default: 'Pending'
    },
    orderRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: false
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    estimatedDeliveryDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('CustomDesign', customDesignSchema);
