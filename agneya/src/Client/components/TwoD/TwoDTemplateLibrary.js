/**
 * Agneya 2D Template Engine Library
 * This centralizes all code-driven 2D customization templates.
 * Optimized for Premium Printing Workflows.
 */

export const TICKER_ID_MUG_WRAP = 'MUG_WRAP_11OZ';

export const mug = {
  // --- 1. PREMIUM STANDARD TEMPLATES ---

  [TICKER_ID_MUG_WRAP]: {
    id: TICKER_ID_MUG_WRAP,
    name: 'Standard Full Wrap (High Res)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 1000, height: 450, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 1000, height: 450, rx: 0 },
    defaultBackdrop: '',
    imageSlots: [
      { id: 'main_wrap', x: 0, y: 0, width: 1000, height: 450, shape: 'rectangle' }
    ]
  },

  'MUG_PREMIUM_DUO_HEART': {
    id: 'MUG_PREMIUM_DUO_HEART',
    name: 'Love Duo (Two Hearts)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 1000, height: 450, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 1000, height: 450, rx: 0 },
    defaultBackdrop: 'https://i.ibb.co/3ykC0XN/mug-love-bg.png',
    imageSlots: [
      { id: 'heart_left', x: 50, y: 75, width: 300, height: 300, shape: 'heart' },
      { id: 'heart_right', x: 650, y: 75, width: 300, height: 300, shape: 'heart' }
    ]
  },

  'MUG_PREMIUM_TRIO_MODERN': {
    id: 'MUG_PREMIUM_TRIO_MODERN',
    name: 'Modern Trio (3 Rectangles)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 1000, height: 450, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 1000, height: 450, rx: 0 },
    defaultBackdrop: 'https://i.ibb.co/L6V2S0r/modern-mug-bg.png',
    imageSlots: [
      { id: 'pic_1', x: 40, y: 50, width: 280, height: 350, shape: 'rectangle' },
      { id: 'pic_2', x: 360, y: 50, width: 280, height: 350, shape: 'rectangle' },
      { id: 'pic_3', x: 680, y: 50, width: 280, height: 350, shape: 'rectangle' }
    ]
  },

  'MUG_CIRCLE_MOSAIC': {
    id: 'MUG_CIRCLE_MOSAIC',
    name: 'Circle Mosaic (5 Mini Pics)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 1000, height: 450, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 1000, height: 450, rx: 0 },
    defaultBackdrop: 'https://i.ibb.co/N2L8XwK/mosaic-bg.png',
    imageSlots: [
      { id: 'c1', x: 50, y: 150, width: 150, height: 150, shape: 'circle' },
      { id: 'c2', x: 230, y: 100, width: 150, height: 150, shape: 'circle' },
      { id: 'c3', x: 410, y: 150, width: 180, height: 180, shape: 'circle' },
      { id: 'c4', x: 620, y: 100, width: 150, height: 150, shape: 'circle' },
      { id: 'c5', x: 800, y: 150, width: 150, height: 150, shape: 'circle' }
    ]
  },

  'MUG_PREMIUM_CENTER_FOCUS': {
    id: 'MUG_PREMIUM_CENTER_FOCUS',
    name: 'Center Focus (Portrait)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 1000, height: 450, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 1000, height: 450, rx: 0 },
    defaultBackdrop: 'https://i.ibb.co/9vFzL6M/center-focus-bg.png',
    imageSlots: [
      { id: 'main', x: 325, y: 25, width: 350, height: 400, shape: 'rectangle' }
    ]
  }
};

export const getTemplateById = (id) => mug[id] || null;

export const getAllTemplates = () => Object.values(mug);

export const getTemplatesByCategory = (category) => Object.values(mug).filter(t => t.category === category);

export const TWOD_TEMPLATES = mug;
export default mug;
