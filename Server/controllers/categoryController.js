const Category = require('../src/schema/CategorySchema');
const { uploadToCloudinary } = require('../services/uploadService');

// @desc    Get all active categories (public)
// @route   GET /api/public/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all categories including inactive ones (admin)
// @route   GET /api/admin/categories
// @access  Private (Admin)
exports.getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    console.error('Error fetching admin categories:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add a new category
// @route   POST /api/admin/categories
// @access  Private (Admin)
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    let imageUrl = req.body.imageUrl || null;

    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, 'categories/icons');
    }

    const isActive = req.body.isActive === undefined ? true : (req.body.isActive === 'true' || req.body.isActive === true);

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = new Category({ name, imageUrl, description, isActive });
    await category.save();
    
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const isActive = req.body.isActive === undefined ? undefined : (req.body.isActive === 'true' || req.body.isActive === true);

    let updateData = { name, description };
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    if (req.body.imageUrl !== undefined) {
      updateData.imageUrl = req.body.imageUrl;
    }

    if (req.file) {
      updateData.imageUrl = await uploadToCloudinary(req.file.buffer, 'categories/icons');
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, message: 'Category removed' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
