import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, ShoppingCart, Star, Palette, Building2, ArrowRight } from 'lucide-react';
import { FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import StarRating from './StarRating';

const ProductCard = ({ product, onCustomize, onQuickView, wishlist, toggleWishlist, addToCart, requireLogin, imageOnly = false }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const isWished = wishlist.includes(product._id);
  const images = product.galleryImages || product.images || (product.image ? [product.image] : []);
  const img1 = images[0] || '';
  const img2 = images[1];
  const displayImg = hovered && img2 ? img2 : img1;
  
  const currentPrice = Number(product.discountPrice || product.basePrice || 0) || 0;
  const originalPrice = Number(product.originalPrice || product.basePrice || 0) || 0;
  const discount = originalPrice > 0 ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  const hasVariations = product.variations && product.variations.length > 0;
  const [selectedVariation, setSelectedVariation] = useState(hasVariations ? product.variations[0] : null);

  const finalPrice = selectedVariation ? (currentPrice + Number(selectedVariation.priceModifier || 0)) : currentPrice;

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopPropagation();
    requireLogin(() => {
      if (hasVariations && !selectedVariation) {
        navigate(`/product/${product._id}`);
        return;
      }
      const buyNowItem = {
        productId: product._id,
        name: product.name,
        unitPrice: finalPrice,
        selectedVariation: selectedVariation,
        image: img1,
        itemType: 'Ready',
        quantity: 1,
        originalPrice: originalPrice,
        category: product.category,
        isBulkEnabled: product.isBulkEnabled,
        bulkRules: product.bulkRules,
        gstRate: product.gstRate
      };
      navigate('/checkout', { state: { buyNowItem } });
    });
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopPropagation();
    requireLogin(() => {
      if (hasVariations && !selectedVariation) {
        navigate(`/product/${product._id}`);
        return;
      }
      addToCart({
        productId: product._id,
        name: product.name,
        unitPrice: finalPrice,
        selectedVariation: selectedVariation,
        image: img1,
        itemType: 'Ready',
        originalPrice: originalPrice,
        category: product.category,
        isBulkEnabled: product.isBulkEnabled,
        bulkRules: product.bulkRules,
        gstRate: product.gstRate
      });
    });
  };

  return (
    <div
      className="group relative neu-flat rounded-[24px] overflow-hidden transition-all duration-500 flex flex-col h-full active:scale-[0.99]"
      style={{ border: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 1. COMPACT MEDIA MODULE */}
      <div className={`relative ${imageOnly ? 'aspect-square' : 'aspect-[4/4.5]'} overflow-hidden cursor-pointer group/media flex-1`} style={{ backgroundColor: 'transparent' }} onClick={() => navigate(`/product/${product._id}`)}>
        <div className="absolute inset-0 opacity-0 group-hover/media:opacity-100 transition-opacity z-0" style={{ background: 'rgba(247,148,29,0.03)' }}></div>
        <img 
          src={displayImg}
          alt={product.name}
          className="w-full h-full object-contain p-4 transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1 relative z-10"
          onError={e => { e.target.src = ''; }}
          loading="lazy"
          decoding="async"
        />

        {/* Premium Image-Only Hover Overlay */}
        {imageOnly && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-all duration-500 z-30 bg-white/10 backdrop-blur-[2px]">
            <div className="px-6 py-3 bg-slate-900/90 text-white rounded-[16px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl translate-y-4 group-hover/media:translate-y-0 transition-transform duration-500 border border-white/10 flex items-center gap-2">
              <Eye size={14} /> View Details
            </div>
          </div>
        )}

        {/* Dynamic HUD Overlays */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {product.badge && (
            <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg ${product.badge.color} text-white shadow-lg`}>
              {product.badge.label}
            </span>
          )}
          {product.salesCount >= 10 && (
            <span className="w-fit bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-xl border border-white/20 flex items-center gap-1">
              <Star size={10} className="fill-white" /> Best Seller
            </span>
          )}
          {discount > 0 && (
            <span className="w-fit bg-slate-950 text-white text-[9px] font-black px-2.5 py-1 rounded-md shadow-xl border border-white/20">
              -{discount}%
            </span>
          )}
        </div>

        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product._id); }}
          className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${isWished ? 'neu-pressed text-rose-500' : 'neu-button hover:text-rose-500'}`}
          style={isWished ? {} : { color: 'var(--color-neu-text)' }}
          aria-label={isWished ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Access HUD - Technical */}
        {!imageOnly && (
          <div className={`absolute bottom-4 left-4 right-4 neu-pressed rounded-2xl p-2 flex items-center justify-between opacity-100 translate-y-0 md:opacity-0 md:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 z-20`}>
              <div className="flex gap-1.5 pl-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">In Stock</span>
              </div>
              <div className="flex gap-1">
                  {onQuickView && (
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(product); }}
                        className="w-8 h-8 flex items-center justify-center rounded-xl neu-button transition-all"
                        style={{ color: 'var(--color-neu-text)' }}
                        aria-label="Quick View"
                    >
                        <Eye size={14} />
                    </button>
                  )}
                  {product.isCustomizable && onCustomize && (
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCustomize(product); }}
                        className="h-8 px-2.5 flex items-center gap-1.5 rounded-xl neu-button-accent transition-all group/design"
                        aria-label="Customize"
                    >
                        <Palette size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">Design</span>
                        <ArrowRight size={12} className="group-hover/design:translate-x-1 transition-transform" />
                    </button>
                  )}
                  <button 
                      onClick={handleAddToCart}
                      className="w-8 h-8 flex items-center justify-center rounded-xl neu-button-accent transition-all"
                      aria-label="Add to Transaction"
                  >
                      <ShoppingCart size={14} />
                  </button>
              </div>
          </div>
        )}
      </div>

      {/* 2. ULTRA-COMPACT DETAILS */}
      {!imageOnly && (
        <div className="p-3 md:p-4 flex flex-col z-20 relative" style={{ backgroundColor: 'transparent' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-accent)' }}>{product.category || 'Premium'}</span>
            <div className="flex items-center gap-0.5 text-slate-400">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-bold">{product.rating || '5.0'}</span>
            </div>
          </div>
          
          <h3 className="text-xs md:text-sm font-bold leading-tight truncate mb-2" style={{ color: 'var(--color-neu-text)' }}>
            {product.name}
          </h3>

          <div className="flex flex-col gap-1.5 mt-auto">
            {discount > 0 ? (
                <div className="flex items-baseline gap-1.5">
                    <span className="text-sm md:text-base font-black tracking-tight" style={{ color: 'var(--color-neu-text)' }}>
                        ₹{finalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] opacity-70 line-through font-semibold" style={{ color: 'var(--color-neu-text)' }}>
                        ₹{originalPrice.toLocaleString('en-IN')}
                    </span>
                </div>
            ) : (
                <span className="text-sm md:text-base font-black tracking-tight" style={{ color: 'var(--color-neu-text)' }}>
                    ₹{finalPrice.toLocaleString('en-IN')}
                </span>
            )}
            {product.isBulkEnabled && product.bulkRules?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Min: {product.bulkRules[0].minQty}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50/50 border border-emerald-100 px-1.5 py-0.5 rounded">
                        ₹{product.bulkRules[0].pricePerUnit}/Unit
                    </span>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;

