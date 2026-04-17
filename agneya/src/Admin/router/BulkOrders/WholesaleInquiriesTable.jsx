import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiMail, FiPhone, FiCalendar, FiBox, FiMessageSquare, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';

const WholesaleInquiriesTable = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchInquiries = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('/api/admin/bulk-orders/inquiries', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInquiries(response.data.data || []);
        } catch (err) {
            console.error("Error fetching inquiries:", err);
            setError(err.response?.data?.message || "Failed to load wholesale inquiries.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        const originalInquiries = [...inquiries];
        setInquiries(inquiries.map(inq => 
            inq._id === id ? { ...inq, status: newStatus } : inq
        ));
        setUpdatingId(id);
        
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`/api/admin/bulk-orders/inquiries/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMessage(`Status updated to ${newStatus}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Error updating status:", err);
            setInquiries(originalInquiries);
            setError(err.response?.data?.message || "Failed to update inquiry status.");
        } finally {
            setUpdatingId(null);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            'New': 'bg-blue-50 text-blue-600 border-blue-100',
            'Contacted': 'bg-orange-50 text-orange-600 border-orange-100',
            'Quote Sent': 'bg-indigo-50 text-indigo-600 border-indigo-100',
            'Closed': 'bg-gray-100 text-gray-500 border-gray-200'
        };
        const activeClass = styles[status] || 'bg-gray-50 text-gray-500 border-gray-100';
        
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${activeClass}`}>
                {status === 'New' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 animate-pulse"></span>}
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden">
            {/* HIGH-FIDELITY BACKGROUND ARCHITECTURE */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-50/50 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-7xl mx-auto py-16 px-6 relative z-10">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-px w-10 bg-indigo-600"></div>
                            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em]">Corporate Lead Pipeline</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Wholesale <span className="text-indigo-600">Terminal</span></h1>
                        <p className="text-lg text-slate-400 font-bold max-w-lg leading-relaxed">
                            Nurturing high-volume B2B leads and industrial procurement requests through unified CRM oversight.
                        </p>
                    </div>
                    
                    {successMessage && (
                        <div className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/30 animate-in slide-in-from-right duration-500">
                            <FiCheckCircle className="w-4 h-4" />
                            {successMessage}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-10 bg-red-500 text-white px-8 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-widest border border-red-200 shadow-2xl shadow-red-500/20">
                        Operational Error: {error}
                    </div>
                )}

                {/* DATA TABLE WRAPPER */}
                <div className="relative">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 bg-white/40 backdrop-blur-3xl rounded-[48px] border border-white shadow-xl">
                            <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                            <p className="text-[11px] text-slate-400 font-black tracking-[0.3em] uppercase">Syncing Lead Core...</p>
                        </div>
                    ) : inquiries.length === 0 ? (
                        <div className="text-center bg-white/40 backdrop-blur-3xl py-32 px-4 shadow-xl rounded-[48px] border border-white">
                            <div className="bg-slate-100 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                                <FiMessageSquare size={32} className="text-slate-300 stroke-1" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Registry Neutral</h3>
                            <p className="text-sm text-slate-400 font-bold max-w-xs mx-auto uppercase tracking-widest leading-relaxed">No high-volume inquiries identified in current operational matrix.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.08)] rounded-[48px] border border-white bg-white/60 backdrop-blur-3xl">
                            <div className="max-h-[70vh] overflow-y-auto no-scrollbar scroll-smooth">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/80 backdrop-blur-3xl sticky top-0 z-20">
                                        <tr className="border-b border-slate-100">
                                            <th className="p-8 pl-12 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Log Signature</th>
                                            <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Corporate Entity</th>
                                            <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] w-[400px]">Intent Matrix</th>
                                            <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Strategist</th>
                                            <th className="p-8 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Flow Status</th>
                                            <th className="p-8 pr-12 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Command Hub</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {inquiries.map((inquiry) => (
                                            <tr key={inquiry._id} className="hover:bg-indigo-50/40 transition-all duration-500 group">
                                                <td className="p-8 pl-12 align-top">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2 text-[14px] font-black text-slate-900 leading-none uppercase tracking-tight">
                                                            <FiCalendar className="text-indigo-400" />
                                                            {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString('en-GB', {
                                                                day: '2-digit', month: 'short', year: 'numeric'
                                                            }) : 'PENDING'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase ml-6">
                                                            {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'ENTRY_NODE'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8 align-top">
                                                    <p className="text-xl font-black text-slate-900 tracking-tight mb-4 uppercase group-hover:text-indigo-600 transition-colors">
                                                        {inquiry.companyName || 'Private Lead'}
                                                    </p>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 bg-white/80 px-4 py-2 rounded-xl border border-slate-100 shadow-sm w-fit group-hover:shadow-md transition-all uppercase tracking-tight">
                                                            <FiMail className="text-indigo-500" size={14} />
                                                            {inquiry.email}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 bg-white/80 px-4 py-2 rounded-xl border border-slate-100 shadow-sm w-fit group-hover:shadow-md transition-all uppercase tracking-tight">
                                                            <FiPhone className="text-indigo-500" size={14} />
                                                            {inquiry.phone}
                                                        </div>
                                                        <div className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em] mt-4 ml-1">
                                                            Lead POC: <span className="text-slate-900 border-b-2 border-indigo-100">{inquiry.contactName}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8 align-top">
                                                    <div className="bg-white/80 p-6 rounded-[32px] border border-white shadow-xl group-hover:shadow-indigo-500/10 transition-all duration-500 scale-95 group-hover:scale-100 origin-left">
                                                        <div className="flex items-start gap-4 mb-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                                                                <FiBox className="text-indigo-600" size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[15px] font-black text-slate-900 leading-tight mb-1 uppercase tracking-tight">
                                                                    {inquiry.productOfInterest}
                                                                </p>
                                                                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em]">
                                                                    Volume Matrix: {inquiry.estimatedQuantity} Units
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {inquiry.message && (
                                                            <div className="pt-4 border-t border-slate-50">
                                                                <div className="flex gap-3">
                                                                    <FiMessageSquare size={14} className="text-slate-300 mt-1 shrink-0" />
                                                                    <p className="text-[12px] text-slate-500 font-bold leading-relaxed italic line-clamp-3" title={inquiry.message}>
                                                                        "{inquiry.message}"
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-8 align-top">
                                                    <div className="flex flex-col gap-1 mt-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lead Strategist</span>
                                                        <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]"></div>
                                                            {inquiry.assignedTo || 'Unassigned'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-8 align-middle text-center">
                                                    <StatusBadge status={inquiry.status} />
                                                </td>
                                                <td className="p-8 pr-12 align-middle text-right">
                                                    <div className="relative inline-block group/sel">
                                                        <select 
                                                            value={inquiry.status}
                                                            onChange={(e) => handleStatusUpdate(inquiry._id, e.target.value)}
                                                            disabled={updatingId === inquiry._id}
                                                            className="appearance-none bg-slate-900 border-none rounded-2xl px-8 py-4 pr-14 text-[11px] font-black uppercase tracking-[0.2em] text-white focus:ring-4 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-xl disabled:opacity-50 hover:bg-slate-800"
                                                        >
                                                            <option value="New">Initialize</option>
                                                            <option value="Contacted">Contacted</option>
                                                            <option value="Quote Sent">Sync Quote</option>
                                                            <option value="Closed">Terminate</option>
                                                        </select>
                                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 group-hover/sel:scale-110 transition-transform">
                                                            <FiTrendingUp size={16} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WholesaleInquiriesTable;

