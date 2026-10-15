import { useContext, useRef, useEffect, useState } from "react";
import { ShopContext } from "../../../core/context/ShopContext";
import { Link } from "react-router-dom";
import { fadeIn, scaleOnHover } from "../../../core/utils/animations.js";

const ProductItem = ({ id, image, name, price }) => {
  const { currency } = useContext(ShopContext);
  const cardRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoverAnimation, setHoverAnimation] = useState(null);

  // Initialize hover animation on mount
  useEffect(() => {
    if (cardRef.current) {
      const animation = scaleOnHover(cardRef.current, {
        scale: 1.02,
        duration: 'hover',
        easing: 'quick'
      });
      setHoverAnimation(animation);
    }
    
    return () => {
      // Cleanup animation
    };
  }, []);

  // Handle image load animation
  const handleImageLoad = () => {
    if (!imageLoaded && imageRef.current) {
      setImageLoaded(true);
      fadeIn(imageRef.current, {
        duration: 'normal',
        easing: 'smooth'
      });
    }
  };

  // Handle mouse enter/leave for hover effects
  const handleMouseEnter = () => {
    if (hoverAnimation) {
      hoverAnimation.play();
    }
  };

  const handleMouseLeave = () => {
    if (hoverAnimation) {
      hoverAnimation.reverse();
    }
  };

  // Handle touch interactions for mobile
  const handleTouchStart = () => {
    if (hoverAnimation) {
      hoverAnimation.play();
    }
  };

  const handleTouchEnd = () => {
    if (hoverAnimation) {
      hoverAnimation.reverse();
    }
  };

  return (
    <Link 
      to={`/product/${id}`} 
      className="text-gray-700 cursor-pointer block group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        ref={cardRef}
        className="overflow-hidden rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 ease-out bg-white"
      >
        <div className="overflow-hidden">
          <img
            ref={imageRef}
            src={image[0]}
            alt={name}
            className={`w-full h-48 object-cover transition-all duration-300 ease-out group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            loading="lazy"
          />
        </div>
        <div className="p-3">
          <p className="pb-1 text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
            {name}
          </p>
          <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
            {currency}{price}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ProductItem;
