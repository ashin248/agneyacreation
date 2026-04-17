import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Image as ImageIcon, Save, X, Loader2 } from 'lucide-react';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(null); // ID of category being edited
  const [formData, setFormData] = useState({ name: '', imageUrl: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (isEditing) {
        await axios.put(`/api/admin/categories/${isEditing}`, formData, config);
      } else {
        await axios.post('/api/admin/categories', formData, config);
      }
      
      setFormData({ name: '', imageUrl: '', description: '' });
      setIsEditing(null);
      setShowAddForm(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will not delete products in this category.")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (err) {
      alert("Failed to delete category");
    }
  };

  const startEdit = (cat) => {
    setIsEditing(cat._id);
    setFormData({ name: cat.name, imageUrl: cat.imageUrl || '', description: cat.description || '' });
    setShowAddForm(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Category Master</h1>
          <p className="text-slate-500 font-bold mt-1 uppercase text-[10px] tracking-widest">Global Taxonomy Configuration</p>
        </div>
        <button 
          onClick={() => { setShowAddForm(!showAddForm); setIsEditing(null); setFormData({name:'', imageUrl:'', description:''}); }}
          className="bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'Cancel' : 'New Category'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[40px] p-10 shadow-2xl mb-12 animate-slide-up">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Category Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all uppercase"
                  placeholder="e.g. T-SHIRTS"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Icon/Image URL</label>
                <div className="relative">
                   <input 
                    type="text" 
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all pl-14"
                    placeholder="https://..."
                  />
                  <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-3xl px-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all h-[140px] resize-none"
                placeholder="Marketing metadata for this category..."
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
               <button 
                type="submit" 
                disabled={loading}
                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-lg disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {isEditing ? 'Update Records' : 'Initialize Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !categories.length ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div key={cat._id} className="group bg-white/70 backdrop-blur-md border border-white rounded-[32px] p-6 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-50 relative group-hover:scale-105 transition-transform duration-500">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon size={32} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 uppercase tracking-tight truncate">{cat.name}</h3>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                    {cat.description || 'No metadata set'}
                  </p>
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => startEdit(cat)}
                      className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat._id)}
                      className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
