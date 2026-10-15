import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl, currency } from '../../../App';
import { sanitizeProductData, sanitizeApiResponse } from '../../../core/utils/dataSanitizer';
import ComprehensiveErrorBoundary from '../../../core/components/ComprehensiveErrorBoundary';
import { InlineLoader } from '../../../core/components/LoadingStates';
import { ValidationErrorFeedback, NetworkErrorFeedback } from '../../../core/components/ErrorFeedback';

const FeaturedProductsManager = ({ token, onUpdate }) => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [networkError, setNetworkError] = useState(null);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchAllProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setNetworkError(null);
      const response = await axios.get(backendUrl + "/api/product/featured-with-priority", {
        headers: { token }
      });
      
      if (response.data.success) {
        // Sanitize featured products data
        const sanitizedResult = sanitizeApiResponse(response.data, 'products');
        
        if (sanitizedResult.errors.length > 0) {
          setValidationErrors(prev => [...prev, ...sanitizedResult.errors]);
          toast.warn('Some featured products data had validation issues');
        }
        
        setFeaturedProducts(sanitizedResult.data || response.data.products);
      }
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      setNetworkError(error);
      toast.error('Failed to load featured products');
    }
  };

  const fetchAllProducts = async () => {
    try {
      setIsLoading(true);
      setNetworkError(null);
      const response = await axios.get(backendUrl + "/api/product/list");
      
      if (response.data.success) {
        // Sanitize all products data
        const sanitizedResult = sanitizeApiResponse(response.data, 'products');
        
        if (sanitizedResult.errors.length > 0) {
          setValidationErrors(prev => [...prev, ...sanitizedResult.errors]);
          toast.warn('Some products data had validation issues');
        }
        
        const validProducts = sanitizedResult.data || response.data.products;
        setAllProducts(validProducts.filter(p => !p.featured));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setNetworkError(error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeatured = async (productId, currentStatus) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/toggle-featured",
        { productId },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchFeaturedProducts();
        await fetchAllProducts();
        if (onUpdate) onUpdate();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const setPriority = async (productId, newPriority) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/set-featured-priority",
        { productId, priority: newPriority },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchFeaturedProducts();
        if (onUpdate) onUpdate();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredProducts = allProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPositionStyles = (priority) => {
    switch (priority) {
      case 1: return {
        gridArea: '1 / 1 / 3 / 3', // Large left position (spans 2 rows, 2 columns)
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        boxShadow: '0 0 30px rgba(251, 191, 36, 0.4), 0 8px 32px rgba(0, 0, 0, 0.12)',
        transform: 'scale(1.02)'
      };
      case 2: return {
        gridArea: '1 / 3 / 2 / 4', // Right top position
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        boxShadow: '0 0 20px rgba(139, 92, 246, 0.3), 0 4px 20px rgba(0, 0, 0, 0.1)'
      };
      case 3: return {
        gridArea: '2 / 3 / 3 / 4', // Right bottom position
        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
        boxShadow: '0 0 20px rgba(6, 182, 212, 0.3), 0 4px 20px rgba(0, 0, 0, 0.1)'
      };
      default: return {
        background: 'linear-gradient(135deg, #6b7280, #4b5563)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      };
    }
  };

  const getGlowEffect = (priority) => {
    switch (priority) {
      case 1: return 'animate-pulse shadow-lg shadow-yellow-400/50';
      case 2: return 'shadow-lg shadow-purple-400/30';
      case 3: return 'shadow-lg shadow-cyan-400/30';
      default: return '';
    }
  };

  // Show network error if present
  if (networkError) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <NetworkErrorFeedback 
          error={networkError}
          onRetry={() => {
            fetchFeaturedProducts();
            fetchAllProducts();
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <ValidationErrorFeedback
          errors={validationErrors}
          title="Product Data Validation Issues"
          onRetry={() => {
            setValidationErrors([]);
            fetchFeaturedProducts();
            fetchAllProducts();
          }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="mr-3">🌟</span>
          Featured Products Manager
        </h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {featuredProducts.length}/3 slots used
          </div>
          <button
            onClick={() => setShowProductSelector(!showProductSelector)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add Featured</span>
          </button>
        </div>
      </div>

      {/* Current Featured Products - Position-Based Layout */}
      <div className="relative mb-8">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <InlineLoader message="Loading featured products..." size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-3 grid-rows-2 gap-4 h-96">
          {featuredProducts.map((product) => {
            const positionStyles = getPositionStyles(product.featuredPriority);
            return (
              <div 
                key={product._id} 
                className={`rounded-xl p-4 text-white transition-all duration-300 hover:scale-105 ${getGlowEffect(product.featuredPriority)}`}
                style={{
                  ...positionStyles,
                  background: positionStyles.background,
                  boxShadow: positionStyles.boxShadow,
                  transform: positionStyles.transform || 'scale(1)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                    Position {product.featuredPriority}
                  </div>
                  <div className="flex space-x-1">
                    {[1, 2, 3].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => setPriority(product._id, priority)}
                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all duration-200 ${
                          product.featuredPriority === priority
                            ? 'bg-white text-gray-800 ring-2 ring-white ring-opacity-50'
                            : 'bg-white bg-opacity-30 hover:bg-opacity-50 text-white hover:scale-110'
                        }`}
                        title={`Move to position ${priority}`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>
                
                <img
                  src={product.image[0]}
                  alt={product.name}
                  className={`w-full object-cover rounded-lg mb-3 ${
                    product.featuredPriority === 1 ? 'h-40' : 'h-24'
                  }`}
                />
                
                <h3 className={`font-semibold mb-1 line-clamp-1 ${
                  product.featuredPriority === 1 ? 'text-xl' : 'text-lg'
                }`}>
                  {product.name}
                </h3>
                <p className="text-sm opacity-90 mb-2">{product.category}</p>
                <div className="flex items-center justify-between">
                  <div className={`font-bold ${
                    product.featuredPriority === 1 ? 'text-2xl' : 'text-xl'
                  }`}>
                    {currency}{product.price}
                  </div>
                  <button
                    onClick={() => toggleFeatured(product._id, true)}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* Empty Slots with Position Indicators */}
          {Array.from({ length: 3 - featuredProducts.length }).map((_, index) => {
            const position = featuredProducts.length + index + 1;
            const positionStyles = getPositionStyles(position);
            return (
              <div 
                key={`empty-${index}`} 
                className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center transition-all duration-200 hover:border-gray-400 hover:bg-gray-50"
                style={{
                  gridArea: positionStyles.gridArea
                }}
              >
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">➕</div>
                  <div className="text-sm font-medium">Position {position}</div>
                  <div className="text-xs">
                    {position === 1 ? 'Main Spotlight' : position === 2 ? 'Top Right' : 'Bottom Right'}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Position-Based Layout Explanation */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="text-blue-500 text-xl">🎯</div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Featured Products Layout System</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Position 1:</strong> Main spotlight (large, left side) - gets golden glow effect</li>
              <li>• <strong>Position 2:</strong> Secondary feature (top right) - gets purple glow effect</li>
              <li>• <strong>Position 3:</strong> Third feature (bottom right) - gets cyan glow effect</li>
              <li>• Products automatically arrange by position priority</li>
              <li>• Click position numbers (1, 2, 3) to rearrange products</li>
              <li>• Visual effects indicate importance without text labels</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Product Selector */}
      {showProductSelector && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Select Product to Feature</h3>
            <button
              onClick={() => setShowProductSelector(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div key={product._id} className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition-all duration-200">
                  <img
                    src={product.image[0]}
                    alt={product.name}
                    className="w-full h-24 object-cover rounded-md mb-2"
                  />
                  <h4 className="font-medium text-sm text-gray-800 line-clamp-1 mb-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800">
                      {currency}{product.price}
                    </span>
                    <button
                      onClick={() => {
                        toggleFeatured(product._id, false);
                        setShowProductSelector(false);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-all duration-200"
                    >
                      Feature
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔍</div>
                <p>No products found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap with comprehensive error boundary
const FeaturedProductsManagerWithErrorBoundary = (props) => (
  <ComprehensiveErrorBoundary
    componentName="FeaturedProductsManager"
    title="Featured Products Manager Error"
    message="The featured products manager could not load properly."
  >
    <FeaturedProductsManager {...props} />
  </ComprehensiveErrorBoundary>
);

export default FeaturedProductsManagerWithErrorBoundary;
