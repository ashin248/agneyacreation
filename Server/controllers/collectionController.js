const Collection = require('../src/schema/CollectionSchema');
const { uploadToCloudinary } = require('../services/uploadService');

// @desc    Get all collections
// @route   GET /api/public/collections
// @access  Public
exports.getCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: collections });
  } catch (err) {
    console.error('Error fetching collections:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new collection
// @route   POST /api/admin/collections
// @access  Private (Admin)
exports.createCollection = async (req, res) => {
  try {
    const { name, description } = req.body;
    let logoUrl = req.body.logoUrl;

    if (req.file) {
      logoUrl = await uploadToCloudinary(req.file.buffer, 'collections/logos');
    }

    if (!logoUrl) {
      return res.status(400).json({ success: false, message: 'Logo is required' });
    }

    const existing = await Collection.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Collection already exists' });
    }

    const collection = new Collection({
      name,
      logoUrl,
      description,
      isActive: true
    });

    await collection.save();
    res.status(201).json({ success: true, data: collection });
  } catch (err) {
    console.error('Error creating collection:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update collection
// @route   PUT /api/admin/collections/:id
// @access  Private (Admin)
exports.updateCollection = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    let updateData = { name, description, isActive };

    if (req.file) {
      updateData.logoUrl = await uploadToCloudinary(req.file.buffer, 'collections/logos');
    }

    const collection = await Collection.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }
    res.status(200).json({ success: true, data: collection });
  } catch (err) {
    console.error('Error updating collection:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete collection
// @route   DELETE /api/admin/collections/:id
// @access  Private (Admin)
exports.deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findByIdAndDelete(req.params.id);
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }
    res.status(200).json({ success: true, message: 'Collection removed' });
  } catch (err) {
    console.error('Error deleting collection:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
