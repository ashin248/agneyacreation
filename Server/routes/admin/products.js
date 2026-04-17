const express = require('express');
const multer = require('multer');
const { createProduct, getAllProducts, getProductById, getDashboardStats, deleteProduct, updateProduct } = require('../../controllers/productController');

const router = express.Router();

// ... existing configuration ...
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/stats', getDashboardStats);
router.get('/:id', getProductById);
router.get('/', getAllProducts);

// POST create
router.post('/', upload.any(), createProduct);

// PUT update
router.put('/:id', upload.any(), updateProduct);

// DELETE destroy
router.delete('/:id', deleteProduct);

module.exports = router;
