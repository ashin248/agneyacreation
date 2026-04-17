import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiPackage, FiSearch, FiCreditCard, FiArrowRight } from 'react-icons/fi';

const CustomerOrderHistory = ({ userId: propUserId, userEmail }) => {
  const { id: paramId } = useParams();
  const userId = propUserId || paramId;
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`/api/admin/customers/${userId}/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setOrders(response.data.data);
        } else {
          setError('Failed to fetch tracking details.');
        }
      } catch (err) {
        console.error('Error fetching history:', err);
        setError('Network Connection Error retrieving purchases.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchOrders();
  }, [userId]);

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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || 'bg-gray-50 text-gray-400 border-gray-100'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-white/70 backdrop-blur-xl rounded-[32px] border border-gray-100">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compiling History...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-2 font-sans text-gray-800">
      {/* Header Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 px-2 gap-4">
        <div>
          <Link to={`/admin/gst-manager/profile/${userId}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-blue-600 flex items-center transition-all group mb-4">
            <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Profile Dossier
          </Link>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             Transaction Ledger
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Audit of localized commerce cycles and fulfillments</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 p-6 rounded-[24px] text-red-600 text-center font-bold">
          {error}
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl overflow-hidden border-gray-100 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

          <div className="overflow-x-auto relative z-10 min-h-[400px]">
            {orders.length === 0 ? (
              <div className="text-center p-20 text-gray-400">
                 <FiPackage size={48} className="mx-auto mb-6 opacity-10 stroke-1" />
                 <h3 className="text-lg font-black text-gray-800 tracking-tight uppercase">Registry Empty</h3>
                 <p className="mt-2 text-sm font-medium opacity-60 max-w-xs mx-auto">No logged transactions found for this identity node.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] uppercase tracking-[0.2em] text-gray-400 bg-white/50 backdrop-blur-md">
                    <th className="font-black p-6 pl-10 whitespace-nowrap">Contract Entry</th>
                    <th className="font-black p-6">Capacity</th>
                    <th className="font-black p-6">Valuation</th>
                    <th className="font-black p-6 text-center">Lifecycle</th>
                    <th className="font-black p-6 pr-10 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-transparent">
                  {orders.map(order => (
                    <tr key={order._id} className="hover:bg-blue-50/20 transition-all group">
                       <td className="p-6 pl-10">
                          <p className="font-black text-[14px] text-blue-600 tracking-tighter">{order.orderId}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">
                             {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                       </td>
                       <td className="p-6">
                          <p className="text-[13px] font-black text-gray-900 tracking-tight">{order.items.reduce((acc, curr) => acc + curr.quantity, 0)} Units</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Inventory Count</p>
                       </td>
                       <td className="p-6">
                          <p className="text-[15px] font-black text-gray-900 tracking-tight">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-tighter">Settled</p>
                       </td>
                       <td className="p-6 text-center">
                           <StatusBadge status={order.orderStatus} />
                       </td>
                       <td className="p-6 pr-10 text-right">
                          <Link to={`/admin/orders/details/${order._id}`} className="inline-flex items-center gap-2 text-[10px] font-black text-white bg-gray-900 px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95">
                            SOURCE <FiArrowRight />
                          </Link>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderHistory;

