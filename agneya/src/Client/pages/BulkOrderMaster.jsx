import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Package, ArrowRight, Trash2, Search,
  ShoppingCart, LayoutGrid, Filter, CheckCircle2
} from 'lucide-react';
import LoginModal from '../components/LoginModal';

const BulkOrderMaster = () => {
  const {
    cart, addToCart, removeFromCart, updateQuantity,
    cartTotal, clearCart, isBulkOrder, totalTaxable, totalSavings
  } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState(localStorage.getItem('temp_company_name') || '');
  const [gstNumber, setGstNumber] = useState(localStorage.getItem('temp_gst_number') || '');

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/public/products');
        if (res.data.success) {
          setProducts(res.data.data);
          const preId = location.state?.preSelectedId;
          if (preId) {
            const p = res.data.data.find(x => x._id === preId);
            if (p) setSearch(p.name);
          }
        }
      } catch (err) {
        console.error('BulkOrderMaster fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [location.state]);

  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category).filter(Boolean))], [products]);

  const masterList = useMemo(() => {
    let list = products.filter(item => {
      const q = search.toLowerCase();
      const matchSearch = item.name?.toLowerCase().includes(q) ||
        item.variations?.some(v => v.sku?.toLowerCase().includes(q));
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      return matchSearch && matchCat;
    });
    if (showSelectedOnly) list = list.filter(p => cart.some(c => c.productId === p._id));
    return list;
  }, [products, search, selectedCategory, showSelectedOnly, cart]);

  const totalUnits = cart.reduce((acc, c) => acc + c.quantity, 0);

  const getQty = (productId, sku) => {
    const found = cart.find(c => c.productId === productId && (c.selectedVariation?.sku || 'STD') === sku);
    return found ? found.quantity : 0;
  };

  const handleQtyChange = (product, variation, newQty) => {
    const qty = Math.max(0, parseInt(newQty) || 0);
    const sku = variation?.sku || 'STD';
    const existing = cart.find(c => c.productId === product._id && (c.selectedVariation?.sku || 'STD') === sku);
    if (qty <= 0) { if (existing) removeFromCart(product._id, sku); return; }
    if (existing) {
      updateQuantity(product._id, qty, sku, product.basePrice || 0);
    } else {
      addToCart({
        productId: product._id,
        name: product.name,
        unitPrice: product.basePrice || 0,
        selectedVariation: sku !== 'STD' ? { sku: variation.sku, size: variation.size, color: variation.color, priceModifier: variation.priceModifier } : null,
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

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const minFail = cart.some(item => {
      if (item.itemType === 'Custom') return false;
      const mp = masterList.find(m => m._id === item.productId);
      if (!mp) return false;
      const total = cart.filter(c => c.productId === item.productId).reduce((a, c) => a + c.quantity, 0);
      const wMin = mp.isBulkEnabled && mp.bulkRules?.length > 0
        ? Math.min(...mp.bulkRules.map(r => r.minQty))
        : (mp.minOrder || 1);
      return total < wMin;
    });
    if (minFail) { toast.error('Minimum order quantity not met for some items.'); return; }
    if (!currentUser) { setIsLoginModalOpen(true); return; }
    navigate('/checkout', {
      state: {
        companyName: companyName || 'Business Customer',
        gstNumber: gstNumber || 'N/A',
        isIndividual: !companyName
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading product catalogue…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={() => navigate('/checkout')} />

      {/* ── TOP BAR ── */}
      <div className="sticky top-[70px] z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-3 mr-auto">
            <h1 className="text-base font-bold text-slate-900">Bulk Order</h1>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${isBulkOrder ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
              {isBulkOrder ? '✓ Wholesale Pricing Active' : 'Standard Pricing'}
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <button
              onClick={() => setShowSelectedOnly(!showSelectedOnly)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border flex-shrink-0 transition-all ${showSelectedOnly ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              <Filter size={13} />
              {showSelectedOnly ? 'All Products' : 'Selected Only'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Info Banner */}
        <div className="bg-indigo-600 rounded-2xl p-5 mb-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-lg">
            <p className="text-xs font-semibold text-indigo-200 mb-1">How bulk pricing works</p>
            <p className="text-sm text-white/80 leading-relaxed">
              Discounts are applied <strong className="text-white">per product</strong>. Once you reach a product's minimum quantity threshold (shown in each row), the discounted price automatically applies to <strong className="text-white">all units</strong> of that product.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
              <p className="text-[10px] text-indigo-300 font-semibold">Total Units</p>
              <p className="text-xl font-bold">{totalUnits}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
              <p className="text-[10px] text-indigo-300 font-semibold">Status</p>
              <p className="text-sm font-bold">{isBulkOrder ? 'Wholesale' : 'Standard'}</p>
            </div>
          </div>
        </div>

        {/* Company Details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Business Details <span className="text-slate-400 font-normal">(optional — for GST invoice)</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Company Name</label>
              <input
                type="text"
                placeholder="Your organisation name"
                value={companyName}
                onChange={e => { setCompanyName(e.target.value); localStorage.setItem('temp_company_name', e.target.value); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">GST Number <span className="text-slate-300">(Optional)</span></label>
              <input
                type="text"
                placeholder="Enter GSTIN"
                value={gstNumber}
                onChange={e => { setGstNumber(e.target.value); localStorage.setItem('temp_gst_number', e.target.value); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── PRODUCT TABLE ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500">{masterList.length} products</span>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => { if (window.confirm('Clear all selections?')) clearCart(); }}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1.5"
                >
                  <Trash2 size={13} /> Clear All
                </button>
              </div>

              {/* Scroll container */}
              <div className="max-h-[560px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Product</th>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase text-slate-400 tracking-wider text-center">Quantity</th>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase text-slate-400 tracking-wider text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {masterList.map((product, idx) => {
                      const totalProductQty = cart.reduce((acc, c) => c.productId === product._id ? acc + c.quantity : acc, 0);
                      const isSelected = totalProductQty > 0;
                      const wMin = product.isBulkEnabled && product.bulkRules?.length > 0
                        ? Math.min(...product.bulkRules.map(r => r.minQty))
                        : product.minOrder;

                      const baseVars = product.variations?.length > 0
                        ? product.variations
                        : [{ sku: 'STD', size: 'Standard', priceModifier: 0 }];

                      let subtotal = 0;
                      baseVars.forEach(v => {
                        const qty = getQty(product._id, v.sku || 'STD');
                        if (qty > 0) {
                          let price = product.basePrice + (v.priceModifier || 0);
                          if (product.isBulkEnabled && product.bulkRules?.length > 0) {
                            const rule = [...product.bulkRules].sort((a, b) => b.minQty - a.minQty).find(r => totalProductQty >= r.minQty);
                            if (rule) price = Math.max(0, product.basePrice - (rule.pricePerUnit || 0)) + (v.priceModifier || 0);
                          }
                          subtotal += qty * price;
                        }
                      });

                      const nextTier = product.isBulkEnabled && product.bulkRules?.length > 0
                        ? [...product.bulkRules].sort((a, b) => a.minQty - b.minQty).find(r => totalProductQty < r.minQty)
                        : null;

                      return (
                        <tr key={product._id || idx} className={`transition-colors ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                          {/* Product Info */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-12 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                                <img src={product.galleryImages?.[0] || product.images?.[0] || ''} className="w-full h-full object-contain" alt="" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight">{product.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Base: ₹{product.basePrice?.toLocaleString('en-IN')}</p>
                                {product.isBulkEnabled && product.bulkRules?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {[...product.bulkRules].sort((a, b) => a.minQty - b.minQty).map((rule, ri) => {
                                      const active = totalProductQty >= rule.minQty;
                                      return (
                                        <span key={ri} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                          {rule.minQty}+: ₹{(product.basePrice - (rule.pricePerUnit || 0)).toLocaleString('en-IN')}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                                {nextTier && totalProductQty > 0 && (
                                  <p className="text-[9px] text-indigo-500 font-semibold mt-1">
                                    Add {nextTier.minQty - totalProductQty} more for ₹{(product.basePrice - (nextTier.pricePerUnit || 0)).toLocaleString('en-IN')} each
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Quantity Inputs */}
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2 justify-center">
                              {baseVars.map(v => {
                                const sku = v.sku || 'STD';
                                const qty = getQty(product._id, sku);
                                return (
                                  <div key={sku} className={`flex flex-col items-center rounded-lg border p-1 min-w-[48px] transition-all ${qty > 0 ? 'border-indigo-300 bg-white ring-1 ring-indigo-100' : 'border-slate-100 bg-slate-50'}`}>
                                    <span className={`text-[9px] font-semibold mb-1 ${qty > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{v.size || sku}</span>
                                    <input
                                      type="number"
                                      value={qty || ''}
                                      onChange={e => handleQtyChange(product, v, e.target.value)}
                                      placeholder="0"
                                      min={0}
                                      className="w-10 h-7 text-center bg-transparent text-xs font-bold text-slate-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          {/* Subtotal */}
                          <td className="px-5 py-4 text-right">
                            <p className={`text-sm font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-200'}`}>
                              ₹{subtotal.toLocaleString('en-IN')}
                            </p>
                            {isSelected && wMin && totalProductQty < wMin && (
                              <p className="text-[10px] text-rose-500 font-semibold mt-0.5 animate-pulse">Min: {wMin}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {masterList.length === 0 && (
                  <div className="text-center py-16">
                    <Package size={28} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-sm text-slate-400 font-medium">No products match your search.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── SUMMARY PANEL ── */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl sticky top-[130px]">
              <div className="flex items-center gap-2 mb-5">
                <ShoppingCart size={16} className="text-indigo-400" />
                <h2 className="text-sm font-bold">Order Summary</h2>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Units</span>
                  <span className="font-semibold">{totalUnits}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Taxable Base</span>
                  <span className="font-semibold">₹{totalTaxable.toLocaleString('en-IN')}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span className="font-semibold">Bulk Savings</span>
                    <span className="font-semibold">−₹{totalSavings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs text-slate-400 mb-1">Net Payable</p>
                  <p className="text-3xl font-bold text-white tracking-tight">₹{cartTotal.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {isBulkOrder ? (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 mb-5">
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-[11px] font-semibold text-emerald-400">Wholesale pricing activated</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2 mb-5">
                  <div className="w-2 h-2 bg-slate-600 rounded-full flex-shrink-0" />
                  <p className="text-[11px] font-semibold text-slate-500">Standard order pricing</p>
                </div>
              )}

              <button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-500 hover:text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-3">By proceeding, you agree to our commercial terms.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOrderMaster;
