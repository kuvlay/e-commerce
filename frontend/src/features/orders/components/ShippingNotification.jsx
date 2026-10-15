import React, { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaTimes,
  FaSpinner
} from 'react-icons/fa';
import '../styles/shipping-animations.css';

const ShippingNotification = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  autoClose = true, 
  duration = 5000,
  className = '',
  actions = []
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close if enabled
    if (autoClose && duration > 0) {
      const closeTimer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(closeTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 300); // Match animation duration
  };

  const getNotificationStyles = () => {
    const baseStyles = "relative p-4 rounded-xl border-2 shadow-lg transition-all duration-300 ";
    
    switch (type) {
      case 'success':
        return baseStyles + "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800";
      case 'error':
        return baseStyles + "bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-800";
      case 'warning':
        return baseStyles + "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-800";
      case 'loading':
        return baseStyles + "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800";
      default:
        return baseStyles + "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800";
    }
  };

  const getIcon = () => {
    const iconClass = "flex-shrink-0 text-xl";
    
    switch (type) {
      case 'success':
        return <FaCheckCircle className={`${iconClass} text-green-600`} />;
      case 'error':
        return <FaExclamationTriangle className={`${iconClass} text-red-600`} />;
      case 'warning':
        return <FaExclamationTriangle className={`${iconClass} text-yellow-600`} />;
      case 'loading':
        return <FaSpinner className={`${iconClass} text-blue-600 animate-spin`} />;
      default:
        return <FaInfoCircle className={`${iconClass} text-blue-600`} />;
    }
  };

  const animationClass = isVisible && !isClosing ? 'shipping-fade-in' : 
                        isClosing ? 'opacity-0 transform translate-y-2' : 
                        'opacity-0 transform translate-y-4';

  return (
    <div 
      className={`${getNotificationStyles()} ${animationClass} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-sm sm:text-base mb-1 truncate">
              {title}
            </h4>
          )}
          {message && (
            <p className="text-sm opacity-90 break-words">
              {message}
            </p>
          )}
          
          {/* Action Buttons */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    action.variant === 'primary' 
                      ? 'bg-white bg-opacity-20 hover:bg-opacity-30 border border-current' 
                      : 'bg-black bg-opacity-10 hover:bg-opacity-20'
                  }`}
                  disabled={action.disabled}
                >
                  {action.loading && <FaSpinner className="animate-spin mr-1 inline" />}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
            aria-label="Close notification"
          >
            <FaTimes className="text-sm opacity-60 hover:opacity-100" />
          </button>
        )}
      </div>

      {/* Progress Bar for Auto Close */}
      {autoClose && duration > 0 && !isClosing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10 rounded-b-xl overflow-hidden">
          <div 
            className="h-full bg-current opacity-30 transition-all ease-linear"
            style={{ 
              width: '100%',
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// Notification Container Component
export const ShippingNotificationContainer = ({ notifications = [], onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {notifications.map((notification) => (
        <ShippingNotification
          key={notification.id}
          {...notification}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

export default ShippingNotification;