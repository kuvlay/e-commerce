import React from 'react';
import { FaSpinner } from 'react-icons/fa';
import '../styles/admin-shipping-animations.css';

const LoadingShippingForm = ({ className = '', message = 'Loading shipping form...' }) => {
  return (
    <div className={`admin-shipping-form loading ${className}`} aria-busy="true" aria-label={message}>
      {/* Header Skeleton */}
      <div className="admin-shipping-form-header">
        <div className="admin-shipping-form-title">
          <div className="w-5 h-5 bg-gray-200 rounded admin-shipping-skeleton" />
          <div className="w-32 h-5 bg-gray-200 rounded admin-shipping-skeleton" />
          <div className="w-3 h-3 bg-gray-200 rounded-full admin-shipping-skeleton" />
        </div>
        <div className="w-20 h-6 bg-gray-200 rounded-full admin-shipping-skeleton" />
      </div>

      {/* Input Group Skeleton */}
      <div className="admin-shipping-input-group">
        {/* Carrier Input Skeleton */}
        <div className="admin-shipping-input-wrapper">
          <div className="w-full h-12 bg-gray-200 rounded-lg admin-shipping-skeleton" />
          <div className="absolute top-0 left-3 w-16 h-4 bg-gray-100 rounded admin-shipping-skeleton" style={{ marginTop: '-0.5rem' }} />
        </div>

        {/* Tracking Input Skeleton */}
        <div className="admin-shipping-input-wrapper">
          <div className="w-full h-12 bg-gray-200 rounded-lg admin-shipping-skeleton" />
          <div className="absolute top-0 left-3 w-20 h-4 bg-gray-100 rounded admin-shipping-skeleton" style={{ marginTop: '-0.5rem' }} />
        </div>
      </div>

      {/* Button Group Skeleton */}
      <div className="admin-shipping-button-group">
        <div className="w-32 h-11 bg-gray-200 rounded-lg admin-shipping-skeleton" />
      </div>

      {/* Help Text Skeleton */}
      <div className="w-3/4 h-3 bg-gray-200 rounded admin-shipping-skeleton mt-2" />

      {/* Loading Overlay */}
      <div className="admin-shipping-loading-overlay">
        <div className="admin-shipping-loading-spinner-container">
          <div className="admin-shipping-loading-pulse" />
          <div className="admin-shipping-loading-text">
            {message}
          </div>
        </div>
      </div>

      {/* Screen Reader Text */}
      <div className="admin-shipping-sr-only">
        {message}
      </div>
    </div>
  );
};

export default LoadingShippingForm;