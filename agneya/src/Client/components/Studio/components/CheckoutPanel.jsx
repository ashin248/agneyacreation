import React from 'react';
import { FiArrowRight, FiShoppingCart } from 'react-icons/fi';
import { useStudio } from '../context/StudioContext';

function CheckoutPanel({ variations, handleFinalSubmit, handleDiscardDraft }) {
    const { product, isSubmitting } = useStudio();
    
    return (
        <div className="hidden xl:flex w-[320px] flex-col gap-6">
            <div className="floating-card flex-1 p-8 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Order Summary</h4>
                </div>

                <div className="p-6 bg-slate-50/80 rounded-[32px] space-y-4">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-slate-400 uppercase">Per Unit Cost</span>
                        <span className="text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm text-sm">₹ {(product.discountPrice || product.basePrice || 0).toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-slate-200/50 w-full"></div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest text-center">Quantity & Sizes apply in cart</p>
                </div>

                {product.isBulkEnabled && product.bulkRules?.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Wholesale Ready</h4>
                        </div>
                        <div className="overflow-hidden border border-slate-50 rounded-2xl">
                            <table className="w-full text-[9px] font-bold">
                                <thead className="bg-slate-50 text-slate-400">
                                    <tr>
                                        <th className="px-3 py-2 text-left">BATCH RANGE</th>
                                        <th className="px-3 py-2 text-right">UNIT OFF</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {product.bulkRules.sort((a, b) => a.minQty - b.minQty).map((rule, idx) => (
                                        <tr key={idx} className="text-slate-500">
                                            <td className="px-3 py-2">ABOVE {rule.minQty}</td>
                                            <td className="px-3 py-2 text-right">₹{rule.pricePerUnit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="mt-auto space-y-4">
                    <div className="flex justify-between items-end pb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Subtotal</span>
                        <span className="text-2xl font-black text-[#0c0c2a]">₹ {((product.discountPrice || product.basePrice || 0) * variations.length).toLocaleString()}</span>
                    </div>
                    <button onClick={() => handleFinalSubmit(true)} className="w-full h-14 bg-white border-2 border-[#0c0c2a] text-[#0c0c2a] rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm">
                        <FiArrowRight size={18} /> Buy Now
                    </button>
                    <button onClick={() => handleFinalSubmit(false)} disabled={isSubmitting} className="w-full h-16 bg-[#0c0c2a] text-white rounded-[24px] flex items-center justify-center gap-4 font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50">
                        {isSubmitting ? <span className="animate-pulse">Syncing...</span> : <><FiShoppingCart size={18} /> Add to Cart</>}
                    </button>

                    <button onClick={handleDiscardDraft} className="w-full text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-rose-500 transition-colors">Abort Custom Design</button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPanel;
