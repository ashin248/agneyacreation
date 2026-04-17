import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ClipboardList,
  CheckCircle,
  Package,
  Truck,
  MapPin,
  Home,
  X,
  ShoppingBag,
  Loader2,
  InboxIcon,
  ChevronRight
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const STATUSES = [
  { id: 0, label: 'Order Received', icon: ClipboardList },
  { id: 1, label: 'Approved',       icon: CheckCircle   },
  { id: 2, label: 'Packing',        icon: Package       },
  { id: 3, label: 'Shipped',        icon: Truck         },
  { id: 4, label: 'Out for Delivery', icon: MapPin      },
  { id: 5, label: 'Delivered',      icon: Home          },
];

const TABS = ['Active Orders', 'Delivered', 'Cancelled'];

const STATUS_TO_TAB = (status = '') => {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return 'Delivered';
  if (s === 'cancelled' || s === 'rejected') return 'Cancelled';
  return 'Active Orders';
};

const STATUS_BADGE = (status = '') => {
  const s = status.toLowerCase();
  if (s.includes('delivered') && !s.includes('out'))
    return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', dot: 'bg-emerald-500' };
  if (s.includes('cancel'))
    return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', dot: 'bg-red-500' };
  if (s.includes('shipped') || s.includes('out for'))
    return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', dot: 'bg-blue-500' };
  if (s.includes('approved'))
    return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', dot: 'bg-green-500' };
  return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', dot: 'bg-amber-500' };
};

