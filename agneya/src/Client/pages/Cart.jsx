// FINAL PRODUCTION CLEANUP: Removed all remaining seed/dummy references
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import toast from 'react-hot-toast';
import { FiTrash2, FiEdit3, FiBox, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

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

    // Filter items into logical groups for the dual-section UI
    const customItems = cart.filter(item => item.itemType === 'Custom');
    const readyMadeItems = cart.filter(item => item.itemType === 'Ready');

    const handleCheckout = () => {
        if (!currentUser) return setIsLoginModalOpen(true);

        if (!isIndividual) {
            if (!companyName.trim()) return toast.error("Company Name is required for Business Orders.");
            if (!gstNumber.trim()) return toast.error("GST Number is required for Business Orders.");
            if (gstNumber.length < 15) return toast.error("Invalid GST Number. Must be 15 digits.");
        }
        
        navigate('/checkout', { state: { 
            companyName: isIndividual ? (userData?.name || currentUser.displayName || 'Individual Customer') : companyName, 
            gstNumber: isIndividual ? 'N/A' : gstNumber,
            isIndividual 
        } });
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 md:px-10">
                <div className="bg-white p-12 md:p-16 rounded-[3rem] text-center shadow-xl border border-slate-100/50 max-w-lg w-full">
                    <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </div>
                    <h2 className="text-3xl font-black text-slate-950 mb-4 tracking-tighter uppercase">Your cart is empty</h2>
                    <p className="text-[11px] font-bold text-slate-400 mb-10 max-w-xs mx-auto uppercase tracking-widest leading-relaxed">Looks like you haven't added anything to your cart yet.</p>
                    <Link to="/" className="inline-flex items-center justify-center w-full px-8 py-5 border border-transparent text-[11px] font-black rounded-2xl text-white bg-slate-950 hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-500/20 uppercase tracking-[0.2em] active:scale-95">
                        Discover Options
                    </Link>
                </div>
            </div>
        );
    }

    const CartItemRow = ({ item }) => {
        const variationSku = item.selectedVariation?.sku || 'standard';
        const variantModifier = item.selectedVariation?.priceModifier || 0;
        const baseUnitPrice = item.unitPrice + variantModifier;
        const financials = calculateItemFinancials(item);

        return (
            <div className="group bg-white border border-slate-200/60 rounded-[2.5rem] p-4 md:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:shadow-indigo-500/5 transition-all duration-300 mb-5">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div className="w-full md:w-32 h-40 md:h-32 flex-shrink-0 bg-slate-50 rounded-3xl overflow-hidden shadow-inner border border-slate-100 group-hover:scale-105 transition-transform duration-500">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply cursor-pointer hover:scale-110 transition-transform duration-700" />
                    </div>
                    
                    <div className="flex-grow min-w-0 flex flex-col justify-center w-full md:w-auto">
                        <div className="flex flex-col gap-1 mb-3">
                            <h3 className="text-lg md:text-xl font-black text-slate-950 tracking-tighter uppercase truncate pr-4 drop-shadow-sm">{item.name}</h3>
                            {item.itemType === 'Custom' && (
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50/80 px-3 py-1.5 rounded-sm self-start shadow-sm border border-indigo-100">
                                    {item.customData?.mode === 'manual' ? 'Manual Assistance Brief' : 'Studio Master Design'}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-slate-50 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-slate-200">
                                SKU: {variationSku}
                            </span>
                            {item.selectedVariation?.size && (
                                <span className="px-3 py-1 bg-slate-50 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-slate-200">Size: {item.selectedVariation.size}</span>
                            )}
                        </div>

                        <div className="hidden md:block text-slate-500 text-[11px] mb-1 font-bold uppercase tracking-widest">
                            <span className="text-slate-950 font-black mr-2">₹{baseUnitPrice.toLocaleString('en-IN')} / unit</span>
                            {item.gstRate > 0 && <span className="text-slate-400 italic font-medium">({item.gstRate}% GST Exclusive)</span>}
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center min-w-0 md:min-w-[200px] gap-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-100 md:border-t-0">
                        <div className="flex flex-col items-start md:items-end">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Payable Total</p>
                            <p className="text-2xl md:text-3xl font-black text-slate-950 tracking-tighter">₹{financials.finalTotal.toLocaleString('en-IN')}</p>
                            {financials.savings > 0 && (
                                <div className="mt-1.5 flex flex-col items-start md:items-end text-left md:text-right">
                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-sm">Wholesale Saved: ₹{financials.savings.toLocaleString('en-IN')}</span>
                                    <span className="text-[8px] text-slate-400 font-bold italic mt-0.5">Incl. ₹{financials.taxAmount} GST</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100">
                            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm h-11">
                                <button onClick={() => updateQuantity(item.productId, item.quantity - 1, variationSku)} className="w-10 h-full flex items-center justify-center hover:bg-slate-50 hover:text-indigo-600 transition-all text-slate-400 font-bold text-lg border-r border-slate-100">−</button>
                                <span className="w-12 h-full flex items-center justify-center text-slate-950 font-black text-[12px]">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.productId, item.quantity + 1, variationSku)} className="w-10 h-full flex items-center justify-center hover:bg-slate-50 hover:text-indigo-600 transition-all text-slate-400 font-bold text-lg border-l border-slate-100">+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.productId, variationSku)} className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 group shadow-sm bg-white">
                                <FiTrash2 size={16} className="group-hover:-scale-x-100 transition-transform duration-300"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen font-sans pb-20 relative overflow-hidden">
             {/* Subtle Background Glows */}
             <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full pointer-events-none"></div>
             <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-emerald-200/20 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 bg-white p-6 md:px-10 md:py-8 rounded-[3rem] shadow-sm border border-slate-100/80 backdrop-blur-xl">
                    <div className="space-y-3 text-center md:text-left flex-1 pl-4">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase leading-[0.9] [text-shadow:0_1px_2px_rgba(255,255,255,1),0_0_20px_rgba(255,255,255,0.8)] relative">
                             Cart Hub
                             <div className="absolute -top-3 -right-6 md:right-auto md:left-56 w-3 h-3 bg-emerald-400 rounded-full animate-pulse border-2 border-white shadow-sm"></div>
                        </h1>
                        <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">Review your assets and finalize the financial matrix.</p>
                    </div>
                    {cart.length > 0 && (
                        <button 
                            onClick={() => { if(window.confirm('Empty your cart?')) clearCart(); }}
                            className="px-8 py-4 bg-rose-50 border border-rose-100/50 text-rose-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:border-rose-500 hover:text-white transition-all shadow-sm active:scale-95 group flex items-center gap-2"
                        >
                            <FiTrash2 className="group-hover:animate-bounce" /> Purge Archives
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-start">
                    
                    <div className="xl:col-span-8 flex flex-col gap-12">
                        {/* SECTION 1: CUSTOM DESIGNS */}
                        {customItems.length > 0 && (
                            <div className="animate-in slide-in-from-bottom-8 duration-500">
                                <div className="flex items-center gap-4 mb-6 px-4">
                                    <div className="w-12 h-12 rounded-[1rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner group">
                                        <FiEdit3 size={20} className="group-hover:rotate-12 transition-transform duration-300" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black text-slate-950 uppercase tracking-widest text-shadow-sm">Custom Creations</h2>
                                </div>
                                <div className="space-y-4">
                                     {customItems.map(item => <CartItemRow key={item.productId + (item.selectedVariation?.sku || '')} item={item} />)}
                                </div>
                            </div>
                        )}

                        {/* SECTION 2: MODEL PRODUCTS */}
                        {readyMadeItems.length > 0 && (
                            <div className="animate-in slide-in-from-bottom-8 duration-700">
                                <div className="flex items-center gap-4 mb-6 px-4">
                                    <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner group">
                                        <FiBox size={20} className="group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black text-slate-950 uppercase tracking-widest text-shadow-sm">Model Assets</h2>
                                </div>
                                <div className="space-y-4">
                                     {readyMadeItems.map(item => <CartItemRow key={item.productId + (item.selectedVariation?.sku || '')} item={item} />)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Card */}
                    <div className="xl:col-span-4">
                        <div className="bg-white/80 backdrop-blur-3xl rounded-[3rem] p-8 md:p-10 text-slate-950 shadow-2xl shadow-indigo-900/5 border border-slate-100 sticky top-32 group ring-1 ring-slate-950/5 relative overflow-hidden">
                            {/* Decorative Grid Line */}
                            <div className="absolute top-0 right-10 w-px h-full bg-slate-100/50 pointer-events-none hidden md:block"></div>
                            
                            <div className="inline-flex items-center gap-3 px-5 py-2 bg-slate-50/80 backdrop-blur-md rounded-full border border-slate-200 mb-10 shadow-inner">
                                <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${isBulkOrder ? 'bg-indigo-500 animate-pulse shadow-indigo-200' : 'bg-emerald-400 shadow-emerald-200'}`}></div>
                                <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">{isBulkOrder ? 'Wholesale Protocol' : 'Standard Order Phase'}</span>
                            </div>

                            <h2 className="text-2xl font-black mb-8 tracking-tighter uppercase block border-b border-slate-100 pb-6">Order Overview</h2>
                            
                            <div className="space-y-5 mb-10 relative z-10">
                                <div className="flex justify-between items-center text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/40 p-3 rounded-2xl">
                                    <span>Taxable Subtotal</span>
                                    <span className="text-slate-950 text-sm">₹{totalTaxable.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/40 p-3 rounded-2xl">
                                    <span>GST Protocol</span>
                                    <span className="text-slate-950 text-sm">+₹{totalTax.toLocaleString('en-IN')}</span>
                                </div>
                                {totalSavings > 0 && (
                                    <div className="flex justify-between items-center text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50/80 p-5 rounded-[1.5rem] border border-emerald-100 shadow-sm mt-3 animate-in zoom-in duration-300">
                                        <span>Bulk Benefit</span>
                                        <span className="text-sm">-₹{totalSavings.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest px-3">
                                    <span>Logistics Integration</span>
                                    <span className="text-indigo-600 text-[9px] md:text-[10px] uppercase tracking-[0.2em] bg-indigo-50/80 px-3 py-1.5 rounded-lg border border-indigo-100/50 shadow-sm font-black">FREE_SYNC</span>
                                </div>
                                <div className="pt-8 mt-8 border-t border-slate-100 flex justify-between items-end bg-gradient-to-t from-slate-50/50 to-transparent p-4 -mx-4 rounded-b-3xl">
                                    <div className="w-full">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 text-center md:text-left">Final Required Capital</p>
                                        <p className="text-4xl md:text-5xl font-black text-indigo-600 tracking-tighter leading-none text-center md:text-left drop-shadow-sm">₹{cartTotal.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Company Details Section */}
                            <div className="space-y-4 mb-8 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group/fields">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 flex items-center gap-2">
                                    <FiCheckCircle className="text-emerald-500"/> Corporate Context
                                </h3>
                                <div className="flex items-center gap-3 mb-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer" onClick={() => setIsIndividual(!isIndividual)}>
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isIndividual ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                        {isIndividual && <FiCheckCircle className="text-white w-4 h-4" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Proceed as Individual (No GST Required)</span>
                                </div>

                                {!isIndividual && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Company Name *</label>
                                            <input 
                                                type="text" 
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                placeholder="Enter Legal Entity Name"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm hover:border-slate-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">GST Number *</label>
                                            <input 
                                                type="text" 
                                                value={gstNumber}
                                                onChange={(e) => setGstNumber(e.target.value)}
                                                placeholder="15-Digit GSTIN"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm hover:border-slate-300"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profit/Savings Summary */}
                            {totalSavings > 0 && (
                                <div className="mb-8 p-6 bg-emerald-500 rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20 animate-pulse">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Your Total Savings</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-black tracking-tighter">₹{totalSavings.toLocaleString('en-IN')}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest mb-1 shadow-sm bg-white/20 px-2 py-0.5 rounded-full">Profit Gained</span>
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={handleCheckout}
                                className="relative w-full bg-slate-950 text-white py-5 md:py-6 rounded-[2rem] font-black text-[11px] md:text-[13px] shadow-2xl hover:shadow-indigo-500/20 hover:bg-indigo-600 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 uppercase tracking-[0.3em] group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_forwards]"></div>
                                Submit Intent <FiArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
                            </button>

                            <div className="mt-8 flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <svg className="w-6 h-6 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                 <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                     Proceeding implies agreement with our High-Tech Manufacturing SLA and Data Privacy Encryption Protocols. SSL Secured Node.
                                 </p>
                            </div>
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
