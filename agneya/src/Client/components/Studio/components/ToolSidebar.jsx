import React from 'react';
import { FiType, FiImage, FiSmile, FiZap, FiLayers, FiMove, FiRepeat, FiTrash2, FiBox } from 'react-icons/fi';

function ToolSidebar({ 
    addText, handleFileUpload, isDrawing, setIsDrawing, 
    fabricRef, brushColor, setBrushColor, updateTexture, fastSync, premiumFonts,
    activeTab, setActiveTab, 
    activeObject, setActiveObject, 
    canvasObjects 
}) {
    React.useEffect(() => {
        console.log('TRACE: ToolSidebar.jsx Rendered');
    }, []);

    return (
        <div className="hidden xl:flex w-[320px] flex-col gap-6">
            <div className="floating-card flex-1 p-8 flex flex-col gap-6 overflow-y-auto no-scrollbar border border-slate-100 shadow-xl bg-white/95">
                <div className="space-y-2 mb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.30em] text-[#0c0c2a]/40">Creation Suite</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setActiveTab('text')} className="h-20 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-[#0c0c2a] hover:text-white transition-all group active:scale-95 shadow-sm">
                            <FiType size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Add Text</span>
                        </button>
                        <button onClick={() => setActiveTab('uploads')} className="h-20 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-[#0c0c2a] hover:text-white transition-all group active:scale-95 shadow-sm">
                            <FiImage size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Add Image</span>
                        </button>
                        <input id="desktop-image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        <button onClick={() => setActiveTab('stickers')} className="h-20 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-[#0c0c2a] hover:text-white transition-all group active:scale-95 shadow-sm">
                            <FiSmile size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Add Art</span>
                        </button>
                        <button onClick={() => setIsDrawing(!isDrawing)} className={`h-20 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all group shadow-sm ${isDrawing ? 'bg-[#4f46e5] text-white shadow-lg' : 'bg-slate-50 text-[#0c0c2a] border border-slate-100 hover:bg-slate-100'}`}>
                            <FiZap size={20} className={isDrawing ? 'text-white' : 'text-slate-400 group-hover:text-[#0c0c2a]'} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{isDrawing ? 'Stop Ink' : 'Ink Mode'}</span>
                        </button>
                    </div>
                </div>

                <div className="h-px bg-slate-100 w-full" />

                <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.30em] text-[#0c0c2a]/40">Designer Tools</h4>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 bg-[#0c0c2a] rounded-full"></div>
                        <span className="text-[11px] font-black uppercase text-[#0c0c2a]">{activeObject ? activeObject.type : 'Master Studio'}</span>
                    </div>
                </div>

                {/* Theme Palette */}
                <div className="space-y-4">
                    <div className="text-[10px] font-black text-[#0c0c2a]/60 uppercase tracking-widest">Theme Palette</div>
                    <div className="grid grid-cols-5 gap-3">
                        {['#0c0c2a', '#3b82f6', '#ec4899', '#fbbf24', '#ffffff', '#ef4444', '#10b981', '#6366f1', '#f97316', '#000000'].map((color, i) => (
                            <button key={i} onClick={() => {
                                const active = fabricRef.current?.getActiveObject();
                                if (active) { active.set('fill', color); active.set('stroke', color); fabricRef.current.renderAll(); updateTexture(); setActiveObject({ ...active, fill: color }); }
                                setBrushColor(color);
                            }} className={`aspect-square rounded-full border-2 transition-all ${brushColor === color ? 'border-[#4f46e5] scale-110 shadow-md' : 'border-slate-100 hover:border-[#4f46e5]/20'}`} style={{ backgroundColor: color }}></button>
                        ))}
                    </div>
                </div>

                {activeObject ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
                        {/* Property Matrix */}
                        <div className="grid gap-8">
                            <div className="space-y-4">
                                <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Scale Matrix</span><span>{Math.round(activeObject.scaleX * 100)}%</span></div>
                                <input type="range" min="0.1" max="5" step="0.1" value={activeObject.scaleX} onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    const active = fabricRef.current.getActiveObject();
                                    active.set({ scaleX: val, scaleY: val }).setCoords();
                                    fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, scaleX: val }));
                                }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Angular Rotation</span><span>{Math.round(activeObject.angle)}°</span></div>
                                <input type="range" min="0" max="360" value={activeObject.angle} onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    const active = fabricRef.current.getActiveObject();
                                    active.set('angle', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, angle: val }));
                                }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Pos X</span><span>{Math.round(activeObject.left)}</span></div>
                                    <input type="range" min="0" max="500" value={activeObject.left} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        active.set('left', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, left: val }));
                                    }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Pos Y</span><span>{Math.round(activeObject.top)}</span></div>
                                    <input type="range" min="0" max="600" value={activeObject.top} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        active.set('top', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, top: val }));
                                    }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Layer Opacity</span><span>{Math.round(activeObject.opacity * 100)}%</span></div>
                                <input type="range" min="0" max="1" step="0.01" value={activeObject.opacity} onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    const active = fabricRef.current.getActiveObject();
                                    active.set('opacity', val); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, opacity: val }));
                                }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                            </div>
                        </div>

                        {/* Typography Suite */}
                        {(activeObject.type === 'i-text' || activeObject.type === 'text') && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-[#0c0c2a]/60 uppercase tracking-widest">Update Design Text</h4>
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
                                    }} className="w-full h-28 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-[14px] font-bold text-[#0c0c2a] focus:bg-white focus:border-[#0c0c2a]/20 transition-all outline-none resize-none" placeholder="Type here..." />
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-[#0c0c2a]/60 uppercase tracking-widest leading-relaxed">Studio Fonts</h4>
                                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
                                        {premiumFonts.map(font => (
                                            <button key={font} onClick={() => {
                                                const active = fabricRef.current.getActiveObject();
                                                active.set('fontFamily', font); fabricRef.current.renderAll(); updateTexture(); setActiveObject({ ...active, fontFamily: font });
                                            }} className={`h-11 rounded-[14px] text-[10px] border transition-all font-black uppercase tracking-tighter ${activeObject.fontFamily === font ? 'bg-[#0c0c2a] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-[#0c0c2a]/10'}`} style={{ fontFamily: font }}>{font}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 pt-4 border-t border-slate-50">
                            <button onClick={() => setActiveTab('layers')} className="w-full h-14 bg-slate-50 text-[#0c0c2a] rounded-2xl flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all active:scale-95">
                                <FiLayers size={16} /> Manage Layers ({canvasObjects.length})
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { fabricRef.current.centerObject(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); }} className="h-14 bg-slate-50 text-[#0c0c2a] rounded-2xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all active:scale-95"><FiMove size={14} /> Center Obj</button>
                                <button onClick={() => {
                                    const active = fabricRef.current.getActiveObject();
                                    active.clone().then(cloned => {
                                        cloned.set({ left: active.left + 20, top: active.top + 20, uid: `clone_${Date.now()}` });
                                        fabricRef.current.add(cloned); fabricRef.current.setActiveObject(cloned); fabricRef.current.renderAll(); updateTexture();
                                    });
                                }} className="h-14 bg-slate-50 text-[#0c0c2a] rounded-2xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all active:scale-95"><FiRepeat size={14} /> Clone</button>
                            </div>
                            <button onClick={() => { fabricRef.current.remove(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); setActiveObject(null); }} className="w-full h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all active:scale-95"><FiTrash2 size={16} /> Delete Layer</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-[48px] border-2 border-dashed border-slate-100">
                        <FiBox size={40} className="text-slate-200 mb-6 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] leading-relaxed">Select Layer<br />to Configure</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ToolSidebar;

