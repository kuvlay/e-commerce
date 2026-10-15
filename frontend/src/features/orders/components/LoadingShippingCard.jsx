import React from 'react';
import '../styles/shipping-animations.css';

const LoadingShippingCard = ({ className = '', variant = 'default' }) => {
  const getSkeletonClass = () => {
    switch (variant) {
      case 'compact':
        return 'h-4';
      case 'large':
        return 'h-8';
      default:
        return 'h-6';
    }
  };

  return (
    <div className={`shipping-info-container loading ${className}`} aria-busy="true" aria-label="Loading shipping information">
      {/* Header Skeleton */}
      <div className="shipping-info-header">
        <div className="w-6 h-6 bg-gray-200 rounded-full shipping-skeleton" />
        <div className="w-32 h-5 bg-gray-200 rounded shipping-skeleton" />
      </div>

      {/* Content Skeleton */}
      <div className="shipping-detail-grid">
        {/* Carrier Skeleton */}
        <div className="shipping-detail-item">
          <div className="w-16 h-3 bg-gray-200 rounded shipping-skeleton mb-2" />
          <div className="flex items-center justify-between">
            <div className={`w-24 bg-gray-200 rounded shipping-skeleton ${getSkeletonClass()}`} />
            <div className="w-8 h-8 bg-gray-200 rounded shipping-skeleton" />
          </div>
        </div>

        {/* Tracking Skeleton */}
        <div className="shipping-detail-item">
          <div className="w-20 h-3 bg-gray-200 rounded shipping-skeleton mb-2" />
          <div className="flex items-center justify-between">
            <div className={`w-32 bg-gray-200 rounded shipping-skeleton ${getSkeletonClass()}`} />
            <div className="w-8 h-8 bg-gray-200 rounded shipping-skeleton" />
          </div>
        </div>

        {/* Date Skeleton */}
        <div className="shipping-detail-item">
          <div className="w-18 h-3 bg-gray-200 rounded shipping-skeleton mb-2" />
          <div className={`w-28 bg-gray-200 rounded shipping-skeleton ${getSkeletonClass()}`} />
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="w-32 h-10 bg-gray-200 rounded-lg shipping-skeleton" />
        <div className="w-28 h-10 bg-gray-200 rounded-lg shipping-skeleton" />
      </div>

      {/* Screen Reader Text */}
      <div className="shipping-sr-only">
        Loading shipping information, please wait...
      </div>
    </div>
  );
};

export default LoadingShippingCard;