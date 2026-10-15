import { gsap } from 'gsap';
import { animationConfig, getAnimationDuration, getAnimationEasing, prefersReducedMotion } from './animationConfig.js';

/**
 * Core animation utilities using GSAP
 * All animations respect reduced motion preferences
 */

// Fade in animation with upward movement
export const fadeInUp = (element, options = {}) => {
  const {
    delay = 0,
    duration = 'normal',
    distance = animationConfig.transforms.translateY,
    easing = 'smooth'
  } = options;

  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, y: 0 });
    return;
  }

  gsap.fromTo(element, 
    {
      opacity: animationConfig.opacity.hidden,
      y: distance
    },
    {
      opacity: animationConfig.opacity.visible,
      y: 0,
      duration: getAnimationDuration(duration),
      ease: getAnimationEasing(easing),
      delay
    }
  );
};

// Fade in animation with leftward movement
export const fadeInLeft = (element, options = {}) => {
  const {
    delay = 0,
    duration = 'normal',
    distance = animationConfig.transforms.translateX,
    easing = 'smooth'
  } = options;

  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, x: 0 });
    return;
  }

  gsap.fromTo(element,
    {
      opacity: animationConfig.opacity.hidden,
      x: distance
    },
    {
      opacity: animationConfig.opacity.visible,
      x: 0,
      duration: getAnimationDuration(duration),
      ease: getAnimationEasing(easing),
      delay
    }
  );
};

// Simple fade in animation
export const fadeIn = (element, options = {}) => {
  const {
    delay = 0,
    duration = 'normal',
    easing = 'smooth'
  } = options;

  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1 });
    return;
  }

  gsap.fromTo(element,
    {
      opacity: animationConfig.opacity.hidden
    },
    {
      opacity: animationConfig.opacity.visible,
      duration: getAnimationDuration(duration),
      ease: getAnimationEasing(easing),
      delay
    }
  );
};

// Staggered fade in animation for multiple elements
export const staggerFadeIn = (elements, options = {}) => {
  const {
    stagger = animationConfig.stagger.cards,
    duration = 'normal',
    easing = 'smooth',
    direction = 'up'
  } = options;

  if (prefersReducedMotion()) {
    gsap.set(elements, { opacity: 1, y: 0, x: 0 });
    return;
  }

  const fromProps = {
    opacity: animationConfig.opacity.hidden
  };

  const toProps = {
    opacity: animationConfig.opacity.visible,
    duration: getAnimationDuration(duration),
    ease: getAnimationEasing(easing),
    stagger
  };

  // Add directional movement
  if (direction === 'up') {
    fromProps.y = animationConfig.transforms.translateY;
    toProps.y = 0;
  } else if (direction === 'left') {
    fromProps.x = animationConfig.transforms.translateX;
    toProps.x = 0;
  }

  gsap.fromTo(elements, fromProps, toProps);
};

// Scale animation for hover effects
export const scaleOnHover = (element, options = {}) => {
  const {
    scale = animationConfig.transforms.scaleHover,
    duration = 'hover',
    easing = 'quick'
  } = options;

  if (prefersReducedMotion()) {
    return;
  }

  const tl = gsap.timeline({ paused: true });
  
  tl.to(element, {
    scale,
    duration: getAnimationDuration(duration),
    ease: getAnimationEasing(easing)
  });

  return {
    play: () => tl.play(),
    reverse: () => tl.reverse()
  };
};

// Cart bounce animation
export const cartBounce = (element, options = {}) => {
  const {
    duration = 'bounce',
    easing = 'bounce'
  } = options;

  if (prefersReducedMotion()) {
    return;
  }

  gsap.fromTo(element,
    {
      scale: 1
    },
    {
      scale: 1.2,
      duration: getAnimationDuration(duration) / 2,
      ease: getAnimationEasing(easing),
      yoyo: true,
      repeat: 1
    }
  );
};

// Slide in animation (for drawers, modals)
export const slideIn = (element, options = {}) => {
  const {
    direction = 'right',
    duration = 'normal',
    easing = 'smooth',
    distance = '100%'
  } = options;

  if (prefersReducedMotion()) {
    gsap.set(element, { x: 0, y: 0, opacity: 1 });
    return;
  }

  const fromProps = { opacity: animationConfig.opacity.hidden };
  const toProps = {
    opacity: animationConfig.opacity.visible,
    duration: getAnimationDuration(duration),
    ease: getAnimationEasing(easing)
  };

  // Set initial position based on direction
  switch (direction) {
    case 'right':
      fromProps.x = distance;
      toProps.x = 0;
      break;
    case 'left':
      fromProps.x = `-${distance}`;
      toProps.x = 0;
      break;
    case 'up':
      fromProps.y = distance;
      toProps.y = 0;
      break;
    case 'down':
      fromProps.y = `-${distance}`;
      toProps.y = 0;
      break;
  }

  // Ensure element starts in the correct position
  gsap.set(element, fromProps);
  
  return gsap.to(element, toProps);
};

// Number counting animation
export const countUp = (element, options = {}) => {
  const {
    from = 0,
    to = 100,
    duration = 'slow',
    easing = 'smooth',
    onUpdate = null
  } = options;

  if (prefersReducedMotion()) {
    if (onUpdate) onUpdate(to);
    return;
  }

  const obj = { value: from };
  
  gsap.to(obj, {
    value: to,
    duration: getAnimationDuration(duration),
    ease: getAnimationEasing(easing),
    onUpdate: () => {
      const currentValue = Math.round(obj.value);
      if (element) element.textContent = currentValue;
      if (onUpdate) onUpdate(currentValue);
    }
  });
};

// Pulse animation for highlighting changes
export const pulse = (element, options = {}) => {
  const {
    scale = 1.05,
    duration = 'fast',
    repeat = 1
  } = options;

  if (prefersReducedMotion()) {
    return;
  }

  gsap.fromTo(element,
    {
      scale: 1
    },
    {
      scale,
      duration: getAnimationDuration(duration),
      ease: getAnimationEasing('smoothInOut'),
      yoyo: true,
      repeat
    }
  );
};

// Shake animation for errors
export const shake = (element, options = {}) => {
  const {
    intensity = 10,
    duration = 'fast'
  } = options;

  if (prefersReducedMotion()) {
    return;
  }

  gsap.fromTo(element,
    {
      x: 0
    },
    {
      x: intensity,
      duration: getAnimationDuration(duration) / 4,
      ease: "power2.inOut",
      yoyo: true,
      repeat: 3
    }
  );
};

// Loading spinner animation
export const spin = (element, options = {}) => {
  const {
    duration = 1,
    direction = 1 // 1 for clockwise, -1 for counter-clockwise
  } = options;

  if (prefersReducedMotion()) {
    return;
  }

  return gsap.to(element, {
    rotation: 360 * direction,
    duration,
    ease: "none",
    repeat: -1
  });
};

// Utility to kill all animations on an element
export const killAnimations = (element) => {
  gsap.killTweensOf(element);
};

// Utility to create a master timeline
export const createTimeline = (options = {}) => {
  return gsap.timeline(options);
};