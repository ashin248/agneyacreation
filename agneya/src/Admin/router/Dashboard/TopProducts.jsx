import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTrendingUp, FiShoppingBag, FiAward } from 'react-icons/fi';

const TopProducts = ({ refreshKey }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        const res = await axios.get('/api/admin/dashboard/stats/top-products', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.data.success) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopProducts();
  }, [refreshKey]);

  if (loading) return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white shadow-2xl p-8 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
    </div>
  );

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white shadow-2xl p-8 h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
           <h2 className="text-sm font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
               <FiAward className="text-pink-500" /> Top Selling Goods
           </h2>
       </div>
       <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
           {products.length === 0 ? <p className="text-xs text-gray-400 font-bold tracking-widest text-center mt-10">NO SALES REGISTERED</p> : products.map((prod, idx) => (
               <div key={prod._id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-50 hover:border-pink-200 transition-colors group">
                   <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                           {prod.image ? <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" /> : <FiShoppingBag className="text-gray-300" />}
                       </div>
                       <div>
                           <p className="text-xs font-black text-gray-900 uppercase group-hover:text-pink-600 transition-colors">{prod.name}</p>
                           <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-0.5">{prod.totalSold} UNITS DISPATCHED</p>
                       </div>
                   </div>
                   <div className="text-right">
                       <p className="text-xs font-black text-pink-600 bg-pink-50 px-2 py-1 rounded-lg">₹{prod.revenue?.toLocaleString('en-IN')}</p>
                   </div>
               </div>
           ))}
       </div>
    </div>
  );
};

export default TopProducts;
