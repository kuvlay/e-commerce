import React, { useState, useRef, useEffect } from 'react';
import { FaInfoCircle, FaQuestionCircle } from 'react-icons/fa';
import '../styles/admin-shipping-animations.css';

const ShippingTooltip = ({ 
  content, 
  children, 
  position = 'top', 
  trigger = 'hover',
  className = '',
  maxWidth = '200px',
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  // Calculate optimal position based on viewport
  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let newPosition = position;

    // Check if tooltip would overflow viewport
    switch (position) {
      case 'top':
        if (triggerRect.top - tooltipRect.height < 10) {
          newPosition = 'bottom';
        }
        break;
      case 'bottom':
        if (triggerRect.bottom + tooltipRect.height > viewport.height - 10) {
          newPosition = 'top';
        }
        break;
      case 'left':
        if (triggerRect.left - tooltipRect.width < 10) {
          newPosition = 'right';
        }
        break;
      case 'right':
        if (triggerRect.right + tooltipRect.width > viewport.width - 10) {
          newPosition = 'left';
        }
        break;
    }

    setActualPosition(newPosition);
  };

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Calculate position after tooltip is rendered
      setTimeout(calculatePosition, 0);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      showTooltip();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      hideTooltip();
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      if (isVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  };

  const handleFocus = () => {
    if (trigger === 'focus') {
      showTooltip();
    }
  };

  const handleBlur = () => {
    if (trigger === 'focus') {
      hideTooltip();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isVisible) {
        hideTooltip();
      }
    };

    const handleClickOutside = (e) => {
      if (trigger === 'click' && 
          tooltipRef.current && 
          !tooltipRef.current.contains(e.target) &&
          !triggerRef.current.contains(e.target)) {
        hideTooltip();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, trigger]);

  const getPositionClasses = () => {
    const baseClasses = "absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg";
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getArrowClasses = () => {
    const baseClasses = "absolute w-2 h-2 bg-gray-900 transform rotate-45";
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 -mt-1`;
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 -mb-1`;
      case 'left':
        return `${baseClasses} left-full top-1/2 -translate-y-1/2 -ml-1`;
      case 'right':
        return `${baseClasses} right-full top-1/2 -translate-y-1/2 -mr-1`;
      default:
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 -mt-1`;
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="cursor-help"
        tabIndex={trigger === 'focus' ? 0 : undefined}
        role={trigger === 'click' ? 'button' : undefined}
        aria-describedby={isVisible ? 'tooltip' : undefined}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          id="tooltip"
          role="tooltip"
          className={`${getPositionClasses()} admin-shipping-tooltip show`}
          style={{ maxWidth }}
        >
          <div className="relative z-10 whitespace-pre-wrap break-words">
            {content}
          </div>
          <div className={getArrowClasses()} />
        </div>
      )}
    </div>
  );
};

// Predefined tooltip variants
export const InfoTooltip = ({ content, className = '' }) => (
  <ShippingTooltip content={content} className={className}>
    <FaInfoCircle className="text-blue-500 hover:text-blue-600 transition-colors" />
  </ShippingTooltip>
);

export const HelpTooltip = ({ content, className = '' }) => (
  <ShippingTooltip content={content} className={className}>
    <FaQuestionCircle className="text-gray-400 hover:text-gray-600 transition-colors" />
  </ShippingTooltip>
);

export default ShippingTooltip;