import React from 'react';
import { FiMaximize2, FiMinimize2, FiArrowUp, FiArrowDown, FiType, FiImage, FiSmile, FiEdit3, FiLayers, FiMove, FiTrash2, FiBox } from 'react-icons/fi';
import { useStudio } from '../context/StudioContext';

function PropertyDock({ 
    fabricRef, brushColor, setBrushColor, updateTexture, fastSync, isDrawing, setIsDrawing 
}) {
    const { 
        activeStudioTab, 
        activeTab, setActiveTab, 
        isMobileUiMinimized, setIsMobileUiMinimized, 
        activeObject, setActiveObject 
    } = useStudio();

    return (
        <div className={`xl:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl rounded-t-[48px] shadow-[0_-20px_60px_rgba(0,0,0,0.1)] p-6 pb-12 flex flex-col gap-6 z-[600] transition-all duration-700 ease-out border-t border-slate-100 ${isMobileUiMinimized ? 'translate-y-[85%]' : 'translate-y-0 h-[40%]'}`}>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-200 rounded-full" />

            <div className="flex justify-between items-center shrink-0 pt-2 text-[#0c0c2a]">
                <div className="flex flex-col" onClick={() => setIsMobileUiMinimized(!isMobileUiMinimized)}>
                    <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                        {activeStudioTab === '2D' ? '2D STUDIO' : '3D STUDIO'} {isMobileUiMinimized ? <FiArrowUp size={14} className="animate-bounce" /> : <FiArrowDown size={14} />}
                    </h3>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{activeObject ? activeObject.type : 'Designer Canvas'}</span>
                </div>
                <div className="flex items-center gap-3">
                    {activeObject && (
                        <button onClick={() => { fabricRef.current.discardActiveObject(); fabricRef.current.renderAll(); setActiveObject(null); }} className="px-5 py-2 bg-[#0c0c2a]/10 text-[#0c0c2a] rounded-full text-[9px] font-black uppercase tracking-tight active:scale-95 transition-all">Deselect</button>
                    )}
                    <button onClick={() => setIsMobileUiMinimized(!isMobileUiMinimized)} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#0c0c2a] shadow-sm">
                        {isMobileUiMinimized ? <FiMaximize2 size={16} /> : <FiMinimize2 size={16} />}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Middle Section: Tool Hierarchy (Sliders -> Input -> Colors) */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pb-10">
                    {activeObject ? (
                        <div className="space-y-8 pt-2">
                            {/* 1. SLIDERS (Size, Rotate, Pos X, Pos Y, Opacity) */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Size</span><span>{Math.round(activeObject.scaleX * 100)}%</span></div>
                                    <input type="range" min="0.1" max="5" step="0.1" value={activeObject.scaleX} onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        active.set({ scaleX: val, scaleY: val }).setCoords();
                                        fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, scaleX: val }));
                                    }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Rotate</span><span>{Math.round(activeObject.angle)}°</span></div>
                                    <input type="range" min="0" max="360" value={activeObject.angle} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        active.set('angle', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, angle: val }));
                                    }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Position X</span><span>{Math.round(activeObject.left)}</span></div>
                                    <input type="range" min="0" max="500" value={activeObject.left} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        active.set('left', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, left: val }));
                                    }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Position Y</span><span>{Math.round(activeObject.top)}</span></div>
                                    <input type="range" min="0" max="600" value={activeObject.top} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        active.set('top', val).setCoords(); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, top: val }));
                                    }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                </div>
                                <div className="space-y-3 col-span-2">
                                    <div className="flex justify-between text-[10px] font-black text-[#0c0c2a] uppercase tracking-tighter"><span>Transparency</span><span>{Math.round(activeObject.opacity * 100)}%</span></div>
                                    <input type="range" min="0" max="1" step="0.01" value={activeObject.opacity} onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        const active = fabricRef.current.getActiveObject();
                                        active.set('opacity', val); fabricRef.current.renderAll(); fastSync(); setActiveObject(prev => ({ ...prev, opacity: val }));
                                    }} onMouseUp={() => updateTexture(true)} className="w-full accent-[#0c0c2a]" />
                                </div>
                            </div>

                            {/* 2. TEXT INPUT (Middle) - Visible only for text layers */}
                            {(activeObject.type === 'i-text' || activeObject.type === 'text') && (
                                <div className="space-y-4 px-1">
                                    <div className="text-[10px] font-black text-[#0c0c2a] uppercase tracking-widest">Edit Text Content</div>
                                    <textarea rows="2" value={activeObject.text} onChange={(e) => {
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
                                    }} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-[14px] font-bold text-[#0c0c2a] focus:border-[#0c0c2a]/20 transition-all outline-none" placeholder="Enter your text..."></textarea>
                                </div>
                            )}

                            {/* 3. COLORS (Bottom) */}
                            <div className="space-y-4 px-1">
                                <div className="text-[10px] font-black text-[#0c0c2a] uppercase tracking-widest">Theme Palette</div>
                                <div className="grid grid-cols-5 gap-3">
                                    {['#0c0c2a', '#3b82f6', '#ec4899', '#fbbf24', '#ffffff', '#ef4444', '#10b981', '#6366f1', '#f97316', '#000000'].map((color, i) => (
                                        <button key={i} onClick={() => {
                                            const active = fabricRef.current?.getActiveObject();
                                            if (active) { active.set('fill', color); active.set('stroke', color); fabricRef.current.renderAll(); updateTexture(); setActiveObject({ ...active, fill: color }); }
                                            setBrushColor(color);
                                        }} className={`aspect-square rounded-full border-2 transition-all ${brushColor === color ? 'border-[#0c0c2a] scale-110 shadow-lg' : 'border-slate-100'}`} style={{ backgroundColor: color }}></button>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => { fabricRef.current.centerObject(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); }} className="flex-1 h-14 bg-slate-50 border border-slate-100 text-[#0c0c2a] text-[9px] font-black uppercase rounded-[20px] flex items-center justify-center gap-2 shadow-sm active:bg-slate-100"><FiMove size={14} /> Center Object</button>
                                <button onClick={() => { fabricRef.current.remove(fabricRef.current.getActiveObject()); fabricRef.current.renderAll(); updateTexture(); setActiveObject(null); }} className="flex-1 h-14 bg-rose-50 text-rose-500 text-[9px] font-black uppercase rounded-[20px] flex items-center justify-center gap-2 border border-rose-100 shadow-sm active:bg-rose-100"><FiTrash2 size={14} /> Remove Layer</button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30">
                            <FiBox size={48} className="text-[#0c0c2a] mb-6 animate-pulse" />
                            <p className="text-[10px] font-black text-[#0c0c2a] uppercase tracking-[0.3em] leading-relaxed">No Selection<br />Active</p>
                        </div>
                    )}
                </div>

                {/* Right Section: Integrated Navigation Dock */}
                <div className="w-16 h-full bg-slate-50 rounded-[32px] p-2 flex flex-col gap-2 border border-slate-100 shrink-0 shadow-sm">
                    {[
                        { id: 'uploads', icon: <FiImage size={20} /> },
                        { id: 'text', icon: <FiType size={20} /> },
                        { id: 'stickers', icon: <FiSmile size={20} /> },
                        { id: 'draw', icon: <FiEdit3 size={20} /> },
                        { id: 'layers', icon: <FiLayers size={20} /> }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id !== 'draw') setIsDrawing(false); }} className={`flex-1 rounded-[24px] flex items-center justify-center transition-all ${activeTab === tab.id ? 'bg-[#0c0c2a] text-white shadow-xl scale-105' : 'text-slate-400 hover:text-[#0c0c2a]'}`}>
                            {tab.icon}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PropertyDock;
