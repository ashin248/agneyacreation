// FINAL PRODUCTION CLEANUP: Removed all remaining seed/dummy references
const Product = require('../../src/schema/ProductSchema');
const { Banner, Coupon } = require('../../src/schema/MarketingSchema');
const CustomDesign = require('../../src/schema/CustomDesignSchema');
const Order = require('../../src/schema/OrderSchema');
const User = require('../../src/schema/UserSchema');
const { WholesaleInquiry } = require('../../src/schema/BulkOrderSchema');
const Settings = require('../../src/schema/SettingsSchema');
const { sendWhatsAppNotification, sendBulkInquiryNotification } = require('../../services/whatsappService');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cloudinary = require('../../config/cloudinary');
const streamifier = require('streamifier');
const FormData = require('form-data');

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

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Get all active banners
// @route   GET /api/public/banners
// @access  Public
const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: banners });
  } catch (err) {
    console.error('Error fetching active banners:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching banners.' });
  }
};

// @desc    Get pulse data (Banners + High priority Coupons)
// @route   GET /api/public/pulse
// @access  Public
const getStoreFrontPulse = async (req, res) => {
  try {
    const [banners, coupons] = await Promise.all([
      Banner.find({ isActive: true }).sort({ createdAt: -1 }),
      Coupon.find({ isActive: true, expiryDate: { $gt: new Date() } }).sort({ discountPercentage: -1 }).limit(5)
    ]);

    res.status(200).json({
      success: true,
      data: {
        banners,
        offers: coupons
      }
    });
  } catch (err) {
    console.error('Error fetching storefront pulse:', err);
    res.status(500).json({ success: false, message: 'Failed to synchronize marketing pulse.' });
  }
};

// @desc    Get public company profile (Branding)
// @route   GET /api/public/settings
// @access  Public
const getPublicCompanyProfile = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(200).json({ success: true, data: {} });
    }
    res.status(200).json({ success: true, data: settings.companyProfile });
  } catch (err) {
    console.error('Error fetching company profile:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching settings.' });
  }
};

// @desc    Get public products
// @route   GET /api/public/products
// @access  Public
const getPublicProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10);
    let query = Product.find({ isActive: true }).sort({ createdAt: -1 });

    if (limit && limit > 0) {
      query = query.limit(limit);
    }
      
    const products = await query;
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error('Error fetching public products:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching products.' });
  }
};

// @desc    Get public product by ID
// @route   GET /api/public/products/:id
// @access  Public
const getPublicProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.status(200).json(product); // Return direct product object as expected by frontend
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching product.' });
  }
};

// @desc    Submit a custom design request
// @route   POST /api/public/custom-designs
// @access  Public
const submitCustomDesignRequest = async (req, res) => {
  try {
    const { 
        name, phone, email, productCategory, description, 
        address, quantity, designImage, printAssets, 
        appliedFrontDesign, appliedBackDesign, productId 
    } = req.body;

    if (!name || !phone || !email || !productCategory) {
      return res.status(400).json({ success: false, message: 'Missing required customer or product fields' });
    }

    // Attempt to link to user if phone is provided
    let userId = null;
    try {
        const user = await User.findOne({ phone: phone.trim() });
        if (user) userId = user._id;
    } catch (e) {
        console.log("Non-fatal: User lookup failed during design sub.");
    }

    const newDesignRequest = new CustomDesign({
      user: userId,
      name,
      phone,
      email,
      productType: productCategory,
      description: description || '',
      address: address || '',
      quantity: quantity || 1,
      designImage: designImage || '',
      appliedFrontDesign: appliedFrontDesign || '',
      appliedBackDesign: appliedBackDesign || '',
      printAssets: printAssets || [],
      status: 'Pending'
    });

    await newDesignRequest.save();

    console.log(`[CUSTOM-DESIGN] Success: New request from ${name} (${phone})`);
    res.status(201).json({ success: true, message: 'Custom design request submitted successfully.' });
  } catch (err) {
    console.error('CRITICAL ERROR during Custom Design Submission:');
    console.error(err);

    // Specific check for MongoDB document size limit (16MB)
    if (err.name === 'BsonObjectSizeError' || err.message.includes('BSONObject')) {
        return res.status(413).json({ 
            success: false, 
            message: 'Design file size is too large. Please use smaller images or fewer elements.' 
        });
    }

    res.status(500).json({ 
        success: false, 
        message: 'Server error while submitting request.',
        error: err.message 
    });
  }
};

