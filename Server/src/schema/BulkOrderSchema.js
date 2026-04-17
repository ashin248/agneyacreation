const mongoose = require('mongoose');

const wholesaleInquirySchema = new mongoose.Schema({
    contactName: { type: String, required: true },
    companyName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    productOfInterest: { type: String, required: true },
    estimatedQuantity: { type: Number, required: true },
    message: { type: String, required: true },
    assignedTo: { type: String, default: 'Unassigned' },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Quote Sent', 'Closed'],
        default: 'New'
    }
}, { timestamps: true });

const b2bApplicationSchema = new mongoose.Schema({
    businessName: { type: String, required: true },
    applicantName: { type: String, required: true },
    email: { type: String, required: true },
    taxId: { type: String, required: true },
    businessType: { type: String, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    }
}, { timestamps: true });

const customQuoteSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    email: { type: String, required: true },
    items: [{
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 }
    }],
    totalValue: { type: Number },
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Accepted', 'Rejected'],
        default: 'Sent'
    },
    validUntil: { type: Date }
}, { timestamps: true });

const b2bOrderSchema = new mongoose.Schema({
    orderId: { 
        type: String, 
        required: true, 
        unique: true, 
        default: () => {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `B2B-${year}${month}${day}-${Math.floor(1000 + Math.random() * 9000)}`;
        }
    },
    companyName: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    productionStatus: {
        type: String,
        enum: ['Manufacturing', 'Quality Check', 'Ready for Freight', 'Shipped', 'Delivered'],
        default: 'Manufacturing'
    },
    expectedDelivery: { type: Date }
}, { timestamps: true });

module.exports = {
    WholesaleInquiry: mongoose.model('WholesaleInquiry', wholesaleInquirySchema),
    B2BApplication: mongoose.model('B2BApplication', b2bApplicationSchema),
    CustomQuote: mongoose.model('CustomQuote', customQuoteSchema),
    B2BOrder: mongoose.model('B2BOrder', b2bOrderSchema)
};
