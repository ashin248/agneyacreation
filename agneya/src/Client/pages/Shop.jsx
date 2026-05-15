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
  const [minPriceLimit, setMinPriceLimit] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Newest');
  const [activeCollection, setActiveCollection] = useState(null);
  const [collectionsList, setCollectionsList] = useState([]);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchData = async (isSilent = false, pageNum = 1) => {
    try {
      if (!isSilent && pageNum === 1) setLoading(true);
      if (pageNum > 1) setLoadingMore(true);

      const [productsRes, pulseRes, categoriesRes, collectionsRes] = await Promise.all([
        axios.get(`/api/public/products?page=${pageNum}&limit=12`),
        axios.get('/api/public/pulse'),
        axios.get('/api/public/categories'),
        axios.get('/api/public/collections')
      ]);

      if (productsRes.data.success) {
        const fetched = productsRes.data.data || [];
        const pagination = productsRes.data.pagination || {};
        
        if (pageNum === 1) {
          setProducts(fetched);
        } else {
          setProducts(prev => [...prev, ...fetched]);
        }
        
        setHasMore(pagination.hasMore);

        if (fetched.length > 0 && pageNum === 1) {
          const validPrices = fetched.map(p => p.discountPrice || p.basePrice || 0).filter(p => p > 0);
          const highest = validPrices.length ? Math.max(...validPrices) : 10000;
          const lowest = validPrices.length ? Math.min(...validPrices) : 0;
          
          setMaxPriceLimit(highest);
          setMinPriceLimit(lowest);
          setPriceRange(prev => {
             if (prev[0] === 0 && prev[1] === 10000 && !isSilent) return [lowest, highest];
             return prev;
          });
        }

        if (!categoriesRes.data.success || !categoriesRes.data.data?.length) {
          const normalizeCat = (c) => c ? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() : '';
          const unique = [...new Set(fetched.map(p => p.category).filter(Boolean).map(normalizeCat))];
          setCategories([{ name: 'All', _id: 'all' }, ...unique.map(c => ({ name: c, _id: c }))]);
        }
      }

      if (pulseRes.data.success) setBanners(pulseRes.data.data.banners || []);

      if (categoriesRes.data.success && categoriesRes.data.data?.length > 0) {
        const normalizeCat = (c) => c ? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() : '';
        const apiCats = categoriesRes.data.data.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
        const unique = [...new Set(apiCats.map(normalizeCat))];
        setCategories([{ name: 'All', _id: 'all' }, ...unique.map(c => ({ name: c, _id: c }))]);
      }

      if (collectionsRes.data.success) {
        setCollectionsList(collectionsRes.data.data || []);
      }
    } catch (err) {
      console.error('Shop fetch error:', err);
    } finally {
      if (!isSilent) setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
    fetchData(false, 1);
    const interval = setInterval(() => fetchData(true, 1), 60000);
    setWishlist(JSON.parse(localStorage.getItem('wishlist') || '[]'));
    return () => clearInterval(interval);
  }, [activeCategory, searchQuery, activeCollection, sortBy, priceRange]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(false, nextPage);
  };

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
        style: { borderRadius: '12px', background: '#4A5FD4', color: '#f8fafc', fontSize: '13px' }
      });
      setIsLoginModalOpen(true);
    } else {
      callback();
    }
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = 
      p.name?.toLowerCase().includes(q) || 
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      (p.colors && p.colors.some(c => c.toLowerCase().includes(q))) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
    const matchCat = activeCategory === 'All' || p.category?.toLowerCase() === activeCategory.toLowerCase();
    const matchCol = !activeCollection || (p.collections && p.collections.includes(activeCollection));
    const effectivePrice = p.discountPrice || p.basePrice || 0;
    const matchPrice = effectivePrice >= priceRange[0] && effectivePrice <= priceRange[1];
    return matchSearch && matchCat && matchCol && matchPrice;
  }).sort((a, b) => {
    if (sortBy === 'Price: Low to High') return (a.discountPrice || a.basePrice) - (b.discountPrice || b.basePrice);
    if (sortBy === 'Price: High to Low') return (b.discountPrice || b.basePrice) - (a.discountPrice || a.basePrice);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const recommendedProducts = React.useMemo(() => {
    if (!products.length) return [];
    let recommended = [];
    
    // 1. Try to match by Wishlist categories
    if (wishlist && wishlist.length > 0) {
      const wishlistedProducts = products.filter(p => wishlist.includes(p._id));
      const wishlistCategories = [...new Set(wishlistedProducts.map(p => p.category))].filter(Boolean);
      if (wishlistCategories.length > 0) {
        recommended = products.filter(p => wishlistCategories.includes(p.category) && !wishlist.includes(p._id));
      }
    }

    // 2. Fallback to Recently Viewed logic
    if (recommended.length < 4) {
      const recentlyViewedStr = localStorage.getItem('recentlyViewed');
      if (recentlyViewedStr) {
        try {
          const viewed = JSON.parse(recentlyViewedStr);
          const viewedCategories = [...new Set(viewed.map(v => v.category))].filter(Boolean);
          const moreRec = products.filter(p => viewedCategories.includes(p.category) && !recommended.some(r => r._id === p._id));
          recommended = [...recommended, ...moreRec];
        } catch(e) {}
      }
    }

    // 3. Ultimate Fallback to New Arrivals
    if (recommended.length < 6) {
      const newArrivals = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).filter(p => !recommended.some(r => r._id === p._id));
      recommended = [...recommended, ...newArrivals];
    }

    return recommended.slice(0, 6);
  }, [products, wishlist]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.05 });

    setTimeout(() => {
      const elements = document.querySelectorAll('.reveal-on-scroll');
      elements.forEach(el => observer.observe(el));
    }, 100);

    return () => observer.disconnect();
  }, [filteredProducts, recommendedProducts, activeCategory]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
        <div className="w-10 h-10 border-4 border-[var(--color-neu-dark)] border-t-[var(--color-neu-accent)] rounded-full animate-spin" />
        <p className="text-sm font-medium" style={{ color: 'var(--color-neu-text)' }}>Loading products…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: 'var(--color-neu-bg)' }}>

      {/* ── HERO BANNER ── */}
      {banners.length > 0 && (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-4">
          <section className="relative w-full h-[140px] sm:h-[240px] md:h-[320px] lg:h-[380px] xl:h-[440px] overflow-hidden rounded-[24px] sm:rounded-[32px] neu-pressed group">
            <div
              className="flex h-full w-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentBanner * 100}%)` }}
            >
              {banners.map((b) => (
                <div key={b._id} className="relative w-full h-full flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-transparent z-10" />
                  <img loading="lazy" src={b.imageUrl} alt="Offer banner" className="w-full h-full object-cover" />
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
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-4">
        <div className="sticky top-16 md:top-[70px] z-50 pt-2 pb-3" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
          <div className="flex items-center gap-2 neu-flat px-3 py-2">

            {/* Search */}
            <div className="relative flex-shrink-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-neu-text)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="h-9 w-36 md:w-48 neu-input rounded-xl pl-8 pr-3 text-sm font-medium transition-all"
                style={{ color: 'var(--color-neu-text)' }}
              />
            </div>

            <div className="w-px h-6 bg-slate-200 flex-shrink-0" />

            {/* Category Pills */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
              {categories.map(cat => {
                const name = typeof cat === 'string' ? cat : cat.name;
                return (
                  <button
                    key={name}
                    onClick={() => setActiveCategory(name)}
                    className={activeCategory === name ? 'btn-pill-active' : 'btn-pill'}
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
              className="btn-primary btn-primary-sm flex-shrink-0 flex items-center gap-1.5"
            >
              <SlidersHorizontal size={13} />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-8">
        {/* ── COLLECTIONS HORIZONTAL SCROLL ── */}
        {collectionsList.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: 'var(--color-neu-text)' }}>Curated Collections</h2>
              {activeCollection && (
                <button 
                  onClick={() => setActiveCollection(null)} 
                  className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
              {collectionsList.map((col) => (
                <div 
                  key={col._id}
                  onClick={() => setActiveCollection(activeCollection === col._id ? null : col._id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-3 cursor-pointer group transition-all duration-500 ${
                    activeCollection === col._id ? 'scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] flex items-center justify-center transition-all duration-500 overflow-hidden relative ${
                    activeCollection === col._id ? 'neu-pressed border-2 border-orange-500/30' : 'neu-flat hover:neu-pressed'
                  }`}>
                    <img src={col.logoUrl} alt={col.name} className="w-10 h-10 sm:w-12 sm:h-12 object-contain group-hover:scale-110 transition-transform duration-500" />
                    {activeCollection === col._id && (
                      <div className="absolute inset-0 bg-orange-500/10 backdrop-blur-[2px]" />
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest text-center transition-colors ${
                    activeCollection === col._id ? 'text-orange-500' : 'text-slate-500'
                  }`}>
                    {col.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* ── ALL PRODUCTS HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-4 mb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full" style={{ background: 'var(--brand-gradient)' }} />
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-neu-text)' }}>All Products</h1>
              <p className="text-micro mt-0.5" style={{ color: 'var(--color-neu-text)' }}>{filteredProducts.length} products</p>
            </div>
          </div>
        </div>

        {/* ── PRODUCT GRID ── */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 neu-pressed gap-5 mb-12">
            <div className="w-20 h-20 neu-flat flex items-center justify-center" style={{ color: 'var(--color-neu-text)' }}>
              <ShoppingBag size={28} />
            </div>
            <div className="text-center" style={{ color: 'var(--color-neu-text)' }}>
              <h3 className="text-xl font-black uppercase tracking-tighter">No products found</h3>
              <p className="text-sm font-medium mt-2 opacity-70">Try adjusting your filters.</p>
            </div>
            <button
              onClick={() => { setActiveCategory('All'); setSearchQuery(''); setPriceRange([0, maxPriceLimit]); }}
              className="btn-secondary btn-secondary-sm flex items-center gap-2"
            >
              <RotateCcw size={13} /> Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5 mb-16">
            
            {/* INJECTED DESIGN YOUR CASE CARD — Sleek Phone Aesthetic */}
            {activeCategory === 'All' && !searchQuery && (
              <div
                onClick={() => navigate('/custom-mobile-cases')}
                className="group relative cursor-pointer h-full reveal-on-scroll"
              >
                <div className="relative w-full h-full transition-all duration-500 group-hover:-translate-y-2 active:scale-[0.98]">
                  
                  {/* Phone shell decoration */}
                  <div className="absolute -left-[2px] top-[20%] w-[3px] h-10 bg-[var(--color-neu-accent)] opacity-30 rounded-l-sm z-20" />
                  <div className="absolute -left-[2px] top-[35%] w-[3px] h-6 bg-[var(--color-neu-accent)] opacity-30 rounded-l-sm z-20" />
                  <div className="absolute -right-[2px] top-[25%] w-[3px] h-12 bg-[var(--color-neu-accent)] opacity-30 rounded-r-sm z-20" />

                  <div
                    className="relative w-full h-full neu-flat overflow-hidden group-hover:border-[var(--color-neu-accent)]/30 transition-all duration-500"
                    style={{ borderRadius: '24px' }}
                  >
                    {/* Inner Screen Effect */}
                    <div className="absolute inset-[6px] bg-slate-900 rounded-[20px] overflow-hidden">
                        {/* Gradient BG */}
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/40 via-purple-900/40 to-slate-950 z-0" />
                        
                        {/* Notch / Dynamic Island */}
                        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[35%] h-[12px] bg-slate-950 rounded-full z-20 flex items-center justify-center gap-1.5">
                          <div className="w-[4px] h-[4px] rounded-full bg-slate-800" />
                          <div className="w-[3px] h-[3px] rounded-full bg-orange-500/40 animate-pulse" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-md flex items-center justify-center text-white mb-4 shadow-2xl border border-white/10 group-hover:scale-110 transition-transform">
                            <Smartphone size={24} />
                          </div>
                          <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.25em] mb-1">Architectural Gear</p>
                          <h2 className="text-sm font-black text-white uppercase tracking-tight leading-tight">Design Your<br/>Own Case</h2>
                          
                          <div className="mt-8 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-[9px] font-black uppercase tracking-[0.15em] text-white group-hover:bg-[var(--color-neu-accent)] group-hover:border-white/40 transition-all">
                            Engineer Now →
                          </div>
                        </div>

                        {/* Bottom Bar Indicator */}
                        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-[30%] h-[3px] bg-white/20 rounded-full z-20" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {filteredProducts.map(product => (
              <div key={product._id} className="reveal-on-scroll">
                <ProductCard
                  product={product}
                  wishlist={wishlist}
                  toggleWishlist={toggleWishlist}
                  addToCart={addToCart}
                  onCustomize={(p) => requireLogin(() => setCustomizingProduct(p))}
                  requireLogin={requireLogin}
                />
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && filteredProducts.length > 0 && (
          <div className="flex justify-center mt-12 mb-20">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-10 py-4 neu-flat rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:neu-pressed transition-all duration-300 flex items-center gap-3 disabled:opacity-50"
              style={{ color: 'var(--color-neu-text)' }}
            >
              {loadingMore ? (
                <>
                  <div className="w-3 h-3 border-2 border-[var(--color-neu-dark)] border-t-[var(--color-neu-accent)] rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Load More Gear <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        )}

        {/* ── SPECIAL SECTIONS (Popular & Recommended) ── */}
        {activeCategory === 'All' && !searchQuery && (
          <div className="pt-16 pb-8 space-y-20 border-t border-[var(--color-neu-dark)]">
            {products.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1 h-6 rounded-full" style={{ background: 'var(--brand-gradient)' }} />
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-neu-text)' }}>Popular Gear</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {[...products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 6).map(product => (
                    <div key={product._id} className="reveal-on-scroll">
                      <ProductCard product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} onCustomize={(p) => requireLogin(() => setCustomizingProduct(p))} requireLogin={requireLogin} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendedProducts.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1 h-6 rounded-full bg-emerald-400" />
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-neu-text)' }}>Curated For You</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {recommendedProducts.map(product => (
                    <div key={product._id} className="reveal-on-scroll">
                      <ProductCard product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} onCustomize={(p) => requireLogin(() => setCustomizingProduct(p))} requireLogin={requireLogin} />
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      <aside className={`fixed top-0 right-0 w-full sm:w-[380px] h-full z-[110] flex flex-col transition-transform duration-300 ease-out ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ backgroundColor: 'var(--color-neu-bg)' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-neu-dark)]">
          <div style={{ color: 'var(--color-neu-text)' }}>
            <h3 className="text-lg font-bold">Filters</h3>
            <p className="text-xs opacity-70 mt-0.5">Narrow down your results</p>
          </div>
          <button onClick={() => setIsFilterOpen(false)} className="w-9 h-9 flex items-center justify-center neu-button" style={{ color: 'var(--color-neu-text)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Price Range */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-800">Price Range</p>
              <span className="text-sm font-bold bg-indigo-50 px-3 py-1 rounded-lg" style={{ color: 'var(--brand-primary)' }}>
                ₹{priceRange[0].toLocaleString('en-IN')} - ₹{priceRange[1].toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range" min={minPriceLimit} max={maxPriceLimit} value={priceRange[1]}
              onChange={e => setPriceRange([minPriceLimit, Number(e.target.value)])}
              className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
              <span>₹{minPriceLimit.toLocaleString('en-IN')}</span>
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
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all text-sm font-medium ${
                    sortBy === opt
                      ? 'neu-pressed'
                      : 'neu-button hover:neu-pressed'
                  }`}
                  style={{ color: 'var(--color-neu-text)' }}
                >
                  {opt}
                  {sortBy === opt && <Check size={16} style={{ color: 'var(--color-neu-accent)' }} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 border-t border-[var(--color-neu-dark)]">
          <button
            onClick={() => setIsFilterOpen(false)}
            className="w-full py-3.5 neu-button-accent font-semibold text-sm"
          >
            Apply Filters
          </button>
          <button
            onClick={() => { setActiveCategory('All'); setSearchQuery(''); setPriceRange([0, maxPriceLimit]); setSortBy('Newest'); setIsFilterOpen(false); }}
            className="w-full py-3.5 flex items-center justify-center gap-2 neu-button font-semibold text-sm"
            style={{ color: 'var(--color-neu-text)' }}
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
