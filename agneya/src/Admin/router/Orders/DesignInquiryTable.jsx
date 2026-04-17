import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiChevronRight, FiClock, FiCheckCircle, FiXCircle, FiInfo, FiExternalLink, FiDownload, FiUser, FiPhone, FiMail, FiX } from 'react-icons/fi';

const DesignInquiryTable = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/custom-designs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.data.success) {
        setInquiries(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching design inquiries:', err);
      setError('System failure while retrieving design correspondence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-100';
      case 'In Production': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`/api/admin/custom-designs/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedInquiry(null);
      fetchInquiries();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status.');
    }
  };

  const downloadAsset = (url, name) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', name || 'agneya_asset');
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Incoming Design Briefs</h3>
        <button onClick={fetchInquiries} className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-600/20 hover:border-indigo-600 transition-all">Sync Pipeline</button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {inquiries.filter(dq => !dq.frontCanvasData).length === 0 ? (
          <div className="bg-white rounded-[32px] p-20 text-center border border-dashed border-gray-200">
             <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No manual inquiry briefs identified.</p>
          </div>
        ) : (
          inquiries.filter(dq => !dq.frontCanvasData).map((inquiry) => (
            <div key={inquiry._id} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                {/* Client & Product Info */}
                <div className="flex gap-6 items-start">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 p-2">
                    <img 
                      src={inquiry.appliedFrontDesign || inquiry.designImage || 'https://via.placeholder.com/150?text=No+Image'} 
                      alt="" 
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getStatusColor(inquiry.status)}`}>
                        {inquiry.status}
                      </span>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">#{inquiry._id.slice(-6).toUpperCase()}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{inquiry.name}</h4>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase">{inquiry.productType} Request</p>
                  </div>
                </div>

                {/* Brief Preview */}
                <div className="flex-1 bg-gray-50/50 rounded-2xl p-4 border border-gray-50 max-w-md">
                   <div className="flex items-center gap-2 mb-2">
                      <FiInfo size={12} className="text-indigo-400" />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Quick Instruction View</span>
                   </div>
                   <p className="text-xs font-bold text-slate-700 leading-relaxed line-clamp-2 uppercase italic">
                      {inquiry.description || "NO WRITTEN INSTRUCTIONS PROVIDED."}
                   </p>
                </div>

                {/* Assets & Actions */}
                <div className="flex flex-col justify-between items-end gap-4 min-w-[140px]">
                   <div className="flex gap-2">
                      {inquiry.printAssets?.slice(0, 3).map((asset, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-lg border-2 border-white shadow-sm overflow-hidden bg-white">
                           <img src={asset} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {inquiry.printAssets?.length > 3 && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 border-2 border-white shadow-sm">
                           +{inquiry.printAssets.length - 3}
                        </div>
                      )}
                   </div>
                   
                   <button 
                     onClick={() => setSelectedInquiry(inquiry)}
                     className="px-6 py-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-500/20"
                   >
                     Inspect Brief <FiExternalLink size={12} />
                   </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* INSPECTION MODAL */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedInquiry(null)}></div>
           
           <div className="bg-white rounded-[48px] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 p-2">
                       <img src={selectedInquiry.appliedFrontDesign || selectedInquiry.designImage} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedInquiry.name}</h2>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">Manual Resource Brief / #{selectedInquiry._id.toUpperCase()}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedInquiry(null)} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                    <FiX size={20} />
                 </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#FBFCFE]">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left: Brief & Client */}
                    <div className="lg:col-span-5 space-y-10">
                       <section className="space-y-4">
                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                             Contact Uplink
                          </h4>
                          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><FiPhone /></div>
                                <span className="text-sm font-black text-slate-900">{selectedInquiry.phone}</span>
                             </div>
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><FiMail /></div>
                                <span className="text-sm font-black text-slate-900">{selectedInquiry.email}</span>
                             </div>
                          </div>
                       </section>

                       <section className="space-y-4">
                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                             Customer Instruction Brief
                          </h4>
                          <div className="bg-white p-8 rounded-[38px] border border-gray-100 shadow-sm">
                             <p className="text-sm font-bold text-slate-600 leading-relaxed uppercase italic">
                                "{selectedInquiry.description || "NO WRITTEN INSTRUCTIONS PROVIDED BY CLIENT."}"
                             </p>
                          </div>
                       </section>
                    </div>

                    {/* Right: Assets Gallery */}
                    <div className="lg:col-span-7 space-y-6">
                       <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                          Inspiration & Production Assets
                       </h4>
                       
                       <div className="grid grid-cols-2 gap-6">
                          {selectedInquiry.printAssets && selectedInquiry.printAssets.length > 0 ? (
                            selectedInquiry.printAssets.map((asset, idx) => (
                              <div key={idx} className="group relative bg-white p-3 rounded-[32px] border border-gray-100 shadow-sm hover:border-indigo-200 transition-all">
                                 <div className="aspect-[4/5] rounded-[24px] overflow-hidden bg-gray-50 border border-gray-50">
                                    <img src={asset} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={`Reference ${idx+1}`} />
                                 </div>
                                 <div className="mt-3 flex items-center justify-between px-2 pb-1">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Asset_{idx+1}.png</span>
                                    <button 
                                      onClick={() => downloadAsset(asset, `agneya_asset_${idx+1}.png`)}
                                      className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all"
                                      title="Download Asset"
                                    >
                                       <FiDownload />
                                    </button>
                                 </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 bg-gray-50 rounded-[32px] p-20 text-center border border-dashed border-gray-200">
                               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No additional resource files provided.</p>
                            </div>
                          )}
                       </div>
                    </div>

                 </div>
              </div>

              {/* Footer Actions */}
              <div className="p-8 bg-white border-t border-gray-100 flex justify-end gap-4">
                 <button onClick={() => setSelectedInquiry(null)} className="px-8 py-4 bg-gray-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all">Dismiss</button>
                 
                 {selectedInquiry.status !== 'Approved' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedInquiry._id, 'Approved')}
                      className="px-8 py-4 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 flex items-center gap-2"
                    >
                       <FiCheckCircle /> Confirm & Approve Brief
                    </button>
                 )}

                 <a 
                   href={`https://wa.me/${selectedInquiry.phone.replace(/[^0-9]/g, '')}`} 
                   target="_blank" 
                   className="px-10 py-4 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 flex items-center gap-2"
                 >
                    Contact via WhatsApp
                 </a>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DesignInquiryTable;

