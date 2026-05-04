import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Grid3X3, RotateCcw, Smartphone, ArrowRight, ShoppingBag, Check
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
const StudioOverlay = React.lazy(() => import('../components/StudioOverlay'));
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
        const fetched = productsRes.data.products || productsRes.data.data || [];
        setProducts(fetched);

        if (fetched.length > 0) {
          const highest = Math.max(...fetched.map(p => p.discountPrice || p.basePrice || 0), 100);
          setMaxPriceLimit(highest);
          setPriceRange(prev => [prev[0], prev[1] === 10000 && !isSilent ? highest : prev[1]]);
        }

        if (!categoriesRes.data.success || !categoriesRes.data.data?.length) {
          const unique = [...new Set(fetched.map(p => p.category).filter(Boolean))];
          setCategories([{ name: 'All', _id: 'all' }, ...unique.map(c => ({ name: c, _id: c }))]);
        }
      }

      if (pulseRes.data.success) setBanners(pulseRes.data.data.banners || []);

      if (categoriesRes.data.success && categoriesRes.data.data?.length > 0) {
        setCategories([{ name: 'All', _id: 'all' }, ...categoriesRes.data.data]);
      }
    } catch (err) {
      console.error('Shop fetch error:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 60000);
    setWishlist(JSON.parse(localStorage.getItem('wishlist') || '[]'));
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setCurrentBanner(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners]);

  const toggleWishlist = async (id) => {
    const next = wishlist.includes(id) ? wishlist.filter(i => i !== id) : [...wishlist, id];
    setWishlist(next);
    localStorage.setItem('wishlist', JSON.stringify(next));
    if (currentUser && userData?.phone) {
      try {
        const token = await currentUser.getIdToken(true);
        await axios.post(`${import.meta.env.VITE_API_BASE_URL || ''}/api/public/user/wishlist/toggle`,
          { phone: userData.phone, productId: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) { console.error('Wishlist sync failed:', e); }
    }
  };

  const requireLogin = (callback, action = 'order and customize') => {
    if (!currentUser) {
      toast.error(`Please login to ${action}.`, {
        style: { borderRadius: '12px', background: '#1e293b', color: '#f8fafc', fontSize: '13px' }
      });
      setIsLoginModalOpen(true);
    } else {
      callback();
    }
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    const matchCat = activeCategory === 'All' || p.category?.toLowerCase() === activeCategory.toLowerCase();
    const effectivePrice = p.discountPrice || p.basePrice || 0;
    const matchPrice = effectivePrice >= priceRange[0] && effectivePrice <= priceRange[1];
    return matchSearch && matchCat && matchPrice;
  }).sort((a, b) => {
    if (sortBy === 'Price: Low to High') return (a.discountPrice || a.basePrice) - (b.discountPrice || b.basePrice);
    if (sortBy === 'Price: High to Low') return (b.discountPrice || b.basePrice) - (a.discountPrice || a.basePrice);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading products…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">

      {/* ── HERO BANNER ── */}
      {banners.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <section className="relative w-full h-[120px] md:h-[180px] overflow-hidden rounded-2xl shadow-md group">
            <div
              className="flex h-full w-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentBanner * 100}%)` }}
            >
              {banners.map((b) => (
                <div key={b._id} className="relative w-full h-full flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-transparent z-10" />
                  <img src={b.imageUrl} alt="Offer banner" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {banners.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentBanner(p => (p - 1 + banners.length) % banners.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-white/50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentBanner(p => (p + 1) % banners.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-white/50"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => setCurrentBanner(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentBanner ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* ── FILTER / SEARCH BAR ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="sticky top-16 md:top-[70px] z-50 bg-slate-50/90 backdrop-blur-sm pt-2 pb-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm">

            {/* Search */}
            <div className="relative flex-shrink-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="h-9 w-36 md:w-48 bg-slate-50 border border-slate-100 rounded-xl pl-8 pr-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
              />
            </div>

            <div className="w-px h-6 bg-slate-200 flex-shrink-0" />

            {/* Category Pills */}
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {categories.map(cat => {
                const name = typeof cat === 'string' ? cat : cat.name;
                return (
                  <button
                    key={name}
                    onClick={() => setActiveCategory(name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                      activeCategory === name
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            <div className="w-px h-6 bg-slate-200 flex-shrink-0" />

            {/* Filter button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 h-9 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all text-xs font-semibold"
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* ── PAGE HEADER ROW ── */}
        <div className="flex items-center justify-between mt-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Collections</h1>
            <p className="text-sm text-slate-400 mt-0.5">{filteredProducts.length} products</p>
          </div>
          <button
            onClick={() => navigate('/custom-mobile-cases')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-sm font-semibold"
          >
            <Smartphone size={15} />
            <span className="hidden sm:inline">Design Your Case</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* ── PRODUCT GRID ── */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm gap-5">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border-4 border-white shadow">
              <ShoppingBag size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-800">No products found</h3>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters.</p>
            </div>
            <button
              onClick={() => { setActiveCategory('All'); setSearchQuery(''); setPriceRange([0, maxPriceLimit]); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-semibold text-sm hover:bg-indigo-600 hover:text-white transition-all"
            >
              <RotateCcw size={14} /> Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
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
      </div>

      {/* ── FILTER DRAWER ── */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]"
          onClick={() => setIsFilterOpen(false)}
        />
      )}

      <aside className={`fixed top-0 right-0 w-full sm:w-[380px] h-full bg-white z-[110] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Filters</h3>
            <p className="text-xs text-slate-400 mt-0.5">Narrow down your results</p>
          </div>
          <button onClick={() => setIsFilterOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Price Range */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-800">Price Range</p>
              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                Up to ₹{priceRange[1].toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range" min={0} max={maxPriceLimit} value={priceRange[1]}
              onChange={e => setPriceRange([0, Number(e.target.value)])}
              className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
              <span>₹0</span>
              <span>₹{maxPriceLimit.toLocaleString('en-IN')}+</span>
            </div>
          </div>

          {/* Sort */}
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-4">Sort By</p>
            <div className="space-y-2">
              {['Newest', 'Price: Low to High', 'Price: High to Low'].map(opt => (
                <button
                  key={opt}
                  onClick={() => { setSortBy(opt); setIsFilterOpen(false); }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                    sortBy === opt
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  {opt}
                  {sortBy === opt && <Check size={16} className="text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-100 flex flex-col gap-3">
          <button
            onClick={() => setIsFilterOpen(false)}
            className="w-full py-3.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
          >
            Apply Filters
          </button>
          <button
            onClick={() => { setActiveCategory('All'); setSearchQuery(''); setPriceRange([0, maxPriceLimit]); setSortBy('Newest'); setIsFilterOpen(false); }}
            className="w-full py-3.5 flex items-center justify-center gap-2 bg-white text-rose-500 border-2 border-slate-100 font-semibold text-sm rounded-xl hover:border-rose-200 hover:bg-rose-50 transition-all"
          >
            <RotateCcw size={14} /> Reset All
          </button>
        </div>
      </aside>

      <React.Suspense fallback={null}>
        <StudioOverlay isOpen={!!customizingProduct} onClose={() => setCustomizingProduct(null)} product={customizingProduct} requireLogin={requireLogin} />
      </React.Suspense>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={() => setIsLoginModalOpen(false)} />
    </div>
  );
};

export default Shop;
