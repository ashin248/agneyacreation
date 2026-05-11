import React from 'react';
import { FiArrowDown, FiType, FiImage, FiSmile, FiEdit3, FiLayers, FiMove, FiTrash2, FiBox, FiCrop } from 'react-icons/fi';

export default function PropertyDock({ 
    fabricRef, brushColor, setBrushColor, updateTexture, fastSync, isDrawing, setIsDrawing,
    activeStudioTab, 
    activeTab, setActiveTab, 
    isMobileUiMinimized, setIsMobileUiMinimized, 
    activeObject, setActiveObject,
    premiumFonts,
    twoDModels
}) {
    return (
        <div className="xl:hidden fixed bottom-0 left-0 right-0 z-[600] pointer-events-none flex flex-col justify-end">
            
            {/* Slide-up Editor Drawer (pointer-events-auto) */}
            <div className={`bg-[var(--color-neu-bg)] rounded-t-[48px] shadow-2xl transition-transform duration-500 pointer-events-auto flex flex-col border-t border-[var(--color-neu-dark)] ${isMobileUiMinimized || !activeObject ? 'translate-y-full' : 'translate-y-0'}`} style={{ maxHeight: '60vh', paddingBottom: '90px' }}>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 neu-pressed rounded-full cursor-pointer" onClick={() => setIsMobileUiMinimized(true)} />
                
                {/* Header of Drawer */}
                <div className="flex justify-between items-center px-8 pt-10 pb-6 border-b border-[var(--color-neu-dark)] shrink-0" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    <div className="flex flex-col">
                        <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>
                            {activeStudioTab === '2D_STUDIO' ? '2D Editor' : '3D Editor'}
                        </h3>
                        <span className="text-[8px] font-bold opacity-30 uppercase" style={{ color: 'var(--color-neu-text)' }}>{activeObject ? activeObject.type : 'Designer Canvas'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {activeObject && (
                            <button onClick={() => { fabricRef.current.discardActiveObject(); fabricRef.current.renderAll(); setActiveObject(null); setIsMobileUiMinimized(true); }} className="px-4 py-2 neu-button text-rose-500 text-[9px] font-black uppercase tracking-tight active:scale-95 transition-all">Deselect</button>
                        )}
                        <button onClick={() => setIsMobileUiMinimized(true)} className="w-10 h-10 rounded-full neu-button flex items-center justify-center transition-all active:scale-90" style={{ color: 'var(--color-neu-text)' }}>
                            <FiArrowDown size={16} />
                        </button>
                    </div>
                </div>

                {/* Body of Drawer */}
                <div className="overflow-y-auto px-6 py-6 space-y-8 no-scrollbar flex-1">
                    {activeObject && (
                        <div className="space-y-8">
                            {/* SLIDERS */}
                            <div className="grid grid-cols-2 gap-x-10 gap-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}><span>Size</span><span>{Math.round(activeObject.scaleX * 100)}%</span></div>
                                    <input type="range" min="0.1" max="5" step="0.1" value={activeObject.scaleX} onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        if(active) { active.set({ scaleX: val, scaleY: val }).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, scaleX: val })); }
                                    }} onMouseUp={() => updateTexture(true)} className="w-full neu-range" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}><span>Rotate</span><span>{Math.round(activeObject.angle)}°</span></div>
                                    <input type="range" min="0" max="360" value={activeObject.angle} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        if(active) { active.set('angle', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, angle: val })); }
                                    }} onMouseUp={() => updateTexture(true)} className="w-full neu-range" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}><span>Pos X</span><span>{Math.round(activeObject.left)}</span></div>
                                    <input type="range" min="0" max="500" value={activeObject.left} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        if(active) { active.set('left', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, left: val })); }
                                    }} onMouseUp={() => updateTexture(true)} className="w-full neu-range" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}><span>Pos Y</span><span>{Math.round(activeObject.top)}</span></div>
                                    <input type="range" min="0" max="600" value={activeObject.top} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        if(active) { active.set('top', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, top: val })); }
                                    }} onMouseUp={() => updateTexture(true)} className="w-full neu-range" />
                                </div>
                                <div className="space-y-4 col-span-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}><span>Transparency</span><span>{Math.round(activeObject.opacity * 100)}%</span></div>
                                    <input type="range" min="0" max="1" step="0.01" value={activeObject.opacity} onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        if(active) { active.set('opacity', val); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, opacity: val })); }
                                    }} onMouseUp={() => updateTexture(true)} className="w-full neu-range" />
                                </div>
                            </div>

                            {/* TEXT INPUT */}
                            {(activeObject.type === 'i-text' || activeObject.type === 'text') && (
                                <div className="space-y-4">
                                    <div className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>Edit Text Content</div>
                                    <textarea rows="2" value={activeObject.text} onChange={(e) => {
                                        const val = e.target.value;
                                        const active = fabricRef.current.getActiveObject();
                                        if(active) {
                                            active.set('text', val); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, text: val }));
                                            if (window.textSyncTimer) clearTimeout(window.textSyncTimer);
                                            window.textSyncTimer = setTimeout(() => updateTexture(true), 300);
                                        }
                                    }} className="w-full p-5 neu-input rounded-2xl text-[14px] font-bold outline-none transition-all resize-none" style={{ color: 'var(--color-neu-text)' }} placeholder="Enter text..."></textarea>
                                </div>
                            )}

                            {/* COLORS */}
                            <div className="space-y-4">
                                <div className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>Theme Palette</div>
                                <div className="grid grid-cols-5 gap-4">
                                    {['#F7941D', '#3b82f6', '#ec4899', '#fbbf24', '#ffffff', '#ef4444', '#10b981', '#6366f1', '#f97316', '#000000'].map((color, i) => (
                                        <button key={i} onClick={() => {
                                            const active = fabricRef.current?.getActiveObject();
                                            if (active) { active.set('fill', color); active.set('stroke', color); fabricRef.current.renderAll(); updateTexture(); setActiveObject({ ...active, fill: color }); }
                                            setBrushColor(color);
                                        }} className={`aspect-square rounded-full border-2 transition-all ${brushColor === color ? 'border-[var(--color-neu-accent)] scale-110 shadow-lg' : 'border-transparent shadow-inner'}`} style={{ backgroundColor: color }}></button>
                                    ))}
                                </div>
                            </div>

                            {/* QUICK ACTIONS */}
                            <div className="space-y-4">
                                <div className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>Selection Tools</div>
                                <div className="grid grid-cols-2 gap-4">
                                    {(activeObject.type === 'image' || activeObject.type === 'FabricImage' || activeObject.uid?.startsWith('upload_') || activeObject.uid?.startsWith('up_')) && (
                                        <button onClick={() => {
                                            const active = fabricRef.current.getActiveObject();
                                            if (active) { const imgData = active.toDataURL(); window.dispatchEvent(new CustomEvent('OPEN_CROPPER', { detail: { image: imgData, uid: active.uid } })); }
                                        }} className="h-14 neu-button flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest transition-all active:scale-95" style={{ color: 'var(--color-neu-accent)' }}>
                                            <FiCrop size={16} /> Crop
                                        </button>
                                    )}
                                    {activeStudioTab === '2D_STUDIO' && (activeObject.type === 'image' || activeObject.type === 'FabricImage' || activeObject.uid?.startsWith('upload_')) && (
                                        <button onClick={() => {
                                            const active = fabricRef.current.getActiveObject();
                                            if (active) { active.bringToFront = !active.bringToFront; updateTexture(true); setActiveObject(prev => ({ ...prev, bringToFront: active.bringToFront })); }
                                        }} className={`h-14 neu-button flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${activeObject.bringToFront ? 'neu-pressed text-[var(--color-neu-accent)]' : ''}`} style={!activeObject.bringToFront ? { color: 'var(--color-neu-text)' } : {}}>
                                            <FiLayers size={16} /> Layer
                                        </button>
                                    )}
                                    <button onClick={() => { fabricRef.current.centerObject(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); }} className="h-14 neu-button flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest transition-all active:scale-95" style={{ color: 'var(--color-neu-text)' }}><FiMove size={16} /> Center</button>
                                    <button onClick={() => { fabricRef.current.remove(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); setActiveObject(null); }} className="h-14 neu-pressed text-rose-500 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"><FiTrash2 size={16} /> Remove</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating 'Edit' button if object selected and drawer minimized */}
            {activeObject && isMobileUiMinimized && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto z-50">
                    <button 
                        onClick={() => setIsMobileUiMinimized(false)} 
                        className="px-8 py-4 neu-button-accent text-white shadow-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] animate-bounce transition-all active:scale-95"
                    >
                        <FiEdit3 size={16} /> Edit Layer
                    </button>
                </div>
            )}

            {/* Horizontal Bottom Navigation Bar (pointer-events-auto) */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-[var(--color-neu-bg)] border-t border-[var(--color-neu-dark)] flex items-center justify-around px-4 pb-safe pointer-events-auto shadow-2xl z-40" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                {[
                    { id: 'uploads', icon: <FiImage size={22} />, label: 'Upload' },
                    { id: 'text', icon: <FiType size={22} />, label: 'Text' },
                    { id: 'stickers', icon: <FiSmile size={22} />, label: 'Sticker' },
                    { id: 'draw', icon: <FiEdit3 size={22} />, label: 'Draw' },
                    ...(twoDModels?.length > 0 ? [{ id: 'views', icon: <FiBox size={22} />, label: 'Views' }] : []),
                    { id: 'layers', icon: <FiLayers size={22} />, label: 'Layers' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id !== 'draw') setIsDrawing(false); }} className={`flex-1 h-full flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === tab.id ? 'text-[var(--color-neu-accent)]' : 'opacity-40 hover:opacity-100'}`} style={{ color: activeTab === tab.id ? 'var(--color-neu-accent)' : 'var(--color-neu-text)' }}>
                        <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${activeTab === tab.id ? 'neu-pressed scale-110' : ''}`}>
                            {tab.icon}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

