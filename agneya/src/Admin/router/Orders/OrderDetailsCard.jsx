import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import OrderActionsPanel from './OrderActionsPanel';
import OrderFulfillmentTracker from './OrderFulfillmentTracker';

const OrderDetailsCard = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/admin/orders/${id}`);
        if (response.data.success) {
          setOrder(response.data.data);
        } else {
          setError('Order not found or invalid response.');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please check connection.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrderDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex w-full min-h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm text-red-700">
          <p className="font-semibold text-lg">Error</p>
          <p className="mt-1">{error || "Order context invalid."}</p>
          <Link to="/admin/orders/list" className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-800 font-medium">
             &larr; Back to Orders List
          </Link>
        </div>
      </div>
    );
  }

  // Status Colors mapping
  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Processing: 'bg-blue-100 text-blue-800 border-blue-200',
    Printing: 'bg-purple-100 text-purple-800 border-purple-200',
    Shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    Delivered: 'bg-green-100 text-green-800 border-green-200',
    Cancelled: 'bg-red-100 text-red-800 border-red-200'
  };

  // Calculate generic total discount matching DB metrics iteratively if needed
  const totalDiscount = order.items.reduce((sum, item) => sum + (item.discountApplied || 0), 0);
  const subTotalAmount = order.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Back Navigation */}
      <div className="mb-6">
        <Link to="/admin/orders/list" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Orders
        </Link>
      </div>

      {/* Header Panel */}
      <div className="bg-white rounded-t-xl rounded-b-none shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            {order.orderId}
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border uppercase tracking-wider ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
              {order.orderStatus}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        
        {/* Action Panel Component */}
        <OrderActionsPanel 
           orderId={order._id} 
           currentStatus={order.orderStatus} 
           onStatusUpdate={(updatedOrderData) => setOrder(updatedOrderData)} 
        />
      </div>

      {/* Fulfillment Tracking Visualizer */}
      <div className="mt-6">
        <OrderFulfillmentTracker currentStatus={order.orderStatus} orderType={order.orderType} />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Left Column (Items List) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
              <span className={`text-xs font-semibold px-2 py-1 rounded border ${order.orderType === 'Mixed' ? 'bg-orange-50 text-orange-700 border-orange-200' : order.orderType === 'Custom' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                {order.orderType} Cart
              </span>
            </div>
            
            <ul className="divide-y divide-gray-200">
              {order.items.map((item, index) => (
                <li key={index} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            {item.image && (
                                <div className="w-12 h-12 bg-white rounded-md border border-gray-200 overflow-hidden flex-shrink-0 p-0.5">
                                    <img src={item.image} alt="Product" className="w-full h-full object-contain" />
                                </div>
                            )}
                            {item.itemType === 'Custom' && item.designImage && (
                                <div className="w-10 h-10 bg-gray-50 rounded-md border border-pink-200 overflow-hidden flex-shrink-0 relative -ml-3 z-10 shadow-sm">
                                    <img src={item.designImage} alt="Custom Details" className="w-full h-full object-cover mix-blend-multiply" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-base font-bold text-gray-900 leading-tight">{item.name}</h3>
                            <div className="flex items-center gap-2">
                                {item.itemType === 'Custom' && (
                                <span className="text-[10px] uppercase tracking-widest bg-pink-100 text-pink-700 border border-pink-200 px-1.5 py-0.5 rounded font-bold">
                                    Custom Run
                                </span>
                                )}
                                {item.selectedVariation?.size && (
                                <span className="text-[10px] uppercase font-semibold text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">
                                    Size: {item.selectedVariation.size}
                                </span>
                                )}
                            </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        ₹ {item.unitPrice.toLocaleString('en-IN')} × {item.quantity} qty
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-gray-900">₹ {(item.unitPrice * item.quantity).toLocaleString('en-IN')}</p>
                      {item.discountApplied > 0 && (
                        <p className="text-xs text-green-600 font-medium line-through">
                          - ₹ {item.discountApplied.toLocaleString('en-IN')} discount
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Custom Print Details Box */}
                  {item.itemType === 'Custom' && item.customData && (() => {
                    const isManualItem = (item.customData.mode === 'manual' || item.name?.includes('[MANUAL DESIGN REQUEST]') || item.name?.includes('[Manual Custom]'));
                    
                    return (
                      <div className={`mt-4 rounded-[40px] p-8 transition-all ${
                        isManualItem 
                        ? 'bg-indigo-50/70 border-2 border-indigo-200 shadow-2xl shadow-indigo-200/40' 
                        : 'bg-gray-50 border border-dashed border-gray-300'
                      }`}>
                         <h4 className="flex items-center justify-between text-[11px] font-black text-gray-900 mb-8 uppercase tracking-[0.3em] border-b border-gray-200/60 pb-5">
                            <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isManualItem ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                  {isManualItem ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                               </div>
                               {isManualItem ? 'Manual Design Request' : 'Client Custom Design'}
                            </div>
                            {isManualItem && (
                               <span className="px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black rounded-full shadow-lg shadow-indigo-200 uppercase tracking-widest">Manual Pipeline</span>
                            )}
                         </h4>

                        <div className="flex flex-col gap-10">
                          
                          {/* 1. PRIMARY: TEXT REQUIREMENTS (Top priority for Manual) */}
                          {isManualItem && item.customData.instructions && (
                             <div className="p-8 bg-white/80 backdrop-blur-md rounded-[32px] border-2 border-indigo-100 shadow-sm">
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                   Client Instructions
                                </p>
                                <p className="text-lg font-black text-indigo-950 leading-tight uppercase tracking-tight italic">
                                  {item.customData.instructions}
                                </p>
                             </div>
                          )}

                          {/* 2. SECONDARY: ASSET BROWSER */}
                          {isManualItem && item.customData.manualAttachments && item.customData.manualAttachments.length > 0 && (
                            <div className="space-y-6">
                               <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                 Provided Resource Files ({item.customData.manualAttachments.length})
                               </h5>
                               <div className="flex flex-wrap gap-5">
                                  {item.customData.manualAttachments.map((url, imgIdx) => (
                                   <div key={imgIdx} className="group relative">
                                       <a href={url} target="_blank" rel="noreferrer" className="block rounded-[32px] overflow-hidden border-4 border-white shadow-xl w-36 h-40 hover:scale-105 transition-all hover:-rotate-1">
                                         <img src={url} alt={`Attachment ${imgIdx + 1}`} className="object-cover w-full h-full" />
                                         <div className="absolute inset-0 bg-indigo-600/90 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all text-white p-2">
                                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            <span className="text-[9px] font-black uppercase tracking-widest">Full View</span>
                                         </div>
                                       </a>
                                       <a href={url} download target="_blank" rel="noreferrer" className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all scale-90 group-hover:scale-100">
                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                       </a>
                                   </div>
                                  ))}
                               </div>
                            </div>
                          )}

                          {/* 3. TERTIARY: STANDARD SPECS (Only for Studio context) */}
                          {!isManualItem && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                {item.customData.customText && (
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Text Graphic</span>
                                    <span className="text-base font-black text-gray-900 leading-none">"{item.customData.customText}"</span>
                                  </div>
                                )}
                                {(item.customData.font || item.customData.textColor) && (
                                  <div className="flex gap-6">
                                    {item.customData.font && (
                                      <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Font Family</span>
                                        <span className="text-sm font-bold text-gray-800">{item.customData.font}</span>
                                      </div>
                                    )}
                                    {item.customData.textColor && (
                                      <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ink Color</span>
                                        <div className="flex items-center gap-2">
                                          <div className="w-5 h-5 rounded-lg border border-gray-200 shadow-inner" style={{ backgroundColor: item.customData.textColor }}></div>
                                          <span className="text-sm font-bold text-gray-800 uppercase">{item.customData.textColor}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {item.customData.variantColor && (
                                  <div className="flex flex-col">
                                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Base Medium</span>
                                   <span className="text-sm font-bold text-gray-800">{item.customData.variantColor}</span>
                                 </div>
                                )}
                              </div>

                              {/* Studio Mockups (Hidden for Manual) */}
                              <div className="flex flex-col sm:items-end w-full gap-4">
                                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest sm:text-right w-full">3D Design Preview</span>
                                 <div className="flex gap-4">
                                   {item.customData.appliedFrontDesign && (
                                     <div className="flex flex-col items-center">
                                       <a href={item.customData.appliedFrontDesign} target="_blank" rel="noreferrer" className="group relative block rounded-2xl overflow-hidden border-4 border-white shadow-md w-24 h-28 hover:scale-105 transition-all">
                                         <img src={item.customData.appliedFrontDesign} alt="Front" className="object-cover w-full h-full" />
                                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">FRONT</div>
                                       </a>
                                     </div>
                                   )}
                                   {item.customData.appliedBackDesign && (
                                     <div className="flex flex-col items-center">
                                       <a href={item.customData.appliedBackDesign} target="_blank" rel="noreferrer" className="group relative block rounded-2xl overflow-hidden border-4 border-white shadow-md w-24 h-28 hover:scale-105 transition-all">
                                         <img src={item.customData.appliedBackDesign} alt="Back" className="object-cover w-full h-full" />
                                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">REAR</div>
                                       </a>
                                     </div>
                                   )}
                                 </div>
                              </div>
                            </div>
                          )}

                          {/* Fallback Artwork (Legacy) */}
                          {!isManualItem && item.customData.uploadedImageUrl && (
                            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Artwork Asset</span>
                               <a href={item.customData.uploadedImageUrl} target="_blank" rel="noreferrer" className="group rounded-xl overflow-hidden border-2 border-white w-14 h-14 hover:border-indigo-500 transition-colors shadow-lg">
                                 <img src={item.customData.uploadedImageUrl} alt="Artwork" className="object-cover w-full h-full" />
                               </a>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })()}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column (Customer Info & Summary) */}
        <div className="space-y-6">
          
          {/* Customer Profile Card */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Customer Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                 <div className="bg-blue-100 text-blue-600 rounded-full p-2 mt-0.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                 <div>
                   <p className="text-sm font-medium text-gray-900">{order.customer.name}</p>
                   <p className="text-sm text-gray-500">{order.customer.email}</p>
                   <p className="text-sm text-gray-500 mt-0.5">{order.customer.phone}</p>
                 </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex items-start gap-3">
                 <div className="bg-green-100 text-green-600 rounded-full p-2 mt-0.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                 <div>
                   <p className="text-sm font-medium text-gray-900">Shipping Address</p>
                   <p className="text-sm text-gray-600 mt-1 pb-1 leading-relaxed whitespace-pre-line">{order.customer.shippingAddress}</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Payment Summary Box */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
               <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Payment Summary</h2>
               {order.paymentStatus === 'Paid' ? (
                 <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">Paid in Full</span>
               ) : (
                 <span className="inline-flex rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800">{order.paymentStatus}</span>
               )}
             </div>
             <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({order.items.reduce((acc, curr) => acc + curr.quantity, 0)} items)</span>
                  <span>₹ {subTotalAmount.toLocaleString('en-IN')}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount Included</span>
                    <span>- ₹ {totalDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
                  <span>Shipping & Taxes</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200 mt-4">
                  <span>Total Amount</span>
                  <span>₹ {order.totalAmount.toLocaleString('en-IN')}</span>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetailsCard;
