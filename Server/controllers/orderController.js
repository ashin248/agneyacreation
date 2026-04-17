const Order = require('../src/schema/OrderSchema');
const mongoose = require('mongoose');

// Fetch 5 most recent orders for Dashboard
exports.getRecentOrders = async (req, res) => {
  try {
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    return res.status(200).json({ success: true, data: recentOrders });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch recent orders.' });
  }
};

// Fetch 7-day Sales Analytics via Aggregation Pipeline
exports.getSalesAnalytics = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const analyticsData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Calculate Today's Revenue and Absolute Total
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [todayStats, totalStats] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } }
      ]),
      Order.aggregate([
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } }
      ])
    ]);

    const todayRevenue = (todayStats.length > 0) ? todayStats[0].revenue : 0;
    const allTimeRevenue = (totalStats.length > 0) ? totalStats[0].revenue : 0;

    // Format data iteratively to ensure empty days map to 0
    const formattedData = [];
    for (let i = 0; i < 7; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - (6 - i));
        const dateString = targetDate.toISOString().split('T')[0];
        const shortDateStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const existingData = analyticsData.find(item => item._id === dateString);
        formattedData.push({
            date: dateString,
            displayDate: shortDateStr,
            revenue: existingData ? existingData.totalRevenue : 0,
            orders: existingData ? existingData.orderCount : 0
        });
    }

    return res.status(200).json({ 
        success: true, 
        data: {
            chartData: formattedData,
            todayRevenue,
            allTimeRevenue
        }
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate analytics.' });
  }
};

// Fetch all orders sorted by newest first
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

// Fetch a single order perfectly targeting standard Mongoose queries natively via req.param
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching single order:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch order.' });
  }
};

// Update order status gracefully
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Safety check enforcing strict Enum constraints if necessary
    const validStatuses = ['Pending', 'Processing', 'Printing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status provided.' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id, 
      { orderStatus: status }, 
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.status(200).json({ success: true, message: 'Order status updated securely!', data: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
};

