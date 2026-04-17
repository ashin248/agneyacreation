import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTag, FiClock, FiCheckCircle, FiXCircle, FiPercent } from 'react-icons/fi';

const PromoCodesTable = ({ refreshTrigger }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, [refreshTrigger]);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/marketing/coupons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCoupons(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      setCoupons(prev => prev.map(c => 
        c._id === id ? { ...c, isActive: !c.isActive } : c
      ));

      await axios.put(`/api/admin/marketing/coupons/${id}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update coupon status.');
      fetchCoupons();
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl overflow-hidden border-gray-100 font-sans text-gray-800">
      <div className="p-8 border-b border-gray-50 flex items-center justify-between">
        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
           <FiTag className="text-blue-600" />
           Campaign Protocols
        </h2>
        <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
          {coupons.length} Active Artifacts
        </span>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-50 text-[10px] uppercase tracking-[0.2em] text-gray-400 bg-white/50 backdrop-blur-md sticky top-0 z-20">
              <th className="font-black p-6 pl-10 whitespace-nowrap">Identifier (Code)</th>
              <th className="font-black p-6">Capacity (Discount)</th>
              <th className="font-black p-6">Expiration Sequence</th>
              <th className="font-black p-6 text-center">Lifecycle</th>
              <th className="font-black p-6 pr-10 text-right">Switch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-transparent">
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="5" className="p-10 h-24 bg-gray-50/20"></td>
                </tr>
              ))
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-20 text-center">
                   <FiTag size={48} className="mx-auto mb-6 text-gray-200 stroke-1" />
                   <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No Promotional Artifacts Detected</p>
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => {
                const expired = isExpired(coupon.expiryDate);
                
                return (
                  <tr key={coupon._id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="p-6 pl-10 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-gray-200">
                           <FiPercent size={14} />
                         </div>
                         <span className="font-black text-[15px] text-gray-900 tracking-[0.1em] group-hover:text-blue-600 transition-colors">
                           {coupon.code}
                         </span>
                      </div>
                    </td>
                    <td className="p-6 whitespace-nowrap">
                      <div className="text-[14px] font-black text-blue-600 tracking-tighter bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 w-fit">
                        {coupon.discountPercentage}% YIELD
                      </div>
                    </td>
                    <td className="p-6 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-[11px] font-black text-gray-500 uppercase tracking-tighter bg-gray-50 w-fit px-2.5 py-1 rounded-lg border border-gray-100">
                        <FiClock size={12} />
                        {new Date(coupon.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-6 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                        !coupon.isActive 
                        ? 'bg-gray-100 text-gray-400 border-gray-200' 
                        : expired 
                        ? 'bg-red-50 text-red-500 border-red-100'
                        : 'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {!coupon.isActive ? (
                          <><span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>Inactive</>
                        ) : expired ? (
                          <><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>Expired</>
                        ) : (
                          <><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>Active</>
                        )}
                      </span>
                    </td>
                    <td className="p-6 pr-10 whitespace-nowrap text-right">
                      <button
                        onClick={() => toggleStatus(coupon._id)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-all duration-500 outline-none ${
                          coupon.isActive ? 'bg-blue-600 shadow-lg shadow-blue-500/10' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-500 shadow-sm ${
                          coupon.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PromoCodesTable;

