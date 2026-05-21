import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import PhoneCoverPreview from '../components/PhoneCoverPreview';
import toast from 'react-hot-toast';
import { Trash2, Edit3, Box, ArrowRight, CheckCircle, ShoppingBag } from 'lucide-react';

const Workspace3D = React.lazy(() => import('../components/Studio/components/Workspace3D'));

const Cart = () => {
  const {
    cart, removeFromCart, updateQuantity,
    cartTotal, totalSavings, totalTax, totalTaxable,
    isBulkOrder, clearCart, calculateItemFinancials
  } = useCart();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isIndividual, setIsIndividual] = useState(!(userData?.gstNumber || userData?.companyName));
  const [companyName, setCompanyName] = useState(userData?.companyName || '');
  const [gstNumber, setGstNumber] = useState(userData?.gstNumber || '');

  const customItems = cart.filter(i => i.itemType === 'Custom');
  const readyMadeItems = cart.filter(i => i.itemType === 'Ready');

  const handleCheckout = () => {
    // Save state temporarily in localStorage so it's not lost on redirect or login
    localStorage.setItem('temp_is_individual', JSON.stringify(isIndividual));
    localStorage.setItem('temp_company_name', companyName);
    localStorage.setItem('temp_gst_number', gstNumber);

    if (!currentUser) return setIsLoginModalOpen(true);
    if (!isIndividual) {
      if (!companyName.trim()) return toast.error('Company name is required for business orders.');
      if (!gstNumber.trim()) return toast.error('GST number is required for business orders.');
      if (gstNumber.length < 15) return toast.error('GST number must be 15 digits.');
    }
    navigate('/checkout', {
      state: {
        companyName: isIndividual ? (userData?.name || currentUser.displayName || 'Individual Customer') : companyName,
        gstNumber: isIndividual ? 'N/A' : gstNumber,
        isIndividual
      }
    });
  };

  /* ── EMPTY STATE ── */
  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
        <div className="neu-flat p-10 text-center max-w-sm w-full">
          <div className="w-20 h-20 neu-pressed rounded-full flex items-center justify-center mx-auto mb-10">
            <ShoppingBag size={28} className="opacity-20" style={{ color: 'var(--color-neu-text)' }} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4" style={{ color: 'var(--color-neu-text)' }}>Cart is Empty</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-10 opacity-40" style={{ color: 'var(--color-neu-text)' }}>Looks like you haven't added anything yet.</p>
          <Link
            to="/"
            className="block w-full py-5 neu-button-accent text-white text-xs font-black uppercase tracking-[0.2em] transition-all"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  /* ── CART ITEM ROW ── */
  const CartItemRow = ({ item }) => {
    const variationSku = item.selectedVariation?.sku || 'standard';
    const variantModifier = item.selectedVariation?.priceModifier || 0;
    const baseUnitPrice = item.unitPrice + variantModifier;
    const financials = calculateItemFinancials(item);
    const isCustom = item.itemType === 'Custom' && item.customData;

    return (
      <div className="neu-button p-4 md:p-5 group hover:neu-pressed transition-all">
        <div className="flex gap-4">
          {/* Image */}
          <div className="w-20 h-24 md:w-24 md:h-28 flex-shrink-0 neu-pressed rounded-xl overflow-hidden flex items-center justify-center">
            <PhoneCoverPreview 
              phoneMask={item.customData?.phoneMask} 
              designImage={item.image} 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black uppercase tracking-tight truncate leading-tight" style={{ color: 'var(--color-neu-text)' }}>{item.name}</h3>
                {item.itemType === 'Custom' && (
                  <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest text-[var(--color-neu-accent)] neu-pressed px-2.5 py-1 rounded-md">
                    {item.customData?.mode === 'manual' ? 'Manual Brief' : 'Studio Design'}
                  </span>
                )}
              </div>
              <button
                onClick={() => removeFromCart(item.productId, variationSku)}
                className="w-8 h-8 flex items-center justify-center text-rose-500 neu-pressed hover:bg-rose-50 transition-all flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40 neu-pressed px-2.5 py-1 rounded-md" style={{ color: 'var(--color-neu-text)' }}>
                SKU: {variationSku}
              </span>
              {item.selectedVariation?.size && (
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40 neu-pressed px-2.5 py-1 rounded-md" style={{ color: 'var(--color-neu-text)' }}>
                  Size: {item.selectedVariation.size}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-neu-dark)]">
              {/* Quantity */}
              <div className="flex items-center neu-pressed rounded-xl overflow-hidden h-9">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1, variationSku)}
                  className="w-9 h-full flex items-center justify-center transition-all border-r border-[var(--color-neu-dark)] text-base font-black"
                  style={{ color: 'var(--color-neu-text)' }}
                >
                  −
                </button>
                <span className="w-10 h-full flex items-center justify-center font-black text-xs" style={{ color: 'var(--color-neu-text)' }}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1, variationSku)}
                  className="w-9 h-full flex items-center justify-center transition-all border-l border-[var(--color-neu-dark)] text-base font-black"
                  style={{ color: 'var(--color-neu-text)' }}
                >
                  +
                </button>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="text-lg font-black" style={{ color: 'var(--color-neu-text)' }}>₹{financials.finalTotal.toLocaleString('en-IN')}</p>
                {financials.savings > 0 && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    Saved ₹{financials.savings.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>

            {isCustom && (
              <div className="mt-4 pt-4 border-t border-[var(--color-neu-dark)] space-y-4">
                
                {/* Customise Design Preview */}
                <div className="space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-[var(--color-neu-accent)] flex items-center justify-between">
                    <span>Customised Design Preview</span>
                    <span className="text-[8px] opacity-50 uppercase tracking-tighter">
                      {item.customData.designSource === 'DESIGN_ASSISTANCE' ? 'Design Assistance' : item.customData.designSource === '3D_STUDIO' ? '3D Studio' : '2D Studio'}
                    </span>
                  </div>
                  
                  {item.customData.designSource === '3D_STUDIO' ? (
                    <div className="w-full aspect-square max-h-64 rounded-2xl overflow-hidden relative neu-pressed border border-[var(--color-neu-dark)] flex items-center justify-center group/3d">
                      <React.Suspense fallback={<div className="text-[10px] font-bold text-slate-400 animate-pulse">Loading 3D Engine...</div>}>
                        <Workspace3D 
                          product={{ 
                            baseModelId: item.customData.baseModelId, 
                            model3d: item.customData.model3d, 
                            base3DModelUrl: item.customData.model3d, 
                            category: item.customData.category, 
                            printableMeshes: item.customData.printableMeshes, 
                            projectionType: item.customData.projectionType 
                          }} 
                          objectAnchors={item.customData.objectAnchors || {}} 
                          canvasObjects={item.customData.canvasObjects || []} 
                          activeStudioTab="3D_STUDIO" 
                        />
                      </React.Suspense>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[8px] font-black px-2 py-1 rounded-lg pointer-events-none uppercase tracking-widest backdrop-blur-sm border border-white/10 shadow-lg z-20">360° Interactive Preview</div>
                    </div>
                  ) : item.customData?.customizedDesigns?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {item.customData.customizedDesigns.map((design, dIdx) => (
                        <div key={dIdx} className="neu-pressed rounded-xl p-2 relative group/design">
                          <PhoneCoverPreview 
                            phoneMask={item.customData?.phoneMask} 
                            designImage={design.url} 
                            className="w-full aspect-square object-contain rounded-lg"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-md p-1.5 opacity-0 group-hover/design:opacity-100 transition-opacity rounded-b-lg">
                            <p className="text-[8px] font-black uppercase tracking-widest text-white text-center truncate">{design.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full aspect-square max-h-40 rounded-xl neu-pressed flex items-center justify-center">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-20" style={{ color: 'var(--color-neu-text)' }}>No preview available</span>
                    </div>
                  )}
                </div>

                {/* Attributes: Size & Color */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="neu-pressed rounded-xl p-3 flex flex-col justify-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-neu-accent)] mb-1">Size</span>
                    <span className="text-xs font-black uppercase tracking-tight" style={{ color: 'var(--color-neu-text)' }}>
                      {item.customData?.selectedSize || item.selectedVariation?.size || 'Standard'}
                    </span>
                  </div>
                  <div className="neu-pressed rounded-xl p-3 flex flex-col justify-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-neu-accent)] mb-1">Color</span>
                    <div className="flex items-center gap-2">
                      {item.customData?.selectedColor && item.customData.selectedColor !== '-' && item.customData.selectedColor !== 'Standard' && (
                        <span className="w-3.5 h-3.5 rounded-full border border-[var(--color-neu-dark)] shadow-sm inline-block flex-shrink-0" style={{ backgroundColor: item.customData.selectedColor.toLowerCase() }} />
                      )}
                      <span className="text-xs font-black uppercase tracking-tight truncate" style={{ color: 'var(--color-neu-text)' }}>
                        {item.customData?.selectedColor || item.selectedVariation?.color || 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Used Images */}
                <div className="pt-2 border-t border-[var(--color-neu-dark)] space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-[var(--color-neu-accent)]">Used Images / Assets</div>
                  {item.customData?.usedImages?.length > 0 || item.customData?.manualAttachments?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(item.customData?.usedImages || item.customData?.manualAttachments || []).map((img, imgIdx) => {
                        const url = typeof img === 'string' ? img : img.url;
                        return (
                          <a key={imgIdx} href={url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl overflow-hidden neu-button p-1 group/asset">
                            <img src={url} alt={`used-asset-${imgIdx}`} className="w-full h-full object-cover rounded-lg group-hover/asset:scale-110 transition-transform" />
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold italic opacity-40" style={{ color: 'var(--color-neu-text)' }}>No external images uploaded.</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter" style={{ color: 'var(--color-neu-text)' }}>Shopping Cart</h1>
            <p className="text-sm font-medium mt-1 opacity-50" style={{ color: 'var(--color-neu-text)' }}>{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>
          </div>
          <button
            onClick={() => { if (window.confirm('Clear your entire cart?')) clearCart(); }}
            className="flex items-center gap-2 px-4 py-2.5 neu-button text-rose-500 text-[10px] font-black uppercase tracking-widest hover:neu-pressed transition-all"
          >
            <Trash2 size={14} /> Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* ── ITEM LISTS ── */}
          <div className="xl:col-span-8 space-y-6">

            {customItems.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl neu-button flex items-center justify-center text-[var(--color-neu-accent)]">
                    <Edit3 size={18} />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--color-neu-text)' }}>Custom Projects</h2>
                </div>
                <div className="space-y-4">
                  {customItems.map(item => (
                    <CartItemRow key={item.productId + (item.selectedVariation?.sku || '')} item={item} />
                  ))}
                </div>
              </div>
            )}

            {readyMadeItems.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl neu-button flex items-center justify-center text-emerald-500">
                    <Box size={18} />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--color-neu-text)' }}>Ready-to-Ship</h2>
                </div>
                <div className="space-y-4">
                  {readyMadeItems.map(item => (
                    <CartItemRow key={item.productId + (item.selectedVariation?.sku || '')} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── ORDER SUMMARY ── */}
          <div className="xl:col-span-4">
            <div className="neu-flat p-6 sticky top-24">

               <div className="flex items-center gap-2 mb-8">
                <div className={`w-2.5 h-2.5 rounded-full ${isBulkOrder ? 'bg-[var(--color-neu-accent)] animate-pulse shadow-[0_0_10px_var(--color-neu-accent)]' : 'bg-emerald-400'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--color-neu-text)' }}>
                  {isBulkOrder ? 'Wholesale / Bulk Order' : 'Standard Order'}
                </span>
              </div>

              <h2 className="text-base font-black uppercase tracking-tighter mb-6" style={{ color: 'var(--color-neu-text)' }}>Order Summary</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--color-neu-text)' }}>
                  <span>Taxable Subtotal</span>
                  <span className="opacity-100">₹{totalTaxable.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--color-neu-text)' }}>
                  <span>GST</span>
                  <span className="opacity-100">+₹{totalTax.toLocaleString('en-IN')}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    <span>Bulk Savings</span>
                    <span>−₹{totalSavings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--color-neu-text)' }}>
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-black">FREE</span>
                </div>

                <div className="pt-5 border-t border-[var(--color-neu-dark)]">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-black uppercase tracking-tighter" style={{ color: 'var(--color-neu-text)' }}>Total Amount</span>
                    <span className="text-3xl font-black tracking-tighter" style={{ color: 'var(--brand-price)' }}>
                      ₹{cartTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* GST / Company fields */}
              <div className="neu-pressed p-5 mb-8 space-y-4">
                <label
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setIsIndividual(!isIndividual)}
                >
                  <div className={`w-6 h-6 rounded-lg neu-pressed flex items-center justify-center transition-all ${isIndividual ? 'shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)] bg-[var(--brand-primary)] border-none' : 'opacity-40 group-hover:opacity-100'}`}>
                    {isIndividual && <CheckCircle size={14} className="text-white" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-neu-text)' }}>Individual (No GST)</span>
                </label>

                {!isIndividual && (
                  <div className="space-y-3 pt-2">
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="Company Name *"
                      className="w-full neu-input rounded-xl px-4 py-3 text-xs font-bold outline-none"
                      style={{ color: 'var(--color-neu-text)' }}
                    />
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={e => setGstNumber(e.target.value)}
                      placeholder="GST Number *"
                      className="w-full neu-input rounded-xl px-4 py-3 text-xs font-bold outline-none"
                      style={{ color: 'var(--color-neu-text)' }}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleCheckout}
                className="w-full btn-primary py-4 flex items-center justify-center gap-3 active:scale-[0.98] text-sm"
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>

              <p className="text-[10px] font-black uppercase tracking-widest opacity-20 text-center mt-5" style={{ color: 'var(--color-neu-text)' }}>
                🔒 Secure Encryption Active
              </p>
            </div>
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => navigate('/checkout')}
      />
    </div>
  );
};

export default Cart;
