/**
 * Agneya 2D Template Engine Library
 */

export const TICKER_ID_MUG_WRAP = 'MUG_WRAP_11OZ';

export const mug = {
    'MUG_1_SLOT': {
        id: 'MUG_1_SLOT',
        name: 'Single Portrait',
        category: 'Mugs',
        objects: [
            { type: 'rect', left: 150, top: 100, width: 200, height: 400, rx: 0, slotId: 'main' }
        ]
    },
    'MUG_2_SLOTS': {
        id: 'MUG_2_SLOTS',
        name: 'Twin Vertical',
        category: 'Mugs',
        objects: [
            { type: 'rect', left: 50, top: 100, width: 180, height: 400, rx: 0, slotId: 'left' },
            { type: 'rect', left: 270, top: 100, width: 180, height: 400, rx: 0, slotId: 'right' }
        ]
    },
    'MUG_HEART_SLOT': {
        id: 'MUG_HEART_SLOT',
        name: 'Heart Center',
        category: 'Mugs',
        objects: [
            { 
                type: 'path', 
                path: 'M 250 150 Q 250 100 200 100 A 50 50 0 0 0 150 150 A 50 50 0 0 0 250 250 A 50 50 0 0 0 350 150 A 50 50 0 0 0 300 100 Q 250 100 250 150 Z', 
                left: 150, 
                top: 100, 
                width: 200, 
                height: 200, 
                slotId: 'heart' 
            }
        ]
    }
};

export const getTemplateById = (id) => mug[id] || null;
export const getAllTemplates = () => Object.values(mug);
export const getTemplatesByCategory = (category) => Object.values(mug).filter(t => t.category === category);

export const TWOD_TEMPLATES = mug;
export default mug;
