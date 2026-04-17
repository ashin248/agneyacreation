import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, ShoppingCart, Star, Palette, Building2 } from 'lucide-react';
import { FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import StarRating from './StarRating';

const ProductCard = ({ product, onCustomize, wishlist, toggleWishlist, addToCart, requireLogin }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const isWished = wishlist.includes(product._id);
  const images = product.galleryImages || product.images || [];
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
      className="group relative bg-white rounded-[24px] overflow-hidden transition-all duration-500 flex flex-col h-full border border-slate-100 hover:border-indigo-500/30 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] active:scale-[0.99]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 1. COMPACT MEDIA MODULE */}
      <div className="relative aspect-[4/4.5] overflow-hidden bg-slate-50 cursor-pointer group/media" onClick={() => navigate(`/product/${product._id}`)}>
        <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover/media:opacity-100 transition-opacity"></div>
        <img
          src={displayImg}
          alt={product.name}
          className="w-full h-full object-contain p-4 transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1"
          onError={e => { e.target.src = ''; }}
          loading="lazy"
          decoding="async"
        />

        {/* Dynamic HUD Overlays */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {product.badge && (
            <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg ${product.badge.color} text-white shadow-lg`}>
              {product.badge.label}
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
          className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-2xl backdrop-blur-xl shadow-sm flex items-center justify-center transition-all duration-500 border ${isWished ? 'bg-rose-500 text-white border-rose-400' : 'bg-white/80 text-slate-400 border-white hover:text-rose-500'}`}
          aria-label={isWished ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Access HUD - Technical */}
        <div className={`absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-2 flex items-center justify-between opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 border border-slate-100`}>
            <div className="flex gap-1.5 pl-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">In Stock</span>
            </div>
            <div className="flex gap-1">
                <button 
                    onClick={handleAddToCart}
                    className="w-8 h-8 flex items-center justify-center bg-indigo-50 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                    aria-label="Add to Transaction"
                >
                    <ShoppingCart size={14} />
                </button>
            </div>
        </div>
      </div>

      {/* 2. INDUSTRIAL SPECS MODULE */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-600">{product.category || 'GENERIC'}</span>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                <span className="text-[9px] font-black text-slate-500 font-mono italic">{product.rating || '5.0'}</span>
            </div>
          </div>
          <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tighter leading-[1.1] line-clamp-2 italic">
            {product.name}
          </h3>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-950 tracking-tighter font-mono">
              ₹{finalPrice.toLocaleString('en-IN')}
            </span>
            {discount > 0 && (
              <span className="text-[10px] text-slate-400 line-through font-black font-mono">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          
          {/* B2B Intelligence Layer - Minimalist Mobile Tweak */}
          <div className="hidden md:flex flex-col gap-1.5 mt-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ships in 24 Hours</span>
                </div>
                {product.isBulkEnabled && (
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Bulk Discount Available</span>
                )}
            </div>
            {product.isBulkEnabled && product.bulkRules?.length > 0 && (
                <div className="bg-emerald-50 p-2 rounded-lg flex items-center justify-between border border-emerald-100">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Save on <span className="text-emerald-700">{product.bulkRules[0].minQty}+</span> Units</span>
                    <span className="text-[9px] font-black text-emerald-600 font-mono italic">₹{product.bulkRules[0].pricePerUnit} OFF / UNIT</span>
                </div>
            )}
          </div>
        </div>

        {/* ACTION HUD removed per user request */}
      </div>
    </div>
  );
};

export default ProductCard;

