import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiEdit3, 
  FiChevronLeft, 
  FiMaximize, 
  FiBox, 
  FiZap,
  FiArrowRight,
  FiCpu,
  FiLayers,
  FiHexagon
} from 'react-icons/fi';

const CustomCatalog = () => {
    const navigate = useNavigate();
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const res = await axios.get('/api/public/products');
                if (res.data.success) {
                    const customizable = res.data.data.filter(p => {
                        if (p.productType) return p.productType === 'customizable';
                        return p.isCustomizable && (p.blankFrontImage || p.base3DModelUrl);
                    });
                    setModels(customizable);
                }
            } catch (err) {
                console.error("Error fetching customizable models:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchModels();
    }, []);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white gap-6">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">Initializing Design Matrix...</p>
            </div>
        );
    }

    return (
        <div className="bg-[#FBFCFE] min-h-screen font-sans selection:bg-indigo-600 selection:text-white">
            
            {/* 1. STUDIO HERO HEADER */}
            <div className="relative bg-slate-900 pt-32 pb-48 px-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px]"></div>
                
                {/* Decorative Grid */}
                <div className="absolute inset-0 opacity-10 [mask-image:linear-gradient(to_bottom,black,transparent)] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <button onClick={() => navigate('/')} className="group flex items-center gap-4 text-white/40 hover:text-indigo-400 transition-all mb-16 active:scale-95">
                         <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all shadow-xl shadow-indigo-500/0 group-hover:shadow-indigo-500/20">
                            <FiChevronLeft size={20} />
                         </div>
                         <div className="flex flex-col">
                             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Exit Protocol</span>
                             <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Return to Creative Hub</span>
                         </div>
                    </button>
                    
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-16">
                        <div className="space-y-8 max-w-3xl">
                            <div className="flex items-center gap-4">
                                <div className="h-px w-10 bg-indigo-500"></div>
                                <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em]">SYSTEM : ASSET_SELECT_V2.0</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-[0.85]">
                                Select Your <br/><span className="text-indigo-400">Blank Matrix</span>
                            </h1>
                            <p className="text-xl text-slate-400 font-bold max-w-xl leading-relaxed">
                                Initialize your creative sequence by selecting a professional-grade base model. Optimized for neural 3D mapping and precision manufacturing.
                            </p>
                        </div>
                        
                        <div className="hidden xl:block">
                            <div className="w-64 h-64 rounded-[64px] border-[2px] border-dashed border-white/5 flex flex-col items-center justify-center gap-6 text-white/20 relative group">
                                <div className="absolute inset-0 bg-indigo-600/5 rounded-[64px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <FiMaximize size={56} className="relative z-10 group-hover:text-indigo-400 transition-colors animate-pulse-slow" />
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] relative z-10">Ready for Injection</span>
                                
                                {/* Orbit rings Effect */}
                                <div className="absolute w-full h-full border border-indigo-600/10 rounded-full animate-spin-slow pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. THE CATALOG MATRIX */}
            <div className="max-w-7xl mx-auto px-6 -mt-24 pb-48">
                {models.length === 0 ? (
                    <div className="bg-white rounded-[60px] p-32 text-center shadow-2xl shadow-slate-200 border border-slate-50 flex flex-col items-center gap-8 group">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-700">
                            <FiBox size={48} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Archives Syncing...</h3>
                            <p className="text-[10px] text-slate-400 font-black max-w-xs mx-auto uppercase tracking-[0.2em]">No operational canvases identified in the current global inventory sector.</p>
                        </div>
                        <button onClick={() => navigate('/')} className="px-12 py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">Restart Protocol</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                        {models.map((model) => {
                            const imageUrl = (model.galleryImages && model.galleryImages.length > 0) ? model.galleryImages[0] : (model.images && model.images.length > 0 ? model.images[0] : '');
                            return (
                                <div key={model._id} className="group flex flex-col bg-white rounded-[56px] overflow-hidden transition-all duration-700 hover:-translate-y-4 shadow-2xl shadow-slate-200/50 hover:shadow-indigo-200/40 border border-slate-50">
                                    <div className="relative aspect-[3/4.5] bg-[#F8FAFC] overflow-hidden flex items-center justify-center p-10 group-hover:bg-white transition-colors duration-700">
                                        
                                        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors duration-700"></div>
                                        
                                        <img 
                                            src={imageUrl} 
                                            alt={model.name} 
                                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]" 
                                        />
                                        
                                        {/* Status Tags Overlay */}
                                        <div className="absolute top-8 left-8 flex flex-col gap-2 z-20">
                                            {model.customizationType === '3D' && (
                                                <div className="px-4 py-2 bg-slate-900 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl flex items-center gap-2 border border-white/10">
                                                    <FiHexagon className="text-indigo-400" /> DUAL-MESH 3D
                                                </div>
                                            )}
                                            <div className="px-4 py-2 bg-white text-slate-900 text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-slate-100 shadow-lg flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> READY_STOCK
                                            </div>
                                        </div>

                                        {/* Cinematic Selection Overlay */}
                                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[6px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-10 text-center gap-8">
                                            <div className="w-20 h-20 bg-white/10 rounded-full border border-white/20 flex items-center justify-center scale-50 group-hover:scale-100 transition-transform duration-700 backdrop-blur-md">
                                                <FiEdit3 size={32} className="text-white" />
                                            </div>
                                            <div className="space-y-3 translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Operational Asset</p>
                                                <h4 className="text-3xl font-black text-white tracking-tighter uppercase leading-none px-4 drop-shadow-xl">{model.name}</h4>
                                            </div>
                                            <button 
                                                onClick={() => navigate(`/customize/${model._id}`)}
                                                className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 hover:text-white transition-all scale-90 group-hover:scale-100"
                                            >
                                                Initialize Capture
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-10 space-y-8 bg-white flex-grow flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.4em]">{model.category}</p>
                                                <div className="flex gap-1.5 opacity-20">
                                                    {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-900" />)}
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-indigo-600 transition-all leading-none">{model.name}</h3>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed line-clamp-2">{model.description || 'A precision-engineered blank canvas optimized for commercial design injection and neural output.'}</p>
                                        </div>
                                        
                                        <button 
                                            onClick={() => navigate(`/customize/${model._id}`)}
                                            className="group/btn w-full py-6 bg-slate-50 text-slate-900 rounded-[28px] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-900 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-4 border border-slate-100 hover:border-slate-900 shadow-sm"
                                        >
                                            Start Design Session <FiArrowRight className="transition-transform group-hover/btn:translate-x-1" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 3. TECHNOLOGY SPECS PANEL */}
            <div className="max-w-7xl mx-auto px-6 pb-48">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 bg-slate-900 rounded-[80px] p-16 md:p-24 shadow-2xl shadow-indigo-900/20 relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="flex flex-col gap-8 group cursor-default">
                        <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 w-fit text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all duration-500 backdrop-blur-xl">
                            <FiCpu size={32} />
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xl font-black text-white uppercase tracking-tight">Neural Core</h4>
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Our proprietary backend manages design simulations with sub-second latency and zero fidelity loss.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8 group cursor-default">
                        <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 w-fit text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all duration-500 backdrop-blur-xl">
                            <FiLayers size={32} />
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xl font-black text-white uppercase tracking-tight">High-Res Export</h4>
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Assets are finalized with 300+ DPI precision, optimized for large-format commercial production.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8 group cursor-default">
                        <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 w-fit text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all duration-500 backdrop-blur-xl">
                            <FiEdit3 size={32} />
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xl font-black text-white uppercase tracking-tight">Logic Sync</h4>
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Precision 2D-to-3D coordinate mapping ensures that what you see is exactly what will be manufactured.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomCatalog;


