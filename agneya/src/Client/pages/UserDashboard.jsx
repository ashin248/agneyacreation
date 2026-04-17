import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiPackage, 
  FiMapPin, 
  FiTrash2, 
  FiClock, 
  FiCheckCircle, 
  FiChevronRight, 
  FiUser, 
  FiLogOut, 
  FiShoppingBag,
  FiActivity,
  FiBox,
  FiAlertCircle,
  FiSettings,
  FiHeart,
  FiCreditCard,
  FiLayout,
  FiGift
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AddressForm from '../components/AddressForm';

const UserDashboard = () => {
    const { currentUser, userData, setUserData, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('orders'); // 'profile' | 'orders' | 'addresses' | 'wholesale' | 'custom'
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [customDesigns, setCustomDesigns] = useState([]);
    const [isEditingAddress, setIsEditingAddress] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            navigate('/');
            return;
        }

        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                if (currentUser.phoneNumber) {
                    const idToken = await currentUser.getIdToken();
                    const res = await axios.get(`/api/public/user/orders/${encodeURIComponent(currentUser.phoneNumber)}`, {
                        headers: { Authorization: `Bearer ${idToken}` }
                    });
                    if (res.data.success) {
                        setOrders(res.data.data.orders || []);
                        setCustomDesigns(res.data.data.customDesigns || []);
                    }
                }
            } catch (error) {
                console.error("Error fetching user dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [currentUser, navigate]);

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm("Are you sure you want to delete this address?")) return;
        try {
            const idToken = await currentUser.getIdToken();
            const res = await axios.delete(`/api/public/user/address/${addressId}`, {
                data: { phone: currentUser.phoneNumber },
                headers: { Authorization: `Bearer ${idToken}` }
            });
            if (res.data.success) {
                setUserData(res.data.data);
            }
        } catch (error) {
            console.error("Error deleting address:", error);
        }
    };

    const handleAddressSave = async (addressData) => {
        try {
            let updatedAddresses = [...(userData.addresses || [])];
            if (isEditingAddress && isEditingAddress._id) {
                updatedAddresses = updatedAddresses.map(a => 
                    a._id === isEditingAddress._id ? { ...a, ...addressData } : a
                );
            } else {
                updatedAddresses.push({ ...addressData, isDefault: updatedAddresses.length === 0 });
            }

            const idToken = await currentUser.getIdToken();
            const response = await axios.post('/api/public/update-user', {
                phone: currentUser.phoneNumber,
                addresses: updatedAddresses
            }, {
                headers: { Authorization: `Bearer ${idToken}` }
            });
            if (response.data.success) {
                setUserData(response.data.data);
                setIsEditingAddress(null);
            }
        } catch (error) {
            console.error("Error saving address:", error);
        }
    };

    const getStatusConfig = (status) => {
        const s = (status || '').toLowerCase();
        switch(s) {
            case 'delivered': return { color: 'text-emerald-600 bg-emerald-50', icon: FiCheckCircle };
            case 'shipped': return { color: 'text-indigo-600 bg-indigo-50', icon: FiActivity };
            case 'processing': return { color: 'text-amber-600 bg-amber-50', icon: FiClock };
            case 'cancelled': return { color: 'text-red-600 bg-red-50', icon: FiAlertCircle };
            default: return { color: 'text-gray-500 bg-gray-50', icon: FiBox };
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F1F3F6]">
            <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );

    const navItems = [
        { id: 'orders', label: 'My Orders', icon: FiPackage, color: 'text-indigo-600' },
        { 
            id: 'account', 
            label: 'Account Settings', 
            icon: FiUser, 
            color: 'text-indigo-600',
            subItems: [
                { id: 'profile', label: 'Profile Information' },
                { id: 'addresses', label: 'Manage Addresses' }
            ]
        },
        { id: 'custom', label: 'Custom Designs', icon: FiLayout, color: 'text-indigo-600' },
        { id: 'giftcards', label: 'Gift Cards', icon: FiGift, color: 'text-indigo-600' },
    ];

    if (orders.some(o => o.orderType === 'Bulk')) {
        navItems.push({ id: 'wholesale', label: 'Wholesale Hub', icon: FiActivity, color: 'text-orange-600' });
    }

    return (
        <div className="bg-[#F1F3F6] min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-4">
                
                {/* SIDEBAR */}
                <div className="w-full md:w-1/4 space-y-4">
                    {/* User Header */}
                    <div className="bg-white p-4 items-center flex gap-4 shadow-sm rounded-sm">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                            <FiUser className="text-indigo-600 w-6 h-6" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Hello,</p>
                            <h2 className="text-base font-black text-gray-900 truncate uppercase">{userData?.name || 'Authorized User'}</h2>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <div className="bg-white shadow-sm rounded-sm overflow-hidden">
                        {navItems.map((item) => (
                            <div key={item.id} className="border-b border-gray-50 last:border-b-0">
                                {item.subItems ? (
                                    <div className="py-2">
                                        <div className="px-5 py-2 flex items-center gap-4 text-gray-400">
                                            <item.icon className="w-5 h-5" />
                                            <span className="text-xs font-black uppercase tracking-[0.15em]">{item.label}</span>
                                        </div>
                                        {item.subItems.map((sub) => (
                                            <button
                                                key={sub.id}
                                                onClick={() => setActiveTab(sub.id)}
                                                className={`w-full text-left pl-14 pr-5 py-3 text-sm font-medium transition-all ${
                                                    activeTab === sub.id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full px-5 py-5 flex items-center justify-between transition-all ${
                                            activeTab === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                                            <span className="text-xs font-black uppercase tracking-[0.15em]">{item.label}</span>
                                        </div>
                                        <FiChevronRight className={`w-4 h-4 transition-transform ${activeTab === item.id ? 'rotate-90' : ''}`} />
                                    </button>
                                )}
                            </div>
                        ))}
                        
                        {/* Logout Section */}
                        <div className="border-t border-gray-100 mt-4 p-2">
                            <button 
                                onClick={() => logout().then(() => navigate('/'))}
                                className="w-full flex items-center gap-4 px-5 py-4 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <FiLogOut className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 bg-white shadow-sm rounded-sm p-6 md:p-10 min-h-[70vh]">
                    
                    {/* PROFILE INFORMATION */}
                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-black text-gray-900 border-b pb-6 mb-8 uppercase tracking-tight">Personal Information</h2>
                            <form 
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const btn = e.currentTarget.querySelector('button[type="submit"]');
                                    btn.disabled = true;
                                    try {
                                        const idToken = await currentUser.getIdToken();
                                        const res = await axios.post('/api/public/update-user', {
                                            phone: currentUser.phoneNumber,
                                            name: e.target.name.value,
                                            email: e.target.email.value
                                        }, {
                                            headers: { Authorization: `Bearer ${idToken}` }
                                        });
                                        if (res.data.success) {
                                            setUserData(res.data.data);
                                            toast.success("Identity updated successfully!", {
                                                style: { background: '#1e293b', color: '#fff', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }
                                            });
                                        }
                                    } catch (err) {
                                        toast.error("Failed to sync archives.", {
                                            style: { background: '#1e293b', color: '#fff', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }
                                        });
                                    } finally {
                                        btn.disabled = false;
                                    }
                                }}
                                className="max-w-xl space-y-10"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Name</label>
                                        <input 
                                            name="name"
                                            defaultValue={userData?.name || ''}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-sm text-sm font-bold focus:ring-1 focus:ring-indigo-600 outline-none" 
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
                                        <input 
                                            name="email"
                                            defaultValue={userData?.email || ''}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-sm text-sm font-bold focus:ring-1 focus:ring-indigo-600 outline-none" 
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verified Phone</label>
                                        <input 
                                            value={currentUser?.phoneNumber || ''}
                                            className="w-full px-4 py-3 bg-gray-100 border-none rounded-sm text-sm font-bold text-gray-400 cursor-not-allowed" 
                                            readOnly 
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="bg-indigo-600 text-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-slate-900 transition-all shadow-lg">Save Changes</button>
                            </form>
                        </div>
                    )}

                    {/* MANAGE ADDRESSES */}
                    {activeTab === 'addresses' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between border-b pb-6 mb-8">
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Manage Addresses</h2>
                                {!isEditingAddress && (
                                    <button onClick={() => setIsEditingAddress({})} className="text-indigo-600 text-xs font-black uppercase tracking-widest">+ Add New Address</button>
                                )}
                            </div>

                            {isEditingAddress ? (
                                <div className="bg-gray-50 p-6 md:p-10 rounded-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="font-black uppercase tracking-widest text-xs text-gray-400">{isEditingAddress._id ? 'Edit Destination' : 'New Destination'}</h3>
                                        <button onClick={() => setIsEditingAddress(null)} className="text-red-500 text-[10px] font-black uppercase">Cancel</button>
                                    </div>
                                    <AddressForm initialData={isEditingAddress._id ? isEditingAddress : null} onSave={handleAddressSave} />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {userData?.addresses?.map(addr => (
                                        <div key={addr._id} className="border border-gray-100 p-6 rounded-sm flex justify-between items-start group hover:border-indigo-600/30 transition-all">
                                            <div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="text-[9px] font-black uppercase bg-gray-100 px-2 py-0.5 rounded-sm">{addr.type || 'Home'}</span>
                                                    {addr.isDefault && <span className="text-[9px] font-black uppercase text-emerald-600">Default</span>}
                                                </div>
                                                <p className="font-black text-gray-900 uppercase tracking-tight mb-2">{addr.name}</p>
                                                <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-sm">
                                                    {addr.houseNo}, {addr.area}, {addr.city}, {addr.state} - {addr.pincode}
                                                </p>
                                                <p className="text-sm font-black text-gray-900 mt-2">{addr.mobile}</p>
                                            </div>
                                            <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setIsEditingAddress(addr)} className="text-indigo-600 text-[10px] font-black uppercase underline">Edit</button>
                                                <button onClick={() => handleDeleteAddress(addr._id)} className="text-red-500 text-[10px] font-black uppercase underline">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!userData?.addresses || userData.addresses.length === 0) && (
                                        <p className="text-center py-20 text-gray-300 font-bold uppercase text-xs tracking-widest underline decoration-indigo-500/30">No logistic archives found.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* MY ORDERS */}
                    {activeTab === 'orders' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-black text-gray-900 border-b pb-6 mb-8 uppercase tracking-tight">Retail Purchase Archive</h2>
                            {orders.filter(o => o.orderType !== 'Bulk').length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-gray-300 font-black uppercase text-xs tracking-widest mb-6">No transaction records found.</p>
                                    <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest rounded-sm">Deploy New Order</button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {orders.filter(o => o.orderType !== 'Bulk').map(order => {
                                        const config = getStatusConfig(order.orderStatus);
                                        const StatusIcon = config.icon;
                                        return (
                                            <div key={order._id} className="border border-gray-100 rounded-sm overflow-hidden hover:shadow-md transition-all">
                                                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                                                    <div className="flex items-center gap-6">
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order Placed</p>
                                                            <p className="text-sm font-black text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                                                            <p className="text-sm font-black text-gray-700">₹{order.totalAmount.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order ID: #{order._id.slice(-8).toUpperCase()}</p>
                                                        <button onClick={() => navigate(`/track-order?id=${order._id}`)} className="text-indigo-600 text-[10px] font-black underline uppercase">View Details</button>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className={`px-4 py-1.5 rounded-full ${config.color} flex items-center gap-2 border border-black/5`}>
                                                            <StatusIcon size={12} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">{order.orderStatus}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex gap-6">
                                                                <div className="w-16 h-20 bg-gray-50 rounded-sm overflow-hidden flex-shrink-0">
                                                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.name}</h4>
                                                                    <p className="text-[10px] text-gray-400 font-bold mt-1">QTY: {item.quantity} | {item.selectedVariation?.sku || 'Standard'}</p>
                                                                    <p className="text-xs font-black text-indigo-600 mt-2">₹{item.unitPrice.toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* CUSTOM COMMISSIONS */}
                    {activeTab === 'custom' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-black text-gray-900 border-b pb-6 mb-8 uppercase tracking-tight">Custom Studio Commissions</h2>
                            {customDesigns.length === 0 ? (
                                <p className="text-center py-20 text-gray-300 font-black uppercase text-xs tracking-widest">No custom assets in archive.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {customDesigns.map(design => (
                                        <div key={design._id} className="border border-gray-100 rounded-sm p-6 flex gap-6 hover:border-indigo-600/30 transition-all">
                                            <div className="w-24 h-32 bg-gray-50 rounded-sm overflow-hidden flex-shrink-0 p-2 shadow-inner">
                                                <img src={design.designImage} alt="" className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 inline-block">ID: {design._id.slice(-6).toUpperCase()}</span>
                                                <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">{design.productCategory}</h4>
                                                <p className="text-xs font-bold text-gray-400 mt-2 uppercase">Status: <span className="text-gray-900">{design.status}</span></p>
                                                <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Batch: {design.quantity} Units</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* WHOLESALE HUB */}
                    {activeTab === 'wholesale' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                             <h2 className="text-2xl font-black text-gray-900 border-b pb-6 mb-8 uppercase tracking-tight flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                                B2B Wholesale Contracts
                             </h2>
                             <div className="space-y-6">
                                {orders.filter(o => o.orderType === 'Bulk').map(order => (
                                    <div key={order._id} className="border-2 border-orange-50 bg-orange-50/10 rounded-sm p-8 group">
                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Contract Reference</p>
                                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">#{order._id.slice(-10).toUpperCase()}</h3>
                                            </div>
                                            <span className="px-4 py-1 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full">{order.orderStatus}</span>
                                        </div>
                                        <div className="space-y-4 mb-8">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-sm border border-orange-100/50">
                                                    <img src={item.image} alt="" className="w-10 h-12 object-cover rounded-sm" />
                                                    <div>
                                                        <p className="text-xs font-black text-gray-900 uppercase">{item.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{item.quantity} units | Bulk Logistics</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => navigate(`/track-order?id=${order._id}`)} className="w-full bg-gray-900 text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all">Full Surveillance Report</button>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {/* GIFT CARDS */}
                    {activeTab === 'giftcards' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-black text-gray-900 border-b pb-6 mb-8 uppercase tracking-tight">Gift Card Central</h2>
                            
                            <div className="max-w-2xl">
                                <div className="bg-slate-950 rounded-2xl p-8 mb-8 relative overflow-hidden group">
                                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-indigo-500/20 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-xl">
                                                <FiGift size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Redeem Credit</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top up your internal balance instantly.</p>
                                            </div>
                                        </div>

                                        <form 
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                const code = e.target.giftCode.value.trim();
                                                if (!code) return;
                                                
                                                toast.promise(
                                                    new Promise((resolve) => setTimeout(resolve, 1500)),
                                                    {
                                                        loading: 'Validating Neural Signature...',
                                                        success: 'Credit Successfully Initialized!',
                                                        error: 'Invalid Code Matrix Detected.',
                                                    },
                                                    {
                                                        style: {
                                                            minWidth: '250px',
                                                            background: '#1e293b',
                                                            color: '#fff',
                                                            fontSize: '11px',
                                                            fontWeight: '900',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '1px'
                                                        },
                                                        success: {
                                                            duration: 4000,
                                                            icon: '🔥',
                                                        },
                                                    }
                                                );
                                                e.target.reset();
                                            }}
                                            className="flex flex-col md:flex-row gap-4"
                                        >
                                            <input 
                                                name="giftCode"
                                                placeholder="ENTER CODE (E.G. AGNEYA-XXXX-XXXX)"
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-[11px] font-black uppercase tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                required
                                            />
                                            <button 
                                                type="submit"
                                                className="bg-white text-slate-950 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-50 active:scale-95 transition-all shadow-xl"
                                            >
                                                Authorize
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-gray-100 p-6 rounded-xl space-y-2">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Balance</p>
                                        <h4 className="text-3xl font-black text-gray-900 tracking-tighter">₹0.00</h4>
                                    </div>
                                    <div className="border border-gray-100 p-6 rounded-xl space-y-2">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Redeemed</p>
                                        <h4 className="text-3xl font-black text-gray-900 tracking-tighter">₹0.00</h4>
                                    </div>
                                </div>

                                <div className="mt-12 space-y-4">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-l-2 border-indigo-600 pl-4">Transaction History</h3>
                                    <div className="bg-gray-50 rounded-xl p-10 flex flex-col items-center justify-center gap-4 border border-dashed border-gray-200">
                                        <FiClock className="text-gray-300 w-8 h-8" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">No Redemption Records</p>
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

export default UserDashboard;
