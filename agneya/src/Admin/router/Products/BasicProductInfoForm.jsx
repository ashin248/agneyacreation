import React from 'react';
import { MODELS } from '../../../Client/components/Three/ProductLibrary';
import { FiCheckCircle, FiBox, FiPackage, FiTrash2, FiAlertCircle, FiGrid } from 'react-icons/fi';

const BasicProductInfoForm = ({ 
  formData, setFormData, 
  images, setImages, 
  imagePreviews, setImagePreviews, 
  blankFrontImage, setBlankFrontImage, 
  blankFrontImagePreview, setBlankFrontImagePreview, 
  frontMaskImage, setFrontMaskImage,
  frontMaskImagePreview, setFrontMaskImagePreview,
  frontOverlayImage, setFrontOverlayImage,
  frontOverlayImagePreview, setFrontOverlayImagePreview,
  blankBackImage, setBlankBackImage, 
  blankBackImagePreview, setBlankBackImagePreview, 
  backMaskImage, setBackMaskImage,
  backMaskImagePreview, setBackMaskImagePreview,
  backOverlayImage, setBackOverlayImage,
  backOverlayImagePreview, setBackOverlayImagePreview,
  base3DModelFile, setBase3DModelFile 
}) => {

  // Helper to sync basic info changes to the parent controller
  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // EXCLUSIVE STATE CLEANING: If switching customization type, clear unrelated assets
    if (name === 'customizationType') {
      if (value === '2D') {
        // Clear 3D artifacts: Wipe baseModelId in parent and clear manual file upload
        handleBasicInfoChange({ target: { name: 'baseModelId', value: '' }});
        setBase3DModelFile && setBase3DModelFile(null);
      } else if (value === '3D') {
        // Clear 2D artifacts: Wipe images and their previews
        setBlankFrontImage && setBlankFrontImage(null);
        setBlankFrontImagePreview && setBlankFrontImagePreview('');
        setBlankBackImage && setBlankBackImage(null);
        setBlankBackImagePreview && setBlankBackImagePreview('');
        
        // Also clear associated masks and overlays
        setFrontMaskImage && setFrontMaskImage(null);
        setFrontMaskImagePreview && setFrontMaskImagePreview('');
        setFrontOverlayImage && setFrontOverlayImage(null);
        setFrontOverlayImagePreview && setFrontOverlayImagePreview('');
        setBackMaskImage && setBackMaskImage(null);
        setBackMaskImagePreview && setBackMaskImagePreview('');
        setBackOverlayImage && setBackOverlayImage(null);
        setBackOverlayImagePreview && setBackOverlayImagePreview('');
      } else if (value === 'None') {
        // Clear everything if customization is disabled
        setBlankFrontImage && setBlankFrontImage(null);
        setBlankBackImage && setBlankBackImage(null);
        setBase3DModelFile && setBase3DModelFile(null);
        handleBasicInfoChange({ target: { name: 'baseModelId', value: '' }});
      }
    }

    // Update the master state
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

    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke the URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };
  
  const handleFrontImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBlankFrontImage(file);
      setBlankFrontImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBackImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBlankBackImage(file);
      setBlankBackImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFrontMaskChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontMaskImage(file);
      setFrontMaskImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFrontOverlayChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontOverlayImage(file);
      setFrontOverlayImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBackMaskChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackMaskImage(file);
      setBackMaskImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBackOverlayChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackOverlayImage(file);
      setBackOverlayImagePreview(URL.createObjectURL(file));
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
          {imagePreviews.length > 0 && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden shadow-md border-2 border-gray-100 bg-white">
                  <img src={preview} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
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
                {['2D', '3D'].map((type) => (
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
            {formData.customizationType === '2D' && (
              <div key="custom-2d-block" className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <label className="block text-sm font-black text-blue-900 uppercase tracking-widest mb-1">
                    Blank Front Image
                  </label>
                  <p className="text-xs text-blue-600 mb-4 font-medium">For the front-facing 2D canvas.</p>
                  <div className="relative group">
                    <label htmlFor="frontImageInput" className="flex items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 bg-white rounded-xl hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer">
                      <div className="text-center">
                        <span className="block text-xs font-bold text-blue-500">Upload Front Image</span>
                      </div>
                    </label>
                    <input id="frontImageInput" type="file" onChange={handleFrontImageChange} className="hidden" accept="image/*" />
                  </div>
                  {blankFrontImagePreview && (
                    <div className="mt-4 flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-32 aspect-square rounded-xl border-4 border-white shadow-xl overflow-hidden bg-white shrink-0">
                          <img src={blankFrontImagePreview} alt="Front preview" className="w-full h-full object-contain" />
                        </div>
                        <button type="button" onClick={() => { setBlankFrontImage(null); setBlankFrontImagePreview(''); }} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors">Remove Front</button>
                      </div>
                      
                      {/* Front Mask & Overlay Slots */}
                      <div className="space-y-4 pt-4 border-t border-blue-100">
                        <div>
                          <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-2">Front_Mask (Clipping)</label>
                          <label htmlFor="frontMaskInput" className="block w-fit px-4 py-2 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-blue-200 transition-colors mb-2">Select Mask File</label>
                          <input id="frontMaskInput" type="file" onChange={handleFrontMaskChange} className="hidden" accept="image/*" />
                          {frontMaskImagePreview && <img src={frontMaskImagePreview} className="w-20 h-20 object-contain border border-blue-200 rounded-lg p-1 bg-white" />}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-2">Front_Overlay (Realism)</label>
                          <label htmlFor="frontOverlayInput" className="block w-fit px-4 py-2 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-blue-200 transition-colors mb-2">Select Overlay File</label>
                          <input id="frontOverlayInput" type="file" onChange={handleFrontOverlayChange} className="hidden" accept="image/*" />
                          {frontOverlayImagePreview && <img src={frontOverlayImagePreview} className="w-20 h-20 object-contain border border-blue-200 rounded-lg p-1 bg-white" />}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-black text-blue-900 uppercase tracking-widest mb-1">
                    Blank Back Image
                  </label>
                  <p className="text-xs text-blue-600 mb-4 font-medium">For the back-facing 2D canvas.</p>
                  <div className="relative group">
                    <label htmlFor="backImageInput" className="flex items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 bg-white rounded-xl hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer">
                      <div className="text-center">
                        <span className="block text-xs font-bold text-blue-500">Upload Back Image</span>
                      </div>
                    </label>
                    <input id="backImageInput" type="file" onChange={handleBackImageChange} className="hidden" accept="image/*" />
                  </div>
                  {blankBackImagePreview && (
                    <div className="mt-4 flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-32 aspect-square rounded-xl border-4 border-white shadow-xl overflow-hidden bg-white shrink-0">
                          <img src={blankBackImagePreview} alt="Back preview" className="w-full h-full object-contain" />
                        </div>
                        <button type="button" onClick={() => { setBlankBackImage(null); setBlankBackImagePreview(''); }} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors">Remove Back</button>
                      </div>

                      {/* Back Mask & Overlay Slots */}
                      <div className="space-y-4 pt-4 border-t border-blue-100">
                        <div>
                          <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-2">Back_Mask (Clipping)</label>
                          <label htmlFor="backMaskInput" className="block w-fit px-4 py-2 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-blue-200 transition-colors mb-2">Select Mask File</label>
                          <input id="backMaskInput" type="file" onChange={handleBackMaskChange} className="hidden" accept="image/*" />
                          {backMaskImagePreview && <img src={backMaskImagePreview} className="w-20 h-20 object-contain border border-blue-200 rounded-lg p-1 bg-white" />}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-2">Back_Overlay (Realism)</label>
                          <label htmlFor="backOverlayInput" className="block w-fit px-4 py-2 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-blue-200 transition-colors mb-2">Select Overlay File</label>
                          <input id="backOverlayInput" type="file" onChange={handleBackOverlayChange} className="hidden" accept="image/*" />
                          {backOverlayImagePreview && <img src={backOverlayImagePreview} className="w-20 h-20 object-contain border border-blue-200 rounded-lg p-1 bg-white" />}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3D SECTION: Remount on type change to ensure clean transition */}
            {formData.customizationType === '3D' && (
              <div key="custom-3d-block" className="space-y-8 animate-in fade-in zoom-in duration-500">
                
                {/* 1. SYSTEM PRESETS GRID */}
                <div>
                  <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FiGrid size={12} />
                    System Architecture Presets
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.values(MODELS).map((model) => (
                      <div 
                        key={model.id}
                        onClick={() => {
                          handleInputChange({ target: { name: 'baseModelId', value: model.id }});
                          setBase3DModelFile(null); // Clear manual upload
                        }}
                        className={`group relative aspect-square rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
                          formData.baseModelId === model.id ? 'border-blue-600 ring-4 ring-blue-50' : 'border-gray-100 hover:border-blue-200'
                        }`}
                      >
                        <img src={model.thumbnail} alt={model.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                          <p className="text-[9px] font-black text-white uppercase tracking-tight leading-tight">{model.name}</p>
                        </div>
                        {formData.baseModelId === model.id && (
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

