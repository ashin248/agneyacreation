const { WholesaleInquiry, B2BApplication, CustomQuote, B2BOrder } = require('../../src/schema/BulkOrderSchema');
const Order = require('../../src/schema/OrderSchema');

exports.getInquiries = async (req, res) => {
    try {
        const inquiries = await WholesaleInquiry.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: inquiries });
    } catch (error) {
        console.error('Error fetching inquiries:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.updateInquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const inquiry = await WholesaleInquiry.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!inquiry) {
            return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }

        res.status(200).json({ success: true, message: 'Status updated successfully', data: inquiry });
    } catch (error) {
        console.error('Error updating inquiry status:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};


exports.getB2BApplications = async (req, res) => {
    try {
        const applications = await B2BApplication.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        console.error('Error fetching B2B applications:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.updateB2BApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const application = await B2BApplication.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        res.status(200).json({ success: true, message: 'Status updated successfully', data: application });
    } catch (error) {
        console.error('Error updating B2B application status:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};


exports.getQuotes = async (req, res) => {
    try {
        const quotes = await CustomQuote.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: quotes });
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching quotes', error: error.message });
    }
};

exports.createQuote = async (req, res) => {
    try {
        const { companyName, email, items, validUntil } = req.body;

        if (!companyName || !email || !items || !items.length) {
            return res.status(400).json({ success: false, message: 'Company name, email, and at least one item are required.' });
        }

        // Calculate totalValue automatically based on items
        let calculatedTotal = 0;
        const verifiedItems = items.map(item => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unitPrice) || 0;
            calculatedTotal += (qty * price);
            
            return {
                productName: item.productName,
                quantity: qty,
                unitPrice: price
            };
        });

        const newQuote = new CustomQuote({
            companyName,
            email,
            items: verifiedItems,
            totalValue: calculatedTotal,
            validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
        });

        await newQuote.save();
        
        res.status(201).json({ success: true, message: 'Quote generated successfully', data: newQuote });
    } catch (error) {
        console.error('Error creating quote:', error);
        res.status(500).json({ success: false, message: 'Server Error generating quote', error: error.message });
    }
};

exports.getB2BOrders = async (req, res) => {
    try {
        // Fetch from standard Order collection but filter for 'Bulk' type
        const orders = await Order.find({ orderType: 'Bulk' }).sort({ createdAt: -1 });
        
        // Map standard orders to the B2BOrder format expected by the frontend tracker
        const mappedOrders = orders.map(order => ({
            _id: order._id,
            orderId: order.orderId,
            companyName: order.gstDetails?.companyName || order.customer?.name || "Individual",
            customer: order.customer,
            orderType: order.orderType,
            totalAmount: order.totalAmount,
            productionStatus: order.orderStatus === 'Pending' ? 'Manufacturing' : 
                             (order.orderStatus === 'Processing' ? 'Quality Check' : 
                             (order.orderStatus === 'Shipped' ? 'Shipped' : 
                             (order.orderStatus === 'Delivered' ? 'Delivered' : 'Manufacturing'))),
            expectedDelivery: new Date(order.createdAt.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days default
            createdAt: order.createdAt,
            originalOrder: order // Keep full data for reference
        }));

        res.status(200).json({ success: true, data: mappedOrders });
    } catch (error) {
        console.error('Error fetching B2B orders:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching bulk orders', error: error.message });
    }
};

exports.updateB2BOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { productionStatus } = req.body;
        
        // Map tracker's productionStatus back to standard orderStatus
        let mappedStatus = 'Pending';
        if (productionStatus === 'Quality Check') mappedStatus = 'Processing';
        if (productionStatus === 'Shipped') mappedStatus = 'Shipped';
        if (productionStatus === 'Delivered') mappedStatus = 'Delivered';

        const order = await Order.findByIdAndUpdate(
            id,
            { orderStatus: mappedStatus },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({ success: true, message: 'Order status updated in system', data: order });
    } catch (error) {
        console.error('Error updating bulk order status:', error);
        res.status(500).json({ success: false, message: 'Server Error updating order', error: error.message });
    }
};

