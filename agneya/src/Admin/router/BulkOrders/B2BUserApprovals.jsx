import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiMail, FiBriefcase, FiFileText, FiCheckCircle, FiXCircle, FiClock, FiTrendingUp } from 'react-icons/fi';

const B2BUserApprovals = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchApplications = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('/api/admin/bulk-orders/applications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplications(response.data.data || []);
        } catch (err) {
            console.error("Error fetching B2B applications:", err);
            setError(err.response?.data?.message || "Failed to load applications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleAction = async (id, newStatus) => {
        const originalApps = [...applications];
        setApplications(applications.map(app => 
            app._id === id ? { ...app, status: newStatus } : app
        ));
        setUpdatingId(id);
        
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`/api/admin/bulk-orders/applications/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMessage(`Account ${newStatus.toLowerCase()} successfully!`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error(`Error updating to ${newStatus}:`, err);
            setApplications(originalApps);
            setError(err.response?.data?.message || `Failed to update to ${newStatus}.`);
        } finally {
            setUpdatingId(null);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            'Pending': 'bg-blue-50 text-blue-600 border-blue-100',
            'Approved': 'bg-green-50 text-green-600 border-green-100',
            'Rejected': 'bg-red-50 text-red-600 border-red-100'
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
                {status === 'Pending' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 animate-pulse"></span>}
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
                
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-px w-10 bg-indigo-600"></div>
                            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em]">Partner Authentication</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">B2B <span className="text-indigo-600">Registry</span></h1>
                        <p className="text-lg text-slate-400 font-bold max-w-lg leading-relaxed">
                            Verifying business compliance, tax identities, and industrial credentials for enterprise partnerships.
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
                        Authentication Conflict: {error}
                    </div>
                )}

                {/* Applications Registry */}
                <div className="relative">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 bg-white/40 backdrop-blur-3xl rounded-[48px] border border-white shadow-xl">
                            <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                            <p className="text-[11px] text-slate-400 font-black tracking-[0.3em] uppercase">Reading Registry Core...</p>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="text-center bg-white/40 backdrop-blur-3xl py-32 px-4 shadow-xl rounded-[48px] border border-white">
                            <div className="bg-slate-100 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                                <FiBriefcase size={32} className="text-slate-300 stroke-1" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Ledger Clear</h3>
                            <p className="text-sm text-slate-400 font-bold max-w-xs mx-auto uppercase tracking-widest leading-relaxed">No pending business applications identified in current queue.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.08)] rounded-[48px] border border-white bg-white/60 backdrop-blur-3xl">
                            <div className="max-h-[70vh] overflow-y-auto no-scrollbar scroll-smooth">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/80 backdrop-blur-3xl sticky top-0 z-20">
                                        <tr className="border-b border-slate-100">
                                            <th className="p-8 pl-12 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Corporate Entity</th>
                                            <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Authority Node</th>
                                            <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Compliance Checksum</th>
                                            <th className="p-8 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Flow State</th>
                                            <th className="p-8 pr-12 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Registry Cmd</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {applications.map((app) => (
                                            <tr key={app._id} className="hover:bg-indigo-50/40 transition-all duration-500 group">
                                                <td className="p-8 pl-12 align-top">
                                                    <div className="flex items-start gap-6">
                                                        <div className="w-16 h-16 rounded-[24px] bg-slate-900 flex items-center justify-center shrink-0 shadow-2xl group-hover:bg-indigo-600 transition-colors duration-500">
                                                            <FiBriefcase className="text-white" size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-3">
                                                                {app.businessName}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <span className="px-3 py-1 bg-white border border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest rounded-full">{app.businessType}</span>
                                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                                                                    <FiClock size={12} /> {new Date(app.createdAt).toLocaleString([], { dateStyle: 'medium' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                
                                                <td className="p-8 align-top">
                                                    <div className="text-[15px] text-slate-900 font-black mb-3 tracking-tight uppercase">
                                                        {app.applicantName}
                                                    </div>
                                                    <div className="inline-flex items-center gap-3 text-[11px] font-black text-slate-500 bg-white/80 px-4 py-2 rounded-xl border border-slate-100 shadow-sm transition-all lowercase">
                                                        <FiMail className="text-indigo-500 shrink-0" />
                                                        <span className="truncate max-w-[200px]">{app.email}</span>
                                                    </div>
                                                </td>

                                                <td className="p-8 align-top">
                                                    <div className="flex items-center gap-3 text-[14px] font-black text-slate-900 bg-white/80 px-5 py-3 rounded-2xl border border-slate-100 w-max shadow-xl">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                        <span className="tracking-[0.2em] uppercase font-mono">{app.taxId}</span>
                                                    </div>
                                                </td>

                                                <td className="p-8 align-middle text-center">
                                                    <StatusBadge status={app.status} />
                                                </td>

                                                <td className="p-8 pr-12 align-middle text-right">
                                                    <div className={`flex items-center justify-end gap-3 transition-opacity duration-300 ${updatingId === app._id ? 'opacity-30 pointer-events-none' : ''}`}>
                                                        {app.status === 'Pending' ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAction(app._id, 'Approved')}
                                                                    className="group/btn px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:bg-emerald-600 hover:shadow-emerald-500/20 active:scale-95"
                                                                >
                                                                    Authorize
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(app._id, 'Rejected')}
                                                                    className="px-8 py-3.5 bg-white border-2 border-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                                                                >
                                                                    Decline
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] px-4 italic">Action Processed</span>
                                                        )}
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

export default B2BUserApprovals;

