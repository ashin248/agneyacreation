const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createCategory, updateCategory, deleteCategory, getAdminCategories } = require('../../controllers/categoryController');
const { protectAdmin } = require('../../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', protectAdmin, getAdminCategories);
router.post('/', protectAdmin, upload.single('image'), createCategory);
router.put('/:id', protectAdmin, upload.single('image'), updateCategory);
router.delete('/:id', protectAdmin, deleteCategory);

module.exports = router;
