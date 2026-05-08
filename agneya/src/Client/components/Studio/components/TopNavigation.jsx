import React from 'react';
import { FiCornerUpLeft, FiCornerUpRight } from 'react-icons/fi';

function TopNavigation({ 
    handleUndo, handleRedo, canUndo, canRedo, handleSwitchSide,
    twoDModels, active2DModelIdx, 
    activeSupportSide, setActiveSupportSide
}) {
    return (
        <>
            <div className="absolute top-4 left-4 flex gap-4 z-50">
                <button 
                    onClick={handleUndo} 
                    disabled={!canUndo} 
                    className="w-12 h-12 neu-button flex items-center justify-center transition-all active:scale-90 disabled:opacity-20"
                    style={{ color: 'var(--color-neu-text)' }}
                >
                    <FiCornerUpLeft size={18} />
                </button>
                <button 
                    onClick={handleRedo} 
                    disabled={!canRedo} 
                    className="w-12 h-12 neu-button flex items-center justify-center transition-all active:scale-90 disabled:opacity-20"
                    style={{ color: 'var(--color-neu-text)' }}
                >
                    <FiCornerUpRight size={18} />
                </button>
            </div>

        </>
    );
}

export default TopNavigation;

