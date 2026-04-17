import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiFileText, FiShield, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const BusinessGSTManager = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/customers/gst-applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setApplications(response.data.data);
      } else {
        setError('Failed to fetch evaluation requests.');
      }
    } catch (err) {
      console.error('Fetch GST error:', err);
      setError('Connection failure aggregating business pipelines.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (userId, newStatus) => {
    if (actionLoadingId) return;

    try {
      setActionLoadingId(userId);
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`/api/admin/customers/${userId}/gst`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setApplications(prev => prev.map(app => 
          app._id === userId ? { 
            ...app, 
            businessProfile: { ...app.businessProfile, gstStatus: newStatus }
          } : app
        ));
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Internal Server Error executing verification.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      'None': 'bg-gray-100 text-gray-500 border-gray-200',
      'Pending': 'bg-blue-50 text-blue-600 border-blue-100',
      'Verified': 'bg-green-50 text-green-600 border-green-100',
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
    <div className="min-h-[80vh] bg-transparent text-gray-800 font-sans">
      {/* Header Area */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             GST Compliance
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Audit and verification protocol for high-tier B2B tax identities</p>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-[13px] font-bold">
            {error}
        </div>
      )}

      {/* Compliance Registry Container */}
      <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl relative overflow-hidden border-gray-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

        <div className="overflow-x-auto relative z-10 min-h-[500px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-80 gap-3">
                <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Auditing Tax IDs...</p>
             </div>
          ) : applications.length === 0 ? (
            <div className="text-center p-12 flex flex-col items-center justify-center h-80 text-gray-400">
              <div className="w-20 h-20 bg-gray-50 rounded-[30px] flex items-center justify-center mb-6">
                <FiFileText size={32} className="opacity-20 stroke-1" />
              </div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Compliance Neutral</h3>
              <p className="mt-2 text-sm font-medium opacity-60">No pending business certification requests currently indexed.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] uppercase tracking-[0.2em] text-gray-400 bg-white/50 backdrop-blur-md sticky top-0 z-20">
                  <th className="font-black p-6 pl-10 whitespace-nowrap">Enterprise Entity</th>
                  <th className="font-black p-6">Tax Identity (GSTN)</th>
                  <th className="font-black p-6">Auth Node</th>
                  <th className="font-black p-6 text-center">Status</th>
                  <th className="font-black p-6 pr-10 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map(app => (
                  <tr key={app._id} className="hover:bg-emerald-50/20 transition-all group">
                    <td className="p-6 pl-10">
                       <p className="text-[16px] font-black text-gray-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                          {app.businessProfile?.companyName || 'NAMED ENTITY'}
                       </p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Principal: {app.name}</p>
                    </td>
                    <td className="p-6">
                       <div className="text-[14px] font-black text-emerald-700 bg-emerald-50 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-100 select-all font-mono tracking-widest shadow-sm">
                          <FiShield size={14} className="opacity-50" />
                          {app.businessProfile?.gstNumber}
                       </div>
                    </td>
                    <td className="p-6">
                       <p className="text-[14px] font-black text-gray-900 tracking-tight">{app.email}</p>
                       <p className="text-[11px] text-gray-400 font-bold mt-1 tracking-widest">{app.phone || 'NO COORDS'}</p>
                    </td>
                    <td className="p-6 text-center">
                       <StatusBadge status={app.businessProfile?.gstStatus} />
                    </td>
                    <td className="p-6 pr-10 text-right">
                       {app.businessProfile?.gstStatus === 'Pending' ? (
                         <div className="flex justify-end gap-3 transition-opacity">
                            <button 
                              onClick={() => updateStatus(app._id, 'Verified')}
                              disabled={actionLoadingId === app._id}
                              className={`flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 ${actionLoadingId === app._id ? 'opacity-50' : ''}`}
                            >
                               <FiCheckCircle size={14} /> Verify
                            </button>
                            <button 
                              onClick={() => updateStatus(app._id, 'Rejected')}
                              disabled={actionLoadingId === app._id}
                              className={`flex items-center gap-2 px-4 py-2 bg-white border border-red-50 text-red-500 hover:bg-red-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${actionLoadingId === app._id ? 'opacity-50' : ''}`}
                            >
                               <FiXCircle size={14} /> Reject
                            </button>
                         </div>
                       ) : (
                         <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic px-2">Compliance Logged</span>
                       )}
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

export default BusinessGSTManager;

