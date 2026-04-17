const mongoose = require('mongoose');
const Order = require('./src/schema/OrderSchema');
const CustomDesign = require('./src/schema/CustomDesignSchema');
require('dotenv').config();

async function fixOrders() {
    await mongoose.connect(process.env.Local_DB_URL || 'mongodb://127.0.0.1:27017/agneya_DB');
    
    console.log("Starting Database Repair...");

    // 1. Update all Orders with Custom items to 'Paid'
    const orders = await Order.find({ orderType: { $in: ['Custom', 'Bulk', 'Mixed'] } });
    for (const order of orders) {
        order.paymentStatus = 'Paid';
        
        // Fix missing 'mode' if it looks like a manual custom order
        order.items.forEach(item => {
            if (item.itemType === 'Custom' && (!item.customData || !item.customData.mode)) {
                if (!item.customData) item.customData = {};
                // If it has designImage/attachments but no canvas data, it's Manual
                const isManual = !item.customData.frontCanvasData;
                item.customData.mode = isManual ? 'manual' : 'self';
                console.log(`- Fixed Mode for Order ${order.orderId}: Set to ${item.customData.mode}`);
            }
        });

        order.markModified('items');
        await order.save();
    }
    console.log(`Updated ${orders.length} orders to 'Paid'.`);

    // 2. Update all CustomDesign entries to 'Paid' and fix manual flag
    const designs = await CustomDesign.find();
    for (const d of designs) {
        d.isPaid = true;
        // If no canvas data, it must be a manual request
        if (!d.frontCanvasData) {
            d.isManual = true;
            console.log(`- Identified Manual Request for Design ID ${d._id}`);
        }
        await d.save();
    }
    console.log(`Updated ${designs.length} custom design entries.`);

    console.log("\nDATABASE SYNC COMPLETE. You can now refresh the Admin Panel.");
    process.exit(0);
}
fixOrders();
