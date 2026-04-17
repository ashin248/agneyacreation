import React, { useState } from 'react';
import axios from 'axios';
import { FiSave, FiAlertCircle, FiChevronRight, FiPackage } from 'react-icons/fi';
import BasicProductInfoForm from './BasicProductInfoForm';
import ProductVariationsManager from './ProductVariationsManager';
import BulkPricingManager from './BulkPricingManager';

const CreateProduct = () => {
  // 1. Master State for Basic Product Info
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    description: '',
    category: '',
    productType: 'ready_made',
    basePrice: '',
    gstRate: 0,
    minOrder: 1,
    isCustomizable: false,
    customizationType: 'None',
    originalPrice: '',
    baseModelId: '',
  });
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState([]);
  const [blankFrontImage, setBlankFrontImage] = useState(null);
  const [blankFrontImagePreview, setBlankFrontImagePreview] = useState('');
  const [blankBackImage, setBlankBackImage] = useState(null);
  const [blankBackImagePreview, setBlankBackImagePreview] = useState('');
  const [frontMaskImage, setFrontMaskImage] = useState(null);
  const [frontMaskImagePreview, setFrontMaskImagePreview] = useState('');
  const [frontOverlayImage, setFrontOverlayImage] = useState(null);
  const [frontOverlayImagePreview, setFrontOverlayImagePreview] = useState('');
  const [backMaskImage, setBackMaskImage] = useState(null);
  const [backMaskImagePreview, setBackMaskImagePreview] = useState('');
  const [backOverlayImage, setBackOverlayImage] = useState(null);
  const [backOverlayImagePreview, setBackOverlayImagePreview] = useState('');
  const [base3DModelFile, setBase3DModelFile] = useState(null);
  
  // Custom helper to sync name to first variation SKU
  const handleBasicInfoChange = (updateAction) => {
    setBasicInfo(prev => {
      const next = typeof updateAction === 'function' ? updateAction(prev) : updateAction;
      
      // Auto-generate SKU for the first variation IF it's new and has no SKU yet
      if (variations.length === 1 && !variations[0].sku && next.name) {
        const generatedSku = next.name
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 8) + "-BASE";
          
        setVariations(prevVars => [
          { ...prevVars[0], sku: generatedSku }
        ]);
      }
      return next;
    });
  };

  // 2. Master State for Product Variations
  const [variations, setVariations] = useState([]);

  // 3. Master State for Bulk Pricing
  const [isBulkEnabled, setIsBulkEnabled] = useState(false);
  const [bulkRules, setBulkRules] = useState([
    {
      id: Date.now().toString(),
      minQty: 5, // Based on user feedback, default to a realistic wholesale start if enabled
      maxQty: '',
      pricePerUnit: '',
    }
  ]);

  // Global validation states
  const [globalError, setGlobalError] = useState(null);
  const [bulkError, setBulkError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation function wrapper for child forms
  const validatePayload = () => {
    // Basic Info validation
    if (!String(basicInfo.name || '').trim()) return "Product Identity is required.";
    if (!String(basicInfo.description || '').trim()) return "Asset description is required.";
    if (!String(basicInfo.category || '').trim()) return "Classification category is required.";
    if (basicInfo.basePrice === '' || Number(basicInfo.basePrice) < 0) return "Valid base value is required.";
    if (basicInfo.isCustomizable) {
      if (!basicInfo.customizationType || basicInfo.customizationType === 'None') return "Design framework type is required.";
      if (basicInfo.customizationType === '2D' && !blankFrontImage && !blankBackImage) return "Blueprint images are required for 2D assets.";
      if (basicInfo.customizationType === '3D' && !base3DModelFile && !basicInfo.baseModelId) return "3D geometry file or library model selection is required.";
    }

    // Variations validation
    if (variations.length === 0) return "At least one SKU variation must be defined.";
    for (const v of variations) {
      if (!String(v.sku || '').trim()) return "SKU marker is missing for variation.";
      if (v.stock === '' || isNaN(v.stock) || Number(v.stock) < 0) return "Inventory count is required for all variations.";
    }

    // Bulk Validation
    if (isBulkEnabled) {
      if (bulkRules.length === 0) return "Define at least one wholesale tier or disable Bulk mode.";
      for (const rule of bulkRules) {
        if (rule.minQty < 2) return "Wholesale minimum must be 2 or higher.";
        if (rule.maxQty !== '' && Number(rule.maxQty) < Number(rule.minQty)) return "Tier range logic is invalid (Max < Min).";
        if (rule.pricePerUnit === '' || Number(rule.pricePerUnit) < 0) return "Valid wholesale unit value is required.";
      }
    }

    return null;
  };

  const handlePublishProduct = async (e) => {
    e.preventDefault();
    setGlobalError(null);
    setBulkError(null);

    const errorMessage = validatePayload();
    if (errorMessage) {
      setGlobalError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      
      // Basic Info appending
      formData.append('name', basicInfo.name);
      formData.append('description', basicInfo.description);
      formData.append('category', basicInfo.category);
      formData.append('productType', basicInfo.isCustomizable ? 'customizable' : 'ready_made');
      formData.append('basePrice', Number(basicInfo.basePrice));
      formData.append('gstRate', Number(basicInfo.gstRate));
      formData.append('minOrder', Number(basicInfo.minOrder || 1));
      formData.append('isBulkEnabled', isBulkEnabled);
      formData.append('isCustomizable', basicInfo.isCustomizable);
      formData.append('customizationType', basicInfo.customizationType);
      if (basicInfo.originalPrice) {
        formData.append('originalPrice', Number(basicInfo.originalPrice));
      }
      if (basicInfo.baseModelId) {
        formData.append('baseModelId', basicInfo.baseModelId);
      }

      // Arrays formatting and appending
      const finalVariations = variations.map(({ id, previewUrl, ...rest }) => ({
        ...rest,
        stock: Number(rest.stock),
        priceModifier: Number(rest.priceModifier),
      }));

      const finalBulkRules = isBulkEnabled ? bulkRules.map(({ id, ...rest }) => ({
        minQty: Number(rest.minQty),
        maxQty: rest.maxQty === '' ? null : Number(rest.maxQty),
        pricePerUnit: Number(rest.pricePerUnit),
      })) : [];

      formData.append('variations', JSON.stringify(finalVariations));
      formData.append('bulkRules', JSON.stringify(finalBulkRules));

      // Append Gallery Images
      if (galleryImages && galleryImages.length > 0) {
        galleryImages.forEach(img => {
          formData.append('galleryImages', img);
        });
      }

      // Append Customization Files
      if (blankFrontImage) formData.append('blankFrontImage', blankFrontImage);
      if (frontMaskImage) formData.append('frontMaskImage', frontMaskImage);
      if (frontOverlayImage) formData.append('frontOverlayImage', frontOverlayImage);
      if (blankBackImage) formData.append('blankBackImage', blankBackImage);
      if (backMaskImage) formData.append('backMaskImage', backMaskImage);
      if (backOverlayImage) formData.append('backOverlayImage', backOverlayImage);
      if (base3DModelFile) formData.append('base3DModelFile', base3DModelFile);

      // Append Variation Images strictly pointing to index
      variations.forEach((v, index) => {
        if (v.imageFile) {
          formData.append(`variationImage_${index}`, v.imageFile);
        }
      });

      // Secure Administrative API Request
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('/api/admin/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.data.success) {
        alert("Asset successfully depoloyed to the central catalog.");
        window.location.reload(); 
      }
      
    } catch (err) {
      console.error('Submission error:', err);
      const backendMessage = err.response?.data?.debugError || err.response?.data?.message || err.response?.data?.error;
      setGlobalError(backendMessage || 'Archive synchronization failure. Check network connectivity.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-4 md:py-8 font-sans">
      <div className="max-w-5xl mx-auto pb-40">
        
        {/* PAGE HEADER */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-3">
             <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-xl shadow-indigo-500/20">
               <FiPackage size={22} />
             </div>
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">
               Catalog <FiChevronRight /> Create Asset
             </div>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Initialize New Asset</h1>
          <p className="mt-2 text-sm text-gray-400 font-bold max-w-xl leading-relaxed"> Configure product identity, inventory variations, and wholesale pricing tiers for the storefront catalog.</p>
        </div>

        {/* ERROR SYSTEM */}
        {globalError && (
          <div className="mb-10 bg-red-50/50 backdrop-blur-md border border-red-100 p-6 rounded-[32px] shadow-sm flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
             <div className="bg-red-500 text-white p-2 rounded-xl shadow-lg shadow-red-500/20">
                <FiAlertCircle size={18} />
             </div>
             <div>
               <h3 className="text-[11px] font-black text-red-600 uppercase tracking-widest leading-none mb-1.5 pt-1.5">Validation Alert</h3>
               <p className="text-sm text-red-800 font-bold">{globalError}</p>
             </div>
          </div>
        )}

        <form onSubmit={handlePublishProduct} className="space-y-12">
          {/* CORE IDENTITY */}
          <section className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[40px] shadow-2xl shadow-gray-200/50">
            <BasicProductInfoForm 
              formData={basicInfo} 
              setFormData={handleBasicInfoChange}
              images={galleryImages}
              setImages={setGalleryImages}
              imagePreviews={galleryImagePreviews}
              setImagePreviews={setGalleryImagePreviews}
              blankFrontImage={blankFrontImage}
              setBlankFrontImage={setBlankFrontImage}
              blankFrontImagePreview={blankFrontImagePreview}
              setBlankFrontImagePreview={setBlankFrontImagePreview}
              frontMaskImage={frontMaskImage}
              setFrontMaskImage={setFrontMaskImage}
              frontMaskImagePreview={frontMaskImagePreview}
              setFrontMaskImagePreview={setFrontMaskImagePreview}
              frontOverlayImage={frontOverlayImage}
              setFrontOverlayImage={setFrontOverlayImage}
              frontOverlayImagePreview={frontOverlayImagePreview}
              setFrontOverlayImagePreview={setFrontOverlayImagePreview}
              blankBackImage={blankBackImage}
              setBlankBackImage={setBlankBackImage}
              blankBackImagePreview={blankBackImagePreview}
              setBlankBackImagePreview={setBlankBackImagePreview}
              backMaskImage={backMaskImage}
              setBackMaskImage={setBackMaskImage}
              backMaskImagePreview={backMaskImagePreview}
              setBackMaskImagePreview={setBackMaskImagePreview}
              backOverlayImage={backOverlayImage}
              setBackOverlayImage={setBackOverlayImage}
              backOverlayImagePreview={backOverlayImagePreview}
              setBackOverlayImagePreview={setBackOverlayImagePreview}
              base3DModelFile={base3DModelFile}
              setBase3DModelFile={setBase3DModelFile}
            />
          </section>

          {/* INVENTORY & VARIATIONS */}
          <section className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[40px] shadow-2xl shadow-gray-200/50">
            <ProductVariationsManager 
              variations={variations}
              setVariations={setVariations}
              baseProductName={basicInfo.name || "PROD"}
            />
          </section>

          {/* FINANCIAL TIERS */}
          <section className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[40px] shadow-2xl shadow-gray-200/50">
            <BulkPricingManager 
              isBulkEnabled={isBulkEnabled}
              setIsBulkEnabled={setIsBulkEnabled}
              bulkRules={bulkRules}
              setBulkRules={setBulkRules}
              globalError={bulkError}
            />
          </section>

          {/* PERSISTENT ACTION HUD */}
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl bg-gray-900/90 backdrop-blur-2xl px-10 py-6 rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.3)] z-50 flex items-center justify-between border border-white/10 group overflow-hidden transition-all hover:bg-black">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            
            <div className="hidden md:block">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-1">Status: Configuration</p>
              <h4 className="text-lg font-black text-white tracking-tight">{basicInfo.name || 'New Asset Creation'}</h4>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-12 py-5 bg-white text-gray-900 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-500 hover:text-white transition-all transform active:scale-95 flex items-center gap-4 relative z-10 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isSubmitting ? (
                <>Synchronizing Archives... <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div></>
              ) : (
                <>Deploy to Catalog <FiSave size={18} /></>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateProduct;

