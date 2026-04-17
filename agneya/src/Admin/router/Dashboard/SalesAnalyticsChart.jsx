import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SalesAnalyticsChart = () => {
  const [data, setData] = useState({ chartData: [], todayRevenue: 0, allTimeRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/orders/analytics');
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError('Failed to load chart data');
        }
      } catch (err) {
        console.error('Analytics Fetch Error:', err);
        setError('Connection error generating graph');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
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

  const { chartData, todayRevenue, allTimeRevenue } = data;
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 100);
  
  // SVG Config
  const width = 600;
  const height = 200;
  const padding = 20;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Generate path points
  const points = chartData.map((d, i) => ({
    x: padding + (i * (graphWidth / (chartData.length - 1))),
    y: height - padding - ((d.revenue / maxRevenue) * graphHeight)
  }));

  // Create SVG path string (Simple Polyline for now, or could use Curves)
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 flex flex-col h-full hover:shadow-xl hover:shadow-gray-100 transition-all duration-500">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <h2 className="text-xl font-black text-[#2D3436] tracking-tighter uppercase">Revenue Analytics</h2>
           <p className="text-[10px] text-[#FF6B2C] font-black uppercase tracking-[0.2em] mt-1">7-Day Performance Stream</p>
        </div>
        <div className="flex gap-10">
           <div className="text-right">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Today</p>
              <p className="text-2xl font-black text-[#FF6B2C]">₹{todayRevenue.toLocaleString('en-IN')}</p>
           </div>
           <div className="text-right border-l border-gray-100 pl-10">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Total</p>
              <p className="text-2xl font-black text-[#2D3436]">₹{allTimeRevenue.toLocaleString('en-IN')}</p>
           </div>
        </div>
      </div>

      {/* SVG Line Graph */}
      <div className="flex-1 w-full relative group mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B2C" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FF6B2C" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
             <line 
                key={i} 
                x1={padding} 
                y1={padding + (p * graphHeight)} 
                x2={width - padding} 
                y2={padding + (p * graphHeight)} 
                stroke="#F3F4F6" 
                strokeWidth="1"
             />
          ))}

          {/* Area under the line */}
          <path d={areaPath} fill="url(#lineGradient)" className="transition-all duration-1000" />

          {/* Main Line */}
          <path 
            d={linePath} 
            fill="none" 
            stroke="#FF6B2C" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="drop-shadow-[0_4px_8px_rgba(255,107,44,0.3)]"
          />

          {/* Points */}
          {points.map((p, i) => (
            <g key={i} className="cursor-pointer group/dot">
               <circle 
                  cx={p.x} cy={p.y} r="5" 
                  fill="#FF6B2C" 
                  className="transition-all group-hover/dot:r-8"
               />
               <circle 
                  cx={p.x} cy={p.y} r="12" 
                  fill="#FF6B2C" 
                  fillOpacity="0" 
                  className="group-hover/dot:fill-opacity-10"
               />
               
               {/* Tooltip on Hover */}
               <foreignObject x={p.x - 50} y={p.y - 60} width="100" height="50" className="opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-[#2D3436] text-white text-[9px] font-black rounded-lg py-2 px-3 text-center shadow-xl">
                    ₹{chartData[i].revenue.toLocaleString('en-IN')}
                    <div className="w-2 h-2 bg-[#2D3436] rotate-45 mx-auto -mb-1 mt-1"></div>
                  </div>
               </foreignObject>
            </g>
          ))}
        </svg>
      </div>

      {/* X-Axis Labels */}
      <div className="flex justify-between px-5 mt-6 border-t border-gray-50 pt-6">
          {chartData.map((item, idx) => (
            <span key={idx} className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">
              {item.displayDate}
            </span>
          ))}
      </div>
    </div>
  );
};

export default SalesAnalyticsChart;

