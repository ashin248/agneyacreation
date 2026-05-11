const Product = require('../src/schema/ProductSchema');
const { processProductUploads } = require('../services/uploadService');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    
    // Aggregate to calculate total stock and count of low stock products efficiently
    const aggregationResult = await Product.aggregate([
      { $unwind: "$variations" }, // Unwind the variations array
      {
        $group: {
          _id: null,
          totalStock: { $sum: "$variations.stock" }, // Sum all stock
          lowStockCount: {
            $sum: { $cond: [{ $lt: ["$variations.stock", 5] }, 1, 0] } // Count items where stock < 5
          }
        }
      }
    ]);

    const stats = {
      totalProducts,
      totalStock: aggregationResult.length > 0 ? aggregationResult[0].totalStock : 0,
      lowStockCount: aggregationResult.length > 0 ? aggregationResult[0].lowStockCount : 0
    };

    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics.' });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { category, limit } = req.query;
    let query = {};
    if (category && category !== 'All') {
      query.category = category;
    }

    let productsQuery = Product.find(query).sort({ createdAt: -1 });
    
    if (limit) {
      productsQuery = productsQuery.limit(parseInt(limit));
    }

    const products = await productsQuery;
    return res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products due to an internal server error.'
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.createProduct = async (req, res) => {
  try {


    // 1. Extract Basic Fields (flat properties)
    const { name, description, category, productType, originalPrice, basePrice, gstRate, minOrder, isBulkEnabled, isCustomizable, customizationType } = req.body;

    // 2. Safely parse JSON arrays for Variations and Bulk Rules
    let variations = [];
    let bulkRules = [];

    if (req.body.variations) {
      try {
        variations = JSON.parse(req.body.variations);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid variations format.' });
      }
    }

    if (req.body.bulkRules) {
      try {
        bulkRules = JSON.parse(req.body.bulkRules);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid bulkRules format.' });
      }
    }

    let shapeConfig = null;
    if (req.body.shapeConfig) {
      try {
        shapeConfig = JSON.parse(req.body.shapeConfig);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid shapeConfig format.' });
      }
    }

    let linkedTemplates = [];
    if (req.body.linkedTemplates) {
      try {
        const parsed = JSON.parse(req.body.linkedTemplates);
        linkedTemplates = Array.isArray(parsed) ? parsed.map(id => ({ templateId: id, overrideImageUrl: null })) : [];
      } catch (e) {
        console.warn('Malformed linkedTemplates received:', req.body.linkedTemplates);
      }
    }

    let twoDModels = [];
    if (req.body.twoDModels) {
      try {
        twoDModels = JSON.parse(req.body.twoDModels);
      } catch (e) {
        console.warn('Malformed twoDModels');
      }
    }

    // Convert boolean string
    const bulkActive = isBulkEnabled === 'true' || isBulkEnabled === true;

    // 3. Image Sorting & Uploading Variables using central service
    const { 
        galleryImageUrls, 
        blankFrontImageUrl, 
        frontMaskImageUrl, 
        frontOverlayImageUrl, 
        blankBackImageUrl, 
        backMaskImageUrl, 
        backOverlayImageUrl, 
        base3DModelUrl 
    } = await processProductUploads(req.files, variations, linkedTemplates, twoDModels);

    // 4. Construct Final DB Payloads
    const productPayload = {
      name,
      description,
      category,
      productType,
      originalPrice: Number(originalPrice || 0),
      basePrice: Number(basePrice),
      gstRate: Number(gstRate),
      minOrder: Number(minOrder || 1),
      galleryImages: galleryImageUrls,
      
      variations: variations, // Already has .imageUrl mapping attached via Promise.all
      isBulkEnabled: bulkActive,
      bulkRules: bulkActive ? bulkRules : [],

      isCustomizable: isCustomizable === 'true' || isCustomizable === true,
      customizationType: customizationType || 'None',
      baseModelId: req.body.baseModelId || null,
      base2DTemplateId: req.body.base2DTemplateId || null,
      base3DModelUrl: base3DModelUrl || req.body.base3DModelUrl || null,
      blankFrontImage: blankFrontImageUrl || req.body.blankFrontImage || null,
      frontMaskImage: frontMaskImageUrl || req.body.frontMaskImage || null,
      frontOverlayImage: frontOverlayImageUrl || req.body.frontOverlayImage || null,
      blankBackImage: blankBackImageUrl || req.body.blankBackImage || null,
      backMaskImage: backMaskImageUrl || req.body.backMaskImage || null,
      backOverlayImage: backOverlayImageUrl || req.body.backOverlayImage || null,
      shapeConfig: shapeConfig,
      canvasConfig: req.body.canvasConfig ? JSON.parse(req.body.canvasConfig) : null,
      linkedTemplates: linkedTemplates,
      twoDModels: twoDModels,
      isActive: true, // Auto-active default
    };

    // 5. Database Save
    const newProduct = new Product(productPayload);
    const savedProduct = await newProduct.save();

    return res.status(201).json({
      success: true,
      message: 'Product entirely created with images securely mapped.',
      productId: savedProduct._id
    });

  } catch (error) {
    console.error('Error creating product:', error);
    
    // 1. Handle Duplicate Key Error (e.g. SKU conflict)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(409).json({
        success: false,
        message: `Conflict Detected: The ${field} '${value}' is already in use by another product. Try a unique name or sku.`
      });
    }

    // 2. Handle Mongoose Validation Error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: `Validation Failed: ${messages.join(', ')}`
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create product due to an internal server error.',
      debugError: error.message,
      debugStack: error.stack
    });
  }
};

