import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Layers, 
  Box, 
  Search, 
  Filter,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react';

const TwoDModelLibrary = () => {
  const sendDebugLog = (hypothesisId, location, message, data = {}, runId = 'initial') => {
    // #region agent log
    fetch('http://127.0.0.1:7742/ingest/f73f9efc-7d57-444d-946a-342d190e0162',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8362af'},body:JSON.stringify({sessionId:'8362af',runId,hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  };

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [newModel, setNewModel] = useState({
    name: '',
    category: 'Acrylics',
    canvasWidth: 500,
    canvasHeight: 600
  });
  const [files, setFiles] = useState({
    frontImage: null,
    frontMask: null,
    frontOverlay: null
  });
  const [previews, setPreviews] = useState({
    frontImage: '',
    frontMask: '',
    frontOverlay: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const getApiErrorMessage = (error, fallback) => {
    const status = error?.response?.status;
    const apiMessage = error?.response?.data?.message;

    if (status === 401) return 'Session expired. Please login again.';
    if (status === 403) return 'You do not have permission to manage 2D models.';
    if (apiMessage) return apiMessage;
    return fallback;
  };

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/models');
      const modelList = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setModels(modelList);
      sendDebugLog('H6', 'TwoDModelLibrary.jsx:fetchModels', 'Loaded admin 2D models', {
        modelCount: modelList.length,
        missingThumbnailCount: modelList.filter(m => !m?.thumbnail).length
      });
    } catch (err) {
      console.error('Failed to fetch models:', err);
      alert(getApiErrorMessage(err, 'Failed to load model library.'));
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
      setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('name', newModel.name);
      formData.append('category', newModel.category);
      formData.append('canvasConfig', JSON.stringify({
        width: newModel.canvasWidth,
        height: newModel.canvasHeight
      }));
      
      if (files.frontImage) formData.append('frontImage', files.frontImage);
      if (files.frontMask) formData.append('frontMask', files.frontMask);
      if (files.frontOverlay) formData.append('frontOverlay', files.frontOverlay);
      sendDebugLog('H7', 'TwoDModelLibrary.jsx:handleSubmit', 'Submitting 2D model creation', {
        hasFrontImage: !!files.frontImage,
        hasFrontMask: !!files.frontMask,
        hasFrontOverlay: !!files.frontOverlay,
        hasName: !!newModel.name
      });

      const response = await axios.post('/api/admin/models', formData);
      if (!response?.data?.success) {
        throw new Error(response?.data?.message || 'Create model request failed.');
      }
      setIsModalOpen(false);
      resetForm();
      fetchModels();
    } catch (err) {
      console.error('Failed to create model:', err);
      alert(getApiErrorMessage(err, 'Failed to create model.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteModel = async (id) => {
    if (window.confirm('Are you sure you want to remove this model preset?')) {
      try {
        const response = await axios.delete(`/api/admin/models/${id}`);
        if (!response?.data?.success) {
          throw new Error(response?.data?.message || 'Delete model request failed.');
        }
        fetchModels();
      } catch (err) {
        console.error('Failed to delete model:', err);
        alert(getApiErrorMessage(err, 'Failed to delete model.'));
      }
    }
  };

  const resetForm = () => {
    setNewModel({ name: '', category: 'Acrylics', canvasWidth: 500, canvasHeight: 600 });
    setFiles({ frontImage: null, frontMask: null, frontOverlay: null });
    setPreviews({ frontImage: '', frontMask: '', frontOverlay: '' });
  };

  const categories = ['All', 'Acrylics', 'Photo Frames', 'Cards', 'Stationery', 'Gifts'];
  
  const filteredModels = Array.isArray(models) ? models.filter(m => {
    if (!m) return false;
    const matchesFilter = filter === 'All' || m.category === filter;
    const modelName = m.name || 'Untitled Model';
    const matchesSearch = modelName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) : [];

  const createTextThumbnail = (name) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 34px Arial';

      const words = String(name || '2D Template').split(' ');
      const lines = [];
      let line = '';
      words.forEach((word) => {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width > 500) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      });
      if (line) lines.push(line);

      const clipped = lines.slice(0, 5);
      const lineHeight = 44;
      const startY = (canvas.height - (clipped.length - 1) * lineHeight) / 2;
      clipped.forEach((text, index) => {
        ctx.fillText(text, canvas.width / 2, startY + index * lineHeight);
      });

      return canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  };

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">2D Model Library</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Manage high-fidelity presets for product mockups</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
          >
            <Plus size={18} /> Add New Preset
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by model name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 transition-all font-bold text-slate-700 shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${filter === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-400 hover:text-slate-900 border-2 border-slate-100'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Models Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Presets...</p>
          </div>
        ) : filteredModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredModels.map(model => (
              <div key={model._id} className="group bg-white rounded-[32px] overflow-hidden border-2 border-slate-100 hover:border-indigo-600 transition-all hover:shadow-2xl hover:translate-y-[-8px]">
                <div className="relative aspect-square bg-[#f1f5f9] overflow-hidden">
                  <img
                    src={model.thumbnail || createTextThumbnail(model.name)}
                    alt={model.name}
                    className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => { e.currentTarget.src = createTextThumbnail(model.name); }}
                  />
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button 
                      onClick={() => deleteModel(model._id)}
                      className="w-10 h-10 bg-white text-red-500 rounded-xl flex items-center justify-center shadow-xl hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-900 shadow-sm">
                      {model.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-[13px] font-black uppercase tracking-tight text-slate-900 line-clamp-1">{model.name}</h3>
                  <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Box size={12} /> {model.canvasConfig.width}x{model.canvasConfig.height}</span>
                    <span className={`flex items-center gap-1.5 ${model.frontMask ? 'text-emerald-500' : 'text-slate-300'}`}><Layers size={12} /> Mask</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 py-32 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-6">
              <ImageIcon size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">No model presets found</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 max-w-xs">Start building your library by adding your first product model.</p>
          </div>
        )}

        {/* Create Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
            
            <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between p-8 border-b border-slate-100">
                <div className="space-y-1">
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">New Model Preset</h2>
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Configure geometry and clipping metrics</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors"
                >
                  <X className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Model Identity</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Acrylic Nameplate - Modern"
                      required
                      value={newModel.name}
                      onChange={(e) => setNewModel({...newModel, name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold transition-all text-slate-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Category</label>
                    <select 
                      value={newModel.category}
                      onChange={(e) => setNewModel({...newModel, category: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold transition-all text-slate-700"
                    >
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Canvas Resolution (W)</label>
                    <input 
                      type="number" 
                      required
                      value={newModel.canvasWidth}
                      onChange={(e) => setNewModel({...newModel, canvasWidth: parseInt(e.target.value)})}
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold transition-all text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Canvas Resolution (H)</label>
                    <input 
                      type="number" 
                      required
                      value={newModel.canvasHeight}
                      onChange={(e) => setNewModel({...newModel, canvasHeight: parseInt(e.target.value)})}
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold transition-all text-slate-700"
                    />
                  </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                      <ImageIcon size={14} /> Major Geometry Assets
                    </label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {['frontImage', 'frontMask', 'frontOverlay'].map((type) => (
                         <div key={type} className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-500 tracking-tighter truncate block">{type.replace('front', '')}</label>
                           <div className={`relative h-32 rounded-[24px] border-2 border-dashed transition-all overflow-hidden bg-[#fafafa] flex flex-col items-center justify-center cursor-pointer ${previews[type] ? 'border-emerald-200 shadow-lg' : 'border-slate-200 hover:border-indigo-400 hover:bg-white'}`}>
                              {previews[type] ? (
                                <img src={previews[type]} alt="Preview" className="w-full h-full object-contain p-2" />
                              ) : (
                                <div className="text-center p-3">
                                   <Plus className="mx-auto text-slate-300 group-hover:text-indigo-600 mb-1" size={20} />
                                   <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Upload</span>
                                </div>
                              )}
                              <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                accept="image/*"
                                required={type === 'frontImage'}
                                onChange={(e) => handleFileChange(e, type)}
                              />
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-4">
                   <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all border-2 border-transparent"
                    disabled={isSubmitting}
                   >
                     Discard Changes
                   </button>
                   <button 
                    type="submit"
                    className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-black transition-all active:scale-95 disabled:bg-slate-300 flex items-center justify-center gap-3"
                    disabled={isSubmitting}
                   >
                     {isSubmitting ? (
                       <>
                         <Loader2 className="animate-spin" size={18} />
                         Processing Geometry...
                       </>
                     ) : (
                       <>
                         <CheckCircle2 size={18} />
                         Finish & Register Model
                       </>
                     )}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TwoDModelLibrary;
