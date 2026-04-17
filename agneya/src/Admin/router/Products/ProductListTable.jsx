import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiBox, FiSearch, FiAlertTriangle, FiPlus, FiEdit3, FiTrash2, FiExternalLink, FiEye, FiCheckCircle } from 'react-icons/fi';

const ProductListTable = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Connection with central catalog failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Terminate "${name}" from the active archives? This action is irreversible.`)) {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`/api/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(prev => prev.filter(p => p._id !== id));
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to decommission product.');
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/products/edit/${id}`);
  };

  const getTotalStock = (product) => {
    return product.variations ? product.variations.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0) : 0;
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = showLowStockOnly ? getTotalStock(p) < 10 : true;
    return matchesSearch && matchesStock;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-white/70 backdrop-blur-xl rounded-[32px] border border-gray-100">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accessing Catalog Archives...</p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto font-sans text-gray-800">
      
      {/* HEADER SECTION */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-4 uppercase">
            <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-xl shadow-indigo-500/20">
              <FiBox size={24} />
            </div>
            Catalog Control
          </h1>
          <p className="mt-2 text-sm text-gray-400 font-bold max-w-lg leading-relaxed">Centralized inventory management for retail, custom apparel, and wholesale distributions.</p>
        </div>
        
        <button
          onClick={() => navigate('/admin/products/create')}
          className="px-8 py-5 bg-gray-900 hover:bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/10 transition-all active:scale-95 flex items-center gap-3"
        >
          Deploy New Asset <FiPlus size={16} />
        </button>
      </div>

      {/* SEARCH & FILTER HUB */}
      <div className="mb-10 bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-[32px] shadow-2xl border-gray-100">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
            
            <div className="flex-1 w-full relative group">
                <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search catalog by identity or category..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-16 pr-6 py-4 bg-gray-50/50 border border-gray-100/50 rounded-2xl text-[13px] font-bold text-gray-900 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all outline-none"
                />
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
                <button
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${showLowStockOnly ? 'bg-red-500 text-white border-red-500 shadow-xl shadow-red-500/20' : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-200'}`}
                >
                    <FiAlertTriangle size={14} /> {showLowStockOnly ? 'Close Alert' : 'Stock Alert'}
                </button>
            </div>
        </div>
      </div>

      {/* CATALOG DATA GRID */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl overflow-hidden border-gray-100">
        <div className="overflow-x-auto min-h-[400px]">
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <FiBox size={40} className="text-gray-200" />
                    </div>
                    <h3 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Catalog Void</h3>
                    <p className="text-sm font-medium text-gray-300 mt-2">Modify your parameters or deploy your first asset.</p>
                </div>
            ) : (
                <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-gray-50/30">
                            <th className="py-2 px-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100/50">Asset Profile</th>
                            <th className="px-4 py-2 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100/50">Base Value</th>
                            <th className="px-4 py-2 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100/50">Badges</th>
                            <th className="px-4 py-2 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100/50">Stock</th>
                            <th className="px-4 py-2 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100/50">Status</th>
                            <th className="py-2 px-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100/50">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredProducts.map((p) => {
                            const stock = getTotalStock(p);
                            const img = p.galleryImages?.[0];
                            return (
                                <tr key={p._id} className="hover:bg-indigo-50/20 transition-all duration-300 group font-bold">
                                    <td className="py-3 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                                                {img ? <img src={img} className="h-full w-full object-cover" alt="" /> : <FiBox className="m-auto text-gray-200" />}
                                            </div>
                                            <div>
                                                <div className="font-black text-gray-900 tracking-tight text-[12px] uppercase truncate max-w-[150px]">{p.name}</div>
                                                <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{p.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-[12px] font-black text-gray-900 shrink-0">₹{(p.basePrice || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col gap-1 items-center">
                                            {p.isBulkEnabled && <div className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-blue-100">B2B</div>}
                                            {p.isCustomizable && <div className="px-2 py-0.5 bg-pink-50 text-pink-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-pink-100">Custom</div>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center justify-center h-8 w-8 text-[10px] font-black rounded-lg border-2 tracking-tighter ${stock < 10 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                            {stock}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${p.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                            <div className={`w-1 h-1 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                            {p.isActive ? 'Live' : 'Draft'}
                                        </div>
                                    </td>
                                    <td className="py-3 px-6 text-right">
                                        <div className="flex justify-end gap-1.5">
                                            <button onClick={() => handleEdit(p._id)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-slate-900 hover:text-white transition-all duration-300 border border-gray-100 flex items-center justify-center" title="Edit Asset">
                                                <FiEdit3 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(p._id, p.name)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white transition-all duration-300 border border-gray-100 flex items-center justify-center" title="Decommission Asset">
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductListTable;

