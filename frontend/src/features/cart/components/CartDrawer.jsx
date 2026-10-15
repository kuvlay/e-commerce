import { useContext, useEffect, useRef, useState } from "react";
import { ShopContext } from "../../../core/context/ShopContext";
import { assets } from "../../../assets/assets";
import { useCartAnimations } from "../hooks/useCartAnimations.js";
import { Link, useNavigate } from "react-router-dom";
import { getVariantPrice } from "../../../core/utils/productHelpers";

const CartDrawer = ({ isOpen, onClose }) => {
  const {
    products,
    currency,
    cartItems,
    updateQuantity,
    cartAmount,
    cartCount,
  } = useContext(ShopContext);
  const {
    animateCartDrawerOpen,
    animateItemRemoval,
    animateQuantityChange,
    animatePriceChange,
  } = useCartAnimations();
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);
  const itemRefs = useRef({});
  const totalRef = useRef(null);
  const [cartData, setCartData] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);

  // Update cart data when cartItems change
  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item],
            });
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products]);

  // Animate drawer when opened/closed
  useEffect(() => {
    if (drawerRef.current) {
      if (isOpen) {
        animateCartDrawerOpen(drawerRef.current);
      }
    }
  }, [isOpen, animateCartDrawerOpen]);

  // Animate total changes in drawer
  useEffect(() => {
    if (totalRef.current && isOpen) {
      const currentTotal = cartAmount;
      animatePriceChange(totalRef.current, 0, currentTotal, `${currency} `);
    }
  }, [cartAmount, isOpen, animatePriceChange, currency]);

  // Handle item removal with animation
  const handleRemoveItem = (itemId, size) => {
    const itemKey = `${itemId}-${size}`;
    const itemElement = itemRefs.current[itemKey];

    if (itemElement) {
      animateItemRemoval(itemElement, () => {
        updateQuantity(itemId, size, 0);
      });
    } else {
      updateQuantity(itemId, size, 0);
    }
  };

  // Handle quantity change with animation
  const handleQuantityChange = (
    itemId,
    size,
    newQuantity,
    inputElement,
    oldQuantity
  ) => {
    updateQuantity(itemId, size, newQuantity);
    if (inputElement && oldQuantity !== undefined) {
      animateQuantityChange(inputElement, oldQuantity, newQuantity);
    }
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
        aria-label="Close cart overlay"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="absolute right-0 top-0 h-full w-full sm:w-[90vw] md:max-w-md bg-white shadow-2xl transform translate-x-full opacity-0 transition-transform duration-300 rounded-l-2xl"
        tabIndex={0}
        aria-label="Shopping cart drawer"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-primary">
              Cart ({cartCount})
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none"
              aria-label="Close cart"
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

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cartData.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-gray-500 mb-6 text-lg">Your cart is empty</p>
                <Link
                  to="/"
                  onClick={onClose}
                  className="btn-primary px-8 py-3 rounded-full hover-lift"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cartData.slice(0, 3).map((item) => {
                  const productsData = products.find(
                    (product) => product._id === item._id
                  );
                  const itemKey = `${item._id}-${item.size}`;

                  if (!productsData) return null;

                  return (
                    <div
                      key={itemKey}
                      ref={(el) => (itemRefs.current[itemKey] = el)}
                      className="card p-4 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={productsData.image[0]}
                          alt={productsData.name}
                          className="w-20 h-20 object-cover rounded-xl"
                        />

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-primary truncate">
                            {productsData.name}
                          </h3>
                          <p className="text-sm text-secondary">
                            Size: {item.size}
                          </p>
                          <p className="text-lg font-bold text-primary">
                            {currency}
                            {getVariantPrice(productsData, item.size)}
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 items-center">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  handleQuantityChange(
                                    item._id,
                                    item.size,
                                    item.quantity - 1
                                  );
                                }
                              }}
                              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-primary font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-semibold text-primary">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => {
                                handleQuantityChange(
                                  item._id,
                                  item.size,
                                  item.quantity + 1
                                );
                              }}
                              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-primary font-bold"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveItem(item._id, item.size)
                            }
                            className="text-accent-500 hover:text-accent-600 transition-colors duration-200 text-sm font-medium"
                            aria-label={`Remove ${productsData.name} from cart`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {cartData.length > 3 && (
                  <div className="text-center py-4">
                    <button
                      onClick={() => {
                        // Just close the drawer - all items are already visible
                        onClose();
                      }}
                      className="text-accent-500 hover:text-accent-600 font-medium"
                    >
                      View all {cartData.length} items
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartData.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-bl-2xl">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-primary">
                  Total:
                </span>
                <span
                  ref={totalRef}
                  className="text-2xl font-bold text-primary transition-all duration-300"
                >
                  {currency}
                  {cartAmount.toFixed(2)}
                </span>
              </div>

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
                <Link
                  to="/review-product"
                  onClick={onClose}
                  className="btn-accent cart-buy-now block w-full text-center py-4 rounded-xl font-semibold"
                >
                  Buy Now
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
