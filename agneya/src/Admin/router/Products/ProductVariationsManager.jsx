import React, { useState, useMemo } from 'react';
import { FiPlus, FiTrash2, FiImage, FiGrid, FiLayers, FiType, FiCheckSquare } from 'react-icons/fi';

const ProductVariationsManager = ({ variations, setVariations, baseProductName }) => {
  const [batchColor, setBatchColor] = useState('');
  const [batchSizes, setBatchSizes] = useState([]);
  const presetSizes = ['S', 'M', 'L', 'XL', 'XXL', '8x12', '12x18', 'A4', 'A3'];

  // ── GROUPING LOGIC ──
  const groupedVariations = useMemo(() => {
    const groups = {};
    variations.forEach(v => {
      const colorKey = v.color?.trim() || 'Neutral / Default';
      if (!groups[colorKey]) groups[colorKey] = [];
      groups[colorKey].push(v);
    });
    return groups;
  }, [variations]);

  // ── ACTIONS ──

  // Add new empty variation
  const handleAddVariation = () => {
    const base = baseProductName ? baseProductName.replace(/\s+/g, '-').toUpperCase() : "PROD";
    const newSku = `${base}-VAR-${variations.length + 1}-${Math.floor(Math.random() * 100)}`;
    
    setVariations([
      ...variations,
      {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        sku: newSku,
        size: '',
        color: '',
        stock: 10,
        priceModifier: 0,
        imageFile: null,
        previewUrl: '',
      }
    ]);
  };

  // Generate a Batch of variations by Color
  const handleGenerateBatch = () => {
    if (!batchColor.trim() || batchSizes.length === 0) {
      alert("Please enter a color and select at least one size.");
      return;
    }

    const newVars = batchSizes.map(size => {
      let generatedSku = baseProductName ? baseProductName.replace(/\s+/g, '-').toUpperCase() : "PROD";
      generatedSku += `-${batchColor.toUpperCase().replace(/\s+/g, '')}-${size.toUpperCase().replace(/\s+/g, '')}`;

      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        sku: generatedSku,
        size: size,
        color: batchColor,
        stock: 10,
        priceModifier: 0,
        imageFile: null,
        previewUrl: '',
      };
    });

    setVariations([...variations, ...newVars]);
    // Reset batch state but keep color for convenience? No, clear it.
    setBatchSizes([]);
    setBatchColor('');
  };

  // Set image for entire color group
  const handleBatchImageUpload = (colorKey, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    
    setVariations(prev => prev.map(v => {
      const vColor = v.color?.trim() || 'Neutral / Default';
      if (vColor === colorKey) {
        // Revoke old URL if exists
        if (v.previewUrl) URL.revokeObjectURL(v.previewUrl);
        return { ...v, imageFile: file, previewUrl };
      }
      return v;
    }));
  };

  const handleRemoveVariation = (idToRemove) => {
    const variation = variations.find(v => v.id === idToRemove);
    if (variation?.previewUrl) URL.revokeObjectURL(variation.previewUrl);
    setVariations(variations.filter(v => v.id !== idToRemove));
  };

  const handleChange = (id, field, value) => {
    setVariations(variations.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleImageChange = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setVariations(variations.map(v => {
        if (v.id === id) {
          if (v.previewUrl) URL.revokeObjectURL(v.previewUrl);
          return { ...v, imageFile: file, previewUrl };
        }
        return v;
      }));
    }
  };

  // ── RENDER HELPERS ──
  const renderTable = (colorKey, items) => (
    <div key={colorKey} className="mb-12 last:mb-0">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full shadow-inner border border-gray-100" style={{ backgroundColor: colorKey.toLowerCase() === 'neutral / default' ? '#f3f4f6' : colorKey }}></div>
          <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">{colorKey} Group</h3>
          <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{items.length} Variants</span>
        </div>
        
        <div className="flex items-center gap-3">
           <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase cursor-pointer hover:bg-slate-100 transition-all">
             <FiImage size={14} /> Set Image for All
             <input type="file" accept="image/*" className="hidden" onChange={(e) => handleBatchImageUpload(colorKey, e)} />
           </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm bg-white">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Image</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">SKU Details</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Size</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stock</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Price +/-</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((v) => (
              <tr key={v.id} className="hover:bg-indigo-50/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="relative w-14 h-14 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50 overflow-hidden flex items-center justify-center hover:border-indigo-400 transition-all cursor-pointer group">
                    {v.previewUrl ? (
                      <img src={v.previewUrl} alt="V" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    ) : (
                      <FiImage className="w-5 h-5 text-gray-300" />
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(v.id, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => handleChange(v.id, 'sku', e.target.value)}
                    className="w-full max-w-[140px] px-3 py-2 text-xs font-bold border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 uppercase bg-gray-50"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={v.size}
                    onChange={(e) => handleChange(v.id, 'size', e.target.value)}
                    className="w-20 px-3 py-2 text-xs font-bold border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) => handleChange(v.id, 'stock', Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-3 py-2 text-xs font-black border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 text-center bg-gray-50"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-[10px] font-bold">₹ +</span>
                    <input
                      type="number"
                      value={v.priceModifier}
                      onChange={(e) => handleChange(v.id, 'priceModifier', e.target.value)}
                      className="w-24 px-3 py-2 text-xs font-bold border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 text-center bg-gray-50"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button type="button" onClick={() => handleRemoveVariation(v.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                    <FiTrash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Inventory Matrix</h2>
          <p className="text-sm text-gray-400 font-bold mt-2">Engineered variation management grouped by aesthetic attributes.</p>
        </div>
        <button
          type="button"
          onClick={handleAddVariation}
          className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[20px] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95"
        >
          <FiPlus size={18} /> Add Custom Unit
        </button>
      </div>

      {/* ── COLOR BATCH CREATOR ── */}
      <div className="bg-white/50 backdrop-blur-md border border-gray-100 p-8 rounded-[40px] shadow-xl">
        <div className="flex items-center gap-4 mb-6">
           <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20">
             <FiLayers size={20} />
           </div>
           <div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Fast-Track Engine</h3>
             <p className="text-lg font-black text-gray-900 tracking-tighter uppercase">Color Group Batch Creator</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 px-1 flex items-center gap-2">
               <FiType size={14} /> 1. Input Primary Color
             </label>
             <input 
               type="text" 
               placeholder="e.g. Royal Blue, Crimson Red..."
               value={batchColor}
               onChange={e => setBatchColor(e.target.value)}
               className="w-full px-6 py-4 bg-gray-50 border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all"
             />
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 px-1 flex items-center gap-2">
                <FiCheckSquare size={14} /> 2. Select Component Sizes
             </label>
             <div className="flex flex-wrap gap-2">
               {presetSizes.map(size => (
                 <button
                   key={size}
                   type="button"
                   onClick={() => setBatchSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                   className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${batchSizes.includes(size) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-50 text-gray-400 hover:border-indigo-400 hover:text-indigo-600'}`}
                 >
                   {size}
                 </button>
               ))}
             </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateBatch}
          className="w-full mt-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-slate-900 transition-all transform active:scale-95 flex items-center justify-center gap-4"
        >
          <FiGrid size={20} /> Deploy {batchSizes.length > 0 ? `${batchSizes.length} Variants` : 'Batch'} for {batchColor || 'New Color'}
        </button>
      </div>

      {/* ── VARIATION TABLES ── */}
      <div className="space-y-16 animate-in fade-in duration-1000">
        {Object.entries(groupedVariations).sort((a, b) => {
          if (a[0] === 'Neutral / Default') return -1;
          if (b[0] === 'Neutral / Default') return 1;
          return a[0].localeCompare(b[0]);
        }).map(([colorKey, items]) => renderTable(colorKey, items))}
      </div>
    </div>
  );
};

export default ProductVariationsManager;

