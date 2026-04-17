import React, { useState } from 'react';
import axios from 'axios';

const OrderActionsPanel = ({ orderId, currentStatus, onStatusUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [statusInput, setStatusInput] = useState(currentStatus);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatusInput(newStatus);
    
    // Only trigger update if it inherently changed
    if (newStatus === currentStatus) return;

    try {
      setLoading(true);
      const response = await axios.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      
      if (response.data.success) {
        // Bubble up correctly overwritten Order object natively bypassing secondary network hits
        onStatusUpdate(response.data.data);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status. Please verify networking.');
      // Revert select back to genuine state tracking if network fails
      setStatusInput(currentStatus);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0 print:hidden">
      
      {/* Status Update Controller */}
      <div className="relative w-full sm:w-auto">
        <select 
          disabled={loading}
          value={statusInput}
          onChange={handleStatusChange}
          className={`block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border bg-white font-medium text-gray-800 transition-opacity ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        >
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Printing">Printing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        
        {/* Absolute nested loading micro-spinner */}
        {loading && (
           <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
           </div>
        )}
      </div>

      {/* Quick Action: Mark Delivered */}
      {currentStatus !== 'Delivered' && currentStatus !== 'Cancelled' && (
        <button 
          disabled={loading}
          onClick={() => handleStatusChange({ target: { value: 'Delivered' } })}
          className={`inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-md shadow-lg shadow-emerald-500/20 transition-all text-sm whitespace-nowrap w-full sm:w-auto active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          Mark Delivered
        </button>
      )}

      {/* Invoice Generator Button */}
      <button 
        onClick={handlePrint}
        className="inline-flex items-center justify-center bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors text-sm whitespace-nowrap w-full sm:w-auto"
      >
        <svg className="w-4 h-4 mr-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
        Print Invoice
      </button>

    </div>
  );
};

export default OrderActionsPanel;

