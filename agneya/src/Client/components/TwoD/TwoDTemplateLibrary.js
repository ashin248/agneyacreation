/**
 * Agneya 2D Template Engine Library
 * This centralizes all code-driven 2D customization templates.
 * Optimized for Premium Printing Workflows.
 */

export const TICKER_ID_MUG_WRAP = 'MUG_WRAP_11OZ';

export const mug = {
  'MUG_WEDDING_SAVE_DATE': {
    id: 'MUG_WEDDING_SAVE_DATE',
    name: 'Wedding Save the Date (Styled)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 1000, height: 450, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 1000, height: 450, rx: 0 },
    defaultBackdrop: './tablateimage/6324653.jpg',
    imageSlots: [
      { 
        id: 'couple_photo', 
        x: 550, y: 40, 
        width: 370, height: 370, 
        shape: 'circle', 
        label: 'COUPLE PHOTO',
        stroke: '#d4af37', 
        strokeWidth: 4
      },
      { 
        id: 'text_area_guide', 
        x: 50, y: 50, 
        width: 450, height: 350, 
        shape: 'rectangle', 
        label: 'ADD WEDDING TEXT HERE',
        stroke: '#e2e8f0', 
        strokeWidth: 2
      },
      { 
        id: 'floral_deco_tl', 
        x: 20, y: 20, 
        width: 100, height: 100, 
        shape: 'square', 
        label: 'ICON',
        stroke: '#fce7f3', 
        strokeWidth: 1
      },
      { 
        id: 'floral_deco_bl', 
        x: 20, y: 330, 
        width: 100, height: 100, 
        shape: 'square', 
        label: 'ICON',
        stroke: '#fce7f3',
        strokeWidth: 1
      }
    ]
  },

  'MUG_BIRTHDAY_FESTIVE': {
    id: 'MUG_BIRTHDAY_FESTIVE',
    name: 'Birthday Festive Celebration',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 1000, height: 450, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 1000, height: 450, rx: 0 },
    defaultBackdrop: '/src/Client/components/TwoD/tablateimage/6324653.jpg', 
    imageSlots: [
      { 
        id: 'birthday_pic', 
        x: 345, y: 45, 
        width: 310, height: 310, 
        shape: 'circle', 
        label: 'BIRTHDAY PHOTO',
        stroke: '#ff4d4d', 
        strokeWidth: 5
      }
    ]
  },

  'MUG_BIRTHDAY_PNGTREE': {
    id: 'MUG_BIRTHDAY_PNGTREE',
    name: 'Birthday Party Celebration (Pngtree)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 1000, height: 450, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 1000, height: 450, rx: 0 },
    defaultBackdrop: '/src/Client/components/TwoD/tablateimage/—Pngtree—mug design template birthday theme_7930529.png', 
    imageSlots: [
      { 
        id: 'main_pic', 
        x: 350, y: 50, 
        width: 300, height: 350, 
        shape: 'rectangle', 
        label: 'BIRTHDAY PHOTO',
        stroke: '#fbbf24', 
        strokeWidth: 3
      }
    ]
  },
};

export const getTemplateById = (id) => mug[id] || null;

export const getAllTemplates = () => Object.values(mug);

export const getTemplatesByCategory = (category) => Object.values(mug).filter(t => t.category === category);

export const TWOD_TEMPLATES = mug;
export default mug;