// @desc    Sync or create user based on phone number
// @route   POST /api/public/sync-user
// @access  Public
const syncUser = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    if (req.user && req.user.phone_number && req.user.phone_number !== phone.trim()) {
        return res.status(403).json({ success: false, message: 'Unauthorized action on this phone number.' });
    }

    let user = await User.findOne({ phone: phone.trim() });
    let isNewUser = false;

    if (!user) {
      user = new User({ phone: phone.trim(), name: '', email: '', addresses: [] });
      await user.save();
      isNewUser = true;
    } else if (!user.name || !user.email) {
      isNewUser = true;
    }

    return res.status(200).json({
      success: true,
      data: { ...user.toObject(), isNewUser }
    });
  } catch (err) {
    console.error('Error syncing user:', err);
    res.status(500).json({ success: false, message: 'Failed to sync user.' });
  }
};

// @desc    Update user profile & address
// @route   POST /api/public/update-user
// @access  Public
const updateUser = async (req, res) => {
  try {
    const { phone, name, email, addresses } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required to update.' });
    }

    if (req.user && req.user.phone_number && req.user.phone_number !== phone.trim()) {
        return res.status(403).json({ success: false, message: 'Unauthorized action on this phone number.' });
    }

    const updateFields = { addresses };
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;

    const updatedUser = await User.findOneAndUpdate(
      { phone: phone.trim() },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (err) {
    console.error('Error updating user:', err);
    
    // Handle Duplicate Key Error (e.g., Email already used)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        message: `The ${field} you provided is already linked to another account. Please use a different ${field}.` 
      });
    }

    // Handle Mongoose Validation Errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: `Validation Failed: ${messages.join(', ')}` });
    }

    res.status(500).json({ success: false, message: 'Failed to update profile due to an internal error.', error: err.message });
  }
};

// @desc    Delete user address
// @route   DELETE /api/public/user/address/:addressId
// @access  Public
const deleteAddress = async (req, res) => {
  try {
    const { phone } = req.body;
    const { addressId } = req.params;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    if (req.user && req.user.phone_number && req.user.phone_number !== phone.trim()) {
        return res.status(403).json({ success: false, message: 'Unauthorized action on this phone number.' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { phone: phone.trim() },
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    console.error('Error deleting address:', err);
    res.status(500).json({ success: false, message: 'Failed to delete address.' });
  }
};

// @desc    Toggle product in wishlist
// @route   POST /api/public/user/wishlist/toggle
// @access  Private
const toggleWishlist = async (req, res) => {
  try {
    const { phone, productId } = req.body;
    
    if (!phone || !productId) {
      return res.status(400).json({ success: false, message: 'Phone and productId are required.' });
    }

    if (req.user && req.user.phone_number && req.user.phone_number !== phone.trim()) {
        return res.status(403).json({ success: false, message: 'Unauthorized action.' });
    }

    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const index = user.wishlist.indexOf(productId);
    if (index === -1) {
      user.wishlist.push(productId);
    } else {
      user.wishlist.splice(index, 1);
    }

    await user.save();
    
    // Return populated wishlist matching the frontend expectations
    const populatedUser = await User.findById(user._id).populate('wishlist');
    
    res.status(200).json({ 
        success: true, 
        message: index === -1 ? 'Item added to wishlist' : 'Item removed from wishlist',
        wishlist: populatedUser.wishlist 
    });
  } catch (err) {
    console.error('Error toggling wishlist:', err);
    res.status(500).json({ success: false, message: 'Server error while updating wishlist.' });
  }
};

// @desc    Get user wishlist
// @route   GET /api/public/user/wishlist/:phone
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone is required.' });
    }

    if (req.user && req.user.phone_number && req.user.phone_number !== phone.trim()) {
        return res.status(403).json({ success: false, message: 'Unauthorized action.' });
    }

    const user = await User.findOne({ phone: phone.trim() }).populate('wishlist');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, data: user.wishlist });
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching wishlist.' });
  }
};

