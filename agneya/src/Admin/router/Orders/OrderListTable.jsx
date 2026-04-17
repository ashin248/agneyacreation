import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiChevronRight } from 'react-icons/fi';

const OrderListTable = ({ forcedType = 'All' }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState(forcedType);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we use the token from localStorage consistently with the rest of the auth system
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load orders.');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Connection error rendering orders table.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Advanced Filtering Logic with defensive checks for missing data
  const filteredOrders = orders.filter(order => {
      // 1. Search Filter (ID or Name or Email)
      const matchesSearch = 
        (order.orderId || "").toLowerCase().includes(filterSearch.toLowerCase()) ||
        (order.customer?.name || "").toLowerCase().includes(filterSearch.toLowerCase()) ||
        (order.customer?.email || "").toLowerCase().includes(filterSearch.toLowerCase());
      
      // 2. Status Filter
      const matchesStatus = filterStatus === 'All' || order.orderStatus === filterStatus;

      // 3. Type Filter with Sub-type Detection
      const matchesType = filterType === 'All' || (() => {
          if (filterType === 'Manual') {
              return order.items?.some(item => item.customData?.mode === 'manual');
          }
          if (filterType === 'Studio') {
              return order.items?.some(item => item.customData?.mode === 'self');
          }
          return order.orderType === filterType;
      })();

      return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex w-full h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm text-red-700 m-8">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
        <button onClick={fetchOrders} className="mt-2 text-sm text-red-800 underline hover:text-red-900">Try Again</button>
      </div>
    );
  }

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
              <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em]">Operations Management</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Order <span className="text-indigo-600">Archive</span></h1>
            <p className="text-lg text-slate-400 font-bold max-w-lg leading-relaxed">
              Oversight of retail, custom, and wholesale corporate accounts with real-time settlement tracking.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/70 backdrop-blur-xl p-2 rounded-[24px] border border-white shadow-xl">
             <div className="px-6 py-4 rounded-2xl bg-slate-900 text-white space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Order Volume</p>
                <p className="text-xl font-black">{filteredOrders.length}</p>
             </div>
          </div>
        </div>

        {/* PREMIUM FILTER BAR */}
        <div className="mb-12 bg-white/40 backdrop-blur-2xl border border-white p-8 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col xl:flex-row gap-8 items-end">
            
            {/* SEARCH FIELD */}
            <div className="flex-1 w-full relative">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-2">Search Master Records</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                   <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                </div>
                <input 
                  type="text" 
                  placeholder="ORDER ID, CLIENT NAME OR EMAIL ADDRESS..." 
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="block w-full pl-16 pr-6 py-5 bg-white/80 border border-slate-100 rounded-[24px] text-xs font-black tracking-widest focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all outline-none shadow-sm placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="flex flex-wrap md:flex-nowrap gap-6 w-full xl:w-auto">
              {/* STATUS FILTER */}
              <div className="w-full md:w-56">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-2">Flow Lifecycle</label>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-full px-6 py-5 bg-white/80 border border-slate-100 rounded-[24px] text-[10px] font-black text-slate-700 tracking-widest focus:ring-4 focus:ring-indigo-500/5 appearance-none cursor-pointer outline-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2.5\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1em' }}
                >
                  <option value="All">ALL STATUSES</option>
                  <option value="Pending">🕒 PENDING</option>
                  <option value="Processing">⚡ PROCESSING</option>
                  <option value="Printing">🎨 PRINTING</option>
                  <option value="Shipped">🚚 SHIPPED</option>
                  <option value="Delivered">✅ DELIVERED</option>
                  <option value="Cancelled">❌ CANCELLED</option>
                </select>
              </div>

              {/* TYPE FILTER (Only show if not forced to a specific type) */}
              {forcedType === 'All' && (
                  <div className="w-full md:w-56">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-2">Product Domain</label>
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="block w-full px-6 py-5 bg-white/80 border border-slate-100 rounded-[24px] text-[10px] font-black text-slate-700 tracking-widest focus:ring-4 focus:ring-indigo-500/5 appearance-none cursor-pointer outline-none"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2.5\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1em' }}
                    >
                      <option value="All">ALL DOMAINS</option>
                      <option value="Standard">READY STOCK</option>
                      <option value="Manual">🛠️ MANUAL BRIEF</option>
                      <option value="Studio">🎨 STUDIO DESIGN</option>
                      <option value="Bulk">WHOLESALE</option>
                    </select>
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* DATA TABLE WRAPPER */}
        <div className="relative">
          {filteredOrders.length === 0 ? (
            <div className="text-center bg-white/40 backdrop-blur-3xl py-32 px-4 shadow-xl rounded-[48px] border border-white">
              <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">No Matching Records</h3>
              <p className="text-sm text-slate-400 font-bold max-w-xs mx-auto uppercase tracking-widest">Adjust filters to find the required data stream.</p>
            </div>
          ) : (
            <div className="overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.08)] rounded-[48px] border border-white bg-white/60 backdrop-blur-3xl group">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 border-separate border-spacing-0">
                  <thead className="bg-slate-50/80 backdrop-blur-3xl sticky top-0 z-10 border-b border-slate-100">
                    <tr>
                      <th scope="col" className="py-8 pl-10 pr-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Reference</th>
                      <th scope="col" className="px-6 py-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Entity</th>
                      <th scope="col" className="px-6 py-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Type Logic</th>
                      <th scope="col" className="px-6 py-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Settlement</th>
                      <th scope="col" className="px-6 py-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Revenue</th>
                      <th scope="col" className="px-6 py-8 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Fulfillment</th>
                      <th scope="col" className="py-8 pl-6 pr-10 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-transparent">
                    {filteredOrders.map((order) => {
                      const statusColors = {
                        Pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-amber-500/5',
                        Processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-blue-500/5',
                        Printing: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20 shadow-fuchsia-500/5',
                        Shipped: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 shadow-indigo-500/5',
                        Delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-emerald-500/5',
                        Cancelled: 'bg-red-500/10 text-red-600 border-red-500/20 shadow-red-500/5'
                      };

                      const isManual = order.items?.some(i => i.customData?.mode === 'manual' || i.name?.includes('[MANUAL DESIGN REQUEST]') || i.name?.includes('[Manual Custom]'));
                      const isStudio = order.items?.some(i => i.customData?.mode === 'self');

                      return (
                        <tr key={order._id} className="hover:bg-indigo-50/40 transition-all duration-500 group/row">
                          <td className="whitespace-nowrap py-8 pl-10 pr-4 text-sm">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 tracking-tighter text-[15px] group-hover/row:text-indigo-600 transition-colors uppercase">{order.orderId}</span>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                  {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-8 text-sm">
                            <div className="font-black text-slate-900 uppercase tracking-tight leading-none text-sm">{order.customer.name}</div>
                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">{order.customer.email}</div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-8 text-sm">
                            <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                              isManual ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' :
                              isStudio ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-lg shadow-fuchsia-100' :
                              order.orderType === 'Bulk' ? 'bg-slate-900 text-white border-slate-900' :
                              'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                              {isManual ? 'Manual Brief' : isStudio ? 'Studio Asset' : order.orderType.toUpperCase()}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-8 text-sm">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                              order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100 animate-pulse'
                            }`}>
                               <div className={`w-1.5 h-1.5 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                               {order.paymentStatus === 'Paid' ? 'Settled' : 'Unpaid'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-8 text-sm">
                            <div className="font-black text-slate-900 tracking-tighter">₹{order.totalAmount.toLocaleString('en-IN')}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{order.items.length} Units</div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-8 text-center text-sm">
                             <span className={`inline-block px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${statusColors[order.orderStatus] || statusColors.Pending}`}>
                               {order.orderStatus}
                             </span>
                          </td>
                          <td className="whitespace-nowrap py-8 pl-6 pr-10 text-right text-sm">
                            <Link 
                              to={forcedType === 'Manual' ? `/admin/design-assistance/details/${order._id}` : `/admin/orders/details/${order._id}`}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest border-2 border-slate-100 rounded-2xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm hover:shadow-xl active:scale-95"
                            >
                              Details <FiChevronRight className="text-current" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
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

export default OrderListTable;

