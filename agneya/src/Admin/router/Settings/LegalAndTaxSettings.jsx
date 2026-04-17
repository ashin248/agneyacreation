import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiShield, FiFileText, FiPercent, FiSave, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const LegalAndTaxSettings = () => {
  const [settings, setSettings] = useState({
    gstPercentage: 0,
    termsAndConditions: '',
    privacyPolicy: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/settings/legal', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data.success && response.data.data) {
        setSettings({
          gstPercentage: response.data.data.gstPercentage || 0,
          termsAndConditions: response.data.data.termsAndConditions || '',
          privacyPolicy: response.data.data.privacyPolicy || ''
        });
      }
    } catch (error) {
      console.error('Error fetching legal and tax settings:', error);
      setMessage({ type: 'error', text: 'Connection failed with compliance archives.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put('/api/admin/settings/legal', settings, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Compliance Protocols Synchronized' });
      }
    } catch (error) {
      console.error('Error saving legal and tax settings:', error);
      setMessage({ type: 'error', text: 'Failed to persist compliance updates.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-white/70 backdrop-blur-xl rounded-[32px] border border-gray-100">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compiling Tax Protocols...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl p-8 md:p-12 border-gray-100 font-sans text-gray-800 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

      <div className="mb-10 relative z-10">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4 tracking-tight uppercase">
          <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl shadow-blue-500/20">
            <FiShield size={24} />
          </div>
          Tax & Legal Framework
        </h2>
        <p className="text-sm text-gray-400 mt-2 font-bold max-w-lg leading-relaxed">Global taxation parameters and mandatory legal documentation for storefront compliance.</p>
      </div>
      
      <div className="space-y-10 relative z-10">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
             <FiPercent className="text-blue-500" /> Global GST Vector (%)
          </label>
          <input
            type="number"
            value={settings.gstPercentage}
            onChange={(e) => handleChange('gstPercentage', Number(e.target.value))}
            className="w-full md:w-1/3 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-[18px] font-black text-gray-900 focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all outline-none"
            min="0"
            step="0.1"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
               <FiFileText className="text-blue-500" /> Terms & Conditions Protocol
            </label>
            <textarea
              value={settings.termsAndConditions}
              onChange={(e) => handleChange('termsAndConditions', e.target.value)}
              rows="8"
              placeholder="Inject full terms and conditions terminology..."
              className="w-full bg-gray-50/50 border border-gray-100 rounded-3xl px-6 py-5 text-sm font-bold text-gray-700 leading-relaxed focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all outline-none resize-none"
            ></textarea>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
               <FiFileText className="text-blue-500" /> Privacy & Data Policy
            </label>
            <textarea
              value={settings.privacyPolicy}
              onChange={(e) => handleChange('privacyPolicy', e.target.value)}
              rows="8"
              placeholder="Inject comprehensive privacy protocol text..."
              className="w-full bg-gray-50/50 border border-gray-100 rounded-3xl px-6 py-5 text-sm font-bold text-gray-700 leading-relaxed focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all outline-none resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`mt-10 p-5 rounded-2xl border flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.1em] ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-600 shadow-lg shadow-green-500/5' : 'bg-red-50 border-red-100 text-red-600 shadow-lg shadow-red-500/5'}`}>
          {message.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="mt-12 flex justify-end relative z-10">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-12 py-5 bg-gray-900 hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/10 transition-all active:scale-95 flex items-center gap-3 ${saving ? 'opacity-50 cursor-wait' : ''}`}
        >
          {saving ? 'Synchronizing Archive...' : <>Deploy Framework <FiSave /></>}
        </button>
      </div>
    </div>
  );
};

export default LegalAndTaxSettings;

