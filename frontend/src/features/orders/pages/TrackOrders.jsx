import React, { useContext, useEffect, useState, useMemo } from "react";
import { ShopContext } from "../../../core/context/ShopContext";
import { useUser } from "../../../core/context/UserContext";
import { COLORS, GRADIENTS, SHADOWS } from "../../../core/constants/theme";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  FaShippingFast, 
  FaBox, 
  FaCheckCircle, 
  FaClock, 
  FaShoppingCart, 
  FaHeart,
  FaArrowRight,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCreditCard,
  FaEye,
  FaStar,
  FaTruck,
  FaHome
} from "react-icons/fa";
import PageWrapper from "../../../shared/layout/PageWrapper";
import { resolveCustomerName, getNameResolutionDebugInfo } from "../utils/customerNameResolver";
import { validateOrdersArray, validateShippingInfo } from "../utils/orderDataValidator";
import ErrorBoundary from "../../../shared/components/ErrorBoundary";
import ComprehensiveErrorBoundary from "../../../core/components/ComprehensiveErrorBoundary";
import { sanitizeApiResponse } from "../../../core/utils/dataSanitizer";
import { 
  NoOrdersFound, 
  CorruptedOrderData, 
  CorruptedOrderCard, 
  MissingOrderItems, 
  NetworkError,
  OrdersLoadingSkeleton
} from "../components/OrdersFallback";
import StatusTimeline from "../components/StatusTimeline";
import "../styles/shipping-animations.css";
import "../../../shared/styles/optional-fields.css";

