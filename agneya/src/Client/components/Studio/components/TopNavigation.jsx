import React from 'react';
import { FiCornerUpLeft, FiCornerUpRight } from 'react-icons/fi';
import { useStudio } from '../context/StudioContext';

const TopNavigation = ({ handleUndo, handleRedo, canUndo, canRedo, handleSwitchSide }) => {
    const { 
        twoDModels, active2DModelIdx, 
        activeSupportSide, setActiveSupportSide
    } = useStudio();
    
    return (
        <>
            <div className="absolute top-4 left-4 flex gap-3 z-50">
                <button 
                    onClick={handleUndo} 
                    disabled={!canUndo} 
                    className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-800 disabled:opacity-20 hover:scale-110 active:scale-95 transition-all"
                >
                    <FiCornerUpLeft size={18} />
                </button>
                <button 
                    onClick={handleRedo} 
                    disabled={!canRedo} 
                    className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-800 disabled:opacity-20 hover:scale-110 active:scale-95 transition-all"
                >
                    <FiCornerUpRight size={18} />
                </button>
            </div>

            {/* Dynamic 2D Models Navigation */}
            {twoDModels.length > 0 && twoDModels[active2DModelIdx] && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-row items-center gap-4 bg-white/90 backdrop-blur-md p-3 rounded-[32px] shadow-2xl z-30 border border-slate-100/50 max-w-[80%] overflow-x-auto no-scrollbar pointer-events-auto">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 border-r border-slate-100 hidden md:block">Views</div>
                    <button 
                        onClick={() => {
                            handleSwitchSide(`model_${active2DModelIdx}_main`);
                            setActiveSupportSide('Main');
                        }}
                        className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 shrink-0 transition-all ${activeSupportSide === 'Main' ? 'bg-[#0c0c2a] text-white scale-105 shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        <img src={twoDModels[active2DModelIdx].mainModelUrl} alt="Main" className="w-8 h-8 object-contain drop-shadow-md" />
                        <span className="text-[8px] font-black uppercase">Main</span>
                    </button>
                    
                    {twoDModels[active2DModelIdx].supportModels?.map((sm, smIdx) => (
                        <button 
                            key={smIdx}
                            onClick={() => {
                                handleSwitchSide(`model_${active2DModelIdx}_support_${sm.side}`);
                                setActiveSupportSide(sm.side);
                            }}
                            className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 shrink-0 transition-all ${activeSupportSide === sm.side ? 'bg-[#0c0c2a] text-white scale-105 shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                            <img src={sm.url} alt={sm.side} className="w-8 h-8 object-contain drop-shadow-md" />
                            <span className="text-[8px] font-black uppercase">{sm.side}</span>
                        </button>
                    ))}
                </div>
            )}
        </>
    );
};

export default TopNavigation;
