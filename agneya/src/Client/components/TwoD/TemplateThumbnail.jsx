import React from 'react';
import { FiImage, FiHeart, FiGift, FiCoffee, FiStar, FiSmile, FiBookOpen, FiZap } from 'react-icons/fi';

/**
 * TemplateThumbnail renders a dynamic, code-driven preview of a design template.
 * It visualizes:
 * 1. The overall shape (Rect, Circle, etc.)
 * 2. The backdrop (if available)
 * 3. Each individual photo slot defined in imageSlots
 */
const TemplateThumbnail = ({ template, className = '' }) => {
  if (!template) return null;

  const { shapeConfig, canvasConfig, name, imageSlots = [], category, defaultBackdrop } = template;
  
  const width = canvasConfig?.width || 500;
  const height = canvasConfig?.height || 225;
  const aspectRatio = `${width} / ${height}`;

  // Get category specific icon
  const getCategoryIcon = () => {
    switch (category?.toLowerCase()) {
      case 'valentine': return <FiHeart className="text-white/80" />;
      case 'parents': return <FiSmile className="text-white/80" />;
      case 'friends': return <FiZap className="text-white/80" />;
      case 'kids': return <FiStar className="text-white/80" />;
      case 'coffee': return <FiCoffee className="text-white/80" />;
      case 'teacher': return <FiBookOpen className="text-white/80" />;
      default: return <FiGift className="text-white/80" />;
    }
  };

  const getClipPath = () => {
    if (!shapeConfig) return 'inset(0%)';
    const { type, points, rx } = shapeConfig;
    switch (type) {
      case 'circle': return 'circle(50% at 50% 50%)';
      case 'rectangle':
      case 'rounded-rectangle': return rx ? `inset(0% round ${rx}px)` : 'inset(0%)';
      case 'polygon':
        if (points) {
          const pArray = points.split(' ').map(p => {
            const [px, py] = p.split(',').map(Number);
            return `${(px / width) * 100}% ${(py / height) * 100}%`;
          });
          return `polygon(${pArray.join(', ')})`;
        }
        return 'inset(0%)';
      default: return 'inset(0%)';
    }
  };

  return (
    <div 
      className={`relative w-full overflow-hidden flex items-center justify-center bg-slate-100 ${className}`}
      style={{ aspectRatio }}
    >
      {/* Background Visualizer */}
      <div 
        className="w-full h-full relative shadow-inner overflow-hidden flex items-center justify-center transition-all duration-700"
        style={{ 
          clipPath: getClipPath(),
          background: defaultBackdrop 
            ? `url(${defaultBackdrop}) center/cover no-repeat` 
            : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        }}
      >
        {/* If no backdrop, show the name centered with better contrast */}
        {!defaultBackdrop && (
          <div className="relative z-10 p-4 text-center max-w-[80%] flex flex-col items-center gap-1.5 transform group-hover:scale-110 transition-transform">
             <div className="p-2 bg-white/20 backdrop-blur-lg rounded-full mb-1">
                {getCategoryIcon()}
             </div>
             <h4 className="text-white text-[12px] font-black uppercase leading-tight tracking-normal drop-shadow-lg">{name}</h4>
             <div className="h-0.5 w-6 bg-white/40 rounded-full"></div>
             <p className="text-white/70 text-[7px] font-bold uppercase tracking-widest">{category || 'Design Preset'}</p>
          </div>
        )}

        {/* --- DYNAMIC SLOT VISUALIZER --- */}
        {/* We use percentage positioning to ensure slots align correctly regardless of scale */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {(imageSlots || []).map((slot, idx) => {
            const left = (slot.x / width) * 100;
            const top = (slot.y / height) * 100;
            const w = (slot.width / width) * 100;
            const h = (slot.height / height) * 100;
            const isCircle = slot.shape === 'circle';

            return (
              <div 
                key={slot.id || idx}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${w}%`,
                  height: `${h}%`,
                  borderRadius: isCircle ? '50%' : '8px',
                }}
                className="bg-white/30 backdrop-blur-[2px] border border-white/50 flex items-center justify-center animate-in zoom-in fade-in duration-1000"
              >
                <FiImage className="text-white/60 text-[8px]" />
              </div>
            );
          })}
        </div>

        {/* Subtle Overlay Pattern to make it look technical/blueprint */}
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none" style={{ 
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)',
          backgroundSize: '12px 12px'
        }}></div>

        {/* Modern Label */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/20 to-transparent">
           <div className="flex items-center justify-between">
              <span className="text-[6px] font-black text-white/50 uppercase tracking-widest">{width} x {height}</span>
              <span className="text-[6px] font-black text-white/50 uppercase tracking-widest px-1.5 py-0.5 bg-black/10 rounded-sm">{imageSlots.length} Slots</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateThumbnail;
