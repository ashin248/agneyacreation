const Settings = require('../src/schema/SettingsSchema');
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

// Retrieve existing Company Profile. If none, generate empty initialization object gently
exports.getCompanyProfile = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
      await settings.save();
    }
    
    return res.status(200).json({ success: true, data: settings.companyProfile });
  } catch (error) {
    console.error('Get Company Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to access corporate arrays' });
  }
};

// Map structural DOM updates strictly into unified database configuration objects correctly
exports.updateCompanyProfile = async (req, res) => {
  try {
    const { storeName, supportEmail, supportPhone, address } = req.body;
    let logoUrl = req.body.logoUrl;

    // Handle File Upload if present
    if (req.file) {
        try {
            logoUrl = await uploadToCloudinary(req.file.buffer, 'settings/branding');
        } catch (uploadError) {
            console.error('Logo Upload Error:', uploadError);
            return res.status(500).json({ success: false, message: 'Failed to upload branding asset.' });
        }
    }
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    settings.companyProfile = { storeName, supportEmail, supportPhone, address, logoUrl };
    await settings.save();
    
    return res.status(200).json({ success: true, message: 'Company parameters dynamically synchronized', data: settings.companyProfile });
  } catch (error) {
    console.error('Update Company Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to transform parameters effectively natively' });
  }
};

// --- Shipping Rules ---
exports.getShippingRules = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
      await settings.save();
    }
    return res.status(200).json({ success: true, data: settings.shippingRules || [] });
  } catch (error) {
    console.error('Get Shipping Rules Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to access shipping rules' });
  }
};

exports.updateShippingRules = async (req, res) => {
  try {
    // Handle both direct array or wrapped object for maximum integration stability
    let shippingRules = req.body;
    if (req.body.shippingRules && Array.isArray(req.body.shippingRules)) {
        shippingRules = req.body.shippingRules;
    }
    
    if (!Array.isArray(shippingRules)) {
        return res.status(400).json({ success: false, message: 'Invalid data format. Expected an array of rules.' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }
    
    settings.shippingRules = shippingRules;
    await settings.save();
    
    return res.status(200).json({ success: true, message: 'Shipping rules updated successfully', data: settings.shippingRules });
  } catch (error) {
    console.error('Update Shipping Rules Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update shipping rules' });
  }
};

// --- Legal & Tax Settings ---
exports.getLegalSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
      await settings.save();
    }
    return res.status(200).json({ success: true, data: settings.legalAndTax || {} });
  } catch (error) {
    console.error('Get Legal & Tax Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to access legal and tax settings' });
  }
};

exports.updateLegalSettings = async (req, res) => {
  try {
    const { gstPercentage, termsAndConditions, privacyPolicy } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }
    
    settings.legalAndTax = { gstPercentage, termsAndConditions, privacyPolicy };
    await settings.save();
    
    return res.status(200).json({ success: true, message: 'Legal & Tax settings updated successfully', data: settings.legalAndTax });
  } catch (error) {
    console.error('Update Legal & Tax Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update legal and tax settings' });
  }
};

// --- Payment Gateways ---
exports.getPaymentSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
      await settings.save();
    }
    return res.status(200).json({ success: true, data: settings.paymentGateways || {} });
  } catch (error) {
    console.error('Get Payment Settings Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to access payment gateway settings' });
  }
};

exports.updatePaymentSettings = async (req, res) => {
  try {
    const paymentGateways = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }
    
    settings.paymentGateways = paymentGateways;
    await settings.save();
    
    return res.status(200).json({ success: true, message: 'Payment gateway settings updated successfully', data: settings.paymentGateways });
  } catch (error) {
    console.error('Update Payment Settings Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update payment gateway settings' });
  }
};
