require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const TwoDModel = require('./src/schema/TwoDModelSchema');

// Utility to generate a sequence of names
const generateItems = (category, prefixes, shapes, count) => {
    const items = [];
    for (let i = 1; i <= count; i++) {
        const prefix = prefixes[i % prefixes.length];
        const shape = shapes[i % shapes.length];
        
        // Defaults
        let shapeConfig = { type: 'rectangle', width: 400, height: 600, rx: 0 };
        let canvasConfig = { width: 500, height: 600, offsetX: 0, offsetY: 0, scale: 1 };
        
        if (shape === 'Circle') {
            shapeConfig = { type: 'circle', radius: 200, overlayOpacity: 0.1 };
            canvasConfig = { width: 400, height: 400, offsetX: 0, offsetY: 0, scale: 1 };
        } else if (shape === 'Rounded') {
            shapeConfig = { type: 'rounded-rectangle', width: 350, height: 500, rx: 20, overlayOpacity: 0.1 };
            canvasConfig = { width: 400, height: 600, offsetX: 0, offsetY: 0, scale: 1 };
        } else if (shape === 'Square') {
            shapeConfig = { type: 'rectangle', width: 400, height: 400, rx: 0, overlayOpacity: 0.1 };
            canvasConfig = { width: 400, height: 400, offsetX: 0, offsetY: 0, scale: 1 };
        } else if (shape === 'Shield') {
            shapeConfig = { 
                type: 'polygon', 
                points: '250,50 450,150 400,450 250,550 100,450 50,150',
                overlayOpacity: 0.1
            };
            canvasConfig = { width: 500, height: 600, offsetX: 0, offsetY: 0, scale: 1 };
        } else if (shape === 'Card') {
            shapeConfig = { type: 'rounded-rectangle', width: 340, height: 540, rx: 15, overlayOpacity: 0.1 };
            canvasConfig = { width: 340, height: 540, offsetX: 0, offsetY: 0, scale: 1 };
        }

        const itemName = `${prefix} ${category} - ${shape} ${String(i).padStart(2, '0')}`;
        
        items.push({
            name: itemName,
            category: category,
            thumbnail: `https://dummyimage.com/400x400/212121/ffffff.png&text=${encodeURIComponent(itemName.substring(0,25))}`,
            frontImage: `https://dummyimage.com/1000x1200/fafafa/0c0c2a.png&text=Base+Canvas+${encodeURIComponent(itemName)}`,
            frontMask: null,
            frontOverlay: null, // Let studio apply SVG styling overlays cleanly
            canvasConfig,
            shapeConfig,
            isActive: true
        });
    }
    return items;
};

const runSeed = async () => {
    await connectDB();

    console.log("Generating 2D Model Configurations...");

    const allModels = [
        ...generateItems('Acrylic Awards', ['Premium Standard', 'Diamond Edge', 'Classic Frosted', 'Gold Base', 'Silver Crest'], ['Circle', 'Rectangle', 'Shield', 'Square'], 30),
        ...generateItems('Wooden Plaques', ['Mahogany', 'Oak Standard', 'Pine Engraved', 'Walnut Crest', 'Rosewood Premium'], ['Rectangle', 'Rounded', 'Shield'], 30),
        ...generateItems('Drinkware', ['Ceramic Mug', 'Travel Sipper', 'Steel Flask', 'Coffee Tumbler', 'Magic Mug'], ['Rectangle', 'Rounded'], 30),
        ...generateItems('Identity Cards & Lanyards', ['Standard Employee', 'Visitor Pass', 'Premium Leather Holder', 'Event Badge'], ['Card', 'Rounded'], 20),
        ...generateItems('Stationery & Diaries', ['A4 Notebook', 'A5 Spiral Diary', 'Executive Journal', 'Leather Pocket Diary'], ['Rectangle', 'Rounded'], 20),
        ...generateItems('Apparel', ['Cotton T-Shirt (Left Pocket)', 'Premium Polo', 'Sports Jersey', 'Basic Hoodie (Front)', 'Cap (Front Logo)'], ['Rectangle', 'Circle', 'Square'], 20),
        ...generateItems('Photo Frames & Canvas', ['Wall Canvas Print', 'Desktop Frame', 'Panoramic Wall Art', 'Collage Grid Area'], ['Rectangle', 'Square'], 30),
        ...generateItems('Keychains & Badges', ['Acrylic Keychain', 'Metal Engraved Pin', 'Button Badge', 'Wooden Keychain'], ['Circle', 'Square', 'Rounded'], 20),
    ];

    console.log(`Prepared ${allModels.length} models. Proceeding to insert...`);

    try {
        const result = await TwoDModel.insertMany(allModels);
        console.log(`✅ Success! Inserted ${result.length} new 2D Models into the library.`);
    } catch (err) {
        console.error("❌ Seeding Error:", err.message || err);
    } finally {
        mongoose.connection.close();
        console.log("Database connection closed.");
    }
};

runSeed();
