import { useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { cartBounce, slideIn, fadeIn, pulse, countUp } from '../../../core/utils/animations.js';

/**
 * Custom hook for cart-related animations
 * Provides functions to animate cart interactions
 */
export const useCartAnimations = () => {
  const cartIconRef = useRef(null);
  const cartDrawerRef = useRef(null);

  // Animate cart icon when item is added
  const animateCartAdd = useCallback((customElement = null) => {
    const element = customElement || cartIconRef.current;
    if (element && element.nodeType === Node.ELEMENT_NODE) {
      cartBounce(element, {
        duration: 'bounce',
        easing: 'bounce'
      });
    }
  }, []);

  // Animate cart drawer slide-in
  const animateCartDrawerOpen = useCallback((customElement = null) => {
    const element = customElement || cartDrawerRef.current;
    if (element && element.nodeType === Node.ELEMENT_NODE) {
      slideIn(element, {
        direction: 'right',
        duration: 'normal',
        easing: 'smooth'
      });
    }
  }, []);

  // Animate item removal with fade out
  const animateItemRemoval = useCallback((element, onComplete = null) => {
    if (element && element.nodeType === Node.ELEMENT_NODE) {
      // First fade out the item
      gsap.to(element, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          // Then slide up to collapse the space
          gsap.to(element, {
            height: 0,
            marginTop: 0,
            marginBottom: 0,
            paddingTop: 0,
            paddingBottom: 0,
            duration: 0.2,
            ease: "power2.out",
            onComplete: onComplete
          });
        }
      });
    } else if (onComplete) {
      // If element is invalid, still call the callback
      onComplete();
    }
  }, []);

  // Animate quantity changes with pulse effect and number counting
  const animateQuantityChange = useCallback((element, fromValue, toValue) => {
    if (element && element.nodeType === Node.ELEMENT_NODE) {
      // First pulse the element to draw attention
      pulse(element, {
        scale: 1.1,
        duration: 'fast',
        repeat: 1
      });

      // If we have from and to values, animate the number counting
      if (fromValue !== undefined && toValue !== undefined && fromValue !== toValue) {
        countUp(element, {
          from: fromValue,
          to: toValue,
          duration: 'normal',
          easing: 'smooth',
          onUpdate: (currentValue) => {
            if (element && element.value !== undefined) {
              element.value = Math.round(currentValue);
            }
          }
        });
      }
    }
  }, []);

  // Animate total price changes with highlight and number counting
  const animateTotalChange = useCallback((element, fromValue, toValue, currency = '') => {
    if (element) {
      // Add a temporary highlight background
      const originalBg = element.style.backgroundColor || 'transparent';
      element.style.backgroundColor = '#fef3c7'; // yellow-100
      
      gsap.to(element, {
        backgroundColor: originalBg,
        duration: 1,
        ease: "power2.out"
      });
      
      // Pulse animation for visual feedback
      pulse(element, {
        scale: 1.02,
        duration: 'fast',
        repeat: 1
      });

      // If we have from and to values, animate the number counting
      if (fromValue !== undefined && toValue !== undefined && fromValue !== toValue) {
        countUp(element, {
          from: fromValue,
          to: toValue,
          duration: 'normal',
          easing: 'smooth',
          onUpdate: (currentValue) => {
            element.textContent = `${currency}${Math.round(currentValue)}.00`;
          }
        });
      }
    }
  }, []);

  // Animate cart count changes in navbar
  const animateCartCountChange = useCallback((element, fromValue, toValue) => {
    if (element && fromValue !== undefined && toValue !== undefined && fromValue !== toValue) {
      // Pulse the cart count
      pulse(element, {
        scale: 1.2,
        duration: 'fast',
        repeat: 1
      });

      // Animate the number counting
      countUp(element, {
        from: fromValue,
        to: toValue,
        duration: 'fast',
        easing: 'smooth',
        onUpdate: (currentValue) => {
          element.textContent = Math.round(currentValue);
        }
      });
    }
  }, []);

  // Animate item addition with success feedback
  const animateItemAdded = useCallback((element) => {
    if (element) {
      // Success pulse with green color
      const originalBg = element.style.backgroundColor || 'transparent';
      element.style.backgroundColor = '#dcfce7'; // green-100
      
      gsap.to(element, {
        backgroundColor: originalBg,
        duration: 1.5,
        ease: "power2.out"
      });
      
      // Scale and bounce effect
      gsap.fromTo(element, 
        { scale: 1 },
        { 
          scale: 1.1, 
          duration: 0.2, 
          ease: "back.out(1.7)",
          yoyo: true,
          repeat: 1
        }
      );
    }
  }, []);

  // Animate price changes with color coding
  const animatePriceChange = useCallback((element, fromValue, toValue, currency = '') => {
    if (element && fromValue !== undefined && toValue !== undefined && fromValue !== toValue) {
      // Color code based on price change
      const isIncrease = toValue > fromValue;
      const color = isIncrease ? '#fef3c7' : '#fee2e2'; // yellow-100 for increase, red-100 for decrease
      
      const originalBg = element.style.backgroundColor || 'transparent';
      element.style.backgroundColor = color;
      
      gsap.to(element, {
        backgroundColor: originalBg,
        duration: 1.2,
        ease: "power2.out"
      });
      
      // Animate the number counting
      countUp(element, {
        from: fromValue,
        to: toValue,
        duration: 'normal',
        easing: 'smooth',
        onUpdate: (currentValue) => {
          element.textContent = `${currency}${Math.round(currentValue)}.00`;
        }
      });
    }
  }, []);

  // Cleanup function to kill all animations
  const cleanupAnimations = useCallback(() => {
    if (cartIconRef.current) {
      gsap.killTweensOf(cartIconRef.current);
    }
    if (cartDrawerRef.current) {
      gsap.killTweensOf(cartDrawerRef.current);
    }
  }, []);

  return {
    cartIconRef,
    cartDrawerRef,
    animateCartAdd,
    animateCartDrawerOpen,
    animateItemRemoval,
    animateQuantityChange,
    animateTotalChange,
    animateCartCountChange,
    animateItemAdded,
    animatePriceChange,
    cleanupAnimations
  };
};