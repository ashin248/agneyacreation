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
    ChevronRight, 
    ShoppingBag, 
    CreditCard, 
    ShieldCheck, 
    Plus, 
    Trash2, 
    Truck, 
    ArrowRight,
    Lock,
    Info,
    ChevronLeft
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
            // Profile Integrity Check for Checkout
            const isIncomplete = !userData.name || !userData.email || !userData.addresses || userData.addresses.length === 0;
            if (isIncomplete) {
                // If they are in checkout but incomplete, they must have come from a direct link or refresh
                // We show LoginModal which will trigger Onboarding
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
                designImage: item.designImage, // Ensuring backend receives the captured dual-image
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

                                        // ARCHIVE: Persist guest tracking metadata for seamless recall in Commission Hub
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

                // ARCHIVE: Persist guest tracking metadata for seamless recall in Commission Hub
                const guestHistory = JSON.parse(window.localStorage.getItem('myGuestOrders') || '[]');
                if (!guestHistory.find(o => o.orderId === newOrderId)) {
                    guestHistory.push({ orderId: newOrderId, phone: orderData.customer.phone });
                    window.localStorage.setItem('myGuestOrders', JSON.stringify(guestHistory));
                }
            }
        } catch (error) {
            alert('Failed to place order.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="bg-white min-h-screen flex items-center justify-center py-20 px-4">
                <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
                        <div className="relative bg-emerald-500 w-24 h-24 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Order Confirmed</h2>
                        <p className="text-gray-500 font-medium">
                            Your order <span className="text-indigo-600 font-bold">#{orderId}</span> has been placed successfully. A confirmation message will be sent to your phone.
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/')} 
                        className="w-full bg-slate-900 text-white px-8 py-5 rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl"
                    >
                        <ShoppingBag className="w-6 h-6" />
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    if (checkoutItems.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-gray-50">
                <div className="text-center space-y-6 max-w-sm">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto">
                        <ShoppingBag className="w-10 h-10 text-slate-200" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Your cart is empty</h2>
                    <p className="text-slate-500">Looks like you haven't added anything to your cart yet.</p>
                    <button onClick={() => navigate('/')} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100">
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#FCFCFD] min-h-screen">
            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={() => { setIsLoginModalOpen(false); navigate(-1); }} 
                onLoginSuccess={() => setIsLoginModalOpen(false)} 
            />

            {/* HEADER STEPPER */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                        <ChevronLeft size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Back</span>
                    </button>
                    <div className="flex items-center gap-4 sm:gap-8">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Cart</span>
                        </div>
                        <div className="w-8 h-[1px] bg-slate-100"></div>
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Checkout</span>
                        </div>
                        <div className="w-8 h-[1px] bg-slate-100"></div>
                        <div className="flex items-center gap-2 opacity-30">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">3</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Finish</span>
                        </div>
                    </div>
                    <div className="w-10 sm:w-20"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* LEFT COLUMN: FORMS */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-10">
                        <header className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Checkout</h1>
                            <p className="text-slate-500 flex items-center gap-2 text-sm font-medium">
                                <Lock size={14} className="text-emerald-500" />
                                Secure checkout for {currentUser?.phoneNumber}
                            </p>
                        </header>

                        {/* SHIPPING SECTION */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                    <MapPin size={20} className="text-indigo-600" />
                                    Shipping Information
                                </h2>
                                {selectedAddress && !showAddressForm && (
                                    <button 
                                        onClick={() => setShowAddressForm(true)} 
                                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                    >
                                        Change Address
                                    </button>
                                )}
                            </div>

                            {userData && userData.addresses && userData.addresses.length > 0 && !showAddressForm ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {userData.addresses.map((addr, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => setSelectedAddress(addr)}
                                            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer group relative ${
                                                selectedAddress === addr ? 'border-indigo-600 bg-white shadow-xl shadow-indigo-100/20' : 'border-gray-100 bg-white hover:border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-3">
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded-md">{addr.type}</span>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-sm uppercase">{addr.name}</h4>
                                                        <p className="text-slate-500 text-[10px] font-medium leading-relaxed mt-1 uppercase tracking-tight">
                                                            {addr.houseNo}, {addr.area}<br/>
                                                            {addr.city}, {addr.state} - {addr.pincode}
                                                        </p>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400">{addr.mobile}</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedAddress === addr ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200'}`}>
                                                    {selectedAddress === addr && <CheckCircle2 size={12} className="text-white" />}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteAddress(e, addr._id)}
                                                className="absolute bottom-4 right-4 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                     ))}
                                     <button 
                                        onClick={() => { setSelectedAddress(null); setShowAddressForm(true); }}
                                        className="p-6 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all bg-white"
                                     >
                                        <Plus size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Add New Address</span>
                                     </button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl p-2 border border-gray-100 shadow-sm">
                                    <AddressForm initialData={selectedAddress} onSave={handleAddressSave} />
                                </div>
                            )}
                        </section>

                        {/* PAYMENT SECTION */}
                        <section className="space-y-6">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <CreditCard size={20} className="text-indigo-600" />
                                Payment Method
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div 
                                    onClick={() => setPaymentMethod('online')}
                                    className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-4 ${paymentMethod === 'online' ? 'border-indigo-600 bg-white shadow-lg' : 'border-gray-100 bg-white opacity-60 hover:opacity-100'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === 'online' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="text-sm font-black text-slate-900 uppercase">Secured Online Payment</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">UPI, Cards, Wallets, NetBanking</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200'}`}>
                                        {paymentMethod === 'online' && <CheckCircle2 size={12} className="text-white" />}
                                    </div>
                                </div>
                                <div 
                                    className={`p-6 rounded-3xl border-2 cursor-not-allowed opacity-30 flex items-center gap-4 bg-gray-50 border-gray-100`}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400">
                                        <Truck size={24} />
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="text-sm font-black text-slate-900 uppercase">Cash on Delivery</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Currently Disabled</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* GST OPTIONAL SECTION */}
                        <section className="bg-white rounded-3xl p-8 border border-gray-100">
                             <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={needsGst} onChange={(e) => setNeedsGst(e.target.checked)} className="w-5 h-5 rounded-lg accent-indigo-600 cursor-pointer" />
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Bill this order with GST (Optional)</span>
                             </label>
                             {needsGst && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 animate-in slide-in-from-top-4 duration-500">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Company Name</label>
                                        <input type="text" value={gstDetails.companyName} onChange={(e) => setGstDetails(p => ({...p, companyName: e.target.value}))} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-xs font-bold" placeholder="Legal Entity Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">GST Number</label>
                                        <input type="text" value={gstDetails.gstNumber} onChange={(e) => setGstDetails(p => ({...p, gstNumber: e.target.value}))} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-xs font-bold uppercase" placeholder="GSTIN (15 Digits)" />
                                    </div>
                                </div>
                             )}
                        </section>
                    </div>

                    {/* RIGHT COLUMN: ORDER SUMMARY */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        <aside className="bg-white rounded-[40px] border border-gray-100 shadow-2xl p-8 sticky top-24 space-y-8 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8"></div>
                            
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Order Summary</h2>
                            
                            {/* ITEM LIST */}
                            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                                {checkoutItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 group">
                                        <div className="flex flex-col gap-1 items-center">
                                            <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 p-1 relative">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                            </div>
                                            {item.itemType === 'Custom' && item.designImage && (
                                                <div className="w-12 h-12 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-indigo-100 p-0.5 mt-[-10px] z-10 shadow-sm shadow-indigo-100 relative group">
                                                    <img src={item.designImage} alt="Custom Details" className="w-full h-full object-cover mix-blend-multiply" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow space-y-1">
                                            <h4 className="text-[11px] font-black text-slate-900 uppercase leading-tight line-clamp-2">{item.name}</h4>
                                            
                                            {/* ATTRACTIVE SPECS DISPLAY */}
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {item.selectedVariation?.size && (
                                                    <span className="text-[8px] font-bold bg-white px-2 py-0.5 rounded-md border border-gray-100 text-slate-500 uppercase">Size: {item.selectedVariation.size}</span>
                                                )}
                                                <span className="text-[8px] font-bold bg-white px-2 py-0.5 rounded-md border border-gray-100 text-slate-500 uppercase">Qty: {item.quantity}</span>
                                            </div>

                                            {/* CUSTOM MEASUREMENTS - CLEAN DISPLAY */}
                                            {item.customData && Object.keys(item.customData).length > 0 && (
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-gray-100">
                                                    {Object.entries(item.customData).map(([key, val]) => (
                                                        <div key={key} className="flex items-center gap-1">
                                                             <span className="text-[8px] font-medium text-slate-400 capitalize">{key}:</span>
                                                             <span className="text-[8px] font-black text-slate-700">
                                                                {typeof val === 'object' ? 'Configured' : String(val)}
                                                             </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-900">₹{(item.unitPrice * (item.quantity || 1)).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* TOTALS */}
                            <div className="space-y-4 pt-6 border-t border-gray-100">
                                <div className="flex justify-between items-center text-slate-500 text-xs font-medium uppercase tracking-widest">
                                    <span>Subtotal ({checkoutTotalCount} Items)</span>
                                    <span>₹{totalMRP.toLocaleString()}</span>
                                </div>
                                {totalDiscount > 0 && (
                                    <div className="flex justify-between items-center text-emerald-600 text-xs font-bold uppercase tracking-widest">
                                        <span>Discount Savings</span>
                                        <span>- ₹{totalDiscount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-slate-500 text-xs font-medium uppercase tracking-widest">
                                    <span>Shipping</span>
                                    <span className="text-emerald-600 font-bold">FREE</span>
                                </div>
                                <div className="flex justify-between items-center pt-6 border-t-2 border-slate-900">
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Total</span>
                                    <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{checkoutTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* PLACE ORDER BUTTON */}
                            <div className="pt-4 space-y-4">
                                <button 
                                    onClick={handlePlaceOrder}
                                    disabled={isSubmitting || isProcessingPayment || !selectedAddress || (needsGst && (!gstDetails.companyName || !gstDetails.gstNumber))}
                                    className={`w-full py-5 rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${
                                        isSubmitting || isProcessingPayment || !selectedAddress || (needsGst && (!gstDetails.companyName || !gstDetails.gstNumber))
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                                        : 'bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-100 active:scale-[0.98]'
                                    }`}
                                >
                                    {isSubmitting || isProcessingPayment ? (
                                        <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Processing...</>
                                    ) : (
                                        <>{isCheckoutBulkOrder ? 'Submit Bulk Enquiry' : 'Secure Checkout'} <ArrowRight size={18} /></>
                                    )}
                                </button>
                                
                                <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-2">
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                    Guaranteed Safe Checkout
                                </p>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;

