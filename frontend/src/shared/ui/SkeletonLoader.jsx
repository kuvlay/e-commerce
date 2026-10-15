import React from 'react';

// YouTube-style shimmer animation keyframes
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -468px 0;
    }
    100% {
      background-position: 468px 0;
    }
  }
  
  .shimmer {
    background: linear-gradient(90deg, #f0f0f0 0%, #e8e8e8 20%, #f0f0f0 40%, #f0f0f0 100%);
    background-size: 800px 104px;
    animation: shimmer 2.2s infinite ease-out;
    position: relative;
    overflow: hidden;
  }
  
  .shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
    animation: shimmer-overlay 2.2s infinite ease-out;
  }
  
  @keyframes shimmer-overlay {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

// Product Card Skeleton
export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <style>{shimmerStyles}</style>
      
      {/* Image skeleton with aspect ratio matching ProductCard */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <div className="shimmer w-full h-full bg-gray-200"></div>
        
        {/* Badge skeleton */}
        <div className="absolute top-4 left-4">
          <div className="shimmer h-6 bg-gray-300 rounded-full w-20"></div>
        </div>
        
        {/* Heart icon skeleton */}
        <div className="absolute top-4 right-4">
          <div className="shimmer w-9 h-9 bg-gray-300 rounded-full"></div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-6">
        {/* Category skeleton */}
        <div className="shimmer h-4 bg-gray-200 rounded w-24 mb-2"></div>
        
        {/* Product name skeleton */}
        <div className="shimmer h-6 bg-gray-200 rounded mb-1"></div>
        <div className="shimmer h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        
        {/* Rating skeleton */}
        <div className="flex items-center mb-4">
          <div className="flex space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shimmer w-4 h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="shimmer h-4 bg-gray-200 rounded w-12 ml-2"></div>
        </div>
        
        {/* Price skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="shimmer h-8 bg-gray-200 rounded w-16"></div>
            <div className="shimmer h-5 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="shimmer h-6 bg-gray-200 rounded-full w-12"></div>
        </div>
        
        {/* Buttons skeleton */}
        <div className="space-y-3">
          <div className="shimmer h-12 bg-gray-200 rounded-xl w-full"></div>
          <div className="shimmer h-12 bg-gray-200 rounded-xl w-full"></div>
        </div>
      </div>
    </div>
  );
};

// Hero Banner Skeleton
export const HeroBannerSkeleton = () => {
  return (
    <div className="relative h-screen w-full bg-gray-100">
      <style>{shimmerStyles}</style>
      
      {/* Background image skeleton */}
      <div className="shimmer absolute inset-0 bg-gray-200"></div>
      
      {/* Content overlay skeleton */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center max-w-4xl px-6">
          {/* Main title skeleton */}
          <div className="shimmer h-16 bg-gray-300 rounded mb-6 mx-auto max-w-2xl"></div>
          <div className="shimmer h-16 bg-gray-300 rounded mb-8 mx-auto max-w-xl"></div>
          
          {/* Subtitle skeleton */}
          <div className="shimmer h-6 bg-gray-300 rounded mb-2 mx-auto max-w-lg"></div>
          <div className="shimmer h-6 bg-gray-300 rounded mb-8 mx-auto max-w-md"></div>
          
          {/* Button skeleton */}
          <div className="shimmer h-14 bg-gray-300 rounded-full mx-auto max-w-xs"></div>
        </div>
      </div>
    </div>
  );
};

// Product Grid Skeleton
export const ProductGridSkeleton = ({ count = 6 }) => {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-24">
      <style>{shimmerStyles}</style>
      
      {/* Header skeleton */}
      <div className="text-center mb-20">
        <div className="shimmer h-8 bg-gray-200 rounded-full mx-auto max-w-xs mb-6"></div>
        <div className="shimmer h-12 bg-gray-200 rounded mx-auto max-w-md mb-4"></div>
        <div className="shimmer h-12 bg-gray-200 rounded mx-auto max-w-lg mb-6"></div>
        <div className="shimmer h-6 bg-gray-200 rounded mx-auto max-w-2xl mb-2"></div>
        <div className="shimmer h-6 bg-gray-200 rounded mx-auto max-w-xl mb-8"></div>
        <div className="shimmer h-1 bg-gray-200 rounded-full mx-auto max-w-24"></div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-16">
        {Array.from({ length: count }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>

      {/* Button skeleton */}
      <div className="text-center">
        <div className="shimmer h-14 bg-gray-200 rounded-full mx-auto max-w-xs"></div>
      </div>
    </section>
  );
};

// Reviews Section Skeleton
export const ReviewsSkeleton = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-24">
      <style>{shimmerStyles}</style>
      
      {/* Header skeleton */}
      <div className="text-center mb-16">
        <div className="shimmer h-8 bg-gray-200 rounded-full mx-auto max-w-xs mb-6"></div>
        <div className="shimmer h-12 bg-gray-200 rounded mx-auto max-w-md mb-6"></div>
        <div className="shimmer h-6 bg-gray-200 rounded mx-auto max-w-2xl"></div>
      </div>

      {/* Reviews grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
            {/* Stars skeleton */}
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="shimmer w-5 h-5 bg-gray-200 rounded"></div>
              ))}
            </div>
            
            {/* Review text skeleton */}
            <div className="shimmer h-4 bg-gray-200 rounded mb-2"></div>
            <div className="shimmer h-4 bg-gray-200 rounded mb-2"></div>
            <div className="shimmer h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            
            {/* User info skeleton */}
            <div className="flex items-center gap-3">
              <div className="shimmer w-10 h-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="shimmer h-4 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="shimmer h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Scroll Image Section Skeleton
export const ScrollImageSkeleton = () => {
  return (
    <section className="w-full py-24">
      <style>{shimmerStyles}</style>
      
      <div className="max-w-7xl mx-auto px-6">
        {/* Header skeleton */}
        <div className="text-center mb-16">
          <div className="shimmer h-8 bg-gray-200 rounded-full mx-auto max-w-xs mb-6"></div>
          <div className="shimmer h-12 bg-gray-200 rounded mx-auto max-w-md mb-6"></div>
          <div className="shimmer h-6 bg-gray-200 rounded mx-auto max-w-2xl"></div>
        </div>

        {/* Features grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="text-center">
              <div className="shimmer w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="shimmer h-6 bg-gray-200 rounded mx-auto max-w-32 mb-2"></div>
              <div className="shimmer h-4 bg-gray-200 rounded mx-auto max-w-40 mb-1"></div>
              <div className="shimmer h-4 bg-gray-200 rounded mx-auto max-w-36"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Generic skeleton for any content
export const ContentSkeleton = ({ lines = 3, className = "" }) => {
  return (
    <div className={className}>
      <style>{shimmerStyles}</style>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index} 
          className={`shimmer h-4 bg-gray-200 rounded mb-2 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
};

export default {
  ProductCardSkeleton,
  HeroBannerSkeleton,
  ProductGridSkeleton,
  ReviewsSkeleton,
  ScrollImageSkeleton,
  ContentSkeleton
};