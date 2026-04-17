import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/dashboard/alerts');
        if (response.data.success) {
          setAlerts(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching alerts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-16 bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse"></div>
    );
  }

  // Visual Context Map
  const styleMap = {
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      iconText: 'text-yellow-600',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
      hover: 'hover:bg-yellow-100/70',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      )
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconText: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-700',
      hover: 'hover:bg-blue-100/70',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )
    },
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconText: 'text-red-500',
      title: 'text-red-800',
      message: 'text-red-700',
      hover: 'hover:bg-red-100/70',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center shadow-sm">
        <span className="text-xl mr-3">🎉</span>
        <div>
           <h3 className="text-green-800 font-bold text-sm">All caught up!</h3>
           <p className="text-green-700 text-xs mt-0.5 font-medium">No new system alerts to show. Your platform is operating efficiently.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((alert) => {
        const theme = styleMap[alert.type] || styleMap.info;
        
        return (
          <Link 
            key={alert.id} 
            to={alert.link} 
            className={`block rounded-xl border p-4 shadow-sm transition-colors duration-200 ${theme.bg} ${theme.border} ${theme.hover} group`}
          >
            <div className="flex items-start">
              <div className={`flex-shrink-0 mt-0.5 ${theme.iconText}`}>
                {theme.icon}
              </div>
              <div className="ml-3 w-0 flex-1 flex justify-between items-center">
                <div>
                  <h3 className={`text-sm font-bold ${theme.title}`}>{alert.title}</h3>
                  <p className={`mt-1 text-sm font-medium ${theme.message}`}>{alert.message}</p>
                </div>
                <div className={`ml-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${theme.iconText}`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default AdminAlerts;

