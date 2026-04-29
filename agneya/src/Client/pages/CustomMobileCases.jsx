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
                    
                    {/* Left: Brand Selection Sidebar (Horizontal Scroll on Mobile) */}
                    <div className="w-full lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-3xl lg:rounded-[2rem] p-4 lg:p-6 shadow-xl shadow-gray-200/50 border border-gray-100 sticky top-24">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 lg:mb-6 flex items-center gap-2">
                                <FiGrid size={12}/> Brands
                            </h3>
                            <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar gap-2 lg:gap-2 pb-2 lg:pb-0">
                                <button
                                    onClick={() => setSelectedBrand(null)}
                                    className={`whitespace-nowrap flex-shrink-0 lg:w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all ${!selectedBrand ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">All Devices</span>
                                </button>
                                
                                {phoneBrands.map(brand => (
                                    <button
                                        key={brand.id}
                                        onClick={() => setSelectedBrand(brand.id)}
                                        className={`whitespace-nowrap flex-shrink-0 lg:w-full flex items-center justify-center lg:justify-start px-5 py-3 rounded-2xl transition-all border ${selectedBrand === brand.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-indigo-200'}`}
                                        style={selectedBrand === brand.id ? { backgroundColor: brand.theme, borderColor: brand.theme } : {}}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest">{brand.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Models Grid */}
                    <div className="flex-1">
                        <div className="mb-6">
                            <div className="relative group">
                                <input 
                                    type="text"
                                    placeholder="Search for your model..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-16 bg-white border-2 border-slate-100 rounded-3xl px-8 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none shadow-sm"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                                    <FiSmartphone size={20}/>
                                </div>
                            </div>
                        </div>

                        {filteredModels.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                                <FiSmartphone size={48} className="mx-auto text-slate-200 mb-6 animate-pulse" />
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">No matching devices</h4>
                                <p className="text-[9px] text-slate-300 mt-2 font-bold uppercase tracking-widest">Try a different name or brand</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                                {filteredModels.map(model => (
                                    <div 
                                        key={model.id} 
                                        className="bg-white rounded-3xl p-5 lg:p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all group flex flex-col justify-center items-center cursor-pointer relative overflow-hidden min-h-[140px]" 
                                        onClick={() => handleCustomize(model)}
                                    >
                                        <div className="absolute top-4 right-4 text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            DESIGN
                                        </div>
                                        
                                        <div className="text-center w-full mt-2">
                                            <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 leading-tight mb-3 group-hover:text-indigo-600 transition-colors break-words">
                                                {model.name}
                                            </h4>
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">SOFT CASE</span>
                                                <p className="text-[11px] font-black text-indigo-600">₹{model.price}</p>
                                            </div>
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
