import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiImage, FiPlus, FiTrash2, FiLink, FiCheckCircle, FiXCircle, FiArrowRight } from 'react-icons/fi';

const HomepageBannersGrid = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    title: '',
    linkUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/marketing/banners', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setBanners(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
        setMessage({ type: 'error', text: 'Please select an image file first.' });
        return;
    }
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      const data = new FormData();
      data.append('title', formData.title);
      data.append('linkUrl', formData.linkUrl);
      data.append('bannerImage', imageFile);

      const response = await axios.post('/api/admin/marketing/banners', data, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}` 
          }
      });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Banner created successfully!' });
        setFormData({ title: '', linkUrl: '' });
        setImageFile(null);
        e.target.reset();
        fetchBanners();
      }
    } catch (err) {
      console.error('Error creating banner:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create banner' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;

    try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.delete(`/api/admin/marketing/banners/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
            setBanners(prev => prev.filter(b => b._id !== id));
        }
    } catch (err) {
        console.error('Error deleting banner:', err);
        alert('Failed to delete banner');
    }
  };

  const toggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      setBanners(prev => prev.map(b => 
        b._id === id ? { ...b, isActive: !b.isActive } : b
      ));

      await axios.put(`/api/admin/marketing/banners/${id}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error toggling banner:', err);
      fetchBanners();
    }
  };

  return (
    <div className="space-y-12 font-sans text-gray-800">
      {/* 1. Add New Banner Form Section */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl p-8 md:p-10 border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

        <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3 uppercase tracking-tight">
          <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <FiPlus size={20} />
          </div>
          Create Steller Banner
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Campaign Headline</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. MEGA SUMMER SALE 2026"
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-gray-300 focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Redirect Protocol (URL)</label>
              <div className="relative">
                <FiLink className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  name="linkUrl"
                  value={formData.linkUrl}
                  onChange={handleInputChange}
                  placeholder="/shop/new-arrivals"
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold placeholder:text-gray-300 focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Creative Asset Deployment</label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setImageFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div className="w-full bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[28px] px-6 py-8 text-center group-hover:bg-white group-hover:border-blue-500/30 transition-all flex flex-col items-center justify-center gap-3">
                 <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-300 group-hover:text-blue-500 transition-colors">
                    <FiImage size={24} />
                 </div>
                 <div className="space-y-1">
                    <p className="text-sm font-black text-gray-700">
                      {imageFile ? imageFile.name : 'Click to upload or drag creative asset'}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recommended: 1920x800px (Max 5MB)</p>
                 </div>
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
              disabled={submitting}
              className={`px-10 py-4 bg-gray-900 hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/10 transition-all active:scale-95 flex items-center gap-3 ${submitting ? 'opacity-50 cursor-wait' : ''}`}
            >
              {submitting ? 'Synchronizing...' : <>Publish Campaign <FiArrowRight /></>}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Banner Grid Section */}
      <div>
        <div className="flex items-center justify-between mb-8 px-2">
           <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
              Live Deployments
              <span className="bg-gray-100 text-gray-400 text-[10px] px-3 py-1 rounded-full">{banners.length}</span>
           </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/50 backdrop-blur-md rounded-[32px] border border-gray-100 h-80 animate-pulse"></div>
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100 p-20 flex flex-col items-center justify-center">
            <FiImage size={48} className="text-gray-200 mb-6 stroke-1" />
            <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">Registry Empty</h3>
            <p className="text-sm font-medium text-gray-300 mt-2">Initialize your store's visual story above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {banners.map(banner => (
              <div key={banner._id} className={`group bg-white/70 backdrop-blur-xl rounded-[32px] border-2 transition-all duration-500 overflow-hidden relative ${banner.isActive ? 'border-transparent shadow-xl hover:shadow-2xl hover:-translate-y-2' : 'border-gray-50 opacity-60 grayscale'}`}>
                
                {/* Image Container */}
                <div className="h-56 relative overflow-hidden bg-gray-50">
                   <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                   
                   {!banner.isActive && (
                    <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                       <span className="bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-black uppercase px-4 py-2 rounded-xl shadow-2xl tracking-[0.2em]">Suspended</span>
                    </div>
                   )}

                   <div className="absolute top-4 right-4 flex gap-2">
                      <button
                          onClick={() => handleDelete(banner._id)}
                          className="w-10 h-10 bg-white/90 backdrop-blur-md text-red-500 rounded-xl shadow-lg flex items-center justify-center transition-all hover:bg-red-500 hover:text-white active:scale-90"
                      >
                          <FiTrash2 size={18} />
                      </button>
                   </div>
                </div>

                {/* Info & Protocol Footer */}
                <div className="p-6">
                   <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                         <p className="text-[15px] font-black text-gray-900 tracking-tight truncate">{banner.title || 'GENERIC CAMPAIGN'}</p>
                         <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                            <FiLink size={10} /> {banner.linkUrl ? banner.linkUrl.slice(0, 25) : 'DIRECT ROOT'}
                         </p>
                      </div>
                      
                      <button
                          onClick={() => toggleStatus(banner._id)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-all duration-500 outline-none ${
                            banner.isActive ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-gray-200'
                          }`}
                      >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-500 shadow-sm ${
                            banner.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomepageBannersGrid;

