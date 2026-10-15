import React, { useContext, useRef, useState, useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../../../core/context/ShopContext";
import { useWishlist } from "../../../core/context/WishlistContext";
import { useUser } from "../../../core/context/UserContext";
import { COLORS, GRADIENTS, SHADOWS } from "../../../core/constants/theme";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { toast } from "react-toastify";
import gsap from "gsap";
import ComprehensiveErrorBoundary from "../../../core/components/ComprehensiveErrorBoundary";
import { sanitizeProductData } from "../../../core/utils/dataSanitizer";
import "./ProductCard.css";

const ProductCard = memo(({ product, index }) => {
  // Sanitize product data on component mount
  const sanitizedProduct = sanitizeProductData(product);
  
  // If product data is invalid, return error state
  if (!sanitizedProduct) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-600 text-sm">Invalid product data</p>
      </div>
    );
  }

  const { addToCart, currency } = useContext(ShopContext);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const cardRef = useRef(null);
  const imageRef = useRef(null);
  
  // Animation refs and state management
  const animationTimelineRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);

  // Helper function to get the base/smallest measurement
  const getBaseMeasurement = () => {
    if (sanitizedProduct.measurements && sanitizedProduct.measurements.length > 0) {
      // Return the first measurement (usually the smallest/base option)
      return sanitizedProduct.measurements[0].value;
    } else if (sanitizedProduct.sizes && sanitizedProduct.sizes.length > 0) {
      // Fallback to legacy sizes system
      return sanitizedProduct.sizes[0];
    }
    return "default";
  };

  // Enhanced animation handlers with proper cleanup and state management
  const handleMouseEnter = useCallback(() => {
    if (isAnimatingRef.current) return;
    
    const card = cardRef.current;
    const image = imageRef.current;
    
    if (!card || !image) return;
    
    // Kill any existing timeline to prevent conflicts
    if (animationTimelineRef.current) {
      animationTimelineRef.current.kill();
    }
    
    // Set animation state
    isAnimatingRef.current = true;
    setIsHovered(true);
    
    // Create new timeline for smooth, coordinated animations
    animationTimelineRef.current = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
      }
    });
    
    // Add animations to timeline
    animationTimelineRef.current
      .to(image, { 
        scale: 1.1, 
        duration: 0.6, 
        ease: "power2.out" 
      }, 0)
      .to(card, { 
        y: -8, 
        duration: 0.4, 
        ease: "power2.out" 
      }, 0);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isAnimatingRef.current) return;
    
    const card = cardRef.current;
    const image = imageRef.current;
    
    if (!card || !image) return;
    
    // Kill any existing timeline to prevent conflicts
    if (animationTimelineRef.current) {
      animationTimelineRef.current.kill();
    }
    
    // Set animation state
    isAnimatingRef.current = true;
    setIsHovered(false);
    
    // Create new timeline for reverse animations
    animationTimelineRef.current = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
      }
    });
    
    // Add reverse animations to timeline
    animationTimelineRef.current
      .to(image, { 
        scale: 1, 
        duration: 0.6, 
        ease: "power2.out" 
      }, 0)
      .to(card, { 
        y: 0, 
        duration: 0.4, 
        ease: "power2.out" 
      }, 0);
  }, []);

  // Cleanup effect to ensure proper animation cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimelineRef.current) {
        animationTimelineRef.current.kill();
      }
      isAnimatingRef.current = false;
    };
  }, []);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    setAddingToCart(true);
    
    // Add cart animation with proper cleanup
    const buttonAnimation = gsap.to(e.target, { 
      scale: 0.95, 
      duration: 0.1, 
      yoyo: true, 
      repeat: 1,
      ease: "power2.inOut"
    });
    
    // Add 1 quantity of the base/smallest measurement
    await addToCart(sanitizedProduct._id, getBaseMeasurement(), 1);
    
    // Cleanup button animation
    setTimeout(() => {
      setAddingToCart(false);
      if (buttonAnimation) {
        buttonAnimation.kill();
      }
    }, 1000);
  };

  const handleBuyNow = async (e) => {
    e.stopPropagation();
    setBuyingNow(true);
    
    // Add 1 quantity of the base/smallest measurement and redirect to review
    const baseMeasurement = getBaseMeasurement();
    
    setTimeout(() => {
      setBuyingNow(false);
      // Navigate to review product page with product details
      navigate('/review-product', {
        state: {
          productId: sanitizedProduct._id,
          selectedMeasurement: baseMeasurement,
          quantity: 1
        }
      });
    }, 800);
  };

  const handleCardClick = () => {
    navigate(`/product/${sanitizedProduct._id}`);
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      navigate('/login');
      return;
    }
    
    await toggleWishlist(sanitizedProduct._id);
  };

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden transition-all duration-500"
      style={{ 
        border: `1px solid ${COLORS.neutral300}`,
        boxShadow: isHovered ? SHADOWS.cardOrangeHover : SHADOWS.cardOrange
      }}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden aspect-[4/3]" style={{ backgroundColor: COLORS.background }}>
        <img
          ref={imageRef}
          src={sanitizedProduct.image[0]}
          alt={sanitizedProduct.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Badge */}
        {sanitizedProduct.bestseller && (
          <div 
            className="absolute top-4 left-4 text-white px-3 py-1 rounded-full text-xs font-semibold"
            style={{ 
              background: GRADIENTS.secondary,
              boxShadow: SHADOWS.cardOrange
            }}
          >
            ⭐ Bestseller
          </div>
        )}

        {/* Wishlist Button */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleWishlistToggle();
            }}
            className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            {isInWishlist(sanitizedProduct._id) ? (
              <FaHeart className="w-5 h-5 text-red-500" />
            ) : (
              <FaRegHeart className="w-5 h-5 text-gray-600 hover:text-red-500" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category */}
        <p className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: COLORS.secondary }}>
          {sanitizedProduct.category}
        </p>

        {/* Product Name */}
        <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:transition-colors transition-colors" style={{ color: COLORS.textPrimary }}>
          {sanitizedProduct.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center mb-4">
          <div className="flex" style={{ color: COLORS.accent }}>
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
            ))}
          </div>
          <span className="text-sm ml-2" style={{ color: COLORS.textMuted }}>(4.8)</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold" style={{ color: COLORS.primary }}>
              {currency}{sanitizedProduct.measurements && sanitizedProduct.measurements.length > 0 ? sanitizedProduct.measurements[0].price : sanitizedProduct.price}
            </span>
            {sanitizedProduct.originalPrice && (
              <span className="text-lg line-through" style={{ color: COLORS.neutral400 }}>
                {currency}{sanitizedProduct.originalPrice}
              </span>
            )}
          </div>
          {sanitizedProduct.originalPrice && (
            <span 
              className="text-white px-2 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: COLORS.secondary }}
            >
              -{Math.round(((sanitizedProduct.originalPrice - sanitizedProduct.price) / sanitizedProduct.originalPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || buyingNow}
            className={`w-full text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 transform hover:scale-[1.02] product-card-add-btn ${addingToCart ? 'loading' : ''}`}
            style={{ 
              backgroundColor: COLORS.primary,
              boxShadow: SHADOWS.cardOrange
            }}
          >
            {addingToCart ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Added!
              </div>
            ) : (
              'Add to Cart'
            )}
          </button>

          <button
            onClick={handleBuyNow}
            disabled={buyingNow || addingToCart}
            className={`w-full text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 transform hover:scale-[1.02] product-card-buy-btn ${buyingNow ? 'loading' : ''}`}
            style={{ 
              background: GRADIENTS.secondary,
              boxShadow: SHADOWS.cardOrange
            }}
          >
            {buyingNow ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span>Buy Now</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

// Custom comparison function for memo
ProductCard.displayName = 'ProductCard';

// Wrap ProductCard with comprehensive error boundary
const ProductCardWithErrorBoundary = (props) => (
  <ComprehensiveErrorBoundary
    componentName="ProductCard"
    title="Product Display Error"
    message="This product could not be displayed properly."
    fallback={(error, retry) => (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-600 text-sm mb-2">Product display error</p>
        <button
          onClick={retry}
          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )}
  >
    <ProductCard {...props} />
  </ComprehensiveErrorBoundary>
);

export default ProductCardWithErrorBoundary; 