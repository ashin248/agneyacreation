import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  ArrowLeft,
  Heart, 
  ShoppingCart, 
  Star, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Palette,
  Building2,
  Share2,
  Upload
} from 'lucide-react';
import StarRating from '../components/StarRating';
import LoginModal from '../components/LoginModal';
import SEO from '../components/SEO/SEO';
import ProductSchema from '../components/SEO/ProductSchema';
import StudioOverlay from '../components/StudioOverlay';

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

    const { currentUser } = useAuth();
    
    const requireLogin = (callback) => {
        if (!currentUser) {
            setIsLoginModalOpen(true);
        } else {
            callback();
        }
    };

    useEffect(() => {
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
                    
                    // Fetch related products
                    if (res.data.category) {
                        const relatedRes = await axios.get(`/api/public/products?category=${res.data.category}`);
                        if (relatedRes.data && Array.isArray(relatedRes.data)) {
                          setRelatedProducts(relatedRes.data.filter(p => p._id !== productId).slice(0, 4));
                        }
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
      if (product?.variations) {
        const found = product.variations.find(v => v.color === selectedColor && v.size === selectedSize);
        if (found) {
          // You might have a separate state for the active variation SKU if needed
        }
      }
    }, [selectedColor, selectedSize, product]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">Syncing Operational Matrix...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Asset Not Found</h2>
                <button onClick={() => navigate('/shop')} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs">Return to Catalog</button>
            </div>
        );
    }

    const images = (product.galleryImages?.length > 0 ? product.galleryImages : (product.images || ['https://images.unsplash.com/photo-1544441893-675973e31985?w=500&q=80']));
    
    // Robust pricing mapping
    const currentPrice = Number(product.discountPrice || product.basePrice || 0) || 0;
    const originalPrice = Number(product.originalPrice || product.basePrice || 0) || 0;
    const discount = originalPrice > 0 ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
    const currentVariation = product.variations?.find(v => v.color === selectedColor && v.size === selectedSize) || product.variations?.[0];
    const baseFinalPrice = currentVariation ? (currentPrice + Number(currentVariation.priceModifier || 0)) : currentPrice;

    // INCREMENTAL PRICING ENGINE
    const getIncrementalTotal = (qty) => {
        if (!product.isBulkEnabled || !product.bulkRules || product.bulkRules.length === 0) {
            return qty * baseFinalPrice;
        }

        const sortedRules = [...product.bulkRules].sort((a, b) => a.minQty - b.minQty);
        let total = 0;
        let remaining = qty;

        // Threshold 0: Base Price units
        const baseThreshold = sortedRules[0].minQty;
        const unitsInBase = Math.min(remaining, baseThreshold);
        total += unitsInBase * baseFinalPrice;
        remaining -= unitsInBase;

        // Subsequent Tiers
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
        <div className="bg-[#FBFCFE] min-h-screen pb-32 font-sans selection:bg-indigo-600 selection:text-white">
            <SEO 
                title={product.name}
                description={product.description || `Buy ${product.name} at Agneya Creations. Premium custom designs and high-quality manufacturing.`}
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
            <div className="max-w-7xl mx-auto px-6 pt-8">
                
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-indigo-50 group-hover:scale-110 transition-all border border-gray-100">
                            <ArrowLeft size={14} />
                        </div>
                        Back
                    </button>
                    
                    {/* Breadcrumbs (Optional, keeping it clean) */}
                    <nav className="hidden md:flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <button onClick={() => navigate('/')} className="hover:text-indigo-600 transition-colors">Home</button>
                        <ChevronRight size={12} />
                        <button onClick={() => navigate('/shop')} className="hover:text-indigo-600 transition-colors">Shop</button>
                        <ChevronRight size={12} />
                        <span className="text-indigo-600">{product.name}</span>
                    </nav>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    
                    {/* Left: Image Gallery */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Variation Sidebar (Scroll on mobile, column on desktop) */}
                        {variationImages.length > 0 && (
                            <div className="flex md:flex-col gap-4 w-full md:w-20 overflow-x-auto md:overflow-y-auto no-scrollbar flex-shrink-0 animate-in slide-in-from-left duration-500">
                                <p className="hidden md:block text-[8px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-1 text-center">Color Refs</p>
                                <div className="flex md:flex-col gap-4 min-w-max md:min-w-0">
                                    {variationImages.map((img, idx) => (
                                        <button 
                                            key={`var-${idx}`}
                                            onClick={() => {
                                                setIsImageTransitioning(true);
                                                setTimeout(() => {
                                                    setSelectedColor(img.color);
                                                    setSelectedSize(img.size);
                                                    setOverrideImage(img.imageUrl);
                                                    setIsImageTransitioning(false);
                                                }, 300);
                                            }}
                                            className={`relative w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl overflow-hidden border-2 transition-all ${selectedColor === img.color ? 'border-indigo-600 shadow-lg' : 'border-slate-100 hover:border-indigo-400'}`}
                                        >
                                            <img src={img.imageUrl} className="w-full h-full object-cover" alt="Variation" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 space-y-6">
                            <div className="relative aspect-square bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-50 group">
                                <div key={displayMainImage} className={`w-full h-full p-12 transition-all duration-500 ${isImageTransitioning ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`}>
                                  <img 
                                      src={displayMainImage} 
                                      alt={product.name} 
                                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                                      loading="eager"
                                      decoding="async"
                                  />
                                </div>
                                {discount > 0 && (
                                    <div className="absolute top-8 left-8 bg-red-500 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-xl">
                                        -{discount}%
                                    </div>
                                )}
                                <button 
                                    onClick={() => setIsWishlisted(!isWishlisted)}
                                    className="absolute top-8 right-8 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white"
                                >
                                    <Heart className={`w-5 h-5 ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                                </button>
                            </div>
                            
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                {images.slice(0, 5).map((img, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => {
                                          if (activeImage !== idx || overrideImage) {
                                            setIsImageTransitioning(true);
                                            setTimeout(() => {
                                              setActiveImage(idx);
                                              setOverrideImage(null);
                                              setIsImageTransitioning(false);
                                            }, 300);
                                          }
                                        }}
                                        className={`relative w-20 h-20 flex-shrink-0 bg-white rounded-2xl overflow-hidden border-2 transition-all ${activeImage === idx && !overrideImage ? 'border-indigo-600 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        aria-label={`View image ${idx + 1}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" alt={`${product.name} view ${idx + 1}`} loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Product Info */}
                    <div className="space-y-10">
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-md">
                                    {product.category || 'Premium Asset'}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                                {product.name}
                            </h1>
                            <p className="hidden md:block text-gray-500 font-medium leading-relaxed max-w-xl">
                                {product.description || 'Professional-grade asset engineered for high-fidelity production and superior aesthetic dominance.'}
                            </p>
                        </div>

                        {/* Price Area */}
                        <div className="space-y-4">
                            <div className="flex items-baseline gap-4">
                                <span className="text-4xl font-black text-slate-900 tracking-tight">
                                    ₹{baseFinalPrice.toLocaleString('en-IN')}
                                </span>
                                {discount > 0 && (
                                    <span className="text-xl text-slate-200 line-through font-bold">
                                        ₹{originalPrice.toLocaleString('en-IN')}
                                    </span>
                                )}
                            </div>
                            {product.isBulkEnabled && product.bulkRules?.length > 0 && (
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Wholesale Ready</h4>
                                    </div>
                                    <div className="overflow-hidden border border-slate-100 rounded-2xl w-full max-w-sm">
                                        <table className="w-full text-[9px] font-bold">
                                            <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left tracking-widest">BATCH RANGE</th>
                                                    <th className="px-4 py-3 text-right tracking-widest">UNIT OFF</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 bg-white">
                                                {product.bulkRules.sort((a,b)=>a.minQty-b.minQty).map((rule, idx) => (
                                                    <tr key={idx} className="text-slate-600 hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 border-r border-slate-50">ABOVE {rule.minQty} UNITS</td>
                                                        <td className="px-4 py-3 text-right text-emerald-600">₹{rule.pricePerUnit}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Variants Management */}
                        {product.variations?.length > 0 && (
                            <div className="space-y-8">
                                {/* Color Selection */}
                                {[...new Set(product.variations.map(v => v.color))].filter(Boolean).length > 0 && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Available Colors</label>
                                        <div className="flex flex-wrap gap-4">
                                            {[...new Set(product.variations.map(v => v.color))].map((color, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => setSelectedColor(color)}
                                                    className={`px-4 py-2.5 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${selectedColor === color ? 'bg-slate-900 border-slate-900 text-white shadow-xl translate-y-[-2px]' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-600 hover:text-indigo-600'}`}
                                                >
                                                    {color === '-' ? 'Neutral' : color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Size Selection */}
                                {[...new Set(product.variations.filter(v => !selectedColor || v.color === selectedColor).map(v => v.size))].filter(Boolean).length > 0 && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Select Dimension</label>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                            {[...new Set(product.variations.filter(v => !selectedColor || v.color === selectedColor).map(v => v.size))].map((size, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`px-3 py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${selectedSize === size ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-600 hover:text-indigo-600'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-4 pt-4">
                            <div className="flex gap-4">
                                <div className="flex flex-col gap-1 items-center bg-slate-50 rounded-2xl border border-slate-100 p-1">
                                    <div className="flex items-center">
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-slate-400 hover:text-slate-900 font-black">−</button>
                                        <span className="w-12 text-center font-black text-sm text-slate-900">{quantity}</span>
                                        <button onClick={() => setQuantity(quantity + 1)} className="p-3 text-slate-400 hover:text-slate-900 font-black">+</button>
                                    </div>
                                    {potentialSavings > 0 && (
                                        <div className="px-3 pb-1">
                                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Savings: ₹{potentialSavings}</span>
                                        </div>
                                    )}
                                </div>
                                    <button 
                                        onClick={() => {
                                            const variationInfo = `Color: ${selectedColor || '-'}, Size: ${selectedSize || '-'}`;
                                            
                                            const commonItemData = {
                                                productId: product._id,
                                                name: product.name,
                                                unitPrice: baseFinalPrice,
                                                selectedVariation: variationInfo, // Sending combined info to Admin
                                                image: images[0],
                                                itemType: 'Ready',
                                                quantity: quantity,
                                                originalPrice: originalPrice,
                                                category: product.category,
                                                isBulkEnabled: product.isBulkEnabled,
                                                bulkRules: product.bulkRules,
                                                gstRate: product.gstRate
                                            };
                                            
                                            requireLogin(() => {
                                                navigate('/checkout', { state: { buyNowItem: commonItemData } });
                                            });
                                        }}
                                        className="flex-1 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 px-4"
                                    >
                                        <ShoppingCart size={18} /> Buy Now (₹{cartItemTotal.toLocaleString('en-IN')})
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const variationInfo = `Color: ${selectedColor || '-'}, Size: ${selectedSize || '-'}`;
                                            addToCart({
                                                productId: product._id,
                                                name: product.name,
                                                unitPrice: baseFinalPrice,
                                                selectedVariation: variationInfo, // Sending combined info to Admin
                                                image: images[0],
                                                itemType: 'Ready',
                                                quantity: quantity,
                                                originalPrice: originalPrice,
                                                category: product.category,
                                                isBulkEnabled: product.isBulkEnabled,
                                                bulkRules: product.bulkRules,
                                                gstRate: product.gstRate
                                            });
                                        }}
                                        className="flex-1 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-3 px-4"
                                    >
                                        <ShoppingCart size={18} /> Add to Transaction
                                    </button>
                            </div>

                                    {product.isCustomizable && (
                                        <div className="space-y-3">
                                            {/* Mode 1: Self Design (Only if 2D or 3D is configured in Admin) */}
                                            {['2D', '3D'].includes(product.customizationType) && (
                                                <button 
                                                    onClick={() => requireLogin(() => {
                                                        setInitialStudioMode('self');
                                                        setCustomizingProduct(product);
                                                    })} 
                                                    className="flex-1 h-14 w-full bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-black hover:-translate-y-1 transition-all active:scale-95"
                                                >
                                                    <Palette size={18} /> Access Interactive Studio
                                                </button>
                                            )}
                                            
                                            {/* Mode 2: Design Assistance (Manual Request - Always available for customizable products) */}
                                            <button 
                                                onClick={() => requireLogin(() => {
                                                    setInitialStudioMode('company');
                                                    setCustomizingProduct(product);
                                                })}
                                                className={`flex-1 h-14 w-full rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 ${
                                                    product.customizationType === 'None' 
                                                    ? 'bg-indigo-600 text-white shadow-xl hover:bg-slate-900' 
                                                    : 'bg-white border-2 border-slate-200 text-slate-800 hover:bg-slate-50'
                                                }`}
                                            >
                                                <Upload size={16} /> {product.customizationType === 'None' ? 'Proceed to Design Assistance' : 'Custom Request Hub'}
                                            </button>
                                        </div>
                                    )}

                            {product.isBulkEnabled && (
                                <div className="space-y-4">
                                    <button 
                                        onClick={() => {
                                            const minBulkQty = product.bulkRules?.[0]?.minQty || 10;
                                            addToCart({
                                                productId: product._id,
                                                name: product.name,
                                                unitPrice: baseFinalPrice,
                                                selectedVariation: selectedSize,
                                                image: images[0],
                                                itemType: 'Ready',
                                                quantity: minBulkQty,
                                                originalPrice: originalPrice,
                                                category: product.category,
                                                isBulkEnabled: product.isBulkEnabled,
                                                bulkRules: product.bulkRules,
                                                gstRate: product.gstRate
                                            });
                                            navigate('/cart');
                                        }}
                                        className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:border-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Building2 size={18} /> Order Wholesale Batch
                                    </button>
                                    {product.isCustomizable && (
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center px-4">
                                            💡 For <span className="text-indigo-600">Customized Bulk Orders</span>, use the Initialize Custom Studio path above.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-gray-100">
                            {[
                                { icon: <Truck size={20}/>, label: 'Express Sync' },
                                { icon: <ShieldCheck size={20}/>, label: 'Quality Vault' },
                                { icon: <RotateCcw size={20}/>, label: 'Secure Logic' },
                                { icon: <Share2 size={20}/>, label: 'Share Asset' }
                            ].map((badge, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-3 text-center group cursor-pointer">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                        {badge.icon}
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{badge.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div className="mt-32 pt-16 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-12">
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Related Architecture</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Curated assets for your production</p>
                            </div>
                            <button onClick={() => navigate('/shop')} className="px-6 py-3 bg-gray-50 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100">
                                View Full Catalog
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            {relatedProducts.map((rel, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => {
                                      navigate(`/product/${rel._id}`);
                                      window.scrollTo(0, 0);
                                    }}
                                    className="group cursor-pointer space-y-4"
                                >
                                    <div className="aspect-square bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm transition-all group-hover:shadow-xl group-hover:shadow-indigo-100 group-hover:translate-y-[-8px]">
                                        <img 
                                            src={rel.galleryImages?.[0] || rel.images?.[0] || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500&q=80'} 
                                            className="w-full h-full object-contain p-8 transition-transform duration-700 group-hover:scale-110" 
                                            alt={rel.name} 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[11px] font-black uppercase tracking-tight text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{rel.name}</h4>
                                        <p className="text-[14px] font-black text-slate-900">₹{rel.basePrice?.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <StudioOverlay 
                isOpen={!!customizingProduct} 
                onClose={() => setCustomizingProduct(null)} 
                product={customizingProduct} 
                requireLogin={requireLogin}
                initialMode={initialStudioMode}
            />
        </div>
    );
};

export default ProductDetails;

