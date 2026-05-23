import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import OrderActionsPanel from './OrderActionsPanel';
import OrderFulfillmentTracker from './OrderFulfillmentTracker';
import PhoneCoverPreview from '../../Client/components/PhoneCoverPreview';

const Workspace3D = React.lazy(() => import('../../Client/components/Studio/components/Workspace3D'));

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
           isDesignAssistance={order.items.some(i => i.customData?.designSource === 'DESIGN_ASSISTANCE' || i.customData?.mode === 'manual' || i.name?.includes('[Manual Custom]'))}
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
              {order.items.map((item, index) => {
                const isCustom = item.itemType === 'Custom' && item.customData;
                const displayImage = item.customData?.productImage || item.image || 'https://placehold.co/150x150/f1f5f9/a2a9b1?text=Image';
                const cleanName = item.customData?.productName || item.name.replace(/^\[Custom\]\s*/, '');
                
                return (
                  <li key={index} className="p-6">
                    <div className="flex flex-col gap-4 p-5 bg-white border border-gray-200 shadow-sm rounded-2xl">
                      {/* 1. Product (Image & Name) */}
                      <div className="flex gap-4 items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 p-1 border border-gray-200">
                            <PhoneCoverPreview
                               phoneMask={item.customData?.phoneMask}
                               designImage={item.image}
                               productImage={displayImage}
                               className="w-full h-full object-contain"
                             />
                          </div>
                          <div className="flex flex-col">
                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">1. Product</div>
                            <h3 className="text-base font-bold text-gray-900 leading-tight">{cleanName}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                {(() => {
                                   if (item.customData?.designSource === 'DESIGN_ASSISTANCE' || item.customData?.mode === 'manual' || item.name?.includes('[Manual Custom]')) {
                                       return <span className="text-[10px] uppercase tracking-widest bg-indigo-100 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-bold">Design Assistance</span>;
                                   } else if (item.customData?.designSource === '3D_STUDIO') {
                                       return <span className="text-[10px] uppercase tracking-widest bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 px-1.5 py-0.5 rounded font-bold">3D Studio Custom</span>;
                                   } else if (item.customData?.designSource === '2D_STUDIO') {
                                       return <span className="text-[10px] uppercase tracking-widest bg-pink-100 text-pink-700 border border-pink-200 px-1.5 py-0.5 rounded font-bold">2D Studio Custom</span>;
                                   } else if (item.itemType === 'Custom') {
                                       return <span className="text-[10px] uppercase tracking-widest bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-bold">Legacy Custom</span>;
                                   } else {
                                       return <span className="text-[10px] uppercase tracking-widest bg-gray-100 text-gray-700 border border-gray-200 px-1.5 py-0.5 rounded font-bold">Normal Order</span>;
                                   }
                                })()}
                                {item.customData?.variationName && (
                                  <span className="text-[10px] uppercase font-semibold text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">
                                      {item.customData.variationName}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold text-gray-900">₹ {(item.unitPrice * item.quantity).toLocaleString('en-IN')}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Qty {item.quantity}</p>
                          {item.discountApplied > 0 && (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              - ₹ {item.discountApplied.toLocaleString('en-IN')} saved
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Custom Details Section */}
                      {isCustom && (
                        <div className="mt-2 pt-4 border-t border-gray-200 space-y-6">
                          
                          {/* 2. Customise Design [Main Model and Support Model] */}
                          <div className="space-y-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center justify-between">
                              <span>2. Customise Design</span>
                              <span className="text-[9px] text-gray-500 uppercase tracking-tighter">
                                {item.customData.designSource === 'DESIGN_ASSISTANCE' ? 'Design Assistance' : item.customData.designSource === '3D_STUDIO' ? '3D Studio' : '2D Studio'}
                              </span>
                            </div>
                            
                            {item.customData.designSource === '3D_STUDIO' ? (
                              <div className="w-full aspect-square max-h-[400px] rounded-2xl overflow-hidden relative bg-gray-50 border border-gray-200 flex items-center justify-center group/3d shadow-inner">
                                <React.Suspense fallback={<div className="text-xs font-bold text-gray-400 animate-pulse">Loading 3D Engine...</div>}>
                                  <Workspace3D 
                                    product={{ 
                                      baseModelId: item.customData.baseModelId, 
                                      model3d: item.customData.model3d, 
                                      base3DModelUrl: item.customData.model3d, 
                                      category: item.customData.category, 
                                      printableMeshes: item.customData.printableMeshes, 
                                      projectionType: item.customData.projectionType 
                                    }} 
                                    objectAnchors={item.customData.objectAnchors || {}} 
                                    canvasObjects={item.customData.canvasObjects || []} 
                                    activeStudioTab="3D_STUDIO" 
                                  />
                                </React.Suspense>
                                <div className="absolute bottom-3 right-3 bg-gray-900/80 text-white text-[9px] font-black px-3 py-1.5 rounded-lg pointer-events-none uppercase tracking-widest backdrop-blur-md shadow-lg z-20">360° Interactive Preview</div>
                              </div>
                            ) : item.customData?.customizedDesigns?.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {item.customData.customizedDesigns.map((cd, cdIdx) => (
                                  <div key={cdIdx} className="bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-2 border border-gray-200 hover:shadow-md transition-all">
                                    <a href={cd.url} target="_blank" rel="noreferrer" className="w-full aspect-square rounded-lg overflow-hidden block bg-white border border-gray-200">
                                      <PhoneCoverPreview
                                        phoneMask={item.customData?.phoneMask}
                                        designImage={cd.url}
                                        className="w-full h-full object-contain hover:scale-110 transition-transform"
                                      />
                                    </a>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center truncate w-full">{cd.label}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex gap-4">
                                {item.customData.appliedFrontDesign && (
                                  <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-2 w-32 border border-gray-200 hover:shadow-md transition-all">
                                    <a href={item.customData.appliedFrontDesign} target="_blank" rel="noreferrer" className="w-full aspect-square rounded-lg overflow-hidden block bg-white border border-gray-200">
                                      <PhoneCoverPreview
                                        phoneMask={item.customData?.phoneMask}
                                        designImage={item.customData.appliedFrontDesign}
                                        className="w-full h-full object-contain"
                                      />
                                    </a>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center truncate w-full">Front Design</span>
                                  </div>
                                )}
                                {item.customData.appliedBackDesign && (
                                  <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-2 w-32 border border-gray-200 hover:shadow-md transition-all">
                                    <a href={item.customData.appliedBackDesign} target="_blank" rel="noreferrer" className="w-full aspect-square rounded-lg overflow-hidden block bg-white border border-gray-200">
                                      <PhoneCoverPreview
                                        phoneMask={item.customData?.phoneMask}
                                        designImage={item.customData.appliedBackDesign}
                                        className="w-full h-full object-contain"
                                      />
                                    </a>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center truncate w-full">Back Design</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {item.customData?.instructions && (
                              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mt-4">
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block mb-2">Instructions / Brief:</span>
                                <p className="text-sm font-bold italic leading-snug text-indigo-900">"{item.customData.instructions}"</p>
                              </div>
                            )}
                          </div>

                          {/* 3. Sizes & 4. Color in a neat grid */}
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-center">
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1.5">3. Sizes</span>
                              <span className="text-sm font-black uppercase tracking-tight text-gray-900">
                                {item.customData?.selectedSize || item.selectedVariation?.size || 'Standard'}
                              </span>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-center">
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1.5">4. Color</span>
                              <div className="flex items-center gap-2">
                                {item.customData?.selectedColor && item.customData.selectedColor !== '-' && item.customData.selectedColor !== 'Standard' && (
                                  <span className="w-4 h-4 rounded-full border border-gray-300 shadow-sm inline-block flex-shrink-0" style={{ backgroundColor: item.customData.selectedColor.toLowerCase() }} />
                                )}
                                <span className="text-sm font-black uppercase tracking-tight truncate text-gray-900">
                                  {item.customData?.selectedColor || item.selectedVariation?.color || 'Standard'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 5. Used Images */}
                          <div className="pt-4 border-t border-gray-200 space-y-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600">5. Used Images / Assets</div>
                            {item.customData?.usedImages?.length > 0 || item.customData?.manualAttachments?.length > 0 ? (
                              <div className="flex flex-wrap gap-3">
                                {(item.customData?.usedImages || item.customData?.manualAttachments || []).map((img, imgIdx) => {
                                  const url = typeof img === 'string' ? img : img.url;
                                  return (
                                    <div key={imgIdx} className="group relative">
                                        <a href={url} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 p-1 group/asset block hover:border-indigo-400 transition-colors">
                                          <img src={url} alt={`used-asset-${imgIdx}`} className="w-full h-full object-cover rounded-lg group-hover/asset:scale-110 transition-transform" />
                                        </a>
                                        <a href={url} download target="_blank" rel="noreferrer" className="absolute -bottom-2 -right-2 w-6 h-6 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-md border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        </a>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs font-bold italic text-gray-400">No external images uploaded.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
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
