import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
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
  FiSmartphone,
  FiArrowRight
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
    const [searchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || 'All';
    
    const [products, setProducts] = useState([]);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [categories, setCategories] = useState(['All']);
    const [currentBanner, setCurrentBanner] = useState(0);
    
    const [maxPriceLimit, setMaxPriceLimit] = useState(10000);
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
                const fetchedProducts = productsRes.data.products || productsRes.data.data || [];
                setProducts(fetchedProducts);
                
                if (fetchedProducts.length > 0) {
                    const highestPrice = Math.max(...fetchedProducts.map(p => p.discountPrice || p.basePrice || 0), 100);
                    setMaxPriceLimit(highestPrice);
                    setPriceRange(prev => [prev[0], prev[1] === 10000 && !isSilent ? highestPrice : prev[1]]);
                }
                
                if (!categoriesRes.data.success || !categoriesRes.data.data || categoriesRes.data.data.length === 0) {
                    const productCats = fetchedProducts.map(p => p.category).filter(Boolean);
                    const uniqueCats = [...new Set(productCats)];
                    const allCat = { name: 'All', imageUrl: '', _id: 'all' };
                    setCategories([allCat, ...uniqueCats.map(c => ({ name: c, _id: c }))]);
                }
            }

            if (pulseRes.data.success) {
                setBanners(pulseRes.data.data.banners || []);
            }
            if (categoriesRes.data.success && categoriesRes.data.data?.length > 0) {
                const dbCats = categoriesRes.data.data;
                const allCat = { name: 'All', imageUrl: '', _id: 'all' };
                setCategories([allCat, ...dbCats]);
            }
        } catch (err) {
            console.error('Failed to sync storefront data:', err);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    useEffect(() => {
        const catFromUrl = searchParams.get('category');
        if (catFromUrl) setActiveCategory(catFromUrl);
    }, [searchParams]);

    useEffect(() => {
        fetchData(); 
        const pollInterval = setInterval(() => fetchData(true), 60000);
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
                }, { headers: { Authorization: `Bearer ${token}` } });
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
                    borderRadius: '16px', background: '#0f172a', color: '#f8fafc',
                    fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px'
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
        const matchesCategory = activeCategory === 'All' || 
                               (p.category && p.category.toLowerCase() === activeCategory.toLowerCase());
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
            
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col gap-3 relative z-10">
                
                {/* ── SLIM BANNER ── */}
                {banners.length > 0 && (
                    <section className="relative w-full h-[110px] md:h-[160px] flex-shrink-0 group overflow-hidden rounded-[20px] md:rounded-[28px] shadow-lg shadow-indigo-900/5">
                        <div className="absolute inset-0 bg-slate-900 rounded-[28px]"></div>
                        <div 
                            className="flex h-full w-full items-center transition-transform duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                            style={{ transform: `translateX(-${currentBanner * 100}%)` }}
                        >
                            {banners.map((banner) => (
                                <div key={banner._id} className="w-full h-full flex-shrink-0 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/20 to-transparent z-10 pointer-events-none"></div>
                                    <img src={banner.imageUrl} alt="Offer" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        {banners.length > 1 && (
                            <>
                                <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 z-20"><FiChevronLeft size={18} /></button>
                                <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 z-20"><FiChevronRight size={18} /></button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                                    {banners.map((_, idx) => (
                                        <button key={idx} onClick={() => setCurrentBanner(idx)}
                                            className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentBanner ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                )}

                {/* ── COMBINED STICKY CONTROL BAR: Search + Categories + Filters in ONE row ── */}
                <div className="sticky top-20 z-[60] pointer-events-none">
                    <div className="w-full bg-white/85 backdrop-blur-2xl shadow-lg shadow-slate-200/40 rounded-[20px] border border-white/80 px-3 py-2 flex items-center gap-2 pointer-events-auto">
                        
                        {/* Search Input — compact */}
                        <div className="relative flex-shrink-0 w-40 md:w-52 group">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full h-9 bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                            />
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 bg-slate-200 flex-shrink-0"></div>

                        {/* Category Pills — scrollable, fills remaining space */}
                        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            {categories.map((cat) => {
                                const catName = typeof cat === 'string' ? cat : cat.name;
                                const isActive = activeCategory === catName;
                                return (
                                    <button
                                        key={catName}
                                        onClick={() => setActiveCategory(catName)}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${
                                            isActive 
                                            ? 'bg-slate-900 text-white shadow-sm' 
                                            : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
                                        }`}
                                    >
                                        {catName}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 bg-slate-200 flex-shrink-0"></div>

                        {/* Filter Button — compact icon+text */}
                        <button 
                            onClick={() => setIsFilterOpen(true)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-4 h-9 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all active:scale-95"
                        >
                            <FiSliders size={14}/>
                            <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Filters</span>
                        </button>
                    </div>
                </div>

                {/* ── PRODUCT GRID HEADER ── */}
                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <FiGrid size={16}/>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Collections</h2>
                            <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{filteredProducts.length} Items</p>
                        </div>
                    </div>

                    {/* Compact Mobile Case CTA — replaces the giant 280px banner */}
                    <button
                        onClick={() => navigate('/custom-mobile-cases')}
                        className="group flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-600/20 active:scale-95"
                    >
                        <FiSmartphone size={14} className="group-hover:-rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Design Your Case</span>
                        <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {/* ── PRODUCT GRID ── */}
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[28px] border border-slate-100 shadow-sm gap-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border-8 border-white shadow-xl">
                            <FiShoppingBag size={28} />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">No Products Found</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adjust your filters to discover more.</p>
                        </div>
                        <button
                            onClick={() => { setActiveCategory('All'); setSearchQuery(''); setPriceRange([0, maxPriceLimit]); }}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                        >
                            <FiRotateCcw size={14} /> Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
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

            {/* ── FILTER DRAWER ── */}
            {isFilterOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] transition-opacity animate-in fade-in duration-300" 
                    onClick={() => setIsFilterOpen(false)} 
                />
            )}
            
            <aside className={`fixed top-0 right-0 w-full sm:w-[400px] h-full bg-white z-[110] shadow-2xl transition-transform duration-500 ease-out ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                <div className="p-8 flex flex-col h-full overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Filters</h3>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Refine your search</p>
                        </div>
                        <button onClick={() => setIsFilterOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-colors text-slate-500">
                            <FiX size={20} />
                        </button>
                    </div>

                    <div className="space-y-10 flex-1">
                        {/* Price Filter */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">Price Range</p>
                                <span className="text-[12px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl">Up to ₹{priceRange[1].toLocaleString()}</span>
                            </div>
                            <input 
                                type="range" min="0" max={maxPriceLimit} value={priceRange[1]} 
                                onChange={(e) => setPriceRange([0, Number(e.target.value)])} 
                                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600" 
                            />
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>₹0</span>
                                <span>₹{maxPriceLimit.toLocaleString()}+</span>
                            </div>
                        </div>

                        {/* Sort Filter */}
                        <div className="space-y-4">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">Sort By</p>
                            <div className="grid gap-3">
                                {['Newest', 'Price: Low to High', 'Price: High to Low'].map((option) => {
                                    const isActive = sortBy === option;
                                    return (
                                        <button 
                                            key={option}
                                            onClick={() => { setSortBy(option); setIsFilterOpen(false); }}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${
                                                isActive 
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-600 hover:text-indigo-600'
                                            }`}
                                        >
                                            <span className="text-[11px] font-black uppercase tracking-widest">{option}</span>
                                            {isActive && <FiCheck className="w-4 h-4 text-emerald-400" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 pt-8 border-t border-slate-100">
                        <button 
                            onClick={() => setIsFilterOpen(false)} 
                            className="w-full py-4 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                        >
                            Apply Filters
                        </button>
                        <button 
                            onClick={() => { setActiveCategory('All'); setSearchQuery(''); setPriceRange([0, maxPriceLimit]); setSortBy('Newest'); setIsFilterOpen(false); }} 
                            className="w-full py-4 flex items-center justify-center gap-2 bg-white text-rose-500 border-2 border-slate-100 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-95"
                        >
                            <FiRotateCcw size={14} /> Reset All
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── OVERLAYS ── */}
            <StudioOverlay isOpen={!!customizingProduct} onClose={() => setCustomizingProduct(null)} product={customizingProduct} requireLogin={requireLogin} />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={() => setIsLoginModalOpen(false)} />
        </div>
    );
};

export default Shop;
