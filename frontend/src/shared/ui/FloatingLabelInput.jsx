import { useRef, useEffect, useState } from 'react';
import { fadeInUp } from '../utils/animations.js';

const FloatingLabelInput = ({ 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = false,
  className = "",
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    setHasValue(value && value.length > 0);
  }, [value]);

  const handleFocus = () => {
    setIsFocused(true);
    if (labelRef.current) {
      fadeInUp(labelRef.current, {
        duration: 'fast',
        easing: 'smooth'
      });
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full px-3 py-2 border border-gray-800 focus:border-black focus:outline-none transition-all duration-300 bg-transparent"
        {...props}
      />
      <label
        ref={labelRef}
        className={`absolute left-3 transition-all duration-300 pointer-events-none ${
          isFocused || hasValue 
            ? 'text-xs text-gray-600 -top-2 bg-white px-1' 
            : 'text-sm text-gray-500 top-2'
        }`}
      >
        {placeholder}
      </label>
    </div>
  );
};

export default FloatingLabelInput; 