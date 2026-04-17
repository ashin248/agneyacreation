import React from 'react';

const OrderFulfillmentTracker = ({ currentStatus, orderType }) => {
  if (currentStatus === 'Cancelled') {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 rounded p-4 flex items-center shadow-sm">
        <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="text-red-800 font-bold text-lg">Order Cancelled</h3>
          <p className="text-red-700 text-sm mt-0.5">This transaction has been terminated. No further processing will occur.</p>
        </div>
      </div>
    );
  }

  // Define steps based on cart type. Hide printing if purely Standard. 
  let steps = ['Pending', 'Processing', 'Printing', 'Shipped', 'Delivered'];
  if (orderType === 'Standard') {
    steps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  }

  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 w-full overflow-hidden">
      <h2 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider">Fulfillment Timeline</h2>
      
      <div className="relative">
        <div className="flex items-center justify-between w-full relative z-10">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;
            const isPending = index > currentIndex;

            return (
              <div key={step} className="flex flex-col items-center w-full relative">
                
                {/* Visual Connector Line (Hidden on first item mapping leftly) */}
                {index !== 0 && (
                  <div 
                    className={`absolute top-4 left-0 -ml-[50%] w-full h-[3px] -z-10 transition-colors duration-500 ${
                      isCompleted || isActive ? 'bg-indigo-600' : 'bg-gray-200'
                    }`} 
                  />
                )}

                {/* Circle Icon Indicator */}
                <div 
                  className={`w-8 h-8 rounded-full flex justify-center items-center shadow-sm border-2 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-indigo-600 border-indigo-600' 
                      : isActive 
                        ? 'bg-white border-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.2)]'
                        : 'bg-white border-gray-300'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></div>
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  )}
                </div>

                {/* Text Label */}
                <span 
                  className={`mt-3 text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                    isCompleted 
                      ? 'text-indigo-800' 
                      : isActive 
                        ? 'text-indigo-600' 
                        : 'text-gray-400'
                  }`}
                >
                  {step}
                </span>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderFulfillmentTracker;

