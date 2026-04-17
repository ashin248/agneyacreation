const Order = require('../src/schema/OrderSchema');
const User = require('../src/schema/UserSchema');
const Product = require('../src/schema/ProductSchema');
const CustomDesign = require('../src/schema/CustomDesignSchema');
const { WholesaleInquiry, B2BOrder } = require('../src/schema/BulkOrderSchema');

// Aggregate Global Statistics for KPI Cards
exports.getGlobalStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      productCounts,
      orderStats,
      b2bStats,
      inquiryCount,
      userStats
    ] = await Promise.all([
      Product.aggregate([
        { $unwind: "$variations" },
        {
          $group: {
            _id: null,
            totalProducts: { $addToSet: "$_id" },
            totalStock: { $sum: "$variations.stock" },
            lowStockCount: { $sum: { $cond: [{ $lt: ["$variations.stock", 5] }, 1, 0] } }
          }
        },
        { $project: { _id: 0, totalProductsCount: { $size: "$totalProducts" }, totalStock: 1, lowStockCount: 1 } }
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
            todayRevenue: { $sum: { $cond: [{ $gte: ["$createdAt", today] }, "$totalAmount", 0] } }
          }
        }
      ]),
      Order.countDocuments({ orderType: 'Bulk', orderStatus: { $ne: 'Delivered' } }),
      WholesaleInquiry.countDocuments({ status: 'New' }),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            verifiedBusiness: { $sum: { $cond: [{ $eq: ["$businessProfile.gstStatus", 'Approved'] }, 1, 0] } }
          }
        }
      ])
    ]);

    const stats = {
      totalProducts: productCounts[0]?.totalProductsCount || 0,
      totalStock: productCounts[0]?.totalStock || 0,
      lowStockCount: productCounts[0]?.lowStockCount || 0,
      totalRevenue: orderStats[0]?.totalRevenue || 0,
      todayRevenue: orderStats[0]?.todayRevenue || 0,
      totalOrders: orderStats[0]?.orderCount || 0,
      activeBulkOrders: b2bStats || 0,
      newInquiries: inquiryCount || 0,
      verifiedBusinessCount: userStats[0]?.verifiedBusiness || 0
    };

    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error("Global Stats Aggregation Error:", error);
    return res.status(500).json({ success: false, message: 'Failed to aggregate global business metrics.' });
  }
};


// Aggregate system-wide critical alerts for the Global Dashboard
exports.getSystemAlerts = async (req, res) => {
  try {
    // Execute all heavy aggregations concurrently avoiding sequential waterfall latency
    const [pendingOrdersCount, pendingGstCount, lowStockCount] = await Promise.all([
      Order.countDocuments({ orderStatus: 'Pending' }),
      User.countDocuments({ 'businessProfile.gstStatus': 'Pending' }),
      Product.countDocuments({ 'variations.stock': { $lt: 5 } })
    ]);

    const alerts = [];

    // Push High Priority: Pending GST
    if (pendingGstCount > 0) {
      alerts.push({
        id: 'gst-alert',
        type: 'warning',
        title: 'Pending B2B Verifications',
        message: `You have ${pendingGstCount} corporate customer request(s) awaiting GST approval.`,
        link: '/admin/gst-manager'
      });
    }

    // Push Medium Priority: Pending Orders
    if (pendingOrdersCount > 0) {
      alerts.push({
        id: 'order-alert',
        type: 'info',
        title: 'New Orders Awaiting Fulfillment',
        message: `${pendingOrdersCount} order(s) are stuck in the Pending state. Advance them into Processing.`,
        link: '/admin/orders/list'
      });
    }

    // Push Critical Priority: Low Stock
    if (lowStockCount > 0) {
      alerts.push({
        id: 'stock-alert',
        type: 'critical',
        title: 'Inventory Depleted',
        message: `${lowStockCount} product variation(s) have dropped critically low (Below 5 units).`,
        link: '/admin/products' // Standardized admin path
      });
    }

    return res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    console.error("Dashboard Alert Aggregation Error:", error);
    return res.status(500).json({ success: false, message: 'Failed to aggregate system notifications natively.' });
  }
};

// Aggregate custom design statuses for the Dashboard Graph
exports.getCustomDesignStats = async (req, res) => {
  try {
    const statuses = ['Pending', 'Approved', 'Rejected', 'In Production', 'Shipped', 'Delivered'];
    
    // Calculate Today's Submissions and Total
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [statusStats, todayCount, totalCount] = await Promise.all([
      Promise.all(statuses.map(async (status) => {
        const count = await CustomDesign.countDocuments({ status });
        return { name: status, count };
      })),
      CustomDesign.countDocuments({ createdAt: { $gte: today } }),
      CustomDesign.countDocuments()
    ]);

    return res.status(200).json({ 
        success: true, 
        data: {
            chartData: statusStats,
            todayCount,
            totalCount
        }
    });
  } catch (error) {
    console.error("Custom Design Stats Error:", error);
    return res.status(500).json({ success: false, message: 'Failed to fetch custom design statistics.' });
  }
};

// Aggregate top selling products
exports.getTopSellingProducts = async (req, res) => {
    try {
        const topProducts = await Order.aggregate([
            { $unwind: "$items" },
            { $group: {
                _id: "$items.productId",
                name: { $first: "$items.name" },
                totalSold: { $sum: "$items.quantity" },
                revenue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
                image: { $first: "$items.image" }
            }},
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);
        return res.status(200).json({ success: true, data: topProducts });
    } catch(err) {
        console.error("Top Products Error:", err);
        return res.status(500).json({ success: false, message: 'Failed to fetch top products.' });
    }
};
