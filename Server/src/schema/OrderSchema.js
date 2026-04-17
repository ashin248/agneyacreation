const mongoose = require('mongoose');

// Item Sub-schema defining items in the cart (mixed ready and custom)
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  itemType: {
    type: String,
    enum: ['Ready', 'Custom'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: false
  },
  designImage: {
    type: String,
    required: false
  },
  discountApplied: {
    type: Number,
    default: 0
  },
  selectedVariation: {
    type: Object,
    default: null
  },
  // Exclusive fields for custom items
  customData: {
    type: Object,
    default: {}
  }
});

// Main Order Schema
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    default: () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `ORD-${year}${month}${day}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    shippingAddress: { type: String, required: true }
  },
  orderType: {
    type: String,
    enum: ['Standard', 'Custom', 'Mixed', 'Bulk'],
    required: true
  },
  gstDetails: {
    companyName: { type: String, default: null },
    gstNumber: { type: String, default: null }
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Pending Review'],
    default: 'Pending'
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Printing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
