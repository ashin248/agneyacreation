import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiUsers, FiClock } from 'react-icons/fi';

const UserListTable = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/customers', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.data.success) {
        setCustomers(response.data.data);
      } else {
        setError('Failed to fetch user directory.');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Connection error rendering users.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockStatus = async (userId, currentStatus) => {
    if (actionLoadingId === userId) return;

    if (!currentStatus && !window.confirm('Are you sure you want to block this user?')) {
        return;
    }

    try {
      setActionLoadingId(userId);
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`/api/admin/customers/${userId}/block`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.data.success) {
        setCustomers(prevCustomers => 
            prevCustomers.map(user => 
                user._id === userId ? { ...user, isBlocked: !currentStatus } : user
            )
        );
      }
    } catch (err) {
      console.error('Error toggling block status:', err);
      alert('Security update failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const StatusBadge = ({ isBlocked }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
      isBlocked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
    }`}>
      {isBlocked ? (
        <><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>Blocked</>
      ) : (
        <><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>Active</>
      )}
    </span>
  );

  return (
    <div className="min-h-[80vh] bg-transparent text-gray-800 font-sans">
      {/* Header Area */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             User Directory
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Managing identity access and security credentials across the ecosystem</p>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-[13px] font-bold">
            {error}
        </div>
      )}

      {/* Main Registry Container */}
      <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl relative overflow-hidden border-gray-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

        <div className="overflow-x-auto relative z-10 min-h-[500px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-80 gap-3">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanning Registry...</p>
             </div>
          ) : customers.length === 0 ? (
            <div className="text-center p-12 flex flex-col items-center justify-center h-80 text-gray-400">
              <div className="w-20 h-20 bg-gray-50 rounded-[30px] flex items-center justify-center mb-6">
                <FiUsers size={32} className="opacity-20" />
              </div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Registry Initialized</h3>
              <p className="mt-2 text-sm font-medium opacity-60">No user profiles currently indexed in the directory.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] uppercase tracking-[0.2em] text-gray-400 bg-white/50 backdrop-blur-md sticky top-0 z-20">
                  <th className="font-black p-6 pl-10 whitespace-nowrap">Identity Profile</th>
                  <th className="font-black p-6">Communication</th>
                  <th className="font-black p-6">Onboarding</th>
                  <th className="font-black p-6 text-center">Security</th>
                  <th className="font-black p-6 pr-10 text-right">Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((user) => (
                  <tr key={user._id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="p-6 pl-10 whitespace-nowrap">
                      <Link to={`/admin/gst-manager/profile/${user._id}`} className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm border shadow-sm transition-all group-hover:scale-110 ${
                          user.isBlocked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`text-[16px] font-black tracking-tight ${user.isBlocked ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-blue-600 transition-colors'}`}>
                            {user.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ID: ...{user._id.slice(-6)}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="p-6">
                      <p className="text-[14px] font-black text-gray-900 tracking-tight">{user.email}</p>
                      <p className="text-[11px] text-gray-400 font-bold mt-1 tracking-widest">{user.phone || 'NO COORDS'}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 w-fit px-2.5 py-1 rounded-lg">
                        <FiClock size={12} />
                        {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <StatusBadge isBlocked={user.isBlocked} />
                    </td>
                    <td className="p-6 pr-10 text-right">
                       <button 
                         onClick={() => toggleBlockStatus(user._id, user.isBlocked)}
                         disabled={actionLoadingId === user._id}
                         className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                           user.isBlocked 
                             ? 'bg-blue-600 text-white hover:bg-blue-500' 
                             : 'bg-white border border-red-100 text-red-500 hover:bg-red-50'
                         } ${actionLoadingId === user._id ? 'opacity-50' : ''}`}
                       >
                         {actionLoadingId === user._id ? (
                           'Syncing...'
                         ) : user.isBlocked ? (
                           <>Restore Access</>
                         ) : (
                           <>Revoke Access</>
                         )}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListTable;

