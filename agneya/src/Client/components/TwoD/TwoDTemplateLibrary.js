/**
 * Agneya 2D Template Engine Library
 * This centralizes all code-driven 2D customization templates.
 * These templates define the canvas proportions, clipping shapes, and base overlays.
 */

export const TICKER_ID_MUG_WRAP = 'MUG_WRAP_11OZ';

export const TWOD_TEMPLATES = {
  [TICKER_ID_MUG_WRAP]: {
    id: TICKER_ID_MUG_WRAP,
    name: 'Standard Mug Wrap (11oz)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: {
      width: 500,
      height: 225, // 200mm x 90mm => 2.22 aspect ratio. 500/225 = 2.22
      scale: 1,
      offsetX: 0,
      offsetY: 0
    },
    shapeConfig: {
      type: 'rectangle',
      width: 500,
      height: 225,
      rx: 0,
      overlayOpacity: 0.05,
      borderColor: 'rgba(0,0,0,0.1)',
      strokeWidth: 1
    },
    defaultBackdrop: 'https://i.ibb.co/nbWvC7M/case-overlay.png' // Fallback image
  },
  'BUSINESS_CARD_STD': {
    id: 'BUSINESS_CARD_STD',
    name: 'Business Card (3.5" x 2")',
    category: 'Stationery',
    canvasConfig: {
      width: 525, // 3.5 inches
      height: 300, // 2 inches
      scale: 1,
      offsetX: 0,
      offsetY: 0
    },
    shapeConfig: {
      type: 'rectangle',
      width: 525,
      height: 300,
      rx: 15, // Rounded corners
      overlayOpacity: 0.02
    }
  }
};

export const getTemplateById = (id) => TWOD_TEMPLATES[id] || null;

export const getAllTemplates = () => Object.values(TWOD_TEMPLATES);
