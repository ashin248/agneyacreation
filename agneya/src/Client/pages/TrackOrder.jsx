import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ClipboardList, CheckCircle, Package, Truck, MapPin, Home,
  X, ShoppingBag, Search, ChevronRight, Inbox
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUSES = [
  { id: 0, label: 'Received',   icon: ClipboardList },
  { id: 1, label: 'Approved',   icon: CheckCircle },
  { id: 2, label: 'Packing',    icon: Package },
  { id: 3, label: 'Shipped',    icon: Truck },
  { id: 4, label: 'Out for Delivery', icon: MapPin },
  { id: 5, label: 'Delivered',  icon: Home },
];

const TABS = ['Active Orders', 'Delivered', 'Cancelled'];

const statusToTab = (order) => {
  const status = (order.orderStatus || order.status || order.displayStatus || '').toLowerCase();
  if (status === 'delivered') return 'Delivered';
  if (status === 'cancelled' || status === 'rejected') return 'Cancelled';
  return 'Active Orders';
};

const badgeStyle = (s = '') => {
  const v = s.toLowerCase();
  if (v.includes('delivered') && !v.includes('out')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (v.includes('cancel'))                           return 'bg-red-50 text-red-600 border-red-100';
  if (v.includes('shipped') || v.includes('out for')) return 'bg-blue-50 text-blue-600 border-blue-100';
  if (v.includes('approved'))                         return 'bg-green-50 text-green-700 border-green-100';
  return 'bg-amber-50 text-amber-600 border-amber-100';
};

/* ── TRACKING MODAL ── */
const TrackingModal = ({ order, onClose }) => {
  const [animStep, setAnimStep] = useState(-1);

  useEffect(() => {
    const t = setTimeout(() => setAnimStep(order.currentStep ?? 0), 250);
    return () => clearTimeout(t);
  }, [order]);

  const estDate = order.estimatedDeliveryDate
    ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date(new Date(order.createdAt).getTime() + 3 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const displayStatus = order.status === 'Pending' || order.orderStatus === 'Pending'
    ? 'Delivery within 3 days'
    : (order.displayStatus || order.status || order.orderStatus || 'Pending');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl neu-flat overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 px-7 py-6 flex items-start justify-between">
          <div>
            <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider mb-1">Live Tracking</p>
            <h2 className="text-white text-xl font-bold">#{order.orderId}</h2>
            <p className="text-slate-400 text-sm mt-1">
              Est. delivery: <span className="text-white font-semibold">{estDate}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Status badge */}
        <div className="bg-slate-800 px-7 py-3 flex items-center gap-3">
          <span className="text-slate-400 text-sm">Current status:</span>
          <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'linear-gradient(135deg, #4A5FD4, #0EA5E9)' }}>
            {displayStatus}
          </span>
        </div>

        <div className="p-7">
          {/* Desktop stepper */}
          <div className="hidden md:block mb-8">
            {order.orderStatus === 'Cancelled' || order.status === 'Cancelled' ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <X size={24} />
                </div>
                <div>
                  <h3 className="text-red-800 font-bold">Order Cancelled</h3>
                  <p className="text-red-600 text-sm">This order has been cancelled and will not be processed further.</p>
                </div>
              </div>
            ) : (
              <div className="relative px-4">
                <div className="absolute top-5 left-4 right-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-[1200ms] ease-out"
                    style={{ width: animStep >= 0 ? `${(animStep / (STATUSES.length - 1)) * 100}%` : '0%' }}
                  />
                </div>
                <div className="relative flex justify-between">
                  {STATUSES.map(({ id, label, icon: Icon }) => {
                    const done = id <= animStep;
                    const active = id === animStep;
                    return (
                      <div key={id} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 relative z-10 transition-all duration-500 ${
                          done ? 'bg-orange-600 border-white text-white shadow-md shadow-orange-200' : 'bg-white border-slate-200 text-slate-300'
                        }`}>
                          <Icon size={18} />
                          {active && <span className="absolute -inset-2 bg-orange-400/20 rounded-full animate-ping" />}
                        </div>
                        <p className={`mt-2.5 text-[10px] font-semibold text-center max-w-[64px] leading-tight ${done ? 'text-orange-600' : 'text-slate-400'}`}>
                          {label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mobile stepper (vertical) */}
          <div className="md:hidden mb-6 space-y-3">
            {STATUSES.map(({ id, label, icon: Icon }) => {
              const done = id <= animStep;
              return (
                <div key={id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                    <Icon size={15} />
                  </div>
                  <span className={`text-sm font-medium ${done ? 'text-orange-600' : 'text-slate-400'}`}>{label}</span>
                </div>
              );
            })}
          </div>

          {/* Items */}
          {order.type === 'standard' && order.items?.length > 0 && (
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Items in this order</p>
              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-slate-100 flex-shrink-0">
                      <img loading="lazy" src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-orange-600">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.type === 'custom' && (
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Custom Design</p>
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <img loading="lazy" src={order.designImage} alt="Design" className="w-20 h-24 object-cover rounded-lg" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{order.productType}</p>
                  <p className="text-xs text-slate-400 mt-1">Quantity: {order.quantity}</p>
                  <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                    {order.status === 'Approved' ? 'In Production' : order.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── ORDER CARD ── */
const OrderCard = ({ order, onTrack }) => {
  const status = order.orderStatus || order.status || order.displayStatus || '';
  const displayStatus = (status === 'Pending' || status === 'pending')
    ? 'Delivery within 3 days'
    : (order.displayStatus || status || 'Pending');

  const resolveImg = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${window.location.protocol}//${window.location.hostname}:5000${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const imageSrc = resolveImg(order.items?.[0]?.image || order.designImage);
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="neu-button p-4 flex items-center gap-5 group hover:neu-pressed transition-all">
      <div className="w-14 h-16 rounded-xl overflow-hidden neu-pressed flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
        {imageSrc ? (
          <img loading="lazy" src={imageSrc} alt="Order" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <Package size={24} className="opacity-20" style={{ color: 'var(--color-neu-text)' }} strokeWidth={1} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-black uppercase tracking-tight group-hover:text-orange-600 transition-colors truncate" style={{ color: 'var(--color-neu-text)' }}>#{order.orderId}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1.5">
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeStyle(status)}`}>
            {displayStatus}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>{orderDate}</span>
        </div>
      </div>

      <button
        onClick={() => onTrack(order)}
        className="neu-button-accent px-4 py-2.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
      >
        Track <ChevronRight size={14} />
      </button>
    </div>
  );
};

/* ── MAIN ── */
const TrackOrder = () => {
  const { currentUser, userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Active Orders');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchForm, setSearchForm] = useState({ orderId: '', phone: '' });
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const storedOrders = JSON.parse(localStorage.getItem('myGuestOrders') || '[]');
      const storedCustom = JSON.parse(localStorage.getItem('myCustomDesigns') || '[]');

      const statusMap = { 
        Pending: 0, 
        Approved: 1, 
        Processing: 1,
        Printing: 2,
        'In Production': 2, 
        Shipped: 3, 
        'Out for Delivery': 4,
        Delivered: 5,
        Cancelled: -1,
        Rejected: -1
      };

      const orderPromises = storedOrders.map(o =>
        axios.post('/api/public/orders/track', { orderId: o.orderId, phone: o.phone })
          .then(r => r.data.success ? { ...o, ...r.data.data, type: 'standard' } : o)
          .catch(() => o)
      );

      const customPromises = storedCustom.map(c =>
        axios.post('/api/public/orders/track', { orderId: c._id || c.orderId, phone: c.phone })
          .then(r => {
            if (r.data.success) {
              const d = r.data.data;
              return { ...c, ...d, type: 'custom', currentStep: statusMap[d.status || d.orderStatus] ?? 0 };
            }
            return c;
          })
          .catch(() => c)
      );

      let userOrders = [];
      if (userData?.phone) {
        try {
          const token = await currentUser.getIdToken();
          const res = await axios.get(`/api/public/user/orders/${userData.phone}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            userOrders = [
              ...(res.data.data.orders || []).map(o => ({ ...o, type: 'standard', currentStep: statusMap[o.orderStatus] ?? 0 })),
              ...(res.data.data.customDesigns || []).map(c => ({ ...c, type: 'custom', orderId: c._id, currentStep: statusMap[c.status] ?? 0 }))
            ];
          }
        } catch (e) { console.error(e); }
      }

      const results = await Promise.allSettled([...orderPromises, ...customPromises]);
      const guestResults = results.map(r => r.value).filter(Boolean);

      const merged = [...userOrders];
      guestResults.forEach(go => {
        if (!merged.find(m => m.orderId === go.orderId)) merged.push(go);
      });

      setOrders(merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } finally {
      setLoading(false);
    }
  }, [currentUser, userData]);

  useEffect(() => { fetchAll(); }, [userData, fetchAll]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchForm.orderId || !searchForm.phone) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await axios.post('/api/public/orders/track', searchForm);
      if (res.data.success) {
        const order = res.data.data;
        const statusMap = { 
          Pending: 0, 
          Approved: 1, 
          Processing: 1,
          Printing: 2,
          'In Production': 2, 
          Shipped: 3, 
          'Out for Delivery': 4,
          Delivered: 5,
          Cancelled: -1,
          Rejected: -1
        };
        setSelectedOrder({ ...order, type: order.items ? 'standard' : 'custom', currentStep: statusMap[order.status || order.orderStatus] ?? 0 });
        const history = JSON.parse(localStorage.getItem('myGuestOrders') || '[]');
        if (!history.find(h => h.orderId === order.orderId)) {
          history.push({ orderId: order.orderId, phone: searchForm.phone });
          localStorage.setItem('myGuestOrders', JSON.stringify(history));
        }
        fetchAll();
      }
    } catch {
      setSearchError('No order found with these details. Please check the Order ID and phone number.');
    } finally {
      setSearching(false);
    }
  };

  const filtered = orders.filter(o => statusToTab(o) === activeTab);

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
      {selectedOrder && <TrackingModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase" style={{ color: 'var(--color-neu-text)' }}>Track Orders</h1>
            <p className="text-sm font-medium mt-1 opacity-50" style={{ color: 'var(--color-neu-text)' }}>Check the status of your orders</p>
          </div>
          {orders.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Remove saved order history from this browser?')) {
                  localStorage.removeItem('myGuestOrders');
                  localStorage.removeItem('myCustomDesigns');
                  setOrders([]);
                }
              }}
              className="text-[10px] font-black uppercase tracking-widest text-rose-500 neu-button px-4 py-2 hover:neu-pressed transition-all"
            >
              Clear History
            </button>
          )}
        </div>

        {/* ── SEARCH BOX ── */}
        <div className="neu-flat p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Search size={16} style={{ color: 'var(--color-neu-accent)' }} />
            <h2 className="text-sm font-black uppercase tracking-tighter" style={{ color: 'var(--color-neu-text)' }}>Track with Order ID</h2>
          </div>
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Order ID (e.g. ORD-XXX)"
              value={searchForm.orderId}
              onChange={e => setSearchForm(p => ({ ...p, orderId: e.target.value }))}
              className="neu-input rounded-xl px-4 py-3.5 text-sm font-bold outline-none"
              style={{ color: 'var(--color-neu-text)' }}
            />
            <input
              type="tel"
              placeholder="Linked phone number"
              value={searchForm.phone}
              onChange={e => setSearchForm(p => ({ ...p, phone: e.target.value }))}
              className="neu-input rounded-xl px-4 py-3.5 text-sm font-bold outline-none"
              style={{ color: 'var(--color-neu-text)' }}
            />
            <button
              type="submit"
              disabled={searching}
              className="neu-button-accent rounded-xl px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-60"
            >
              {searching ? 'Searching…' : 'Track Order'}
            </button>
          </form>
          {searchError && (
            <p className="mt-3 text-xs font-medium text-rose-500 flex items-center gap-1.5">
              <X size={13} /> {searchError}
            </p>
          )}
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-2 p-2 neu-pressed rounded-2xl mb-6">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? 'neu-button-accent'
                  : 'opacity-50 hover:opacity-100'
              }`}
              style={activeTab === tab ? {} : { color: 'var(--color-neu-text)' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-12 h-12 border-4 border-[var(--color-neu-dark)] border-t-[var(--color-neu-accent)] rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 animate-pulse" style={{ color: 'var(--color-neu-text)' }}>Scanning Orders</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((order, i) => (
              <OrderCard key={i} order={order} onTrack={setSelectedOrder} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 neu-pressed border-dashed opacity-40">
            <Inbox size={40} className="mb-4" style={{ color: 'var(--color-neu-text)' }} strokeWidth={1} />
            <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>No orders in this tab</h3>
            <p className="text-[10px] font-bold mt-2 max-w-[200px] text-center uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>
              Use the search box above to find an order by ID.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
