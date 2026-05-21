import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiBox, FiSearch, FiAlertTriangle, FiPlus, FiEdit3, FiTrash2, FiExternalLink, FiEye, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ProductListTable = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let productData = [];
      if (Array.isArray(response.data)) {
         productData = response.data;
      } else if (response.data?.success) {
         productData = response.data.products || response.data.data || [];
      } else if (response.data?.products) {
         productData = response.data.products;
      } else if (response.data?.data) {
         productData = response.data.data;
      }
      
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Connection with central catalog failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product decommissioned successfully.');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to decommission product.');
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/products/edit/${id}`);
  };

  const getTotalStock = (product) => {
    return product.variations ? product.variations.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0) : 0;
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter(p => {
    if (!p || !p.name) return false;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStock = showLowStockOnly ? getTotalStock(p) < 10 : true;
    return matchesSearch && matchesStock;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showLowStockOnly]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-white/70 backdrop-blur-xl rounded-[32px] border border-gray-100">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accessing Catalog Archives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-white/70 backdrop-blur-xl rounded-[32px] border border-red-100">
        <FiAlertTriangle size={32} className="text-red-400" />
        <p className="text-[12px] font-black text-red-500 uppercase tracking-widest">{error}</p>
        <button onClick={fetchProducts} className="mt-4 px-6 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Retry Connection</button>
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
        <div className="overflow-x-auto">
            {paginatedProducts.length === 0 ? (
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
                        {paginatedProducts.map((p) => {
                            const stock = getTotalStock(p);
                            const img = p.galleryImages?.[0];
                            return (
                                <tr key={p._id} className="hover:bg-indigo-50/20 transition-all duration-300 group font-bold">
                                    <td className="py-3 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                                                {img ? <img loading="lazy" src={img} className="h-full w-full object-cover" alt="" /> : <FiBox className="m-auto text-gray-200" />}
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
                                            <button onClick={() => window.open(`/customize/${p._id}`, '_blank')} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-600 hover:text-white transition-all duration-300 border border-blue-100 flex items-center justify-center" title="Observe in Studio">
                                                <FiEye size={14} />
                                            </button>
                                            <button onClick={() => handleEdit(p._id)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-slate-900 hover:text-white transition-all duration-300 border border-gray-100 flex items-center justify-center" title="Edit Asset">
                                                <FiEdit3 size={14} />
                                            </button>
                                            <button onClick={() => setDeleteConfirmProduct({ id: p._id, name: p.name })} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white transition-all duration-300 border border-gray-100 flex items-center justify-center" title="Decommission Asset">
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

        {/* PAGINATION PANEL */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white/70 backdrop-blur-xl border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing {Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
              {Math.min(filteredProducts.length, currentPage * itemsPerPage)} of {filteredProducts.length} assets
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                  currentPage === 1
                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-500 hover:text-indigo-600'
                }`}
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-500 hover:text-indigo-600'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                  currentPage === totalPages
                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-500 hover:text-indigo-600'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CUSTOM DELETE CONFIRMATION OVERLAY */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => setDeleteConfirmProduct(null)}></div>
          <div className="bg-white rounded-[40px] w-full max-w-sm relative z-10 overflow-hidden shadow-2xl p-8 text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTrash2 size={24} />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">Delete Product</h3>
            <p className="text-xs text-gray-400 font-bold mb-6">Are you sure you want to delete "{deleteConfirmProduct.name}"? This action cannot be undone and will remove it from all storefront categories.</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleDelete(deleteConfirmProduct.id);
                  setDeleteConfirmProduct(null);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmProduct(null)}
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

export default ProductListTable;

