import { createContext, useContext } from 'react';

/**
 * StudioContextInstance
 * 
 * This file exists solely to break circular dependencies.
 * By isolating the context object, we ensure it is initialized 
 * before any provider or consumer is evaluated.
 */
export const StudioContext = createContext(null);

export function useStudio() {
    const context = useContext(StudioContext);
    return context;
}
