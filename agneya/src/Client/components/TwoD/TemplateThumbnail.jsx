import React from 'react';

/**
 * TemplateThumbnail (Reset)
 * Clearing previous implementation for a new idea.
 */
const TemplateThumbnail = ({ template, className = '' }) => {
  return (
    <div className={`w-full h-full flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-lg ${className}`}>
      <span className="text-[10px] text-slate-400 uppercase font-medium">New 2D Preview</span>
    </div>
  );
};

export default TemplateThumbnail;
