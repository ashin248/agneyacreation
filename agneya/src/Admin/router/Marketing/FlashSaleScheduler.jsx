import React from 'react';
import { FiZap, FiLock, FiCalendar, FiPercent, FiClock } from 'react-icons/fi';

const FlashSaleScheduler = () => {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[40px] border border-white/40 shadow-2xl overflow-hidden relative font-sans text-gray-800">
      {/* Decorative Background Gradient over Top Area */}
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent pointer-events-none"></div>

      <div className="relative p-10 md:p-16 z-10">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
          <div className="w-24 h-24 bg-gray-900 text-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-500/10 mb-8 -rotate-6 transform hover:rotate-0 transition-transform duration-500">
            <FiZap size={40} className="fill-blue-500 text-blue-500" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4 uppercase">
            Evolution: Flash Engine
          </h2>
          <p className="text-[15px] text-gray-400 font-bold leading-relaxed max-w-md">
            Supercharge revenue velocity with high-urgency, time-bound promotional artifacts. Unlocked in the next system iteration.
          </p>
        </div>

        {/* Premium Mockup Structure */}
        <div className="max-w-4xl mx-auto bg-white/40 backdrop-blur-sm rounded-[32px] border-2 border-dashed border-gray-100 p-10 opacity-60 filter grayscale-[20%] relative group">
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] rounded-[32px] z-20 flex flex-col items-center justify-center">
             <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl group-hover:scale-110 transition-transform duration-500">
                <FiLock size={14} className="text-blue-500" /> Administrative Lock
             </div>
          </div>

          {/* Mock Countdown Widget */}
          <div className="flex justify-center mb-12">
            <div className="flex gap-4 sm:gap-8 text-center items-center">
              <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 min-w-[100px]">
                <div className="text-3xl font-black text-gray-900">00</div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Days</div>
              </div>
              <div className="text-3xl font-black text-gray-200">:</div>
              <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 min-w-[100px]">
                <div className="text-3xl font-black text-gray-900">12</div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Hours</div>
              </div>
              <div className="text-3xl font-black text-gray-200">:</div>
              <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 min-w-[100px]">
                <div className="text-3xl font-black text-gray-900">45</div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Mins</div>
              </div>
            </div>
          </div>

          {/* Dummy Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Sequence Window</label>
              <div className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-sm text-gray-300 font-bold flex items-center justify-between">
                <span>OCTOBER 31, 2026</span>
                <FiCalendar />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Surge Yield percentage</label>
              <div className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-sm text-gray-300 font-bold flex items-center justify-between">
                <span>40% DISCOUNT</span>
                <FiPercent />
              </div>
            </div>
          </div>

          {/* Locked Submit Button */}
          <div className="flex justify-center">
            <button 
              disabled 
              className="flex items-center gap-3 px-12 py-5 bg-gray-100 text-gray-300 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
            >
              Deploy Flash Protocol
            </button>
          </div>
        </div>

        {/* Floating System Status */}
        <div className="absolute top-10 right-10 flex items-center gap-4">
           <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Awaiting Artifact</span>
           </div>
        </div>

      </div>
    </div>
  );
};

export default FlashSaleScheduler;

