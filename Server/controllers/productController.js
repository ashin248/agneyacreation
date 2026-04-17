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
    const products = await Product.find().sort({ createdAt: -1 });
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
      model3d: base3DModelUrl,
      blankFrontImage: blankFrontImageUrl,
      frontMaskImage: frontMaskImageUrl,
      frontOverlayImage: frontOverlayImageUrl,
      blankBackImage: blankBackImageUrl,
      backMaskImage: backMaskImageUrl,
      backOverlayImage: backOverlayImageUrl,
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
                } else if (file.fieldname.startsWith('variationImage_')) {
                    const index = parseInt(file.fieldname.split('_')[1], 10);
                    if (!isNaN(index) && updateData.variations && updateData.variations[index]) {
                        const promise = uploadToCloudinary(file.buffer, 'products/variations').then(url => {
                            updateData.variations[index].imageUrl = url;
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
