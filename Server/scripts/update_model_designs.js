require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const PhoneModel = require('../src/schema/PhoneModelSchema');

const getDesignForModel = (brand, name) => {
    const lName = name.toLowerCase();
    const lBrand = brand.toLowerCase();

    // 1. Determine Shape (width, height, rx) based on phone size characteristics
    let width = 310;
    let height = 640;
    let rx = 35;

    if (lBrand === 'apple') {
        rx = 35;
        if (lName.includes('mini')) {
            width = 285;
            height = 580;
            rx = 30;
        } else if (lName.includes('max') || lName.includes('plus')) {
            width = 320;
            height = 660;
            rx = 38;
        } else if (lName.includes('pro')) {
            width = 305;
            height = 635;
            rx = 36;
        } else {
            width = 305;
            height = 635;
            rx = 36;
        }
    } else {
        if (lName.includes('ultra') || lName.includes('max') || lName.includes('plus') || lName.includes('fold') || lName.includes('note')) {
            width = 320;
            height = 665;
            rx = 32;
        } else if (lName.includes('mini') || lName.includes('lite') || lName.includes('compact')) {
            width = 295;
            height = 610;
            rx = 28;
        } else {
            width = 310;
            height = 640;
            rx = 30;
        }
    }

    const shape = { width, height, rx };

    // 2. Determine Camera
    let camera = { type: 'rounded-rect', x: 20, y: 20, width: 45, height: 110, rx: 20 }; // Default fallback

    if (lBrand === 'apple') {
        if (lName.includes('16') || lName.includes('17')) {
            // iPhone 16/17 Series: Vertical pill
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 45, height: 90, rx: 22.5 };
        } else if (lName.includes('11 pro') || lName.includes('12 pro') || lName.includes('13 pro') || lName.includes('14 pro') || lName.includes('15 pro')) {
            // Pro / Pro Max (iPhone 11-15): 3-lens Square
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 95, height: 95, rx: 25 };
        } else if (lName.includes('11') || lName.includes('12') || lName.includes('13') || lName.includes('14') || lName.includes('15')) {
            // iPhone 11-15 Non-pro: Square with 2 lenses
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 85, height: 85, rx: 20 };
        } else if (lName.includes('x') || lName.includes('xs') || lName.includes('xr')) {
            // iPhone X/XS/XR: Vertical pill
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 40, height: 80, rx: 20 };
        } else {
            // SE, 8, 7, etc. (Small horizontal or vertical pill)
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 40, height: 40, rx: 15 };
        }
    } 
    else if (lBrand === 'samsung') {
        if (lName.includes('s24 ultra') || lName.includes('s23 ultra') || lName.includes('s22 ultra')) {
            // Samsung Ultra Flagship layout (5 lenses)
            camera = {
                type: 'lenses',
                lenses: [
                    { cx: 35, cy: 35, r: 16 },
                    { cx: 35, cy: 75, r: 16 },
                    { cx: 35, cy: 115, r: 16 },
                    { cx: 75, cy: 55, r: 10 },
                    { cx: 75, cy: 95, r: 10 }
                ]
            };
        } else if (lName.includes('s2') || lName.includes('s20') || lName.includes('s21') || lName.includes('s22') || lName.includes('s23') || lName.includes('s24')) {
            // Samsung Galaxy S series: 3 lenses vertically separate
            camera = {
                type: 'lenses',
                lenses: [
                    { cx: 35, cy: 35, r: 15 },
                    { cx: 35, cy: 75, r: 15 },
                    { cx: 35, cy: 115, r: 15 }
                ]
            };
        } else if (lName.startsWith('a') || lName.startsWith('m') || lName.startsWith('f')) {
            // Galaxy A/M/F Series: Vertical rectangle camera bump
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 55, height: 130, rx: 18 };
        } else {
            // Fold, Flip, Older Notes
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 60, height: 120, rx: 15 };
        }
    } 
    else if (lBrand === 'oneplus') {
        if (lName.includes('11') || lName.includes('12') || lName.includes('13')) {
            // OnePlus 11/12/13: Circular camera bump offset to top-left
            camera = { type: 'circle', cx: 85, cy: 95, r: 50 };
        } else if (lName.includes('nord') || lName.includes('ce')) {
            // Nord series: Vertical rectangle camera bump in top-left
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 45, height: 115, rx: 15 };
        } else {
            // Older OnePlus: Center vertical bump
            camera = { type: 'rounded-rect', x: 135, y: 20, width: 40, height: 110, rx: 20 };
        }
    } 
    else if (lBrand === 'xiaomi' || lBrand === 'redmi') {
        if (lName.includes('ultra')) {
            // Xiaomi Ultra models: Huge centered camera block
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 270, height: 140, rx: 25 };
        } else {
            // Redmi/Xiaomi standard vertical bump
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 75, height: 120, rx: 18 };
        }
    } 
    else if (lBrand === 'poco') {
        if (lName.includes('x') || lName.includes('m') || lName.includes('f')) {
            // Poco: Big horizontal rectangular block spanning the top
            camera = { type: 'rounded-rect', x: 10, y: 20, width: 290, height: 95, rx: 18 };
        } else {
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 75, height: 120, rx: 18 };
        }
    } 
    else if (lBrand === 'vivo') {
        if (lName.includes('x')) {
            // Vivo X series flagships: Centered circular layout
            camera = { type: 'circle', cx: 155, cy: 110, r: 60 };
        } else {
            // Vivo V/Y/T series: Vertical rectangle
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 70, height: 125, rx: 15 };
        }
    } 
    else if (lBrand === 'realme') {
        if (lName.includes('pro') || lName.includes('12') || lName.includes('11') || lName.includes('13')) {
            // Realme Pro/Numbered series: Large center circle
            camera = { type: 'circle', cx: 155, cy: 115, r: 60 };
        } else {
            // Realme C series/standard: Rounded rectangle
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 70, height: 110, rx: 15 };
        }
    } 
    else if (lBrand === 'oppo') {
        if (lName.includes('find')) {
            // Oppo Find flagship: Center circular module
            camera = { type: 'circle', cx: 155, cy: 110, r: 55 };
        } else {
            // Oppo Reno / standard: Rounded vertical rectangle
            camera = { type: 'rounded-rect', x: 20, y: 20, width: 70, height: 120, rx: 18 };
        }
    } 
    else if (lBrand === 'iqoo') {
        // iQOO Signature Square/Rect layout
        camera = { type: 'rounded-rect', x: 20, y: 20, width: 85, height: 95, rx: 20 };
    } 
    else if (lBrand === 'infinix') {
        // Infinix: Large top-left rectangular layout
        camera = { type: 'rounded-rect', x: 20, y: 20, width: 90, height: 110, rx: 20 };
    } 
    else if (lBrand === 'google' || lBrand === 'pixel') {
        // Pixel: Signature horizontal camera bar spanning the entire width
        camera = { type: 'rounded-rect', x: 0, y: 65, width: width, height: 55, rx: 0 };
    } 
    else if (lBrand === 'tecno') {
        // Tecno: Large rectangular/square top-left layout
        camera = { type: 'rounded-rect', x: 20, y: 20, width: 85, height: 105, rx: 18 };
    } 
    else if (lBrand === 'nothing') {
        if (lName.includes('2a')) {
            // Nothing Phone 2a: Centered horizontal eyes
            camera = { type: 'rounded-rect', x: 115, y: 80, width: 80, height: 45, rx: 20 };
        } else {
            // Nothing Phone 1 & 2: Dual vertical lenses top-left
            camera = {
                type: 'lenses',
                lenses: [
                    { cx: 35, cy: 35, r: 14 },
                    { cx: 35, cy: 75, r: 14 }
                ]
            };
        }
    } 
    else if (lBrand === 'motorola') {
        // Motorola: Rounded vertical rectangle top-left
        camera = { type: 'rounded-rect', x: 20, y: 20, width: 65, height: 100, rx: 15 };
    }

    return { shape, camera };
};

