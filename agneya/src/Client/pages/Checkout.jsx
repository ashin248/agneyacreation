import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AddressForm from '../components/AddressForm';
import LoginModal from '../components/LoginModal';
import { 
    MapPin, 
    CheckCircle2, 
    ShoppingBag, 
    CreditCard, 
    ShieldCheck, 
    Plus, 
    Trash2, 
    Truck, 
    ArrowRight,
    Lock,
    ChevronLeft,
    Box
} from 'lucide-react';

const Checkout = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const { currentUser, userData, setUserData } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const buyNowItem = location.state?.buyNowItem;
    const buyNowItems = location.state?.buyNowItems;
    const checkoutItems = buyNowItems ? buyNowItems : (buyNowItem ? [buyNowItem] : cart);
    const isBuyNow = !!(buyNowItem || buyNowItems);
    
    const checkoutTotal = isBuyNow 
        ? checkoutItems.reduce((acc, item) => acc + (item.unitPrice * (item.quantity || 1)), 0)
        : cartTotal;

    const checkoutTotalCount = checkoutItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const totalMRP = checkoutItems.reduce((acc, item) => acc + ((item.originalPrice || item.unitPrice) * (item.quantity || 1)), 0);
    const totalDiscount = totalMRP - checkoutTotal;
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
        const tempCompany = window.localStorage.getItem('temp_company_name');
        const tempGst = window.localStorage.getItem('temp_gst_number');
        if (tempCompany || tempGst) {
            setNeedsGst(true);
            setGstDetails({ companyName: tempCompany || '', gstNumber: tempGst || '' });
            window.localStorage.removeItem('temp_company_name');
            window.localStorage.removeItem('temp_gst_number');
        }

        if (!currentUser) {
            setIsLoginModalOpen(true);
        } else if (userData) {
            const isIncomplete = !userData.name || !userData.email || !userData.addresses || userData.addresses.length === 0;
            if (isIncomplete) {
                setIsLoginModalOpen(true);
            }

            if (userData.addresses && userData.addresses.length > 0) {
                const defaultAddr = userData.addresses.find(a => a.isDefault) || userData.addresses[0];
                setSelectedAddress(defaultAddr);
                setShowAddressForm(false);
            } else {
                setShowAddressForm(true);
            }
        }
    }, [currentUser, userData]);

    const handleAddressSave = async (addressData) => {
        try {
            if (userData) {
                const updatedAddresses = [...(userData.addresses || []), { ...addressData, isDefault: userData.addresses?.length === 0 }];
                const response = await axios.post('/api/public/update-user', {
                    phone: currentUser.phoneNumber,
                    name: addressData.name,
                    email: addressData.email,
                    addresses: updatedAddresses
                });
                if (response.data.success) {
                    setUserData(response.data.data);
                }
            }
            setSelectedAddress(addressData);
            setShowAddressForm(false);
        } catch (error) {
            console.error("Error saving address:", error);
            setSelectedAddress(addressData);
            setShowAddressForm(false);
        }
    };

    const handleDeleteAddress = async (e, addressId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this address?")) return;
        try {
            const res = await axios.delete(`/api/public/user/address/${addressId}`, {
                data: { phone: currentUser.phoneNumber }
            });
            if (res.data.success) {
                setUserData(res.data.data);
                if (selectedAddress && selectedAddress._id === addressId) setSelectedAddress(null);
            }
        } catch (error) {
            console.error("Error deleting address:", error);
        }
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
                productId: item.productId,
                name: item.name,
                image: item.image,
                designImage: item.designImage,
                itemType: item.itemType || 'Ready',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                selectedVariation: item.selectedVariation,
                customData: item.customData || {}
            })),
            paymentMethod: paymentMethod,
            paymentStatus: paymentMethod === 'online' && !isCheckoutBulkOrder ? 'Paid' : 'Pending',
            orderStatus: 'Pending',
            orderType: isCheckoutBulkOrder ? 'Bulk' : (checkoutItems.some(i => i.itemType === 'Custom') ? 'Custom' : 'Standard'),
            ...(needsGst && { gstDetails })
        };

        if (paymentMethod === 'online' && !isCheckoutBulkOrder) {
            setIsProcessingPayment(true);
            try {
                const rzpRes = await axios.post('/api/public/payment/razorpay-order', { amount: checkoutTotal });
                if (!rzpRes.data.success) throw new Error("Failed to initialize payment");

                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
                    amount: rzpRes.data.order.amount, 
                    currency: "INR",
                    name: "Agneya",
                    description: "Order Checkout",
                    order_id: rzpRes.data.order.id, 
                    handler: async function (response) {
                        try {
                            const verifyRes = await axios.post('/api/public/payment/verify', {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });

                            if (verifyRes.data.success) {
                                orderData.paymentDetails = response;
                                try {
                                    const finalOrder = await axios.post('/api/public/orders', orderData);
                                    if (finalOrder.data.success) {
                                        const newId = finalOrder.data.orderId;
                                        setOrderId(newId);
                                        setOrderSuccess(true);
                                        if (!isBuyNow) clearCart();

                                        const guestHistory = JSON.parse(window.localStorage.getItem('myGuestOrders') || '[]');
                                        if (!guestHistory.find(o => o.orderId === newId)) {
                                            guestHistory.push({ orderId: newId, phone: orderData.customer.phone });
                                            window.localStorage.setItem('myGuestOrders', JSON.stringify(guestHistory));
                                        }
                                    } else {
                                        alert("Order Creation Failed (Payment Succeeded): " + finalOrder.data.message);
                                    }
                                } catch (orderErr) {
                                    console.error("Order Creation Error:", orderErr);
                                    alert("Order Creation Failed (Payment Succeeded): " + (orderErr.response?.data?.message || orderErr.message));
                                }
                            } else {
                                alert("Payment verification failed.");
                            }
                        } catch (err) {
                            console.error("Razorpay Verification Error:", err);
                            alert("Payment verification failed: " + (err.response?.data?.message || err.message));
                        } finally {
                            setIsProcessingPayment(false);
                            setIsSubmitting(false);
                        }
                    },
                    prefill: {
                        name: selectedAddress.name || userData?.name,
                        email: selectedAddress.email || userData?.email,
                        contact: selectedAddress.mobile || userData?.phone
                    },
                    theme: { color: "#4f46e5" }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
                return;
            } catch (err) {
                console.error(err);
                setIsProcessingPayment(false);
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const response = await axios.post('/api/public/orders', orderData);
            if (response.data.success) {
                const newOrderId = response.data.orderId;
                setOrderId(newOrderId);
                setOrderSuccess(true);
                if (!isBuyNow) clearCart();

                const guestHistory = JSON.parse(window.localStorage.getItem('myGuestOrders') || '[]');
                if (!guestHistory.find(o => o.orderId === newOrderId)) {
                    guestHistory.push({ orderId: newOrderId, phone: orderData.customer.phone });
                    window.localStorage.setItem('myGuestOrders', JSON.stringify(guestHistory));
                }
            }
        } catch (error) {
            console.error("Order error:", error);
            alert('Failed to place order.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="bg-[#FBFCFE] min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-[40px] p-10 text-center shadow-2xl shadow-emerald-900/5 animate-in zoom-in-95 duration-500 border border-emerald-100/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
                    <div className="relative mx-auto w-28 h-28 mb-8 group">
                        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30"></div>
                        <div className="relative bg-emerald-500 w-28 h-28 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-14 h-14 text-white" />
                        </div>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4 relative z-10">Order Secured</h2>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed mb-10 relative z-10">
                        Order <span className="text-indigo-600 font-black">#{orderId}</span> is confirmed. You will receive tracking details on your registered phone.
                    </p>
                    <button 
                        onClick={() => navigate('/track-order')} 
                        className="w-full bg-slate-950 text-white px-8 py-5 rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl active:scale-95 relative z-10"
                    >
                        <Box size={18} />
                        Track Order
                    </button>
                    <button 
                        onClick={() => navigate('/')} 
                        className="w-full bg-white text-slate-500 mt-4 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95 relative z-10 border-2 border-slate-100"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    if (checkoutItems.length === 0) {
        return (
            <div className="min-h-screen bg-[#FBFCFE] flex flex-col items-center justify-center p-6">
                <div className="bg-white p-16 rounded-[40px] text-center shadow-2xl shadow-indigo-900/5 max-w-md w-full border border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-[24px] flex items-center justify-center shadow-inner mx-auto mb-8 border border-slate-100">
                        <ShoppingBag className="w-10 h-10 text-slate-300" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Cart is Empty</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10 leading-relaxed">Looks like you haven't added anything to your cart yet.</p>
                    <button onClick={() => navigate('/')} className="w-full bg-indigo-600 text-white py-5 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-slate-900 transition-all active:scale-95">
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#FBFCFE] min-h-screen font-sans selection:bg-indigo-600 selection:text-white pb-20 relative">
            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={() => { setIsLoginModalOpen(false); navigate(-1); }} 
                onLoginSuccess={() => setIsLoginModalOpen(false)} 
            />

            {/* HEADER STEPPER */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                            <ChevronLeft size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Back</span>
                    </button>
                    <div className="flex items-center gap-3 sm:gap-6">
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                            <span className="text-emerald-500"><CheckCircle2 size={14}/></span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Cart</span>
                        </div>
                        <div className="w-8 h-[2px] bg-indigo-100"></div>
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-bold animate-pulse">2</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700">Checkout</span>
                        </div>
                    </div>
                    <div className="w-8 sm:w-20"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                    
                    {/* LEFT COLUMN: FORMS */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-10">
                        <header className="space-y-3">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Checkout</h1>
                            <p className="text-indigo-600 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
                                <Lock size={12} />
                                Secure Channel Active
                            </p>
                        </header>

                        {/* SHIPPING SECTION */}
                        <section className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <MapPin size={18} />
                                    </div>
                                    Shipping Hub
                                </h2>
                                {selectedAddress && !showAddressForm && (
                                    <button 
                                        onClick={() => setShowAddressForm(true)} 
                                        className="text-[10px] px-4 py-2 bg-slate-50 rounded-lg font-black text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-colors"
                                    >
                                        Change Node
                                    </button>
                                )}
                            </div>

                            {userData && userData.addresses && userData.addresses.length > 0 && !showAddressForm ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {userData.addresses.map((addr, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => setSelectedAddress(addr)}
                                            className={`p-6 rounded-[24px] border-2 transition-all cursor-pointer group relative overflow-hidden ${
                                                selectedAddress === addr ? 'border-indigo-600 bg-indigo-50/10 shadow-lg shadow-indigo-100/50' : 'border-slate-100 bg-white hover:border-indigo-200'
                                            }`}
                                        >
                                            {selectedAddress === addr && <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>}
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-4">
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-md">{addr.type}</span>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-sm uppercase">{addr.name}</h4>
                                                        <p className="text-slate-500 text-[10px] font-bold leading-relaxed mt-2 uppercase tracking-widest">
                                                            {addr.houseNo}, {addr.area}<br/>
                                                            {addr.city}, {addr.state} - {addr.pincode}
                                                        </p>
                                                    </div>
                                                    <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded-md tracking-widest">{addr.mobile}</p>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedAddress === addr ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200'}`}>
                                                    {selectedAddress === addr && <CheckCircle2 size={14} className="text-white" />}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteAddress(e, addr._id)}
                                                className="absolute bottom-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-rose-50 text-rose-400 hover:text-white hover:bg-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                     ))}
                                     <button 
                                        onClick={() => { setSelectedAddress(null); setShowAddressForm(true); }}
                                        className="p-6 rounded-[24px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all bg-slate-50/50"
                                     >
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <Plus size={20} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Add Location</span>
                                     </button>
                                </div>
                            ) : (
                                <div className="bg-slate-50/50 rounded-[24px] p-4 border border-slate-100 shadow-inner">
                                    <AddressForm initialData={selectedAddress} onSave={handleAddressSave} />
                                </div>
                            )}
                        </section>

                        {/* PAYMENT SECTION */}
                        <section className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <CreditCard size={18} />
                                </div>
                                Payment Gateway
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div 
                                    onClick={() => setPaymentMethod('online')}
                                    className={`p-6 rounded-[24px] border-2 cursor-pointer transition-all flex items-center gap-5 ${paymentMethod === 'online' ? 'border-indigo-600 bg-indigo-50/10 shadow-lg shadow-indigo-100/50' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${paymentMethod === 'online' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Razorpay Secure</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">UPI, Cards, NetBanking</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200'}`}>
                                        {paymentMethod === 'online' && <CheckCircle2 size={14} className="text-white" />}
                                    </div>
                                </div>
                                <div 
                                    className={`p-6 rounded-[24px] border-2 cursor-not-allowed opacity-40 flex items-center gap-5 bg-slate-50 border-slate-200 grayscale`}
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                        <Truck size={24} />
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Cash on Delivery</h4>
                                        <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mt-1">Currently Disabled</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* GST OPTIONAL SECTION */}
                        <section className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[32px] p-8 shadow-xl text-white">
                             <label className="flex items-center gap-4 cursor-pointer group">
                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${needsGst ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                                    {needsGst && <CheckCircle2 size={14} className="text-white"/>}
                                </div>
                                <input type="checkbox" checked={needsGst} onChange={(e) => setNeedsGst(e.target.checked)} className="hidden" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Claim GST Input Tax Credit (Business)</span>
                             </label>
                             {needsGst && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-in slide-in-from-top-4 duration-500">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                                        <input type="text" value={gstDetails.companyName} onChange={(e) => setGstDetails(p => ({...p, companyName: e.target.value}))} className="w-full px-6 py-4 bg-white/10 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold text-white placeholder:text-slate-500 backdrop-blur-md" placeholder="Legal Entity Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Number</label>
                                        <input type="text" value={gstDetails.gstNumber} onChange={(e) => setGstDetails(p => ({...p, gstNumber: e.target.value}))} className="w-full px-6 py-4 bg-white/10 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold uppercase text-white placeholder:text-slate-500 backdrop-blur-md" placeholder="15-Digit GSTIN" />
                                    </div>
                                </div>
                             )}
                        </section>
                    </div>

                    {/* RIGHT COLUMN: ORDER SUMMARY */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        <aside className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-indigo-900/5 p-8 sticky top-24 space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full pointer-events-none"></div>
                            
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter relative z-10 flex items-center gap-3">
                                <ShoppingBag size={20} className="text-indigo-600"/>
                                Final Overview
                            </h2>
                            
                            {/* ITEM LIST */}
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                {checkoutItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-indigo-100 transition-colors group">
                                        <div className="flex flex-col gap-1 items-center">
                                            <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 p-1 shadow-sm">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                                            </div>
                                            {item.itemType === 'Custom' && item.designImage && (
                                                <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-indigo-200 p-0.5 mt-[-15px] z-10 shadow-md">
                                                    <img src={item.designImage} alt="Custom Details" className="w-full h-full object-cover mix-blend-multiply" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow space-y-2 py-1">
                                            <h4 className="text-[11px] font-black text-slate-900 uppercase leading-tight line-clamp-2">{item.name}</h4>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                {item.selectedVariation?.size && (
                                                    <span className="text-[9px] font-bold bg-white px-2 py-1 rounded-lg border border-slate-100 text-slate-500 uppercase shadow-sm">Size: {item.selectedVariation.size}</span>
                                                )}
                                                <span className="text-[9px] font-bold bg-white px-2 py-1 rounded-lg border border-slate-100 text-slate-500 uppercase shadow-sm">Qty: {item.quantity}</span>
                                            </div>

                                            {item.customData && Object.keys(item.customData).length > 0 && (
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-slate-100">
                                                    {Object.entries(item.customData).map(([key, val]) => (
                                                        <div key={key} className="flex items-center gap-1">
                                                             <span className="text-[8px] font-bold text-slate-400 capitalize">{key}:</span>
                                                             <span className="text-[8px] font-black text-slate-700">
                                                                {typeof val === 'object' ? 'Configured' : String(val)}
                                                             </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-sm font-black text-indigo-600 mt-1">₹{(item.unitPrice * (item.quantity || 1)).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* TOTALS */}
                            <div className="space-y-4 pt-8 border-t border-slate-100 relative z-10">
                                <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-widest bg-slate-50 px-4 py-3 rounded-2xl">
                                    <span>Asset Value ({checkoutTotalCount})</span>
                                    <span>₹{totalMRP.toLocaleString()}</span>
                                </div>
                                {totalDiscount > 0 && (
                                    <div className="flex justify-between items-center text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100">
                                        <span>Discount Offset</span>
                                        <span>- ₹{totalDiscount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-widest px-4">
                                    <span>Logistics</span>
                                    <span className="text-indigo-600 font-black bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">FREE</span>
                                </div>
                                <div className="flex flex-col pt-6 mt-2 border-t border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Authorization</span>
                                    <span className="text-5xl font-black text-slate-900 tracking-tighter">₹{checkoutTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* PLACE ORDER BUTTON */}
                            <div className="pt-4 space-y-4 relative z-10">
                                <button 
                                    onClick={handlePlaceOrder}
                                    disabled={isSubmitting || isProcessingPayment || !selectedAddress || (needsGst && (!gstDetails.companyName || !gstDetails.gstNumber))}
                                    className={`relative w-full py-6 rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 overflow-hidden group ${
                                        isSubmitting || isProcessingPayment || !selectedAddress || (needsGst && (!gstDetails.companyName || !gstDetails.gstNumber))
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                                        : 'bg-slate-950 text-white hover:bg-indigo-600 shadow-indigo-500/20 active:scale-[0.98]'
                                    }`}
                                >
                                    {!(isSubmitting || isProcessingPayment) && <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_forwards]"></div>}
                                    {isSubmitting || isProcessingPayment ? (
                                        <><div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div> Authorizing...</>
                                    ) : (
                                        <>{isCheckoutBulkOrder ? 'Submit Bulk Enquiry' : 'Authorize Payment'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </button>
                                
                                <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 py-3 rounded-xl border border-slate-100">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    256-bit SSL Encryption
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
