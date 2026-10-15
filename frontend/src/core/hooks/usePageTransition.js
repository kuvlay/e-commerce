import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { fadeIn } from '../utils/animations.js';
import { prefersReducedMotion, getAnimationDuration } from '../utils/animationConfig.js';

/**
 * Custom hook for page transition animations
 * Provides smooth fade-in animations when navigating between pages
 * @param {Object} options - Configuration options for page transitions
 * @returns {Object} - Ref to attach to page container and transition controls
 */
export const usePageTransition = (options = {}) => {
  const {
    duration = 'page',
    delay = 0,
    easing = 'smooth',
    fadeOnMount = true,
    fadeOnLocationChange = true
  } = options;

  const pageRef = useRef(null);
  const location = useLocation();
  const previousLocation = useRef(location.pathname);
  const isInitialMount = useRef(true);

  /**
   * Animate page entrance
   */
  const animatePageIn = useCallback(() => {
    const element = pageRef.current;
    if (!element) return;

    if (prefersReducedMotion()) {
      // For reduced motion, just ensure element is visible
      element.style.opacity = '1';
      return;
    }

    // Set initial state
    element.style.opacity = '0';
    
    // Animate in
    fadeIn(element, {
      duration,
      delay,
      easing
    });
  }, [duration, delay, easing]);

  /**
   * Handle page transitions on location change
   */
  useEffect(() => {
    // Skip animation on initial mount if fadeOnMount is false
    if (isInitialMount.current && !fadeOnMount) {
      isInitialMount.current = false;
      return;
    }

    // Skip animation if location hasn't changed and fadeOnLocationChange is false
    if (previousLocation.current === location.pathname && !fadeOnLocationChange) {
      return;
    }

    // Animate page in
    animatePageIn();

    // Update previous location
    previousLocation.current = location.pathname;
    isInitialMount.current = false;
  }, [location.pathname, animatePageIn, fadeOnMount, fadeOnLocationChange]);

  /**
   * Manually trigger page transition animation
   */
  const triggerTransition = useCallback(() => {
    animatePageIn();
  }, [animatePageIn]);

  /**
   * Reset page to initial state (useful for testing or manual control)
   */
  const resetPage = useCallback(() => {
    const element = pageRef.current;
    if (element) {
      element.style.opacity = '0';
    }
  }, []);

  return {
    ref: pageRef,
    triggerTransition,
    resetPage,
    isTransitioning: false // Could be enhanced to track transition state
  };
};

/**
 * Hook for page transitions with custom fade duration
 * @param {number|string} duration - Animation duration
 * @returns {Object} - Page transition controls
 */
export const usePageFade = (duration = 'page') => {
  return usePageTransition({
    duration,
    fadeOnMount: true,
    fadeOnLocationChange: true
  });
};

/**
 * Hook for page transitions that only animate on route changes (not initial mount)
 * @param {Object} options - Configuration options
 * @returns {Object} - Page transition controls
 */
export const useRouteTransition = (options = {}) => {
  return usePageTransition({
    fadeOnMount: false,
    fadeOnLocationChange: true,
    ...options
  });
};

/**
 * Hook for delayed page transitions (useful for pages with loading states)
 * @param {number} delay - Delay in seconds before animation starts
 * @param {Object} options - Additional configuration options
 * @returns {Object} - Page transition controls
 */
export const useDelayedPageTransition = (delay = 0.1, options = {}) => {
  return usePageTransition({
    delay,
    ...options
  });
};