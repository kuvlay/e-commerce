import { useContext, useEffect, useRef, useState } from "react";
import { ShopContext } from "../../../core/context/ShopContext";
import { useWishlist } from "../../../core/context/WishlistContext";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaTimes, FaShoppingCart } from "react-icons/fa";
import { toast } from "react-toastify";
import { useCartAnimations } from "../../cart/hooks/useCartAnimations.js";

const WishlistDrawer = ({ isOpen, onClose }) => {
  const { products, currency, addToCart } = useContext(ShopContext);
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);
  const itemRefs = useRef({});
  const [wishlistData, setWishlistData] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const { animateCartDrawerOpen, animateItemRemoval } = useCartAnimations();

  // Update wishlist data when wishlistItems change
  useEffect(() => {
    if (products.length > 0 && wishlistItems.length > 0) {
      const tempData = wishlistItems.map(itemId => {
        const product = products.find(p => p._id === itemId);
        return product;
      }).filter(Boolean);
      setWishlistData(tempData);
    } else {
      setWishlistData([]);
    }
  }, [wishlistItems, products]);

  // Animate drawer when opened/closed
  useEffect(() => {
    if (drawerRef.current) {
      if (isOpen) {
        animateCartDrawerOpen(drawerRef.current);
      }
    }
  }, [isOpen, animateCartDrawerOpen]);

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (overlayRef.current && event.target === overlayRef.current) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleRemoveFromWishlist = async (productId) => {
    const itemElement = itemRefs.current[productId];
    if (itemElement) {
      animateItemRemoval(itemElement, () => {
        removeFromWishlist(productId);
      });
    } else {
      await removeFromWishlist(productId);
    }
  };

  const handleAddToCart = async (product) => {
    // Get the first available size/measurement
    let size = 'default';
    if (product.measurements && product.measurements.length > 0) {
      size = product.measurements[0].value;
    } else if (product.sizes && product.sizes.length > 0) {
      size = product.sizes[0];
    }
    
    await addToCart(product._id, size, 1);
    toast.success('Added to cart!');
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    onClose();
  };

  const handleContinueShopping = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    try {
      navigate('/collection');
      onClose();
    } finally {
      setIsNavigating(false);
    }
  };

  const handleKeyDown = (event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
        tabIndex={0}
        aria-label="Close wishlist overlay"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="absolute right-0 top-0 h-full w-full sm:w-[90vw] md:max-w-md bg-white shadow-2xl transform translate-x-full opacity-0 transition-transform duration-300 rounded-l-2xl"
        tabIndex={0}
        aria-label="Wishlist drawer"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-primary">
              Wishlist ({wishlistData.length})
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none"
              aria-label="Close wishlist"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {wishlistData.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💝</div>
                <p className="text-gray-500 mb-6 text-lg">Your wishlist is empty</p>
                <button
                  onClick={() => {
                    navigate('/collection');
                    onClose();
                  }}
                  className="btn-primary px-8 py-3 rounded-full hover-lift"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {wishlistData.map((product) => (
                  <div
                    key={product._id}
                    ref={(el) => (itemRefs.current[product._id] = el)}
                    className="card p-4 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={product.image[0]}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform duration-300"
                        onClick={() => handleProductClick(product._id)}
                      />

                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-semibold text-primary truncate cursor-pointer hover:text-accent-500 transition-colors"
                          onClick={() => handleProductClick(product._id)}
                        >
                          {product.name}
                        </h3>
                        <p className="text-sm text-secondary">
                          {product.category}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {currency}{product.price}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 items-center">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="btn-primary px-3 py-2 text-sm rounded-lg hover-lift"
                          title="Add to Cart"
                        >
                          <FaShoppingCart className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleRemoveFromWishlist(product._id)}
                          className="text-accent-500 hover:text-accent-600 transition-colors duration-200 text-sm font-medium"
                          title="Remove from Wishlist"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Footer */}
          {wishlistData.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-bl-2xl">
              <div className="space-y-3">
                <button
                  onClick={handleContinueShopping}
                  onKeyDown={(e) => handleKeyDown(e, handleContinueShopping)}
                  disabled={isNavigating}
                  className="btn-secondary block w-full text-center py-4 sm:py-3 md:py-4 rounded-xl font-semibold min-h-[48px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200"
                  aria-label="Continue shopping for more products"
                  role="button"
                  tabIndex={0}
                >
                  {isNavigating ? 'Loading...' : 'Continue Shopping'}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Items in your wishlist are saved for later
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistDrawer;