import React from 'react';

const StarRating = ({ rating, count, size = 'sm' }) => {
  const fullStars = Math.floor(rating || 5);
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4'
  };

  return (
    <div className="flex items-center">
      <div className="flex text-amber-500 gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className={`${sizeClasses[size]} fill-current transition-transform duration-300 hover:scale-125`} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {count !== undefined && (
        <span className="ml-2 text-gray-400 text-[10px] font-black tracking-widest font-sans">({count})</span>
      )}
    </div>
  );
};

export default StarRating;

