import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiLayout, FiMail, FiPhone, FiMapPin, FiImage, FiSave, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const CompanyProfileForm = () => {
  const [formData, setFormData] = useState({
    storeName: '',
    supportEmail: '',
    supportPhone: '',
    address: '',
    logoUrl: ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/settings/company', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data.success && response.data.data) {
        const payload = {
          storeName: response.data.data.storeName || '',
          supportEmail: response.data.data.supportEmail || '',
          supportPhone: response.data.data.supportPhone || '',
          address: response.data.data.address || '',
          logoUrl: response.data.data.logoUrl || ''
        };
        setFormData(payload);
        setOriginalData(payload);
      }
    } catch (err) {
      console.error('Error fetching company profile:', err);
      setMessage({ type: 'error', text: 'Failed to load company profile archives.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleDiscard = () => {
    if (originalData) {
      setFormData(originalData);
      setLogoFile(null);
    }
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      const data = new FormData();
      data.append('storeName', formData.storeName);
      data.append('supportEmail', formData.supportEmail);
      data.append('supportPhone', formData.supportPhone);
      data.append('address', formData.address);
      data.append('logoUrl', formData.logoUrl); // For manual URL if still used, otherwise ignored
      
      if (logoFile) {
        data.append('logoFile', logoFile);
      }

      const response = await axios.put('/api/admin/settings/company', data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Corporate Identity Synchronized' });
        setOriginalData(formData);
        setLogoFile(null);
        // Refresh to get new logo URL if changed
        fetchCompanyProfile();
      }
    } catch (err) {
      console.error('Error updating company profile:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to persist updates.' });
    } finally {
      setSaving(false);
      if (message.type !== 'error') {
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-white/70 backdrop-blur-xl rounded-[32px] border border-gray-100">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compiling System identity...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl p-8 md:p-12 border-gray-100 font-sans text-gray-800 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

      <div className="mb-10 relative z-10">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4 tracking-tight uppercase">
          <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl shadow-blue-500/20">
            <FiLayout size={24} />
          </div>
          Identity Protocol
        </h2>
        <p className="text-sm text-gray-400 mt-2 font-bold max-w-lg leading-relaxed">System parameters for global store presence, operational outreach, and localized HQ mapping.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Store Name */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Storefront Identifier</label>
            <input
              type="text"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange}
              placeholder="e.g. AGNEYA DESIGN STUDIO"
              className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-[15px] font-black text-gray-900 placeholder:text-gray-300 focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Outreach Interface (Email)</label>
            <div className="relative">
              <FiMail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="email"
                name="supportEmail"
                value={formData.supportEmail}
                onChange={handleChange}
                placeholder="support@agneya.com"
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Voice Protocol (Phone)</label>
            <div className="relative">
              <FiPhone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                name="supportPhone"
                value={formData.supportPhone}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">HQ Physical Coordinates</label>
            <div className="relative">
               <FiMapPin className="absolute left-6 top-6 text-gray-300" />
               <textarea
                 name="address"
                 value={formData.address}
                 onChange={handleChange}
                 rows="3"
                 placeholder="Global HQ coordinates or regional warehouse address..."
                 className="w-full bg-gray-50/50 border border-gray-100 rounded-3xl pl-14 pr-6 py-5 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all outline-none resize-none"
               ></textarea>
            </div>
          </div>

          {/* Logo Upload Interface */}
          <div className="md:col-span-2 space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Branding Asset (Logo Protocol)</label>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* CURRENT PREVIEW */}
              <div className="flex flex-col items-center gap-3">
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Active Logo</span>
                {formData.logoUrl ? (
                  <div className="w-24 h-24 rounded-[32px] bg-white border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center p-4 shadow-xl shadow-blue-500/5">
                    <img src={formData.logoUrl} alt="Store Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-[32px] bg-gray-50 border-2 border-dashed border-gray-100 flex-shrink-0 flex items-center justify-center text-gray-200">
                    <FiImage size={24} />
                  </div>
                )}
              </div>

              {/* UPLOAD CONTROL */}
              <div className="flex-1 w-full space-y-4">
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[32px] px-8 py-10 flex flex-col items-center justify-center gap-4 transition-all group-hover:bg-white group-hover:border-blue-400/50">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                      <FiImage size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-gray-700 leading-tight">
                        {logoFile ? logoFile.name : 'Deploy New Assets'}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : 'Direct File Selection (PNG, SVG, JPG)'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {logoFile && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Ready for Synchronization
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messaging Area */}
        {message.text && (
          <div className={`p-5 rounded-2xl border flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.1em] ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-600 shadow-lg shadow-green-500/5' : 'bg-red-50 border-red-100 text-red-600 shadow-lg shadow-red-500/5'}`}>
            {message.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-10 border-t border-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-4">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={saving}
            className="px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all active:scale-95"
          >
            Reset Protocol
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white bg-gray-900 hover:bg-blue-600 shadow-xl shadow-blue-500/10 transition-all active:scale-95 flex items-center justify-center gap-3 ${saving ? 'opacity-70 cursor-wait' : ''}`}
          >
            {saving ? (
              <>Synchronizing...</>
            ) : (
              <>Deploy Identity <FiSave /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfileForm;

