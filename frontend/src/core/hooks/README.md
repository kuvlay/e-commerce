# Scroll Animation Hooks

This directory contains custom React hooks for implementing scroll-triggered animations using GSAP and Intersection Observer.

## Available Hooks

### `useScrollAnimation(options)`

The main hook for creating scroll-triggered animations. It uses Intersection Observer to detect when elements enter the viewport and triggers GSAP animations.

**Parameters:**
- `options` (Object): Configuration options
  - `animation` (string): Type of animation ('fadeInUp', 'fadeIn', 'fadeInLeft', 'stagger')
  - `threshold` (number): Intersection Observer threshold (default: 0.1)
  - `rootMargin` (string): Intersection Observer root margin (default: '0px 0px -50px 0px')
  - `triggerOnce` (boolean): Whether to trigger animation only once (default: true)
  - `stagger` (boolean): Whether to use staggered animation (default: false)
  - `staggerDelay` (number): Delay between staggered elements (default: 0.1)
  - `animationOptions` (Object): Options passed to GSAP animation functions

**Returns:**
- `ref`: React ref to attach to the element
- `resetAnimation`: Function to reset animation state
- `triggerAnimation`: Function to manually trigger animation
- `hasAnimated`: Boolean indicating if animation has played

### `useStaggerAnimation(options)`

Specialized hook for staggered animations of multiple child elements.

**Example:**
```jsx
const MyComponent = () => {
  const staggerAnimation = useStaggerAnimation({
    staggerDelay: 0.15,
    animationOptions: { duration: 'normal' }
  });

  return (
    <div ref={staggerAnimation.ref} className="scroll-stagger-container">
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </div>
  );
};
```

### `useFadeInUp(options)`

Convenience hook for fade-in-up animations.

### `useFadeIn(options)`

Convenience hook for simple fade-in animations.

### `useFadeInLeft(options)`

Convenience hook for fade-in-left animations.

## CSS Classes

The following CSS classes should be applied to elements for proper initial states:

- `.scroll-animate-hidden`: Sets opacity to 0
- `.scroll-animate-fade-up`: Sets opacity to 0 and translateY
- `.scroll-animate-fade-left`: Sets opacity to 0 and translateX
- `.scroll-stagger-container`: Container for staggered animations

## Usage Examples

### Basic Fade In Up
```jsx
import { useFadeInUp } from '../hooks/useScrollAnimation';

const MySection = () => {
  const animation = useFadeInUp();

  return (
    <section ref={animation.ref} className="scroll-animate-fade-up">
      <h2>This will fade in from bottom</h2>
    </section>
  );
};
```

### Staggered Product Grid
```jsx
import { useStaggerAnimation } from '../hooks/useScrollAnimation';

const ProductGrid = ({ products }) => {
  const gridAnimation = useStaggerAnimation({
    staggerDelay: 0.1
  });

  return (
    <div ref={gridAnimation.ref} className="grid grid-cols-3 scroll-stagger-container">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

### Custom Animation Options
```jsx
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const CustomSection = () => {
  const animation = useScrollAnimation({
    animation: 'fadeInLeft',
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px',
    animationOptions: {
      duration: 'slow',
      delay: 0.2
    }
  });

  return (
    <div ref={animation.ref} className="scroll-animate-fade-left">
      <p>Custom animation with specific options</p>
    </div>
  );
};
```

## Accessibility

The animation system automatically respects the user's `prefers-reduced-motion` setting:
- When reduced motion is preferred, animations are disabled
- Elements are immediately set to their final state
- No performance impact from disabled animations

## Performance

- Uses Intersection Observer for efficient scroll detection
- Animations only trigger when elements are visible
- GSAP provides hardware-accelerated animations
- Automatic cleanup when components unmount
- Respects reduced motion preferences

## Browser Support

- Modern browsers with Intersection Observer support
- Graceful degradation for older browsers
- Polyfill can be added if needed for broader support