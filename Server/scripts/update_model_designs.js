require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const PhoneModel = require('../src/schema/PhoneModelSchema');

// Define Templates
const TEMPLATES = {
    IPHONE_SQUARE: { type: 'rounded-rect', x: 20, y: 20, width: 95, height: 95, rx: 25 },
    SAMSUNG_LENSES: { type: 'lenses', lenses: [{cx: 40, cy: 40, r: 16}, {cx: 40, cy: 85, r: 16}, {cx: 40, cy: 130, r: 16}] },
    VIVO_RECT: { type: 'rounded-rect', x: 20, y: 20, width: 85, height: 140, rx: 20 },
    XIAOMI_RECT: { type: 'rounded-rect', x: 20, y: 20, width: 90, height: 150, rx: 15 },
    ONEPLUS_CIRCLE: { type: 'circle', cx: 100, cy: 100, r: 55 },
    POCO_LARGE_RECT: { type: 'rounded-rect', x: 10, y: 20, width: 290, height: 90, rx: 15 }, // horizontal block
    PIXEL_BAR: { type: 'rounded-rect', x: 0, y: 60, width: 310, height: 50, rx: 0 },
    REALME_CIRCLE: { type: 'circle', cx: 155, cy: 120, r: 65 }, // Center circle
    DEFAULT_PILL: { type: 'rounded-rect', x: 20, y: 20, width: 45, height: 110, rx: 20 }
};

const getTemplateForModel = (brand, name) => {
    const lName = name.toLowerCase();
    const lBrand = brand.toLowerCase();

    if (lBrand === 'apple') {
        return TEMPLATES.IPHONE_SQUARE;
    }
    
    if (lBrand === 'samsung') {
        if (lName.includes('s2') || lName.includes('a5') || lName.includes('a3') || lName.includes('a1')) {
            return TEMPLATES.SAMSUNG_LENSES;
        }
        return { type: 'rounded-rect', x: 20, y: 20, width: 60, height: 130, rx: 15 };
    }

    if (lBrand === 'vivo') {
        if (lName.includes('x')) {
            return { type: 'circle', cx: 155, cy: 130, r: 75 }; // Vivo X series center circle
        }
        return TEMPLATES.VIVO_RECT;
    }

    if (lBrand === 'xiaomi' || lBrand === 'redmi') {
        if (lName.includes('note')) return TEMPLATES.XIAOMI_RECT;
        return { type: 'rounded-rect', x: 20, y: 20, width: 70, height: 100, rx: 20 };
    }

    if (lBrand === 'poco') {
        if (lName.includes('x') || lName.includes('m')) return TEMPLATES.POCO_LARGE_RECT;
        return TEMPLATES.XIAOMI_RECT;
    }

    if (lBrand === 'oneplus') {
        if (lName.includes('11') || lName.includes('12') || lName.includes('13')) return TEMPLATES.ONEPLUS_CIRCLE;
        return { type: 'rounded-rect', x: 20, y: 20, width: 60, height: 120, rx: 18 };
    }

    if (lBrand === 'realme') {
        if (lName.includes('12') || lName.includes('11 pro')) return TEMPLATES.REALME_CIRCLE;
        return { type: 'rounded-rect', x: 20, y: 20, width: 75, height: 130, rx: 15 };
    }

    if (lBrand === 'google' || lBrand === 'pixel') {
        return TEMPLATES.PIXEL_BAR;
    }

    // Fallback if none match
    return null;
};

const runUpdate = async () => {
    try {
        const uri = process.env.Server_DB_URL;
        console.log('Connecting to Atlas...');
        await mongoose.connect(uri);
        console.log('Connected.');

        const brands = await PhoneModel.find();
        let updatedCount = 0;

        for (const brandDoc of brands) {
            let changed = false;
            brandDoc.models = brandDoc.models.map(model => {
                // Determine new camera template
                const newCamera = getTemplateForModel(brandDoc.brand, model.name);
                
                // If we found a template and it's different from current (or it's the bad default one)
                if (newCamera) {
                    model.camera = newCamera;
                    changed = true;
                }
                return model;
            });

            if (changed) {
                await brandDoc.save();
                updatedCount++;
                console.log(`Updated models for brand: ${brandDoc.brandName || brandDoc.brand}`);
            }
        }

        console.log(`\nFinished updating! Modified ${updatedCount} brand collections.`);
        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

runUpdate();
