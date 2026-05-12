import React from 'react';
import { FiType, FiImage, FiSmile, FiZap, FiLayers, FiMove, FiRepeat, FiTrash2, FiBox } from 'react-icons/fi';

function ToolSidebar({ 
    addText, handleFileUpload, isDrawing, setIsDrawing, 
    fabricRef, brushColor, setBrushColor, updateTexture, fastSync, premiumFonts,
    activeTab, setActiveTab, 
    activeObject, setActiveObject, 
    canvasObjects,
    twoDModels, active2DModelIdx, activeSupportSide, handleSwitchSide
}) {
    return (
        <div className="hidden lg:flex w-[240px] xl:w-[260px] flex-col gap-3 xl:gap-4 shrink-0">
            <div className="neu-flat flex-1 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                <div className="space-y-3 mb-2">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.30em] opacity-40" style={{ color: 'var(--color-neu-text)' }}>Creation Suite</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setActiveTab('text')} className="h-20 neu-button flex flex-col items-center justify-center gap-2 transition-all group active:scale-95">
                            <FiType size={20} className="opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-neu-text)' }} />
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>Add Text</span>
                        </button>
                        <button onClick={() => setActiveTab('uploads')} className="h-20 neu-button flex flex-col items-center justify-center gap-2 transition-all group active:scale-95">
                            <FiImage size={20} className="opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-neu-text)' }} />
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>Add Image</span>
                        </button>
                        <input id="desktop-image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        <button onClick={() => setActiveTab('stickers')} className="h-20 neu-button flex flex-col items-center justify-center gap-2 transition-all group active:scale-95">
                            <FiSmile size={20} className="opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-neu-text)' }} />
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>Add Art</span>
                        </button>
                        <button onClick={() => setIsDrawing(!isDrawing)} className={`h-20 flex flex-col items-center justify-center gap-2 transition-all group ${isDrawing ? 'neu-pressed' : 'neu-button'}`}>
                            <FiZap size={20} className={isDrawing ? 'text-[var(--color-neu-accent)]' : 'opacity-40 group-hover:opacity-100'} style={isDrawing ? {} : { color: 'var(--color-neu-text)' }} />
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>{isDrawing ? 'Stop Ink' : 'Ink Mode'}</span>
                        </button>
                        {twoDModels?.length > 0 && (
                            <button onClick={() => setActiveTab('views')} className={`h-16 flex flex-col items-center justify-center gap-2 transition-all group col-span-2 ${activeTab === 'views' ? 'neu-pressed' : 'neu-button'}`}>
                                <FiBox size={16} className={activeTab === 'views' ? 'text-[var(--color-neu-accent)]' : 'opacity-40 group-hover:opacity-100'} style={activeTab === 'views' ? {} : { color: 'var(--color-neu-text)' }} />
                                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>Product Views</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="h-px bg-[var(--color-neu-dark)] w-full opacity-50" />

                <div className="space-y-3">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.30em] opacity-40" style={{ color: 'var(--color-neu-text)' }}>Designer Tools</h4>
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-10 rounded-full bg-[var(--color-neu-accent)] shadow-[0_0_10px_var(--color-neu-accent)]"></div>
                        <span className="text-xs font-black uppercase tracking-tight" style={{ color: 'var(--color-neu-text)' }}>{activeObject ? activeObject.type : 'Master Studio'}</span>
                    </div>
                </div>

                {/* Theme Palette */}
                <div className="space-y-4">
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>Theme Palette</div>
                    <div className="grid grid-cols-5 gap-3">
                        {['#0c0c2a', '#3b82f6', '#ec4899', '#fbbf24', '#ffffff', '#ef4444', '#10b981', '#6366f1', '#f97316', '#000000'].map((color, i) => (
                            <button key={i} onClick={() => {
                                const active = fabricRef.current?.getActiveObject();
                                if (active) { active.set('fill', color); active.set('stroke', color); fabricRef.current.renderAll(); updateTexture(); setActiveObject({ ...active, fill: color }); }
                                setBrushColor(color);
                            }} className={`aspect-square rounded-full border-2 transition-all ${brushColor === color ? 'border-[var(--color-neu-accent)] scale-110 shadow-lg' : 'border-transparent hover:border-[var(--color-neu-accent)]/20 shadow-inner'}`} style={{ backgroundColor: color }}></button>
                        ))}
                    </div>
                </div>

                {activeObject ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
                        {/* Property Matrix */}
                        <div className="grid gap-8">
                            <div className="space-y-4">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--color-neu-text)' }}><span>Scale Matrix</span><span>{Math.round(activeObject.scaleX * 100)}%</span></div>
                                <input type="range" min="0.1" max="5" step="0.1" value={activeObject.scaleX} onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    const active = fabricRef.current.getActiveObject();
                                    active.set({ scaleX: val, scaleY: val }).setCoords();
                                    fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, scaleX: val }));
                                }} onMouseUp={() => updateTexture(true)} className="w-full neu-range" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--color-neu-text)' }}><span>Angular Rotation</span><span>{Math.round(activeObject.angle)}°</span></div>
                                <input type="range" min="0" max="360" value={activeObject.angle} onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    const active = fabricRef.current.getActiveObject();
                                    active.set('angle', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, angle: val }));
                                }} onMouseUp={() => updateTexture(true)} className="w-full neu-range" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--color-neu-text)' }}><span>Pos X</span><span>{Math.round(activeObject.left)}</span></div>
                                    <input type="range" min="0" max="500" value={activeObject.left} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        active.set('left', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, left: val }));
                                    }} onMouseUp={() => updateTexture(true)} className="w-full neu-range" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--color-neu-text)' }}><span>Pos Y</span><span>{Math.round(activeObject.top)}</span></div>
                                    <input type="range" min="0" max="600" value={activeObject.top} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        active.set('top', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, top: val }));
                                    }} onMouseUp={() => updateTexture(true)} className="w-full neu-range" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--color-neu-text)' }}><span>Layer Opacity</span><span>{Math.round(activeObject.opacity * 100)}%</span></div>
                                <input type="range" min="0" max="1" step="0.01" value={activeObject.opacity} onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    const active = fabricRef.current.getActiveObject();
                                    active.set('opacity', val); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, opacity: val }));
                                }} onMouseUp={() => updateTexture(true)} className="w-full neu-range" />
                            </div>
                        </div>

                        {/* Typography Suite */}
                        {(activeObject.type === 'i-text' || activeObject.type === 'text') && (
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>Update Design Text</h4>
                                    <textarea value={activeObject.text} onChange={(e) => {
                                        const val = e.target.value;
                                        const active = fabricRef.current.getActiveObject();
                                        active.set('text', val);
                                        fabricRef.current.renderAll();
                                        fastSync();
                                        setActiveObject(prev => ({ ...prev, text: val }));
                                        if (window.textSyncTimer) clearTimeout(window.textSyncTimer);
                                        window.textSyncTimer = setTimeout(() => {
                                            updateTexture(true);
                                        }, 300);
                                    }} className="w-full h-28 neu-input rounded-3xl p-6 text-[14px] font-bold outline-none transition-all resize-none" style={{ color: 'var(--color-neu-text)' }} placeholder="Type here..." />
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>Studio Fonts</h4>
                                    <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
                                        {premiumFonts.map(font => (
                                            <button key={font} onClick={() => {
                                                const active = fabricRef.current.getActiveObject();
                                                active.set('fontFamily', font); fabricRef.current.renderAll(); updateTexture(); setActiveObject({ ...active, fontFamily: font });
                                            }} className={`h-11 rounded-[14px] text-[10px] transition-all font-black uppercase tracking-tighter ${activeObject.fontFamily === font ? 'neu-pressed text-[var(--color-neu-accent)]' : 'neu-button opacity-50 hover:opacity-100'}`} style={{ fontFamily: font, color: activeObject.fontFamily === font ? 'var(--color-neu-accent)' : 'var(--color-neu-text)' }}>{font}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-6 border-t border-[var(--color-neu-dark)]" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                            <button onClick={() => setActiveTab('layers')} className="w-full h-14 neu-button flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest transition-all active:scale-95" style={{ color: 'var(--color-neu-text)' }}>
                                <FiLayers size={16} /> Manage Layers ({canvasObjects.length})
                            </button>
                            <div className="grid grid-cols-2 gap-4">
                                {(activeObject.type === 'image' || activeObject.type === 'FabricImage' || activeObject.uid?.startsWith('upload_')) && (
                                    <button onClick={() => {
                                        const imgData = fabricRef.current.getActiveObject().toDataURL();
                                        window.dispatchEvent(new CustomEvent('OPEN_CROPPER', { detail: { image: imgData, uid: activeObject.uid } }));
                                    }} className="h-14 neu-button flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest transition-all active:scale-95" style={{ color: 'var(--color-neu-accent)' }}>
                                        Crop
                                    </button>
                                )}
                                <button onClick={() => { fabricRef.current.centerObject(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); }} className="h-14 neu-button flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest transition-all active:scale-95" style={{ color: 'var(--color-neu-text)' }}><FiMove size={14} /> Center</button>
                                <button onClick={() => {
                                    const active = fabricRef.current.getActiveObject();
                                    active.clone().then(cloned => {
                                        cloned.set({ left: active.left + 20, top: active.top + 20, uid: `clone_${Date.now()}` });
                                        fabricRef.current.add(cloned); fabricRef.current.setActiveObject(cloned); fabricRef.current.renderAll(); updateTexture();
                                    });
                                }} className="h-14 neu-button flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest transition-all active:scale-95" style={{ color: 'var(--color-neu-text)' }}><FiRepeat size={14} /> Clone</button>
                                <button onClick={() => { fabricRef.current.remove(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); setActiveObject(null); }} className="h-14 neu-pressed text-rose-500 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"><FiTrash2 size={16} /> Delete</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 neu-pressed border-dashed border-[var(--color-neu-dark)]">
                        <FiBox size={40} className="opacity-10 mb-6 animate-pulse" style={{ color: 'var(--color-neu-text)' }} />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] leading-relaxed opacity-20" style={{ color: 'var(--color-neu-text)' }}>Select Layer<br />to Configure</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ToolSidebar;

