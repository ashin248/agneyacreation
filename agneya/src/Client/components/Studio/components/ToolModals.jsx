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
    setIsMobileUiMinimized,
    canvasObjects,
    activeObject, setActiveObject,
    twoDModels, active2DModelIdx, activeSupportSide, setActiveSupportSide, handleSwitchSide
}) {
    return (
        <>
            {activeTab === 'uploads' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[500px] h-auto max-h-[75vh] min-h-[40vh] bg-white rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 overflow-y-auto z-[1000] border border-slate-100 animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Add Assets</h4>
                        <div className="flex items-center gap-4">
                            {uploadedAssets.length > 0 && <button onClick={handlePurgeGallery} className="text-[9px] font-bold text-rose-500 uppercase tracking-widest hover:underline">Purge All</button>}
                            <button onClick={() => setActiveTab(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100"><FiX size={18} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5 mb-8">
                        <div className="relative h-32 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center gap-3 hover:border-[#0c0c2a] hover:bg-slate-50 transition-all cursor-pointer group">
                            <input type="file" ref={fileRef} onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <FiArrowUp size={24} className="text-slate-300 group-hover:text-[#0c0c2a] transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Import File</span>
                        </div>
                        <button onClick={handleRemoveBg} disabled={isRemovingBg} className="h-32 bg-slate-50 rounded-[32px] flex flex-col items-center justify-center gap-3 hover:bg-[#0c0c2a] hover:text-white transition-all group">
                            {isRemovingBg ? <div className="w-6 h-6 border-2 border-[#0c0c2a] border-t-transparent rounded-full animate-spin"></div> : <FiZap size={24} className="group-hover:animate-pulse" />}
                            <span className="text-[9px] font-black uppercase tracking-widest">Remove Background</span>
                        </button>
                    </div>
                    {uploadedAssets.length > 0 && (
                        <div className="grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4">
                            {uploadedAssets.map(a => (
                                <div key={a.id} className="group relative aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all">
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
                                    }} className="w-full h-full object-contain p-2 cursor-pointer group-hover:scale-110 transition-transform" />
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
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[400px] h-auto max-h-[70vh] bg-white rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 z-[1000] border border-slate-100 animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex justify-between items-center mb-10"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Drawing Tools</h4><button onClick={() => setActiveTab(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><FiX /></button></div>
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase"><span>Brush Diameter</span><span>{brushSize}px</span></div>
                            <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full" />
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {['#000000', '#ffffff', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#2dd4bf'].map(c => (
                                <button key={c} onClick={() => setBrushColor(c)} className={`aspect-square rounded-full border-2 ${brushColor === c ? 'border-[#0c0c2a] scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                        <button onClick={() => { setIsDrawing(true); setActiveTab(null); setIsMobileUiMinimized(false); }} className="w-full h-16 bg-[#0c0c2a] text-white rounded-[24px] font-black uppercase tracking-widest text-[10px]">Initialize Drawing</button>
                    </div>
                </div>
            )}

            {activeTab === 'text' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[400px] h-auto max-h-[70vh] bg-white rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 z-[1000] border border-slate-100 animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex justify-between items-center mb-8"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Add Text</h4><button onClick={() => setActiveTab(null)}><FiX size={18} className="text-slate-300" /></button></div>
                    <div className="flex flex-col gap-4">
                        <button onClick={() => { addText('heading'); setActiveTab(null); setIsMobileUiMinimized(false); }} className="w-full h-16 bg-slate-50 hover:bg-[#0c0c2a] hover:text-white rounded-[24px] text-left px-8 font-black uppercase text-[10px] transition-all flex justify-between items-center group">Headline <FiMaximize className="group-hover:rotate-45 transition-transform" /></button>
                        <button onClick={() => { addText('body'); setActiveTab(null); setIsMobileUiMinimized(false); }} className="w-full h-16 bg-slate-50 hover:bg-[#0c0c2a] hover:text-white rounded-[24px] text-left px-8 font-black uppercase text-[10px] transition-all flex justify-between items-center group">Sub-headline <FiPlus size={18} /></button>
                    </div>
                </div>
            )}

            {activeTab === 'stickers' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[500px] h-auto max-h-[75vh] min-h-[40vh] bg-white rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 overflow-y-auto z-[1000] border border-slate-100 animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex justify-between items-center mb-8"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Stickers & Graphics</h4><button onClick={() => setActiveTab(null)}><FiX size={18} className="text-slate-300" /></button></div>
                    <div className="grid grid-cols-4 gap-5">
                        {stickerLibrary.map(s => <div key={s.id} onClick={() => { addSticker(s.svg); setActiveTab(null); setIsMobileUiMinimized(false); }} className="aspect-square bg-slate-50 rounded-[24px] p-6 flex items-center justify-center cursor-pointer hover:bg-slate-100 hover:scale-105 transition-all text-[#0c0c2a]" dangerouslySetInnerHTML={{ __html: s.svg }} />)}
                    </div>
                </div>
            )}

            {activeTab === 'layers' && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[400px] h-auto max-h-[75vh] bg-white rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 z-[1000] border border-slate-100 animate-in slide-in-from-bottom-full duration-500 flex flex-col">
                    <div className="flex justify-between items-center mb-8"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Layers</h4><button onClick={() => setActiveTab(null)}><FiX size={18} className="text-slate-400" /></button></div>
                    <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-2">
                        {canvasObjects.length === 0 ? <div className="h-40 flex flex-col items-center justify-center text-slate-300 gap-4"><FiGrid size={24} /><span className="text-[9px] font-black uppercase tracking-[0.2em] italic">No Nodes Active</span></div> :
                            canvasObjects.map((obj, i) => (
                                <div key={i} onClick={() => {
                                    const real = fabricRef.current.getObjects().find(o => o.uid === obj.uid);
                                    if (real) { fabricRef.current.setActiveObject(real); fabricRef.current.renderAll(); setActiveObject({ ...real, uid: real.uid, type: real.type }); }
                                }} className={`flex items-center justify-between p-5 rounded-[24px] transition-all cursor-pointer ${activeObject?.uid === obj.uid ? 'bg-[#0c0c2a] text-white shadow-xl translate-x-1' : 'bg-slate-50 text-slate-800 hover:bg-slate-100'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{obj.type}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); const real = fabricRef.current.getObjects().find(o => o.uid === obj.uid); if (real) { fabricRef.current.bringToFront(real); fabricRef.current.renderAll(); updateTexture(); } }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"><FiArrowUp size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); const real = fabricRef.current.getObjects().find(o => o.uid === obj.uid); if (real) { fabricRef.current.remove(real); fabricRef.current.renderAll(); updateTexture(); setActiveObject(null); } }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-rose-500"><FiTrash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {activeTab === 'views' && twoDModels?.length > 0 && (
                <div className="fixed bottom-0 xl:bottom-[160px] left-1/2 -translate-x-1/2 w-full xl:w-[90%] xl:max-w-[400px] h-auto max-h-[75vh] bg-white rounded-t-[48px] xl:rounded-[48px] shadow-2xl p-8 xl:p-10 z-[1000] border border-slate-100 animate-in slide-in-from-bottom-full duration-500 flex flex-col">
                    <div className="flex justify-between items-center mb-8"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Product Views</h4><button onClick={() => setActiveTab(null)}><FiX size={18} className="text-slate-400" /></button></div>
                    <div className="grid grid-cols-3 gap-4">
                        <button 
                            onClick={() => { handleSwitchSide(`model_${active2DModelIdx}_main`); setActiveSupportSide('Main'); setActiveTab(null); }}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${activeSupportSide === 'Main' ? 'border-[#0c0c2a] bg-slate-50 shadow-md' : 'border-slate-100 bg-white hover:border-[#0c0c2a]/30'}`}
                        >
                            <img loading="lazy" src={twoDModels[active2DModelIdx]?.mainModelUrl} alt="Main" className="w-12 h-12 object-contain drop-shadow-sm" />
                            <span className="text-[9px] font-black uppercase">Main</span>
                        </button>
                        {twoDModels[active2DModelIdx]?.supportModels?.map((sm, smIdx) => (
                            <button 
                                key={smIdx}
                                onClick={() => { handleSwitchSide(`model_${active2DModelIdx}_support_${sm.side}`); setActiveSupportSide(sm.side); setActiveTab(null); }}
                                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${activeSupportSide === sm.side ? 'border-[#0c0c2a] bg-slate-50 shadow-md' : 'border-slate-100 bg-white hover:border-[#0c0c2a]/30'}`}
                            >
                                <img loading="lazy" src={sm.url} alt={sm.side} className="w-12 h-12 object-contain drop-shadow-sm" />
                                <span className="text-[9px] font-black uppercase">{sm.side}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

