import React, { useState } from 'react';
import axios from 'axios';
import { FiTag, FiPlus, FiCheckCircle, FiXCircle, FiPercent, FiCalendar } from 'react-icons/fi';

const CreateCouponForm = ({ onCouponCreated }) => {
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: '',
    expiryDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'code' ? value.toUpperCase() : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('/api/admin/marketing/coupons', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Promo Code generated successfully!' });
        setFormData({ code: '', discountPercentage: '', expiryDate: '' });
        if (onCouponCreated) onCouponCreated();
      }
    } catch (err) {
      console.error('Coupon creation error:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to generate code.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl p-8 border-gray-100 font-sans text-gray-800 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

      <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3 uppercase tracking-tight">
        <div className="bg-gray-900 text-white p-2 rounded-xl shadow-lg">
          <FiPlus size={20} />
        </div>
        Initialize Promotion
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Authentication Identifier (Code)</label>
          <div className="relative">
            <FiTag className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              name="code"
              required
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g. AGNEYA2026"
              className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-black tracking-widest placeholder:text-gray-300 focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Yield Capacity (Discount %)</label>
            <div className="relative">
              <FiPercent className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="number"
                name="discountPercentage"
                required
                min="1"
                max="100"
                value={formData.discountPercentage}
                onChange={handleChange}
                placeholder="20"
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-black placeholder:text-gray-300 focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Expiration Sequence (Date)</label>
            <div className="relative">
              <FiCalendar className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="date"
                name="expiryDate"
                required
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-black focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
            {message.type === 'success' ? <FiCheckCircle size={16} /> : <FiXCircle size={16} />}
            {message.text}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-10 py-4 bg-gray-900 hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/10 transition-all active:scale-95 flex items-center gap-3 ${loading ? 'opacity-50 cursor-wait' : ''}`}
          >
            {loading ? 'Processing...' : 'Deploy Protocol'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCouponForm;

