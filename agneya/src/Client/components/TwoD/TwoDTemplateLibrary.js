/**
 * Agneya 2D Template Engine Library
 * This centralizes all code-driven 2D customization templates.
 * Includes 30+ multi-slot configurations for premium printing workflows.
 */

export const TICKER_ID_MUG_WRAP = 'MUG_WRAP_11OZ';

export const mug = {
  // --- 1. EXISTING TEMPLATES (RETAINED) ---

  [TICKER_ID_MUG_WRAP]: {
    id: TICKER_ID_MUG_WRAP,
    name: 'Full Pic Upload (Standard 11oz)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '',
    imageSlots: [
      { id: 'main_pic', x: 0, y: 0, width: 500, height: 225, shape: 'rectangle' }
    ]
  },

  'MUG_BDAY_1PIC': {
    id: 'MUG_BDAY_1PIC',
    name: 'Happy Birthday Quote (1 Photo)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/birthday_bg_1.png',
    imageSlots: [
      { id: 'bday_pic', x: 20, y: 22, width: 180, height: 180, shape: 'circle' } 
    ]
  },

  'MUG_ANNIVERSARY_2PIC': {
    id: 'MUG_ANNIVERSARY_2PIC',
    name: 'Wedding Anniversary (2 Pics)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/anniversary_bg.png', 
    imageSlots: [
      { id: 'couple_pic_1', x: 40, y: 35, width: 150, height: 150, shape: 'square' },
      { id: 'couple_pic_2', x: 310, y: 35, width: 150, height: 150, shape: 'square' }
    ]
  },

  'MUG_WOODEN_3PIC': {
    id: 'MUG_WOODEN_3PIC',
    name: 'Wooden Wall (3 Vertical Pics)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/wooden_wall_bg.png',
    imageSlots: [
      { id: 'pic_1', x: 20, y: 25, width: 130, height: 175, shape: 'rectangle' },
      { id: 'pic_2', x: 185, y: 25, width: 130, height: 175, shape: 'rectangle' },
      { id: 'pic_3', x: 350, y: 25, width: 130, height: 175, shape: 'rectangle' }
    ]
  },

  'MUG_BEST_DAD_TEXT': {
    id: 'MUG_BEST_DAD_TEXT',
    name: 'Best Dad Ever (Text Only)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/best_dad_bg.png',
    imageSlots: []
  },

  // --- 2. VALENTINE'S & LOVE ---

  'MUG_LOVE_HEART_1PIC': {
    id: 'MUG_LOVE_HEART_1PIC',
    name: 'Heartfelt Love (1 Pic)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/valentines_heart_bg.png',
    imageSlots: [{ id: 'heart_pic', x: 160, y: 22, width: 180, height: 180, shape: 'heart' }]
  },

  'MUG_VAL_COUPLE_DUO': {
    id: 'MUG_VAL_COUPLE_DUO',
    name: 'Better Together (2 Pics)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/val_duo_bg.png',
    imageSlots: [
      { id: 'val_1', x: 50, y: 40, width: 140, height: 140, shape: 'circle' },
      { id: 'val_2', x: 310, y: 40, width: 140, height: 140, shape: 'circle' }
    ]
  },

  'MUG_LOVE_QUOTE_TEXT': {
    id: 'MUG_LOVE_QUOTE_TEXT',
    name: 'Love Quote (Text Only)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/love_quote_bg.png',
    imageSlots: []
  },

  // --- 3. MOTHER'S & FATHER'S DAY ---

  'MUG_SUPER_MOM': {
    id: 'MUG_SUPER_MOM',
    name: 'Super Mom (1 Pic)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/super_mom_bg.png',
    imageSlots: [{ id: 'mom_pic', x: 280, y: 25, width: 175, height: 175, shape: 'square' }]
  },

  'MUG_WORLD_BEST_DAD': {
    id: 'MUG_WORLD_BEST_DAD',
    name: 'Worlds Best Dad (1 Pic)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/best_dad_photo_bg.png',
    imageSlots: [{ id: 'dad_pic', x: 45, y: 25, width: 175, height: 175, shape: 'square' }]
  },

  'MUG_PARENT_DUO': {
    id: 'MUG_PARENT_DUO',
    name: 'Mom & Dad Duo (2 Pics)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/parents_duo_bg.png',
    imageSlots: [
      { id: 'mom_side', x: 30, y: 35, width: 155, height: 155, shape: 'circle' },
      { id: 'dad_side', x: 315, y: 35, width: 155, height: 155, shape: 'circle' }
    ]
  },

  // --- 4. FRIENDS & BESTIES ---

  'MUG_BESTIES_CIRCLE': {
    id: 'MUG_BESTIES_CIRCLE',
    name: 'BFF Circle (1 Pic)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/besties_circle_bg.png',
    imageSlots: [{ id: 'bff_pic', x: 160, y: 22, width: 180, height: 180, shape: 'heart' }]
  },

  'MUG_SQUAD_GOALS_3PIC': {
    id: 'MUG_SQUAD_GOALS_3PIC',
    name: 'Squad Goals (3 Pics)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/squad_goals_bg.png',
    imageSlots: [
      { id: 'squad_1', x: 20, y: 40, width: 140, height: 140, shape: 'square' },
      { id: 'squad_2', x: 180, y: 40, width: 140, height: 140, shape: 'square' },
      { id: 'squad_3', x: 340, y: 40, width: 140, height: 140, shape: 'square' }
    ]
  },

  'MUG_TRAVEL_BUDDIES': {
    id: 'MUG_TRAVEL_BUDDIES',
    name: 'Partners in Crime (2 Pics)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/travel_buddies_bg.png',
    imageSlots: [
      { id: 'trip_1', x: 30, y: 30, width: 210, height: 165, shape: 'rectangle' },
      { id: 'trip_2', x: 260, y: 30, width: 210, height: 165, shape: 'rectangle' }
    ]
  },

  // --- 5. TEACHER'S DAY ---

  'MUG_BEST_TEACHER': {
    id: 'MUG_BEST_TEACHER',
    name: 'Best Teacher (1 Photo)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/teacher_day_bg.png',
    imageSlots: [{ id: 'teacher_pic', x: 300, y: 25, width: 175, height: 175, shape: 'circle' }]
  },

  'MUG_TEACHER_QUOTE': {
    id: 'MUG_TEACHER_QUOTE',
    name: 'Inspiration Teacher (Text Only)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/teacher_quote_bg.png',
    imageSlots: []
  },

  // --- 6. NEW BORN & KIDS ---

  'MUG_NEWBORN_WELCOME': {
    id: 'MUG_NEWBORN_WELCOME',
    name: 'Welcome Little One (1 Large Pic)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/newborn_bg.png',
    imageSlots: [{ id: 'baby_main', x: 15, y: 15, width: 260, height: 195, shape: 'rectangle' }]
  },

  'MUG_KIDS_BDAY_2PIC': {
    id: 'MUG_KIDS_BDAY_2PIC',
    name: 'Birthday Party (2 Pics)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/kids_bday_bg.png',
    imageSlots: [
      { id: 'kid_1', x: 40, y: 40, width: 145, height: 145, shape: 'circle' },
      { id: 'kid_2', x: 315, y: 40, width: 145, height: 145, shape: 'circle' }
    ]
  },

  'MUG_LITTLE_STAR': {
    id: 'MUG_LITTLE_STAR',
    name: 'Twinkle Little Star (1 Pic)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/little_star_bg.png',
    imageSlots: [{ id: 'star_baby', x: 160, y: 22, width: 180, height: 180, shape: 'heart' }]
  },

  // --- 7. COFFEE LOVERS ---

  'MUG_COFFEE_BREW_TEXT': {
    id: 'MUG_COFFEE_BREW_TEXT',
    name: 'Freshly Brewed (Text Only)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/coffee_brew_bg.png',
    imageSlots: []
  },

  'MUG_COFFEE_BEAN_1PIC': {
    id: 'MUG_COFFEE_BEAN_1PIC',
    name: 'Coffee Mornings (1 Photo)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/coffee_bean_bg.png',
    imageSlots: [{ id: 'coffee_pic', x: 280, y: 35, width: 155, height: 155, shape: 'circle' }]
  },

  'MUG_MORNING_VIBE_TEXT': {
    id: 'MUG_MORNING_VIBE_TEXT',
    name: 'Good Morning Vibe (Text Only)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/morning_vibe_bg.png',
    imageSlots: []
  },

  // --- 8. CHRISTMAS & HOLIDAYS ---

  'MUG_HOLIDAY_XMAS_1PIC': {
    id: 'MUG_HOLIDAY_XMAS_1PIC',
    name: 'Merry Christmas (1 Pic)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/xmas_bg.png',
    imageSlots: [{ id: 'xmas_pic', x: 70, y: 22, width: 180, height: 180, shape: 'circle' }]
  },

  'MUG_NEWYEAR_TEXT': {
    id: 'MUG_NEWYEAR_TEXT',
    name: 'Happy New Year (Text Only)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/newyear_bg.png',
    imageSlots: []
  },

  'MUG_DIWALI_FESTIVE_1PIC': {
    id: 'MUG_DIWALI_FESTIVE_1PIC',
    name: 'Festive Lights (1 Pic)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/diwali_bg.png',
    imageSlots: [{ id: 'diwali_pic', x: 260, y: 35, width: 160, height: 160, shape: 'circle' }]
  },

  // --- 9. MULTI-PHOTO COLLAGES ---

  'MUG_COLLAGE_4GRID': {
    id: 'MUG_COLLAGE_4GRID',
    name: 'Classic 4-Photo Grid',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/collage_4grid_bg.png',
    imageSlots: [
      { id: 'g1', x: 140, y: 15, width: 100, height: 90, shape: 'square' },
      { id: 'g2', x: 260, y: 15, width: 100, height: 90, shape: 'square' },
      { id: 'g3', x: 140, y: 120, width: 100, height: 90, shape: 'square' },
      { id: 'g4', x: 260, y: 120, width: 100, height: 90, shape: 'square' }
    ]
  },

  'MUG_HORIZ_3STRIP': {
    id: 'MUG_HORIZ_3STRIP',
    name: 'Horizon 3-Strip',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/horiz_3strip_bg.png',
    imageSlots: [
      { id: 's1', x: 10, y: 40, width: 150, height: 145, shape: 'rectangle' },
      { id: 's2', x: 175, y: 40, width: 150, height: 145, shape: 'rectangle' },
      { id: 's3', x: 340, y: 40, width: 150, height: 145, shape: 'rectangle' }
    ]
  },

  'MUG_DUO_LARGE_RECT': {
    id: 'MUG_DUO_LARGE_RECT',
    name: 'Duo Masterpieces (2 Large)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/duo_large_bg.png',
    imageSlots: [
      { id: 'm1', x: 25, y: 25, width: 215, height: 175, shape: 'rectangle' },
      { id: 'm2', x: 260, y: 25, width: 215, height: 175, shape: 'rectangle' }
    ]
  },

  // --- 10. ARTISTIC & NATURE ---

  'MUG_ABSTRAC_MODERN_1PIC': {
    id: 'MUG_ABSTRAC_MODERN_1PIC',
    name: 'Modern Abstract (1 Pic)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/abstract_bg.png',
    imageSlots: [{ id: 'art_pic', x: 40, y: 40, width: 145, height: 145, shape: 'circle' }]
  },

  'MUG_NATURE_ZEN_1PIC': {
    id: 'MUG_NATURE_ZEN_1PIC',
    name: 'Zen Nature (1 Pic)',
    category: 'Mug',
    mockupProfile: 'mug-wrap',
    canvasConfig: { width: 540, height: 225, scale: 1, offsetX: 0, offsetY: 0 },
    shapeConfig: { type: 'rectangle', width: 540, height: 225, rx: 0 },
    defaultBackdrop: '/assets/templates/nature_zen_bg.png',
    imageSlots: [{ id: 'nature_pic', x: 310, y: 30, width: 165, height: 165, shape: 'square' }]
  }
};

export const getTemplateById = (id) => mug[id] || null;

export const getAllTemplates = () => Object.values(mug);

export const getTemplatesByCategory = (category) => Object.values(mug).filter(t => t.category === category);

export const TWOD_TEMPLATES = mug;
