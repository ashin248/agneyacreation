import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { phoneBrands, phoneModels } from '../data/MobileCasesDB';
import { FiSmartphone, FiChevronRight, FiGrid, FiArrowLeft } from 'react-icons/fi';
import SEO from '../components/SEO/SEO';
import LoginModal from '../components/LoginModal';
import StudioOverlay from '../components/StudioOverlay';
import { useAuth } from '../context/AuthContext';

const CustomMobileCases = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [customizingProduct, setCustomizingProduct] = useState(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const requireLogin = (callback) => {
        if (!currentUser) {
            setIsLoginModalOpen(true);
        } else {
            callback();
        }
    };

    // Filter models
    const filteredModels = phoneModels.filter(model => {
        const matchesBrand = selectedBrand ? model.brand === selectedBrand : true;
        const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesBrand && matchesSearch;
    });

    // Handle starting customization
    const handleCustomize = (model) => {
        requireLogin(() => {
            // We create a pseudo-product combining the base mobile case info with this specific model
            const pseudoProduct = {
                _id: `custom-case-${model.id}`,
                name: `Custom Mobile Case - ${model.name}`,
                category: 'Mobile Covers',
                basePrice: model.price,
                customizationType: '2D',
                isCustomizable: true,
                description: `Design your own premium mobile cover for ${model.name}.`,
                phoneMask: model // We pass the mask logic directly
            };
            setCustomizingProduct(pseudoProduct);
        });
    };

    return (
        <div className="bg-[#FBFCFE] min-h-screen pb-32 font-sans selection:bg-indigo-600 selection:text-white">
            <SEO 
                title="Custom Mobile Cases | Agneya Design"
                description="Design your own custom mobile cover. Select your brand and model to start printing."
                type="product"
            />
            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={() => setIsLoginModalOpen(false)} 
                onLoginSuccess={() => setIsLoginModalOpen(false)} 
            />

            <div className="max-w-7xl mx-auto px-6 pt-10">
                {/* Header */}
                <div className="mb-10">
                    <button 
                        onClick={() => navigate('/shop')} 
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-all mb-6"
                    >
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
                            <FiArrowLeft size={14} />
                        </div>
                        Back to Shop
                    </button>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-3">
                        Custom Mobile Cases
                    </h1>
                    <p className="text-sm text-gray-500 font-bold max-w-xl">
                        Select your device brand and model below to start designing. We use advanced vector masking to ensure your design perfectly fits your camera and edges.
                    </p>
                </div>

                {/* Main Layout */}
                <div className="flex flex-col lg:flex-row gap-10">
                    
                    {/* Left: Brand Selection Sidebar */}
                    <div className="w-full lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 sticky top-24">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                                <FiGrid size={14}/> Select Brand
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setSelectedBrand(null)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${!selectedBrand ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <span className="text-[11px] font-black uppercase tracking-widest">All Brands</span>
                                    {!selectedBrand && <FiChevronRight className="ml-auto" />}
                                </button>
                                
                                {phoneBrands.map(brand => (
                                    <button
                                        key={brand.id}
                                        onClick={() => setSelectedBrand(brand.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${selectedBrand === brand.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-indigo-200'}`}
                                    >
                                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1 border border-slate-100 overflow-hidden">
                                            <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest">{brand.name}</span>
                                        {selectedBrand === brand.id && <FiChevronRight className="ml-auto" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Models Grid */}
                    <div className="flex-1">
                        <div className="mb-6">
                            <input 
                                type="text"
                                placeholder="Search for your model (e.g. iPhone 15)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-14 bg-white border border-slate-200 rounded-[1.5rem] px-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none shadow-sm"
                            />
                        </div>

                        {filteredModels.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                                <FiSmartphone size={40} className="mx-auto text-slate-300 mb-4" />
                                <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-500">No Models Found</h4>
                                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Try adjusting your search or brand filter.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {filteredModels.map(model => (
                                    <div key={model.id} className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group flex flex-col cursor-pointer" onClick={() => handleCustomize(model)}>
                                        {/* Abstract UI representation of the phone mask */}
                                        <div className="w-full aspect-[1/2] bg-slate-50 rounded-2xl border-2 border-slate-100 mb-4 flex items-center justify-center overflow-hidden relative group-hover:scale-[1.02] transition-transform">
                                            {/* We draw a mini SVG preview of the mask */}
                                            <svg viewBox={`0 0 ${model.shape.width} ${model.shape.height}`} className="w-2/3 h-full object-contain text-slate-300 fill-current drop-shadow-sm">
                                                <rect x="0" y="0" width={model.shape.width} height={model.shape.height} rx={model.shape.rx} />
                                            </svg>
                                            {/* Camera representation */}
                                            {model.camera.type === 'rounded-rect' && (
                                                <div className="absolute bg-slate-200 rounded-[8px]" style={{
                                                    top: `${(model.camera.y / model.shape.height) * 100}%`,
                                                    left: `${(model.camera.x / model.shape.width) * 100}%`,
                                                    width: `${(model.camera.width / model.shape.width) * 100}%`,
                                                    height: `${(model.camera.height / model.shape.height) * 100}%`,
                                                    transform: 'translateX(2px) translateY(2px)' // Centering offset tweak
                                                }}></div>
                                            )}
                                            {model.camera.type === 'circle' && (
                                                <div className="absolute bg-slate-200 rounded-full" style={{
                                                    top: `${((model.camera.cy - model.camera.r) / model.shape.height) * 100}%`,
                                                    left: `${((model.camera.cx - model.camera.r) / model.shape.width) * 100}%`,
                                                    width: `${(model.camera.r * 2 / model.shape.width) * 100}%`,
                                                    height: `${(model.camera.r * 2 / model.shape.height) * 100}%`,
                                                }}></div>
                                            )}
                                            {model.camera.type === 'lenses' && model.camera.lenses.map((lens, i) => (
                                                <div key={i} className="absolute bg-slate-200 rounded-full" style={{
                                                    top: `${((lens.cy - lens.r) / model.shape.height) * 100}%`,
                                                    left: `${((lens.cx - lens.r) / model.shape.width) * 100}%`,
                                                    width: `${(lens.r * 2 / model.shape.width) * 100}%`,
                                                    height: `${(lens.r * 2 / model.shape.height) * 100}%`,
                                                }}></div>
                                            ))}
                                        </div>
                                        <div className="mt-auto">
                                            <h4 className="text-[11px] font-black uppercase tracking-tight text-slate-900 mb-1">{model.name}</h4>
                                            <p className="text-[10px] font-bold text-indigo-600">₹{model.price}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <StudioOverlay 
                isOpen={!!customizingProduct} 
                onClose={() => setCustomizingProduct(null)} 
                product={customizingProduct} 
                requireLogin={requireLogin}
                initialMode="self"
            />
        </div>
    );
};

export default CustomMobileCases;
