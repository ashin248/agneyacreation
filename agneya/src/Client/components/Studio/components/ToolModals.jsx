import React from 'react';
import * as fabric from 'fabric';
import { FiX, FiArrowUp, FiZap, FiPlus, FiMaximize, FiGrid, FiTrash2 } from 'react-icons/fi';

export default function ToolModals({
    uploadedAssets, handlePurgeGallery, fileRef, handleFileUpload,
    handleRemoveBg, isRemovingBg, removeAsset,
    fabricRef, updateTexture,
    brushSize, setBrushSize, brushColor, setBrushColor,
    setIsDrawing, addText,
    stickerLibrary, addSticker,
    activeTab, setActiveTab,
    setIsMobileUiMinimized,
    canvasObjects,
    activeObject, setActiveObject,
    twoDModels, active2DModelIdx, activeSupportSide, setActiveSupportSide, handleSwitchSide
}) {
    return (
        <>
            {activeTab === 'uploads' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[500px] h-auto max-h-[75vh] min-h-[40vh] bg-[var(--color-neu-bg)] rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 overflow-y-auto z-[1000] border border-[var(--color-neu-dark)] animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30" style={{ color: 'var(--color-neu-text)' }}>Add Assets</h4>
                        <div className="flex items-center gap-4">
                            {uploadedAssets.length > 0 && <button onClick={handlePurgeGallery} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:opacity-70 transition-opacity">Purge Gallery</button>}
                            <button onClick={() => setActiveTab(null)} className="w-10 h-10 rounded-full neu-button flex items-center justify-center transition-all active:scale-90" style={{ color: 'var(--color-neu-text)' }}><FiX size={18} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5 mb-8">
                        <div className="relative h-32 neu-pressed border-2 border-dashed border-[var(--color-neu-dark)] rounded-[32px] flex flex-col items-center justify-center gap-3 hover:border-[var(--color-neu-accent)] transition-all cursor-pointer group">
                            <input type="file" ref={fileRef} onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <FiArrowUp size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-neu-text)' }} />
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-30" style={{ color: 'var(--color-neu-text)' }}>Import File</span>
                        </div>
                        <button onClick={handleRemoveBg} disabled={isRemovingBg} className="h-32 neu-button flex flex-col items-center justify-center gap-3 transition-all group active:scale-95 disabled:opacity-50">
                            {isRemovingBg ? <div className="w-6 h-6 border-2 border-[var(--color-neu-accent)] border-t-transparent rounded-full animate-spin"></div> : <FiZap size={24} className="opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-neu-text)' }} />}
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>Remove Background</span>
                        </button>
                    </div>
                    {uploadedAssets.length > 0 && (
                        <div className="grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4">
                            {uploadedAssets.map(a => (
                                <div key={a.id} className="group relative aspect-square neu-button rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all p-2">
                                    <img loading="lazy" src={a.url} onClick={() => {
                                        const imgElement = new Image();
                                        imgElement.crossOrigin = 'anonymous';
                                        imgElement.onload = () => {
                                            try {
                                                const ImgClass = fabric.FabricImage || fabric.Image;
                                                const img = new ImgClass(imgElement, {
                                                    width: imgElement.naturalWidth || imgElement.width || 100,
                                                    height: imgElement.naturalHeight || imgElement.height || 100
                                                });
                                                img.scaleToWidth(180);
                                                img.set({ left: 250, top: 300, originX: 'center', originY: 'center', uid: `upload_${Date.now()}` });
                                                if (fabricRef.current) {
                                                    fabricRef.current.add(img);
                                                    fabricRef.current.setActiveObject(img);
                                                    fabricRef.current.renderAll();
                                                    updateTexture(true);
                                                    setIsMobileUiMinimized(false);
                                                }
                                            } catch (err) {
                                                console.error("Fabric Gallery Error:", err);
                                            }
                                        };
                                        imgElement.src = a.url;
                                    }} className="w-full h-full object-contain cursor-pointer group-hover:scale-110 transition-transform" />
                                    <button onClick={(e) => { e.stopPropagation(); removeAsset(a.id); }} className="absolute top-2 right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-rose-600">
                                        <FiX size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'draw' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[400px] h-auto max-h-[70vh] bg-[var(--color-neu-bg)] rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 z-[1000] border border-[var(--color-neu-dark)] animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex justify-between items-center mb-10">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30" style={{ color: 'var(--color-neu-text)' }}>Drawing Tools</h4>
                        <button onClick={() => setActiveTab(null)} className="w-10 h-10 rounded-full neu-button flex items-center justify-center transition-all active:scale-90" style={{ color: 'var(--color-neu-text)' }}><FiX /></button>
                    </div>
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-tight opacity-40" style={{ color: 'var(--color-neu-text)' }}><span>Brush Diameter</span><span>{brushSize}px</span></div>
                            <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full neu-range" />
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {['#000000', '#ffffff', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#2dd4bf'].map(c => (
                                <button key={c} onClick={() => setBrushColor(c)} className={`aspect-square rounded-full border-2 transition-all ${brushColor === c ? 'border-[var(--color-neu-accent)] scale-110 shadow-lg' : 'border-transparent shadow-inner'}`} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                        <button 
                            onClick={() => { setIsDrawing(true); setActiveTab(null); setIsMobileUiMinimized(false); }} 
                            className="w-full h-16 neu-button-accent font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all"
                        >
                            Initialize Studio
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'text' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[400px] h-auto max-h-[70vh] bg-[var(--color-neu-bg)] rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 z-[1000] border border-[var(--color-neu-dark)] animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30" style={{ color: 'var(--color-neu-text)' }}>Add Text</h4>
                        <button onClick={() => setActiveTab(null)} className="w-10 h-10 rounded-full neu-button flex items-center justify-center transition-all active:scale-90" style={{ color: 'var(--color-neu-text)' }}><FiX size={18} /></button>
                    </div>
                    <div className="flex flex-col gap-4">
                        <button onClick={() => { addText('heading'); setActiveTab(null); setIsMobileUiMinimized(false); }} className="w-full h-16 neu-button px-8 font-black uppercase text-[10px] transition-all flex justify-between items-center group active:scale-95" style={{ color: 'var(--color-neu-text)' }}>
                            Headline 
                            <FiMaximize className="opacity-40 group-hover:opacity-100 group-hover:rotate-45 transition-all" />
                        </button>
                        <button onClick={() => { addText('body'); setActiveTab(null); setIsMobileUiMinimized(false); }} className="w-full h-16 neu-button px-8 font-black uppercase text-[10px] transition-all flex justify-between items-center group active:scale-95" style={{ color: 'var(--color-neu-text)' }}>
                            Sub-headline 
                            <FiPlus size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'stickers' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[500px] h-auto max-h-[75vh] min-h-[40vh] bg-[var(--color-neu-bg)] rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 overflow-y-auto z-[1000] border border-[var(--color-neu-dark)] animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30" style={{ color: 'var(--color-neu-text)' }}>Stickers & Graphics</h4>
                        <button onClick={() => setActiveTab(null)} className="w-10 h-10 rounded-full neu-button flex items-center justify-center transition-all active:scale-90" style={{ color: 'var(--color-neu-text)' }}><FiX size={18} /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-5">
                        {stickerLibrary.map(s => (
                            <div 
                                key={s.id} 
                                onClick={() => { addSticker(s.svg); setActiveTab(null); setIsMobileUiMinimized(false); }} 
                                className="aspect-square neu-button rounded-[24px] p-6 flex items-center justify-center cursor-pointer hover:neu-pressed transition-all active:scale-95" 
                                style={{ color: 'var(--color-neu-text)' }}
                                dangerouslySetInnerHTML={{ __html: s.svg }} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'layers' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[400px] h-auto max-h-[75vh] bg-[var(--color-neu-bg)] rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 z-[1000] border border-[var(--color-neu-dark)] animate-in slide-in-from-bottom-full duration-500 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30" style={{ color: 'var(--color-neu-text)' }}>Design Layers</h4>
                        <button onClick={() => setActiveTab(null)} className="w-10 h-10 rounded-full neu-button flex items-center justify-center transition-all active:scale-90" style={{ color: 'var(--color-neu-text)' }}><FiX size={18} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-2">
                        {canvasObjects.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center opacity-20 gap-4" style={{ color: 'var(--color-neu-text)' }}>
                                <FiGrid size={24} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">No Layers Active</span>
                            </div>
                        ) : (
                            canvasObjects.map((obj, i) => (
                                <div key={i} onClick={() => {
                                    const real = fabricRef.current.getObjects().find(o => o.uid === obj.uid);
                                    if (real) { fabricRef.current.setActiveObject(real); fabricRef.current.renderAll(); setActiveObject({ ...real, uid: real.uid, type: real.type }); }
                                }} className={`flex items-center justify-between p-5 rounded-[24px] transition-all cursor-pointer ${activeObject?.uid === obj.uid ? 'neu-pressed translate-x-1' : 'neu-button hover:neu-pressed'}`} style={{ color: 'var(--color-neu-text)' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 neu-pressed rounded-xl flex items-center justify-center text-[10px] font-black opacity-40">{i + 1}</div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{obj.type}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); const real = fabricRef.current.getObjects().find(o => o.uid === obj.uid); if (real) { fabricRef.current.bringToFront(real); fabricRef.current.renderAll(); updateTexture(); } }} className="w-10 h-10 neu-button rounded-full flex items-center justify-center transition-all active:scale-90"><FiArrowUp size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); const real = fabricRef.current.getObjects().find(o => o.uid === obj.uid); if (real) { fabricRef.current.remove(real); fabricRef.current.renderAll(); updateTexture(); setActiveObject(null); } }} className="w-10 h-10 neu-button rounded-full flex items-center justify-center text-rose-500 transition-all active:scale-90"><FiTrash2 size={14} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'views' && twoDModels?.length > 0 && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[400px] h-auto max-h-[75vh] bg-[var(--color-neu-bg)] rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 z-[1000] border border-[var(--color-neu-dark)] animate-in slide-in-from-bottom-full duration-500 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30" style={{ color: 'var(--color-neu-text)' }}>Product Views</h4>
                        <button onClick={() => setActiveTab(null)} className="w-10 h-10 rounded-full neu-button flex items-center justify-center transition-all active:scale-90" style={{ color: 'var(--color-neu-text)' }}><FiX size={18} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <button 
                            onClick={() => { handleSwitchSide(`model_${active2DModelIdx}_main`); setActiveSupportSide('Main'); setActiveTab(null); }}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${activeSupportSide === 'Main' ? 'neu-pressed border-[var(--color-neu-accent)]/20' : 'neu-button opacity-60 hover:opacity-100'}`}
                        >
                            <img loading="lazy" src={twoDModels[active2DModelIdx]?.mainModelUrl} alt="Main" className="w-12 h-12 object-contain drop-shadow-md" />
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>Main</span>
                        </button>
                        {twoDModels[active2DModelIdx]?.supportModels?.map((sm, smIdx) => (
                            <button 
                                key={smIdx}
                                onClick={() => { handleSwitchSide(`model_${active2DModelIdx}_support_${sm.side}`); setActiveSupportSide(sm.side); setActiveTab(null); }}
                                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${activeSupportSide === sm.side ? 'neu-pressed border-[var(--color-neu-accent)]/20' : 'neu-button opacity-60 hover:opacity-100'}`}
                            >
                                <img loading="lazy" src={sm.url} alt={sm.side} className="w-12 h-12 object-contain drop-shadow-md" />
                                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>{sm.side}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

