const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const TwoDModel = require('../src/schema/TwoDModelSchema');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agneya';

const models = [
  {
    name: "Modern Acrylic House Nameplate",
    category: "Acrylics",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    canvasConfig: { width: 800, height: 400, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Classic Wooden Photo Frame (8x10)",
    category: "Photo Frames",
    thumbnail: "https://i.ibb.co/QjZ9Y3h/frame-preview.png",
    frontImage: "https://i.ibb.co/QjZ9Y3h/frame-preview.png",
    canvasConfig: { width: 800, height: 1000, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Minimalist Visiting Card",
    category: "Cards",
    thumbnail: "https://i.ibb.co/9vD0H6T/card-preview.png",
    frontImage: "https://i.ibb.co/9vD0H6T/card-preview.png",
    canvasConfig: { width: 1050, height: 600, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Premium Executive Pen",
    category: "Stationery",
    thumbnail: "https://i.ibb.co/p33mB3w/pen-preview.png",
    frontImage: "https://i.ibb.co/p33mB3w/pen-preview.png",
    canvasConfig: { width: 600, height: 100, offsetX: 0, offsetY: 50, scale: 1 }
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');
    
    // Clear existing (optional, but good for dev)
    // await TwoDModel.deleteMany({});
    
    for (const modelData of models) {
      const model = new TwoDModel(modelData);
      await model.save();
      console.log(`Seeded model: ${model.name}`);
    }
    
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedDB();
