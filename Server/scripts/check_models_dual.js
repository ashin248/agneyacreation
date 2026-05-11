require('dotenv').config();
const mongoose = require('mongoose');
const PhoneModel = require('../src/schema/PhoneModelSchema');

const checkDB = async () => {
    const urls = [
        { name: 'Local', url: process.env.Local_DB_URL },
        { name: 'Server', url: process.env.Server_DB_URL }
    ];

    for (const item of urls) {
        if (!item.url) {
            console.log(`${item.name} URL not defined`);
            continue;
        }
        try {
            console.log(`\n--- Checking ${item.name} DB ---`);
            const conn = await mongoose.createConnection(item.url).asPromise();
            const Model = conn.model('PhoneModel', PhoneModel.schema);
            const count = await Model.countDocuments();
            console.log(`PhoneModel count: ${count}`);
            const activeCount = await Model.countDocuments({ isActive: true });
            console.log(`Active PhoneModel count: ${activeCount}`);
            await conn.close();
        } catch (err) {
            console.error(`Error checking ${item.name} DB:`, err.message);
        }
    }
    process.exit(0);
};

checkDB();
