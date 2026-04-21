require('dotenv').config();
const mongoose = require('mongoose');
const TwoDModel = require('./src/schema/TwoDModelSchema');

const fixLegacyModels = async () => {
    try {
        const uri = process.env.Server_DB_URL || process.env.Local_DB_URL;
        await mongoose.connect(uri);
        console.log("Connected to DB for cleanup...");

        const models = await TwoDModel.find({});
        console.log(`Checking ${models.length} models for broken assets...`);

        let fixCount = 0;
        for (const model of models) {
            let updated = false;

            // Check thumbnail
            if (model.thumbnail && (model.thumbnail.includes('-preview.png') || !model.thumbnail.startsWith('http'))) {
                model.thumbnail = `https://dummyimage.com/400x400/212121/ffffff.png&text=${encodeURIComponent(model.name || 'Agneya Model')}`;
                updated = true;
            }

            // Check frontImage
            if (model.frontImage && (model.frontImage.includes('-preview.png') || !model.frontImage.startsWith('http'))) {
                model.frontImage = `https://dummyimage.com/1000x1200/fafafa/0c0c2a.png&text=Base+Canvas+${encodeURIComponent(model.name || 'Agneya')}`;
                updated = true;
            }

            if (updated) {
                await model.save();
                fixCount++;
            }
        }

        console.log(`✅ Cleanup complete. Fixed ${fixCount} models with broken image paths.`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Cleanup failed:", err);
        process.exit(1);
    }
};

fixLegacyModels();
