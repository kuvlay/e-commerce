import React from 'react';

const ImageSlide = React.forwardRef(({ src, alt, caption }, ref) => (
  <div
    ref={ref}
    className="w-full h-[60vh] flex flex-col items-center justify-center opacity-0 scale-95 transition-all duration-500"
    tabIndex={0}
    aria-label={caption}
  >
    <img
      src={src}
      alt={alt}
      className="max-h-[40vh] object-contain rounded-xl shadow-lg"
      loading="lazy"
    />
    {caption && (
      <div className="mt-4 text-lg font-semibold text-gray-800">{caption}</div>
    )}
  </div>
));
export default ImageSlide; 