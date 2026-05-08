import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Package, MapPin, Trash2, Clock, CheckCircle, ChevronRight,
  User, LogOut, ShoppingBag, Activity, Box, AlertCircle,
  Settings, Heart, CreditCard, Layout, Gift, Plus, Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import AddressForm from '../components/AddressForm';

const STATUS_CONFIG = (status = '') => {
  const s = status.toLowerCase();
  if (s === 'delivered')   return { label: 'Delivered',   cls: 'text-emerald-600 bg-emerald-50 border-emerald-100', Icon: CheckCircle };
  if (s === 'shipped')     return { label: 'Shipped',     cls: 'text-orange-600 bg-orange-50 border-orange-100',   Icon: Activity };
  if (s === 'processing')  return { label: 'Processing',  cls: 'text-amber-600 bg-amber-50 border-amber-100',      Icon: Clock };
  if (s === 'cancelled')   return { label: 'Cancelled',   cls: 'text-red-600 bg-red-50 border-red-100',            Icon: AlertCircle };
  return                          { label: status || 'Pending', cls: 'text-slate-500 bg-slate-50 border-slate-100', Icon: Box };
};

const NAV_ITEMS = [
  { id: 'orders',    label: 'My Orders',       icon: Package },
  { id: 'profile',   label: 'Profile',         icon: User,   group: 'Account' },
  { id: 'addresses', label: 'Addresses',       icon: MapPin, group: 'Account' },
  { id: 'custom',    label: 'Custom Designs',  icon: Layout },
  { id: 'giftcards', label: 'Gift Cards',      icon: Gift },
];

