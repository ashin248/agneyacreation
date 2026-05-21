import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiTrash2, FiEdit2, FiImage, FiGrid, FiFolder, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      };
      const res = await axios.get('/api/admin/categories', config);
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setIsEditing(true);
      setCurrentId(category._id);
      setFormData({
        name: category.name,
        description: category.description || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
        imageUrl: category.imageUrl || ''
      });
      setImagePreview(category.imageUrl || '');
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setFormData({ name: '', description: '', isActive: true, imageUrl: '' });
      setImagePreview('');
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('isActive', formData.isActive);
    if (imageFile) {
      data.append('image', imageFile);
    } else if (isEditing && formData.imageUrl) {
      data.append('imageUrl', formData.imageUrl);
    }

    try {
      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}` 
        }
      };

      if (isEditing) {
        await axios.put(`/api/admin/categories/${currentId}`, data, config);
        toast.success('Category updated');
      } else {
        await axios.post('/api/admin/categories', data, config);
        toast.success('Category created');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
            <FiGrid className="text-indigo-600" /> Category Manager
          </h1>
          <p className="text-sm text-gray-400 font-bold">Manage your product categories, icons, and status.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-indigo-500/20"
        >
          <FiPlus /> New Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div key={cat._id} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <FiImage className="text-gray-200" size={24} />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 uppercase text-sm tracking-tight">{cat.name}</h3>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${cat.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-bold mb-6 line-clamp-2">{cat.description || 'No description provided.'}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(cat)}
                  className="flex-1 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <FiEdit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => setDeleteConfirmId(cat._id)}
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
                {isEditing ? 'Modify Category' : 'Create Category'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Category Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                    placeholder="e.g., T-Shirts"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold min-h-[100px]"
                    placeholder="Describe this category..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Category Image / Icon</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-contain p-2" alt="Preview" />
                      ) : (
                        <FiImage size={24} className="text-gray-300" />
                      )}
                      <input
                        type="file"
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 mb-2">Transparent PNG recommended (1:1 aspect ratio).</p>
                      <label className="cursor-pointer bg-white border border-gray-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all inline-block">
                        Choose Image
                        <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Status</label>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ml-3 text-xs font-black uppercase tracking-widest text-gray-500">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-lg shadow-indigo-500/20"
                  >
                    {isEditing ? 'Save Changes' : 'Create Category'}
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

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="bg-white rounded-[40px] w-full max-w-sm relative z-10 overflow-hidden shadow-2xl p-8 text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTrash2 size={24} />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">Delete Category</h3>
            <p className="text-xs text-gray-400 font-bold mb-6">Are you sure? This action cannot be undone and may affect associated products.</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-gray-50 text-gray-400 hover:text-gray-900 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
