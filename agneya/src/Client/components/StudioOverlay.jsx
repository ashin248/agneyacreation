import React from 'react';
import './Studio/context/StudioContextInstance'; // Force early initialization
import { StudioProvider } from './Studio/context/StudioContext';
import StudioOverlayInner from './Studio/components/StudioOverlayInner';

/**
 * StudioOverlay
 * 
 * Root wrapper for the customization studio.
 * Uses StudioProvider to manage state and StudioOverlayInner for the UI.
 * Refactored to separate files to prevent circular initialization errors.
 */
export default function StudioOverlay(props) {
    if (!props.isOpen) return null;

    return (
        <StudioProvider 
            product={props.product} 
            initialMode={props.initialMode} 
            initial2DModelIdx={props.initial2DModelIdx}
        >
            <StudioOverlayInner {...props} />
        </StudioProvider>
    );
}
