import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTruck, FiPlus, FiTrash2, FiMap, FiCreditCard, FiCheckCircle, FiAlertCircle, FiSave } from 'react-icons/fi';

const ShippingRulesManager = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/settings/shipping', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data.success) {
        setRules(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching shipping rules:', error);
      const errorMsg = error.response?.data?.message || 'Logistics connection failure. Please verify the server status.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = () => {
    setRules([...rules, { region: '', cost: 0, minOrderForFreeShipping: 0 }]);
  };

  const handleRemoveRule = (index) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    setRules(updatedRules);
  };

  const handleChange = (index, field, value) => {
    const updatedRules = [...rules];
    updatedRules[index][field] = value;
    setRules(updatedRules);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put('/api/admin/settings/shipping', { shippingRules: rules }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Logistics Protocols Synchronized' });
      }
    } catch (error) {
      console.error('Error saving shipping rules:', error);
      const detail = error.response?.data?.message || 'Failed to persist logistics updates.';
      setMessage({ type: 'error', text: detail });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-white/70 backdrop-blur-xl rounded-[32px] border border-gray-100">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compiling Logistics rules...</p>
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
              <FiTruck size={24} />
            </div>
            Logistics Parameters
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-bold max-w-lg leading-relaxed">Define regional shipping costs and threshold-based free delivery protocols.</p>
        </div>
        
        <button
          onClick={handleAddRule}
          className="px-6 py-3 bg-white border border-gray-100 text-gray-900 hover:bg-gray-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-gray-200/50 active:scale-95 flex items-center gap-2"
        >
          <FiPlus /> New Logic Region
        </button>
      </div>
      
      <div className="space-y-6 relative z-10">
        {rules.map((rule, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-white/50 border border-gray-50 p-6 rounded-[28px] shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                 <FiMap className="text-blue-500" /> Identity Zone
              </label>
              <input
                type="text"
                value={rule.region}
                onChange={(e) => handleChange(index, 'region', e.target.value)}
                placeholder="e.g. KERALA"
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                 <FiCreditCard className="text-blue-500" /> Base Tariff (₹)
              </label>
              <input
                type="number"
                value={rule.cost}
                onChange={(e) => handleChange(index, 'cost', Number(e.target.value))}
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 outline-none"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                 <FiCheckCircle className="text-blue-500" /> Free Tier Threshold (₹)
              </label>
              <input
                type="number"
                value={rule.minOrderForFreeShipping}
                onChange={(e) => handleChange(index, 'minOrderForFreeShipping', Number(e.target.value))}
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 outline-none"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => handleRemoveRule(index)}
                className="w-12 h-12 bg-white text-red-400 hover:bg-red-500 hover:text-white border border-red-50 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-red-500/10 active:scale-90"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="text-center py-20 bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center">
            <FiTruck size={48} className="text-gray-200 mb-6 stroke-1" />
            <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest leading-none">Logistics Void</h3>
            <p className="text-sm font-medium text-gray-300 mt-2">Initialize regional tariffs to unlock delivery pipelines.</p>
          </div>
        )}
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
          {saving ? 'Synchronizing Pipeline...' : <>Deploy Logistics <FiSave /></>}
        </button>
      </div>
    </div>
  );
};

export default ShippingRulesManager;

