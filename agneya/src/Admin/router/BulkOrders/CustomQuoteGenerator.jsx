import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiTrash2, FiSend, FiFileText, FiCalendar, FiClock, FiDollarSign, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const CustomQuoteGenerator = () => {
    // Form States
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [items, setItems] = useState([{ productName: '', quantity: 1, unitPrice: 0 }]);
    
    // UI States
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('/api/admin/bulk-orders/quotes', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setQuotes(response.data.data || []);
        } catch (err) {
            console.error("Error fetching quotes:", err);
            setError(err.response?.data?.message || "Failed to load recent quotes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    const grandTotal = items.reduce((acc, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return acc + (qty * price);
    }, 0);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { productName: '', quantity: 1, unitPrice: 0 }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleGenerateQuote = async () => {
        if (!String(companyName || '').trim() || !String(email || '').trim()) {
            setError("Company name and Email are required.");
            return;
        }
        
        const validItems = items.filter(i => String(i.productName || '').trim() !== '' && i.quantity > 0 && i.unitPrice >= 0);
        if (validItems.length === 0) {
            setError("At least one valid item with a name and quantity > 0 is required.");
            return;
        }

        setGenerating(true);
        setError(null);
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('adminToken');
            const payload = {
                companyName,
                email,
                items: validItems,
                validUntil: validUntil || undefined
            };

            const response = await axios.post('/api/admin/bulk-orders/quotes', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccessMessage("Quote generated and sent successfully!");
            setTimeout(() => setSuccessMessage(''), 3000);
            
            setCompanyName('');
            setEmail('');
            setValidUntil('');
            setItems([{ productName: '', quantity: 1, unitPrice: 0 }]);
            
            setQuotes([response.data.data, ...quotes]);
            
        } catch (err) {
            console.error("Error generating quote:", err);
            setError(err.response?.data?.message || "Failed to generate quote.");
        } finally {
            setGenerating(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            'Draft': 'bg-gray-100 text-gray-500 border-gray-200',
            'Sent': 'bg-blue-50 text-blue-600 border-blue-100',
            'Accepted': 'bg-green-50 text-green-600 border-green-100',
            'Rejected': 'bg-red-50 text-red-600 border-red-100'
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
                {status === 'Sent' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 animate-pulse"></span>}
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-[80vh] bg-transparent text-gray-800 font-sans">
            {/* Header Area */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Quote Generator
                    </h1>
                    <p className="text-sm text-gray-400 font-medium mt-1">Generating high-precision pricing artifacts for B2B accounts</p>
                </div>
                
                {successMessage && (
                    <div className="flex items-center gap-2 px-6 py-2 bg-green-50 border border-green-100 text-green-600 rounded-full text-xs font-bold shadow-sm animate-fade-in">
                        <FiCheckCircle />
                        {successMessage}
                    </div>
                )}
            </div>

            {error && (
                <div className="max-w-7xl mx-auto mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-[13px] font-bold">
                    <FiXCircle className="inline mr-2" />
                    {error}
                </div>
            )}

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                {/* Form Section */}
                <div className="lg:col-span-8 bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl p-8 border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

                    <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6 relative z-10">
                        <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100">
                            <FiFileText className="text-orange-500" size={20} />
                        </div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase">Composition Engine</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 relative z-10">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em] block">Entity Name</label>
                            <input 
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="E.g., Global Retailers"
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-50/50 transition-all placeholder-gray-300"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em] block">Channel Email</label>
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="procurement@global.com"
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-50/50 transition-all placeholder-gray-300"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50/30 rounded-3xl border border-gray-100 p-6 mb-10 relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Inventory Matrix</h3>
                            <button 
                                onClick={addItem}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 transition-all shadow-sm"
                            >
                                <FiPlus /> Add Line
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Input Rows */}
                            {items.map((item, index) => {
                                const lineTotal = (Number(item.quantity) * Number(item.unitPrice)) || 0;
                                return (
                                    <div key={index} className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-2xl border border-gray-50 shadow-sm transition-all hover:shadow-md group">
                                        <div className="col-span-12 md:col-span-5">
                                            <input 
                                                type="text" 
                                                value={item.productName}
                                                onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                                placeholder="Artifact Description..."
                                                className="w-full bg-transparent border-none text-[13px] font-black text-gray-900 focus:outline-none py-1 placeholder-gray-200"
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <input 
                                                type="number" min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-black text-center text-gray-900 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-50"
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">₹</span>
                                                <input 
                                                    type="number" min="0" step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-black text-right text-gray-900 py-2 pl-6 pr-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-50"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-3 md:col-span-2 text-right text-[14px] font-black text-gray-900 tracking-tight">
                                            ₹{lineTotal.toLocaleString()}
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <button 
                                                onClick={() => removeItem(index)}
                                                className={`text-gray-200 hover:text-red-500 transition-colors ${items.length === 1 ? 'opacity-0' : ''}`}
                                                disabled={items.length === 1}
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sidebar Summary Section */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-gray-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden text-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none"></div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                                <FiDollarSign size={20} />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-white/60">Total Yield</h3>
                        </div>
                        <p className="text-4xl font-black tracking-tighter mb-2">₹{grandTotal.toLocaleString()}</p>
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-8">Contractual Value</p>
                        
                        <div className="mb-8">
                            <label className="text-[10px] font-black text-white/40 mb-3 uppercase tracking-[0.2em] block">Expiry Control</label>
                            <input 
                                type="date"
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 [color-scheme:dark]"
                            />
                        </div>

                        <button 
                            onClick={handleGenerateQuote}
                            disabled={generating}
                            className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl
                                ${generating 
                                    ? 'bg-orange-500/50 cursor-wait'
                                    : 'bg-orange-600 hover:bg-orange-500 active:scale-95 shadow-orange-500/30'
                                }
                            `}
                        >
                            {generating ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <FiSend />
                            )}
                            {generating ? 'Transmitting...' : 'Dispatch Quote'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Quotes Registry */}
            <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl relative overflow-hidden border-gray-100">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                            <FiClock className="text-blue-500" size={18} />
                        </div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase">Recent Artifacts</h2>
                    </div>
                </div>
                
                <div className="overflow-x-auto min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-2">
                            <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Retrieving Logs...</p>
                        </div>
                    ) : quotes.length === 0 ? (
                        <div className="text-center p-12 flex flex-col items-center justify-center h-64 text-gray-300">
                            <FiFileText size={48} className="mb-4 opacity-10" />
                            <h3 className="text-sm font-black uppercase tracking-widest">No Active Proposals</h3>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50 text-[10px] uppercase tracking-[0.2em] text-gray-400 bg-white/50">
                                    <th className="font-black p-6 pl-10">Receiver</th>
                                    <th className="font-black p-6">Dispatch</th>
                                    <th className="font-black p-6">Expiry</th>
                                    <th className="font-black p-6">Valuation</th>
                                    <th className="font-black p-6 pr-10 text-right">State</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {quotes.map((quote) => (
                                    <tr key={quote._id} className="hover:bg-blue-50/20 transition-all">
                                        <td className="p-6 pl-10">
                                            <p className="text-[15px] font-black text-gray-900 tracking-tight">{quote.companyName}</p>
                                            <p className="text-[11px] text-gray-400 font-bold mt-1 uppercase tracking-tight">{quote.email}</p>
                                        </td>
                                        <td className="p-6 text-[13px] font-bold text-gray-600">
                                            {new Date(quote.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="p-6 text-[13px] font-bold text-gray-400">
                                            {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'Perpetual'}
                                        </td>
                                        <td className="p-6 text-[15px] font-black text-gray-900">
                                            ₹{(quote.totalValue || 0).toLocaleString()}
                                        </td>
                                        <td className="p-6 pr-10 text-right">
                                            <StatusBadge status={quote.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomQuoteGenerator;