/* ─────────────────────────────────────────────────────────────
   ANIMATED STEPPER MODAL
───────────────────────────────────────────────────────────── */
const TrackingModal = ({ order, onClose }) => {
  const [animStep, setAnimStep] = useState(-1);

  useEffect(() => {
    const t = setTimeout(() => setAnimStep(order.currentStep ?? 0), 200);
    return () => clearTimeout(t);
  }, [order]);

  const estDelivery = order.estimatedDeliveryDate 
    ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gray-900 px-8 py-7 flex justify-between items-start">
          <div>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Live Tracking</p>
            <h2 className="text-white text-2xl font-black tracking-tight">#{order.orderId}</h2>
            <p className="text-gray-400 text-sm mt-1 font-medium">
              Est. Delivery: <span className="text-white font-bold">{estDelivery}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-800 px-8 py-4 flex items-center gap-3">
          <span className="text-gray-300 text-sm">Current Status:</span>
          <span className="text-white font-black text-sm bg-indigo-600 px-4 py-1.5 rounded-full">
            {(order.status === 'Pending' || order.orderStatus === 'Pending') 
              ? 'Delivery within 3 days' 
              : (order.type === 'custom' 
                ? (order.status === 'Approved' ? 'Production Started' : (order.status || 'Pending'))
                : (order.displayStatus || order.status || order.orderStatus || 'Pending'))}
          </span>
        </div>

        <div className="p-8 md:p-10">
          <div className="hidden md:block">
            <div className="relative mb-12 px-6">
              <div className="absolute top-5 left-6 right-6 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-[1500ms] ease-out rounded-full"
                  style={{ width: animStep >= 0 ? `${(animStep / (STATUSES.length - 1)) * 100}%` : '0%' }}
                />
              </div>
              <div className="relative flex justify-between">
                {STATUSES.map((step, idx) => {
                  const done   = idx <= animStep;
                  const active = idx === animStep;
                  const Icon   = step.icon;
                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 relative z-10 transition-all duration-700 ${done ? 'bg-indigo-600 border-white text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                        <Icon className="w-5 h-5" />
                        {active && <span className="absolute -inset-2 bg-indigo-400/20 rounded-full animate-ping" />}
                      </div>
                      <p className={`mt-3 text-[10px] font-black uppercase tracking-tight text-center max-w-[72px] leading-tight ${done ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {order.type === 'standard' && order.items?.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Items in this order</p>
              <div className="space-y-3 max-h-52 overflow-y-auto no-scrollbar">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400 font-bold">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-indigo-600 font-black text-sm">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.type === 'custom' && (
            <div className="border-t border-gray-100 pt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Custom Design Details</p>
                <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <img src={order.designImage} alt="Custom Preview" className="w-20 h-24 object-cover rounded-xl" />
                    <div className="flex-1">
                        <p className="text-sm font-black text-gray-900">{order.productType}</p>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Quantity: {order.quantity}</p>
                        <div className={`mt-3 inline-block px-3 py-1 text-[10px] font-black uppercase rounded-full bg-green-100 text-green-700`}>
                             Status: {order.status === 'Approved' ? 'Production Started' : order.status}
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   ORDER CARD
───────────────────────────────────────────────────────────── */
const OrderCard = ({ order, onTrack }) => {
  const currentStatus = order.orderStatus || order.status || order.displayStatus || '';
  const badge = STATUS_BADGE(currentStatus);
  const firstItem = order.items?.[0];
  const orderDate = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
    : 'PROCESSING LOG';

  // Digital Asset Path Resolver: Ensures relative asset paths are correctly mapped to their source origins
  const resolveImagePath = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    // Dynamic mapping to active backend infrastructure (Port 5000)
    return `${window.location.protocol}//${window.location.hostname}:5000${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const imageSrc = resolveImagePath(firstItem?.image || order.designImage);

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-4 flex items-center gap-4 hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 group/card">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-16 h-20 rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100 group-hover/card:scale-105 transition-transform duration-500 flex items-center justify-center">
          {imageSrc ? (
            <img 
              src={imageSrc} 
              alt="Order Asset" 
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<div class="text-slate-200"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg></div>';
              }}
            />
          ) : (
            <div className="text-slate-200">
               <Package size={32} strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-black text-slate-900 text-sm tracking-tight group-hover/card:text-indigo-600 transition-colors">#{order.orderId}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-500 shadow-sm ${badge.bg} ${badge.text} ${badge.border}`}>
              {(order.status === 'Pending' || order.orderStatus === 'Pending') 
                ? 'Delivery within 3 days' 
                : (order.status === 'Approved' ? 'PRODUCTION STARTED' : (order.displayStatus || order.status || order.orderStatus || 'SYNC PENDING'))}
            </span>
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              <div className="w-1 h-1 rounded-full bg-slate-400"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{orderDate}</span>
            </div>
          </div>
        </div>
      </div>
      <button onClick={() => onTrack(order)} className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl hover:bg-indigo-600 flex items-center gap-2 shadow-lg shadow-gray-200">
        Track <ChevronRight className="w-3" />
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
const TrackOrder = () => {
  const { currentUser, userData } = useAuth();
  const [dashboardOrders, setDashboardOrders] = useState([]);
  const [hydrating, setHydrating] = useState(true);
  const [activeTab, setActiveTab] = useState('Active Orders');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchForm, setSearchForm] = useState({ orderId: '', phone: '' });
  const [searchError, setSearchError] = useState('');

  const fetchAll = async () => {
    try {
        setHydrating(true);
        const storedOrders = JSON.parse(localStorage.getItem('myGuestOrders') || '[]');
        const storedCustom = JSON.parse(localStorage.getItem('myCustomDesigns') || '[]');

        // 1. Fetch Guest Order Detailed Statuses
        const orderPromises = storedOrders.map(o =>
            axios.post('/api/public/orders/track', { orderId: o.orderId, phone: o.phone })
                .then(r => r.data.success ? { ...o, ...r.data.data, type: 'standard' } : o)
                .catch(() => o)
        );

        const customPromises = storedCustom.map(c =>
            axios.post('/api/public/orders/track', { orderId: c._id || c.orderId, phone: c.phone })
                .then(r => {
                    if (r.data.success) {
                        const match = r.data.data;
                        const stepMap = { 'Pending': 0, 'Approved': 1, 'In Production': 2, 'Shipped': 3, 'Delivered': 5 };
                        return { ...c, ...match, type: 'custom', currentStep: stepMap[match.status] ?? 0 };
                    }
                    return c;
                })
                .catch(() => c)
        );

        // 2. Fetch Logged-in User Lifetime Orders
        let userOrders = [];
        if (userData && userData.phone) {
            try {
                const idToken = await currentUser.getIdToken();
                const res = await axios.get(`/api/public/user/orders/${userData.phone}`, {
                    headers: { Authorization: `Bearer ${idToken}` }
                });
                if (res.data.success) {
                    const stepMap = { 
                        'Pending': 0, 
                        'Processing': 1, 
                        'Printing': 2, 
                        'Shipped': 3, 
                        'Out for Delivery': 4, 
                        'Delivered': 5,
                        'Cancelled': -1
                    };
                    userOrders = [
                        ...(res.data.data.orders || []).map(o => ({ 
                            ...o, 
                            type: 'standard', 
                            currentStep: stepMap[o.orderStatus] ?? 0 
                        })),
                        ...(res.data.data.customDesigns || []).map(c => ({ 
                            ...c, 
                            type: 'custom', 
                            orderId: c._id, 
                            currentStep: stepMap[c.status] ?? 0 
                        }))
                    ];
                }
            } catch (e) {
                console.error("Failed to sync user lifetime orders matrix");
            }
        }

        const results = await Promise.allSettled([...orderPromises, ...customPromises]);
        const guestResults = results.map(r => r.value);

        // Deduplicate and Merge
        const merged = [...userOrders];
        guestResults.forEach(go => {
            if (!merged.find(m => m.orderId === go.orderId)) {
                merged.push(go);
            }
        });

        setDashboardOrders(merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } finally {
        setHydrating(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [userData]);

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!searchForm.orderId || !searchForm.phone) return;
    
    setHydrating(true);
    setSearchError('');
    try {
        const response = await axios.post('/api/public/orders/track', searchForm);
        if (response.data.success) {
            const order = response.data.data;
            const type = order.items ? 'standard' : 'custom';
            const stepMap = { 'Pending': 0, 'Approved': 1, 'In Production': 2, 'Shipped': 3, 'Delivered': 5 };
            const fullOrder = { ...order, type, currentStep: stepMap[order.status] ?? order.currentStep };
            
            setSelectedOrder(fullOrder);
            
            // Save to guest history for convenience
            if (type === 'standard') {
                const history = JSON.parse(localStorage.getItem('myGuestOrders') || '[]');
                if (!history.find(h => h.orderId === order.orderId)) {
                    history.push({ orderId: order.orderId, phone: searchForm.phone });
                    localStorage.setItem('myGuestOrders', JSON.stringify(history));
                }
            }
            fetchAll();
        }
    } catch (error) {
        setSearchError('Logistics mismatch: Order ID or Phone number not recognized in our database.');
    } finally {
        setHydrating(false);
    }
  };

  const filteredOrders = dashboardOrders.filter(o => STATUS_TO_TAB(o.orderStatus || o.displayStatus || o.status || '') === activeTab);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-50/30 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none"></div>

      {selectedOrder && <TrackingModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter italic">Track Your Order</h1>
            <p className="text-indigo-500 font-black text-[10px] uppercase mt-2 tracking-[0.3em] flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
               Order Status & Logistics History
            </p>
          </div>
          {dashboardOrders.length > 0 && (
            <button 
              onClick={() => {
                if(window.confirm('Wipe all browser-bound tracking history? Metadata will remain on servers.')) {
                  localStorage.removeItem('myGuestOrders');
                  localStorage.removeItem('myCustomDesigns');
                  setDashboardOrders([]);
                }
              }}
              className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
            >
              Clear Local Cache
            </button>
          )}
        </div>

        {/* Manual Search Node */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-indigo-50 shadow-xl shadow-indigo-500/5 mb-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-bl-full -mr-8 -mt-8"></div>
            <div className="relative z-10">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-600" /> Search Your Order
                </h2>
                <form onSubmit={handleManualSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                        type="text" 
                        placeholder="ORDER ID (e.g. ORD-XXX)" 
                        value={searchForm.orderId}
                        onChange={e => setSearchForm({...searchForm, orderId: e.target.value})}
                        className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black text-gray-900 placeholder:text-gray-300 focus:ring-4 focus:ring-indigo-500/5 outline-none tracking-widest"
                    />
                    <input 
                        type="tel" 
                        placeholder="LINKED PHONE NUMBER" 
                        value={searchForm.phone}
                        onChange={e => setSearchForm({...searchForm, phone: e.target.value})}
                        className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black text-gray-900 placeholder:text-gray-300 focus:ring-4 focus:ring-indigo-500/5 outline-none tracking-widest"
                    />
                    <button 
                        type="submit" 
                        disabled={hydrating}
                        className="bg-indigo-600 text-white rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-900 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50"
                    >
                        Initialize Search
                    </button>
                </form>
                {searchError && (
                    <p className="mt-4 text-[10px] font-black text-rose-500 uppercase tracking-tight flex items-center gap-2">
                        <X className="w-3" /> {searchError}
                    </p>
                )}
            </div>
        </div>

        <div className="flex gap-2 bg-indigo-50/50 p-1.5 rounded-2xl border border-indigo-100/30 mb-8 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10 border border-indigo-100' : 'text-gray-400 hover:text-gray-900'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {hydrating ? (
          <div className="text-center py-20 flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Synchronizing Asset Matrix...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order, idx) => (
              <OrderCard key={idx} order={order} onTrack={setSelectedOrder} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center">
            <InboxIcon className="w-16 h-16 text-gray-100 mb-6 stroke-1" />
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">No Recent Orders Found</h3>
            <p className="text-[10px] font-bold text-gray-400 mt-2 max-w-[200px] leading-relaxed uppercase tracking-tight">Use the search section above to find your order status manually.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;

