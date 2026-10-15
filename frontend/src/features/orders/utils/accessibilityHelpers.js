// Accessibility helpers for shipping components

/**
 * Announces text to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Manages focus for keyboard navigation
 */
export class FocusManager {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.focusableElements = [];
    this.currentIndex = -1;
  }

  updateFocusableElements() {
    if (!this.container) return;
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    this.focusableElements = Array.from(
      this.container.querySelectorAll(focusableSelectors.join(', '))
    ).filter(el => {
      // Check if element is visible
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  focusFirst() {
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      this.currentIndex = 0;
      this.focusableElements[0].focus();
      return true;
    }
    return false;
  }

  focusLast() {
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      this.currentIndex = this.focusableElements.length - 1;
      this.focusableElements[this.currentIndex].focus();
      return true;
    }
    return false;
  }

  focusNext() {
    this.updateFocusableElements();
    if (this.focusableElements.length === 0) return false;
    
    this.currentIndex = (this.currentIndex + 1) % this.focusableElements.length;
    this.focusableElements[this.currentIndex].focus();
    return true;
  }

  focusPrevious() {
    this.updateFocusableElements();
    if (this.focusableElements.length === 0) return false;
    
    this.currentIndex = this.currentIndex <= 0 
      ? this.focusableElements.length - 1 
      : this.currentIndex - 1;
    this.focusableElements[this.currentIndex].focus();
    return true;
  }
}

/**
 * Creates accessible keyboard navigation for shipping forms
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Configuration options
 */
export const setupKeyboardNavigation = (container, options = {}) => {
  const {
    onEscape = null,
    onEnter = null,
    trapFocus = false,
    announceNavigation = true
  } = options;

  const focusManager = new FocusManager(container);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Tab':
        if (trapFocus) {
          e.preventDefault();
          if (e.shiftKey) {
            focusManager.focusPrevious();
          } else {
            focusManager.focusNext();
          }
          
          if (announceNavigation) {
            const activeElement = document.activeElement;
            const label = activeElement.getAttribute('aria-label') || 
                         activeElement.getAttribute('placeholder') ||
                         activeElement.textContent?.trim() ||
                         'Interactive element';
            announceToScreenReader(`Focused on ${label}`, 'polite');
          }
        }
        break;
        
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape(e);
        }
        break;
        
      case 'Enter':
        if (onEnter && e.target.tagName !== 'BUTTON') {
          e.preventDefault();
          onEnter(e);
        }
        break;
        
      case 'ArrowDown':
      case 'ArrowRight':
        if (e.target.tagName === 'BUTTON' || e.target.hasAttribute('role')) {
          e.preventDefault();
          focusManager.focusNext();
        }
        break;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        if (e.target.tagName === 'BUTTON' || e.target.hasAttribute('role')) {
          e.preventDefault();
          focusManager.focusPrevious();
        }
        break;
        
      case 'Home':
        if (e.ctrlKey || e.target.tagName === 'BUTTON') {
          e.preventDefault();
          focusManager.focusFirst();
        }
        break;
        
      case 'End':
        if (e.ctrlKey || e.target.tagName === 'BUTTON') {
          e.preventDefault();
          focusManager.focusLast();
        }
        break;
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Validates and enhances form accessibility
 * @param {HTMLFormElement} form - Form element to enhance
 */
export const enhanceFormAccessibility = (form) => {
  const inputs = form.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    // Ensure proper labeling
    if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
      const label = form.querySelector(`label[for="${input.id}"]`);
      if (label) {
        input.setAttribute('aria-labelledby', label.id || `label-${input.id}`);
        if (!label.id) {
          label.id = `label-${input.id}`;
        }
      }
    }
    
    // Add required field announcements
    if (input.hasAttribute('required')) {
      const currentLabel = input.getAttribute('aria-label') || '';
      if (!currentLabel.includes('required')) {
        input.setAttribute('aria-label', `${currentLabel} (required)`.trim());
      }
    }
    
    // Enhance error handling
    const errorElement = form.querySelector(`[id*="${input.id}"][id*="error"]`);
    if (errorElement) {
      input.setAttribute('aria-describedby', errorElement.id);
      input.setAttribute('aria-invalid', 'true');
    }
  });
  
  // Add form submission feedback
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    const originalSubmit = form.onsubmit;
    form.onsubmit = (e) => {
      announceToScreenReader('Form submitted, processing...', 'assertive');
      if (originalSubmit) {
        return originalSubmit.call(form, e);
      }
    };
  }
};

