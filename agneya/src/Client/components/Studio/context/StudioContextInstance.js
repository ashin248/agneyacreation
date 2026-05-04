console.log('TRACE: StudioContextInstance.js');
import { createContext, useContext } from 'react';

/**
 * StudioContextInstance
 * 
 * This file exists solely to break circular dependencies.
 * By isolating the context object, we ensure it is initialized 
 * before any provider or consumer is evaluated.
 */
export const StudioContext = createContext();

export function useStudio() {
    return useContext(StudioContext);
}
