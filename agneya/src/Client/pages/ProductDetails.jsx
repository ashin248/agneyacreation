import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  ArrowLeft,
  Heart, 
  ShoppingCart, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Share2,
  Box,
  PenTool,
  Image as ImageIcon,
  X,
  Sparkles
} from 'lucide-react';
import LoginModal from '../components/LoginModal';
import SEO from '../components/SEO/SEO';
import ProductSchema from '../components/SEO/ProductSchema';
const StudioOverlay = React.lazy(() => import('../components/StudioOverlay'));
import { TWOD_TEMPLATES } from '../components/TwoD/TwoDTemplateLibrary';
import TemplateThumbnail from '../components/TwoD/TemplateThumbnail';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const ProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);

    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isImageTransitioning, setIsImageTransitioning] = useState(false);
    const [overrideImage, setOverrideImage] = useState(null);
    const [customizingProduct, setCustomizingProduct] = useState(null);
    const [initialStudioMode, setInitialStudioMode] = useState('self');
    const [activeTemplateId, setActiveTemplateId] = useState(null);
    const [show2DModelSelector, setShow2DModelSelector] = useState(false);
    const [initial2DModelIdx, setInitial2DModelIdx] = useState(0);
    const sliderRef = React.useRef(null);

    const scrollSlider = (direction) => {
        if (sliderRef.current) {
            const scrollAmount = direction === 'left' ? -350 : 350;
            sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const { currentUser, userData } = useAuth();
    const { addToCart: addToCartBase } = useCart();
    const [wishlist, setWishlist] = useState([]);

    const addToCart = (item) => {
        addToCartBase(item);
        toast.success(`${item.name} added to cart!`, {
            icon: '🛍️',
            style: { borderRadius: '12px', background: 'linear-gradient(135deg, #F7941D, #7B1760)', color: '#f8fafc', fontSize: '13px' }
        });
    };
    
    const requireLogin = (callback, action = 'interact') => {
        if (!currentUser) {
            toast.error(`Please login to ${action}.`, {
                style: { borderRadius: '12px', background: '#7B1760', color: '#f8fafc', fontSize: '13px' }
            });
            setIsLoginModalOpen(true);
        } else {
            callback();
        }
    };

    const toggleWishlist = async (id) => {
        const next = wishlist.includes(id) ? wishlist.filter(i => i !== id) : [...wishlist, id];
        setWishlist(next);
        localStorage.setItem('wishlist', JSON.stringify(next));
        if (currentUser && userData?.phone) {
            try {
                const token = await currentUser.getIdToken(true);
                await axios.post(`/api/public/user/wishlist/toggle`,
                    { phone: userData.phone, productId: id },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (e) { console.error('Wishlist sync failed:', e); }
        }
    };

    useEffect(() => {
        setWishlist(JSON.parse(localStorage.getItem('wishlist') || '[]'));
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/api/public/products/${productId}`);
                if (res.data) {
                    setProduct(res.data);
                    // Initialize selection from first variation
                    if (res.data.variations?.length > 0) {
                        const first = res.data.variations[0];
                        setSelectedColor(first.color);
                        setSelectedSize(first.size);
                    }

                    // 2D Template initialization
                    if (res.data.linkedTemplates?.length > 0) {
                        const first = res.data.linkedTemplates[0];
                        const tid = typeof first === 'string' ? first : (first?.templateId || first?.id);
                        setActiveTemplateId(tid);
                    }
                    
                    // Fetch related products - fetch more for slider
                    if (res.data.category) {
                        const relatedRes = await axios.get(`/api/public/products?category=${encodeURIComponent(res.data.category)}`);
                        if (relatedRes.data && relatedRes.data.success) {
                            const fetchedRelated = relatedRes.data.products || relatedRes.data.data || [];
                            if (Array.isArray(fetchedRelated)) {
                                setRelatedProducts(fetchedRelated.filter(p => p._id !== productId).slice(0, 8));
                            }
                        }
                    }

                    // Save to Recently Viewed
                    try {
                        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                        const updatedViewed = viewed.filter(p => p._id !== res.data._id);
                        updatedViewed.unshift({
                            _id: res.data._id,
                            name: res.data.name,
                            images: res.data.galleryImages?.length > 0 ? res.data.galleryImages : (res.data.images || []),
                            galleryImages: res.data.galleryImages || [],
                            basePrice: res.data.basePrice || 0,
                            discountPrice: res.data.discountPrice || 0,
                            category: res.data.category || '',
                            isCustomizable: res.data.isCustomizable,
                            customizationType: res.data.customizationType,
                            rating: res.data.rating || 5
                        });
                        localStorage.setItem('recentlyViewed', JSON.stringify(updatedViewed.slice(0, 8))); // Keep last 8 items
                    } catch(e) {
                        console.error("Failed to save recently viewed", e);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch product details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);

    // Update selected variation when color/size changes
    useEffect(() => {
      setOverrideImage(null);
    }, [selectedColor, selectedSize]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBFCFE] gap-6">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-orange-100 border-t-orange-600 animate-spin"></div>
                    <div className="absolute inset-3 rounded-full border-4 border-orange-100 border-b-orange-400 animate-spin-reverse"></div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-400 animate-pulse">Loading Details</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBFCFE] gap-6">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Product Not Found</h2>
                <button onClick={() => navigate('/shop')} className="px-8 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-lg hover:-translate-y-1 transition-all" style={{ background: 'linear-gradient(135deg, #F7941D, #7B1760)' }}>
                    Explore Shop
                </button>
            </div>
        );
    }

    const images = (product.galleryImages?.length > 0 ? product.galleryImages : (product.images || ['https://images.unsplash.com/photo-1544441893-675973e31985?w=500&q=80']));
    
    // Robust pricing mapping
    const currentPrice = Number(product.discountPrice || product.basePrice || 0) || 0;
    const originalPrice = Number(product.originalPrice || product.basePrice || 0) || 0;
    const discount = originalPrice > 0 ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
    const currentVariation = product.variations?.find(v => v.color === selectedColor && v.size === selectedSize) || product.variations?.[0];
    const baseFinalPrice = (product.discountPrice || product.basePrice || 0) + (currentVariation?.priceModifier || 0);

    // INCREMENTAL PRICING ENGINE
    const getIncrementalTotal = (qty) => {
        if (!product.isBulkEnabled || !product.bulkRules || product.bulkRules.length === 0) {
            return qty * baseFinalPrice;
        }

        const sortedRules = [...product.bulkRules].sort((a, b) => a.minQty - b.minQty);
        let total = 0;
        let remaining = qty;

        const baseThreshold = sortedRules[0].minQty;
        const unitsInBase = Math.min(remaining, baseThreshold);
        total += unitsInBase * baseFinalPrice;
        remaining -= unitsInBase;

        for (let i = 0; i < sortedRules.length; i++) {
            if (remaining <= 0) break;
            const currentRule = sortedRules[i];
            const nextRule = sortedRules[i + 1];

            const tierCapacity = nextRule ? (nextRule.minQty - currentRule.minQty) : Infinity;
            const unitsInTier = Math.min(remaining, tierCapacity);
            
            const tierDiscount = Number(currentRule.pricePerUnit || 0);
            const tierPrice = Math.max(0, baseFinalPrice - tierDiscount);
            
            total += unitsInTier * tierPrice;
            remaining -= unitsInTier;
        }

        return total;
    };

    const cartItemTotal = getIncrementalTotal(quantity);
    const potentialSavings = (quantity * baseFinalPrice) - cartItemTotal;

    const variationImages = product.variations
        ?.filter(v => v.imageUrl)
        ?.reduce((acc, current) => {
            const x = acc.find(item => item.imageUrl === current.imageUrl);
            if (!x) return acc.concat([current]);
            return acc;
        }, []) || [];
    
    const displayMainImage = overrideImage || images[activeImage];

    return (
        <div className="bg-[#FBFCFE] min-h-screen pb-32 font-sans selection:bg-orange-600 selection:text-white">
            <SEO 
                title={product.name}
                description={product.description || `Premium ${product.name} at Agneya Creations.`}
                image={images[0]}
                url={`/product/${product._id}`}
                type="product"
                productPrice={baseFinalPrice}
            />
            <ProductSchema product={product} />
            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={() => setIsLoginModalOpen(false)} 
                onLoginSuccess={() => setIsLoginModalOpen(false)} 
            />
            
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6">
                
                {/* Minimalist Header Navigation */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => navigate('/shop')} 
                        className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-orange-600 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:bg-orange-50 group-hover:shadow-md group-hover:-translate-x-1 transition-all border border-slate-100">
                            <ArrowLeft size={16} />
                        </div>
                        Back to Shop
                    </button>
                    
                    <nav className="hidden md:flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <button onClick={() => navigate('/')} className="hover:text-orange-600 transition-colors">Home</button>
                        <ChevronRight size={10} className="text-slate-300" />
                        <span className="text-orange-600 truncate max-w-[200px]">{product.name}</span>
                    </nav>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                    
                    {/* Left: Dynamic Image Gallery */}
                    <div className="lg:col-span-7 flex flex-col md:flex-row gap-6">
                        
                        {/* Vertical Thumbnail Bar */}
                        <div className="flex md:flex-col gap-4 w-full md:w-24 overflow-x-auto md:overflow-y-auto no-scrollbar flex-shrink-0 animate-in slide-in-from-left duration-500 order-2 md:order-1">
                            {images.slice(0, 6).map((img, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => {
                                        if (activeImage !== idx || overrideImage) {
                                            setIsImageTransitioning(true);
                                            setTimeout(() => {
                                                setActiveImage(idx);
                                                setOverrideImage(null);
                                                setIsImageTransitioning(false);
                                            }, 200);
                                        }
                                    }}
                                    className={`relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-white rounded-[20px] overflow-hidden transition-all duration-300 ${activeImage === idx && !overrideImage ? 'ring-2 ring-orange-600 ring-offset-2 scale-95 shadow-md' : 'border border-slate-100 opacity-60 hover:opacity-100 hover:scale-105'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx + 1}`} loading="lazy" />
                                </button>
                            ))}
                        </div>

                        {/* Main Product Showcase */}
                        <div className="flex-1 relative order-1 md:order-2">
                            <div className="relative aspect-square md:aspect-auto md:h-[450px] lg:h-[550px] w-full bg-white rounded-[40px] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 group flex items-center justify-center">
                                <div key={displayMainImage} className={`w-full h-full p-6 md:p-8 transition-all duration-500 ease-out ${isImageTransitioning ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
                                  <img loading="lazy" 
                                      src={displayMainImage} 
                                      alt={product.name} 
                                      className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-110"
                                  />
                                </div>
                                
                                {discount > 0 && (
                                    <div className="absolute top-6 left-6 bg-rose-500/90 backdrop-blur-md text-white text-[11px] font-black px-4 py-2 rounded-full shadow-lg border border-rose-400/30 animate-in fade-in zoom-in">
                                        -{discount}% OFF
                                    </div>
                                )}
                                
                                <button 
                                    onClick={() => setIsWishlisted(!isWishlisted)}
                                    className="absolute top-6 right-6 w-12 h-12 bg-white/60 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-110 active:scale-95 border border-white/50"
                                >
                                    <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Product Details & Actions */}
                    <div className="lg:col-span-5 flex flex-col justify-center space-y-6 md:space-y-10 animate-in fade-in slide-in-from-right duration-700">
                        
                        {/* Title & Description */}
                        <div className="space-y-4">
                            {product.category && (
                                <span className="inline-block px-4 py-1.5 bg-orange-50/50 text-orange-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-orange-100/50">
                                    {product.category}
                                </span>
                            )}
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-[1.1]">
                                {product.name}
                            </h1>
                            {product.description && (
                                <p className="text-slate-500 font-medium leading-relaxed text-sm max-w-lg">
                                    {product.description}
                                </p>
                            )}
                        </div>

                        {/* Pricing Component */}
                        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm shadow-slate-100/50 space-y-4">
                            <div className="flex items-baseline gap-4">
                                <span className="text-4xl font-black tracking-tight" style={{ color: '#F7941D' }}>
                                    ₹{baseFinalPrice.toLocaleString('en-IN')}
                                </span>
                                {discount > 0 && (
                                    <span className="text-lg text-slate-300 line-through font-bold">
                                        ₹{originalPrice.toLocaleString('en-IN')}
                                    </span>
                                )}
                            </div>

                            {/* Wholesale Table (if enabled) */}
                            {product.isBulkEnabled && product.bulkRules?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles size={14} className="text-emerald-500" />
                                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Wholesale Pricing Available</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {product.bulkRules.sort((a,b)=>a.minQty-b.minQty).slice(0, 4).map((rule, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100/50 flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{rule.minQty}+ Units</span>
                                                <span className="text-sm font-black text-slate-900">₹{rule.pricePerUnit}/ea</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Configurations: Color & Size */}
                        <div className="space-y-8">
                            {/* Colors */}
                            {[...new Set(product.variations?.map(v => v.color))].filter(Boolean).length > 0 && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Select Color</label>
                                    <div className="flex flex-wrap gap-3">
                                        {[...new Set(product.variations.map(v => v.color))].map((color, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => setSelectedColor(color)}
                                                className={`px-6 py-3 rounded-[16px] font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${selectedColor === color ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105' : 'bg-white border-2 border-slate-100 text-slate-500 hover:border-orange-200 hover:text-orange-600 hover:-translate-y-1'}`}
                                            >
                                                {color === '-' ? 'Standard' : color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sizes */}
                            {[...new Set(product.variations?.filter(v => !selectedColor || v.color === selectedColor).map(v => v.size))].filter(Boolean).length > 0 && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Select Size</label>
                                    <div className="flex flex-wrap gap-3">
                                        {[...new Set(product.variations.filter(v => !selectedColor || v.color === selectedColor).map(v => v.size))].map((size, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-6 py-3 rounded-[16px] font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${selectedSize === size ? 'text-white shadow-lg shadow-orange-600/20 scale-105' : 'bg-white border-2 border-slate-100 text-slate-500 hover:border-orange-200 hover:text-orange-600 hover:-translate-y-1'}`}
                                                style={selectedSize === size ? { background: 'linear-gradient(135deg, #F7941D, #7B1760)' } : {}}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cart & Checkout Actions */}
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <div className="flex gap-4">
                                {/* Quantity Selector */}
                                <div className="flex items-center bg-white rounded-[20px] border-2 border-slate-100 p-1 shadow-sm">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-colors font-black text-lg">−</button>
                                    <span className="w-12 text-center font-black text-sm text-slate-900">{quantity}</span>
                                    <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-colors font-black text-lg">+</button>
                                </div>
                                
                                {/* Buy Now Button */}
                                <button 
                                    onClick={() => {
                                        const commonItemData = {
                                            productId: product._id,
                                            name: product.name,
                                            unitPrice: baseFinalPrice,
                                            selectedVariation: currentVariation,
                                            image: images[0],
                                            itemType: 'Ready',
                                            quantity: quantity,
                                            originalPrice: originalPrice,
                                            category: product.category,
                                            isBulkEnabled: product.isBulkEnabled,
                                            bulkRules: product.bulkRules,
                                            gstRate: product.gstRate
                                        };
                                        requireLogin(() => navigate('/checkout', { state: { buyNowItem: commonItemData } }));
                                    }}
                                    className="flex-1 flex items-center justify-center gap-3 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:opacity-90 hover:shadow-xl hover:shadow-orange-600/30 active:scale-95 py-4 px-2"
                                    style={{ background: 'linear-gradient(135deg, #F7941D, #7B1760)' }}
                                >
                                    <ShoppingCart size={18} /> Add To Cart • ₹{cartItemTotal.toLocaleString('en-IN')}
                                </button>
                            </div>
                            
                            {potentialSavings > 0 && (
                                <p className="text-center text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-in fade-in zoom-in">
                                    You are saving ₹{potentialSavings.toLocaleString('en-IN')} on this order!
                                </p>
                            )}

                            {/* Customization Actions */}
                            {product.isCustomizable && product.customizationType !== 'None' && (
                                <div className={`grid gap-3 pt-4 ${
                                    (product.customizationType === 'Both') ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
                                }`}>
                                    {(product.customizationType === '3D' || product.customizationType === 'Both') && (
                                        <button 
                                            onClick={() => requireLogin(() => {
                                                setInitialStudioMode('3d');
                                                setCustomizingProduct(product);
                                            })} 
                                            className="h-14 sm:h-16 bg-white border-2 border-slate-100 text-slate-700 rounded-[20px] flex flex-col items-center justify-center gap-1.5 font-black uppercase tracking-widest text-[8px] hover:border-orange-600 hover:text-orange-600 hover:bg-orange-50 transition-all active:scale-95 group"
                                        >
                                            <Box size={18} className="group-hover:scale-110 transition-transform" /> 3D Studio
                                        </button>
                                    )}
                                    
                                    {(product.customizationType === '2D' || product.customizationType === 'Both') && (
                                        <button 
                                            onClick={() => requireLogin(() => {
                                                if (product?.twoDModels?.length > 1) {
                                                    setShow2DModelSelector(true);
                                                } else {
                                                    setInitial2DModelIdx(0);
                                                    setInitialStudioMode('2d');
                                                    setCustomizingProduct(product);
                                                }
                                            })} 
                                            className="h-14 sm:h-16 bg-white border-2 border-slate-100 text-slate-700 rounded-[20px] flex flex-col items-center justify-center gap-1.5 font-black uppercase tracking-widest text-[8px] hover:border-orange-600 hover:text-orange-600 hover:bg-orange-50 transition-all active:scale-95 group"
                                        >
                                            <ImageIcon size={18} className="group-hover:scale-110 transition-transform" /> 2D Canvas
                                        </button>
                                    )}

                                    <button 
                                        onClick={() => requireLogin(() => {
                                            setInitialStudioMode('company');
                                            setCustomizingProduct(product);
                                        })} 
                                        className={`${product.customizationType === 'Both' ? 'col-span-1 sm:col-span-1' : ''} h-14 sm:h-16 bg-orange-50 border border-orange-100 text-orange-600 rounded-[20px] flex flex-col items-center justify-center gap-1.5 font-black uppercase tracking-widest text-[8px] hover:text-white transition-all active:scale-95 shadow-inner group`}
                                    >
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-[20px]" style={{ background: 'linear-gradient(135deg, #F7941D, #7B1760)' }} />
                                        <div className="relative z-10 flex flex-col items-center justify-center gap-1.5">
                                            <PenTool size={18} /> Hire Designer
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* ── RELATED PRODUCTS ── */}
                {relatedProducts.length > 0 && (
                    <div className="mt-12 md:mt-24 mb-16">
                        {/* Section Header */}
                        <div className="flex items-end justify-between mb-8">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                    Related Products
                                </h3>
                                <div className="h-1.5 w-12 rounded-full mt-4" style={{ background: 'linear-gradient(135deg, #F7941D, #7B1760)' }}></div>
                            </div>
                            <button 
                                onClick={() => navigate('/shop')}
                                className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-orange-600 transition-all"
                            >
                                View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* Horizontal Scrollable Slider */}
                        <div className="relative group">
                            {/* Navigation Arrows */}
                            <button 
                                onClick={() => scrollSlider('left')}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex items-center justify-center text-slate-400 hover:text-orange-600 hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:flex"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            
                            <button 
                                onClick={() => scrollSlider('right')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex items-center justify-center text-slate-400 hover:text-orange-600 hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:flex"
                            >
                                <ChevronRight size={24} />
                            </button>

                            <div ref={sliderRef} className="flex gap-5 overflow-x-auto no-scrollbar pb-8 -mx-4 px-4 snap-x scroll-smooth">
                                {relatedProducts.map((rel) => (
                                    <div key={rel._id} className="min-w-[240px] md:min-w-[280px] max-w-[300px] snap-start">
                                        <ProductCard 
                                            product={{
                                                ...rel,
                                                // Inject model image as second image if it exists for hover effect
                                                images: (rel.galleryImages || rel.images || []).length > 0
                                                    ? [
                                                        (rel.galleryImages || rel.images || [])[0],
                                                        rel.twoDModels?.[0]?.mainModelUrl || (rel.galleryImages || rel.images || [])[1]
                                                      ].filter(Boolean)
                                                    : [rel.twoDModels?.[0]?.mainModelUrl].filter(Boolean)
                                            }}
                                            wishlist={wishlist}
                                            toggleWishlist={toggleWishlist}
                                            addToCart={addToCart}
                                            requireLogin={requireLogin}
                                            onQuickView={(p) => navigate(`/product/${p._id}`)}
                                            onCustomize={(p) => {
                                                // Reset template/model selection for the new product
                                                setActiveTemplateId(null); 
                                                setInitial2DModelIdx(0);
                                                
                                                if (p.linkedTemplates?.length > 0) {
                                                    const first = p.linkedTemplates[0];
                                                    const tid = typeof first === 'string' ? first : (first?.templateId || first?.id);
                                                    setActiveTemplateId(tid);
                                                }

                                                setInitialStudioMode(p.customizationType === '3D' ? '3d' : '2d');
                                                setCustomizingProduct(p);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mobile Explore Catalog */}
                        <div className="md:hidden mt-4">
                            <button
                                onClick={() => navigate('/shop')}
                                className="w-full py-4 rounded-2xl bg-orange-50 text-orange-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                Explore Full Catalog <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 2D Model Selector Modal */}
            {show2DModelSelector && (
                <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Select View</h3>
                            <button onClick={() => setShow2DModelSelector(false)} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {product.twoDModels.map((model, idx) => (
                                <div key={idx} onClick={() => {
                                    setInitial2DModelIdx(idx);
                                    setShow2DModelSelector(false);
                                    setInitialStudioMode('2d');
                                    setCustomizingProduct(product);
                                }} className="cursor-pointer group">
                                    <div className="w-full aspect-square bg-white rounded-[24px] border-2 border-slate-100 overflow-hidden group-hover:border-orange-600 group-hover:shadow-xl transition-all duration-300 p-6 mb-4">
                                        <img loading="lazy" src={model.mainModelUrl} alt={model.modelName || `Model ${idx + 1}`} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out" />
                                    </div>
                                    <p className="font-black text-[10px] uppercase tracking-widest text-center text-slate-500 group-hover:text-orange-600 transition-colors">{model.modelName || `View ${idx + 1}`}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <React.Suspense fallback={null}>
                <StudioOverlay 
                    isOpen={!!customizingProduct} 
                    onClose={() => setCustomizingProduct(null)} 
                    product={customizingProduct} 
                    requireLogin={requireLogin}
                    initialMode={initialStudioMode}
                    activeTemplateId={activeTemplateId}
                    initial2DModelIdx={initial2DModelIdx}
                />
            </React.Suspense>
        </div>
    );
};

export default ProductDetails;
