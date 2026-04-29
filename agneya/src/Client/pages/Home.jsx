import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiEdit3, 
  FiShoppingBag, 
  FiArrowRight,
  FiZap,
  FiStar,
  FiX,
  FiSmartphone,
  FiBox,
  FiShield
} from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';

const Home = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const fetchStorefrontData = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          axios.get('/api/public/banners'),
          axios.get('/api/public/products?limit=8')
        ]);
        
        const bannersRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const productsRes = results[1].status === 'fulfilled' ? results[1].value : null;

        if (bannersRes && bannersRes.data.success) {
          setBanners(bannersRes.data.data || bannersRes.data.banners || []);
        }
        if (productsRes && productsRes.data.success) {
          setProducts(productsRes.data.products || productsRes.data.data || []);
        } else if (productsRes && Array.isArray(productsRes.data)) {
          setProducts(productsRes.data);
        } else if (productsRes && productsRes.data.products) {
          setProducts(productsRes.data.products);
        }
      } catch (err) {
        console.error('Failed to fetch storefront data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStorefrontData();

    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(savedWishlist);
  }, []);

  const toggleWishlist = (id) => {
    const newWishlist = wishlist.includes(id) 
        ? wishlist.filter(item => item !== id)
        : [...wishlist, id];
    setWishlist(newWishlist);
    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
  };

  const requireLogin = (callback) => {
    if (!currentUser) {
        setIsLoginModalOpen(true);
    } else {
        callback();
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#FBFCFE] gap-6">
        <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-4 border-indigo-100 border-b-indigo-400 animate-spin-reverse"></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 animate-pulse">Initializing Interface</p>
      </div>
    );
  }

  const heroBanner = banners.length > 0 ? banners[0] : null;

  return (
    <div className="bg-[#FBFCFE] pb-32 font-sans selection:bg-indigo-600 selection:text-white">
      
      <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
          onLoginSuccess={() => setIsLoginModalOpen(false)} 
      />

      {/* QUICK VIEW MODAL - GLASSMORPHIC */}
      {quickViewProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative animate-in slide-in-from-bottom-8">
                  <button 
                      onClick={() => setQuickViewProduct(null)}
                      className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-colors text-slate-400 shadow-sm"
                  >
                      <FiX size={24} />
                  </button>
                  
                  <div className="md:w-1/2 bg-slate-50 flex items-center justify-center p-12 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
                        <img 
                          src={quickViewProduct.images?.[0] || quickViewProduct.galleryImages?.[0]} 
                          className="w-full h-full object-contain hover:scale-110 transition-transform duration-700 ease-out z-10" 
                          alt={quickViewProduct.name} 
                        />
                  </div>
                  
                  <div className="md:w-1/2 p-12 flex flex-col justify-center space-y-8 overflow-y-auto bg-white">
                      <div className="space-y-4">
                          <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-100">
                              {quickViewProduct.category || 'Premium'}
                          </span>
                          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-[1.1]">{quickViewProduct.name}</h2>
                          <p className="text-sm text-slate-500 font-bold leading-relaxed line-clamp-3">{quickViewProduct.description}</p>
                      </div>
                      
                      <div className="flex items-baseline gap-4">
                          <span className="text-4xl font-black text-indigo-600 tracking-tight">
                              ₹{(quickViewProduct.discountPrice || quickViewProduct.basePrice || 0).toLocaleString('en-IN')}
                          </span>
                          {(quickViewProduct.originalPrice || quickViewProduct.basePrice || 0) > (quickViewProduct.discountPrice || quickViewProduct.basePrice || 0) && (
                              <span className="text-lg text-slate-300 font-bold line-through">
                                  ₹{(quickViewProduct.originalPrice || quickViewProduct.basePrice || 0).toLocaleString('en-IN')}
                              </span>
                          )}
                      </div>

                      <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
                          <div className="grid grid-cols-2 gap-4">
                              <button 
                                  onClick={() => {
                                      requireLogin(() => {
                                          const buyNowItem = {
                                              productId: quickViewProduct._id,
                                              name: quickViewProduct.name,
                                              unitPrice: (quickViewProduct.discountPrice || quickViewProduct.basePrice || 0),
                                              selectedVariation: (quickViewProduct.variations?.length > 0 ? quickViewProduct.variations[0] : null),
                                              image: (quickViewProduct.images?.[0] || quickViewProduct.galleryImages?.[0]),
                                              itemType: 'Ready',
                                              quantity: 1,
                                              originalPrice: (quickViewProduct.originalPrice || quickViewProduct.basePrice || 0),
                                              category: quickViewProduct.category
                                          };
                                          setQuickViewProduct(null);
                                          navigate('/checkout', { state: { buyNowItem } });
                                      });
                                  }}
                                  className="py-4 bg-slate-900 text-white rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-600/30 active:scale-95"
                              >
                                  Buy Now
                              </button>
                              <button 
                                  onClick={() => {
                                      setQuickViewProduct(null);
                                      navigate(`/product/${quickViewProduct._id}`);
                                  }}
                                  className="py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95"
                              >
                                  Full Details
                              </button>
                          </div>
                          
                          {quickViewProduct.isCustomizable && (
                              <button 
                                  onClick={() => {
                                      setQuickViewProduct(null);
                                      const target = quickViewProduct.customizationType === '3D' ? '3d' : '2d';
                                      navigate(`/studio/${target}/${quickViewProduct._id}`);
                                  }}
                                  className="w-full py-4 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-inner active:scale-95"
                              >
                                  Personalize Design
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 1. HERO HUB - MODERN, CLEAN & DYNAMIC */}
      <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950 px-4 md:px-8">
        {heroBanner ? (
           <img 
             src={heroBanner.imageUrl || ''} 
             alt="Agneya Printing" 
             className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105 pointer-events-none"
           />
        ) : (
           <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-900 opacity-90"></div>
        )}
        
        {/* Dynamic Orbs for Premium feel */}
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000 pointer-events-none"></div>

        <div className="relative z-10 text-center max-w-6xl mx-auto space-y-12">
          <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
             <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Premium Manufacturing Hub</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter uppercase leading-[0.85] drop-shadow-2xl">
            {heroBanner?.title || 'Precision Meets Imagination'}
          </h1>
          
          <p className="hidden md:block text-lg md:text-xl text-indigo-100/60 max-w-2xl mx-auto font-bold tracking-widest leading-relaxed">
            Elevating your ideas with high-fidelity production. Design bespoke products or explore our curated collections.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <button onClick={() => navigate('/shop')} className="group w-full sm:w-auto px-10 py-5 bg-white text-slate-900 font-black text-[12px] uppercase tracking-widest rounded-full hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-2xl hover:shadow-indigo-600/30 flex items-center justify-center gap-4 active:scale-95">
                  Explore Catalog <FiArrowRight className="transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => navigate('/custom-mobile-cases')} className="group w-full sm:w-auto px-10 py-5 bg-indigo-600/20 backdrop-blur-xl text-white font-black text-[12px] uppercase tracking-widest rounded-full border border-indigo-500/30 hover:bg-indigo-600 transition-all duration-300 flex items-center justify-center gap-4 active:scale-95">
                  Design Cases <FiSmartphone className="transition-transform group-hover:-rotate-12" />
              </button>
          </div>
        </div>
        
        {/* Subtle scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce">
            <span className="text-[8px] font-black text-white uppercase tracking-widest">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </section>

      {/* 2. THE THREE PILLARS (SERVICES) */}
      <section id="three-pillars" className="max-w-7xl mx-auto px-6 mt-32 md:mt-40">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-3">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">Our Capabilities</h2>
                <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Choose Your Production Path</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* PILLAR 1: CUSTOM STUDIO */}
            <div onClick={() => navigate('/shop')} className="group cursor-pointer bg-white rounded-[40px] p-10 border-2 border-slate-100 hover:border-indigo-600 shadow-sm hover:shadow-2xl hover:shadow-indigo-600/10 transition-all duration-500 flex flex-col justify-between h-[450px] relative overflow-hidden hover:-translate-y-2">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors duration-500"></div>
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl mb-8 group-hover:scale-110 transition-transform duration-500">
                        <FiEdit3 size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none mb-4">Design Studio</h3>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed max-w-[250px]">Upload your bespoke artwork onto our premium 3D and 2D customizable blank canvases.</p>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">Start Creating</span>
                    <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                        <FiArrowRight size={16} />
                    </div>
                </div>
            </div>

            {/* PILLAR 2: COLLECTIONS */}
            <div onClick={() => navigate('/shop')} className="group cursor-pointer bg-slate-900 rounded-[40px] p-10 border-2 border-slate-800 hover:border-indigo-500 shadow-2xl transition-all duration-500 flex flex-col justify-between h-[450px] relative overflow-hidden hover:-translate-y-2">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl group-hover:bg-indigo-600/40 transition-colors duration-500"></div>
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-xl mb-8 group-hover:scale-110 transition-transform duration-500">
                        <FiShoppingBag size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none mb-4">Live Collections</h3>
                    <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-[250px]">Explore our curated pre-designed inventory. Ready to ship, meticulously crafted.</p>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Explore Shop</span>
                    <div className="w-10 h-10 rounded-full border border-slate-700 text-white flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 group-hover:border-white transition-all">
                        <FiArrowRight size={16} />
                    </div>
                </div>
            </div>

            {/* PILLAR 3: B2B BULK */}
            <div onClick={() => navigate('/bulk-order')} className="group cursor-pointer bg-white rounded-[40px] p-10 border-2 border-slate-100 hover:border-orange-500 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 flex flex-col justify-between h-[450px] relative overflow-hidden hover:-translate-y-2">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-orange-50 rounded-full blur-3xl group-hover:bg-orange-100 transition-colors duration-500"></div>
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/30 mb-8 group-hover:scale-110 transition-transform duration-500">
                        <FiBox size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none mb-4">B2B Portal</h3>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed max-w-[250px]">Strategic volume printing and wholesale fulfillment for businesses and organizations.</p>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-orange-500 transition-colors">Order Wholesale</span>
                    <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
                        <FiArrowRight size={16} />
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* 3. TRENDING OVERLAY */}
      <section className="max-w-7xl mx-auto px-6 mt-32 md:mt-48">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
                <FiStar className="text-indigo-600 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Spotlight</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">Trending Assets</h2>
          </div>
          <Link to="/shop" className="group flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm">
            View All Inventory
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center">
             <FiZap className="w-12 h-12 text-slate-200 mb-6 animate-bounce" />
             <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">Syncing Data</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updating the latest inventory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map(product => (
                <ProductCard 
                    key={product._id}
                    product={product}
                    wishlist={wishlist}
                    toggleWishlist={toggleWishlist}
                    addToCart={addToCart}
                    onQuickView={setQuickViewProduct}
                    requireLogin={requireLogin}
                />
            ))}
          </div>
        )}
      </section>

      {/* 4. STATISTICS HUD - HIGH DEFINITION */}
      <section className="max-w-7xl mx-auto px-6 mt-32 md:mt-48 mb-10">
          <div className="bg-indigo-600 rounded-[40px] md:rounded-[60px] p-12 md:p-24 flex flex-col md:flex-row items-center justify-around gap-16 relative overflow-hidden shadow-2xl shadow-indigo-600/20">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-[80px] pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-[60px] pointer-events-none"></div>
              
              <div className="text-center space-y-4 relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white mb-2 backdrop-blur-sm border border-white/20">
                      <FiZap size={24} />
                  </div>
                  <h4 className="text-5xl md:text-6xl font-black text-white tracking-tighter">48H</h4>
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em]">Fast Fulfillment</p>
              </div>
              
              <div className="hidden md:block w-px h-32 bg-white/20 relative z-10"></div>
              
              <div className="text-center space-y-4 relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white mb-2 backdrop-blur-sm border border-white/20">
                      <FiEdit3 size={24} />
                  </div>
                  <h4 className="text-5xl md:text-6xl font-black text-white tracking-tighter">10K+</h4>
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em]">Custom Designs</p>
              </div>
              
              <div className="hidden md:block w-px h-32 bg-white/20 relative z-10"></div>
              
              <div className="text-center space-y-4 relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white mb-2 backdrop-blur-sm border border-white/20">
                      <FiShield size={24} />
                  </div>
                  <h4 className="text-5xl md:text-6xl font-black text-white tracking-tighter">99%</h4>
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em]">Quality Assured</p>
              </div>
          </div>
      </section>

    </div>
  );
};

export default Home;
