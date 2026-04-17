import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
    Package, 
    ArrowRight, 
    Trash2, 
    Search, 
    BadgeCheck, 
    Building2,
    ShoppingCart,
    Info,
    LayoutGrid,
    ChevronRight,
    Zap,
    Scale,
    Layers,
    Filter,
    CheckCircle2,
    CheckSquare
} from 'lucide-react';
import LoginModal from '../components/LoginModal';

const BulkOrderMaster = () => {
    const { cart, addToCart, removeFromCart, updateQuantity, cartTotal, clearCart, isBulkOrder, totalTaxable, totalSavings } = useCart();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    
    const location = useLocation();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await axios.get('/api/public/products');
                if (res.data.success) {
                    setProducts(res.data.data);

                    const preSelectedId = location.state?.preSelectedId;
                    if (preSelectedId) {
                        const product = res.data.data.find(p => p._id === preSelectedId);
                        if (product) setSearch(product.name);
                    }
                }
            } catch (err) {
                console.error("Error fetching products:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [location.state]);

    const masterList = useMemo(() => {
        let filtered = products.filter(item => {
            const matchesSearch = String(item.name || '').toLowerCase().includes(String(search || '').toLowerCase()) || 
                                 (item.variations && item.variations.some(v => String(v.sku || '').toLowerCase().includes(String(search || '').toLowerCase())));
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        if (showSelectedOnly) {
            filtered = filtered.filter(item => cart.some(c => c.productId === item._id));
        }

        return filtered;
    }, [products, search, selectedCategory, showSelectedOnly, cart]);

    const categories = useMemo(() => {
        return ['All', ...new Set(products.map(p => p.category))];
    }, [products]);

    const handleQuantityChange = (product, variation, newQty) => {
        let qty = parseInt(newQty);
        if (isNaN(qty)) qty = 0;
        
        const variationSku = variation?.sku || 'STD-ASSET';
        const existing = cart.find(c => c.productId === product._id && (c.selectedVariation?.sku || 'STD-ASSET') === variationSku);
        
        if (qty <= 0) {
            if (existing) removeFromCart(product._id, variationSku);
            return;
        }

        let unitPrice = product.basePrice || 0; // CartContext handles the discounts now

        if (existing) {
            updateQuantity(product._id, qty, variationSku, unitPrice);
        } else {
            addToCart({
                productId: product._id,
                name: product.name,
                unitPrice: unitPrice,
                selectedVariation: variationSku !== 'STD-ASSET' ? { sku: variation.sku, size: variation.size, color: variation.color, priceModifier: variation.priceModifier } : null,
                image: product.galleryImages?.[0] || product.images?.[0] || '',
                itemType: 'Ready',
                quantity: qty,
                originalPrice: product.originalPrice,
                category: product.category,
                isBulkEnabled: product.isBulkEnabled,
                bulkRules: product.bulkRules,
                gstRate: product.gstRate || 0
            });
        }
    };

    const toggleSelection = (product) => {
        // Find total product qty. If > 0, clear it. If 0, add min.
        const totalProductQty = cart.reduce((acc, curr) => (curr.productId === product._id ? acc + curr.quantity : acc), 0);
        
        if (totalProductQty > 0) {
            // Remove all variations of this product
            const toRemove = cart.filter(c => c.productId === product._id);
            toRemove.forEach(c => removeFromCart(product._id, c.selectedVariation?.sku || 'STD-ASSET'));
        } else {
            const wholesaleMinQty = (product.isBulkEnabled && product.bulkRules?.length > 0) 
                ? Math.min(...product.bulkRules.map(r => r.minQty)) 
                : product.minOrder;
                
            // Apply min to first variation
            const firstVar = product.variations?.[0] || { sku: 'STD-ASSET' };
            handleQuantityChange(product, firstVar, wholesaleMinQty || 1);
        }
    };

    const getItemQuantity = (itemId, sku) => {
        const found = cart.find(c => c.productId === itemId && (c.selectedVariation?.sku || 'STD-ASSET') === sku);
        return found ? found.quantity : 0;
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
                <div className="w-10 h-10 border-4 border-slate-50 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Master Sheet...</p>
            </div>
        );
    }

    const totalUnits = cart.reduce((acc, curr) => acc + curr.quantity, 0);

    return (
        <div className="bg-[#f8fafc] min-h-screen relative font-sans">
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={() => navigate('/checkout')} />

            {/* 1. TOP CONTROL BAR */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bulk Order Management</h1>
                        <div className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-1.5">
                            <Zap size={10} className="text-indigo-600 fill-indigo-600" />
                            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Active Procurement Sync</span>
                        </div>
                   </div>
                   
                   <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search products..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                            />
                        </div>
                        <button 
                            onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${showSelectedOnly ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                            <LayoutGrid size={14} />
                            {showSelectedOnly ? 'Global Catalog' : 'Active Selection'}
                        </button>
                   </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* 1. BULK PROTOCOL GUIDE */}
                <div className="bg-indigo-600 rounded-[2rem] p-8 mb-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="max-w-xl">
                            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.3em] mb-3">System Protocol:: Wholesale Calibration</p>
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2">How Bulk Pricing Activates</h2>
                            <p className="text-white/60 text-xs leading-relaxed font-medium">Wholesale discounts are calculated <span className="text-white font-bold">per-product</span>. Once you hit a product's minimum threshold (indicated in the table), the system automatically applies the corresponding price tier to <span className="text-white font-bold">all units</span> of that product. Achieve bulk status on any item to enable the commercial procurement sync.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center min-w-[100px]">
                                <span className="text-[8px] font-black text-indigo-200 uppercase mb-1">Status</span>
                                <span className="text-xs font-black uppercase tracking-widest">{isBulkOrder ? 'ACTIVE' : 'STANDARD'}</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center min-w-[100px]">
                                <span className="text-[8px] font-black text-indigo-400 uppercase mb-1 underline">Next Tier</span>
                                <span className="text-xs font-black uppercase tracking-widest">READY</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 2. ENTITY & GST DETAILS (SIDE BY SIDE) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entity / Company Name</label>
                            <input 
                                type="text" 
                                placeholder="Enter Business Name..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                                onChange={(e) => window.localStorage.setItem('temp_company_name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GST Number (Optional)</label>
                            <input 
                                type="text" 
                                placeholder="Enter GSTIN..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                                onChange={(e) => window.localStorage.setItem('temp_gst_number', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* 3. PRODUCT LIST (WITH SCROLL) */}
                    <div className="lg:col-span-2 overflow-hidden bg-white rounded-2xl border border-slate-200 flex flex-col h-[650px] shadow-sm">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live Inventory Matrix</span>
                            <div className="flex items-center gap-4">
                                <select 
                                    value={selectedCategory}
                                    onChange={e => setSelectedCategory(e.target.value)}
                                    className="bg-transparent text-slate-500 text-[10px] font-bold uppercase outline-none cursor-pointer"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <button onClick={() => { if(window.confirm("Purge selection?")) clearCart(); }} className="text-rose-500 hover:text-rose-600 transition-colors">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white z-10 shadow-sm border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Asset</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase text-slate-400 text-center tracking-wider">Variations</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase text-slate-400 text-right tracking-wider">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {masterList.map((product, idx) => {
                                        const totalProductQty = cart.reduce((acc, curr) => (curr.productId === product._id ? acc + curr.quantity : acc), 0);
                                        const isSelected = totalProductQty > 0;
                                        const wMin = (product.isBulkEnabled && product.bulkRules?.length > 0) ? Math.min(...product.bulkRules.map(r => r.minQty)) : product.minOrder;
                                        
                                        const baseVars = (product.variations && product.variations.length > 0) 
                                            ? [...product.variations] 
                                            : [{ sku: 'STD-ASSET', size: 'N/A', priceModifier: 0 }];

                                        const customVars = cart
                                            .filter(c => c.productId === product._id && c.itemType === 'Custom')
                                            .map(c => ({
                                                sku: c.selectedVariation?.sku || 'custom_fallback',
                                                size: 'Custom Flow',
                                                priceModifier: 0,
                                                isCustom: true,
                                                designImage: c.designImage,
                                                customData: c.customData,
                                                unitPriceOverride: c.unitPrice
                                            }));

                                        const variationsToRender = [...baseVars, ...customVars];

                                        let subtotal = 0;
                                        variationsToRender.forEach(v => {
                                            const vQty = getItemQuantity(product._id, v.sku);
                                            if (vQty > 0) {
                                                let unitPrice = v.isCustom ? (v.unitPriceOverride || product.basePrice) : (product.basePrice + (v.priceModifier || 0));
                                                if (product.isBulkEnabled && product.bulkRules?.length > 0) {
                                                    const activeR = [...product.bulkRules].sort((a,b) => b.minQty - a.minQty).find(r => totalProductQty >= r.minQty);
                                                    if (activeR) {
                                                        const bDiscount = activeR.pricePerUnit || 0;
                                                        unitPrice = v.isCustom 
                                                            ? Math.max(0, (v.unitPriceOverride || product.basePrice) - bDiscount) 
                                                            : Math.max(0, product.basePrice - bDiscount) + (v.priceModifier || 0);
                                                    }
                                                }
                                                subtotal += vQty * unitPrice;
                                            }
                                        });

                                        return (
                                            <tr key={product._id || idx} className={`group transition-colors ${isSelected ? 'bg-indigo-50/20' : 'hover:bg-slate-50/50'}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-12 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                                                            <img src={product.galleryImages?.[0] || product.images?.[0] || ''} className="w-full h-full object-contain" alt="" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-900 leading-tight uppercase tracking-tight">{product.name}</p>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Base: ₹{product.basePrice.toLocaleString()}</p>
                                                                
                                                                {product.isBulkEnabled && product.bulkRules?.length > 0 && (
                                                                    <div className="flex gap-1.5">
                                                                        {[...product.bulkRules].sort((a,b) => a.minQty - b.minQty).map((rule, rIdx) => {
                                                                            const isCurrent = totalProductQty >= rule.minQty && (rIdx === product.bulkRules.length - 1 || totalProductQty < product.bulkRules[rIdx+1].minQty);
                                                                            const isAchieved = totalProductQty >= rule.minQty;
                                                                            
                                                                            return (
                                                                                <div key={rIdx} className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter border ${
                                                                                    isCurrent ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 
                                                                                    isAchieved ? 'bg-indigo-50 border-indigo-200 text-indigo-400' :
                                                                                    'bg-slate-50 border-slate-100 text-slate-300'
                                                                                }`}>
                                                                                    {rule.minQty}+: ₹{(product.basePrice - (rule.pricePerUnit || 0)).toLocaleString()}
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Next Tier Hint */}
                                                            {product.isBulkEnabled && product.bulkRules?.length > 0 && (
                                                                (() => {
                                                                    const nextRule = [...product.bulkRules].sort((a,b) => a.minQty - b.minQty).find(r => totalProductQty < r.minQty);
                                                                    if (nextRule) {
                                                                        return (
                                                                            <p className="text-[7px] text-indigo-500 font-bold uppercase tracking-widest mt-1">
                                                                                Add {nextRule.minQty - totalProductQty} more for ₹{(product.basePrice - (nextRule.pricePerUnit || 0)).toLocaleString()} pricing
                                                                            </p>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-2 justify-center max-w-[300px]">
                                                        {variationsToRender.map(v => {
                                                            const vSku = v.sku || 'STD-ASSET';
                                                            const qty = getItemQuantity(product._id, vSku);
                                                            const active = qty > 0;
                                                            return (
                                                                <div key={vSku} className={`flex flex-col items-center p-1 rounded-lg border transition-all ${active ? 'border-indigo-300 bg-white ring-1 ring-indigo-100' : 'border-slate-100 bg-slate-50'} min-w-[44px]`}>
                                                                    {v.isCustom && v.designImage && (
                                                                        <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-200 mb-1 border border-slate-200 shrink-0">
                                                                            <img src={v.designImage} alt="Custom Design" className="w-full h-full object-cover mix-blend-multiply" />
                                                                        </div>
                                                                    )}
                                                                    <span className={`text-[8px] font-bold mb-1 ${active ? 'text-indigo-600' : 'text-slate-400'} ${v.isCustom ? 'text-[7px]' : ''}`}>
                                                                        {v.isCustom ? 'CUST' : (v.size || 'STD')}
                                                                    </span>
                                                                    <input 
                                                                        type="number" 
                                                                        value={qty || ''} 
                                                                        onChange={(e) => handleQuantityChange(product, v, e.target.value)} 
                                                                        placeholder="0" 
                                                                        className="w-10 h-7 text-center border-none bg-transparent rounded text-xs font-bold outline-none" />
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="space-y-1">
                                                        <p className={`text-sm font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-200'}`}>₹{subtotal.toLocaleString()}</p>
                                                        {isSelected && totalProductQty < wMin && <p className="text-[7px] text-rose-500 font-bold uppercase tracking-widest animate-pulse">Min: {wMin}</p>}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 4. SUMMARY PANEL */}
                    <div className="lg:col-span-1">
                         <div className="bg-[#0f172a] p-8 rounded-[2rem] shadow-2xl text-white sticky top-24 border border-white/5">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <ShoppingCart size={16} className="text-indigo-400" /> Procurement Summary
                            </h2>
                            
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        <span>Aggregated Units</span>
                                        <span>{totalUnits}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        <span>Taxable Base</span>
                                        <span>₹{totalTaxable.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                                        <span>Bulk Savings</span>
                                        <span>- ₹{totalSavings.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="h-px bg-white/5"></div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Net Payable</p>
                                    <p className="text-5xl font-bold tracking-tighter italic">₹{cartTotal.toLocaleString()}</p>
                                </div>

                                {isBulkOrder ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Bulk Threshold Achieved</p>
                                    </div>
                                ) : (
                                    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Standard Order Pricing</p>
                                    </div>
                                )}
                                
                                <button 
                                    disabled={cart.length === 0}
                                    onClick={() => {
                                        if (cart.length === 0) return;
                                        const minOrderFailure = cart.some(item => {
                                            if (item.itemType === 'Custom') return false; // Studio/Manual Designs are exempt from wholesale bulk mins
                                            const masterItem = masterList.find(m => m._id === item.productId);
                                            if (!masterItem) return false;
                                            const totalOfItem = cart.reduce((acc, curr) => (curr.productId === item.productId ? acc + curr.quantity : acc), 0);
                                            const wMin = (masterItem.isBulkEnabled && masterItem.bulkRules?.length > 0) ? Math.min(...masterItem.bulkRules.map(r => r.minQty)) : (masterItem.minOrder || 1);
                                            return totalOfItem < wMin;
                                        });
                                        if (minOrderFailure) { 
                                            toast.error("ERROR: Minimum threshold not met for some items.");
                                            return; 
                                        }
                                        if (!currentUser) setIsLoginModalOpen(true);
                                        else navigate('/checkout');
                                    }}
                                    className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 mt-4 shadow-xl shadow-white/5"
                                >
                                    Proceed to Sync <ArrowRight size={18} />
                                </button>
                                
                                <p className="text-[8px] text-slate-500 text-center uppercase tracking-widest leading-relaxed mt-2">By proceeding, you agree to our <br/> commercial procurement terms.</p>
                            </div>
                         </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}} />
            </div>
        </div>
    );
};

export default BulkOrderMaster;

