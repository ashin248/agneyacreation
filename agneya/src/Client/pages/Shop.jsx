import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FiSearch, 
  FiShoppingBag, 
  FiX,
  FiFilter,
  FiGrid,
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiGift,
  FiSliders,
  FiCheck,
  FiRotateCcw
} from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import StudioOverlay from '../components/StudioOverlay';
import toast from 'react-hot-toast';
import { MODELS } from '../components/Three/ProductLibrary';

const Shop = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { currentUser } = useAuth();
    
    const [products, setProducts] = useState([]);
    const [banners, setBanners] = useState([]);
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [categories, setCategories] = useState(['All']);
    const [currentBanner, setCurrentBanner] = useState(0);
    
    // UI States
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [wishlist, setWishlist] = useState([]);
    const [customizingProduct, setCustomizingProduct] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState('New_Deployments');

    const fetchData = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const [productsRes, pulseRes, categoriesRes] = await Promise.all([
                axios.get('/api/public/products'),
                axios.get('/api/public/pulse'),
                axios.get('/api/public/categories')
            ]);

            if (productsRes.data.success) {
                setProducts(productsRes.data.data);
            }
            if (pulseRes.data.success) {
                setBanners(pulseRes.data.data.banners || []);
                setOffers(pulseRes.data.data.offers || []);
            }
            if (categoriesRes.data.success) {
                const dbCats = categoriesRes.data.data;
                const allCat = { name: 'All', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3081/3081986.png', _id: 'all' };
                setCategories([allCat, ...dbCats]);
            }
        } catch (err) {
            console.error('Failed to sync storefront data:', err);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(); 
        
        const pollInterval = setInterval(() => {
            fetchData(true);
        }, 60000);

        const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlist(savedWishlist);

        return () => clearInterval(pollInterval);
    }, []);

    const toggleWishlist = async (id) => {
        const newWishlist = wishlist.includes(id) 
            ? wishlist.filter(item => item !== id)
            : [...wishlist, id];
        setWishlist(newWishlist);
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));

        if (currentUser && userData?.phone) {
            try {
                const token = await currentUser.getIdToken(true);
                await axios.post(`${import.meta.env.VITE_API_BASE_URL || '/api'}/public/user/wishlist/toggle`, {
                    phone: userData.phone,
                    productId: id
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.error("Failed to sync wishlist with DB:", error);
            }
        }
    };

    const requireLogin = (callback, actionName = "order and customize") => {
        if (!currentUser) {
            toast.error(`Please login to ${actionName}.`, {
                icon: '🔒',
                style: {
                    borderRadius: '16px',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                },
            });
            setIsLoginModalOpen(true);
        } else {
            callback();
        }
    };

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            // User requested sliding towards the right
            setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners]);

    const nextSlide = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
    const prevSlide = () => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
        const matchesPrice = (p.discountPrice || p.basePrice || 0) <= priceRange[1];
        return matchesSearch && matchesCategory && matchesPrice;
    }).sort((a, b) => {
        if (sortBy === 'Price: Low to High') return (a.discountPrice || a.basePrice) - (b.discountPrice || b.basePrice);
        if (sortBy === 'Price: High to Low') return (b.discountPrice || b.basePrice) - (a.discountPrice || a.basePrice);
        if (sortBy === 'New_Deployments') return new Date(b.createdAt) - new Date(a.createdAt);
        return 0;
    });

    if (loading) {
        return (
            <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#F8FAFC] gap-6">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Loading Storefront...</p>
            </div>
        );
    }

    return (
        <div className="bg-[#f8fafc] min-h-screen font-sans selection:bg-indigo-600 selection:text-white pb-24 md:pb-12 text-slate-950">
            
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6 md:gap-8 relative z-10">
                
                {/* 1. HERO BANNER - MYNTRA PEEK STYLE */}
                <section className="relative w-full h-[180px] md:h-[280px] flex-shrink-0 group overflow-hidden mt-2">
                    <div 
                        className="flex h-full w-full items-center transition-transform duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                        style={{ 
                            transform: banners.length > 1 ? `translateX(calc(-${currentBanner * 86}% + 7%))` : 'translateX(0)',
                        }}
                    >
                        {banners.length > 0 ? (
                            banners.map((banner, idx) => {
                                const isActive = currentBanner === idx;
                                return (
                                    <div 
                                        key={banner._id} 
                                        className="relative h-full flex-shrink-0 px-1.5 md:px-2.5 transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                                        style={{ 
                                            flex: banners.length > 1 ? '0 0 86%' : '0 0 100%',
                                            transform: isActive ? 'scale(1)' : 'scale(0.92)',
                                            opacity: isActive ? 1 : 0.8,
                                        }}
                                        onClick={() => setCurrentBanner(idx)}
                                    >
                                        <div className="w-full h-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-sm border border-slate-200/50 bg-white relative cursor-pointer group-hover:shadow-md transition-shadow">
                                            <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full h-full px-4 flex: 0 0 100%">
                                <div className="w-full h-full rounded-[2rem] bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                                     <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">System Ready</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Nav Arrows */}
                    {banners.length > 1 && (
                        <>
                            <button onClick={prevSlide} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white/95 backdrop-blur-md border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-10"><FiChevronLeft size={20} /></button>
                            <button onClick={nextSlide} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white/95 backdrop-blur-md border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-10"><FiChevronRight size={20} /></button>

                            {/* Dots */}
                            <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10 bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                                {banners.map((_, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setCurrentBanner(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentBanner ? 'w-6 md:w-8 bg-slate-950 shadow-sm' : 'w-1.5 md:w-2 bg-slate-950/20 hover:bg-slate-950/50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </section>

                {/* 2. STUDIO-OVERLAY STYLED FLOATING FILTER CONTROL PANEL */}
                <div className="sticky top-4 md:top-6 z-[60] flex flex-col gap-3 pointer-events-none">
                    <div className="w-full bg-white/80 backdrop-blur-3xl shadow-xl shadow-slate-200/50 rounded-[1.5rem] md:rounded-[2rem] border border-white/60 p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 transition-all pointer-events-auto">
                        
                        {/* Search Input - Studio Floating Style */}
                        <div className="relative w-full md:flex-1 group">
                            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search Resources..."
                                className="w-full h-12 md:h-14 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[1.25rem] md:rounded-[1.5rem] pl-14 pr-6 text-[11px] md:text-[12px] font-black text-slate-950 uppercase tracking-widest outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all placeholder:text-slate-400 shadow-inner"
                            />
                        </div>

                        {/* Master Filter Button */}
                        <button 
                            onClick={() => setIsFilterOpen(true)}
                            className="w-full md:w-auto flex-shrink-0 flex items-center justify-center gap-3 px-8 h-12 md:h-14 bg-slate-950 text-white rounded-[1.25rem] md:rounded-[1.5rem] shadow-lg hover:bg-indigo-600 transition-all hover:-translate-y-0.5 active:scale-95 border border-slate-800"
                        >
                            <FiSliders size={18}/>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Advanced Query</span>
                        </button>
                    </div>

                    {/* YouTube-Style Category Pill Bar */}
                    <div className="w-full bg-white/40 backdrop-blur-2xl rounded-[1.25rem] md:rounded-[1.5rem] border border-white/60 px-4 py-2 flex items-center gap-3 overflow-x-auto no-scrollbar pointer-events-auto shadow-sm">
                        <button 
                            onClick={() => setActiveCategory('All')}
                            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all flex-shrink-0 border ${activeCategory === 'All' ? 'bg-slate-950 text-white border-slate-950 shadow-md' : 'bg-white/80 text-slate-500 border-slate-200 hover:bg-white hover:text-slate-900 shadow-sm'}`}
                        >
                            Explore All
                        </button>
                        <div className="w-px h-4 bg-slate-200/60 flex-shrink-0"></div>
                        {categories.map((cat) => {
                            const catName = typeof cat === 'string' ? cat : cat.name;
                            if (catName === 'All') return null;
                            const isActive = activeCategory === catName;
                            return (
                                <button
                                    key={catName}
                                    onClick={() => setActiveCategory(catName)}
                                    className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all flex-shrink-0 border ${isActive ? 'bg-slate-950 text-white border-slate-950 shadow-md' : 'bg-white/80 text-slate-500 border-slate-200 hover:bg-white hover:text-slate-900 shadow-sm'}`}
                                >
                                    {catName}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* PRODUCT GRID HEADER - PREMIUM REFINEMENT */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-10 md:mt-12 mb-8 relative">
                    <div className="absolute left-[-2rem] top-1/2 -translate-y-1/2 w-1 h-12 bg-indigo-600 rounded-r-full hidden md:block"></div>
                    <div className="space-y-1 text-left md:pl-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
                                <FiGrid size={20}/>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black text-slate-950 uppercase tracking-tighter italic">Resource Catalog</h3>
                        </div>
                        <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-14">Optimized Deployment: {filteredProducts.length} Neural Nodes identified</p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-4">Active Protocol:</span>
                         <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">Live_Production</span>
                    </div>
                </div>

                {/* PRODUCT GRID */}
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 md:py-32 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm gap-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-300 border border-slate-100">
                            <FiShoppingBag size={32} />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.4em]">Grid Empty</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">System parameters returned zero matches.<br/>Adjust filters to bypass null output.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                        {filteredProducts.map(product => (
                            <ProductCard key={product._id} product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} onCustomize={(p) => requireLogin(() => setCustomizingProduct(p))} requireLogin={requireLogin} />
                        ))}
                    </div>
                )}
            </main>

            {/* HIGH-DEF FILTER OVERLAY */}
            {isFilterOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in duration-300" 
                    onClick={() => setIsFilterOpen(false)} 
                />
            )}
            
            {/* FILTER DRAWER CAREFULLY DETACHED - CLEANEST UI */}
            <aside className={`fixed top-0 right-0 w-[90%] sm:w-[400px] h-full bg-white z-[110] shadow-[-20px_0_50px_rgba(0,0,0,0.15)] transition-transform duration-500 cubic-bezier(0.2,0.8,0.2,1) transform ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                <div className="p-6 md:p-10 flex flex-col h-full overflow-y-auto no-scrollbar pb-24 md:pb-10">
                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                        <div className="space-y-1 text-left">
                            <div className="flex items-center gap-2 text-indigo-600">
                                <FiSliders className="w-4 h-4" />
                                <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter italic">Refinement</h3>
                            </div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Query Logic Control</p>
                        </div>
                        <button onClick={() => setIsFilterOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-rose-500 hover:border-rose-500 border border-slate-200 hover:text-white transition-all text-slate-500 active:scale-95 shadow-sm">
                            <FiX size={18} />
                        </button>
                    </div>

                    <div className="space-y-10 flex-1">
                        {/* Price Filter */}
                        <div className="space-y-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] p-6">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">Max Investment</p>
                                <span className="text-[12px] font-black text-indigo-600 tracking-tight px-3 py-1 bg-white rounded-md shadow-sm border border-slate-100">₹{priceRange[1].toLocaleString()}</span>
                            </div>
                            <div className="pt-2">
                                <input type="range" min="0" max="10000" value={priceRange[1]} onChange={(e) => setPriceRange([0, e.target.value])} className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600" />
                                <div className="flex justify-between mt-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <span>₹0 Base</span>
                                    <span>₹10K Limit</span>
                                </div>
                            </div>
                        </div>

                        {/* Sorting */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-950 ml-2">Sorting Protocol</p>
                            <div className="grid gap-3">
                                {['Popularity', 'New_Deployments', 'Price: Low to High', 'Price: High to Low'].map((option) => {
                                    const isActive = sortBy === option;
                                    return (
                                        <button 
                                            key={option}
                                            onClick={() => { setSortBy(option); setIsFilterOpen(false); }}
                                            className={`group flex items-center justify-between p-5 rounded-[1.25rem] border-2 transition-all ${isActive ? 'bg-slate-950 border-slate-950 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                                        >
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-white' : 'text-slate-950'}`}>{option.replace('_', ' ')}</span>
                                            {isActive ? <FiCheck className="w-4 h-4 text-emerald-400" /> : <div className="w-3 h-3 rounded-full border-2 border-slate-200 group-hover:border-slate-400 transition-colors"></div>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 pt-6">
                        <button onClick={() => setIsFilterOpen(false)} className="w-full py-5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.25rem] hover:bg-slate-950 transition-all shadow-xl hover:shadow-none active:scale-95">
                            Execute Query
                        </button>
                        <button onClick={() => { setActiveCategory('All'); setSearchQuery(''); setPriceRange([0, 10000]); setIsFilterOpen(false); }} className="w-full py-4 flex items-center justify-center gap-2 bg-slate-50 text-rose-500 border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.25rem] hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95">
                            <FiRotateCcw size={14} /> Clear Parameters
                        </button>
                    </div>
                </div>
            </aside>


            {/* OVERLAYS */}
            <StudioOverlay isOpen={!!customizingProduct} onClose={() => setCustomizingProduct(null)} product={customizingProduct} requireLogin={requireLogin} />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={() => setIsLoginModalOpen(false)} />
        </div>
    );
};

export default Shop;
