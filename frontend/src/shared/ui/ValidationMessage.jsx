import { useEffect, useRef, useState } from 'react';
import { fadeInUp, shake } from '../utils/animations.js';

const ValidationMessage = ({ 
  message, 
  type = 'error', // 'error', 'success', 'warning'
  show = false,
  className = ""
}) => {
  const messageRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show && message) {
      setIsVisible(true);
      if (messageRef.current) {
        if (type === 'error') {
          shake(messageRef.current, {
            duration: 'fast',
            repeat: 1
          });
        } else {
          fadeInUp(messageRef.current, {
            duration: 'fast',
            easing: 'smooth'
          });
        }
      }
    } else {
      setIsVisible(false);
    }
  }, [show, message, type]);

  if (!isVisible || !message) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      ref={messageRef}
      className={`px-3 py-2 border rounded-md text-sm transition-all duration-300 ${getTypeStyles()} ${className}`}
    >
      {message}
    </div>
  );
};

export default ValidationMessage; 