// @desc    Get User Orders
// @route   GET /api/public/user/orders/:phone
// @access  Public
const getUserOrders = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    if (req.user && req.user.phone_number && req.user.phone_number !== phone.trim()) {
        return res.status(403).json({ success: false, message: 'Unauthorized action on this phone number.' });
    }
    
    // Find all orders matching phone OR user object with that phone
    const orders = await Order.find({ 'customer.phone': phone.trim() }).sort({ createdAt: -1 });
    const customDesigns = await CustomDesign.find({ phone: phone.trim() }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { orders, customDesigns }
    });
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};


// @desc    Create a public order (Guest Checkout)
// @route   POST /api/public/orders
// @access  Public
const createPublicOrder = async (req, res) => {
  try {
    const { customer, items, promoCode, gstDetails, paymentStatus } = req.body;

    if (!customer || !items || items.length === 0) {
      console.error('[ORDER-ERROR] Missing customer or items in request payload');
      return res.status(400).json({ success: false, message: 'Customer details and order items are required.' });
    }

    // Try to find the user for detail fallback
    let dbUser = null;
    try {
        dbUser = await User.findOne({ phone: customer.phone.trim() });
    } catch (e) {
        console.log("Non-fatal: User search failed during order.");
    }

    // 1. Server-Side Price & Stock Validation
    let calculatedSubtotal = 0;
    let hasReady = false;
    let hasCustom = false;
    const processedItems = [];

    // Pre-calculate total quantities per product to support Bulk Tiered Pricing
    const productTotalQuantities = {};
    items.forEach(item => {
        productTotalQuantities[item.productId] = (productTotalQuantities[item.productId] || 0) + item.quantity;
    });

    // Loop through items and verify against REAL DB values
    for (const item of items) {
      const dbProduct = await Product.findById(item.productId);
      
      if (!dbProduct || !dbProduct.isActive) {
        return res.status(404).json({ success: false, message: `Product "${item.name}" is no longer available.` });
      }

      let unitPriceToUse = dbProduct.basePrice;
      const totalVolumeOfProduct = productTotalQuantities[item.productId];
      
      let itemSubtotal = 0;

      // Handle Wholesale Tiered Pricing if enabled - using PROPORTIONAL INCREMENTAL math safely
      if (dbProduct.isBulkEnabled && dbProduct.bulkRules && dbProduct.bulkRules.length > 0) {
          const applicableRule = [...(dbProduct.bulkRules || [])]
              .sort((a, b) => b.minQty - a.minQty)
              .find(rule => totalVolumeOfProduct >= rule.minQty);
          
          if (applicableRule) {
              const numBasePrice = Number(dbProduct.basePrice || 0);
              const discountAmount = Number(applicableRule.pricePerUnit || 0);
              const finalDiscountedPrice = Math.max(0, numBasePrice - discountAmount);
              
              const minQty = Number(applicableRule.minQty);
              const baseUnits = Math.min(totalVolumeOfProduct, minQty);
              const discountedUnits = Math.max(0, totalVolumeOfProduct - minQty);
              
              const totalPoolCost = (baseUnits * numBasePrice) + (discountedUnits * finalDiscountedPrice);
              
              if (totalVolumeOfProduct > 0) {
                  const proportion = item.quantity / totalVolumeOfProduct;
                  itemSubtotal = totalPoolCost * proportion;
                  unitPriceToUse = itemSubtotal / item.quantity; // Sync for metadata display
              } else {
                  itemSubtotal = 0;
              }
          } else {
              itemSubtotal = Number(dbProduct.basePrice) * item.quantity;
              unitPriceToUse = dbProduct.basePrice;
          }
      } else {
          itemSubtotal = Number(dbProduct.basePrice) * item.quantity;
      }

      let variationModifier = 0;
      let targetSku = (item.selectedVariation && item.selectedVariation.sku) ? item.selectedVariation.sku : 'standard';

      // 🚨 FIX: Force validation for ALL products that have variations
      if (dbProduct.variations && dbProduct.variations.length > 0) {
        let dbVariation = dbProduct.variations.find(v => v.sku === targetSku);
        
        // If sku doesn't match (e.g. for custom_xxxx SKUs from Studio), fallback to the very first variation to ensure stock check
        if (!dbVariation) {
            dbVariation = dbProduct.variations[0];
            if (dbVariation) {
                targetSku = dbVariation.sku;
            }
        }

        if (!dbVariation) {
          return res.status(400).json({ success: false, message: `Invalid or missing variation selected for ${dbProduct.name}.` });
        }

        if (dbVariation.stock < item.quantity) {
            // Bulk Manufacturing allows zero stock. Standard retail does not.
            if (!dbProduct.isBulkEnabled) {
                console.error(`[ORDER-ERROR] Insufficient stock for ${dbProduct.name} (${dbVariation.size || targetSku}). Available: ${dbVariation.stock}, Requested: ${item.quantity}`);
                return res.status(400).json({ success: false, message: `Insufficient stock for ${dbProduct.name} (${dbVariation.size || targetSku}).` });
            } else {
                console.log(`[ORDER-LOG] Allowing out-of-stock Bulk Order for ${dbProduct.name}`);
            }
        }
        
        variationModifier = dbVariation.priceModifier || 0;
        
        // 🚨 FIX: Guarantee 'selectedVariation' is structured for downstream inventory decrement
        item.selectedVariation = {
            sku: targetSku,
            size: dbVariation.size || null,
            color: dbVariation.color || null
        };
      }

      // Final Unit Price calculation
      const finalUnitPrice = unitPriceToUse + variationModifier;
      itemSubtotal += variationModifier * item.quantity; // Apply modifier flat atop pool
      calculatedSubtotal += itemSubtotal;

      if (item.itemType === 'Ready') hasReady = true;
      if (item.itemType === 'Custom') hasCustom = true;

      processedItems.push({
        productId: dbProduct._id,
        name: item.itemType === 'Custom' 
              ? (item.customData?.mode === 'manual' ? `[MANUAL DESIGN REQUEST] ${item.name || dbProduct.name}` : `[STUDIO DESIGN] ${dbProduct.name}`) 
              : dbProduct.name,
        itemType: item.itemType,
        quantity: item.quantity,
        unitPrice: finalUnitPrice, // Saved validated price
        // Use custom preview if available, fallback to product gallery
        image: item.itemType === 'Custom' && item.customData?.appliedFrontDesign 
               ? item.customData.appliedFrontDesign 
               : (dbProduct.galleryImages?.[0] || ''),
        selectedVariation: item.selectedVariation,
        isBulkApplied: !!(dbProduct.isBulkEnabled && totalVolumeOfProduct >= (dbProduct.bulkRules?.[0]?.minQty || 20)),
        customData: item.customData || {}
      });
    }

    // Determine Order Type Logic
    let orderType = 'Standard';
    const totalItemCount = processedItems.reduce((acc, item) => acc + item.quantity, 0);
    
    // Improved Logic: If total count >= 20 OR if any item hit a bulk tier pricing rule
    const hasBulkPricedItem = processedItems.some(i => i.isBulkApplied); 

    if (totalItemCount >= 20 || hasBulkPricedItem) orderType = 'Bulk';
    else if (hasReady && hasCustom) orderType = 'Mixed';
    else if (hasCustom) orderType = 'Custom';

    // 2. Promo Code Validation (Secure Backend Check)
    let discountAmount = 0;
    if (promoCode) {
      const coupon = await Coupon.findOne({ code: promoCode.toUpperCase(), isActive: true });
      if (!coupon || new Date(coupon.expiryDate) < new Date()) {
        console.error(`[ORDER-ERROR] Invalid or expired promo code: ${promoCode}`);
        return res.status(400).json({ success: false, message: 'Invalid or expired promo code.' });
      }
      discountAmount = (calculatedSubtotal * coupon.discountPercentage) / 100;
    }

    // 3. Shipping Calculation (Strict Server-Side Logic)
    // Example: Free shipping over ₹1000, else ₹50
    const netAmountForShipping = calculatedSubtotal - discountAmount;
    const shippingFee = netAmountForShipping >= 1000 ? 0 : 50;

    const finalTotalAmount = netAmountForShipping + shippingFee;

    // 4. Create the Order document
    const newOrder = new Order({
      customer: {
        userId: customer.userId || dbUser?._id || null,
        name: (customer.name && customer.name.trim() !== "") ? customer.name : (dbUser?.name || "Customer"),
        email: (customer.email && customer.email.trim() !== "") ? customer.email : (dbUser?.email || `${customer.phone.replace(/[^0-9]/g, '')}@agneya.com`),
        phone: customer.phone,
        shippingAddress: customer.shippingAddress
      },
      items: processedItems,
      subtotal: calculatedSubtotal,
      discount: discountAmount,
      shippingFee: shippingFee,
      totalAmount: finalTotalAmount, // Absolute secure total
      orderType,
      gstDetails: gstDetails || null,
      paymentStatus: orderType === 'Bulk' ? 'Pending Review' : (paymentStatus || 'Pending'),
      orderStatus: 'Pending'
    });

    // 3. INVENTORY SYNC: Reduce stock securely to prevent negative inventory
    const decrementedItems = [];
    let stockError = null;

    for (const item of processedItems) {
      if (item.itemType === 'Ready' && item.selectedVariation?.sku) {
        // Fetch product again to check if bulk enabled for atomic logic
        const p = await Product.findById(item.productId);
        const isBulk = p?.isBulkEnabled || false;

        // Atomic update query
        const query = { 
            _id: item.productId, 
            'variations.sku': item.selectedVariation.sku
        };
        
        // If NOT bulk, we must have enough stock. If IS bulk, we don't care (Manufacturing model).
        if (!isBulk) {
            query['variations.stock'] = { $gte: item.quantity };
        }

        const result = await Product.updateOne(
          query,
          { $inc: { 'variations.$.stock': -item.quantity } }
        );

        if (result.modifiedCount === 0 && !isBulk) {
          stockError = `Insufficient stock for item: ${item.name} (${item.selectedVariation.size || 'Default'})`;
          break; // Stop processing further items
        }
        
        decrementedItems.push(item); // Track for potential rollback (mostly for retail)
      }
    }

    // 4. Handle Rollback if stock error occurred
    if (stockError) {
      for (const rbItem of decrementedItems) {
        await Product.updateOne(
          { _id: rbItem.productId, 'variations.sku': rbItem.selectedVariation.sku },
          { $inc: { 'variations.$.stock': rbItem.quantity } }
        );
      }
      return res.status(400).json({ success: false, message: stockError });
    }

    // 5. Finalize the Order
    await newOrder.save();

    // 🚨 SYNC: Populate CustomDesign collection for visibility in the Design Pipeline
    try {
        for (const item of processedItems) {
            if (item.itemType === 'Custom') {
                const designEntry = new CustomDesign({
                    name: newOrder.customer.name,
                    phone: newOrder.customer.phone,
                    email: newOrder.customer.email,
                    address: newOrder.customer.shippingAddress || 'N/A',
                    productType: item.name,
                    quantity: item.quantity,
                    appliedFrontDesign: item.customData?.appliedFrontDesign || (item.itemType === 'Custom' ? item.image : null),
                    appliedBackDesign: item.customData?.appliedBackDesign || null,
                    frontCanvasData: item.customData?.design?.frontCanvasData || null,
                    backCanvasData: item.customData?.design?.backCanvasData || null,
                    frontAnchors: item.customData?.design?.frontAnchors || {},
                    backAnchors: item.customData?.design?.backAnchors || {},
                    designImage: item.image, // The generated mockup from frontend
                    description: item.customData?.instructions || item.customData?.design?.instructions || '',
                    printAssets: item.customData?.manualAttachments || item.customData?.design?.references?.map(r => r.url) || [],
                    isManual: !!(item.customData?.mode === 'manual'),
                    orderRef: newOrder._id,
                    isPaid: newOrder.paymentStatus === 'Paid',
                    status: 'Pending'
                });

                await designEntry.save();
                console.log(`[PIPELINE-SYNC] Custom Design created for ${item.name}`);
            }
        }
    } catch (syncErr) {
        console.error('[CRITICAL] Failed to sync custom order to design pipeline:', syncErr);
        // Non-blocking: We don't want to fail the order if the pipeline sync fails
    }

    // 6. Send WhatsApp Notification asynchronously (do not block response)
    sendWhatsAppNotification({
      order: newOrder,
      customer: customer,
      items: items,
      totalAmount: finalTotalAmount 
    });

    res.status(201).json({ 
      success: true, 
      message: 'Order placed successfully! Stock updated.', 
      orderId: newOrder.orderId 
    });
  } catch (err) {
    console.error('CRITICAL: Error creating public order:', err);

    // Specific check for MongoDB document size limit (16MB)
    if (err.name === 'BsonObjectSizeError' || (err.message && err.message.includes('BSONObject'))) {
        return res.status(413).json({ 
            success: false, 
            message: 'Design file size is too large. Please use smaller images or fewer elements.' 
        });
    }

    res.status(500).json({ 
        success: false, 
        message: 'Server error during order validation/creation.', 
        error: err.message 
    });
  }
};

