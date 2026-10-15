import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { fadeInUp, staggerFadeIn, fadeIn, fadeInLeft } from '../utils/animations.js';
import { prefersReducedMotion } from '../utils/animationConfig.js';

/**
 * Custom hook for scroll-triggered animations using Intersection Observer
 * @param {Object} options - Animation configuration options
 * @returns {Object} - Ref to attach to element and animation controls
 */
export const useScrollAnimation = (options = {}) => {
  const {
    animation = 'fadeInUp',
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
    stagger = false,
    staggerDelay = 0.1,
    animationOptions = {}
  } = options;

  const elementRef = useRef(null);
  const observerRef = useRef(null);
  const hasAnimated = useRef(false);

  const animateElement = useCallback((element) => {
    if (prefersReducedMotion()) {
      // For reduced motion, just ensure element is visible
      element.style.opacity = '1';
      element.style.transform = 'none';
      return;
    }

    // Handle different animation types
    switch (animation) {
      case 'fadeInUp':
        fadeInUp(element, animationOptions);
        break;
      case 'fadeIn':
        fadeIn(element, animationOptions);
        break;
      case 'fadeInLeft':
        fadeInLeft(element, animationOptions);
        break;
      case 'stagger':
        // For stagger animations, element should contain multiple children
        const children = element.children;
        if (children.length > 0) {
          staggerFadeIn(children, {
            stagger: staggerDelay,
            ...animationOptions
          });
        }
        break;
      default:
        fadeInUp(element, animationOptions);
    }
  }, [animation, animationOptions, staggerDelay]);

  const handleIntersection = useCallback((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!hasAnimated.current || !triggerOnce) {
          animateElement(entry.target);
          hasAnimated.current = true;
        }
        
        // If triggerOnce is true, stop observing after first animation
        if (triggerOnce && observerRef.current) {
          observerRef.current.unobserve(entry.target);
        }
      }
    });
  }, [animateElement, triggerOnce]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create Intersection Observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    });

    // Start observing
    observerRef.current.observe(element);

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      // Kill any running GSAP animations on this element
      if (element) {
        gsap.killTweensOf(element);
      }
    };
  }, [handleIntersection, threshold, rootMargin]);

  // Reset animation state (useful for dynamic content)
  const resetAnimation = useCallback(() => {
    hasAnimated.current = false;
    const element = elementRef.current;
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  // Manually trigger animation (bypass intersection observer)
  const triggerAnimation = useCallback(() => {
    const element = elementRef.current;
    if (element) {
      animateElement(element);
      hasAnimated.current = true;
    }
  }, [animateElement]);

  return {
    ref: elementRef,
    resetAnimation,
    triggerAnimation,
    hasAnimated: hasAnimated.current
  };
};

/**
 * Hook specifically for staggered animations of multiple elements
 * @param {Object} options - Stagger animation options
 * @returns {Object} - Ref and controls for staggered animations
 */
export const useStaggerAnimation = (options = {}) => {
  return useScrollAnimation({
    animation: 'stagger',
    staggerDelay: 0.1,
    ...options
  });
};

/**
 * Hook for fade-in-up animations (most common scroll animation)
 * @param {Object} options - Animation options
 * @returns {Object} - Ref and controls
 */
export const useFadeInUp = (options = {}) => {
  return useScrollAnimation({
    animation: 'fadeInUp',
    ...options
  });
};

/**
 * Hook for simple fade-in animations
 * @param {Object} options - Animation options
 * @returns {Object} - Ref and controls
 */
export const useFadeIn = (options = {}) => {
  return useScrollAnimation({
    animation: 'fadeIn',
    ...options
  });
};

/**
 * Hook for fade-in-left animations
 * @param {Object} options - Animation options
 * @returns {Object} - Ref and controls
 */
export const useFadeInLeft = (options = {}) => {
  return useScrollAnimation({
    animation: 'fadeInLeft',
    ...options
  });
};