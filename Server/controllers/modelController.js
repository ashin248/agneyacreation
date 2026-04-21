const TwoDModel = require('../src/schema/TwoDModelSchema');
const cloudinary = require('../config/cloudinary');

const sendDebugLog = (hypothesisId, location, message, data = {}, runId = 'initial') => {
  // #region agent log
  if (typeof fetch === 'function') {
    fetch('http://127.0.0.1:7742/ingest/f73f9efc-7d57-444d-946a-342d190e0162',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8362af'},body:JSON.stringify({sessionId:'8362af',runId,hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  }
  // #endregion
};

const getErrorMessage = (error, fallbackMessage) => {
  if (!error) return fallbackMessage;
  if (error.message) return error.message;
  return fallbackMessage;
};

// Create a new 2D model
exports.createTwoDModel = async (req, res) => {
  try {
    console.log('[DBG H7] createTwoDModel hit', {
      hasBody: !!req.body,
      hasFiles: !!req.files,
      fileKeys: req.files ? Object.keys(req.files) : []
    });
    const { name, category, canvasConfig } = req.body;
    const files = req.files;

    if (!files || !files.frontImage) {
      return res.status(400).json({ success: false, message: 'Front image is required.' });
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
    res.status(201).json({ success: true, data: newModel });
  } catch (error) {
    console.error('Error creating 2D model:', error);
    res.status(500).json({
      success: false,
      message: `Failed to create 2D model: ${getErrorMessage(error, 'Internal Server Error')}`
    });
  }
};

// Get all 2D models
exports.getAllTwoDModels = async (req, res) => {
  try {
    const models = await TwoDModel.find({ isActive: true });
    console.log('[DBG H6] getAllTwoDModels result', { modelCount: models.length });
    sendDebugLog('H6', 'modelController.js:getAllTwoDModels', 'Returned active 2D models', {
      modelCount: models.length,
      missingThumbnailCount: models.filter(m => !m?.thumbnail).length
    });
    res.status(200).json({ success: true, data: models });
  } catch (error) {
    console.error('Error fetching 2D models:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching models: ${getErrorMessage(error, 'Internal Server Error')}`
    });
  }
};

// Delete a model (Soft delete)
exports.deleteTwoDModel = async (req, res) => {
  try {
    const updatedModel = await TwoDModel.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!updatedModel) {
      return res.status(404).json({ success: false, message: 'Model not found.' });
    }

    res.status(200).json({ success: true, message: 'Model removed successfully.' });
  } catch (error) {
    console.error('Error deleting 2D model:', error);
    res.status(500).json({
      success: false,
      message: `Error deleting model: ${getErrorMessage(error, 'Internal Server Error')}`
    });
  }
};
