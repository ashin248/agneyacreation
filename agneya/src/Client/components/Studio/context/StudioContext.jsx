import React, { createContext, useContext, useState } from 'react';

const StudioContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useStudio = () => useContext(StudioContext);

export const StudioProvider = ({ children, product, initialMode = 'self', initial2DModelIdx = 0 }) => {
    // 1. Core Config & Layout States
    const [activeStudioTab, setActiveStudioTab] = useState('3D_STUDIO');
    const [designMode, setDesignMode] = useState(initialMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 2. Active Tool / UI States
    const [activeTab, setActiveTab] = useState('uploads'); // 'uploads', 'text', 'layers', etc.
    const [isMobileUiMinimized, setIsMobileUiMinimized] = useState(false);
    
    // 3. Object & Layer Management (Global for both 2D and 3D sync)
    const [activeObject, setActiveObject] = useState(null); // Metadata of selected Fabric object
    const [canvasObjects, setCanvasObjects] = useState([]); // Array of all objects mapped for 3D Decals
    const [historyStep, setHistoryStep] = useState(-1);
    const [historyLength, setHistoryLength] = useState(0); // Track total history for undo/redo limits
    
    // 4. 2D Model View Settings (Front, Back, Support sides)
    const twoDModels = product?.twoDModels || [];
    const [active2DModelIdx, setActive2DModelIdx] = useState(initial2DModelIdx);
    const [activeSupportSide, setActiveSupportSide] = useState('Main');
    const [viewSide, setViewSide] = useState(twoDModels.length > 0 ? `model_${initial2DModelIdx}_main` : 'front');

    // Derived Logic: Calculate the exact backdrop image URL based on current view
    let current2DImageUrl = product?.blankFrontImage || product?.images?.[0] || product?.phoneMask?.bodyImage;
    
    if (twoDModels.length > 0 && twoDModels[active2DModelIdx]) {
        const activeModel = twoDModels[active2DModelIdx];
        if (activeSupportSide === 'Main') {
             current2DImageUrl = activeModel.mainModelUrl || current2DImageUrl;
        } else {
             const support = activeModel.supportModels?.find(s => s.side === activeSupportSide);
             if (support) current2DImageUrl = support.url;
        }
    }

    // Prepare context payload
    const value = {
        // Global Product Access
        product,
        
        // Navigation & Layout
        activeStudioTab, setActiveStudioTab,
        designMode, setDesignMode,
        activeTab, setActiveTab,
        isMobileUiMinimized, setIsMobileUiMinimized,
        
        // Canvas Data
        activeObject, setActiveObject,
        canvasObjects, setCanvasObjects,
        historyStep, setHistoryStep,
        historyLength, setHistoryLength,
        
        // View Port Controls
        twoDModels,
        active2DModelIdx, setActive2DModelIdx,
        activeSupportSide, setActiveSupportSide,
        viewSide, setViewSide,
        current2DImageUrl,
        
        // Submission
        isSubmitting, setIsSubmitting
    };

    return (
        <StudioContext.Provider value={value}>
            {children}
        </StudioContext.Provider>
    );
};