const UserDashboard = () => {
  const { currentUser, userData, setUserData, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [customDesigns, setCustomDesigns] = useState([]);
  const [isEditingAddress, setIsEditingAddress] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) { navigate('/'); return; }
    const fetchData = async () => {
      setLoading(true);
      try {
        if (currentUser.phoneNumber) {
          const idToken = await currentUser.getIdToken();
          const res = await axios.get(
            `/api/public/user/orders/${encodeURIComponent(currentUser.phoneNumber)}`,
            { headers: { Authorization: `Bearer ${idToken}` } }
          );
          if (res.data.success) {
            setOrders(res.data.data.orders || []);
            setCustomDesigns(res.data.data.customDesigns || []);
          }
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, navigate]);

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.delete(`/api/public/user/address/${addressId}`, {
        data: { phone: currentUser.phoneNumber },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setUserData(res.data.data);
    } catch (err) {
      console.error('Delete address failed:', err);
    }
  };

  const handleAddressSave = async (addressData) => {
    try {
      let updated = [...(userData.addresses || [])];
      if (isEditingAddress?._id) {
        updated = updated.map(a => a._id === isEditingAddress._id ? { ...a, ...addressData } : a);
      } else {
        updated.push({ ...addressData, isDefault: updated.length === 0 });
      }
      const token = await currentUser.getIdToken();
      const res = await axios.post('/api/public/update-user',
        { phone: currentUser.phoneNumber, addresses: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) { setUserData(res.data.data); setIsEditingAddress(null); }
    } catch (err) {
      console.error('Save address failed:', err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
      <div className="w-10 h-10 border-4 border-[var(--color-neu-dark)] border-t-[var(--color-neu-accent)] rounded-full animate-spin" />
      <p className="text-sm font-medium" style={{ color: 'var(--color-neu-text)' }}>Loading dashboard…</p>
    </div>
  );

  const navItems = [...NAV_ITEMS];
  if (orders.some(o => o.orderType === 'Bulk')) {
    navItems.push({ id: 'wholesale', label: 'Wholesale', icon: Activity });
  }

  /* ── SIDEBAR ── */
  const Sidebar = ({ isMobile = false }) => (
    <aside className={isMobile
      ? 'block md:hidden'
      : 'hidden md:block w-64 flex-shrink-0'
    }>
      <div className="neu-flat overflow-hidden">
        {/* User Card */}
        <div className="p-5 flex items-center gap-4 border-b border-[var(--color-neu-dark)]">
          <div className="w-12 h-12 rounded-xl neu-pressed flex items-center justify-center flex-shrink-0">
            <User size={20} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-micro opacity-50" style={{ color: 'var(--color-neu-text)' }}>Welcome back,</p>
            <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--color-neu-text)' }}>{userData?.name || 'User'}</h2>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="py-2">
          {/* Group: Account */}
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Account</p>
          </div>
          {navItems.filter(i => i.group === 'Account').map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                activeTab === id
                  ? 'neu-pressed'
                  : 'hover:neu-pressed opacity-70'
              }`}
              style={{ color: 'var(--color-neu-text)' }}
            >
              <Icon size={16} className={activeTab === id ? 'opacity-100' : 'opacity-40'} style={activeTab === id ? { color: 'var(--color-neu-accent)' } : {}} />
              <span className={activeTab === id ? 'font-bold' : 'font-medium'}>{label}</span>
              {activeTab === id && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          ))}

          {/* Other items */}
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Activity</p>
          </div>
          {navItems.filter(i => !i.group).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                activeTab === id
                  ? 'neu-pressed'
                  : 'hover:neu-pressed opacity-70'
              }`}
              style={{ color: 'var(--color-neu-text)' }}
            >
              <Icon size={16} className={activeTab === id ? 'opacity-100' : 'opacity-40'} style={activeTab === id ? { color: 'var(--brand-primary)' } : {}} />
              <span className={activeTab === id ? 'font-bold' : 'font-medium'}>{label}</span>
              {id === 'orders' && orders.length > 0 && (
                <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === id ? 'bg-[var(--brand-primary)] text-white' : 'neu-pressed opacity-60'}`}>
                  {orders.length}
                </span>
              )}
              {activeTab === id && orders.length === 0 && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-[var(--color-neu-dark)] p-3">
          <button
            onClick={() => logout().then(() => navigate('/'))}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:neu-pressed rounded-xl transition-all font-medium"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Mobile tab strip */}
        <div className="flex md:hidden gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={activeTab === id ? 'btn-pill-active flex items-center gap-1.5 whitespace-nowrap flex-shrink-0' : 'btn-pill flex items-center gap-1.5 whitespace-nowrap flex-shrink-0'}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-6 items-start">
          <Sidebar />

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 min-w-0">

            {/* ── MY ORDERS ── */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 rounded-full" style={{ background: 'var(--brand-gradient)' }} />
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-neu-text)' }}>My Orders</h2>
                </div>
                {orders.filter(o => o.orderType !== 'Bulk').length === 0 ? (
                  <div className="neu-flat p-12 text-center">
                    <ShoppingBag size={32} className="opacity-20 mx-auto mb-4" style={{ color: 'var(--color-neu-text)' }} />
                    <p className="text-sm font-medium mb-6 opacity-60" style={{ color: 'var(--color-neu-text)' }}>No orders yet.</p>
                    <button onClick={() => navigate('/')} className="btn-primary btn-primary-sm">
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.filter(o => o.orderType !== 'Bulk').map(order => {
                      const { cls, Icon } = STATUS_CONFIG(order.orderStatus);
                      return (
                        <div key={order._id} className="neu-button overflow-hidden group">
                          <div className="flex items-center justify-between px-5 py-3 neu-pressed rounded-none border-b border-[var(--color-neu-dark)]">
                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color: 'var(--color-neu-text)' }}>
                              <span>#<span className="opacity-100">{order._id.slice(-8).toUpperCase()}</span></span>
                              <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${cls}`}>
                                <Icon size={11} /> {order.orderStatus}
                              </span>
                              <button onClick={() => navigate(`/track-order?id=${order._id}`)} className="text-[10px] font-black uppercase tracking-widest transition-colors hover:opacity-70" style={{ color: 'var(--brand-primary)' }}>
                                Track →
                              </button>
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex -space-x-2">
                                {order.items.slice(0, 3).map((item, i) => (
                                  <div key={i} className="w-10 h-10 rounded-xl border-2 border-[var(--color-neu-bg)] overflow-hidden neu-pressed">
                                    <img loading="lazy" src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <div className="w-10 h-10 rounded-xl border-2 border-[var(--color-neu-bg)] neu-pressed flex items-center justify-center text-[10px] font-black" style={{ color: 'var(--color-neu-text)' }}>
                                    +{order.items.length - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-base font-black" style={{ color: 'var(--color-neu-text)' }}>₹{order.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-40" style={{ color: 'var(--color-neu-text)' }}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── PROFILE ── */}
            {activeTab === 'profile' && (
              <div className="neu-flat p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ background: 'var(--brand-gradient)' }} />
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-neu-text)' }}>Profile Information</h2>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const btn = e.currentTarget.querySelector('button[type="submit"]');
                    btn.disabled = true;
                    try {
                      const token = await currentUser.getIdToken();
                      const res = await axios.post('/api/public/update-user', {
                        phone: currentUser.phoneNumber,
                        name: e.target.name.value,
                        email: e.target.email.value
                      }, { headers: { Authorization: `Bearer ${token}` } });
                      if (res.data.success) {
                        setUserData(res.data.data);
                        toast.success('Profile updated!');
                      }
                    } catch (err) {
                      toast.error('Failed to save changes.');
                    } finally {
                      btn.disabled = false;
                    }
                  }}
                  className="max-w-lg space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-label opacity-50 mb-1.5 block" style={{ color: 'var(--color-neu-text)' }}>Full Name</label>
                      <input
                        name="name"
                        defaultValue={userData?.name || ''}
                        className="w-full neu-input rounded-xl px-4 py-3 text-sm font-bold outline-none"
                        style={{ color: 'var(--color-neu-text)' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-label opacity-50 mb-1.5 block" style={{ color: 'var(--color-neu-text)' }}>Email Address</label>
                      <input
                        name="email"
                        type="email"
                        defaultValue={userData?.email || ''}
                        className="w-full neu-input rounded-xl px-4 py-3 text-sm font-bold outline-none"
                        style={{ color: 'var(--color-neu-text)' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-label opacity-50 mb-1.5 block" style={{ color: 'var(--color-neu-text)' }}>Phone Number</label>
                      <input
                        value={currentUser?.phoneNumber || ''}
                        className="w-full neu-pressed rounded-xl px-4 py-3 text-sm font-bold opacity-50 cursor-not-allowed"
                        style={{ color: 'var(--color-neu-text)' }}
                        readOnly
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary">Save Changes</button>
                </form>
              </div>
            )}

            {/* ── ADDRESSES ── */}
            {activeTab === 'addresses' && (
              <div className="neu-flat p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full" style={{ background: 'var(--brand-gradient)' }} />
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-neu-text)' }}>Saved Addresses</h2>
                  </div>
                  {!isEditingAddress && (
                    <button
                      onClick={() => setIsEditingAddress({})}
                      className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-opacity hover:opacity-70"
                      style={{ color: 'var(--color-neu-accent)' }}
                    >
                      <Plus size={15} /> Add Address
                    </button>
                  )}
                </div>

                {isEditingAddress ? (
                  <div className="neu-pressed p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--color-neu-text)' }}>{isEditingAddress._id ? 'Edit Address' : 'New Address'}</h3>
                      <button onClick={() => setIsEditingAddress(null)} className="text-xs font-black uppercase tracking-widest text-rose-500">Cancel</button>
                    </div>
                    <AddressForm initialData={isEditingAddress._id ? isEditingAddress : null} onSave={handleAddressSave} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {userData?.addresses?.map(addr => (
                      <div key={addr._id} className="neu-button p-6 flex items-start justify-between group hover:neu-pressed transition-all">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[9px] font-black uppercase tracking-widest neu-pressed px-2.5 py-1 rounded-md" style={{ color: 'var(--color-neu-text)', opacity: 0.6 }}>{addr.type || 'Home'}</span>
                            {addr.isDefault && <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>Default</span>}
                          </div>
                          <p className="text-sm font-black uppercase tracking-tight" style={{ color: 'var(--color-neu-text)' }}>{addr.name}</p>
                          <p className="text-xs font-medium mt-2 leading-relaxed opacity-60" style={{ color: 'var(--color-neu-text)' }}>
                            {addr.houseNo}, {addr.area}, {addr.city}, {addr.state} — {addr.pincode}
                          </p>
                          <p className="text-xs font-black mt-2 opacity-80" style={{ color: 'var(--color-neu-text)' }}>{addr.mobile}</p>
                        </div>
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setIsEditingAddress(addr)} className="text-[9px] font-black uppercase tracking-widest px-3 py-2 neu-pressed transition-all hover:opacity-70" style={{ color: 'var(--color-neu-accent)' }}>Edit</button>
                          <button onClick={() => handleDeleteAddress(addr._id)} className="text-[9px] font-black uppercase tracking-widest px-3 py-2 neu-pressed transition-all hover:text-rose-500">Delete</button>
                        </div>
                      </div>
                    ))}
                    {(!userData?.addresses || userData.addresses.length === 0) && (
                      <div className="text-center py-16 neu-pressed border-dashed opacity-40">
                        <MapPin size={32} className="mx-auto mb-3" style={{ color: 'var(--color-neu-text)' }} />
                        <p className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>No addresses saved yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── CUSTOM DESIGNS ── */}
            {activeTab === 'custom' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 rounded-full" style={{ background: 'var(--brand-gradient)' }} />
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-neu-text)' }}>Custom Designs</h2>
                </div>
                {customDesigns.length === 0 ? (
                  <div className="neu-flat p-12 text-center">
                    <Layout size={32} className="opacity-20 mx-auto mb-4" style={{ color: 'var(--color-neu-text)' }} />
                    <p className="text-sm font-medium opacity-60" style={{ color: 'var(--color-neu-text)' }}>No custom designs found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {customDesigns.map(design => (
                      <div key={design._id} className="neu-button p-5 flex gap-5 hover:neu-pressed transition-all">
                        <div className="w-20 h-24 neu-pressed overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <img loading="lazy" src={design.designImage} alt="Design" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>#{design._id.slice(-6).toUpperCase()}</span>
                          <h4 className="text-sm font-black uppercase mt-1 leading-tight" style={{ color: 'var(--color-neu-text)' }}>{design.productCategory}</h4>
                          <p className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-50" style={{ color: 'var(--color-neu-text)' }}>{design.quantity} units</p>
                          <span className={`inline-block mt-3 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                            design.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'neu-pressed opacity-70'
                          }`} style={design.status !== 'Approved' ? { color: 'var(--color-neu-text)' } : {}}>
                            {design.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── WHOLESALE ── */}
            {activeTab === 'wholesale' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 rounded-full" style={{ background: 'var(--brand-gradient)' }} />
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-neu-text)' }}>Wholesale Orders</h2>
                </div>
                {orders.filter(o => o.orderType === 'Bulk').map(order => (
                  <div key={order._id} className="neu-flat p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1" style={{ color: 'var(--brand-primary)' }}>Bulk Order</p>
                        <h3 className="text-base font-black uppercase tracking-tight" style={{ color: 'var(--color-neu-text)' }}>#{order._id.slice(-10).toUpperCase()}</h3>
                      </div>
                      <span className="px-3 py-1.5 neu-button-accent text-[10px] font-black uppercase tracking-widest">{order.orderStatus}</span>
                    </div>
                    <div className="space-y-3 mb-6">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 neu-pressed p-4 rounded-xl">
                          <img loading="lazy" src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <p className="text-sm font-black uppercase tracking-tight" style={{ color: 'var(--color-neu-text)' }}>{item.name}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-50" style={{ color: 'var(--color-neu-text)' }}>{item.quantity} units</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => navigate(`/track-order?id=${order._id}`)} className="w-full py-3.5 neu-button font-black uppercase text-xs tracking-widest transition-all hover:neu-pressed" style={{ color: 'var(--color-neu-text)' }}>
                      Track Order
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── GIFT CARDS ── */}
            {activeTab === 'giftcards' && (
              <div className="space-y-6">

                <div className="neu-flat p-8 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-48 h-48 bg-[var(--brand-primary)] opacity-5 blur-3xl rounded-full" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-xl neu-button-accent flex items-center justify-center">
                        <Gift size={22} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--color-neu-text)' }}>Redeem Gift Card</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-50" style={{ color: 'var(--color-neu-text)' }}>Enter your unique code</p>
                      </div>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const code = e.target.giftCode.value.trim();
                        if (!code) return;
                        toast.promise(
                          new Promise(resolve => setTimeout(resolve, 1500)),
                          { loading: 'Validating code…', success: 'Credit applied!', error: 'Invalid code.' }
                        );
                        e.target.reset();
                      }}
                      className="flex flex-col sm:flex-row gap-4"
                    >
                      <input
                        name="giftCode"
                        placeholder="e.g. AGNEYA-XXXX-XXXX"
                        className="flex-1 neu-input rounded-xl px-5 py-4 text-xs font-bold outline-none"
                        style={{ color: 'var(--color-neu-text)' }}
                        required
                      />
                      <button type="submit" className="px-8 py-4 neu-button-accent font-black uppercase text-xs tracking-widest active:scale-[0.98]">
                        Redeem
                      </button>
                    </form>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Active Balance', value: '₹0.00' },
                    { label: 'Total Redeemed', value: '₹0.00' }
                  ].map(({ label, value }) => (
                    <div key={label} className="neu-button p-6 group hover:neu-pressed transition-all">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2" style={{ color: 'var(--color-neu-text)' }}>{label}</p>
                      <p className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-neu-text)' }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="neu-pressed p-10 flex flex-col items-center gap-4 border-dashed border-[var(--color-neu-dark)]">
                  <Clock size={28} className="opacity-20" style={{ color: 'var(--color-neu-text)' }} />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30" style={{ color: 'var(--color-neu-text)' }}>No transaction history found</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
