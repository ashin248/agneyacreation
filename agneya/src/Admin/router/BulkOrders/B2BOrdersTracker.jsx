import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiSettings, FiActivity, FiDownload, FiBox, FiFileText } from 'react-icons/fi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const B2BOrdersTracker = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('/api/admin/bulk-orders/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data.data || []);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError(err.response?.data?.message || "Failed to load B2B orders.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);


    const handleStatusUpdate = async (id, newStatus) => {
        const originalOrders = [...orders];
        setOrders(orders.map(order => 
            order._id === id ? { ...order, orderStatus: newStatus } : order
        ));
        setUpdatingId(id);
        
        try {
            const token = localStorage.getItem('adminToken');
            // Standard order status update endpoint
            await axios.put(`/api/admin/orders/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMessage(`Order updated to ${newStatus}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Error updating status:", err);
            setOrders(originalOrders);
            setError(err.response?.data?.message || "Failed to update order status.");
        } finally {
            setUpdatingId(null);
        }
    };

    const downloadCSV = () => {
        if (orders.length === 0) return;
        
        const headers = ["Order ID", "Customer Name", "Phone", "Email", "Shipping Address", "Order Type", "Amount", "Status", "Date"];
        const csvContent = [
            headers.join(","),
            ...orders.map(order => {
                const addressStr = order.customer?.shippingAddress ? `"${order.customer.shippingAddress}"`.replace(/,/g, ' ') : "N/A";
                return [
                    order.orderId || order._id,
                    `"${order.companyName || order.customer?.name || 'N/A'}"`,
                    order.customer?.phone || 'N/A',
                    order.customer?.email || 'N/A',
                    addressStr,
                    order.orderType || 'Bulk',
                    order.totalAmount,
                    order.orderStatus,
                    order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'
                ].join(",");
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `B2B_Fleet_Report_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateInvoice = async (order) => {
        try {
            setUpdatingId("INV_" + order._id);
            const doc = new jsPDF();
            const origOrder = order.originalOrder;
            
            // Agneya Seller Details (Placeholder per user request)
            const sellerName = "Agneya Creations";
            const sellerAddress = "Agneya Creations\nSector 4, Kochi\nKerala 682001, India";
            const sellerGSTIN = "32XXXXX1234X1Z1"; 
            
            // Header
            doc.setFontSize(22);
            doc.text("TAX INVOICE", 105, 20, { align: "center" });
            
            doc.setFontSize(10);
            doc.text("Seller:", 14, 30);
            doc.setFont(undefined, 'bold');
            doc.text(sellerName, 14, 35);
            doc.setFont(undefined, 'normal');
            doc.text(doc.splitTextToSize(sellerAddress, 70), 14, 40);
            doc.text(`GSTIN: ${sellerGSTIN}`, 14, 55);
            
            // Buyer Details
            doc.text("Bill To:", 120, 30);
            doc.setFont(undefined, 'bold');
            doc.text(order.companyName, 120, 35);
            doc.setFont(undefined, 'normal');
            const buyerAddress = doc.splitTextToSize(origOrder?.customer?.shippingAddress || 'N/A', 70);
            doc.text(buyerAddress, 120, 40);
            if (origOrder?.gstDetails?.gstNumber) {
                doc.text(`GSTIN: ${origOrder.gstDetails.gstNumber}`, 120, 40 + (buyerAddress.length * 5));
            }
            
            // Meta Info
            doc.text(`Invoice No: INV-${order.orderId}`, 14, 70);
            doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}`, 14, 75);
            
            // Determine GST type based on buyer GSTIN (Kerala starts with 32)
            const isIntraState = origOrder?.gstDetails?.gstNumber ? origOrder.gstDetails.gstNumber.startsWith('32') : true;
            
            // Table items preparation
            const tableColumn = ["Item", "Qty", "Unit Price", "Taxable Amt", "GST Rate", isIntraState ? "CGST + SGST" : "IGST", "Total Amt"];
            const tableRows = [];
            
            let totalTaxableAmount = 0;
            let totalTaxAmount = 0;
            let grandTotalAmt = 0;

            if (origOrder && origOrder.items) {
                for (const item of origOrder.items) {
                    // Try to fetch dynamic gstRate from Product Data if available
                    let dynamicGstRate = 18; // Default
                    try {
                        const prodRes = await axios.get(`/api/public/products/${item.productId}`);
                        if (prodRes.data && prodRes.data.gstRate) {
                            dynamicGstRate = prodRes.data.gstRate;
                        }
                    } catch (e) {
                         // silently fallback to 18% if product is deleted
                    }

                    const qty = item.quantity || 1;
                    const finalUnitPrice = item.unitPrice || 0; // Total per unit paid by customer
                    
                    // Assuming the unitPrice includes GST on the storefront.
                    // Taxable Value = Price / (1 + (gstRate/100))
                    const valPerUnit = finalUnitPrice / (1 + (dynamicGstRate / 100));
                    const taxableAmt = (valPerUnit * qty);
                    const itemTax = (finalUnitPrice * qty) - taxableAmt;
                    const totalAmt = finalUnitPrice * qty;

                    tableRows.push([
                        item.name.substring(0, 30) + (item.name.length > 30 ? "..." : ""),
                        qty,
                        `Rs ${valPerUnit.toFixed(2)}`,
                        `Rs ${taxableAmt.toFixed(2)}`,
                        `${dynamicGstRate}%`,
                        `Rs ${itemTax.toFixed(2)}`,
                        `Rs ${totalAmt.toFixed(2)}`
                    ]);

                    totalTaxableAmount += taxableAmt;
                    totalTaxAmount += itemTax;
                    grandTotalAmt += totalAmt;
                }
            }

            // AutoTable
            doc.autoTable({
                startY: 85,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [79, 70, 229] } // Indigo 600
            });

            const finalY = doc.lastAutoTable.finalY + 10;
            
            doc.text(`Total Taxable Amount: Rs ${totalTaxableAmount.toFixed(2)}`, 120, finalY);
            if (isIntraState) {
                doc.text(`Total CGST: Rs ${(totalTaxAmount / 2).toFixed(2)}`, 120, finalY + 5);
                doc.text(`Total SGST: Rs ${(totalTaxAmount / 2).toFixed(2)}`, 120, finalY + 10);
            } else {
                doc.text(`Total IGST: Rs ${totalTaxAmount.toFixed(2)}`, 120, finalY + 5);
            }
            doc.setFont(undefined, 'bold');
            doc.text(`Grand Total: Rs ${grandTotalAmt.toFixed(2)}`, 120, finalY + 20);
            
            // Footer
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            doc.text("Computer Generated Invoice - No signature required.", 105, 280, { align: "center" });
            
            doc.save(`Invoice_${order.orderId}.pdf`);
            setSuccessMessage("Invoice downloaded.");
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Error generating invoice:", error);
            setError("Failed to generate PDF Invoice.");
        } finally {
            setUpdatingId(null);
        }
    };

    const stages = ['Pending', 'Processing', 'Printing', 'Shipped', 'Delivered'];

    const getStatusIndex = (currentStatus) => {
        return stages.indexOf(currentStatus);
    };

    const StatusProgressBar = ({ status }) => {
        const currentIndex = getStatusIndex(status);

        return (
            <div className="w-full mt-6">
                <div className="flex justify-between mb-2 relative px-2">
                    {/* Background track */}
                    <div className="absolute top-1/2 left-0 w-full h-[3px] bg-slate-100 -translate-y-1/2 z-0 rounded-full"></div>
                    {/* Active progress track */}
                    <div 
                        className="absolute top-1/2 left-0 h-[3px] bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-1000 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]" 
                        style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
                    ></div>
                    
                    {stages.map((stage, idx) => {
                        const isCompleted = idx <= currentIndex;
                        const isCurrent = idx === currentIndex;
                        
                        let Icon = FiClock;
                        if(idx === 1) Icon = FiActivity;
                        if(idx === 2) Icon = FiBox;
                        if(idx === 3) Icon = FiTruck;
                        if(idx === 4) Icon = FiCheckCircle;

                        return (
                            <div key={stage} className={`relative z-10 flex flex-col items-center group`}>
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-700 border-2 
                                    ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white border-slate-100 text-slate-300'}
                                    ${isCurrent ? 'scale-125 rotate-[360deg] ring-4 ring-indigo-50 border-indigo-600' : ''}
                                `}>
                                    <Icon size={14} className={isCurrent && idx !== 4 ? 'animate-pulse' : ''} />
                                </div>
                                <span className={`absolute top-14 text-[8px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-500
                                    ${isCurrent ? 'text-indigo-600 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}
                                `}>
                                    {stage}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden">
            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-indigo-50/40 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-slate-100/50 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-7xl mx-auto py-16 px-6 relative z-10">
                
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-16 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-px w-12 bg-indigo-600"></div>
                            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.5em]">Logistics Intelligence Matrix</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Fleet <span className="text-indigo-600">Ops</span></h1>
                        <p className="text-lg text-slate-400 font-bold max-w-lg leading-relaxed">
                            Synchronization of high-volume manufacturing pulses and global shipping trajectories.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        <button 
                            onClick={downloadCSV}
                            disabled={orders.length === 0}
                            className="bg-slate-900 text-white px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl hover:bg-indigo-600 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-20"
                        >
                            <FiDownload className="text-indigo-400" />
                            Export Fleet Logs
                        </button>
                    </div>
                </div>

                {successMessage && (
                    <div className="mb-10 bg-emerald-500 text-white px-8 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/30 flex items-center gap-4 animate-in slide-in-from-top duration-500">
                        <FiCheckCircle size={20} />
                        Identity Updated: {successMessage}
                    </div>
                )}

                {/* ACTIVE FLEET GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {loading ? (
                        [1,2,3,4].map(n => (
                            <div key={n} className="h-96 bg-white/40 backdrop-blur-3xl rounded-[48px] border border-white animate-pulse"></div>
                        ))
                    ) : orders.length === 0 ? (
                        <div className="col-span-full py-40 flex flex-col items-center justify-center bg-white/40 backdrop-blur-3xl rounded-[64px] border border-white shadow-xl">
                            <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center mb-8">
                                <FiBox size={40} className="text-slate-300 stroke-1" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Fleet Standby</h2>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest text-center max-w-xs">No high-volume manufacturing cycles detected in current matrix.</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order._id} className="bg-white/60 backdrop-blur-3xl rounded-[56px] border border-white p-10 shadow-[0_40px_100px_rgba(0,0,0,0.06)] hover:shadow-[0_60px_120px_rgba(79,70,229,0.1)] transition-all duration-700 group hover:-translate-y-2 relative overflow-hidden">
                                {/* Gradient Orb */}
                                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-indigo-100/60 transition-colors"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="space-y-4">
                                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
                                                <FiPackage /> {order.orderId}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight group-hover:text-indigo-600 transition-colors">
                                                    {order.companyName}
                                                </h3>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                                                    Contract: <span className="text-slate-600">
                                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : 'NOT SYNCED'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Valuation</p>
                                            <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{order.totalAmount?.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Lifecycle Chart */}
                                    <div className="bg-white/80 p-8 rounded-[40px] border border-slate-50 shadow-inner mb-10 group-hover:bg-white transition-all duration-700">
                                        <div className="flex items-center justify-between mb-8">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Lifecycle Matrix</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
                                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest italic">{order.orderStatus}</span>
                                            </div>
                                        </div>
                                        <StatusProgressBar status={order.orderStatus} />
                                    </div>

                                    {/* Action Hub */}
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-10 border-t border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
                                                <FiSettings size={14} className="group-hover:rotate-180 transition-transform duration-1000" />
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Node Modulation</p>
                                        </div>
                                        
                                        <div className="relative group/sel w-full lg:w-64">
                                            <select 
                                                value={order.orderStatus}
                                                onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                disabled={updatingId === order._id || order.orderStatus === 'Delivered'}
                                                className="w-full appearance-none bg-white border border-slate-200 rounded-[24px] px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer shadow-sm disabled:opacity-50 hover:border-indigo-400"
                                            >
                                                {stages.map(stage => (
                                                    <option key={stage} value={stage}>{stage.toUpperCase()}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 transition-transform group-hover/sel:scale-125">
                                                <FiActivity size={16} />
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => generateInvoice(order)}
                                            disabled={updatingId === "INV_" + order._id}
                                            className="px-6 py-4 bg-slate-100 rounded-2xl text-slate-700 hover:bg-indigo-600 hover:text-white transition-all font-black text-[11px] uppercase tracking-widest shadow-sm flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {(updatingId === "INV_" + order._id) ? <FiActivity className="animate-spin" /> : <FiFileText size={16} />} 
                                            Invoice
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default B2BOrdersTracker;

