import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CustomOrders = () => {
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDesign, setSelectedDesign] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchDesigns();
    }, []);

    const fetchDesigns = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/admin/custom-designs');
            if (res.data.success) {
                setDesigns(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching custom designs:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            setIsUpdating(true);
            const res = await axios.patch(`/api/admin/custom-designs/${id}/status`, { status: newStatus });
            if (res.data.success) {
                alert(`Status successfully updated to ${newStatus}`);
                fetchDesigns(); // Refresh the list
                if (selectedDesign && selectedDesign._id === id) {
                    setSelectedDesign({ ...selectedDesign, status: newStatus });
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDownload = (imageUrl) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `Custom_Design_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Custom Orders</h1>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Customer</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Contact</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Product</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Qty</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Status</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 tracking-widest uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-sm font-medium text-gray-500">Loading custom orders...</td>
                            </tr>
                        ) : designs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-sm font-medium text-gray-500">No custom orders found.</td>
                            </tr>
                        ) : (
                            designs.map(design => (
                                <tr key={design._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-sm text-gray-900">{design.name}</div>
                                        <div className="text-xs font-semibold text-gray-400">{new Date(design.createdAt).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-sm text-gray-800">{design.phone}</div>
                                        <div className="text-xs text-gray-500">{design.email}</div>
                                    </td>
                                    <td className="p-4 text-sm font-semibold text-gray-800">{design.productType}</td>
                                    <td className="p-4 text-sm font-black text-gray-700">{design.quantity}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${
                                            design.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                                            design.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                                            design.status === 'In Production' ? 'bg-purple-100 text-purple-700' :
                                            design.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                            design.status === 'Shipped' ? 'bg-indigo-100 text-indigo-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {design.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex items-center justify-end gap-2">
                                        {design.status !== 'Delivered' && design.status !== 'Rejected' && (
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm("Mark this custom order as Delivered?")) {
                                                        updateStatus(design._id, 'Delivered');
                                                    }
                                                }}
                                                className="p-2 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
                                                title="Quick Deliver"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setSelectedDesign(design)}
                                            className="px-4 py-2 bg-indigo-600 text-white text-[10px] uppercase tracking-wider font-black rounded-lg shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-95"
                                        >
                                            View Design
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Design Review Modal */}
            {selectedDesign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                            <h2 className="text-xl font-black tracking-tight text-gray-900">Review Custom Order</h2>
                            <button onClick={() => setSelectedDesign(null)} className="p-2 bg-gray-200 rounded-full text-gray-500 hover:bg-gray-300 hover:text-gray-900 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="flex gap-8 flex-col-reverse md:flex-row">
                                <div className="flex-1 space-y-5">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Customer Details</p>
                                        <p className="text-sm font-bold text-gray-900">{selectedDesign.name}</p>
                                        <p className="text-xs font-semibold text-gray-500">{selectedDesign.phone} • {selectedDesign.email}</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Order Information</p>
                                        <p className="text-sm font-bold text-gray-900">{selectedDesign.productType} (x{selectedDesign.quantity})</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Delivery Address</p>
                                        <p className="text-sm font-semibold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">
                                            {selectedDesign.address || 'Address not provided'}
                                        </p>
                                    </div>

                                    {selectedDesign.description && (
                                        <div>
                                            <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mb-1">Special Instructions</p>
                                            <div className="mt-1 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-semibold text-indigo-900">
                                                {selectedDesign.description}
                                            </div>
                                        </div>
                                    )}

                                    {/* Raw Assets Section - Moved here */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                         <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-3">Customer's Uploaded Images (For Print)</p>
                                         {selectedDesign.printAssets && selectedDesign.printAssets.length > 0 ? (
                                             <div className="grid grid-cols-2 gap-3">
                                                 {selectedDesign.printAssets.map((asset, idx) => (
                                                     <div key={idx} className="relative group bg-gray-50 border border-gray-100 rounded-xl p-2 flex flex-col items-center">
                                                         <img src={asset} alt={`Asset ${idx}`} className="h-16 w-auto object-contain mb-2" />
                                                         <button 
                                                             onClick={() => handleDownload(asset)}
                                                             className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800"
                                                         >
                                                             Download Asset
                                                         </button>
                                                     </div>
                                                 ))}
                                             </div>
                                         ) : (
                                             <p className="text-xs font-semibold text-gray-400 italic">No raw assets uploaded</p>
                                         )}
                                     </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2 text-center md:text-left">Design Mockup</p>
                                    {(selectedDesign.appliedFrontDesign || selectedDesign.appliedBackDesign) ? (
                                        <div className="space-y-4">
                                            {selectedDesign.appliedFrontDesign && (
                                                <div className="border-[6px] border-gray-50 rounded-2xl overflow-hidden bg-white shadow-inner relative group">
                                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 text-center">Front View</p>
                                                    <img src={selectedDesign.appliedFrontDesign} alt="Front Design" className="w-full h-auto object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleDownload(selectedDesign.appliedFrontDesign)}
                                                            className="bg-white text-gray-900 px-6 py-2 rounded-xl text-sm font-black shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                                                        >
                                                            Download Front
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedDesign.appliedBackDesign && (
                                                <div className="border-[6px] border-gray-50 rounded-2xl overflow-hidden bg-white shadow-inner relative group">
                                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 text-center">Back View</p>
                                                    <img src={selectedDesign.appliedBackDesign} alt="Back Design" className="w-full h-auto object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleDownload(selectedDesign.appliedBackDesign)}
                                                            className="bg-white text-gray-900 px-6 py-2 rounded-xl text-sm font-black shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                                                        >
                                                            Download Back
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : selectedDesign.designImage ? (
                                        <div className="border-[6px] border-gray-50 rounded-2xl overflow-hidden bg-white shadow-inner relative group">
                                            <img src={selectedDesign.designImage} alt="User Design" className="w-full h-auto object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button
                                                     onClick={() => handleDownload(selectedDesign.designImage)}
                                                     className="bg-white text-gray-900 px-6 py-2 rounded-xl text-sm font-black shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                                                  >
                                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                     Download Full Mockup
                                                  </button>
                                            </div>
                                         </div>
                                     ) : (
                                         <div className="h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 font-medium bg-gray-50 gap-2">
                                             <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                             <span className="text-xs font-bold">No image attached</span>
                                         </div>
                                     )}

                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Update Status</label>
                                <select 
                                    className={`border bg-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                                        selectedDesign.status === 'Completed' ? 'border-green-200 text-green-700' : 'border-gray-200 text-gray-800'
                                    }`}
                                    value={selectedDesign.status}
                                    onChange={(e) => updateStatus(selectedDesign._id, e.target.value)}
                                    disabled={isUpdating}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="In Production">In Production</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                </select>
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setSelectedDesign(null)}
                                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-black shadow-sm hover:bg-gray-50 transition-colors uppercase tracking-wider"
                                >
                                    Close
                                </button>
                                {selectedDesign.designImage && (
                                    <button 
                                        onClick={() => handleDownload(selectedDesign.designImage)}
                                        className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black shadow-xl shadow-gray-200 hover:bg-black transition-colors uppercase tracking-wider flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomOrders;