const Orders = () => {
  const { 
    backendUrl, 
    token: shopToken, 
    currency, 
    navigate, 
    products, 
    cartItems, 
    cartCount,
    getFeaturedProducts 
  } = useContext(ShopContext);
  
  const { user, isAuthenticated, loading: userLoading } = useUser();
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTokenReady, setIsTokenReady] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [validationError, setValidationError] = useState(null);
  const [hiddenCorruptedOrders, setHiddenCorruptedOrders] = useState(new Set());
  // Enhanced order cards are now the default and only view
  const navigateToRoute = useNavigate();

  // Authentication check with proper token synchronization
  useEffect(() => {
    if (userLoading) {
      return;
    }
    
    const effectiveToken = shopToken || localStorage.getItem('token');
    
    if (!effectiveToken) {
      const timeoutId = setTimeout(() => {
        const finalToken = shopToken || localStorage.getItem('token');
        if (!finalToken) {
          toast.error("Please login to track your orders");
          navigateToRoute('/login');
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else {
      setIsTokenReady(true);
    }
  }, [shopToken, userLoading, navigateToRoute]);

  const loadOrderData = async () => {
    try {
      const effectiveToken = shopToken || localStorage.getItem('token');
      if (!effectiveToken) return;
      
      setLoading(true);
      setValidationError(null);

      const res = await axios.post(
        backendUrl + "/api/order/userorders",
        {},
        { 
          headers: { token: effectiveToken },
          timeout: 10000
        }
      );

      if (res.data.success) {
        // Debug: Log the full API response
        console.log('TrackOrders - Full API response:', res.data);
        
        // Enhanced data sanitization and validation
        const sanitizedResponse = sanitizeApiResponse(res.data, 'orders');
        const ordersData = sanitizedResponse?.data || res.data?.data?.orders || [];
        
        // Debug: Log what we're extracting
        console.log('TrackOrders - Extracted orders data:', {
          sanitizedData: sanitizedResponse?.data,
          originalData: res.data?.orders,
          finalOrdersData: ordersData,
          responseKeys: Object.keys(res.data || {})
        });
        
        // Additional safety check
        if (!Array.isArray(ordersData)) {
          console.warn('TrackOrders - Orders data is not an array:', {
            sanitizedData: sanitizedResponse?.data,
            originalData: res.data?.orders,
            responseKeys: Object.keys(res.data || {})
          });
        }
        
        const validationResult = validateOrdersArray(ordersData);
        
        if (validationResult.metadata.errors.length > 0) {
          console.error('TrackOrders - Validation errors:', validationResult.metadata.errors);
          toast.error("Some order data could not be loaded properly");
        }

        // Process validated orders with enhanced shipping info validation
        const processedOrders = validationResult.orders.map(order => {
          const validatedShippingInfo = order.shippingInfo 
            ? validateShippingInfo(order.shippingInfo)
            : null;

          return {
            ...order,
            shippingInfo: validatedShippingInfo,
            _processingTimestamp: Date.now(),
            _hasValidShippingInfo: !!validatedShippingInfo
          };
        });
        
        setOrderData(processedOrders);
        
        // Enhanced logging for development
        if (process.env.NODE_ENV === 'development') {
          console.log('TrackOrders - Enhanced validation summary:', {
            ...validationResult.metadata,
            processedOrders: processedOrders.length,
            ordersWithShipping: processedOrders.filter(o => o._hasValidShippingInfo).length,
            validationTimestamp: new Date().toISOString()
          });
        }

        // Show user-friendly messages based on validation results
        if (validationResult.metadata.invalidCount > 0) {
          const message = validationResult.metadata.invalidCount === 1 
            ? "1 order could not be displayed due to data issues"
            : `${validationResult.metadata.invalidCount} orders could not be displayed due to data issues`;
          
          toast.warn(message, {
            autoClose: 5000,
            hideProgressBar: false
          });
        }

      } else {
        console.error('TrackOrders - API response not successful:', res.data);
        toast.error(res.data.message || "Failed to load orders");
        setOrderData([]);
      }
    } catch (error) {
      console.error('TrackOrders - Load orders error:', error);
      
      // Enhanced error handling with specific error types
      if (error.code === 'ECONNABORTED') {
        toast.error("Request timeout - please check your connection and try again");
        setValidationError(error);
      } else if (error.response?.status === 401) {
        toast.error("Session expired - please login again");
        localStorage.removeItem('token');
        navigateToRoute('/login');
      } else if (error.response?.status >= 500) {
        toast.error("Server error - please try again later");
        setValidationError(error);
      } else if (error.name === 'NetworkError' || !error.response) {
        toast.error("Network error - please check your internet connection");
        setValidationError(error);
      } else {
        toast.error("Failed to load orders - please try again");
        setValidationError(error);
      }
      setOrderData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      const featured = await getFeaturedProducts('manual', 4);
      setFeaturedProducts(featured);
    } catch (error) {
      console.error('Failed to load featured products');
    }
  };

  useEffect(() => {
    if (isTokenReady) {
      loadOrderData();
      loadFeaturedProducts();
    }
  }, [isTokenReady]);

  // On mount, if a refresh is requested (from checkout), reload orders and show toast
  useEffect(() => {
    const refreshFlag = localStorage.getItem('ordersRefresh');
    if (refreshFlag) {
      localStorage.removeItem('ordersRefresh');
      toast.success('Order placed successfully!');
      loadOrderData();
    }
  }, []);

  // Get status color and icon
  const getStatusInfo = (status, paymentStatus) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { color: '#6B7280', icon: FaClock, text: 'Pending', bg: '#F9FAFB' };
      case 'placed':
      case 'order placed':
        return { color: '#3B82F6', icon: FaClock, text: 'Order Placed', bg: '#EFF6FF' };
      case 'packed':
      case 'packing':
        return { color: '#F59E0B', icon: FaBox, text: 'Packed', bg: '#FFFBEB' };
      case 'shipped':
        return { color: '#8B5CF6', icon: FaShippingFast, text: 'Shipped', bg: '#F3E8FF' };
      case 'outfordelivery':
      case 'out for delivery':
        return { color: '#10B981', icon: FaTruck, text: 'Out for Delivery', bg: '#ECFDF5' };
      case 'delivered':
        return { color: '#059669', icon: FaCheckCircle, text: 'Delivered', bg: '#ECFDF5' };
      case 'cancelled':
        return { color: '#EF4444', icon: FaClock, text: 'Cancelled', bg: '#FEF2F2' };
      default:
        return { color: '#6B7280', icon: FaClock, text: status || 'Processing', bg: '#F9FAFB' };
    }
  };

  // Calculate cart value
  const cartValue = useMemo(() => {
    let total = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      if (!itemInfo) continue;
      
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          let itemPrice = itemInfo.price;
          if (itemInfo.measurements && itemInfo.measurements.length > 0) {
            const measurement = itemInfo.measurements.find(m => m.value === item);
            if (measurement) itemPrice = measurement.price;
          }
          total += itemPrice * cartItems[items][item];
        }
      }
    }
    return total;
  }, [cartItems, products]);

  if (!isTokenReady) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center" style={{ background: GRADIENTS.backgroundGradient }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen" style={{ background: GRADIENTS.backgroundGradient }}>
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          
          <div className="relative max-w-7xl mx-auto px-6 py-16">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 font-prata" style={{ color: COLORS.textPrimary }}>
                Track Your Orders
              </h1>
              <p className="text-xl max-w-2xl mx-auto leading-relaxed mb-8" style={{ color: COLORS.textSecondary }}>
                Stay updated with your order status and delivery progress
              </p>
              <div className="w-24 h-1 mx-auto rounded-full mb-6" style={{ background: GRADIENTS.secondary }}></div>
              
              {/* Enhanced View Information */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                  Enhanced View Active
                </span>
                <span className="text-xs" style={{ color: COLORS.textMuted }}>
                  Product images & navigation enabled
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-16">
          {loading ? (
            <OrdersLoadingSkeleton />
          ) : validationError ? (
            <NetworkError 
              error={validationError}
              onRetry={() => {
                setValidationError(null);
                loadOrderData();
              }}
            />
          ) : orderData.length === 0 ? (
            <NoOrdersFound 
              onRetry={loadOrderData}
            />
          ) : (
            // Orders Found with Error Boundaries
            <div className="space-y-8">
              {orderData.map((order, orderIndex) => {
                // Skip hidden corrupted orders
                if (hiddenCorruptedOrders.has(orderIndex)) {
                  return null;
                }

                // Check if order is a fallback order (corrupted data)
                if (order._isFallback) {
                  return (
                    <CorruptedOrderCard
                      key={`corrupted-${orderIndex}`}
                      order={order}
                      index={orderIndex}
                      onRemove={(index) => {
                        setHiddenCorruptedOrders(prev => new Set([...prev, index]));
                      }}
                    />
                  );
                }

                return (
                  <ErrorBoundary
                    key={order._id}
                    title="Order Display Error"
                    message="This order could not be displayed properly."
                    fallback={(error, retry) => (
                      <CorruptedOrderCard
                        order={order}
                        index={orderIndex}
                        onRemove={(index) => {
                          setHiddenCorruptedOrders(prev => new Set([...prev, index]));
                        }}
                      />
                    )}
                  >
                    <div 
                      className={`bg-white rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02] shipping-card-${Math.min(orderIndex + 1, 3)} shipping-transition`}
                      style={{ boxShadow: SHADOWS.cardOrange }}
                    >
                      {/* Order Header */}
                      <div 
                        className="p-6 text-white"
                        style={{ background: GRADIENTS.primary }}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold mb-2">
                              Order #{order._id?.slice(-8)} - {(() => {
                                try {
                                  const customerInfo = resolveCustomerName(order);
                                  return customerInfo.name;
                                } catch (nameResolutionError) {
                                  console.error('TrackOrders - Customer name resolution failed:', nameResolutionError);
                                  return `Customer #${order._id?.slice(-6) || 'Unknown'}`;
                                }
                              })()}
                            </h3>
                            <div className="flex items-center gap-4 text-sm opacity-90">
                              <div className="flex items-center gap-2">
                                <FaCalendarAlt />
                                <span>{new Date(order.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaCreditCard />
                                <span>{order.paymentMethod || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold mb-1">
                              {currency}{order.amount}
                            </div>
                            <div className="text-sm opacity-90">
                              {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Content */}
                      <div className="p-6">
                        <div className="order-details-grid">
                          {/* Order Status Timeline */}
                          <div>
                            <h4 className="font-semibold mb-4 text-gray-800">Order Status</h4>
                            <StatusTimeline 
                              currentStatus={order.order_status || order.status}
                              paymentStatus={order.paymentStatus}
                            />
                          </div>

                          {/* Order Items */}
                          <div>
                            <h4 className="font-semibold mb-4 text-gray-800">
                              Order Items ({order.items?.length || 0})
                            </h4>
                            <div className="max-h-40 overflow-y-auto">
                              {order.items && order.items.length > 0 ? (
                                <div className="space-y-2">
                                  {order.items.map((item, itemIndex) => {
                                    try {
                                      if (!item || typeof item !== 'object') {
                                        return (
                                          <div key={`error-${itemIndex}`} className="text-sm text-red-600">
                                            Invalid item data
                                          </div>
                                        );
                                      }

                                      const title = item.title || item.name || 'Product';
                                      const price = item.price || 0;
                                      const quantity = item.qty ?? item.quantity ?? 1;
                                      const productId = item.product_id || item._id;
                                      
                                      // Enhanced view with product images and navigation (now the only view)
                                      const productData = products.find(p => p._id === productId);
                                      const productImage = productData?.image?.[0] || '/placeholder-image.jpg';

                                      return (
                                        <div 
                                          key={`${productId}-${itemIndex}`} 
                                          className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer group"
                                          onClick={() => {
                                            if (productId && productData) {
                                              navigate(`/product/${productId}`);
                                            }
                                          }}
                                        >
                                          <div className="flex items-center gap-3">
                                            {/* Product Image */}
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                              <img
                                                src={productImage}
                                                alt={title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                onError={(e) => {
                                                  e.target.src = '/placeholder-image.jpg';
                                                }}
                                              />
                                            </div>
                                            
                                            {/* Product Details */}
                                            <div className="flex-1 min-w-0">
                                              <h5 className="font-medium text-sm text-gray-800 mb-1 truncate group-hover:text-orange-600 transition-colors">
                                                {title}
                                              </h5>
                                              <div className="text-xs text-gray-600">
                                                Qty: {quantity} × {currency}{price}
                                              </div>
                                            </div>
                                            
                                            {/* Navigation Arrow */}
                                            {productData && (
                                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FaArrowRight className="text-orange-500 text-sm" />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    } catch (itemError) {
                                      console.error('TrackOrders - Item rendering error:', itemError);
                                      return (
                                        <div key={`error-${itemIndex}`} className="text-sm text-red-600">
                                          Error displaying item
                                        </div>
                                      );
                                    }
                                  })}
                                </div>
                              ) : (
                                <MissingOrderItems orderId={order._id} />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Shipping Information - Optimized Optional Field Display */}
                        {order._hasValidShippingInfo && order.shippingInfo && (
                          <div className="mt-6 shipping-info-display optional-field-fade-in">
                            <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                              <FaShippingFast className="text-blue-600" />
                              Shipping Information
                            </h4>
                            <div className="optional-field-container">
                              {/* Conditional rendering with dynamic spacing - only show fields that have values */}
                              {order.shippingInfo.carrier && order.shippingInfo.carrier.trim() && (
                                <div className="optional-field-item shipping-field">
                                  <span className="font-medium">Carrier:</span> 
                                  <span className="flex items-center gap-1">
                                    {(() => {
                                      const carrier = order.shippingInfo.carrier.toLowerCase();
                                      if (carrier.includes('fedex')) return '🚚';
                                      if (carrier.includes('ups')) return '🚛';
                                      if (carrier.includes('dhl')) return '✈️';
                                      if (carrier.includes('usps')) return '📮';
                                      return '📦';
                                    })()}
                                    {order.shippingInfo.carrier}
                                  </span>
                                </div>
                              )}
                              {order.shippingInfo.trackingNumber && order.shippingInfo.trackingNumber.trim() && (
                                <div className="optional-field-item shipping-field">
                                  <span className="font-medium">Tracking:</span> 
                                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                    {order.shippingInfo.trackingNumber}
                                  </span>
                                </div>
                              )}
                              {order.shippingInfo.shippedAt && (
                                <div className="optional-field-item shipping-field">
                                  <span className="font-medium">Shipped:</span> 
                                  <span>{(() => {
                                    try {
                                      const date = new Date(order.shippingInfo.shippedAt);
                                      return isNaN(date.getTime()) ? null : date.toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      });
                                    } catch (error) {
                                      return null;
                                    }
                                  })()}</span>
                                </div>
                              )}
                              {/* Estimated delivery date if available */}
                              {order.shippingInfo.estimatedDelivery && (
                                <div className="optional-field-item shipping-field">
                                  <span className="font-medium">Est. Delivery:</span> 
                                  <span className="text-green-600 font-medium">
                                    {new Date(order.shippingInfo.estimatedDelivery).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </ErrorBoundary>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

// Wrap with comprehensive error boundary
const OrdersWithErrorBoundary = (props) => (
  <ComprehensiveErrorBoundary
    componentName="TrackOrders"
    title="Order Tracking Error"
    message="The order tracking page could not load properly."
  >
    <Orders {...props} />
  </ComprehensiveErrorBoundary>
);

export default OrdersWithErrorBoundary;