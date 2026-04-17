import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiDollarSign, FiShoppingBag, FiPackage, FiUsers, FiAlertCircle, FiArrowUpRight, FiClock, FiFileText, FiTrendingUp, FiActivity, FiBox } from 'react-icons/fi';

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalOrders: 0,
    activeBulkOrders: 0,
    newInquiries: 0,
    verifiedBusinessCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.get('/api/admin/dashboard/stats/global', {
          headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError('Failed to fetch statistics data.');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Connection error rendering dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
      return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
      }).format(val || 0);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="bg-white/70 backdrop-blur-xl border border-white p-7 rounded-[32px] shadow-2xl shadow-gray-200/50 group transition-all duration-500 hover:-translate-y-2 hover:bg-white active:scale-95 border-gray-100">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl ${color.bg} ${color.text} shadow-xl transition-transform group-hover:rotate-12 duration-500`}>
          <Icon size={24} />
        </div>
        {trend && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-xl border border-green-100 animate-pulse">
                <FiArrowUpRight size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">{trend}</span>
            </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 opacity-70 group-hover:opacity-100 transition-opacity">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-2 group-hover:text-indigo-600 transition-colors">{value}</h3>
        {subtitle && (
            <div className="flex items-center gap-2 mt-3 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_indigo]"></div>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest italic">{subtitle}</p>
            </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-24 bg-white/70 backdrop-blur-xl rounded-[40px] border border-gray-100 shadow-2xl">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Synchronizing Global Metrics...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12">
      
      {/* FINANCIAL CLUSTER */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200"></div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-2 whitespace-nowrap">Commercial Performance</h3>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard 
                title="Total Revenue" 
                value={formatCurrency(stats.totalRevenue)} 
                icon={FiDollarSign} 
                color={{bg: 'bg-indigo-600', text: 'text-white'}}
                subtitle="Lifetime archive collection"
            />
            <StatCard 
                title="Today's Sales" 
                value={formatCurrency(stats.todayRevenue)} 
                icon={FiTrendingUp} 
                color={{bg: 'bg-emerald-500', text: 'text-white'}}
                subtitle="Live commercial balance"
                trend="+12%"
            />
            <StatCard 
                title="Aggregate Volume" 
                value={stats.totalOrders} 
                icon={FiShoppingBag} 
                color={{bg: 'bg-indigo-900', text: 'text-white'}}
                subtitle="Unified checkout tasks"
            />
            <StatCard 
                title="Asset Efficiency" 
                value={formatCurrency(stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0)} 
                icon={FiActivity} 
                color={{bg: 'bg-indigo-500/10', text: 'text-indigo-600'}}
                subtitle="Avg order value score"
            />
        </div>
      </section>

      {/* B2B INFRASTRUCTURE */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200"></div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-2 whitespace-nowrap">Wholesale & B2B Infrastructure</h3>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard 
                title="Wholesale Active" 
                value={stats.activeBulkOrders} 
                icon={FiClock} 
                color={{bg: 'bg-gray-900', text: 'text-white'}}
                subtitle="Fulfillment pipeline status"
            />
            <StatCard 
                title="Pending Inquiries" 
                value={stats.newInquiries} 
                icon={FiFileText} 
                color={{bg: 'bg-white', text: 'text-gray-900'}}
                subtitle="B2B negotiation requests"
            />
            <StatCard 
                title="Verified Business" 
                value={stats.verifiedBusinessCount} 
                icon={FiUsers} 
                color={{bg: 'bg-indigo-500/10', text: 'text-indigo-600'}}
                subtitle="Approved commercial profiles"
            />
        </div>
      </section>

      {/* INVENTORY SURVEILLANCE */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200"></div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-2 whitespace-nowrap">Catalog Surveillance</h3>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard 
                title="Catalog Assets" 
                value={stats.totalProducts} 
                icon={FiPackage} 
                color={{bg: 'bg-gray-100', text: 'text-gray-400'}}
                subtitle="Live design frameworks"
            />
            <StatCard 
                title="Units in Vault" 
                value={stats.totalStock.toLocaleString()} 
                icon={FiBox} 
                color={{bg: 'bg-gray-50', text: 'text-indigo-900'}}
                subtitle="Aggregate asset count"
            />
            
            {/* ALERT CARD */}
            <div className="bg-red-500/90 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl shadow-red-500/20 relative overflow-hidden flex flex-col justify-center border border-red-400/50 group hover:bg-red-600 transition-all duration-500 active:scale-95">
                <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                    <FiAlertCircle size={160} className="text-white" />
                </div>
                <div className="flex flex-col relative z-10">
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                        <FiAlertCircle className="animate-pulse" /> Critical Stock Alert
                    </p>
                    <h3 className="text-5xl font-black text-white tracking-tighter mb-2">{stats.lowStockCount}</h3>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest italic leading-relaxed">SKU variations identified below the <span className="text-white">5 unit threshold</span>. Immediate restoration required.</p>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardStats;

