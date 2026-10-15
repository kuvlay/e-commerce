# Utility Functions

This directory contains utility functions for the ecommerce website, including animations and authentication helpers.

## Files Overview

- `animationConfig.js` - Configuration constants for durations, easing, and animation values
- `animations.js` - GSAP-based animation functions for complex animations
- `authUtils.js` - Authentication helper functions for token management
- `index.js` - Main export file for easy importing

## Quick Start

```javascript
// Import specific animations
import { fadeInUp, staggerFadeIn, cartBounce } from '../utils/animations.js';

// Import auth utilities
import { isValidToken, getValidToken, logout } from '../utils/authUtils.js';

// Or import everything from index
import { fadeInUp, isValidToken, logout } from '../utils/index.js';
```

## Animation Functions

### Basic Animations

```javascript
// Fade in with upward movement
fadeInUp(element, { delay: 0.2, duration: 'normal' });

// Fade in from left
fadeInLeft(element, { distance: 30 });

// Simple fade in
fadeIn(element, { duration: 'fast' });
```

### Staggered Animations

```javascript
// Animate multiple elements with stagger
staggerFadeIn(elements, { 
  stagger: 0.1, 
  direction: 'up',
  duration: 'normal' 
});
```

### Interactive Animations

```javascript
// Hover scale effect
const hoverAnimation = scaleOnHover(element);
element.addEventListener('mouseenter', () => hoverAnimation.play());
element.addEventListener('mouseleave', () => hoverAnimation.reverse());

// Cart bounce animation
cartBounce(cartIcon);

// Pulse effect for highlighting
pulse(element, { scale: 1.05, repeat: 1 });
```

### Utility Animations

```javascript
// Number counting animation
countUp(element, { 
  from: 0, 
  to: 100, 
  onUpdate: (value) => console.log(value) 
});

// Slide in animation
slideIn(element, { direction: 'right', distance: '100%' });

// Loading spinner
const spinAnimation = spin(element);
// Stop with: spinAnimation.kill();
```

## CSS Classes

Use these classes directly in your JSX:

```jsx
// Basic animations
<div className="animate-fade-in">Content</div>
<div className="animate-fade-in-up">Content</div>
<div className="animate-fade-in-left">Content</div>

// Interactive effects
<button className="animate-scale-hover">Hover me</button>
<button className="animate-button-press">Click me</button>

// Utility classes
<div className="animate-pulse">Pulsing content</div>
<div className="loading-skeleton">Loading...</div>

// Stagger delays
<div className="animate-fade-in-up stagger-1">Item 1</div>
<div className="animate-fade-in-up stagger-2">Item 2</div>
<div className="animate-fade-in-up stagger-3">Item 3</div>
```

## Configuration

All animations respect user preferences for reduced motion and use consistent timing:

```javascript
import { animationConfig, prefersReducedMotion } from '../utils/animationConfig.js';

// Check if user prefers reduced motion
if (prefersReducedMotion()) {
  // Skip or simplify animations
}

// Use configuration values
const duration = animationConfig.durations.normal; // 0.3s
const easing = animationConfig.easings.smooth; // "power2.out"
```

## CSS Custom Properties

Available CSS variables for consistent styling:

```css
/* Durations */
var(--animation-duration-fast)    /* 0.2s */
var(--animation-duration-normal)  /* 0.3s */
var(--animation-duration-slow)    /* 0.5s */

/* Easing */
var(--animation-easing-smooth)    /* cubic-bezier(0.4, 0, 0.2, 1) */
var(--animation-easing-bounce)    /* cubic-bezier(0.68, -0.55, 0.265, 1.55) */

/* Transform values */
var(--animation-scale-hover)      /* 1.02 */
var(--animation-translate-y)      /* 20px */
```

## Best Practices

1. **Performance**: Use `transform` and `opacity` properties for GPU acceleration
2. **Accessibility**: Always respect `prefers-reduced-motion`
3. **Cleanup**: Kill animations when components unmount using `killAnimations(element)`
4. **Timing**: Keep animations fast (200-500ms) for better UX
5. **Staggering**: Use consistent stagger values from the configuration

## Example Usage in Components

```jsx
import React, { useRef, useEffect } from 'react';
import { fadeInUp, staggerFadeIn } from '../utils/animations.js';

const MyComponent = () => {
  const titleRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    // Animate title
    fadeInUp(titleRef.current, { delay: 0.2 });
    
    // Stagger animate cards
    staggerFadeIn(cardsRef.current, { stagger: 0.1 });
  }, []);

  return (
    <div>
      <h1 ref={titleRef} className="opacity-0">Title</h1>
      {items.map((item, index) => (
        <div 
          key={item.id}
          ref={el => cardsRef.current[index] = el}
          className="opacity-0"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
};
```

## Authentication Utilities

Helper functions for managing authentication state:

```javascript
import { isValidToken, getValidToken, logout } from '../utils/authUtils.js';

// Check if a token is valid
const token = localStorage.getItem('token');
if (isValidToken(token)) {
  // Token is valid
}

// Get a valid token or null
const validToken = getValidToken();

// Perform logout cleanup
logout(); // Clears localStorage and sessionStorage
```

## Requirements Satisfied

This utility system addresses the following requirements:

- **4.3, 4.4**: Consolidated and organized utility functions
- **6.2**: Consistent export/import patterns
- **6.3**: Logical grouping of related utilities
- **Animation Performance**: Fast animations (300-500ms) that don't slow down the site
- **Accessibility**: Full support for `prefers-reduced-motion`
- **Code Organization**: Clear separation of concerns between animations and auth