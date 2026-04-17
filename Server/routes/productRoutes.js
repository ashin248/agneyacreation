const express = require('express');
const multer = require('multer');
const { createBasicProduct } = require('../controllers/productController');

const router = express.Router();

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST route for creating a basic product
// Expected to receive multipart/form-data with 'images' field
router.post('/', upload.array('images', 10), createBasicProduct);

module.exports = router;
