/**
 * Agneya 2D Template Engine Library
 * Reset for new implementation.
 */

export const TICKER_ID_MUG_WRAP = 'MUG_WRAP_11OZ';

export const mug = {
  // Reset for new implementation
};

export const getTemplateById = (id) => mug[id] || null;

export const getAllTemplates = () => Object.values(mug);

export const getTemplatesByCategory = (category) => Object.values(mug).filter(t => t.category === category);

export const TWOD_TEMPLATES = mug;
export default mug;