// @desc    Track a public order using Order ID and Phone
// @route   POST /api/public/orders/track
// @access  Public
const trackPublicOrder = async (req, res) => {
  try {
    const { orderId, phone } = req.body;

    if (!orderId || !phone) {
      return res.status(400).json({ success: false, message: 'Order ID and Phone Number are required.' });
    }

    // Find the order that matches BOTH orderId and customer phone
    // We use a case-insensitive regex for orderId to be user-friendly
    const order = await Order.findOne({ 
      orderId: { $regex: new RegExp(`^${orderId}$`, 'i') }, 
      'customer.phone': phone 
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or details mismatch.' });
    }

    // --- Dynamic Status Calculation Logic ---
    const statuses = ["Order Received", "Approved", "Packing", "Shipped", "Out for Delivery", "Delivered"];
    let displayStatus = "";
    let currentStep = 0;

    // If order is Cancelled, we show that directly
    if (order.orderStatus === 'Cancelled') {
      displayStatus = "Cancelled";
      currentStep = -1;
    } else if (order.orderStatus !== 'Pending') {
      // If admin has manually updated it to a standard status, map it
      const statusMap = {
        'Processing': 'Approved',
        'Printing': 'Packing',
        'Shipped': 'Shipped',
        'Out for Delivery': 'Out for Delivery',
        'Delivered': 'Delivered'
      };
      displayStatus = statusMap[order.orderStatus] || "Order Received";
      currentStep = statuses.indexOf(displayStatus);
    } else {
      // If still PENDING, calculate based on time (72h timeline)
      const hoursSinceOrder = (Date.now() - new Date(order.createdAt)) / (1000 * 60 * 60);

      if (hoursSinceOrder < 6) {
        displayStatus = "Order Received";
        currentStep = 0;
      } else if (hoursSinceOrder < 12) {
        displayStatus = "Approved";
        currentStep = 1;
      } else if (hoursSinceOrder < 24) {
        displayStatus = "Packing";
        currentStep = 2;
      } else if (hoursSinceOrder < 48) {
        displayStatus = "Shipped";
        currentStep = 3;
      } else if (hoursSinceOrder < 60) {
        displayStatus = "Out for Delivery";
        currentStep = 4;
      } else {
        displayStatus = "Delivered";
        currentStep = 5;
      }
    }

    res.status(200).json({ 
      success: true, 
      data: {
        orderId: order.orderId,
        customer: order.customer,
        items: await Promise.all(order.items.map(async (item) => {
            // Logic redundancy: if image is missing from historical order, attempt to hydrate from Product catalog
            if (!item.image) {
                try {
                    const p = await Product.findById(item.productId);
                    if (p) return { ...item.toObject(), image: p.galleryImages?.[0] || '' };
                } catch (e) {}
            }
            return item;
        })),
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        displayStatus,
        currentStep,
        status: order.orderStatus,
        orderStatus: order.orderStatus,
        allSteps: statuses
      }
    });
  } catch (err) {
    console.error('Error tracking public order:', err);
    res.status(500).json({ success: false, message: 'Server error while tracking order.' });
  }
};

// @desc    Unified tracking for both Standard and Custom orders
// @route   POST /api/public/track-order
// @access  Public
const trackUnifiedOrder = async (req, res) => {
  try {
    const { orderId, phone } = req.body;

    if (!orderId || !phone) {
      return res.status(400).json({ success: false, message: 'Order ID and Phone Number are required.' });
    }

    const statuses = ["Order Received", "Approved", "Packing", "Shipped", "Out for Delivery", "Delivered"];

    // 1. Try Standard Order
    const stdOrder = await Order.findOne({ 
      orderId: { $regex: new RegExp(`^${orderId}$`, 'i') }, 
      'customer.phone': phone 
    });

    if (stdOrder) {
      let displayStatus = "";
      let currentStep = 0;

      if (stdOrder.orderStatus === 'Cancelled') {
        displayStatus = "Cancelled";
        currentStep = -1;
      } else if (stdOrder.orderStatus !== 'Pending') {
        const statusMap = { 'Processing': 'Approved', 'Printing': 'Packing', 'Shipped': 'Shipped', 'Out for Delivery': 'Out for Delivery', 'Delivered': 'Delivered' };
        displayStatus = statusMap[stdOrder.orderStatus] || "Order Received";
        currentStep = statuses.indexOf(displayStatus);
      } else {
        const hoursSinceOrder = (Date.now() - new Date(stdOrder.createdAt)) / (1000 * 60 * 60);
        if (hoursSinceOrder < 6) { displayStatus = "Order Received"; currentStep = 0; }
        else if (hoursSinceOrder < 12) { displayStatus = "Approved"; currentStep = 1; }
        else if (hoursSinceOrder < 24) { displayStatus = "Packing"; currentStep = 2; }
        else if (hoursSinceOrder < 48) { displayStatus = "Shipped"; currentStep = 3; }
        else if (hoursSinceOrder < 60) { displayStatus = "Out for Delivery"; currentStep = 4; }
        else { displayStatus = "Delivered"; currentStep = 5; }
      }

      return res.status(200).json({ 
        success: true, 
        data: {
          type: 'standard',
          orderId: stdOrder.orderId,
          customer: stdOrder.customer,
          items: await Promise.all(stdOrder.items.map(async (item) => {
              if (!item.image) {
                  try {
                      const p = await Product.findById(item.productId);
                      if (p) return { ...item.toObject(), image: p.galleryImages?.[0] || '' };
                  } catch (e) {}
              }
              return item;
          })),
          totalAmount: stdOrder.totalAmount,
          createdAt: stdOrder.createdAt,
          displayStatus,
          currentStep,
          status: stdOrder.orderStatus,
          orderStatus: stdOrder.orderStatus,
          allSteps: statuses
        }
      });
    }

    // 2. Try Custom Design
    const mongoose = require('mongoose');
    let customOrder = null;
    
    // Check if orderId is a valid Mongo ObjectId
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      customOrder = await CustomDesign.findOne({ _id: orderId, phone });
    }

    if (customOrder) {
        const stepMap = { 'Pending': 0, 'Approved': 1, 'In Production': 2, 'Shipped': 3, 'Delivered': 5 };
        const currentStep = stepMap[customOrder.status] ?? 0;
        
        return res.status(200).json({ 
            success: true, 
            data: {
                type: 'custom',
                orderId: customOrder._id,
                productType: customOrder.productType,
                quantity: customOrder.quantity,
                designImage: customOrder.designImage,
                status: customOrder.status,
                estimatedDeliveryDate: customOrder.estimatedDeliveryDate,
                createdAt: customOrder.createdAt,
                currentStep,
                allSteps: statuses,
                displayStatus: customOrder.status === 'Approved' ? 'Approved - Sent for Printing' : customOrder.status
            }
        });
    }

    return res.status(404).json({ success: false, message: 'Order not found or phone number does not match.' });
  } catch (err) {
    console.error('Error tracking unified order:', err);
    res.status(500).json({ success: false, message: 'Server error while tracking.' });
  }
};

