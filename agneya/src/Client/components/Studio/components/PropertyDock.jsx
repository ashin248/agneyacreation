import React from 'react';
import { FiMaximize2, FiMinimize2, FiArrowUp, FiArrowDown, FiType, FiImage, FiSmile, FiEdit3, FiLayers, FiMove, FiTrash2, FiBox, FiCrop, FiRepeat } from 'react-icons/fi';

export default function PropertyDock({ 
    fabricRef, brushColor, setBrushColor, updateTexture, fastSync, isDrawing, setIsDrawing,
    activeStudioTab, 
    activeTab, setActiveTab, 
    isMobileUiMinimized, setIsMobileUiMinimized, 
    activeObject, setActiveObject,
    premiumFonts
}) {
    return (
        <div className="xl:hidden fixed bottom-0 left-0 right-0 z-[600] pointer-events-none flex flex-col justify-end">
            
            {/* Slide-up Editor Drawer (pointer-events-auto) */}
            <div className={`bg-white/95 backdrop-blur-xl rounded-t-[32px] shadow-[0_-20px_60px_rgba(0,0,0,0.1)] transition-transform duration-500 pointer-events-auto flex flex-col border-t border-slate-100 ${isMobileUiMinimized || !activeObject ? 'translate-y-full' : 'translate-y-0'}`} style={{ maxHeight: '60vh', paddingBottom: '90px' }}>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full cursor-pointer" onClick={() => setIsMobileUiMinimized(true)} />
                
                {/* Header of Drawer */}
                <div className="flex justify-between items-center px-6 pt-8 pb-4 border-b border-slate-100 shrink-0">
                    <div className="flex flex-col">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-[#0c0c2a] flex items-center gap-2">
                            {activeStudioTab === '2D_STUDIO' ? '2D STUDIO' : '3D STUDIO'}
                        </h3>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{activeObject ? activeObject.type : 'Designer Canvas'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {activeObject && (
                            <button onClick={() => { fabricRef.current.discardActiveObject(); fabricRef.current.renderAll(); setActiveObject(null); setIsMobileUiMinimized(true); }} className="px-4 py-2 bg-slate-100 text-[#0c0c2a] rounded-full text-[9px] font-black uppercase tracking-tight active:scale-95 transition-all">Deselect</button>
                        )}
                        <button onClick={() => setIsMobileUiMinimized(true)} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#0c0c2a] shadow-sm">
                            <FiArrowDown size={14} />
                        </button>
                    </div>
                </div>

                {/* Body of Drawer */}
                <div className="overflow-y-auto px-6 py-6 space-y-8 no-scrollbar flex-1">
                    {activeObject && (
                        <div className="space-y-8">
                            {/* SLIDERS */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Size</span><span>{Math.round(activeObject.scaleX * 100)}%</span></div>
                                    <input type="range" min="0.1" max="5" step="0.1" value={activeObject.scaleX} onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        if(active) { active.set({ scaleX: val, scaleY: val }).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, scaleX: val })); }
                                    }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Rotate</span><span>{Math.round(activeObject.angle)}°</span></div>
                                    <input type="range" min="0" max="360" value={activeObject.angle} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        if(active) { active.set('angle', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, angle: val })); }
                                    }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Pos X</span><span>{Math.round(activeObject.left)}</span></div>
                                    <input type="range" min="0" max="500" value={activeObject.left} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        if(active) { active.set('left', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, left: val })); }
                                    }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Pos Y</span><span>{Math.round(activeObject.top)}</span></div>
                                    <input type="range" min="0" max="600" value={activeObject.top} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        if(active) { active.set('top', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, top: val })); }
                                    }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                </div>
                                <div className="space-y-3 col-span-2">
                                    <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Transparency</span><span>{Math.round(activeObject.opacity * 100)}%</span></div>
                                    <input type="range" min="0" max="1" step="0.01" value={activeObject.opacity} onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        if(active) { active.set('opacity', val); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, opacity: val })); }
                                    }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                </div>
                            </div>

                            {/* TEXT INPUT */}
                            {(activeObject.type === 'i-text' || activeObject.type === 'text') && (
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black text-[#0c0c2a] uppercase tracking-widest">Edit Text Content</div>
                                    <textarea rows="2" value={activeObject.text} onChange={(e) => {
                                        const val = e.target.value;
                                        const active = fabricRef.current.getActiveObject();
                                        if(active) {
                                            active.set('text', val); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, text: val }));
                                            if (window.textSyncTimer) clearTimeout(window.textSyncTimer);
                                            window.textSyncTimer = setTimeout(() => updateTexture(true), 300);
                                        }
                                    }} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-bold text-[#0c0c2a] outline-none" placeholder="Enter text..."></textarea>
                                </div>
                            )}

                            {/* COLORS */}
                            <div className="space-y-4">
                                <div className="text-[10px] font-black text-[#0c0c2a] uppercase tracking-widest">Theme Palette</div>
                                <div className="grid grid-cols-5 gap-3">
                                    {['#0c0c2a', '#3b82f6', '#ec4899', '#fbbf24', '#ffffff', '#ef4444', '#10b981', '#6366f1', '#f97316', '#000000'].map((color, i) => (
                                        <button key={i} onClick={() => {
                                            const active = fabricRef.current?.getActiveObject();
                                            if (active) { active.set('fill', color); active.set('stroke', color); fabricRef.current.renderAll(); updateTexture(); setActiveObject({ ...active, fill: color }); }
                                            setBrushColor(color);
                                        }} className={`aspect-square rounded-full border-2 transition-all ${brushColor === color ? 'border-[#0c0c2a] scale-110 shadow-md' : 'border-slate-100'}`} style={{ backgroundColor: color }}></button>
                                    ))}
                                </div>
                            </div>

                            {/* QUICK ACTIONS */}
                            <div className="space-y-4">
                                <div className="text-[10px] font-black text-[#0c0c2a] uppercase tracking-widest">Selection Tools</div>
                                <div className="grid grid-cols-2 gap-3">
                                    {(activeObject.type === 'image' || activeObject.type === 'FabricImage' || activeObject.uid?.startsWith('upload_') || activeObject.uid?.startsWith('up_')) && (
                                        <button onClick={() => {
                                            const active = fabricRef.current.getActiveObject();
                                            if (active) { const imgData = active.toDataURL(); window.dispatchEvent(new CustomEvent('OPEN_CROPPER', { detail: { image: imgData, uid: active.uid } })); }
                                        }} className="h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-black uppercase rounded-xl flex items-center justify-center gap-2">
                                            <FiCrop size={14} /> Crop Photo
                                        </button>
                                    )}
                                    {activeStudioTab === '2D_STUDIO' && (activeObject.type === 'image' || activeObject.type === 'FabricImage' || activeObject.uid?.startsWith('upload_')) && (
                                        <button onClick={() => {
                                            const active = fabricRef.current.getActiveObject();
                                            if (active) { active.bringToFront = !active.bringToFront; updateTexture(true); setActiveObject(prev => ({ ...prev, bringToFront: active.bringToFront })); }
                                        }} className={`h-12 border text-[9px] font-black uppercase rounded-xl flex items-center justify-center gap-2 ${activeObject.bringToFront ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-[#0c0c2a]'}`}>
                                            <FiLayers size={14} /> Layer
                                        </button>
                                    )}
                                    <button onClick={() => { fabricRef.current.centerObject(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); }} className="h-12 bg-slate-50 border border-slate-100 text-[#0c0c2a] text-[9px] font-black uppercase rounded-xl flex items-center justify-center gap-2"><FiMove size={14} /> Center</button>
                                    <button onClick={() => { fabricRef.current.remove(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); setActiveObject(null); }} className="h-12 bg-rose-50 text-rose-500 text-[9px] font-black uppercase rounded-xl flex items-center justify-center gap-2 border border-rose-100"><FiTrash2 size={14} /> Remove</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating 'Edit' button if object selected and drawer minimized */}
            {activeObject && isMobileUiMinimized && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto z-50">
                    <button onClick={() => setIsMobileUiMinimized(false)} className="px-6 py-3 bg-[#0c0c2a] text-white rounded-full shadow-[0_10px_20px_rgba(12,12,42,0.3)] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-bounce">
                        <FiEdit3 size={14} /> Edit Selected
                    </button>
                </div>
            )}

            {/* Horizontal Bottom Navigation Bar (pointer-events-auto) */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 flex items-center justify-around px-2 pb-safe pointer-events-auto shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40">
                {[
                    { id: 'uploads', icon: <FiImage size={22} />, label: 'Upload' },
                    { id: 'text', icon: <FiType size={22} />, label: 'Text' },
                    { id: 'stickers', icon: <FiSmile size={22} />, label: 'Sticker' },
                    { id: 'draw', icon: <FiEdit3 size={22} />, label: 'Draw' },
                    { id: 'layers', icon: <FiLayers size={22} />, label: 'Layers' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id !== 'draw') setIsDrawing(false); }} className={`flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all ${activeTab === tab.id ? 'text-[#0c0c2a]' : 'text-slate-400 hover:text-[#0c0c2a]'}`}>
                        <div className={`p-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-[#0c0c2a]/10 scale-110' : ''}`}>
                            {tab.icon}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-wider">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

