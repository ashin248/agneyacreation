import React from 'react';
import { FiArrowRight, FiShoppingCart } from 'react-icons/fi';

export default function CheckoutPanel({ 
    variations, handleFinalSubmit, handleDiscardDraft,
    product, isSubmitting
}) {
    return (
        <div className="hidden xl:flex w-[260px] flex-col gap-4 shrink-0">
            <div className="neu-flat flex-1 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30" style={{ color: 'var(--color-neu-text)' }}>Order Summary</h4>
                </div>

                <div className="p-8 neu-pressed rounded-[40px] space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                        <span className="opacity-40" style={{ color: 'var(--color-neu-text)' }}>Per Unit Cost</span>
                        <span className="neu-button px-4 py-2 rounded-xl text-xs" style={{ color: 'var(--color-neu-accent)' }}>₹ {(product?.discountPrice || product?.basePrice || 0).toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-[var(--color-neu-dark)] w-full opacity-10"></div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-center opacity-30" style={{ color: 'var(--color-neu-text)' }}>Quantity & Sizes apply in cart</p>
                </div>

                {product?.isBulkEnabled && product.bulkRules?.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Wholesale Ready</h4>
                        </div>
                        <div className="overflow-hidden neu-pressed rounded-2xl border border-[var(--color-neu-dark)]" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                            <table className="w-full text-[9px] font-bold">
                                <thead className="bg-[var(--color-neu-dark)] opacity-50" style={{ color: 'var(--color-neu-text)' }}>
                                    <tr>
                                        <th className="px-3 py-2 text-left uppercase tracking-widest">Range</th>
                                        <th className="px-3 py-2 text-right uppercase tracking-widest">Unit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-neu-dark)]" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                    {product.bulkRules.sort((a, b) => a.minQty - b.minQty).map((rule, idx) => (
                                        <tr key={idx} className="opacity-60" style={{ color: 'var(--color-neu-text)' }}>
                                            <td className="px-3 py-2 uppercase tracking-tighter">Above {rule.minQty}</td>
                                            <td className="px-3 py-2 text-right">₹{rule.pricePerUnit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="mt-auto space-y-5">
                    <div className="flex justify-between items-end pb-3">
                        <span className="text-[11px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>Subtotal</span>
                        <span className="text-3xl font-black" style={{ color: 'var(--color-neu-text)' }}>₹ {((product?.discountPrice || product?.basePrice || 0) * (variations?.length || 0)).toLocaleString()}</span>
                    </div>
                    <button onClick={() => handleFinalSubmit(true)} className="w-full h-14 neu-button font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95" style={{ color: 'var(--color-neu-text)' }}>
                        <FiArrowRight size={18} /> Buy Now
                    </button>
                    <button onClick={() => handleFinalSubmit(false)} disabled={isSubmitting} className="w-full h-16 neu-button-accent flex items-center justify-center gap-4 font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 disabled:opacity-50">
                        {isSubmitting ? <span className="animate-pulse">Syncing...</span> : <><FiShoppingCart size={18} /> Add to Cart</>}
                    </button>

                    <button onClick={handleDiscardDraft} className="w-full text-[9px] font-black uppercase tracking-[0.3em] opacity-30 hover:opacity-100 hover:text-rose-500 transition-all">Abort Custom Design</button>
                </div>
            </div>
        </div>
    );
}

