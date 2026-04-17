import React, { useState, useEffect } from 'react';
import DashboardStats from '../router/Dashboard/DashboardStats.jsx';
import SalesAnalyticsChart from '../router/Dashboard/SalesAnalyticsChart.jsx';
import CustomDesignStatsChart from '../router/Dashboard/CustomDesignStatsChart.jsx';
import RecentOrdersTable from '../router/Dashboard/RecentOrdersTable.jsx';
import AdminAlerts from '../router/Dashboard/AdminAlerts.jsx';
import TopProducts from '../router/Dashboard/TopProducts.jsx';
import { FiRefreshCw } from 'react-icons/fi';

function Dashboard() {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        setRefreshKey(prev => prev + 1);
      }, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const triggerManualRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 md:p-8">

      {/* Page Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview Dashboard</h1>
           <p className="text-sm text-gray-500 mt-1">Real-time metrics, analytics, and recent fulfillment activity.</p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-4">
           <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Auto Sync</span>
              <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoRefresh ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <input type="checkbox" className="sr-only" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} />
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${autoRefresh ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
           </label>
           <button onClick={triggerManualRefresh} className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition active:scale-95">
              <FiRefreshCw className={`text-gray-600 ${autoRefresh ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {/* Top Level: KPI Stats Grid */}
      <div className="mb-10">
         <DashboardStats key={`stats-${refreshKey}`} />
      </div>

      {/* High Priority: System Alerts */}
      <div className="mb-8">
         <AdminAlerts key={`alerts-${refreshKey}`} />
      </div>

      {/* Mid Level: Analytics & Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Sales Analytic Graph (Takes 2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-8">
          <SalesAnalyticsChart key={`sales-${refreshKey}`} />
          <CustomDesignStatsChart key={`custom-${refreshKey}`} />
        </div>

        {/* Details & Expiry Tracker (Takes 1 column on large screens) */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Infrastructure Expiry Widget */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
             <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                Infrastructure & Billing Expiry
             </h3>
             <div className="space-y-4">
                {/* Domain */}
                <div className="flex justify-between items-center p-3 bg-red-50/50 rounded-xl border border-red-100">
                   <div>
                     <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Domain Expiry</p>
                     <p className="text-sm font-medium text-gray-800 mt-0.5">agneya.in</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-bold text-gray-900">Nov 15, 2026</p>
                   </div>
                </div>
                {/* Hosting */}
                <div className="flex justify-between items-center p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                   <div>
                     <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Hosting Expiry</p>
                     <p className="text-sm font-medium text-gray-800 mt-0.5">Cloud Server</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-bold text-gray-900">Aug 05, 2026</p>
                   </div>
                </div>
             </div>
          </div>

          <TopProducts refreshKey={refreshKey} />
          <RecentOrdersTable key={`recent-${refreshKey}`} />
        </div>

      </div>

    </div>
  );
}

export default Dashboard;

