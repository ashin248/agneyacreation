import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiEdit3, 
  FiShoppingBag, 
  FiArrowRight,
  FiZap,
  FiStar,
  FiX
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
        const [bannersRes, productsRes] = await Promise.all([
          axios.get('/api/public/banners'),
          axios.get('/api/public/products?limit=8')
        ]);
        if (bannersRes.data.success) setBanners(bannersRes.data.data);
        if (productsRes.data.success) setProducts(productsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch storefront data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStorefrontData();

    // Wishlist sync
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
      <div className="h-screen flex flex-col items-center justify-center bg-white gap-6">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">Loading Collections...</p>
      </div>
    );
  }

  const heroBanner = banners.length > 0 ? banners[0] : null;

  return (
    <div className="bg-white pb-20 font-sans selection:bg-indigo-600 selection:text-white">
      
      <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
          onLoginSuccess={() => setIsLoginModalOpen(false)} 
      />

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative">
                  <button 
                      onClick={() => setQuickViewProduct(null)}
                      className="absolute top-6 right-6 z-10 p-4 bg-white/80 backdrop-blur-md rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                  >
                      <FiX size={20} />
                  </button>
                  
                  <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-12 overflow-hidden">
                        <img 
                          src={quickViewProduct.images?.[0] || quickViewProduct.galleryImages?.[0]} 
                          className="w-full h-full object-contain animate-in zoom-in-95 duration-500" 
                          alt="" 
                        />
                  </div>
                  
                  <div className="md:w-1/2 p-10 flex flex-col justify-center space-y-8 overflow-y-auto">
                      <div className="space-y-4">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">{quickViewProduct.category}</span>
                          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">{quickViewProduct.name}</h2>
                          <p className="text-sm text-gray-500 font-medium leading-relaxed">{quickViewProduct.description}</p>
                      </div>
                      
                      <div className="flex items-baseline gap-4">
                          <span className="text-3xl font-black text-gray-900 tracking-tighter">
                              ₹{(quickViewProduct.discountPrice || quickViewProduct.basePrice || 0).toLocaleString('en-IN')}
                          </span>
                          {(quickViewProduct.originalPrice || quickViewProduct.basePrice || 0) > (quickViewProduct.discountPrice || quickViewProduct.basePrice || 0) && (
                              <span className="text-lg text-gray-300 font-bold line-through">
                                  ₹{(quickViewProduct.originalPrice || quickViewProduct.basePrice || 0).toLocaleString('en-IN')}
                              </span>
                          )}
                      </div>

                      <div className="flex flex-col gap-3 pt-4">
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
                              className="w-full py-4 bg-[#2D3436] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl"
                          >
                              Buy Now
                          </button>
                          <button 
                              onClick={() => {
                                  setQuickViewProduct(null);
                                  navigate(`/product/${quickViewProduct._id}`);
                              }}
                              className="w-full py-4 bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all"
                          >
                              View Full Details
                          </button>
                          {quickViewProduct.isCustomizable && (
                              <button 
                                  onClick={() => {
                                      setQuickViewProduct(null);
                                      navigate(`/customize/${quickViewProduct._id}`);
                                  }}
                                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                              >
                                  Personalize Design
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 1. HERO HUB */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-gray-900 px-4">
        {heroBanner ? (
           <img 
             src={heroBanner.imageUrl || ''} 
             alt="Agneya Printing" 
             className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105"
           />
        ) : (
           <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-900 via-indigo-950 to-black opacity-90"></div>
        )}
        
        {/* Dynamic Orbs for Premium feel */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

        <div className="relative z-10 text-center max-w-5xl mx-auto space-y-10">
          <div className="flex items-center justify-center gap-4 mb-4">
             <div className="h-px w-8 bg-indigo-500"></div>
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Premium Printing Solutions</span>
             <div className="h-px w-8 bg-indigo-500"></div>
          </div>
          
          <h1 className="text-3xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase leading-[0.9] drop-shadow-2xl">
            {heroBanner?.title || 'Precision Printing for Your Vision'}
          </h1>
          
          <p className="hidden md:block text-lg md:text-xl text-indigo-100/70 max-w-2xl mx-auto font-bold tracking-tight leading-relaxed">
            From high-fidelity 3D modeling to bespoke bulk production, we synchronize logic and creativity for elite commercial printing.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-10">
              <button onClick={() => navigate('/custom-design')} className="group px-12 py-5 bg-white text-gray-900 font-black text-[11px] uppercase tracking-[0.3em] rounded-full hover:bg-indigo-600 hover:text-white transition-all shadow-2xl shadow-indigo-500/20 flex items-center gap-4 active:scale-95">
                  Design Studio <FiEdit3 className="transition-transform group-hover:rotate-12" />
              </button>
              <a href="#three-pillars" className="group px-12 py-5 bg-white/5 backdrop-blur-xl text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-full border border-white/10 hover:bg-white/10 transition-all flex items-center gap-4 active:scale-95">
                  Explore Collections <FiArrowRight className="transition-transform group-hover:translate-x-1" />
              </a>
          </div>
        </div>
      </section>

      {/* 2. THE THREE PILLARS (STRATEGY ENTRY) */}
      <section id="three-pillars" className="max-w-7xl mx-auto px-6 mt-16 md:mt-32">
        <div className="text-center mb-10 md:mb-16 space-y-2">
            <h2 className="text-2xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase">Our Services</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Choose Your Way</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* PILLAR 1: CREATE YOUR OWN */}
            <div className="group bg-white rounded-[60px] p-10 border border-gray-100 hover:border-indigo-600/30 shadow-2xl shadow-gray-200/50 transition-all hover:bg-indigo-50/30 flex flex-col justify-between h-[500px] overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 text-gray-900 transition-all group-hover:scale-125 group-hover:opacity-10">
                    <FiEdit3 size={180} />
                </div>
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-8">
                        <FiEdit3 size={24} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none mb-4">Design Studio</h3>
                    <p className="hidden md:block text-gray-400 font-bold text-sm leading-relaxed max-w-xs">Upload your bespoke artwork and place it on our premium blank canvases using our 3D design studio.</p>
                </div>
                <div className="relative z-10">
                    <ul className="text-[10px] font-black uppercase text-gray-400 tracking-widest space-y-3 mb-10">
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Premium Blank Canvases</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> High-Res Vector Support</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Neural Background Removal</li>
                    </ul>
                    <Link to="/custom-design" className="inline-flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-widest group/btn">
                        Start Designing <i className="bi bi-chevron-right transition-transform group-hover/btn:translate-x-1"></i>
                    </Link>
                </div>
            </div>

            {/* PILLAR 2: OUR COLLECTION */}
            <div className="group bg-gray-900 rounded-[60px] p-10 shadow-2xl shadow-indigo-900/20 flex flex-col justify-between h-[500px] overflow-hidden relative border border-white/5 transition-all hover:-translate-y-2">
                <div className="absolute top-0 right-0 p-12 opacity-5 text-white transition-all group-hover:scale-125 group-hover:opacity-10">
                    <FiShoppingBag size={180} />
                </div>
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white rounded-[28px] flex items-center justify-center text-gray-900 shadow-xl mb-8">
                        <FiShoppingBag size={24} />
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none mb-4">Ready-made Collections</h3>
                    <p className="hidden md:block text-gray-400 font-bold text-sm leading-relaxed max-w-xs">Explore our curated pre-designed templates tailored for a modern look.</p>
                </div>
                <div className="relative z-10">
                    <ul className="text-[10px] font-black uppercase text-gray-500 tracking-widest space-y-3 mb-10">
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white" /> Trending Graphic Sets</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white" /> Editable Components</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white" /> Ready-to-Ship Designs</li>
                    </ul>
                    <Link to="/shop" className="inline-flex items-center gap-3 text-white font-black text-xs uppercase tracking-widest group/btn">
                        Shop Collection <i className="bi bi-chevron-right transition-transform group-hover/btn:translate-x-1"></i>
                    </Link>
                </div>
            </div>

            {/* PILLAR 3: BULK HUB */}
            <div className="group bg-white rounded-[60px] p-10 border border-gray-100 hover:border-orange-600/30 shadow-2xl shadow-gray-200/50 transition-all hover:bg-orange-50/30 flex flex-col justify-between h-[500px] overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 text-gray-900 transition-all group-hover:scale-125 group-hover:opacity-10">
                    <i className="bi bi-box-seam text-[180px]"></i>
                </div>
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-orange-500 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-orange-200 mb-8">
                        <i className="bi bi-box-seam text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none mb-4">B2B Portal</h3>
                    <p className="hidden md:block text-gray-400 font-bold text-sm leading-relaxed max-w-xs">Strategic volume printing for businesses and teams requiring professional fulfillment.</p>
                </div>
                <div className="relative z-10">
                    <ul className="text-[10px] font-black uppercase text-gray-400 tracking-widest space-y-3 mb-10">
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-orange-600" /> Tiered Bulk Pricing</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-orange-600" /> GST Verified Invoicing</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-orange-600" /> B2B Activity Tracking</li>
                    </ul>
                    <Link to="/bulk-order" className="inline-flex items-center gap-3 text-orange-600 font-black text-xs uppercase tracking-widest group/btn">
                        Enter B2B Portal <i className="bi bi-chevron-right transition-transform group-hover/btn:translate-x-1"></i>
                    </Link>
                </div>
            </div>
        </div>
      </section>

      {/* 3. TRENDING OVERLAY */}
      <section className="max-w-7xl mx-auto px-6 mt-20 md:mt-40">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <FiStar className="text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Commercial Spotlight</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Trending Assets</h2>
          </div>
          <Link to="/shop" className="px-10 py-4 bg-gray-50 text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-900 hover:text-white transition-all shadow-sm">
            View Full Catalog
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col items-center">
             <FiZap className="w-10 h-10 text-gray-200 mb-4 animate-pulse" />
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Updating Inventory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
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

      {/* 4. STATISTICS HUD */}
      <section className="max-w-7xl mx-auto px-6 mt-40">
          <div className="bg-indigo-600 rounded-[80px] p-12 md:p-24 flex flex-col md:flex-row items-center justify-around gap-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]"></div>
              
              <div className="text-center space-y-2 relative z-10">
                  <h4 className="text-6xl font-black text-white tracking-tighter">48H</h4>
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em]">Fast Shipping</p>
              </div>
              <div className="text-center space-y-2 relative z-10">
                  <h4 className="text-6xl font-black text-white tracking-tighter">10K+</h4>
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em]">Successful Designs</p>
              </div>
              <div className="text-center space-y-2 relative z-10">
                  <h4 className="text-6xl font-black text-white tracking-tighter">99.9%</h4>
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em]">Print Quality</p>
              </div>
          </div>
      </section>

    </div>
  );
};

export default Home;

