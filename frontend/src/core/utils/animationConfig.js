/**
 * Animation configuration constants for consistent timing and easing
 */

export const animationConfig = {
  // Duration presets in seconds
  durations: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    page: 0.4,
    hover: 0.15,
    bounce: 0.6
  },

  // GSAP easing presets
  easings: {
    smooth: "power2.out",
    smoothIn: "power2.in",
    smoothInOut: "power2.inOut",
    bounce: "back.out(1.7)",
    elastic: "elastic.out(1, 0.3)",
    quick: "power1.out",
    gentle: "power3.out"
  },

  // Stagger timing for multiple elements
  stagger: {
    cards: 0.1,
    text: 0.05,
    buttons: 0.15,
    list: 0.08,
    grid: 0.12
  },

  // Transform values for consistent scaling and movement
  transforms: {
    scaleHover: 1.02,
    scalePress: 0.98,
    translateY: 20,
    translateX: 30
  },

  // Opacity values
  opacity: {
    hidden: 0,
    visible: 1,
    dimmed: 0.7
  }
};

// Reduced motion media query check
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Check if device is mobile
export const isMobileDevice = () => {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Get animation duration based on user preference and device
export const getAnimationDuration = (duration) => {
  if (prefersReducedMotion()) return 0.01;
  
  // Reduce animation duration on mobile for better performance
  const baseDuration = animationConfig.durations[duration] || duration;
  return isMobileDevice() ? baseDuration * 0.7 : baseDuration;
};

// Get animation easing based on user preference and device
export const getAnimationEasing = (easing) => {
  if (prefersReducedMotion()) return "none";
  
  // Use simpler easing on mobile for better performance
  return isMobileDevice() ? "power1.out" : (animationConfig.easings[easing] || easing);
};