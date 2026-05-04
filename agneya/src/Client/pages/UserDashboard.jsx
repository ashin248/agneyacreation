import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Package, MapPin, Trash2, Clock, CheckCircle, ChevronRight,
  User, LogOut, ShoppingBag, Activity, Box, AlertCircle,
  Settings, Heart, CreditCard, Layout, Gift, Plus, Edit2
} from 'react-feather';
import toast from 'react-hot-toast';
import AddressForm from '../components/AddressForm';

const STATUS_CONFIG = (status = '') => {
  const s = status.toLowerCase();
  if (s === 'delivered')   return { label: 'Delivered',   cls: 'text-emerald-600 bg-emerald-50 border-emerald-100', Icon: CheckCircle };
  if (s === 'shipped')     return { label: 'Shipped',     cls: 'text-indigo-600 bg-indigo-50 border-indigo-100',   Icon: Activity };
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* User Card */}
        <div className="p-5 flex items-center gap-4 border-b border-slate-50">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium">Welcome back,</p>
            <h2 className="text-sm font-bold text-slate-900 truncate">{userData?.name || 'User'}</h2>
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
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                activeTab === id
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 font-medium'
              }`}
            >
              <Icon size={16} className={activeTab === id ? 'text-indigo-600' : 'text-slate-400'} />
              {label}
              {activeTab === id && <ChevronRight size={14} className="ml-auto text-indigo-400" />}
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
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                activeTab === id
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 font-medium'
              }`}
            >
              <Icon size={16} className={activeTab === id ? 'text-indigo-600' : 'text-slate-400'} />
              {label}
              {id === 'orders' && orders.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                  {orders.length}
                </span>
              )}
              {activeTab === id && orders.length === 0 && <ChevronRight size={14} className="ml-auto text-indigo-400" />}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-50 p-3">
          <button
            onClick={() => logout().then(() => navigate('/'))}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-medium"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Mobile tab strip */}
        <div className="flex md:hidden gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                activeTab === id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <Icon size={14} />
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
                <h2 className="text-lg font-bold text-slate-900">My Orders</h2>
                {orders.filter(o => o.orderType !== 'Bulk').length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                    <ShoppingBag size={28} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-sm font-medium text-slate-400 mb-5">No orders yet.</p>
                    <button onClick={() => navigate('/')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all">
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.filter(o => o.orderType !== 'Bulk').map(order => {
                      const { cls, Icon } = STATUS_CONFIG(order.orderStatus);
                      return (
                        <div key={order._id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span><span className="font-medium text-slate-700">#{order._id.slice(-8).toUpperCase()}</span></span>
                              <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${cls}`}>
                                <Icon size={11} /> {order.orderStatus}
                              </span>
                              <button onClick={() => navigate(`/track-order?id=${order._id}`)} className="text-xs text-indigo-600 font-semibold hover:underline">
                                Track →
                              </button>
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex -space-x-2">
                                {order.items.slice(0, 3).map((item, i) => (
                                  <div key={i} className="w-10 h-10 rounded-xl border-2 border-white overflow-hidden bg-slate-100">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <div className="w-10 h-10 rounded-xl border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                    +{order.items.length - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-base font-bold text-slate-900">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <p className="text-xs text-slate-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
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
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Profile Information</h2>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Full Name</label>
                      <input
                        name="name"
                        defaultValue={userData?.name || ''}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email Address</label>
                      <input
                        name="email"
                        type="email"
                        defaultValue={userData?.email || ''}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Phone Number</label>
                      <input
                        value={currentUser?.phoneNumber || ''}
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-100 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed"
                        readOnly
                      />
                    </div>
                  </div>
                  <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm">
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {/* ── ADDRESSES ── */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Saved Addresses</h2>
                  {!isEditingAddress && (
                    <button
                      onClick={() => setIsEditingAddress({})}
                      className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus size={15} /> Add Address
                    </button>
                  )}
                </div>

                {isEditingAddress ? (
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-bold text-slate-800">{isEditingAddress._id ? 'Edit Address' : 'New Address'}</h3>
                      <button onClick={() => setIsEditingAddress(null)} className="text-sm text-rose-500 font-semibold">Cancel</button>
                    </div>
                    <AddressForm initialData={isEditingAddress._id ? isEditingAddress : null} onSave={handleAddressSave} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userData?.addresses?.map(addr => (
                      <div key={addr._id} className="flex items-start justify-between p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all group">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md uppercase">{addr.type || 'Home'}</span>
                            {addr.isDefault && <span className="text-[10px] font-bold text-emerald-600">Default</span>}
                          </div>
                          <p className="text-sm font-bold text-slate-900">{addr.name}</p>
                          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                            {addr.houseNo}, {addr.area}, {addr.city}, {addr.state} — {addr.pincode}
                          </p>
                          <p className="text-sm text-slate-700 font-medium mt-1">{addr.mobile}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setIsEditingAddress(addr)} className="text-xs text-indigo-600 font-semibold px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">Edit</button>
                          <button onClick={() => handleDeleteAddress(addr._id)} className="text-xs text-rose-500 font-semibold px-3 py-1.5 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">Delete</button>
                        </div>
                      </div>
                    ))}
                    {(!userData?.addresses || userData.addresses.length === 0) && (
                      <div className="text-center py-12 text-slate-300">
                        <MapPin size={28} className="mx-auto mb-3" />
                        <p className="text-sm font-medium">No addresses saved yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── CUSTOM DESIGNS ── */}
            {activeTab === 'custom' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Custom Studio Designs</h2>
                {customDesigns.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                    <Layout size={28} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">No custom designs in your history.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {customDesigns.map(design => (
                      <div key={design._id} className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-4 hover:shadow-sm transition-shadow">
                        <div className="w-20 h-24 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                          <img src={design.designImage} alt="Design" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">#{design._id.slice(-6).toUpperCase()}</span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">{design.productCategory}</h4>
                          <p className="text-xs text-slate-400 mt-1">{design.quantity} units</p>
                          <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-1 rounded-lg ${
                            design.status === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}>
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
                <h2 className="text-lg font-bold text-slate-900">Wholesale Orders</h2>
                {orders.filter(o => o.orderType === 'Bulk').map(order => (
                  <div key={order._id} className="bg-white rounded-2xl border border-orange-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-orange-500 font-semibold mb-1">Bulk Order</p>
                        <h3 className="text-base font-bold text-slate-900">#{order._id.slice(-10).toUpperCase()}</h3>
                      </div>
                      <span className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">{order.orderStatus}</span>
                    </div>
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                          <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-400">{item.quantity} units</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => navigate(`/track-order?id=${order._id}`)} className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all">
                      Track Order
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── GIFT CARDS ── */}
            {activeTab === 'giftcards' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900">Gift Cards</h2>

                <div className="bg-slate-900 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-40 h-40 bg-indigo-500/10 blur-2xl rounded-full" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                        <Gift size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Redeem a Gift Card</h3>
                        <p className="text-xs text-slate-400">Enter your code below</p>
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
                      className="flex flex-col sm:flex-row gap-3"
                    >
                      <input
                        name="giftCode"
                        placeholder="e.g. AGNEYA-XXXX-XXXX"
                        className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                      <button type="submit" className="px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-all">
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
                    <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5">
                      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
                      <p className="text-2xl font-black text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center gap-3 border-dashed">
                  <Clock size={24} className="text-slate-200" />
                  <p className="text-sm text-slate-400">No redemption history.</p>
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
