import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import toast from 'react-hot-toast';
import { Trash2, Edit3, Box, ArrowRight, CheckCircle, ShoppingBag } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100 max-w-sm w-full">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <ShoppingBag size={28} className="text-slate-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-sm text-slate-400 mb-8">Looks like you haven't added anything yet.</p>
          <Link
            to="/"
            className="block w-full py-4 text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg"
            style={{ background: 'linear-gradient(135deg, #F7941D, #7B1760)' }}
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

    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-5 hover:shadow-md transition-shadow duration-200">
        <div className="flex gap-4">
          {/* Image */}
          <div className="w-20 h-24 md:w-24 md:h-28 flex-shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
            <img loading="lazy" src={item.image} alt={item.name} className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">{item.name}</h3>
                {item.itemType === 'Custom' && (
                  <span className="inline-block mt-1 text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                    {item.customData?.mode === 'manual' ? 'Manual Brief' : 'Studio Design'}
                  </span>
                )}
              </div>
              <button
                onClick={() => removeFromCart(item.productId, variationSku)}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                SKU: {variationSku}
              </span>
              {item.selectedVariation?.size && (
                <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                  Size: {item.selectedVariation.size}
                </span>
              )}
              {item.gstRate > 0 && (
                <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                  +{item.gstRate}% GST
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
              {/* Quantity */}
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white h-9">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1, variationSku)}
                  className="w-9 h-full flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-all border-r border-slate-100 text-base"
                >
                  −
                </button>
                <span className="w-10 h-full flex items-center justify-center text-slate-900 font-bold text-sm">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1, variationSku)}
                  className="w-9 h-full flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-all border-l border-slate-100 text-base"
                >
                  +
                </button>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">₹{financials.finalTotal.toLocaleString('en-IN')}</p>
                {financials.savings > 0 && (
                  <p className="text-[10px] font-semibold text-emerald-600">
                    Saved ₹{financials.savings.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Shopping Cart</h1>
            <p className="text-sm text-slate-400 mt-1">{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>
          </div>
          <button
            onClick={() => { if (window.confirm('Clear your entire cart?')) clearCart(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-rose-500 rounded-xl text-sm font-semibold hover:bg-rose-50 hover:border-rose-200 transition-all"
          >
            <Trash2 size={15} /> Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* ── ITEM LISTS ── */}
          <div className="xl:col-span-8 space-y-6">

            {customItems.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                    <Edit3 size={16} />
                  </div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Custom Designs</h2>
                </div>
                <div className="space-y-3">
                  {customItems.map(item => (
                    <CartItemRow key={item.productId + (item.selectedVariation?.sku || '')} item={item} />
                  ))}
                </div>
              </div>
            )}

            {readyMadeItems.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Box size={16} />
                  </div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Ready-Made Products</h2>
                </div>
                <div className="space-y-3">
                  {readyMadeItems.map(item => (
                    <CartItemRow key={item.productId + (item.selectedVariation?.sku || '')} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── ORDER SUMMARY ── */}
          <div className="xl:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">

              {/* Order type badge */}
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-2.5 h-2.5 rounded-full ${isBulkOrder ? 'bg-orange-500 animate-pulse' : 'bg-emerald-400'}`} />
                <span className="text-xs font-semibold text-slate-500">
                  {isBulkOrder ? 'Wholesale / Bulk Order' : 'Standard Order'}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 mb-5">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Taxable Subtotal</span>
                  <span className="font-semibold text-slate-800">₹{totalTaxable.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>GST</span>
                  <span className="font-semibold text-slate-800">+₹{totalTax.toLocaleString('en-IN')}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="font-semibold">Bulk Savings</span>
                    <span className="font-semibold">−₹{totalSavings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Shipping</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-black tracking-tight" style={{ color: '#F7941D' }}>
                      ₹{cartTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* GST / Company fields */}
              <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-3">
                <label
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setIsIndividual(!isIndividual)}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isIndividual ? 'bg-orange-600 border-orange-600' : 'border-slate-300 bg-white'}`}>
                    {isIndividual && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Individual order (no GST)</span>
                </label>

                {!isIndividual && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="Company Name *"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none"
                    />
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={e => setGstNumber(e.target.value)}
                      placeholder="GST Number (15 digits) *"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-4 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #F7941D, #7B1760)' }}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>

              <p className="text-[11px] text-slate-400 text-center mt-3">
                🔒 Safe and encrypted checkout
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
