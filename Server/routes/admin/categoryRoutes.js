const express = require('express');
const router = express.Router();
const { createCategory, updateCategory, deleteCategory, getCategories } = require('../../controllers/categoryController');
const { protectAdmin } = require('../../middleware/authMiddleware');

router.get('/', protectAdmin, getCategories);
router.post('/', protectAdmin, createCategory);
router.put('/:id', protectAdmin, updateCategory);
router.delete('/:id', protectAdmin, deleteCategory);

module.exports = router;
