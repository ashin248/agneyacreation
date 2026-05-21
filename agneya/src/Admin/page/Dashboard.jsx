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
         <DashboardStats refreshTrigger={refreshKey} />
      </div>

      {/* High Priority: System Alerts */}
      <div className="mb-8">
         <AdminAlerts refreshTrigger={refreshKey} />
      </div>

      {/* Mid Level: Analytics & Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Sales Analytic Graph (Takes 2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-8">
          <SalesAnalyticsChart refreshTrigger={refreshKey} />
          <CustomDesignStatsChart refreshTrigger={refreshKey} />
        </div>

        {/* Details & Expiry Tracker (Takes 1 column on large screens) */}
        <div className="lg:col-span-1 space-y-8">
          
          <TopProducts refreshTrigger={refreshKey} />
          <RecentOrdersTable refreshTrigger={refreshKey} />
        </div>

      </div>

    </div>
  );
}

export default Dashboard;

