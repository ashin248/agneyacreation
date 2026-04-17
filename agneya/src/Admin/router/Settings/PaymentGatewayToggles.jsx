import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCreditCard, FiLock, FiCheckCircle, FiAlertCircle, FiSave, FiSettings, FiActivity } from 'react-icons/fi';

const PaymentGatewayToggles = () => {
  const [gateways, setGateways] = useState({
    razorpay: { isActive: false, keyId: '', keySecret: '' },
    stripe: { isActive: false, publicKey: '', secretKey: '' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/settings/payments', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data.success && response.data.data) {
        setGateways({
          razorpay: response.data.data.razorpay || { isActive: false, keyId: '', keySecret: '' },
          stripe: response.data.data.stripe || { isActive: false, publicKey: '', secretKey: '' }
        });
      }
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
      setMessage({ type: 'error', text: 'Financial archive connection error.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (gateway) => {
    setGateways(prev => ({
      ...prev,
      [gateway]: { ...prev[gateway], isActive: !prev[gateway].isActive }
    }));
  };

  const handleChange = (gateway, field, value) => {
    setGateways(prev => ({
      ...prev,
      [gateway]: { ...prev[gateway], [field]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put('/api/admin/settings/payments', gateways, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Financial Protocols Synchronized' });
      }
    } catch (error) {
      console.error('Error saving payment settings:', error);
      setMessage({ type: 'error', text: 'Failed to persist financial updates.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-white/70 backdrop-blur-xl rounded-[32px] border border-gray-100">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compiling Finance Nodes...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl p-8 md:p-12 border-gray-100 font-sans text-gray-800 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

      <div className="mb-10 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4 tracking-tight uppercase">
            <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl shadow-blue-500/20">
              <FiCreditCard size={24} />
            </div>
            Finance Gateways
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-bold max-w-lg leading-relaxed">Configure operational payment channels and deploy secure API credentials.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
        {/* Razorpay Card */}
        <div className={`p-8 rounded-[32px] border transition-all duration-500 flex flex-col ${gateways.razorpay.isActive ? 'bg-blue-50/30 border-blue-200 shadow-xl shadow-blue-500/5' : 'bg-gray-50/50 border-gray-100'}`}>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${gateways.razorpay.isActive ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-gray-200 text-gray-400'}`}>
                 <FiActivity size={20} />
               </div>
               <div>
                 <h3 className="text-lg font-black text-gray-900 tracking-tight">RAZORPAY</h3>
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{gateways.razorpay.isActive ? 'Online Protocol Active' : 'Protocol Suspended'}</p>
               </div>
            </div>
            <button
               onClick={() => handleToggle('razorpay')}
               className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 ${gateways.razorpay.isActive ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-500 shadow-sm ${gateways.razorpay.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Key Identification (ID)</label>
              <input
                type="text"
                value={gateways.razorpay.keyId}
                onChange={(e) => handleChange('razorpay', 'keyId', e.target.value)}
                placeholder="rzp_test_..."
                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none disabled:opacity-30"
                disabled={!gateways.razorpay.isActive}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Authentication Secret</label>
              <div className="relative">
                <FiLock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="password"
                  value={gateways.razorpay.keySecret}
                  onChange={(e) => handleChange('razorpay', 'keySecret', e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full bg-white border border-gray-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none disabled:opacity-30"
                  disabled={!gateways.razorpay.isActive}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stripe Card */}
        <div className={`p-8 rounded-[32px] border transition-all duration-500 flex flex-col ${gateways.stripe.isActive ? 'bg-purple-50/30 border-purple-200 shadow-xl shadow-purple-500/5' : 'bg-gray-50/50 border-gray-100'}`}>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${gateways.stripe.isActive ? 'bg-purple-600 text-white shadow-purple-500/20' : 'bg-gray-200 text-gray-400'}`}>
                 <FiSettings size={20} />
               </div>
               <div>
                 <h3 className="text-lg font-black text-gray-900 tracking-tight">STRIPE</h3>
                 <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">{gateways.stripe.isActive ? 'Global Payment Host' : 'Host Inactive'}</p>
               </div>
            </div>
            <button
               onClick={() => handleToggle('stripe')}
               className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 ${gateways.stripe.isActive ? 'bg-purple-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-500 shadow-sm ${gateways.stripe.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Publishable Authority</label>
              <input
                type="text"
                value={gateways.stripe.publicKey}
                onChange={(e) => handleChange('stripe', 'publicKey', e.target.value)}
                placeholder="pk_test_..."
                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-purple-500/5 transition-all outline-none disabled:opacity-30"
                disabled={!gateways.stripe.isActive}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Secret Node</label>
              <div className="relative">
                <FiLock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="password"
                  value={gateways.stripe.secretKey}
                  onChange={(e) => handleChange('stripe', 'secretKey', e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full bg-white border border-gray-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-purple-500/5 transition-all outline-none disabled:opacity-30"
                  disabled={!gateways.stripe.isActive}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-10 border-t border-gray-50 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           {message.text && (
            <div className={`px-5 py-3 rounded-2xl border flex items-center gap-3 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/5 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
              {message.type === 'success' ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
              {message.text}
            </div>
           )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-12 py-5 bg-gray-900 hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/10 transition-all active:scale-95 flex items-center gap-3 ${saving ? 'opacity-50 cursor-wait' : ''}`}
        >
          {saving ? 'Synchronizing Gates...' : <>Deploy Financial Grid <FiSave /></>}
        </button>
      </div>
    </div>
  );
};

export default PaymentGatewayToggles;