// @desc    Create Razorpay Order
// @route   POST /api/public/payment/razorpay-order
// @access  Public
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body; // Amount in rupees
    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpayInstance.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment link' });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/public/payment/verify
// @access  Public
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    console.log(`[PAYMENT-VERIFY] Verifying signature for Order: ${razorpay_order_id}`);

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      console.log(`[PAYMENT-VERIFY] ✅ Success signature match for: ${razorpay_order_id}`);
      return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      console.error(`[PAYMENT-VERIFY] ❌ Signature mismatch for order: ${razorpay_order_id}`);
      return res.status(400).json({ success: false, message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error('[PAYMENT-VERIFY] Razorpay Verification Critical Error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

// @desc    Handle Bulk Inquiry submission
// @route   POST /api/public/bulk-inquiry
// @access  Public
const handleBulkInquiry = async (req, res) => {
  try {
    const { contactName, companyName, email, phone, productOfInterest, estimatedQuantity, message } = req.body;

    if (!contactName || !email || !phone || !productOfInterest || !estimatedQuantity || !message) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    const newInquiry = new WholesaleInquiry({
      contactName,
      companyName,
      email,
      phone,
      productOfInterest,
      estimatedQuantity,
      message,
      status: 'New'
    });

    await newInquiry.save();

    // Trigger WhatsApp notification for the admin group asynchronously
    sendBulkInquiryNotification(newInquiry).catch(err => console.error("Bulk Inquiry WhatsApp Notification Failed:", err));

    res.status(201).json({ success: true, message: 'Bulk inquiry submitted successfully. We will contact you soon!' });
  } catch (error) {
    console.error('Error saving bulk inquiry:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting bulk inquiry.' });
  }
};

// @desc    Remove background from an image using free local Python rembg server
const removeBackgroundImage = async (req, res) => {
  try {
    if (!req.file) {
      console.error('[BG-REMOVAL] Error: No file found in request');
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    // Reverting to Local Python AI Server to save costs
    const targetUrl = 'http://127.0.0.1:7000/api/remove';
    console.log(`[BG-REMOVAL] Proxying to local AI: ${targetUrl} (Free)`);

    const form = new FormData();
    // Most local rembg APIs expect 'file' or 'image'
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'upload.png',
      contentType: req.file.mimetype || 'image/png'
    });
    form.append('image', req.file.buffer, {
      filename: req.file.originalname || 'upload.png',
      contentType: req.file.mimetype || 'image/png'
    });

    const response = await axios.post(targetUrl, form, {
      headers: {
        ...form.getHeaders()
      },
      responseType: 'arraybuffer',
      timeout: 45000 // 45 seconds for local processing
    });

    if (response.data && response.data.byteLength > 0) {
        console.log('[BG-REMOVAL] Success: Free local processing complete!');
        res.set('Content-Type', 'image/png');
        return res.status(200).send(response.data);
    } else {
        throw new Error('Local AI server returned an empty buffer');
    }
  } catch (error) {
    let errorDetail = error.message;
    if (error.code === 'ECONNREFUSED') {
       errorDetail = 'Local Python AI Server (rembg) is NOT RUNNING on port 7000.';
    }

    console.error('[BG-REMOVAL] CRITICAL ERROR:', errorDetail);
    
    return res.status(500).json({ 
        success: false, 
        message: 'Free Background Removal failed. Check if Python server is on.', 
        error: errorDetail 
    });
  }
};

// @desc    Upload multiple design assets for manual customization
// @route   POST /api/public/manual-design/upload
// @access  Public
const uploadManualDesignAssets = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided.' });
    }

    const uploadPromises = req.files.map(file => 
      uploadToCloudinary(file.buffer, 'custom-requests/manual-assets')
    );

    const urls = await Promise.all(uploadPromises);

    res.status(200).json({ 
      success: true, 
      urls 
    });
  } catch (err) {
    console.error('Manual Asset Upload Failed:', err);
    res.status(500).json({ success: false, message: 'Failed to upload assets.' });
  }
};

module.exports = {
  getActiveBanners,
  getStoreFrontPulse,
  getPublicCompanyProfile,
  getPublicProducts,
  getPublicProductById,
  submitCustomDesignRequest,
  syncUser,
  updateUser,
  deleteAddress,
  toggleWishlist,
  getWishlist,
  getUserOrders,
  createPublicOrder,
  trackPublicOrder,
  trackUnifiedOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleBulkInquiry,
  removeBackgroundImage,
  uploadManualDesignAssets
};
