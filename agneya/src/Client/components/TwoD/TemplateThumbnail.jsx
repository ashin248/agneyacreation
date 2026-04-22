import React from 'react';

/**
 * TemplateThumbnail renders a dynamic, code-driven preview of a design template
 * using its metadata (shapeConfig, aspectRatio, colors).
 * This replaces static image thumbnails with a live, responsive representation.
 */
const TemplateThumbnail = ({ template, className = '' }) => {
  if (!template) return null;

  const { shapeConfig, canvasConfig, name } = template;
  
  // Calculate aspect ratio string for Tailwind-like logic or raw CSS
  const width = canvasConfig?.width || 500;
  const height = canvasConfig?.height || 600;
  const aspectRatio = `${width} / ${height}`;

  // Convert shapeConfig to CSS clip-path
  const getClipPath = () => {
    if (!shapeConfig) return 'inset(0%)';
    const { type, radius, points, rx } = shapeConfig;

    switch (type) {
      case 'circle':
        return 'circle(50% at 50% 50%)';
      case 'rectangle':
      case 'rounded-rectangle':
        return rx ? `inset(0% round ${rx}px)` : 'inset(0%)';
      case 'polygon':
        if (points) {
          // Input: "0,0 500,0 500,600 0,600"
          // Convert to percentage-based points for CSS clip-path
          const pArray = points.split(' ').map(p => {
            const [px, py] = p.split(',').map(Number);
            const xPerc = (px / width) * 100;
            const yPerc = (py / height) * 100;
            return `${xPerc}% ${yPerc}%`;
          });
          return `polygon(${pArray.join(', ')})`;
        }
        return 'inset(0%)';
      default:
        return 'inset(0%)';
    }
  };

  return (
    <div 
      className={`relative w-full overflow-hidden flex items-center justify-center bg-slate-50 ${className}`}
      style={{ aspectRatio }}
    >
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: 'radial-gradient(#6366f1 1px, transparent 0)',
        backgroundSize: '20px 20px'
      }}></div>
      
      {/* The Dynamic Shape */}
      <div 
        className="w-full h-full shadow-inner transition-all duration-500 flex flex-col items-center justify-center p-4 text-center group-hover:scale-105"
        style={{ 
          clipPath: getClipPath(),
          background: template.thumbnail ? `url(${template.thumbnail}) center/cover no-repeat` : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        }}
      >
        {/* If no thumbnail, show high-fidelity placeholder content */}
        {!template.thumbnail && (
          <div className="space-y-1 animate-in fade-in zoom-in duration-700">
            <h4 className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-md">{name}</h4>
            <div className="w-8 h-0.5 bg-white/50 mx-auto rounded-full"></div>
            <p className="text-white/60 text-[8px] font-bold uppercase tracking-tighter">Design Preset</p>
          </div>
        )}
        
        {/* Subtle Inner Glow */}
        <div className="absolute inset-0 border border-white/10 pointer-events-none"></div>
      </div>

      {/* Modern Badge for Aspect Ratio / Type */}
      <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/20 backdrop-blur-md rounded-lg border border-white/10">
         <span className="text-[7px] font-black text-white uppercase tracking-widest">{width}x{height}</span>
      </div>
    </div>
  );
};

export default TemplateThumbnail;