/**
 * Creates accessible loading states
 * @param {HTMLElement} element - Element to make loading
 * @param {string} message - Loading message
 */
export const setLoadingState = (element, message = 'Loading...') => {
  element.setAttribute('aria-busy', 'true');
  element.setAttribute('aria-live', 'polite');
  
  // Add screen reader text
  const srText = document.createElement('span');
  srText.className = 'sr-only';
  srText.textContent = message;
  srText.id = `loading-${Date.now()}`;
  element.appendChild(srText);
  
  element.setAttribute('aria-describedby', srText.id);
  
  return () => {
    element.removeAttribute('aria-busy');
    element.removeAttribute('aria-live');
    element.removeAttribute('aria-describedby');
    if (srText.parentNode) {
      srText.parentNode.removeChild(srText);
    }
  };
};

/**
 * Manages high contrast mode detection and styling
 */
export const setupHighContrastSupport = () => {
  const mediaQuery = window.matchMedia('(prefers-contrast: high)');
  
  const updateContrastMode = (e) => {
    if (e.matches) {
      document.documentElement.classList.add('high-contrast');
      announceToScreenReader('High contrast mode detected', 'polite');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };
  
  // Initial check
  updateContrastMode(mediaQuery);
  
  // Listen for changes
  mediaQuery.addListener(updateContrastMode);
  
  return () => {
    mediaQuery.removeListener(updateContrastMode);
  };
};

/**
 * Manages reduced motion preferences
 */
export const setupReducedMotionSupport = () => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  const updateMotionPreference = (e) => {
    if (e.matches) {
      document.documentElement.classList.add('reduced-motion');
      // Disable animations in CSS
      const style = document.createElement('style');
      style.textContent = `
        .reduced-motion *,
        .reduced-motion *::before,
        .reduced-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  };
  
  // Initial check
  updateMotionPreference(mediaQuery);
  
  // Listen for changes
  mediaQuery.addListener(updateMotionPreference);
  
  return () => {
    mediaQuery.removeListener(updateMotionPreference);
  };
};

/**
 * Creates accessible tooltips with proper ARIA attributes
 * @param {HTMLElement} trigger - Trigger element
 * @param {HTMLElement} tooltip - Tooltip element
 */
export const setupAccessibleTooltip = (trigger, tooltip) => {
  const tooltipId = `tooltip-${Date.now()}`;
  tooltip.id = tooltipId;
  tooltip.setAttribute('role', 'tooltip');
  tooltip.setAttribute('aria-hidden', 'true');
  
  trigger.setAttribute('aria-describedby', tooltipId);
  
  const showTooltip = () => {
    tooltip.setAttribute('aria-hidden', 'false');
    announceToScreenReader(tooltip.textContent, 'polite');
  };
  
  const hideTooltip = () => {
    tooltip.setAttribute('aria-hidden', 'true');
  };
  
  trigger.addEventListener('mouseenter', showTooltip);
  trigger.addEventListener('mouseleave', hideTooltip);
  trigger.addEventListener('focus', showTooltip);
  trigger.addEventListener('blur', hideTooltip);
  
  return () => {
    trigger.removeEventListener('mouseenter', showTooltip);
    trigger.removeEventListener('mouseleave', hideTooltip);
    trigger.removeEventListener('focus', showTooltip);
    trigger.removeEventListener('blur', hideTooltip);
  };
};

/**
 * Validates color contrast ratios
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {Object} Contrast ratio and compliance info
 */
export const checkColorContrast = (foreground, background) => {
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  const getLuminance = (rgb) => {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  
  if (!fg || !bg) return null;
  
  const fgLum = getLuminance(fg);
  const bgLum = getLuminance(bg);
  
  const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    AA: ratio >= 4.5,
    AAA: ratio >= 7,
    AALarge: ratio >= 3,
    AAALarge: ratio >= 4.5
  };
};

// Export all utilities
export default {
  announceToScreenReader,
  FocusManager,
  setupKeyboardNavigation,
  enhanceFormAccessibility,
  setLoadingState,
  setupHighContrastSupport,
  setupReducedMotionSupport,
  setupAccessibleTooltip,
  checkColorContrast
};