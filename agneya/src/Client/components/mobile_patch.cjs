const fs = require('fs');

const filePath = 'e:/AGNEYAw/agneya/src/Client/components/StudioOverlay.jsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Responsive Typography Replacements
content = content.replace(/text-\[7px\]/g, 'text-[10px] xl:text-[7px]');
content = content.replace(/text-\[8px\]/g, 'text-[11px] xl:text-[8px]');
content = content.replace(/text-\[9px\]/g, 'text-xs xl:text-[9px]');
content = content.replace(/text-\[10px\]/g, 'text-sm xl:text-[10px]');
content = content.replace(/text-\[12px\]/g, 'text-base xl:text-[12px]');

// 2. Touch Targets - Sliders
// <input type="range" 
content = content.replace(/<input\s+type="range"/g, '<input type="range" className="py-3"'); // Adds vertical hitbox padding

// 3. Touch Targets - Color Pickers
// w-full aspect-square
content = content.replace(/w-full aspect-square/g, 'w-full aspect-square min-w-[36px] min-h-[36px] xl:min-w-0 xl:min-h-0');
content = content.replace(/w-4 h-4 rounded-full/g, 'w-8 h-8 xl:w-4 xl:h-4 rounded-full'); // Floating prop colors

// 4. Reduce Shadow complexity on Mobile
content = content.replace(/shadow-\[0_20px_80px_rgba\(0,0,0,0\.15\)\]/g, 'shadow-lg xl:shadow-[0_20px_80px_rgba(0,0,0,0.15)]');
content = content.replace(/shadow-\[0_20px_50px_rgba\(0,0,0,0\.5\)\]/g, 'shadow-xl xl:shadow-[0_20px_50px_rgba(0,0,0,0.5)]');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Mobile UX Regex Sweep completed successfully.');
