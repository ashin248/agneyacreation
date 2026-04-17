import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CustomDesignStatsChart = () => {
  const [data, setData] = useState({ chartData: [], todayCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/dashboard/stats/custom-designs');
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError('Failed to load design stats');
        }
      } catch (err) {
        console.error('Design Stats Fetch Error:', err);
        setError('Connection error generating graph');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 h-80 flex items-center justify-center text-red-500 font-medium">
        {error}
      </div>
    );
  }

  const { chartData, todayCount, totalCount } = data;
  const maxCount = Math.max(...chartData.map(d => d.count), 5); 

  const statusColors = {
    'Pending': 'from-yellow-400 to-yellow-600',
    'Approved': 'from-blue-400 to-blue-600',
    'Rejected': 'from-red-400 to-red-600',
    'In Production': 'from-purple-400 to-purple-600',
    'Shipped': 'from-indigo-400 to-indigo-600',
    'Delivered': 'from-green-400 to-green-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Custom Design Pipeline</h2>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">Review Status Metrics</p>
        </div>
        <div className="flex gap-6">
           <div className="text-right">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Today New</p>
              <p className="text-xl font-black text-indigo-600">{todayCount}</p>
           </div>
           <div className="text-right border-l border-gray-100 pl-6">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Total Submissions</p>
              <p className="text-xl font-black text-gray-900">{totalCount}</p>
           </div>
        </div>
      </div>

      <div className="flex-1 flex items-end justify-around gap-2 mt-4 min-h-[160px]">
        {chartData.map((item, index) => {
          const barHeightPercentage = Math.max((item.count / maxCount) * 100, 2); 

          return (
            <div key={index} className="flex flex-col items-center w-full group relative">
              <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-gray-900 text-white text-[10px] font-black uppercase rounded py-1 px-2 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-lg">
                {item.count} Designs
                <div className="absolute top-full left-1/2 -mt-1 -ml-1 border-4 border-transparent border-t-gray-900"></div>
              </div>

              <div className="w-full max-w-[32px] bg-gray-50 rounded-t-sm flex items-end justify-center relative overflow-hidden transition-all duration-300 hover:bg-gray-100" style={{ height: '140px' }}>
                <div 
                  className={`w-full bg-gradient-to-t ${statusColors[item.name] || 'from-gray-400 to-gray-600'} rounded-t-sm shadow-lg transition-all duration-1000 ease-in-out`} 
                  style={{ height: `${barHeightPercentage}%` }}
                ></div>
              </div>

              <span className="text-[9px] font-black text-gray-400 mt-3 truncate w-full text-center uppercase tracking-tighter">
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomDesignStatsChart;

