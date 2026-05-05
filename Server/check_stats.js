const mongoose = require('mongoose');
const Product = require('./src/schema/ProductSchema');
async function checkStats() {
    await mongoose.connect('mongodb://127.0.0.1:27017/agneya');
    const hasSales = await Product.exists({ salesCount: { $gt: 0 } });
    const hasViews = await Product.exists({ viewCount: { $gt: 0 } });
    const hasTrending = await Product.exists({ isTrending: true });
    console.log({ hasSales, hasViews, hasTrending });
    mongoose.disconnect();
}
checkStats();
