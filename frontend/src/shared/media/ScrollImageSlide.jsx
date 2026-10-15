import React from 'react';

const ScrollImageSlide = React.forwardRef(({ src, alt, caption, slogan }, ref) => (
  <div
    ref={ref}
    className="absolute inset-0 flex flex-col items-center justify-center opacity-0"
    style={{ zIndex: 1, pointerEvents: 'none' }}
    tabIndex={0}
    aria-label={caption}
  >
    <div className="relative w-full flex flex-col items-center">
      <img
        src={src}
        alt={alt}
        className="max-h-[60vh] w-auto object-contain rounded-xl shadow-lg"
        loading="lazy"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
      />
      {slogan && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl md:text-4xl font-bold text-white bg-black/60 px-6 py-2 rounded-full"
          style={{ pointerEvents: 'auto' }}
        >
          {slogan}
        </div>
      )}
    </div>
    {caption && (
      <div className="mt-4 text-lg font-semibold text-gray-200 bg-black/40 px-4 py-1 rounded">
        {caption}
      </div>
    )}
  </div>
));
export default ScrollImageSlide; 