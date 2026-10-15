import React from 'react';

const ProductSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="overflow-hidden rounded">
        <div className="loading-skeleton w-full h-48 bg-gray-200"></div>
      </div>
      <div className="pt-3 pb-1">
        <div className="loading-skeleton h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      </div>
      <div className="loading-skeleton h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
};

export default ProductSkeleton;