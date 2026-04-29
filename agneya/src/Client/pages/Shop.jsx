import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FiSearch, 
  FiShoppingBag, 
  FiX,
  FiSliders,
  FiGrid,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiRotateCcw,
  FiSmartphone
} from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import StudioOverlay from '../components/StudioOverlay';
import toast from 'react-hot-toast';

const Shop = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { currentUser, userData } = useAuth();
    
    const [products, setProducts] = useState([]);
    const [banners, setBanners] = useState([]);

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
    const [sortBy, setSortBy] = useState('Newest');

    const fetchData = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const [productsRes, pulseRes, categoriesRes] = await Promise.all([
                axios.get('/api/public/products'),
                axios.get('/api/public/pulse'),
                axios.get('/api/public/categories')
            ]);

            if (productsRes.data.success) {
                setProducts(productsRes.data.products || productsRes.data.data || []);
            } else if (Array.isArray(productsRes.data)) {
                setProducts(productsRes.data);
            } else if (productsRes.data.products) {
                setProducts(productsRes.data.products);
            }
            if (pulseRes.data.success) {
                setBanners(pulseRes.data.data.banners || []);
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
            setCurrentBanner((prev) => (prev + 1) % banners.length);
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
        if (sortBy === 'Newest') return new Date(b.createdAt) - new Date(a.createdAt);
        return 0;
    });

    if (loading) {
        return (
            <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#FBFCFE] gap-6">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                    <div className="absolute inset-3 rounded-full border-4 border-indigo-100 border-b-indigo-400 animate-spin-reverse"></div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 animate-pulse">Loading Storefront</p>
            </div>
        );
    }

    return (
        <div className="bg-[#FBFCFE] min-h-screen font-sans selection:bg-indigo-600 selection:text-white pb-24 text-slate-950">
            
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-8 relative z-10">
                
                {/* HERO BANNER SECTION */}
                <section className="relative w-full h-[200px] md:h-[320px] flex-shrink-0 group overflow-hidden rounded-[32px] shadow-2xl shadow-indigo-900/5">
                    <div className="absolute inset-0 bg-slate-900 rounded-[32px]"></div>
                    <div 
                        className="flex h-full w-full items-center transition-transform duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                        style={{ transform: `translateX(-${currentBanner * 100}%)` }}
                    >
                        {banners.length > 0 ? (
                            banners.map((banner, idx) => (
                                <div key={banner._id} className="w-full h-full flex-shrink-0 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/20 to-transparent z-10 pointer-events-none"></div>
                                    <img src={banner.imageUrl} alt="Offer" className="w-full h-full object-cover" />
                                </div>
                            ))
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900 text-white relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent blur-3xl"></div>
                                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter z-10">Explore Our Catalog</h2>
                            </div>
                        )}
                    </div>

                    {/* Nav Arrows */}
                    {banners.length > 1 && (
                        <>
                            <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 hover:scale-110 z-20"><FiChevronLeft size={24} /></button>
                            <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 hover:scale-110 z-20"><FiChevronRight size={24} /></button>

                            {/* Dots */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                {banners.map((_, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setCurrentBanner(idx)}
                                        className={`h-2 rounded-full transition-all duration-500 ${idx === currentBanner ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </section>

                {/* PROMINENT MOBILE COVER CTA */}
                <div className="w-full py-4 px-6 md:py-6 md:px-10 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[32px] shadow-xl shadow-indigo-600/20 flex flex-col md:flex-row items-center justify-between gap-6 transform transition-transform hover:-translate-y-1">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/30 shadow-inner">
                            <FiSmartphone size={32} />
                        </div>
                        <div className="text-white space-y-1">
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Design Custom Mobile Cases</h2>
                            <p className="text-[11px] md:text-[13px] font-bold text-indigo-100 tracking-widest uppercase">Over 300+ models supported</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/custom-mobile-cases')} 
                        className="w-full md:w-auto px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:shadow-2xl hover:bg-indigo-50 transition-all active:scale-95"
                    >
                        Customize Now
                    </button>
                </div>

                {/* FILTER CONTROLS */}
                <div className="sticky top-24 z-[60] flex flex-col gap-4 pointer-events-none mt-4">
                    <div className="w-full bg-white/70 backdrop-blur-xl shadow-xl shadow-slate-200/40 rounded-[24px] border border-white p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto">
                        
                        {/* Search Input */}
                        <div className="relative w-full md:flex-1 group">
                            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-14 pr-6 text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>

                        {/* Master Filter Button */}
                        <button 
                            onClick={() => setIsFilterOpen(true)}
                            className="w-full md:w-auto flex-shrink-0 flex items-center justify-center gap-3 px-8 h-14 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-indigo-600 transition-all hover:-translate-y-1 active:scale-95"
                        >
                            <FiSliders size={18}/>
                            <span className="text-[11px] font-black uppercase tracking-widest">Filters</span>
                        </button>
                    </div>

                    {/* Category Carousel */}
                    <div className="w-full bg-white/60 backdrop-blur-xl rounded-[24px] border border-white px-4 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar pointer-events-auto shadow-sm">
                        {categories.map((cat) => {
                            const catName = typeof cat === 'string' ? cat : cat.name;
                            const isActive = activeCategory === catName;
                            return (
                                <button
                                    key={catName}
                                    onClick={() => setActiveCategory(catName)}
                                    className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all flex-shrink-0 border-2 ${isActive ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'}`}
                                >
                                    {catName}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* PRODUCT GRID HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-[16px] flex items-center justify-center text-indigo-600 shadow-inner">
                            <FiGrid size={24}/>
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Collections</h3>
                            <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-[0.2em] mt-1">{filteredProducts.length} Items Available</p>
                        </div>
                    </div>
                </div>

                {/* PRODUCT GRID */}
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[32px] border border-slate-100 shadow-sm gap-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border-8 border-white shadow-xl">
                            <FiShoppingBag size={32} />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">No Products Found</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adjust your filters to discover more.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                        {filteredProducts.map(product => (
                            <ProductCard 
                                key={product._id} 
                                product={product} 
                                wishlist={wishlist} 
                                toggleWishlist={toggleWishlist} 
                                addToCart={addToCart} 
                                onCustomize={(p) => requireLogin(() => setCustomizingProduct(p))} 
                                requireLogin={requireLogin} 
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* FILTER DRAWER */}
            {isFilterOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] transition-opacity animate-in fade-in duration-300" 
                    onClick={() => setIsFilterOpen(false)} 
                />
            )}
            
            <aside className={`fixed top-0 right-0 w-full sm:w-[420px] h-full bg-white z-[110] shadow-2xl transition-transform duration-500 ease-out ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                <div className="p-8 flex flex-col h-full overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Filters</h3>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Refine your search</p>
                        </div>
                        <button onClick={() => setIsFilterOpen(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-colors text-slate-500">
                            <FiX size={24} />
                        </button>
                    </div>

                    <div className="space-y-12 flex-1">
                        {/* Price Filter */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">Price Range</p>
                                <span className="text-[12px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl">Up to ₹{priceRange[1].toLocaleString()}</span>
                            </div>
                            <input type="range" min="0" max="10000" value={priceRange[1]} onChange={(e) => setPriceRange([0, e.target.value])} className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600" />
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>₹0</span>
                                <span>₹10,000+</span>
                            </div>
                        </div>

                        {/* Sort Filter */}
                        <div className="space-y-4">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-4">Sort By</p>
                            <div className="grid gap-3">
                                {['Newest', 'Price: Low to High', 'Price: High to Low'].map((option) => {
                                    const isActive = sortBy === option;
                                    return (
                                        <button 
                                            key={option}
                                            onClick={() => { setSortBy(option); setIsFilterOpen(false); }}
                                            className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 ${isActive ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-600 hover:text-indigo-600'}`}
                                        >
                                            <span className="text-[11px] font-black uppercase tracking-widest">{option}</span>
                                            {isActive && <FiCheck className="w-5 h-5 text-emerald-400" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 pt-8 border-t border-slate-100">
                        <button onClick={() => setIsFilterOpen(false)} className="w-full py-5 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                            Apply Filters
                        </button>
                        <button onClick={() => { setActiveCategory('All'); setSearchQuery(''); setPriceRange([0, 10000]); setSortBy('Newest'); setIsFilterOpen(false); }} className="w-full py-5 flex items-center justify-center gap-2 bg-white text-rose-500 border-2 border-slate-100 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-95">
                            <FiRotateCcw size={16} /> Reset All
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
