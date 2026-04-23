import React from 'react';
import { MODELS } from '../../../Client/components/Three/ProductLibrary';
// import { TWOD_TEMPLATES } from '../../../Client/components/TwoD/TwoDTemplateLibrary';
// import TemplateThumbnail from '../../../Client/components/TwoD/TemplateThumbnail';
import { FiCheckCircle, FiGrid, FiImage, FiPlus, FiTrash2, FiBox, FiPackage, FiAlertCircle, FiCheck } from 'react-icons/fi';

const BasicProductInfoForm = ({ 
  formData, setFormData, 
  images, setImages, 
  imagePreviews, setImagePreviews, 
  base3DModelFile, setBase3DModelFile
}) => {
  const sendDebugLog = (hypothesisId, location, message, data = {}, runId = 'initial') => {
    // #region agent log
    // fetch('http://127.0.0.1:7742/ingest/f73f9efc-7d57-444d-946a-342d190e0162',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8362af'},body:JSON.stringify({sessionId:'8362af',runId,hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  };

  const select2DTemplate = (template) => {
    if (!template) {
      setFormData(prev => ({
        ...prev,
        canvasConfig: null,
        shapeConfig: null,
        base2DTemplateId: ''
      }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      canvasConfig: template.canvasConfig,
      shapeConfig: template.shapeConfig,
      base2DTemplateId: template.id,
      blankFrontImageUrl: template.defaultBackdrop || template.thumbnail || ''
    }));
    sendDebugLog('H2', 'BasicProductInfoForm.jsx:select2DTemplate', 'Selected 2D code template', {
      templateId: template.id,
      hasShapeConfig: !!template.shapeConfig
    });
  };

  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'customizationType') {
      sendDebugLog('H3', 'BasicProductInfoForm.jsx:handleInputChange', 'Customization type changed', { toType: value });
      
      if (value === '2D') {
        // Clean 3D
        setBase3DModelFile && setBase3DModelFile(null);
        setFormData(prev => ({ ...prev, baseModelId: '' }));
      } else if (value === '3D') {
        // Clean 2D
        setFormData(prev => ({ ...prev, base2DTemplateId: '', canvasConfig: null, shapeConfig: null }));
      } else if (value === 'Both') {
          // Keep both accessible; baseModelId will track the primary selector
      } else if (value === 'None') {
        setBase3DModelFile && setBase3DModelFile(null);
        setFormData(prev => ({ 
            ...prev, 
            baseModelId: '', 
            canvasConfig: null, 
            shapeConfig: null,
            customizationType: 'None'
        }));
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Limit to 5 images total
    const totalSelected = images.length + selectedFiles.length;
    if (totalSelected > 5) {
      alert("You can only upload a maximum of 5 gallery images.");
      return;
    }

    const newImages = [...images, ...selectedFiles];
    setImages(newImages);

    const newPreviews = (Array.isArray(selectedFiles) ? selectedFiles : []).map(file => URL.createObjectURL(file));
    if (Array.isArray(imagePreviews)) {
      setImagePreviews([...imagePreviews, ...newPreviews]);
    } else {
      setImagePreviews(newPreviews);
    }
  };

  const removeImage = (index) => {
    const previewUrl = imagePreviews[index];
    const isBlobUrl = previewUrl.startsWith('blob:') || previewUrl.startsWith('data:');
    
    if (isBlobUrl) {
      // Find the index of this exact blob URL in the newly added images array
      let blobCountBeforeIndex = 0;
      for (let i = 0; i < index; i++) {
        if (imagePreviews[i].startsWith('blob:') || imagePreviews[i].startsWith('data:')) {
          blobCountBeforeIndex++;
        }
      }
      
      const newImages = [...images];
      newImages.splice(blobCountBeforeIndex, 1);
      setImages(newImages);
      URL.revokeObjectURL(previewUrl);
    }
    
    if (Array.isArray(imagePreviews)) {
      const newPreviews = [...imagePreviews];
      newPreviews.splice(index, 1);
      setImagePreviews(newPreviews);
    }
  };

  const handle3DModelChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBase3DModelFile(file);
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const toggleLinkedTemplate = (templateId) => {
    setFormData(prev => {
      const current = prev.linkedTemplates || [];
      const existingIndex = current.findIndex(t => (t.templateId || t.id) === templateId || t === templateId);
      
      let next;
      if (existingIndex >= 0) {
        next = current.filter((_, i) => i !== existingIndex);
      } else {
        next = [...current, { templateId: templateId, overrideFile: null, overridePreview: null }];
      }
      return { ...prev, linkedTemplates: next };
    });
  };

  const handleOverrideImageChange = (e, templateId) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData(prev => {
      const current = prev.linkedTemplates || [];
      const next = current.map(t => {
        const id = typeof t === 'string' ? t : (t.templateId || t.id);
        if (id === templateId) {
          return {
            templateId: id,
            overrideFile: file,
            overridePreview: URL.createObjectURL(file)
          };
        }
        return typeof t === 'string' ? { templateId: t } : t;
      });
      return { ...prev, linkedTemplates: next };
    });
  };

  const selectAllTemplates = () => {
    // Determine target category from the currently selected base template
    const currentCategory = TWOD_TEMPLATES[formData.base2DTemplateId]?.category;
    if (!currentCategory) return;

    const filteredTemplates = Object.values(TWOD_TEMPLATES)
      .filter(template => template.category === currentCategory);
    
    setFormData(prev => ({
      ...prev,
      linkedTemplates: filteredTemplates.map(t => {
         const existing = (prev.linkedTemplates || []).find(ext => (typeof ext === 'string' ? ext : (ext.templateId || ext.id)) === t.id);
         return existing || { templateId: t.id, overrideFile: null, overridePreview: null };
      })
    }));
  };

  const addMockupView = () => {
    const next = [...(formData.mockupViews || []), { 
      id: Date.now(), 
      label: 'New View', 
      mockupFile: null, 
      mockupPreview: null,
      width: 500,
      height: 500
    }];
    setFormData(prev => ({ ...prev, mockupViews: next }));
  };

  const removeMockupView = (id) => {
    setFormData(prev => ({
      ...prev,
      mockupViews: (prev.mockupViews || []).filter(v => v.id !== id)
    }));
  };

  const updateMockupView = (id, updates) => {
    setFormData(prev => ({
      ...prev,
      mockupViews: (prev.mockupViews || []).map(v => v.id === id ? { ...v, ...updates } : v)
    }));
  };

  const handleMockupFileChange = (e, id) => {
    const file = e.target.files[0];
    if (!file) return;
    updateMockupView(id, { 
      mockupFile: file, 
      mockupPreview: URL.createObjectURL(file) 
    });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Basic Product Info</h2>
      
      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Enter product name"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[120px]"
            placeholder="Enter product description"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">
              Category
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="e.g., Electronics, Clothing"
              />
              {formData.category && (
                <div className="w-10 h-10 rounded-md overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0 animate-in fade-in zoom-in duration-300">
                  <img 
                    src={`https://image.pollinations.ai/prompt/${encodeURIComponent(formData.category)}%20product%20photography%20minimalist?width=100&height=100&nologo=true&seed=${formData.category.length}`} 
                    alt="Category Preview" 
                    className="w-full h-full object-cover"
                    title="AI Generated Category Preview"
                    onError={(e) => {
                      e.target.src = `https://source.unsplash.com/100x100/?${encodeURIComponent(formData.category)}`;
                    }}
                  />
                </div>
              )}
            </div>
            <p className="mt-1 text-[10px] text-gray-400 font-medium italic">AI will generate a visual representing this category on the shop page.</p>
          </div>

          {/* Product Type (Deprecated/Replaced by Checkbox) */}
          <div className="flex items-center space-x-3 pt-6">
            <input
              type="checkbox"
              id="isCustomizable"
              name="isCustomizable"
              checked={formData.isCustomizable}
              onChange={handleCheckboxChange}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isCustomizable" className="text-sm font-bold text-gray-700">
              Is this product customizable?
            </label>
          </div>

          {/* Original Price / MRP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="originalPrice">
              Original Price / MRP (₹)
            </label>
            <input
              type="number"
              id="originalPrice"
              name="originalPrice"
              value={formData.originalPrice || ''}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="0.00"
            />
          </div>

          {/* Sale Price / Base Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="basePrice">
              Sale Price / Base Price (₹) *
            </label>
            <input
              type="number"
              id="basePrice"
              name="basePrice"
              value={formData.basePrice}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="0.00"
              required
            />
          </div>

          {/* Min Order Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="minOrder">
              Min Order Qty *
            </label>
            <input
              type="number"
              id="minOrder"
              name="minOrder"
              value={formData.minOrder || 1}
              onChange={handleInputChange}
              min="1"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="1"
              required
            />
            <p className="mt-1 text-[10px] text-gray-400 font-medium">The absolute minimum quantity a customer must order.</p>
          </div>

          {/* GST Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="gstRate">
              GST Rate (%)
            </label>
            <select
              id="gstRate"
              name="gstRate"
              value={formData.gstRate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
            >
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>
        </div>

        {/* Multi-Image Gallery */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Product Gallery (Max 5 images) *
          </label>
          
          {/* Drag & Drop Zone */}
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-400 transition-all bg-gray-50/50 group relative">
            <input
              id="galleryImages"
              name="galleryImages"
              type="file"
              multiple
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleImageChange}
              disabled={images.length >= 5}
            />
            <div className="space-y-2 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600 justify-center font-semibold">
                <span className="text-blue-600">Click to upload</span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                {5 - images.length} slots remaining
              </p>
            </div>
          </div>

          {/* Gallery Preview Grid */}
          {Array.isArray(imagePreviews) && imagePreviews.length > 0 && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden shadow-md border-2 border-gray-100 bg-white">
                  {preview && <img src={preview} alt={`Gallery ${index}`} className="w-full h-full object-cover" />}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-0 inset-x-0 bg-blue-600 text-white text-[10px] font-bold text-center py-0.5">
                      FEATURED
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Customization (Only if Customizable) */}
        {formData.isCustomizable && (
          <div className="mt-8 p-6 border-2 border-blue-100 bg-blue-50/50 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Customization Settings</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Customization Type</label>
              <div className="flex bg-white rounded-lg border border-blue-200 overflow-hidden w-fit">
                {['2D', '3D', 'Both'].map((type) => (
                  <label key={type} className={`cursor-pointer px-6 py-2 border-r last:border-r-0 border-blue-200 transition-colors ${formData.customizationType === type ? 'bg-blue-600 text-white font-bold' : 'text-gray-600 hover:bg-blue-50'}`}>
                    <input
                      type="radio"
                      name="customizationType"
                      value={type}
                      checked={formData.customizationType === type}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* --- NEW 2D MOCKUP VIEWS ENGINE --- */}
            {(formData.customizationType === '2D' || formData.customizationType === 'Both') && (
              <div key="mockup-views-block" className="mt-8 pt-8 border-t border-blue-100 animate-in fade-in duration-700">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <label className="block text-[11px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                      <FiGrid size={14} />
                      2D Mockup Architecture (Multi-View)
                    </label>
                    <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">Upload transparent PNGs for different product angles</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={addMockupView}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                  >
                    <FiPlus size={14} /> Add New View
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(formData.mockupViews || []).map((view) => (
                    <div key={view.id} className="bg-white p-6 rounded-[24px] border-2 border-slate-100 hover:border-blue-200 transition-all shadow-sm group">
                      <div className="flex items-center justify-between mb-4">
                        <input 
                          type="text" 
                          value={view.label}
                          onChange={(e) => updateMockupView(view.id, { label: e.target.value })}
                          className="bg-slate-50 border-none text-[12px] font-black uppercase tracking-widest text-slate-900 focus:ring-0 w-2/3 rounded-lg px-3 py-1.5"
                          placeholder="View Name (e.g. Front Side)"
                        />
                        <button 
                          type="button" 
                          onClick={() => removeMockupView(view.id)}
                          className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-all"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>

                      <div className="flex gap-4">
                        {/* Mockup Upload */}
                        <div className="flex-1">
                          <label className={`relative block aspect-square rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-all ${view.mockupPreview ? 'border-blue-100' : 'border-slate-200 hover:border-blue-400 bg-slate-50'}`}>
                            {view.mockupPreview ? (
                              <img src={view.mockupPreview} className="w-full h-full object-contain" alt="Mockup" />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
                                <FiImage size={24} className="text-slate-400" />
                                <span className="text-[8px] font-black text-slate-500 uppercase leading-tight">Upload Mockup PNG<br/>(Transparent)</span>
                              </div>
                            )}
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/png"
                              onChange={(e) => handleMockupFileChange(e, view.id)}
                            />
                          </label>
                        </div>

                        {/* Dimensions & Config */}
                        <div className="w-1/3 space-y-4">
                          <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Canvas Width</label>
                            <input 
                              type="number" 
                              value={view.width}
                              onChange={(e) => updateMockupView(view.id, { width: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-bold text-slate-900 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Canvas Height</label>
                            <input 
                              type="number" 
                              value={view.height}
                              onChange={(e) => updateMockupView(view.id, { height: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-bold text-slate-900 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="pt-2">
                             <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100">
                                <FiCheck size={12} />
                                <span className="text-[8px] font-black uppercase tracking-tighter">View Connected</span>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(formData.mockupViews || []).length === 0 && (
                    <div className="md:col-span-2 py-12 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-center">
                       <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300">
                          <FiImage size={32} />
                       </div>
                       <div>
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">No Mockup Views Added</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Start by adding your first product angle</p>
                       </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 bg-slate-900 rounded-[32px] p-8 border border-white/5 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <FiZap size={80} className="text-blue-400" />
                   </div>
                   <div className="relative z-10 max-w-xl">
                      <h5 className="text-[12px] font-black text-white uppercase tracking-[0.2em] mb-3">Architectural Blueprint</h5>
                      <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                        Your transparent mockup acts as the top-most layer in the studio. 
                        User-uploaded photos will be automatically clipped by the transparent areas of your PNG, 
                        ensuring a pixel-perfect placement on the actual product geometry.
                      </p>
                   </div>
                </div>
              </div>
            )}

            {/* 3D SECTION */}
            {(formData.customizationType === '3D' || formData.customizationType === 'Both') && (
              <div key="custom-3d-block" className="space-y-8 animate-in fade-in zoom-in duration-500">
                
                {/* 1. SYSTEM PRESETS GRID */}
                <div>
                  <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FiGrid size={12} />
                    System Architecture Presets
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {MODELS && Object.values(MODELS).map((model) => (
                      <div 
                        key={model?.id}
                        onClick={() => {
                          handleInputChange({ target: { name: 'baseModelId', value: model?.id }});
                          setBase3DModelFile(null); // Clear manual upload
                        }}
                        className={`group relative aspect-square rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
                          formData.baseModelId === model?.id ? 'border-blue-600 ring-4 ring-blue-50' : 'border-gray-100 hover:border-blue-200'
                        }`}
                      >
                        {model?.thumbnail && <img src={model.thumbnail} alt={model.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                          <p className="text-[9px] font-black text-white uppercase tracking-tight leading-tight">{model?.name || '3D Asset'}</p>
                        </div>
                        {formData.baseModelId === model?.id && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-lg">
                            <FiCheckCircle size={10} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2">
                   <div className="h-px bg-gray-200 flex-1"></div>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">OR</span>
                   <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                {/* 2. CUSTOM UPLOAD HUB */}
                <div className={`p-8 border-2 border-dashed rounded-[32px] group transition-all relative overflow-hidden ${base3DModelFile ? 'border-emerald-200 bg-emerald-50/20' : 'border-blue-200 bg-white hover:border-blue-500'}`}>
                  <div className={`absolute inset-0 bg-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity ${base3DModelFile && 'hidden'}`}></div>
                  
                  <div className="relative z-10 text-center space-y-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4 ${base3DModelFile ? 'bg-emerald-100 text-emerald-600 shadow-emerald-500/10' : 'bg-blue-100 text-blue-600 shadow-blue-500/10'}`}>
                       <FiBox size={32} />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className={`text-[14px] font-black uppercase tracking-widest ${base3DModelFile ? 'text-emerald-900' : 'text-blue-900'}`}>Custom Architecture (.glb)</h4>
                      <p className={`text-[11px] font-bold italic ${base3DModelFile ? 'text-emerald-600' : 'text-blue-500'}`}>Upload a unique GLB file if not using a preset above.</p>
                    </div>

                    <div className="pt-4">
                      <label htmlFor="masterModelInput" className={`inline-flex items-center gap-3 px-8 py-4 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl cursor-pointer transition-all shadow-xl active:scale-95 ${base3DModelFile ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-blue-600 shadow-blue-500/20 hover:bg-slate-900'}`}>
                         {base3DModelFile ? 'Replace_File' : 'Upload_New_Geometry'}
                         <FiPackage size={16} />
                      </label>
                      <input id="masterModelInput" type="file" onChange={(e) => {
                          handle3DModelChange(e);
                          handleInputChange({ target: { name: 'baseModelId', value: '' }}); // Clear preset selection
                      }} className="hidden" accept=".glb,.gltf" />
                    </div>

                    {base3DModelFile && (
                      <div className="mt-4 flex items-center justify-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
                         <div className="px-4 py-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-500/30">
                            Ready: {base3DModelFile.name}
                         </div>
                         <button type="button" onClick={() => { setBase3DModelFile(null); }} className="text-red-500 hover:text-red-700 transition-colors">
                            <FiTrash2 size={16} />
                         </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[24px] p-6 border border-white/5">
                   <div className="flex items-start gap-4">
                      <div className="bg-white/5 p-2 rounded-xl text-indigo-400">
                         <FiAlertCircle size={18} />
                      </div>
                      <div>
                         <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1.5">Model Optimization Guidelines</h5>
                         <p className="text-[11px] text-slate-400 font-bold leading-relaxed">Ensure your GLB model is optimized ({"<"} 5MB) and contains a clearly named printable mesh for texture projection. 3D coordinates will be automatically synchronized with the Agneya Design Engine.</p>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicProductInfoForm;

