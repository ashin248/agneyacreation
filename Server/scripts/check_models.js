require('dotenv').config();
const mongoose = require('mongoose');
const PhoneModel = require('../src/schema/PhoneModelSchema');

const checkDB = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.Local_DB_URL || process.env.Server_DB_URL;
        console.log('Connecting to:', uri ? uri.replace(/\/\/.*@/, '//***:***@') : 'undefined');
        await mongoose.connect(uri);
        console.log('Connected to DB');
        const count = await PhoneModel.countDocuments();
        console.log(`PhoneModel count: ${count}`);
        const activeCount = await PhoneModel.countDocuments({ isActive: true });
        console.log(`Active PhoneModel count: ${activeCount}`);
        
        if (count > 0) {
            const sample = await PhoneModel.find().limit(5);
            console.log('Sample records:', JSON.stringify(sample, null, 2));
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkDB();
