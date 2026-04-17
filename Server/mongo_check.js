const mongoose = require('mongoose');
const Order = require('./src/schema/OrderSchema');
const CustomDesign = require('./src/schema/CustomDesignSchema');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.Local_DB_URL || 'mongodb://127.0.0.1:27017/agneya_DB');
    
    console.log("LAST 3 ORDERS:");
    const lastOrders = await Order.find().sort({ createdAt: -1 }).limit(3);
    lastOrders.forEach(o => {
        console.log(`ID: ${o.orderId}, Status: ${o.paymentStatus}, Items: ${o.items.length}, Type: ${o.orderType}, Mode: ${o.items[0]?.customData?.mode}`);
    });

    console.log("\nLAST 3 CUSTOM DESIGNS:");
    const lastDesigns = await CustomDesign.find().sort({ createdAt: -1 }).limit(3);
    lastDesigns.forEach(d => {
        console.log(`ID: ${d._id}, Paid: ${d.isPaid}, Manual: ${d.isManual}, Product: ${d.productType}`);
    });

    process.exit(0);
}
check();
