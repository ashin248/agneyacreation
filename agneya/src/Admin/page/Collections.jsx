import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiTrash2, FiEdit2, FiImage, FiCheck, FiX, FiFolder } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/collections', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.data.success) {
        setCollections(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (collection = null) => {
    if (collection) {
      setIsEditing(true);
      setCurrentId(collection._id);
      setFormData({
        name: collection.name,
        description: collection.description || '',
        isActive: collection.isActive
      });
      setLogoPreview(collection.logoUrl);
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setFormData({ name: '', description: '', isActive: true });
      setLogoPreview('');
    }
    setLogoFile(null);
    setIsModalOpen(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('isActive', formData.isActive);
    if (logoFile) {
      data.append('logo', logoFile);
    }

    try {
      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}` 
        }
      };

      if (isEditing) {
        await axios.put(`/api/admin/collections/${currentId}`, data, config);
        toast.success('Collection updated');
      } else {
        await axios.post('/api/admin/collections', data, config);
        toast.success('Collection created');
      }
      setIsModalOpen(false);
      fetchCollections();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) return;
    try {
      await axios.delete(`/api/admin/collections/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      toast.success('Collection deleted');
      fetchCollections();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
            <FiFolder className="text-indigo-600" /> Collection Manager
          </h1>
          <p className="text-sm text-gray-400 font-bold">Group your assets into curated collections with logos.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-indigo-500/20"
        >
          <FiPlus /> New Collection
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div key={col._id} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden">
                  <img src={col.logoUrl} alt={col.name} className="w-full h-full object-contain p-2" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 uppercase text-sm tracking-tight">{col.name}</h3>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${col.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {col.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-bold mb-6 line-clamp-2">{col.description || 'No description provided.'}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(col)}
                  className="flex-1 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <FiEdit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(col._id)}
                  className="w-12 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 py-3 rounded-xl transition-all flex items-center justify-center"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-[40px] w-full max-w-lg relative z-10 overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-6">
                {isEditing ? 'Modify Collection' : 'Create New Collection'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Collection Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                    placeholder="e.g., Summer Specials"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold min-h-[100px]"
                    placeholder="Describe this collection..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Collection Logo</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                      {logoPreview ? (
                        <img src={logoPreview} className="w-full h-full object-contain p-2" />
                      ) : (
                        <FiImage size={24} className="text-gray-300" />
                      )}
                      <input
                        type="file"
                        onChange={handleLogoChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 mb-2">Transparent PNG recommended (1:1 aspect ratio).</p>
                      <label className="cursor-pointer bg-white border border-gray-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all inline-block">
                        Choose Image
                        <input type="file" onChange={handleLogoChange} className="hidden" accept="image/*" />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-lg shadow-indigo-500/20"
                  >
                    {isEditing ? 'Save Changes' : 'Initialize Collection'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-4 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collections;
