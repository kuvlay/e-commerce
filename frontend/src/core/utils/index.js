/**
 * Utilities index file
 * Exports all utility functions and configurations
 */

// Animation utilities
export {
  animationConfig,
  prefersReducedMotion,
  getAnimationDuration,
  getAnimationEasing
} from './animationConfig.js';

export {
  fadeInUp,
  fadeInLeft,
  fadeIn,
  staggerFadeIn,
  scaleOnHover,
  cartBounce,
  slideIn,
  countUp,
  pulse,
  shake,
  spin,
  killAnimations,
  createTimeline
} from './animations.js';

// Authentication utilities
export {
  isValidToken,
  getValidToken,
  clearAuthState,
  logout
} from './authUtils.js';