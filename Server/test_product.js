const mongoose = require('mongoose');
const Product = require('./src/schema/ProductSchema');
async function test() {
    await mongoose.connect('mongodb://127.0.0.1:27017/agneya');
    const p = await Product.findOne();
    console.log(p.viewCount, p.salesCount, p.isTrending);
    mongoose.disconnect();
}
test();
