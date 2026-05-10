import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AddressForm from '../components/AddressForm';
import LoginModal from '../components/LoginModal';
import {
  MapPin, CheckCircle2, ShoppingBag, CreditCard,
  ShieldCheck, Plus, Trash2, Truck, ArrowRight, Lock, ChevronLeft
} from 'lucide-react';
import { calculateDetailedFinancials } from '../utils/pricingUtils';
import { loadRazorpay } from '../utils/razorpayLoader';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { currentUser, userData, setUserData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const buyNowItem = location.state?.buyNowItem;
  const buyNowItems = location.state?.buyNowItems;
  const checkoutItems = buyNowItems ? buyNowItems : (buyNowItem ? [buyNowItem] : cart);
  const isBuyNow = !!(buyNowItem || buyNowItems);

  const checkoutFinancials = checkoutItems.map(item => {
    return calculateDetailedFinancials(
      item.quantity || 1,
      item.unitPrice,
      item.bulkRules,
      item.isBulkEnabled,
      item.gstRate || 0
    );
  });

  const checkoutTotal = checkoutFinancials.reduce((acc, f) => acc + f.finalTotal, 0);
  const totalMRP = checkoutFinancials.reduce((acc, f) => acc + f.itemBaseTotal, 0);
  const totalDiscount = checkoutFinancials.reduce((acc, f) => acc + f.savings, 0);
  const checkoutTotalCount = checkoutItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const isCheckoutBulkOrder = checkoutTotalCount >= 20;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsGst, setNeedsGst] = useState(false);
  const [gstDetails, setGstDetails] = useState({ companyName: '', gstNumber: '' });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const tempCompany = localStorage.getItem('temp_company_name');
    const tempGst = localStorage.getItem('temp_gst_number');
    if (tempCompany || tempGst) {
      setNeedsGst(true);
      setGstDetails({ companyName: tempCompany || '', gstNumber: tempGst || '' });
      localStorage.removeItem('temp_company_name');
      localStorage.removeItem('temp_gst_number');
    }
    if (!currentUser) {
      setIsLoginModalOpen(true);
    } else if (userData) {
      const isIncomplete = !userData.name || !userData.email || !userData.addresses?.length;
      if (isIncomplete) setIsLoginModalOpen(true);
      if (userData.addresses?.length > 0) {
        setSelectedAddress(userData.addresses.find(a => a.isDefault) || userData.addresses[0]);
        setShowAddressForm(false);
      } else {
        setShowAddressForm(true);
      }
    }
  }, [currentUser, userData]);

  const handleAddressSave = async (addressData) => {
    try {
      if (userData) {
        const updated = [...(userData.addresses || []), { ...addressData, isDefault: !userData.addresses?.length }];
        const res = await axios.post('/api/public/update-user', {
          phone: currentUser.phoneNumber, name: addressData.name, email: addressData.email, addresses: updated
        });
        if (res.data.success) setUserData(res.data.data);
      }
      setSelectedAddress(addressData);
      setShowAddressForm(false);
    } catch (err) {
      console.error('Address save error:', err);
      setSelectedAddress(addressData);
      setShowAddressForm(false);
    }
  };

  const handleDeleteAddress = async (e, addressId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this address?')) return;
    try {
      const res = await axios.delete(`/api/public/user/address/${addressId}`, {
        data: { phone: currentUser.phoneNumber }
      });
      if (res.data.success) {
        setUserData(res.data.data);
        if (selectedAddress?._id === addressId) setSelectedAddress(null);
      }
    } catch (err) { console.error(err); }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return;
    setIsSubmitting(true);

    const orderData = {
      customer: {
        userId: userData?._id || null,
        name: selectedAddress.name || userData?.name,
        email: selectedAddress.email || userData?.email,
        phone: selectedAddress.mobile || userData?.phone,
        shippingAddress: `${selectedAddress.houseNo}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country || 'India'} - ${selectedAddress.pincode}`
      },
      items: checkoutItems.map(item => ({
        productId: item.productId, name: item.name, image: item.image,
        designImage: item.designImage, itemType: item.itemType || 'Ready',
        quantity: item.quantity, unitPrice: item.unitPrice,
        selectedVariation: item.selectedVariation, customData: item.customData || {}
      })),
      paymentMethod,
      paymentStatus: paymentMethod === 'online' && !isCheckoutBulkOrder ? 'Paid' : 'Pending',
      orderStatus: 'Pending',
      orderType: isCheckoutBulkOrder ? 'Bulk' : (checkoutItems.some(i => i.itemType === 'Custom') ? 'Custom' : 'Standard'),
      ...(needsGst && { gstDetails })
    };

    if (paymentMethod === 'online' && !isCheckoutBulkOrder) {
      setIsProcessingPayment(true);
      try {
        const rzpRes = await axios.post('/api/public/payment/razorpay-order', { amount: checkoutTotal });
        if (!rzpRes.data.success) throw new Error('Payment init failed');
        
        const isLoaded = await loadRazorpay();
        if (!isLoaded) {
          alert('Could not load Razorpay. Please check your internet connection.');
          setIsProcessingPayment(false);
          setIsSubmitting(false);
          return;
        }

        const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SUO6dQWJx2bid8';
        if (!rzpKey) {
          toast.error('Payment gateway configuration is missing. Please contact support.');
          console.error('[RAZORPAY] Error: VITE_RAZORPAY_KEY_ID is not defined in environment variables.');
          setIsProcessingPayment(false);
          setIsSubmitting(false);
          return;
        }

        const rzp = new window.Razorpay({
          key: rzpKey,
          amount: rzpRes.data.order.amount, currency: 'INR',
          name: 'Agneya', description: 'Order Checkout', order_id: rzpRes.data.order.id,
          handler: async (response) => {
            try {
              const verify = await axios.post('/api/public/payment/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              if (verify.data.success) {
                orderData.paymentDetails = response;
                const final = await axios.post('/api/public/orders', orderData);
                if (final.data.success) {
                  const newId = final.data.orderId;
                  setOrderId(newId); setOrderSuccess(true);
                  if (!isBuyNow) clearCart();
                  const hist = JSON.parse(localStorage.getItem('myGuestOrders') || '[]');
                  if (!hist.find(o => o.orderId === newId)) {
                    hist.push({ orderId: newId, phone: orderData.customer.phone });
                    localStorage.setItem('myGuestOrders', JSON.stringify(hist));
                  }
                }
              }
            } catch (err) { console.error(err); alert('Payment verification failed.'); }
            finally { setIsProcessingPayment(false); setIsSubmitting(false); }
          },
          prefill: { name: selectedAddress.name || userData?.name, email: selectedAddress.email || userData?.email, contact: selectedAddress.mobile || userData?.phone },
          theme: { color: '#4A5FD4' }
        });
        rzp.open(); return;
      } catch (err) { console.error(err); setIsProcessingPayment(false); setIsSubmitting(false); return; }
    }

    try {
      const res = await axios.post('/api/public/orders', orderData);
      if (res.data.success) {
        const newId = res.data.orderId;
        setOrderId(newId); setOrderSuccess(true);
        if (!isBuyNow) clearCart();
        const hist = JSON.parse(localStorage.getItem('myGuestOrders') || '[]');
        if (!hist.find(o => o.orderId === newId)) {
          hist.push({ orderId: newId, phone: orderData.customer.phone });
          localStorage.setItem('myGuestOrders', JSON.stringify(hist));
        }
      }
    } catch (err) { console.error(err); alert('Failed to place order.'); }
    finally { setIsSubmitting(false); }
  };

  /* ── ORDER SUCCESS ── */
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
        <div className="neu-flat p-10 md:p-14 text-center max-w-md w-full">
          <div className="relative w-20 h-20 mx-auto mb-10">
            <div className="absolute inset-0 bg-emerald-500 opacity-20 blur-xl rounded-full animate-pulse" />
            <div className="relative w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4" style={{ color: 'var(--color-neu-text)' }}>Order Confirmed</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest leading-loose mb-10 opacity-50" style={{ color: 'var(--color-neu-text)' }}>
            Your order <span className="font-black" style={{ color: 'var(--color-neu-accent)' }}>#{orderId}</span> has been placed. A confirmation message is on its way.
          </p>
          <button onClick={() => navigate('/')} className="w-full py-5 neu-button-accent font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98]">
            <ShoppingBag size={18} /> Continue Shopping
          </button>
          <button onClick={() => navigate('/track-order')} className="w-full mt-6 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-neu-text)' }}>
            Track Your Shipment →
          </button>
        </div>
      </div>
    );
  }

  /* ── EMPTY CART ── */
  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100 max-w-sm w-full">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100">
            <ShoppingBag size={24} className="text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Nothing to checkout</h2>
          <p className="text-sm text-slate-400 mb-7">Your cart is empty.</p>
          <button onClick={() => navigate('/')} className="w-full py-3.5 text-white rounded-2xl font-semibold text-sm hover:opacity-90 transition-all shadow-md shadow-indigo-100" style={{ background: 'linear-gradient(135deg, #4A5FD4, #0EA5E9)' }}>
            Go Shopping
          </button>
        </div>
      </div>
    );
  }

  const canCheckout = selectedAddress && !isSubmitting && !isProcessingPayment &&
    (!needsGst || (gstDetails.companyName && gstDetails.gstNumber));

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => { setIsLoginModalOpen(false); navigate(-1); }} onLoginSuccess={() => setIsLoginModalOpen(false)} />

      {/* ── PROGRESS HEADER ── */}
      <div className="sticky top-16 md:top-[70px] z-40 bg-[var(--color-neu-bg)] border-b border-[var(--color-neu-dark)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 neu-button flex items-center justify-center" style={{ color: 'var(--color-neu-text)' }}>
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            {[
              { n: 1, label: 'Cart', done: true },
              { n: 2, label: 'Checkout', active: true },
              { n: 3, label: 'Done', dim: true }
            ].map(({ n, label, done, active, dim }) => (
              <React.Fragment key={n}>
                {n > 1 && <div className="w-6 h-px opacity-20" style={{ background: 'var(--color-neu-text)' }} />}
                <div className={`flex items-center gap-2 ${dim ? 'opacity-20' : ''}`}>
                  <span className={`w-8 h-8 rounded-full text-[11px] font-black flex items-center justify-center transition-all ${done ? 'bg-emerald-500 text-white' : active ? 'neu-button-accent' : 'neu-button'}`} style={active ? {} : { color: 'var(--color-neu-text)' }}>{n}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:inline ${active ? 'opacity-100' : 'opacity-40'}`} style={{ color: 'var(--color-neu-text)' }}>{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── LEFT: FORMS ── */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter" style={{ color: 'var(--color-neu-text)' }}>Secure Checkout</h1>
              <p className="text-sm font-medium mt-1 opacity-50 flex items-center gap-2" style={{ color: 'var(--color-neu-text)' }}>
                <Lock size={12} style={{ color: 'var(--color-neu-accent)' }} />
                End-to-End Encrypted · {currentUser?.phoneNumber}
              </p>
            </div>

            {/* Shipping */}
            <section className="neu-flat overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-neu-dark)]">
                <h2 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2" style={{ color: 'var(--color-neu-text)' }}>
                  <MapPin size={16} style={{ color: 'var(--color-neu-accent)' }} /> Delivery Address
                </h2>
                {selectedAddress && !showAddressForm && (
                  <button onClick={() => setShowAddressForm(true)} className="text-[10px] font-black uppercase tracking-widest transition-opacity hover:opacity-70" style={{ color: 'var(--color-neu-accent)' }}>
                    Modify
                  </button>
                )}
              </div>

              <div className="p-5">
                {userData?.addresses?.length > 0 && !showAddressForm ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {userData.addresses.map((addr, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedAddress(addr)}
                        className={`relative p-4 neu-button transition-all group ${selectedAddress === addr ? 'neu-pressed' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-40 neu-pressed px-2 py-0.5 rounded-md" style={{ color: 'var(--color-neu-text)' }}>{addr.type || 'Home'}</span>
                          <div className={`w-5 h-5 rounded-full neu-pressed flex items-center justify-center flex-shrink-0 transition-all ${selectedAddress === addr ? 'bg-emerald-500 border-none' : ''}`}>
                            {selectedAddress === addr && <CheckCircle2 size={11} className="text-white" />}
                          </div>
                        </div>
                        <p className="text-sm font-black uppercase tracking-tight" style={{ color: 'var(--color-neu-text)' }}>{addr.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-1 leading-relaxed" style={{ color: 'var(--color-neu-text)' }}>{addr.houseNo}, {addr.area}, {addr.city} — {addr.pincode}</p>
                        <p className="text-[10px] font-black mt-2" style={{ color: 'var(--color-neu-accent)' }}>{addr.mobile}</p>
                        <button
                          onClick={e => handleDeleteAddress(e, addr._id)}
                          className="absolute bottom-3 right-3 p-1.5 text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => { setSelectedAddress(null); setShowAddressForm(true); }}
                      className="p-4 neu-pressed border-dashed border-[var(--color-neu-dark)] flex flex-col items-center justify-center gap-2 opacity-40 hover:opacity-100 transition-all min-h-[120px]"
                      style={{ color: 'var(--color-neu-text)' }}
                    >
                      <Plus size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">New Address</span>
                    </button>
                  </div>
                ) : (
                  <AddressForm initialData={selectedAddress} onSave={handleAddressSave} />
                )}
              </div>
            </section>

            {/* Payment */}
            <section className="neu-flat overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--color-neu-dark)]">
                <h2 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2" style={{ color: 'var(--color-neu-text)' }}>
                  <CreditCard size={16} style={{ color: 'var(--color-neu-accent)' }} /> Payment Method
                </h2>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setPaymentMethod('online')}
                  className={`p-5 neu-button transition-all flex items-center gap-4 ${paymentMethod === 'online' ? 'neu-pressed' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${paymentMethod === 'online' ? 'neu-button-accent text-white' : 'neu-pressed opacity-40'}`} style={paymentMethod === 'online' ? {} : { color: 'var(--color-neu-text)' }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black uppercase tracking-tight" style={{ color: 'var(--color-neu-text)' }}>Online Payment</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>UPI, Cards, Wallets</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full neu-pressed flex-shrink-0 flex items-center justify-center ${paymentMethod === 'online' ? 'bg-emerald-500' : ''}`}>
                    {paymentMethod === 'online' && <CheckCircle2 size={11} className="text-white" />}
                  </div>
                </div>
                <div className="p-5 neu-pressed opacity-20 cursor-not-allowed flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl neu-pressed flex items-center justify-center flex-shrink-0" style={{ color: 'var(--color-neu-text)' }}>
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight" style={{ color: 'var(--color-neu-text)' }}>Cash on Delivery</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>Coming Soon</p>
                  </div>
                </div>
              </div>
            </section>

            {/* GST */}
            <section className="neu-flat p-5">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div onClick={() => setNeedsGst(!needsGst)} className={`w-6 h-6 rounded-lg neu-pressed flex items-center justify-center transition-all ${needsGst ? 'bg-[var(--color-neu-accent)]' : 'opacity-40'}`}>
                  {needsGst && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-neu-text)' }}>Request Business GST Invoice</span>
              </label>
              {needsGst && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-[var(--color-neu-dark)]">
                  {[
                    { label: 'Company Name', key: 'companyName', placeholder: 'Legal entity name' },
                    { label: 'GSTIN', key: 'gstNumber', placeholder: '15-digit GSTIN' }
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block" style={{ color: 'var(--color-neu-text)' }}>{label}</label>
                      <input
                        type="text"
                        value={gstDetails[key]}
                        onChange={e => setGstDetails(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full neu-input rounded-xl px-4 py-3 text-xs font-bold outline-none"
                        style={{ color: 'var(--color-neu-text)' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── RIGHT: SUMMARY ── */}
          <div className="lg:col-span-5">
            <aside className="neu-flat p-6 sticky top-24 md:top-[130px]">
              <h2 className="text-base font-bold text-slate-900 mb-5">Order Summary</h2>

              <div className="space-y-3 max-h-64 overflow-y-auto mb-6 pr-1">
                {checkoutItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3 neu-pressed rounded-xl">
                    <div className="w-14 h-16 neu-button rounded-lg overflow-hidden flex-shrink-0">
                      <img loading="lazy" src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase tracking-tight leading-tight truncate" style={{ color: 'var(--color-neu-text)' }}>{item.name}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {item.selectedVariation?.size && (
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-40 neu-pressed px-1.5 py-0.5 rounded-md" style={{ color: 'var(--color-neu-text)' }}>{item.selectedVariation.size}</span>
                        )}
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40 neu-pressed px-1.5 py-0.5 rounded-md" style={{ color: 'var(--color-neu-text)' }}>Qty {item.quantity}</span>
                        {item.itemType === 'Custom' && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-neu-accent)] neu-pressed px-1.5 py-0.5 rounded-md">Custom</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-black flex-shrink-0" style={{ color: 'var(--color-neu-text)' }}>
                      ₹{(item.unitPrice * (item.quantity || 1)).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 pt-5 border-t border-[var(--color-neu-dark)] mb-8">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>
                  <span>Subtotal ({checkoutTotalCount} items)</span>
                  <span className="opacity-100">₹{totalMRP.toLocaleString('en-IN')}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    <span>Savings</span>
                    <span>−₹{totalDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-black">FREE</span>
                </div>
                <div className="flex justify-between items-end pt-5 border-t border-[var(--color-neu-dark)]">
                  <span className="text-sm font-black uppercase tracking-tighter" style={{ color: 'var(--color-neu-text)' }}>Payable Amount</span>
                  <span className="text-3xl font-black tracking-tighter" style={{ color: 'var(--color-neu-accent)' }}>₹{checkoutTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={!canCheckout}
                className={`w-full py-5 neu-button-accent font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98] ${
                  !canCheckout ? 'opacity-20 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting || isProcessingPayment ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                ) : (
                  <>{isCheckoutBulkOrder ? 'Submit Bulk Order' : 'Place Order'} <ArrowRight size={18} /></>
                )}
              </button>

              {!selectedAddress && (
                <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 text-center mt-3">
                  Please select delivery address
                </p>
              )}

              <p className="text-[10px] font-black uppercase tracking-widest opacity-20 text-center mt-5 flex items-center justify-center gap-2" style={{ color: 'var(--color-neu-text)' }}>
                <CheckCircle2 size={12} style={{ color: 'var(--color-neu-accent)' }} /> Secure Checkout Active
              </p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