// Delete product securely mapping internal ID parametrically
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};

// Update product logic (Partial/Full mapping parameterized via req.body and req.files)
exports.updateProduct = async (req, res) => {
    try {


        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

        const { name, description, category, productType, originalPrice, basePrice, gstRate, minOrder, isBulkEnabled, isCustomizable, customizationType } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (category) updateData.category = category;
        if (productType) updateData.productType = productType;
        if (originalPrice !== undefined) updateData.originalPrice = Number(originalPrice || 0);
        if (basePrice !== undefined) updateData.basePrice = Number(basePrice);
        if (gstRate !== undefined) updateData.gstRate = Number(gstRate);
        if (minOrder !== undefined) updateData.minOrder = Number(minOrder || 1);
        if (isBulkEnabled !== undefined) updateData.isBulkEnabled = isBulkEnabled === 'true' || isBulkEnabled === true;
        if (isCustomizable !== undefined) updateData.isCustomizable = isCustomizable === 'true' || isCustomizable === true;
        if (customizationType) updateData.customizationType = customizationType;

        if (req.body.variations) {
           try { updateData.variations = JSON.parse(req.body.variations); } catch(e){}
        }
        if (req.body.bulkRules) {
           try { updateData.bulkRules = JSON.parse(req.body.bulkRules); } catch(e){}
        }
        if (req.body.shapeConfig) {
           try { updateData.shapeConfig = JSON.parse(req.body.shapeConfig); } catch(e){}
        }
        if (req.body.canvasConfig) {
           try { updateData.canvasConfig = JSON.parse(req.body.canvasConfig); } catch(e){}
        }
        if (req.body.linkedTemplates) {
           try { 
              const parsed = JSON.parse(req.body.linkedTemplates);
              if (Array.isArray(parsed)) {
                  updateData.linkedTemplates = parsed.map(id => {
                      const existing = (product.linkedTemplates || []).find(t => t.templateId === id);
                      return {
                          templateId: id,
                          overrideImageUrl: existing ? existing.overrideImageUrl : null
                      };
                  });
              }
           } catch(e){}
        }

        let twoDModelsUpdate = [];
        if (req.body.twoDModels) {
           try {
              twoDModelsUpdate = JSON.parse(req.body.twoDModels);
              // For update, we might want to just replace or merge. Let's just replace the whole array
              updateData.twoDModels = twoDModelsUpdate;
           } catch(e){}
        }
        
        if (req.body.blankFrontImage) updateData.blankFrontImage = req.body.blankFrontImage;
        if (req.body.frontMaskImage) updateData.frontMaskImage = req.body.frontMaskImage;
        if (req.body.frontOverlayImage) updateData.frontOverlayImage = req.body.frontOverlayImage;
        if (req.body.blankBackImage) updateData.blankBackImage = req.body.blankBackImage;
        if (req.body.backMaskImage) updateData.backMaskImage = req.body.backMaskImage;
        if (req.body.backOverlayImage) updateData.backOverlayImage = req.body.backOverlayImage;
        if (req.body.base2DTemplateId) updateData.base2DTemplateId = req.body.base2DTemplateId;
        if (req.body.baseModelId) updateData.baseModelId = req.body.baseModelId;

        let galleryImageUrls = req.body.existingGalleryImages ? JSON.parse(req.body.existingGalleryImages) : (product.galleryImages || []);
        
        const uploadResults = await processProductUploads(req.files, updateData.variations, updateData.linkedTemplates, updateData.twoDModels);
        
        if (uploadResults.blankFrontImageUrl) updateData.blankFrontImage = uploadResults.blankFrontImageUrl;
        if (uploadResults.frontMaskImageUrl) updateData.frontMaskImage = uploadResults.frontMaskImageUrl;
        if (uploadResults.frontOverlayImageUrl) updateData.frontOverlayImage = uploadResults.frontOverlayImageUrl;
        if (uploadResults.blankBackImageUrl) updateData.blankBackImage = uploadResults.blankBackImageUrl;
        if (uploadResults.backMaskImageUrl) updateData.backMaskImage = uploadResults.backMaskImageUrl;
        if (uploadResults.backOverlayImageUrl) updateData.backOverlayImage = uploadResults.backOverlayImageUrl;
        if (uploadResults.base3DModelUrl) {
            updateData.base3DModelUrl = uploadResults.base3DModelUrl;
        }

        updateData.galleryImages = [...galleryImageUrls, ...uploadResults.galleryImageUrls];

        const updatedProduct = await Product.findByIdAndUpdate(id, { $set: updateData }, { new: true });
        return res.status(200).json({ success: true, data: updatedProduct, message: 'Product updated successfully.' });
    } catch (error) {
        console.error('Error updating product:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const value = error.keyValue[field];
            return res.status(409).json({
                success: false,
                message: `Update Conflict: The ${field} '${value}' is already taken.`
            });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: `Validation Error: ${messages.join(', ')}`
            });
        }

        return res.status(500).json({ success: false, message: 'Internal server error during update.' });
    }
};
