const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const TwoDModel = require('../src/schema/TwoDModelSchema');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.Server_DB_URL || process.env.Local_DB_URL || 'mongodb://localhost:27017/agneya';

const models = [
  // Medals (Circle shapes)
  {
    name: "Gold Excellence Medal",
    category: "Medals",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "circle", radius: 200, borderColor: "#ffd700", strokeWidth: 10, overlayOpacity: 0.2 },
    canvasConfig: { width: 400, height: 400, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Silver Achievement Medal",
    category: "Medals",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "circle", radius: 200, borderColor: "#c0c0c0", strokeWidth: 10, overlayOpacity: 0.2 },
    canvasConfig: { width: 400, height: 400, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Bronze Participation Medal",
    category: "Medals",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "circle", radius: 200, borderColor: "#cd7f32", strokeWidth: 10, overlayOpacity: 0.2 },
    canvasConfig: { width: 400, height: 400, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Platinum Star Medal",
    category: "Medals",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "circle", radius: 250, borderColor: "#e5e4e2", strokeWidth: 12, overlayOpacity: 0.3 },
    canvasConfig: { width: 500, height: 500, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Golden Laurel Medal",
    category: "Medals",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "circle", radius: 220, borderColor: "#ffdf00", strokeWidth: 8, overlayOpacity: 0.25 },
    canvasConfig: { width: 440, height: 440, offsetX: 0, offsetY: 0, scale: 1 }
  },

  // Certificates (Rectangle shapes)
  {
    name: "Leadership Certificate",
    category: "Certificates",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "rectangle", width: 800, height: 600, borderColor: "#333", strokeWidth: 5, overlayOpacity: 0.1 },
    canvasConfig: { width: 800, height: 600, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Appreciation Certificate Landscape",
    category: "Certificates",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "rectangle", width: 1000, height: 750, borderColor: "#daa520", strokeWidth: 15, overlayOpacity: 0.1 },
    canvasConfig: { width: 1000, height: 750, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Appreciation Certificate Portrait",
    category: "Certificates",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "rectangle", width: 750, height: 1000, borderColor: "#daa520", strokeWidth: 15, overlayOpacity: 0.1 },
    canvasConfig: { width: 750, height: 1000, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Employee of the Month Certificate",
    category: "Certificates",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "rectangle", width: 900, height: 650, borderColor: "#2c3e50", strokeWidth: 8, overlayOpacity: 0.05 },
    canvasConfig: { width: 900, height: 650, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Completion Certificate",
    category: "Certificates",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "rectangle", width: 850, height: 600, borderColor: "#1abc9c", strokeWidth: 10, overlayOpacity: 0.1 },
    canvasConfig: { width: 850, height: 600, offsetX: 0, offsetY: 0, scale: 1 }
  },

  // Wooden Trophies (Rounded Rectangles / Polygons)
  {
    name: "Oak Rounded Trophy",
    category: "Wooden Trophies",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "rounded-rectangle", width: 300, height: 500, rx: 40, borderColor: "#8b5a2b", strokeWidth: 6, overlayOpacity: 0.4 },
    canvasConfig: { width: 300, height: 500, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Mahogany Shield Trophy",
    category: "Wooden Trophies",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "polygon", points: "200,0 400,0 400,400 200,600 0,400 0,0", borderColor: "#5c4033", strokeWidth: 8, overlayOpacity: 0.3 },
    canvasConfig: { width: 400, height: 600, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Pine Polygon Block",
    category: "Wooden Trophies",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "polygon", points: "100,0 300,0 400,200 300,400 100,400 0,200", borderColor: "#a0522d", strokeWidth: 5, overlayOpacity: 0.2 },
    canvasConfig: { width: 400, height: 400, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Teak Wide Plaque",
    category: "Wooden Trophies",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "rounded-rectangle", width: 600, height: 400, rx: 20, borderColor: "#8b4513", strokeWidth: 10, overlayOpacity: 0.15 },
    canvasConfig: { width: 600, height: 400, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Walnut Tall Award",
    category: "Wooden Trophies",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "rounded-rectangle", width: 250, height: 700, rx: 50, borderColor: "#654321", strokeWidth: 12, overlayOpacity: 0.25 },
    canvasConfig: { width: 250, height: 700, offsetX: 0, offsetY: 0, scale: 1 }
  },

  // Acrylics (Polygons / Rectangles / Shapes)
  {
    name: "Crystal Star Acrylic",
    category: "Acrylics",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "polygon", points: "250,0 100,500 500,180 0,180 400,500", borderColor: "#a8e6cf", strokeWidth: 3, overlayOpacity: 0.6 },
    canvasConfig: { width: 500, height: 500, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Diamond Edge Acrylic",
    category: "Acrylics",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "polygon", points: "250,0 500,250 250,500 0,250", borderColor: "#dcedc1", strokeWidth: 4, overlayOpacity: 0.5 },
    canvasConfig: { width: 500, height: 500, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Clear Obelisk Acrylic",
    category: "Acrylics",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "polygon", points: "150,0 250,0 300,600 100,600", borderColor: "#ffd3b6", strokeWidth: 2, overlayOpacity: 0.4 },
    canvasConfig: { width: 400, height: 600, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Modern Arch Acrylic",
    category: "Acrylics",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "rounded-rectangle", width: 400, height: 600, rx: 200, borderColor: "#ffaaa5", strokeWidth: 5, overlayOpacity: 0.5 },
    canvasConfig: { width: 400, height: 600, offsetX: 0, offsetY: 0, scale: 1 }
  },
  {
    name: "Sleek Plaque Acrylic",
    category: "Acrylics",
    thumbnail: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    frontImage: "https://i.ibb.co/3ykSj7d/acrylic-preview.png",
    shapeConfig: { type: "rectangle", width: 500, height: 350, borderColor: "#a2d5f2", strokeWidth: 6, overlayOpacity: 0.3 },
    canvasConfig: { width: 500, height: 350, offsetX: 0, offsetY: 0, scale: 1 }
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
