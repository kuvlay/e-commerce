import { usePageTransition } from '../../core/hooks/usePageTransition.js';

/**
 * PageWrapper component that provides consistent page transition animations
 * Wraps page content with fade-in animations on route changes
 */
const PageWrapper = ({ 
  children, 
  className = '', 
  duration = 'page',
  delay = 0,
  fadeOnMount = true 
}) => {
  const { ref } = usePageTransition({
    duration,
    delay,
    fadeOnMount,
    fadeOnLocationChange: true
  });

  return (
    <div 
      ref={ref}
      className={`page-content pt-20 sm:pt-24 ${className}`}
      style={{ opacity: 0 }} // Initial state for animation
    >
      {children}
    </div>
  );
};

export default PageWrapper;