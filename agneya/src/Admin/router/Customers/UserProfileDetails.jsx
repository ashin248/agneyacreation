import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiMail, FiPhone, FiCreditCard, FiArrowRight, FiTrendingUp, FiPackage, FiCalendar } from 'react-icons/fi';

const UserProfileDetails = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('adminToken');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [userRes, ordersRes] = await Promise.all([
          axios.get(`/api/admin/customers/${id}`, config),
          axios.get(`/api/admin/customers/${id}/orders`, config)
        ]);

        if (userRes.data.success && ordersRes.data.success) {
          setUser(userRes.data.data);
          setOrders(ordersRes.data.data);
        } else {
          setError('Failed to aggregate user ecosystem.');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Network Connection Error resolving profile.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfileData();
  }, [id]);

  const toggleBlockStatus = async () => {
    if (actionLoading) return;
    if (!user.isBlocked && !window.confirm('Are you sure you want to suspend this user?')) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`/api/admin/customers/${id}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUser(prev => ({ ...prev, isBlocked: !prev.isBlocked }));
      }
    } catch (err) {
      console.error('Error toggling block:', err);
      alert('Failed to execute security command.');
    } finally {
      setActionLoading(false);
    }
  };

  const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  
  const StatusBadge = ({ status }) => {
    const styles = {
      Pending: 'bg-yellow-50 text-yellow-600 border-yellow-100',
      Processing: 'bg-blue-50 text-blue-600 border-blue-100',
      Printing: 'bg-purple-50 text-purple-600 border-purple-100',
      Shipped: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      Delivered: 'bg-green-50 text-green-600 border-green-100',
      Cancelled: 'bg-red-50 text-red-600 border-red-100'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || 'bg-gray-50 text-gray-400 border-gray-100'}`}>
        {status}
      </span>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resolving Identity...</p>
    </div>
  );

  if (error || !user) return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-red-50 border border-red-100 p-6 rounded-[24px] text-red-600">
        <p className="font-black text-lg uppercase tracking-tight">Identity Load Failure</p>
        <p className="mt-2 text-sm font-bold opacity-80">{error || "User profile invalid."}</p>
        <Link to="/admin/gst-manager/list" className="mt-6 inline-flex items-center gap-2 text-[10px] font-black text-white bg-red-600 px-6 py-2.5 rounded-xl uppercase tracking-widest shadow-lg shadow-red-500/20">
           &larr; Return to Directory
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-4 font-sans text-gray-800">
      {/* Breadcrumb Context */}
      <div className="mb-8 px-2">
        <Link to="/admin/gst-manager/list" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-blue-600 flex items-center transition-all group">
          <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Protocol: Customer Directory
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Identity Card */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl overflow-hidden border-gray-100 relative">
             <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
             
             <div className="p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
                <div className={`w-32 h-32 flex-shrink-0 rounded-[40px] flex items-center justify-center font-black text-5xl border shadow-xl transition-all duration-500 ${
                  user.isBlocked ? 'bg-red-50 text-red-500 border-red-100 grayscale' : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                   {user.name.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 text-center md:text-left">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                      <div>
                         <h1 className={`text-4xl font-black tracking-tighter ${user.isBlocked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{user.name}</h1>
                         <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                            <span className="inline-flex items-center gap-2 text-[11px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 border-dashed">
                               <FiMail /> {user.email}
                            </span>
                            <span className="inline-flex items-center gap-2 text-[11px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 border-dashed">
                               <FiPhone /> {user.phone || 'NO COORDS'}
                            </span>
                         </div>
                      </div>
                      
                      <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                        user.isBlocked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
                      }`}>
                         {user.isBlocked ? 'ACCESS REVOKED' : 'AUTHORIZED'}
                      </div>
                   </div>
                   
                   <div className="flex items-center justify-center md:justify-start gap-3 pt-6 border-t border-gray-50">
                      <button 
                        onClick={toggleBlockStatus}
                        disabled={actionLoading}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                          user.isBlocked 
                            ? 'bg-blue-600 text-white hover:bg-blue-500' 
                            : 'bg-white border border-red-100 text-red-500 hover:bg-red-50 shadow-red-500/10'
                        } ${actionLoading ? 'opacity-50' : ''}`}
                      >
                        {actionLoading ? 'SYNCING...' : user.isBlocked ? 'RESTORE FULL ACCESS' : 'REVOKE SECURITY TOKEN'}
                      </button>
                   </div>
                </div>
             </div>
          </div>

          {/* Detailed Transaction Ledger */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl overflow-hidden border-gray-100">
             <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-3 uppercase">
                   <FiCreditCard className="text-blue-500" />
                   Transaction Registry
                </h3>
             </div>
             
             <div className="overflow-x-auto min-h-[300px]">
                {orders.length === 0 ? (
                  <div className="text-center p-20 text-gray-300">
                    <FiPackage size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-xs font-black uppercase tracking-widest">No Active Commerce Logs</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-50 text-[10px] uppercase tracking-[0.2em] text-gray-400 bg-white/50">
                        <th className="font-black p-6 pl-10">Contract ID</th>
                        <th className="font-black p-6">Capacity</th>
                        <th className="font-black p-6">Valuation</th>
                        <th className="font-black p-6 text-center">Lifecycle</th>
                        <th className="font-black p-6 pr-10 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orders.map(order => (
                        <tr key={order._id} className="hover:bg-blue-50/20 transition-all group">
                          <td className="p-6 pl-10">
                             <p className="font-black text-[14px] text-blue-600 tracking-tighter">{order.orderId}</p>
                             <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">
                                {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                             </p>
                          </td>
                          <td className="p-6">
                             <p className="text-[13px] font-black text-gray-900">{order.items.reduce((acc, curr) => acc + curr.quantity, 0)} Units</p>
                          </td>
                          <td className="p-6">
                             <p className="text-[15px] font-black text-gray-900 tracking-tight">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                          </td>
                          <td className="p-6 text-center">
                             <StatusBadge status={order.orderStatus} />
                          </td>
                          <td className="p-6 pr-10 text-right">
                             <Link to={`/admin/orders/details/${order._id}`} className="inline-flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                               VIEW <FiArrowRight />
                             </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
             </div>
          </div>
        </div>

        {/* Sidebar Intelligence */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-gray-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none"></div>
              
              <div className="space-y-10">
                 <div>
                    <div className="flex items-center gap-3 mb-4 text-white/40 uppercase tracking-widest text-[10px] font-black">
                       <FiTrendingUp className="text-blue-400" /> Capital Yield
                    </div>
                    <p className="text-4xl font-black tracking-tighter">₹{totalSpent.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Ecosystem LTV</p>
                 </div>

                 <div className="pt-8 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-4 text-white/40 uppercase tracking-widest text-[10px] font-black">
                       <FiPackage className="text-blue-400" /> Engagement
                    </div>
                    <p className="text-4xl font-black tracking-tighter">{orders.length}</p>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Contract Cycles</p>
                 </div>
                 
                 <div className="pt-8 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-4 text-white/40 uppercase tracking-widest text-[10px] font-black">
                       <FiCalendar className="text-blue-400" /> Tenure
                    </div>
                    <p className="text-xl font-black tracking-tight">{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Identity Initialized</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileDetails;

