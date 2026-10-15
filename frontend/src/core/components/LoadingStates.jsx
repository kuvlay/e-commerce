import React from 'react';
import { FaSpinner, FaBox, FaShoppingCart, FaCog } from 'react-icons/fa';
import { COLORS, GRADIENTS } from '../constants/theme';

/**
 * Enhanced loading skeleton for product cards
 */
export const ProductCardSkeleton = ({ count = 1 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-2xl overflow-hidden animate-pulse">
        <div className="aspect-[4/3] bg-gray-200"></div>
        <div className="p-6">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="flex items-center mb-4">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-4 bg-gray-200 rounded w-12 ml-2"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Enhanced loading skeleton for order cards
 */
export const OrderCardSkeleton = ({ count = 3 }) => (
  <div className="space-y-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-3xl overflow-hidden animate-pulse">
        <div className="h-24 bg-gradient-to-r from-gray-200 to-gray-300"></div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Inline loading spinner with customizable size and message
 */
export const InlineLoader = ({ 
  size = 'md', 
  message = 'Loading...', 
  color = COLORS.primary,
  showMessage = true 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <FaSpinner 
        className={`${sizeClasses[size]} animate-spin`}
        style={{ color }}
      />
      {showMessage && (
        <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
          {message}
        </span>
      )}
    </div>
  );
};

/**
 * Full page loading overlay
 */
export const PageLoader = ({ message = 'Loading page...', transparent = false }) => (
  <div className={`fixed inset-0 z-50 flex items-center justify-center ${
    transparent ? 'bg-white/80 backdrop-blur-sm' : 'bg-white'
  }`}>
    <div className="text-center">
      <div className="relative mb-6">
        <div 
          className="w-16 h-16 rounded-full animate-spin"
          style={{ 
            background: `conic-gradient(from 0deg, ${COLORS.primary}, ${COLORS.secondary}, ${COLORS.primary})` 
          }}
        ></div>
        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
          <FaBox className="w-6 h-6" style={{ color: COLORS.primary }} />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.textPrimary }}>
        {message}
      </h3>
      <p className="text-sm" style={{ color: COLORS.textSecondary }}>
        Please wait while we load your content
      </p>
    </div>
  </div>
);

/**
 * Component-level loading state
 */
export const ComponentLoader = ({ 
  message = 'Loading component...', 
  height = 'h-64',
  icon: Icon = FaCog 
}) => (
  <div className={`${height} flex items-center justify-center bg-gray-50 rounded-2xl`}>
    <div className="text-center">
      <Icon className="w-8 h-8 mx-auto mb-3 animate-spin text-gray-400" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
);

/**
 * Button loading state
 */
export const ButtonLoader = ({ size = 'sm', color = 'white' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <FaSpinner 
      className={`${sizeClasses[size]} animate-spin`}
      style={{ color }}
    />
  );
};