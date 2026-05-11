const Product = require('../src/schema/ProductSchema');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');



// Helper function to upload an image buffer directly to Cloudinary
const uploadToCloudinary = (buffer, folderName, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folderName, resource_type: resourceType },
      (error, result) => {
        if (result) {
          resolve(result.secure_url);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

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

    // 3. Image Sorting & Uploading Variables
    const galleryImageUrls = [];
    let blankFrontImageUrl = null;
    let frontMaskImageUrl = null;
    let frontOverlayImageUrl = null;
    let blankBackImageUrl = null;
    let backMaskImageUrl = null;
    let backOverlayImageUrl = null;
    let base3DModelUrl = null;
    
    // We will store promises in an array to upload them concurrently for speed
    const uploadPromises = [];

    // Loop through all incoming files caught by multer.any()
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.fieldname === 'galleryImages') {
          // Push to upload queue for Gallery Images
          const promise = uploadToCloudinary(file.buffer, 'products/gallery').then(url => {
            galleryImageUrls.push(url);
          });
          uploadPromises.push(promise);
        } 
        else if (file.fieldname === 'blankFrontImage') {
          const promise = uploadToCloudinary(file.buffer, 'products/base').then(url => {
            blankFrontImageUrl = url;
          });
          uploadPromises.push(promise);
        }
        else if (file.fieldname === 'frontMaskImage') {
          const promise = uploadToCloudinary(file.buffer, 'products/masks').then(url => {
            frontMaskImageUrl = url;
          });
          uploadPromises.push(promise);
        }
        else if (file.fieldname === 'frontOverlayImage') {
          const promise = uploadToCloudinary(file.buffer, 'products/overlays').then(url => {
            frontOverlayImageUrl = url;
          });
          uploadPromises.push(promise);
        }
        else if (file.fieldname === 'blankBackImage') {
          const promise = uploadToCloudinary(file.buffer, 'products/base').then(url => {
            blankBackImageUrl = url;
          });
          uploadPromises.push(promise);
        }
        else if (file.fieldname === 'backMaskImage') {
          const promise = uploadToCloudinary(file.buffer, 'products/masks').then(url => {
            backMaskImageUrl = url;
          });
          uploadPromises.push(promise);
        }
        else if (file.fieldname === 'backOverlayImage') {
          const promise = uploadToCloudinary(file.buffer, 'products/overlays').then(url => {
            backOverlayImageUrl = url;
          });
          uploadPromises.push(promise);
        }
        else if (file.fieldname === 'base3DModelFile') {
          const promise = uploadToCloudinary(file.buffer, 'products/3d', 'raw').then(url => {
            base3DModelUrl = url;
          });
          uploadPromises.push(promise);
        }
        else if (file.fieldname === 'base2DImageFile') {
          const promise = uploadToCloudinary(file.buffer, 'products/base').then(url => {
            blankFrontImageUrl = url;
          });
          uploadPromises.push(promise);
        }
        else if (file.fieldname.startsWith('variationImage_')) {
          // Fieldname looks like "variationImage_0", "variationImage_1", etc.
          const indexStr = file.fieldname.split('_')[1];
          const index = parseInt(indexStr, 10);
          
          if (!isNaN(index) && variations[index]) {
            // Push to upload queue for Variation Image
            const promise = uploadToCloudinary(file.buffer, 'products/variations').then(url => {
              variations[index].imageUrl = url; // Attaching to the specific variation object
            });
            uploadPromises.push(promise);
          }
        }
        else if (file.fieldname.startsWith('override_image_')) {
          const templateId = file.fieldname.replace('override_image_', '');
          const templateObj = linkedTemplates.find(t => t.templateId === templateId);
          if (templateObj) {
            const promise = uploadToCloudinary(file.buffer, 'products/overrides').then(url => {
              templateObj.overrideImageUrl = url;
            });
            uploadPromises.push(promise);
          }
        }
        else if (file.fieldname.startsWith('twoDModel_main_')) {
          const idx = parseInt(file.fieldname.replace('twoDModel_main_', ''), 10);
          if (!isNaN(idx) && twoDModels[idx]) {
            const promise = uploadToCloudinary(file.buffer, 'products/twod').then(url => {
              twoDModels[idx].mainModelUrl = url;
            });
            uploadPromises.push(promise);
          }
        }
        else if (file.fieldname.startsWith('twoDModel_support_')) {
          const parts = file.fieldname.replace('twoDModel_support_', '').split('_');
          const idx = parseInt(parts[0], 10);
          const sIdx = parseInt(parts[1], 10);
          if (!isNaN(idx) && !isNaN(sIdx) && twoDModels[idx] && twoDModels[idx].supportModels && twoDModels[idx].supportModels[sIdx]) {
            const promise = uploadToCloudinary(file.buffer, 'products/twod').then(url => {
              twoDModels[idx].supportModels[sIdx].url = url;
            });
            uploadPromises.push(promise);
          }
        }
      }
    }

    // Await all image uploads to finish
    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }

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
      model3d: base3DModelUrl,
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
        
        const uploadPromises = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                if (file.fieldname === 'galleryImages') {
                    const promise = uploadToCloudinary(file.buffer, 'products/gallery').then(url => {
                        galleryImageUrls.push(url);
                    });
                    uploadPromises.push(promise);
                } else if (file.fieldname === 'blankFrontImage') {
                    const promise = uploadToCloudinary(file.buffer, 'products/base').then(url => {
                        updateData.blankFrontImage = url;
                    });
                    uploadPromises.push(promise);
                } else if (file.fieldname === 'frontMaskImage') {
                    const promise = uploadToCloudinary(file.buffer, 'products/masks').then(url => {
                        updateData.frontMaskImage = url;
                    });
                    uploadPromises.push(promise);
                } else if (file.fieldname === 'frontOverlayImage') {
                    const promise = uploadToCloudinary(file.buffer, 'products/overlays').then(url => {
                        updateData.frontOverlayImage = url;
                    });
                    uploadPromises.push(promise);
                } else if (file.fieldname === 'blankBackImage') {
                    const promise = uploadToCloudinary(file.buffer, 'products/base').then(url => {
                        updateData.blankBackImage = url;
                    });
                    uploadPromises.push(promise);
                } else if (file.fieldname === 'backMaskImage') {
                    const promise = uploadToCloudinary(file.buffer, 'products/masks').then(url => {
                        updateData.backMaskImage = url;
                    });
                    uploadPromises.push(promise);
                } else if (file.fieldname === 'backOverlayImage') {
                    const promise = uploadToCloudinary(file.buffer, 'products/overlays').then(url => {
                        updateData.backOverlayImage = url;
                    });
                    uploadPromises.push(promise);
                } else if (file.fieldname === 'base3DModelFile') {
                    const promise = uploadToCloudinary(file.buffer, 'products/3d', 'raw').then(url => {
                        updateData.model3d = url;
                        updateData.base3DModelUrl = url;
                    });
                    uploadPromises.push(promise);
                } else if (file.fieldname === 'base2DImageFile') {
                    const promise = uploadToCloudinary(file.buffer, 'products/base').then(url => {
                        updateData.blankFrontImage = url;
                    });
                    uploadPromises.push(promise);
                } else if (file.fieldname.startsWith('variationImage_')) {
                    const index = parseInt(file.fieldname.split('_')[1], 10);
                    if (!isNaN(index) && updateData.variations && updateData.variations[index]) {
                        const promise = uploadToCloudinary(file.buffer, 'products/variations').then(url => {
                            updateData.variations[index].imageUrl = url;
                        });
                        uploadPromises.push(promise);
                    }
                } else if (file.fieldname.startsWith('override_image_')) {
                    const templateId = file.fieldname.replace('override_image_', '');
                    if (updateData.linkedTemplates) {
                        const templateObj = updateData.linkedTemplates.find(t => t.templateId === templateId);
                        if (templateObj) {
                            const promise = uploadToCloudinary(file.buffer, 'products/overrides').then(url => {
                                templateObj.overrideImageUrl = url;
                            });
                            uploadPromises.push(promise);
                        }
                    }
                } else if (file.fieldname.startsWith('twoDModel_main_')) {
                    const idx = parseInt(file.fieldname.replace('twoDModel_main_', ''), 10);
                    if (!isNaN(idx) && updateData.twoDModels && updateData.twoDModels[idx]) {
                        const promise = uploadToCloudinary(file.buffer, 'products/twod').then(url => {
                            updateData.twoDModels[idx].mainModelUrl = url;
                        });
                        uploadPromises.push(promise);
                    }
                } else if (file.fieldname.startsWith('twoDModel_support_')) {
                    const parts = file.fieldname.replace('twoDModel_support_', '').split('_');
                    const idx = parseInt(parts[0], 10);
                    const sIdx = parseInt(parts[1], 10);
                    if (!isNaN(idx) && !isNaN(sIdx) && updateData.twoDModels && updateData.twoDModels[idx] && updateData.twoDModels[idx].supportModels && updateData.twoDModels[idx].supportModels[sIdx]) {
                        const promise = uploadToCloudinary(file.buffer, 'products/twod').then(url => {
                            updateData.twoDModels[idx].supportModels[sIdx].url = url;
                        });
                        uploadPromises.push(promise);
                    }
                }
            }
        }

        if (uploadPromises.length > 0) await Promise.all(uploadPromises);
        updateData.galleryImages = galleryImageUrls;

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
