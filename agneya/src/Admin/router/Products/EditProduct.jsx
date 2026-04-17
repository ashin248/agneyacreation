import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiSave, FiAlertCircle, FiChevronRight, FiPackage, FiArrowLeft } from 'react-icons/fi';
import BasicProductInfoForm from './BasicProductInfoForm';
import ProductVariationsManager from './ProductVariationsManager';
import BulkPricingManager from './BulkPricingManager';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 1. Master State for Basic Product Info
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    description: '',
    category: '',
    productType: 'ready_made',
    basePrice: '',
    originalPrice: '',
    gstRate: 0,
    minOrder: 1,
    isCustomizable: false,
    customizationType: 'None',
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
  
  // 2. Master State for Product Variations
  const [variations, setVariations] = useState([]);

  // 3. Master State for Bulk Pricing
  const [isBulkEnabled, setIsBulkEnabled] = useState(false);
  const [bulkRules, setBulkRules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
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
      // For editing, we check PREVIEWS as well since files might not be re-uploaded
      if (basicInfo.customizationType === '2D' && !blankFrontImagePreview && !blankBackImagePreview) return "Blueprint images are required for 2D assets.";
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

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const product = response.data.data;
        setBasicInfo({
          name: product.name,
          description: product.description,
          category: product.category,
          productType: product.productType,
          basePrice: product.basePrice,
          originalPrice: product.originalPrice || '',
          gstRate: product.gstRate,
          minOrder: product.minOrder || 1,
          isCustomizable: product.isCustomizable,
          customizationType: product.customizationType || 'None',
          baseModelId: product.baseModelId || '',
        });
        
        setGalleryImagePreviews(product.galleryImages || []);
        setBlankFrontImagePreview(product.blankFrontImage || '');
        setFrontMaskImagePreview(product.frontMaskImage || '');
        setFrontOverlayImagePreview(product.frontOverlayImage || '');
        setBlankBackImagePreview(product.blankBackImage || '');
        setBackMaskImagePreview(product.backMaskImage || '');
        setBackOverlayImagePreview(product.backOverlayImage || '');
        
        setVariations((product.variations || []).map(v => ({
           ...v,
           id: v._id, 
           previewUrl: v.imageUrl
        })));

        setIsBulkEnabled(product.isBulkEnabled);
        setBulkRules((product.bulkRules || []).map(r => ({
           ...r,
           id: r._id
        })));
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setGlobalError("Failed to synchronize asset data from archives.");
    } finally {
      setLoading(false);
    }
  };

  const handleBasicInfoChange = (updateAction) => {
    setBasicInfo(prev => typeof updateAction === 'function' ? updateAction(prev) : updateAction);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setGlobalError(null);

    const errorMessage = validatePayload();
    if (errorMessage) {
      setGlobalError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('adminToken');
      
      const formData = new FormData();
      
      formData.append('name', basicInfo.name);
      formData.append('description', basicInfo.description);
      formData.append('category', basicInfo.category);
      formData.append('productType', basicInfo.isCustomizable ? 'customizable' : 'ready_made');
      formData.append('basePrice', Number(basicInfo.basePrice));
      if (basicInfo.originalPrice) formData.append('originalPrice', Number(basicInfo.originalPrice));
      formData.append('gstRate', Number(basicInfo.gstRate));
      formData.append('minOrder', Number(basicInfo.minOrder || 1));
      formData.append('isBulkEnabled', isBulkEnabled);
      formData.append('isCustomizable', basicInfo.isCustomizable);
      formData.append('customizationType', basicInfo.customizationType);
      if (basicInfo.baseModelId) formData.append('baseModelId', basicInfo.baseModelId);

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

      const existingImages = galleryImagePreviews.filter(url => typeof url === 'string' && url.startsWith('http'));
      formData.append('existingGalleryImages', JSON.stringify(existingImages));

      if (galleryImages && galleryImages.length > 0) {
        galleryImages.forEach(img => {
          formData.append('galleryImages', img);
        });
      }

      if (blankFrontImage) formData.append('blankFrontImage', blankFrontImage);
      if (frontMaskImage) formData.append('frontMaskImage', frontMaskImage);
      if (frontOverlayImage) formData.append('frontOverlayImage', frontOverlayImage);
      if (blankBackImage) formData.append('blankBackImage', blankBackImage);
      if (backMaskImage) formData.append('backMaskImage', backMaskImage);
      if (backOverlayImage) formData.append('backOverlayImage', backOverlayImage);
      if (base3DModelFile) formData.append('base3DModelFile', base3DModelFile);

      variations.forEach((v, index) => {
        if (v.imageFile) {
          formData.append(`variationImage_${index}`, v.imageFile);
        }
      });

      const response = await axios.put(`/api/admin/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.data.success) {
        alert("Asset archives updated successfully.");
        navigate('/admin/products/list');
      }
      
    } catch (err) {
      console.error('Update error:', err);
      setGlobalError(err.response?.data?.message || 'Archive synchronization failure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 bg-white/70 backdrop-blur-xl rounded-[32px] border border-gray-100 mt-10 shadow-2xl">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accessing Asset Archives...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-4 md:py-8 font-sans">
      <div className="max-w-5xl mx-auto pb-40">
        
        {/* PAGE HEADER */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-4 mb-3">
               <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-xl shadow-indigo-500/20">
                 <FiPackage size={22} />
               </div>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">
                 Catalog <FiChevronRight /> Modify Asset
               </div>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Modify Existing Asset</h1>
            <p className="mt-2 text-sm text-gray-400 font-bold max-w-xl leading-relaxed">Update metadata, inventory thresholds, and commercial rules for the active catalog catalog item.</p>
          </div>
          <button onClick={() => navigate(-1)} className="px-6 py-3 bg-white text-gray-400 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 border border-gray-100 shadow-sm hover:shadow-md">
            <FiArrowLeft size={14} /> Back to Vault
          </button>
        </div>

        {/* ERROR SYSTEM */}
        {globalError && (
          <div className="mb-10 bg-red-50/50 backdrop-blur-md border border-red-100 p-6 rounded-[32px] shadow-sm flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
             <div className="bg-red-500 text-white p-2 rounded-xl shadow-lg shadow-red-500/20">
                <FiAlertCircle size={18} />
             </div>
             <div>
               <h3 className="text-[11px] font-black text-red-600 uppercase tracking-widest leading-none mb-1.5 pt-1.5">Archive Alert</h3>
               <p className="text-sm text-red-800 font-bold">{globalError}</p>
             </div>
          </div>
        )}

        <form onSubmit={handleUpdateProduct} className="space-y-12">
          {/* CORE IDENTITY */}
          <section className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[40px] shadow-2xl shadow-gray-200/50 relative">
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
            />
          </section>

          {/* PERSISTENT ACTION HUD */}
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl bg-gray-900/90 backdrop-blur-2xl px-10 py-6 rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.3)] z-50 flex items-center justify-between border border-white/10 group overflow-hidden transition-all hover:bg-black">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            
            <div className="hidden md:block">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-1">Status: Archive Manipulation</p>
              <h4 className="text-lg font-black text-white tracking-tight">{basicInfo.name || 'Synchronizing...'}</h4>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <button
                type="button"
                onClick={() => navigate('/admin/products/list')}
                className="px-8 py-5 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all"
              >
                Abort Changes
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-12 py-5 bg-white text-gray-900 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95 flex items-center gap-4"
              >
                {isSubmitting ? (
                  <>Syncing Archives... <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div></>
                ) : (
                  <>Update Archives <FiSave size={18} /></>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditProduct;

