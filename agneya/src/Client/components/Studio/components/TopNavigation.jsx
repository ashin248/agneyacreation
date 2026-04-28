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

        </>
    );
};

export default TopNavigation;
