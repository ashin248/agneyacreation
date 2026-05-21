require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const PhoneModel = require('../src/schema/PhoneModelSchema');

const fetchModels = async () => {
    try {
        const uri = process.env.Server_DB_URL;
        await mongoose.connect(uri);
        const models = await PhoneModel.find().lean();
        fs.writeFileSync('models_dump.json', JSON.stringify(models, null, 2));
        console.log(`Saved ${models.length} brands to models_dump.json`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fetchModels();
