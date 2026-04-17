const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Load env variables if not already loaded (useful for standalone scripts, otherwise handled by app.js)
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
