import React from 'react';
import { MODELS } from '../../../Client/components/Three/ProductLibrary';
import { TWOD_TEMPLATES } from '../../../Client/components/TwoD/TwoDTemplateLibrary';
import { FiCheckCircle, FiGrid } from 'react-icons/fi';

const BasicProductInfoForm = ({ 
  formData, setFormData, 
  images, setImages, 
  imagePreviews, setImagePreviews, 
  base3DModelFile, setBase3DModelFile,
  base2DImageFile, setBase2DImageFile
}) => {
  const sendDebugLog = (hypothesisId, location, message, data = {}, runId = 'initial') => {
    // #region agent log
    fetch('http://127.0.0.1:7742/ingest/f73f9efc-7d57-444d-946a-342d190e0162',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8362af'},body:JSON.stringify({sessionId:'8362af',runId,hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  };

  const select2DTemplate = (template) => {
    if (!template) {
      setFormData(prev => ({
        ...prev,
        canvasConfig: null,
        shapeConfig: null,
        baseModelId: ''
      }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      canvasConfig: template.canvasConfig,
      shapeConfig: template.shapeConfig,
      baseModelId: template.id
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
        setBase2DImageFile && setBase2DImageFile(null);
        setFormData(prev => ({ ...prev, baseModelId: '', canvasConfig: null, shapeConfig: null }));
      } else if (value === 'Both') {
          // Keep both accessible; baseModelId will track the primary selector
      } else if (value === 'None') {
        setBase3DModelFile && setBase3DModelFile(null);
        setBase2DImageFile && setBase2DImageFile(null);
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

  const renderThumbnail = (model) => {
    const generateTextThumbnail = (name) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 30px Arial';

        const words = String(name || '2D Template').split(' ');
        const lines = [];
        let line = '';
        words.forEach((word) => {
          const testLine = line ? `${line} ${word}` : word;
          if (ctx.measureText(testLine).width > 420) {
            lines.push(line);
            line = word;
          } else {
            line = testLine;
          }
        });
        if (line) lines.push(line);

        const maxLines = 4;
        const clipped = lines.slice(0, maxLines);
        const lineHeight = 40;
        const startY = (canvas.height - (clipped.length - 1) * lineHeight) / 2;
        clipped.forEach((text, index) => {
          ctx.fillText(text, canvas.width / 2, startY + index * lineHeight);
        });
        return canvas.toDataURL('image/png');
      } catch {
        return '';
      }
    };

    const displayUrl = model?.thumbnail || generateTextThumbnail(model?.name);
    return <img src={displayUrl} alt={model?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.src = generateTextThumbnail(model?.name); }} />;
  };

  const handle3DModelChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBase3DModelFile(file);
    }
  };

  const handle2DImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBase2DImageFile(file);
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
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

            {/* 2D SECTION: Remount on type change to ensure clean transition */}
            {(formData.customizationType === '2D' || formData.customizationType === 'Both') && (
              <div key="custom-2d-block" className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-6 rounded-2xl border border-blue-100 mb-6">
                
                {/* Left Column: Template Selection */}
                <div>
                  <label className="block text-[11px] font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FiGrid size={14} />
                    Select 2D Template
                  </label>
                  
                  <div className="space-y-6">
                    <select
                      onChange={(e) => {
                        const selected = TWOD_TEMPLATES[e.target.value];
                        select2DTemplate(selected);
                      }}
                      value={formData.baseModelId || ''}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800"
                    >
                      <option value="">-- Choose a Product Template --</option>
                      {Object.values(TWOD_TEMPLATES).map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.category})
                        </option>
                      ))}
                    </select>

                    {/* Smart Thumbnail Preview */}
                    {formData.baseModelId && TWOD_TEMPLATES[formData.baseModelId] && (
                      <div className="border rounded-xl shadow-sm overflow-hidden bg-white aspect-square max-w-[240px] mx-auto animate-in zoom-in duration-300">
                        {(() => {
                          const activeTemplate = TWOD_TEMPLATES[formData.baseModelId];
                          return (
                            <div className="w-full h-full relative group">
                              <img 
                                src={activeTemplate.thumbnail} 
                                alt={activeTemplate.name} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              />
                              <div className="absolute top-2 right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-lg">
                                <FiCheckCircle size={14} />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 font-medium mt-4 leading-relaxed">
                     Selecting a template automatically applies the clipping shape and realistic finishes in the design studio.
                  </p>
                </div>

                {/* Right Column: Base Backdrop Image Upload */}
                <div>
                  <label className="block text-[11px] font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FiImage size={14} />
                    Base Backdrop Image (Optional)
                  </label>
                  
                  <div className={`p-6 border-2 border-dashed rounded-2xl group transition-all relative overflow-hidden ${base2DImageFile ? 'border-emerald-300 bg-emerald-50/30' : 'border-blue-200 bg-blue-50/20 hover:border-blue-400'}`}>
                    <div className="relative z-10 text-center space-y-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto shadow-sm mb-2 ${base2DImageFile ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-blue-500'}`}>
                         <FiImage size={24} />
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className={`text-[13px] font-bold ${base2DImageFile ? 'text-emerald-800' : 'text-blue-900'}`}>Upload Base Photo</h4>
                        <p className={`text-[10px] leading-relaxed ${base2DImageFile ? 'text-emerald-600' : 'text-gray-500'}`}>
                           Provide a clear photo of the plain product (e.g., wooden plaque or blank medal). 
                           <br/>Leave empty to use the template's default image.
                        </p>
                      </div>

                      <div className="pt-3">
                        <label className={`inline-flex items-center gap-2 px-6 py-2.5 text-white text-[11px] font-bold rounded-xl cursor-pointer transition-all shadow-md active:scale-95 ${base2DImageFile ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                           {base2DImageFile ? 'Change Photo' : 'Select Photo'}
                           <FiPlus size={14} />
                           <input type="file" onChange={handle2DImageChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
                        </label>
                      </div>

                      {base2DImageFile && (
                        <div className="mt-3 flex items-center justify-center gap-2 animate-in fade-in">
                           <span className="text-[10px] font-bold text-emerald-700 truncate max-w-[150px] bg-emerald-100 px-2 py-1 rounded">
                              {base2DImageFile.name}
                           </span>
                           <button type="button" onClick={() => setBase2DImageFile(null)} className="text-red-400 hover:text-red-600 p-1">
                              <FiTrash2 size={14} />
                           </button>
                        </div>
                      )}
                    </div>
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

