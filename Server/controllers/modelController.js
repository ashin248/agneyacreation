const TwoDModel = require('../src/schema/TwoDModelSchema');
const cloudinary = require('cloudinary').v2;

// Create a new 2D model
exports.createTwoDModel = async (req, res) => {
  try {
    const { name, category, canvasConfig } = req.body;
    const files = req.files;

    if (!files || !files.frontImage) {
      return res.status(400).json({ message: 'Front image is required' });
    }

    // Upload images to Cloudinary
    const uploadToCloudinary = async (file, folder) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: `models/2d/${folder}` },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        uploadStream.end(file[0].buffer);
      });
    };

    const frontImageUrl = await uploadToCloudinary(files.frontImage, 'backdrops');
    const thumbnail = frontImageUrl; // Use backdrop as thumbnail for now

    let frontMaskUrl = null;
    if (files.frontMask) {
      frontMaskUrl = await uploadToCloudinary(files.frontMask, 'masks');
    }

    let frontOverlayUrl = null;
    if (files.frontOverlay) {
      frontOverlayUrl = await uploadToCloudinary(files.frontOverlay, 'overlays');
    }

    const newModel = new TwoDModel({
      name,
      category,
      thumbnail,
      frontImage: frontImageUrl,
      frontMask: frontMaskUrl,
      frontOverlay: frontOverlayUrl,
      canvasConfig: canvasConfig ? JSON.parse(canvasConfig) : undefined
    });

    await newModel.save();
    res.status(201).json(newModel);
  } catch (error) {
    console.error('Error creating 2D model:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Get all 2D models
exports.getAllTwoDModels = async (req, res) => {
  try {
    const models = await TwoDModel.find({ isActive: true });
    res.status(200).json(models);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching models', error: error.message });
  }
};

// Delete a model (Soft delete)
exports.deleteTwoDModel = async (req, res) => {
  try {
    await TwoDModel.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ message: 'Model removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting model', error: error.message });
  }
};
