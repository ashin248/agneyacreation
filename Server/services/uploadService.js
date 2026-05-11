const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Helper function to upload an image buffer directly to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} folderName - Cloudinary folder path
 * @param {string} resourceType - 'auto', 'image', 'video', 'raw'
 * @returns {Promise<string>} - Secure URL of the uploaded image
 */
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

/**
 * Processes a list of files from Multer and uploads them to Cloudinary based on fieldname.
 * @param {Array} files - req.files array
 * @param {Object} context - Optional context to store metadata (e.g. variations array)
 * @returns {Promise<Object>} - Object containing uploaded URLs mapped by field names or updated context
 */
const processProductUploads = async (files, variations = [], linkedTemplates = [], twoDModels = []) => {
    const uploadPromises = [];
    const results = {
        galleryImageUrls: [],
        blankFrontImageUrl: null,
        frontMaskImageUrl: null,
        frontOverlayImageUrl: null,
        blankBackImageUrl: null,
        backMaskImageUrl: null,
        backOverlayImageUrl: null,
        base3DModelUrl: null
    };

    if (!files || files.length === 0) return results;

    for (const file of files) {
        if (file.fieldname === 'galleryImages') {
            const promise = uploadToCloudinary(file.buffer, 'products/gallery').then(url => {
                results.galleryImageUrls.push(url);
            });
            uploadPromises.push(promise);
        } 
        else if (file.fieldname === 'blankFrontImage' || file.fieldname === 'base2DImageFile') {
            const promise = uploadToCloudinary(file.buffer, 'products/base').then(url => {
                results.blankFrontImageUrl = url;
            });
            uploadPromises.push(promise);
        }
        else if (file.fieldname === 'frontMaskImage') {
            const promise = uploadToCloudinary(file.buffer, 'products/masks').then(url => {
                results.frontMaskImageUrl = url;
            });
            uploadPromises.push(promise);
        }
        else if (file.fieldname === 'frontOverlayImage') {
            const promise = uploadToCloudinary(file.buffer, 'products/overlays').then(url => {
                results.frontOverlayImageUrl = url;
            });
            uploadPromises.push(promise);
        }
        else if (file.fieldname === 'blankBackImage') {
            const promise = uploadToCloudinary(file.buffer, 'products/base').then(url => {
                results.blankBackImageUrl = url;
            });
            uploadPromises.push(promise);
        }
        else if (file.fieldname === 'backMaskImage') {
            const promise = uploadToCloudinary(file.buffer, 'products/masks').then(url => {
                results.backMaskImageUrl = url;
            });
            uploadPromises.push(promise);
        }
        else if (file.fieldname === 'backOverlayImage') {
            const promise = uploadToCloudinary(file.buffer, 'products/overlays').then(url => {
                results.backOverlayImageUrl = url;
            });
            uploadPromises.push(promise);
        }
        else if (file.fieldname === 'base3DModelFile') {
            const promise = uploadToCloudinary(file.buffer, 'products/3d', 'raw').then(url => {
                results.base3DModelUrl = url;
            });
            uploadPromises.push(promise);
        }
        else if (file.fieldname.startsWith('variationImage_')) {
            const index = parseInt(file.fieldname.split('_')[1], 10);
            if (!isNaN(index) && variations[index]) {
                const promise = uploadToCloudinary(file.buffer, 'products/variations').then(url => {
                    variations[index].imageUrl = url;
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

    if (uploadPromises.length > 0) await Promise.all(uploadPromises);
    return results;
};

module.exports = {
    uploadToCloudinary,
    processProductUploads
};
