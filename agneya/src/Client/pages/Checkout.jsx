import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AddressForm from '../components/AddressForm';
import LoginModal from '../components/LoginModal';
import {
  MapPin, CheckCircle2, ShoppingBag, CreditCard,
  ShieldCheck, Plus, Trash2, Truck, ArrowRight, Lock, ChevronLeft
} from 'lucide-react';
import { calculateDetailedFinancials } from '../utils/pricingUtils';

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
        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
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
          theme: { color: '#4f46e5' }
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-10 md:p-14 text-center shadow-sm border border-slate-100 max-w-md w-full">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30" />
            <div className="relative w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Order Confirmed!</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            Your order <span className="text-indigo-600 font-bold">#{orderId}</span> has been placed successfully. A confirmation will be sent to your phone.
          </p>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg">
            <ShoppingBag size={16} /> Continue Shopping
          </button>
          <button onClick={() => navigate('/track-order')} className="w-full mt-3 py-3 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
            Track Your Order →
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
          <button onClick={() => navigate('/')} className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-sm hover:bg-indigo-700 transition-all">
            Go Shopping
          </button>
        </div>
      </div>
    );
  }

  const canCheckout = selectedAddress && !isSubmitting && !isProcessingPayment &&
    (!needsGst || (gstDetails.companyName && gstDetails.gstNumber));

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <LoginModal isOpen={isLoginModalOpen} onClose={() => { setIsLoginModalOpen(false); navigate(-1); }} onLoginSuccess={() => setIsLoginModalOpen(false)} />

      {/* ── PROGRESS HEADER ── */}
      <div className="sticky top-16 md:top-[70px] z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeft size={18} />
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-3">
            {[
              { n: 1, label: 'Cart', done: true },
              { n: 2, label: 'Checkout', active: true },
              { n: 3, label: 'Done', dim: true }
            ].map(({ n, label, done, active, dim }) => (
              <React.Fragment key={n}>
                {n > 1 && <div className="w-8 h-px bg-slate-200" />}
                <div className={`flex items-center gap-2 ${dim ? 'opacity-30' : ''}`}>
                  <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${done ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{n}</span>
                  <span className={`text-xs font-semibold hidden sm:inline ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── LEFT: FORMS ── */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Checkout</h1>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <Lock size={12} className="text-emerald-500" />
                Secure checkout · {currentUser?.phoneNumber}
              </p>
            </div>

            {/* Shipping */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin size={16} className="text-indigo-600" /> Delivery Address
                </h2>
                {selectedAddress && !showAddressForm && (
                  <button onClick={() => setShowAddressForm(true)} className="text-xs font-semibold text-indigo-600 hover:underline">
                    Change
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
                        className={`relative p-4 rounded-xl border-2 cursor-pointer group transition-all ${selectedAddress === addr ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md uppercase">{addr.type || 'Home'}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedAddress === addr ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                            {selectedAddress === addr && <CheckCircle2 size={11} className="text-white" />}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{addr.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{addr.houseNo}, {addr.area}, {addr.city} — {addr.pincode}</p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">{addr.mobile}</p>
                        <button
                          onClick={e => handleDeleteAddress(e, addr._id)}
                          className="absolute bottom-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => { setSelectedAddress(null); setShowAddressForm(true); }}
                      className="p-4 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all min-h-[120px]"
                    >
                      <Plus size={18} />
                      <span className="text-xs font-semibold">Add New Address</span>
                    </button>
                  </div>
                ) : (
                  <AddressForm initialData={selectedAddress} onSave={handleAddressSave} />
                )}
              </div>
            </section>

            {/* Payment */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-indigo-600" /> Payment Method
                </h2>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setPaymentMethod('online')}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${paymentMethod === 'online' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${paymentMethod === 'online' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <ShieldCheck size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">Online Payment</p>
                    <p className="text-[10px] text-slate-400">UPI, Cards, Wallets, NetBanking</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === 'online' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                    {paymentMethod === 'online' && <CheckCircle2 size={11} className="text-white" />}
                  </div>
                </div>
                <div className="p-4 rounded-xl border-2 border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500">Cash on Delivery</p>
                    <p className="text-[10px] text-slate-400">Currently unavailable</p>
                  </div>
                </div>
              </div>
            </section>

            {/* GST */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox" checked={needsGst}
                  onChange={e => setNeedsGst(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer rounded"
                />
                <span className="text-sm font-semibold text-slate-700">Request GST Invoice (optional)</span>
              </label>
              {needsGst && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-50">
                  {[
                    { label: 'Company Name', key: 'companyName', placeholder: 'Legal entity name' },
                    { label: 'GSTIN', key: 'gstNumber', placeholder: 'GSTIN (15 characters)' }
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{label}</label>
                      <input
                        type="text"
                        value={gstDetails[key]}
                        onChange={e => setGstDetails(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── RIGHT: SUMMARY ── */}
          <div className="lg:col-span-5">
            <aside className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24 md:top-[130px]">
              <h2 className="text-base font-bold text-slate-900 mb-5">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto mb-5 pr-1">
                {checkoutItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-14 h-16 bg-white rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                      <img loading="lazy" src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight truncate">{item.name}</p>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {item.selectedVariation?.size && (
                          <span className="text-[10px] bg-white border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">{item.selectedVariation.size}</span>
                        )}
                        <span className="text-[10px] bg-white border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">Qty {item.quantity}</span>
                        {item.itemType === 'Custom' && (
                          <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md font-semibold">Custom</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-900 flex-shrink-0">
                      ₹{(item.unitPrice * (item.quantity || 1)).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100 mb-5">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal ({checkoutTotalCount} items)</span>
                  <span className="font-medium text-slate-800">₹{totalMRP.toLocaleString('en-IN')}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="font-semibold">Savings</span>
                    <span className="font-semibold">−₹{totalDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Shipping</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between items-end pt-3 border-t border-slate-200">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-black text-indigo-600 tracking-tight">₹{checkoutTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={!canCheckout}
                className={`w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] ${
                  canCheckout
                    ? 'bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-100'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting || isProcessingPayment ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                ) : (
                  <>{isCheckoutBulkOrder ? 'Submit Bulk Order' : 'Place Order'} <ArrowRight size={16} /></>
                )}
              </button>

              {!selectedAddress && (
                <p className="text-[11px] text-amber-500 text-center mt-2 font-medium">
                  Please select a delivery address to continue.
                </p>
              )}

              <p className="text-[11px] text-slate-400 text-center mt-3 flex items-center justify-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500" /> Guaranteed safe checkout
              </p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
