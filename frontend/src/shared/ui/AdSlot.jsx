import React from 'react';

const AdSlot = ({ 
  size = 'banner', 
  position = 'bottom', 
  className = '',
  content = null,
  hideOnMobile = true 
}) => {
  // Size configurations
  const sizeClasses = {
    banner: 'h-24 w-full',
    square: 'h-64 w-64',
    rectangle: 'h-32 w-full',
    large: 'h-40 w-full'
  };

  // Position configurations
  const positionClasses = {
    top: 'top-0',
    sticky: 'sticky bottom-0',
    absolute: 'absolute bottom-0 inset-x-0'
  };

  // Default placeholder content
  const defaultContent = (
    <div className="flex items-center justify-center h-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
      <div className="text-center">
        <div className="text-orange-600 font-semibold text-sm mb-1">
          Advertisement
        </div>
        <div className="text-orange-400 text-xs">
          Your ad could be here
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className={`
        ad-slot 
        ${sizeClasses[size]} 
        ${positionClasses[position]}
        ${hideOnMobile ? 'hidden sm:block' : ''}
        ${className}
      `}
      role="complementary"
      aria-label="Advertisement"
    >
      {content || defaultContent}
    </div>
  );
};

export default AdSlot;