const updateDBInstance = async (uri, name) => {
    try {
        console.log(`Connecting to ${name} Database...`);
        const conn = await mongoose.createConnection(uri).asPromise();
        console.log(`Connected to ${name} successfully.`);

        const Model = conn.model('PhoneModel', PhoneModel.schema);
        const brands = await Model.find();
        let totalUpdatedModels = 0;
        let updatedBrandCount = 0;

        for (const brandDoc of brands) {
            let changed = false;
            
            brandDoc.models = brandDoc.models.map(model => {
                const design = getDesignForModel(brandDoc.brand, model.name);
                
                if (design) {
                    model.shape = design.shape;
                    model.camera = design.camera;
                    changed = true;
                    totalUpdatedModels++;
                }
                return model;
            });

            if (changed) {
                await brandDoc.save();
                updatedBrandCount++;
            }
        }

        console.log(`Success [${name}]: Modified ${totalUpdatedModels} models across ${updatedBrandCount} brands.`);
        await conn.close();
    } catch (err) {
        console.error(`Error updating [${name}]:`, err.message);
    }
};

const runAllUpdates = async () => {
    const urls = [];
    if (process.env.Local_DB_URL) urls.push({ url: process.env.Local_DB_URL, name: 'Local Dev' });
    if (process.env.Server_DB_URL) urls.push({ url: process.env.Server_DB_URL, name: 'Production Atlas' });

    if (urls.length === 0) {
        console.error("No database URLs found in environmental config.");
        process.exit(1);
    }

    for (const item of urls) {
        await updateDBInstance(item.url, item.name);
    }

    console.log("\nAll database seeding completed.");
    process.exit(0);
};

runAllUpdates();
