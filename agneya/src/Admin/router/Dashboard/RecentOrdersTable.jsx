import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiChevronRight, FiClock, FiCheckCircle, FiPackage, FiTruck, FiXCircle, FiTrendingUp } from 'react-icons/fi';

const RecentOrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        
        const response = await axios.get('/api/admin/orders/recent', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (response.data.success) {
          setOrders(response.data.data);
        } else {
          setError('Failed to fetch orders');
        }
      } catch (err) {
        console.error('Recent Fetch Error:', err);
        setError('Network Error');
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const FiActivity = (props) => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
  );

  const FiPrinter = (props) => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
  );

  const statusConfig = {
    Pending: { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: FiClock },
    Processing: { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: FiActivity },
    Printing: { color: 'text-purple-600 bg-purple-50 border-purple-100', icon: FiPrinter },
    Shipped: { color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: FiTruck },
    Delivered: { color: 'text-green-600 bg-green-50 border-green-100', icon: FiCheckCircle },
    Cancelled: { color: 'text-red-600 bg-red-50 border-red-100', icon: FiXCircle }
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white shadow-2xl p-20 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tracking Live Orders...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white shadow-2xl overflow-hidden flex flex-col h-full border-gray-100">
      <div className="px-8 py-7 border-b border-gray-50 flex justify-between items-center">
        <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                <FiTrendingUp className="text-indigo-500" /> Recent Fulfillment tasks
            </h2>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wide">LATEST ACTIVITY FROM THE STOREFRONT</p>
        </div>
        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-100 tracking-widest">{orders.length} ACTIVE</span>
      </div>
      
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        {orders.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                  <FiPackage size={24} className="text-gray-200" />
              </div>
              <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em]">Archive is empty</p>
          </div>
        ) : (
          <table className="min-w-full border-separate border-spacing-0">
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => {
                  const config = statusConfig[order.orderStatus] || statusConfig.Pending;
                  const StatusIcon = config.icon;
                  return (
                    <tr key={order._id} className="hover:bg-indigo-50/30 transition-all duration-300 group">
                      <td className="px-8 py-6">
                        <div className="font-black text-xs text-indigo-600 tracking-wider uppercase">{order.orderId}</div>
                        <div className="text-[10px] text-gray-400 font-black mt-1 uppercase tracking-widest opacity-60">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-black text-gray-900 uppercase tracking-tight">{order.customer.name}</div>
                        <div className="text-[10px] font-black text-indigo-500 mt-0.5 tracking-tighter">₹ {order.totalAmount.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] border ${config.color}`}>
                                <StatusIcon size={12} /> {order.orderStatus}
                            </span>
                            <Link to={`/admin/orders/details/${order._id}`} className="inline-flex items-center gap-1 text-[9px] font-black text-gray-300 hover:text-indigo-600 uppercase tracking-widest transition-colors group-hover:text-indigo-500">
                              View Details <FiChevronRight />
                            </Link>
                        </div>
                      </td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-6 bg-gray-50/50 mt-auto border-t border-gray-50">
        <Link 
          to="/admin/orders/list" 
          className="flex items-center justify-center gap-3 w-full py-4 text-[10px] font-black text-gray-900 hover:bg-white hover:shadow-xl rounded-2xl transition-all uppercase tracking-[0.2em] border border-gray-100"
        >
          Access Full Archives <FiChevronRight />
        </Link>
      </div>
    </div>
  );
};

export default RecentOrdersTable;

