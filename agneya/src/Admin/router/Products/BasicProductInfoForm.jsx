import React from 'react';
import { MODELS } from '../../../Client/components/Three/ProductLibrary';
import { TWOD_TEMPLATES } from '../../../Client/components/TwoD/TwoDTemplateLibrary';
// import TemplateThumbnail from '../../../Client/components/TwoD/TemplateThumbnail';
import { FiCheckCircle, FiGrid, FiImage, FiPlus, FiTrash2, FiBox, FiPackage, FiAlertCircle, FiCheck } from 'react-icons/fi';

const BasicProductInfoForm = ({ 
  formData, setFormData, 
  images, setImages, 
  imagePreviews, setImagePreviews, 
  base3DModelFile, setBase3DModelFile,
  twoDModels, setTwoDModels,
  collections = [], setCollections
}) => {
  const [availableCollections, setAvailableCollections] = React.useState([]);
  const [newCollectionName, setNewCollectionName] = React.useState('');
  const [newCollectionFile, setNewCollectionFile] = React.useState(null);
  const [isAddingCollection, setIsAddingCollection] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

    const fetchCollections = async () => {
      try {
        const res = await fetch('/api/public/collections');
        const data = await res.json();
        if (data.success) {
          setAvailableCollections(data.data);
        }
      } catch (err) {
        console.error('Error fetching collections:', err);
      }
    };
    fetchCollections();
  }, []);
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

  const toggleCollection = (collectionId) => {
    const current = collections || [];
    const next = current.includes(collectionId)
      ? current.filter(id => id !== collectionId)
      : [...current, collectionId];
    setCollections(next);
  };

  const handleQuickAddCollection = async () => {
    if (!newCollectionName || !newCollectionFile) {
       alert("Provide both name and icon for the new collection.");
       return;
    }

    try {
      setIsUploading(true);
      const data = new FormData();
      data.append('name', newCollectionName);
      data.append('logo', newCollectionFile);
      data.append('description', 'Auto-created via product form');

      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        body: data
      });
      const result = await res.json();
      
      if (result.success) {
        const created = result.data;
        setAvailableCollections(prev => [...prev, created]);
        setCollections(prev => [...(prev || []), created._id]);
        setNewCollectionName('');
        setNewCollectionFile(null);
        setIsAddingCollection(false);
      } else {
        alert(result.message || "Failed to create collection");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
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
          {/* Category selection (Restored to simple text) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
              placeholder="e.g., Electronics, Clothing"
              required
            />
            <p className="mt-1 text-[10px] text-gray-400 font-medium italic">AI will generate a visual representing this category on the shop page.</p>
          </div>

          {/* Collections (Multi-select) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collections (Multi-select)
            </label>
            <div className="flex flex-wrap gap-3">
              {availableCollections.map((col) => (
                <button
                  key={col._id}
                  type="button"
                  onClick={() => toggleCollection(col._id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                    collections.includes(col._id)
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100'
                      : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <img src={col.logoUrl} alt={col.name} className="w-5 h-5 object-contain" />
                  <span className="text-xs font-bold">{col.name}</span>
                  {collections.includes(col._id) && <FiCheck className="ml-1" size={14} />}
                </button>
              ))}
              
              {!isAddingCollection ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCollection(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                >
                  <FiPlus size={14} />
                  <span className="text-xs font-bold uppercase tracking-widest">Add New</span>
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 w-full animate-in slide-in-from-top-2 duration-300">
                  <input 
                    type="text"
                    placeholder="Collection Name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                  />
                  <div className="relative">
                    <label className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all">
                      {newCollectionFile ? <FiCheckCircle className="text-emerald-500" /> : <FiImage className="text-gray-400" />}
                      <span className="text-[10px] font-black uppercase tracking-widest">Icon</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => setNewCollectionFile(e.target.files[0])} 
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleQuickAddCollection}
                      disabled={isUploading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isUploading ? '...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingCollection(false)}
                      className="px-4 py-2 bg-white text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {availableCollections.length === 0 && !isAddingCollection && (
                <p className="text-xs text-gray-400 italic">No collections available. Create one using the button above.</p>
              )}
            </div>
            <p className="mt-2 text-[10px] text-gray-400 font-medium">Selected products will appear in these collections on the shop page.</p>
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
                  {preview && <img loading="lazy" src={preview} alt={`Gallery ${index}`} className="w-full h-full object-cover" />}
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

            {/* 2D TEMPLATE MANAGEMENT */}
            {(formData.customizationType === '2D' || formData.customizationType === 'Both') && (
              <div className="space-y-8 animate-in fade-in zoom-in duration-500 mt-8 p-6 bg-white rounded-[24px] border border-blue-100">
                <div className="flex items-center justify-between">
                  <label className="block text-[12px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                    <FiImage size={16} />
                    2D Models Configuration
                  </label>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (setTwoDModels) {
                        setTwoDModels(prev => [...prev, {
                          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                          mainModelFile: null,
                          mainModelPreview: '',
                          activeTab: 'main', // 'main' or 'support'
                          supportModels: []
                        }]);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                  >
                    <FiPlus size={14} /> Add 2D Model
                  </button>
                </div>

                <div className="space-y-6">
                  {twoDModels?.map((model, idx) => (
                    <div key={model.id} className="p-6 border-2 border-dashed border-blue-200 rounded-[24px] bg-blue-50/20 relative">
                      <button 
                        type="button"
                        onClick={() => {
                           setTwoDModels(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-full transition-colors"
                      >
                        <FiTrash2 size={16} />
                      </button>

                      <div className="flex gap-4 mb-6">
                        <label className={`cursor-pointer px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${model.activeTab === 'main' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                          <input 
                            type="radio" 
                            name={`tab-${model.id}`} 
                            className="hidden" 
                            checked={model.activeTab === 'main'}
                            onChange={() => setTwoDModels(prev => {
                               const next = [...prev];
                               next[idx].activeTab = 'main';
                               return next;
                            })}
                          />
                          Main Model
                        </label>
                        <label className={`cursor-pointer px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${model.activeTab === 'support' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                          <input 
                            type="radio" 
                            name={`tab-${model.id}`} 
                            className="hidden" 
                            checked={model.activeTab === 'support'}
                            onChange={() => setTwoDModels(prev => {
                               const next = [...prev];
                               next[idx].activeTab = 'support';
                               return next;
                            })}
                          />
                          Support Model
                        </label>
                      </div>

                      {model.activeTab === 'main' && (
                        <div className="space-y-4">
                          <p className="text-[11px] font-bold text-gray-500">Upload a transparent PNG for the main product model.</p>
                          <div className="flex items-center gap-6">
                             <div className={`w-32 h-32 rounded-2xl border-2 flex items-center justify-center overflow-hidden bg-white ${model.mainModelPreview ? 'border-blue-500' : 'border-dashed border-gray-300'}`}>
                               {model.mainModelPreview ? (
                                 <img loading="lazy" src={model.mainModelPreview} className="w-full h-full object-contain" alt="Main Model" />
                               ) : (
                                 <FiImage className="text-gray-300" size={32} />
                               )}
                             </div>
                             <div>
                               <label className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-blue-200 text-blue-600 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors text-[10px] font-black uppercase tracking-widest shadow-sm">
                                 {model.mainModelPreview ? 'Change Image' : 'Upload Image'}
                                 <input type="file" className="hidden" accept="image/png" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                       setTwoDModels(prev => {
                                          const next = [...prev];
                                          next[idx].mainModelFile = file;
                                          next[idx].mainModelPreview = URL.createObjectURL(file);
                                          return next;
                                       });
                                    }
                                 }} />
                               </label>
                             </div>
                          </div>
                        </div>
                      )}

                      {model.activeTab === 'support' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                             <p className="text-[11px] font-bold text-gray-500">Upload transparent PNGs for other sides of the product (e.g., Right, Left, Top, Bottom).</p>
                             <button 
                               type="button"
                               onClick={() => {
                                  setTwoDModels(prev => {
                                     const next = [...prev];
                                     next[idx].supportModels.push({
                                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                                        side: '',
                                        file: null,
                                        preview: ''
                                     });
                                     return next;
                                  });
                               }}
                               className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                             >
                               + Add Support Model
                             </button>
                          </div>

                          <div className="space-y-4">
                             {model.supportModels.map((sm, sIdx) => (
                                <div key={sm.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                   <div className={`w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0 ${sm.preview ? 'border-blue-400' : 'border-dashed border-gray-300'}`}>
                                      {sm.preview ? (
                                        <img loading="lazy" src={sm.preview} className="w-full h-full object-contain" alt="Support Model" />
                                      ) : (
                                        <FiImage className="text-gray-300" size={20} />
                                      )}
                                   </div>
                                   
                                   <div className="flex-1 space-y-2">
                                      <input 
                                        type="text" 
                                        placeholder="Side Name (e.g. Left, Right, Top)" 
                                        value={sm.side}
                                        onChange={(e) => {
                                           setTwoDModels(prev => {
                                              const next = [...prev];
                                              next[idx].supportModels[sIdx].side = e.target.value;
                                              return next;
                                           });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                      />
                                      <label className="inline-block px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-[10px] font-black uppercase tracking-widest">
                                        {sm.preview ? 'Change File' : 'Upload PNG'}
                                        <input type="file" className="hidden" accept="image/png" onChange={(e) => {
                                           const file = e.target.files[0];
                                           if (file) {
                                              setTwoDModels(prev => {
                                                 const next = [...prev];
                                                 next[idx].supportModels[sIdx].file = file;
                                                 next[idx].supportModels[sIdx].preview = URL.createObjectURL(file);
                                                 return next;
                                              });
                                           }
                                        }} />
                                      </label>
                                   </div>

                                   <button 
                                     type="button"
                                     onClick={() => {
                                        setTwoDModels(prev => {
                                           const next = [...prev];
                                           next[idx].supportModels = next[idx].supportModels.filter((_, i) => i !== sIdx);
                                           return next;
                                        });
                                     }}
                                     className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors"
                                   >
                                     <FiTrash2 size={14} />
                                   </button>
                                </div>
                             ))}
                             {model.supportModels.length === 0 && (
                                <div className="text-center py-6 text-gray-400 text-sm font-bold border-2 border-dashed border-gray-100 rounded-2xl">
                                   No support models added yet.
                                </div>
                             )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {(!twoDModels || twoDModels.length === 0) && (
                     <div className="text-center py-10 text-gray-400 text-sm font-bold border-2 border-dashed border-blue-200 rounded-[24px]">
                        Click "Add 2D Model" to begin uploading transparent PNGs.
                     </div>
                  )}
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
                        {model?.thumbnail && <img loading="lazy" src={model.thumbnail} alt={model.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />}
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

