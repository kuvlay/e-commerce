import { createContext, useEffect, useState, useRef, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import apiClient, { TIMEOUTS } from "../utils/apiClient";
import { getVariantPrice } from "../utils/productHelpers";

export const ShopContext = createContext();

// Cache configuration - MOVED OUTSIDE COMPONENT to persist across re-renders
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Global cache object that persists across component re-renders
const globalCache = {
  products: { data: null, timestamp: 0 },
  featuredProducts: { data: null, timestamp: 0 },
  userCart: { data: null, timestamp: 0, userId: null }
};

// Expose cache to window for debugging
if (typeof window !== 'undefined') {
  window.globalCache = globalCache;
}

// Debug function (only in development) - reduced logging
const debugCache = (action, key, data = null) => {
  if (import.meta.env.DEV && window.location.search.includes('debug-cache')) {
    console.log(`🔍 Cache ${action}:`, {
      key,
      hasData: !!data,
      timestamp: globalCache[key]?.timestamp,
      age: globalCache[key]?.timestamp ? Date.now() - globalCache[key].timestamp : 0,
      isValid: globalCache[key]?.timestamp && (Date.now() - globalCache[key].timestamp) < CACHE_DURATION
    });
  }
};

const ShopContextProvider = (props) => {
  const currency = "Rs";
  const delivery_fee = 10;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState(() => localStorage.getItem('token') || "");
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const firstLoadRef = useRef(true);
  const [cacheStatus, setCacheStatus] = useState(false);
  
  // Animation trigger system
  const cartAnimationCallbacks = useRef({});

  const navigate = useNavigate();
  const navigateRef = useRef();
  navigateRef.current = navigate;

  // Stable cache validation using useRef to prevent dependency instability
  const cacheValidationRef = useRef();
  cacheValidationRef.current = (cacheKey) => {
    const cached = globalCache[cacheKey];
    const isValid = cached.data && (Date.now() - cached.timestamp) < CACHE_DURATION;
    debugCache('CHECK', cacheKey);
    return isValid;
  };

  // Register animation callback
  const registerCartAnimation = useCallback((type, callback) => {
    cartAnimationCallbacks.current[type] = callback;
  }, []);

  // Trigger cart animation
  const triggerCartAnimation = useCallback((type, ...args) => {
    if (cartAnimationCallbacks.current[type]) {
      cartAnimationCallbacks.current[type](...args);
    }
  }, []);

  const addToCart = useCallback(async (itemId, size, quantity = 1) => {
    if (!size) {
      toast.error("Select product size!");
      return;
    }

    // Optimistically update the UI
    setCartItems(prevCartItems => {
      const newCartItems = { ...prevCartItems };
      
      if (newCartItems[itemId]) {
        if (newCartItems[itemId][size]) {
          newCartItems[itemId] = {
            ...newCartItems[itemId],
            [size]: newCartItems[itemId][size] + quantity
          };
        } else {
          newCartItems[itemId] = {
            ...newCartItems[itemId],
            [size]: quantity
          };
        }
      } else {
        newCartItems[itemId] = { [size]: quantity };
      }
      
      return newCartItems;
    });

    // Trigger cart icon animation
    triggerCartAnimation('cartAdd');

    // Show success message with quantity
    toast.success(`${quantity > 1 ? `${quantity} items` : 'Item'} added to cart!`);

    if (token) {
      try {
        // Use a single request with quantity instead of multiple requests
        await apiClient.post(
          "/api/cart/add",
          { itemId, size, quantity },
          { 
            headers: { token },
            timeout: TIMEOUTS.medium,
            // Use a unique key for deduplication
            _dedupeKey: `add_${itemId}_${size}`
          }
        );
        
        // Invalidate cart cache after successful update
        globalCache.userCart.timestamp = 0;
      } catch (error) {
        // Revert optimistic update on error
        setCartItems(prevCartItems => {
          const newCartItems = { ...prevCartItems };
          if (newCartItems[itemId]) {
            if (newCartItems[itemId][size]) {
              const newQty = newCartItems[itemId][size] - quantity;
              if (newQty > 0) {
                newCartItems[itemId] = {
                  ...newCartItems[itemId],
                  [size]: newQty
                };
              } else {
                const { [size]: _, ...restSizes } = newCartItems[itemId];
                if (Object.keys(restSizes).length > 0) {
                  newCartItems[itemId] = restSizes;
                } else {
                  delete newCartItems[itemId];
                }
              }
            }
          }
          return newCartItems;
        });
        
        console.error('Failed to add to cart:', error.message);
        toast.error(error.response?.data?.message || 'Failed to add item to cart');
      }
    }
  }, [cartItems, token, backendUrl, triggerCartAnimation]);

  // Removed duplicate getCartCount - using cartCount instead

  const updateQuantity = useCallback(async (itemId, size, quantity) => {
    // Store previous quantity for rollback on error
    const prevQuantity = cartItems[itemId]?.[size] || 0;
    
    // Optimistically update the UI
    setCartItems(prevCartItems => {
      const newCartItems = { ...prevCartItems };
      
      if (quantity > 0) {
        newCartItems[itemId] = {
          ...newCartItems[itemId],
          [size]: quantity
        };
      } else {
        // Remove the size if quantity is 0 or negative
        if (newCartItems[itemId]) {
          const { [size]: _, ...restSizes } = newCartItems[itemId];
          if (Object.keys(restSizes).length > 0) {
            newCartItems[itemId] = restSizes;
          } else {
            delete newCartItems[itemId];
          }
        }
      }
      
      return newCartItems;
    });

    if (token) {
      try {
        await apiClient.post(
          "/api/cart/update",
          { itemId, size, quantity },
          { 
            headers: { token },
            timeout: TIMEOUTS.medium,
            // Use a unique key for deduplication
            _dedupeKey: `update_${itemId}_${size}`
          }
        );
        
        // Invalidate cart cache after successful update
        globalCache.userCart.timestamp = 0;
      } catch (error) {
        // Revert optimistic update on error
        setCartItems(prevCartItems => {
          const newCartItems = { ...prevCartItems };
          
          if (prevQuantity > 0) {
            newCartItems[itemId] = {
              ...newCartItems[itemId],
              [size]: prevQuantity
            };
          } else if (newCartItems[itemId]) {
            const { [size]: _, ...restSizes } = newCartItems[itemId];
            if (Object.keys(restSizes).length > 0) {
              newCartItems[itemId] = restSizes;
            } else {
              delete newCartItems[itemId];
            }
          }
          
          return newCartItems;
        });
        
        console.error('Failed to update cart:', error.message);
        toast.error(error.response?.data?.message || 'Failed to update cart');
      }
    }
  }, [cartItems, token, backendUrl]);

  // Removed duplicate getCartAmount - using cartAmount instead

  const getProductsData = useCallback(async (forceRefresh = false) => {
    // Check cache first - if cached, load instantly!
    if (!forceRefresh && cacheValidationRef.current('products')) {
      debugCache('HIT', 'products', globalCache.products.data);
      setProducts(globalCache.products.data);
      setLoading(false);
      setInitialLoad(false);
      setCacheStatus(true);
      return;
    }

    // Only show loading and delays for actual API calls
    const isFirstLoad = firstLoadRef.current;
    const minLoadTime = isFirstLoad ? 600 : 0; // Only delay on very first load
    const startTime = Date.now();
    
    try {
      setLoading(true);
      setCacheStatus(false); // Clear cache status while loading
      
      if (backendUrl) {
        const response = await apiClient.get("/api/product/list", {
          timeout: TIMEOUTS.fast, // Use fast timeout for product listing
          params: forceRefresh ? { _t: Date.now() } : {} // Add timestamp to bypass cache if force refresh
        });
        
        if (response.data.success) {
          const productsData = response.data.products;
          setProducts(productsData);
          
          // Cache the data
          globalCache.products = {
            data: productsData,
            timestamp: Date.now()
          };
          debugCache('SET', 'products', productsData);
          setCacheStatus(true); // Update cache status
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
      
      // Only apply minimum loading time on first load for smooth UX
      if (isFirstLoad) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch products:', error.message);
      setProducts([]);
      
      // Even on error, respect minimum time only for first load
      if (isFirstLoad) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      }
    } finally {
      setLoading(false);
      firstLoadRef.current = false;
      setInitialLoad(false);
    }
  }, [backendUrl]);

  const getFeaturedProducts = useCallback(async (type = 'manual', limit = 8, forceRefresh = false) => {
    const cacheKey = `featuredProducts_${type}_${limit}`;
    
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh && cacheValidationRef.current('featuredProducts') && globalCache.featuredProducts.cacheKey === cacheKey) {
      setFeaturedProducts(globalCache.featuredProducts.data);
      debugCache('HIT', 'featuredProducts', globalCache.featuredProducts.data);
      return globalCache.featuredProducts.data;
    }

    try {
      const response = await apiClient.get(
        `/api/product/featured?type=${type}&limit=${limit}`,
        { 
          timeout: TIMEOUTS.fast,
          _t: forceRefresh ? Date.now() : undefined // Add timestamp to bypass cache if force refresh
        }
      );
      
      if (response.data.success) {
        const featuredData = response.data.products;
        setFeaturedProducts(featuredData);
        
        // Cache the data with priority information
        globalCache.featuredProducts = {
          data: featuredData,
          timestamp: Date.now(),
          cacheKey
        };
        debugCache('SET', 'featuredProducts', featuredData);
        
        return featuredData;
      }
    } catch (error) {
      console.error('Failed to fetch featured products:', error.message);
    }
    return [];
  }, [backendUrl]);

  // Function to refresh featured products cache
  const refreshFeaturedProducts = useCallback(async (type = 'manual', limit = 8) => {
    // Force refresh by invalidating cache
    globalCache.featuredProducts.timestamp = 0;
    return await getFeaturedProducts(type, limit, true);
  }, [getFeaturedProducts]);

  const getUserCart = useCallback(async (userToken) => {
    // Check cache first
    if (cacheValidationRef.current('userCart') && globalCache.userCart.userId === userToken) {
      setCartItems(globalCache.userCart.data);
      return;
    }

    try {
      const res = await apiClient.post(
        "/api/cart/get",
        {},
        { 
          headers: { token: userToken },
          timeout: TIMEOUTS.fast
        }
      );

      if (res.data.success) {
        setCartItems(res.data.cartData);
        
        // Cache the cart data
        globalCache.userCart = {
          data: res.data.cartData,
          timestamp: Date.now(),
          userId: userToken
        };
      }
    } catch (error) {
      console.error('Failed to fetch user cart:', error.message);
    }
  }, [backendUrl]);


  const memoizedFilteredProducts = useMemo(() => {
    if (!search || search.trim() === '') {
      return products;
    }
    
    const searchTerm = search.toLowerCase().trim();
    return products.filter(product => {
      // Pre-compute lowercase values for better performance
      const name = product.name.toLowerCase();
      const description = product.description.toLowerCase();
      const category = product.category.toLowerCase();
      const subCategory = product.subCategory.toLowerCase();
      
      return name.includes(searchTerm) ||
             description.includes(searchTerm) ||
             category.includes(searchTerm) ||
             subCategory.includes(searchTerm);
    });
  }, [search, products]);

  // Update filtered products when memoized value changes
  useEffect(() => {
    setFilteredProducts(memoizedFilteredProducts);
  }, [memoizedFilteredProducts]);

  useEffect(() => {
    getProductsData();
  }, [getProductsData]);

  useEffect(() => {
    if (!token && localStorage.getItem("token")) {
      setToken(localStorage.getItem("token"));
      getUserCart(localStorage.getItem("token"));
    }
  }, []);

  // Load cart whenever token changes (login/logout)
  useEffect(() => {
    if (token) {
      getUserCart(token);
    } else {
      // Clear cart when logged out
      setCartItems({});
      // Clear cart cache
      globalCache.userCart = { data: null, timestamp: 0, userId: null };
    }
  }, [token, getUserCart]);

  // Direct boolean expression to reflect TTL expiry immediately without waiting for cacheStatus changes
  const isProductsCached = cacheStatus && cacheValidationRef.current && cacheValidationRef.current('products');

  // Ultra-stable primitive values memo - minimal dependencies
  const primitiveValues = useMemo(() => ({
    currency,
    delivery_fee,
    backendUrl,
    navigate,
  }), [backendUrl, navigate]);

  // User-related values without setter dependencies (setters are stable by design)
  const userValues = useMemo(() => ({
    token,
  }), [token]);

  // Loading state micro-memo - separate from product data
  const loadingValues = useMemo(() => ({
    loading,
    initialLoad,
    isProductsCached,
    cacheStatus,
  }), [loading, initialLoad, isProductsCached, cacheStatus]);

  // Product data values - separate from loading state
  const productValues = useMemo(() => ({
    products,
    filteredProducts,
    featuredProducts,
  }), [products, filteredProducts, featuredProducts]);

  // Calculate cart count and amount
  const cartCount = useMemo(() => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalCount += cartItems[items][item];
          }
        } catch (e) {}
      }
    }
    return totalCount;
  }, [cartItems]);

  // Calculate cart total amount
  const cartAmount = useMemo(() => {
    // If no products loaded yet, return 0 to avoid calculation errors
    if (products.length === 0) {
      if (Object.keys(cartItems).length > 0 && import.meta.env.DEV) {
        console.warn('⏳ Cart has items but products not loaded yet');
      }
      return 0;
    }
    
    // If no cart items, return 0
    if (Object.keys(cartItems).length === 0) {
      return 0;
    }
    
    let totalAmount = 0;
    let itemsNotFound = [];
    
    for (const items in cartItems) {
      const itemInfo = products.find((product) => product._id === items);
      
      if (!itemInfo) {
        itemsNotFound.push(items);
        continue;
      }

      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            const itemPrice = getVariantPrice(itemInfo, item);
            const quantity = cartItems[items][item];
            const lineTotal = itemPrice * quantity;
            totalAmount += lineTotal;
          }
        } catch (e) {
          console.error('❌ Error calculating price for item:', items, item, e);
        }
      }
    }
    
    // Log warnings for items not found
    if (itemsNotFound.length > 0 && import.meta.env.DEV) {
      console.warn('⚠️ Cart items not found in products:', itemsNotFound);
    }
    
    // Log final calculation in dev mode
    if (import.meta.env.DEV && totalAmount > 0) {
      console.log('🎯 Cart total calculated:', totalAmount);
    }
    
    return totalAmount;
  }, [cartItems, products]);

  // Cart data - read-only cart information
  const cartData = useMemo(() => ({
    cartItems,
    cartCount,
    cartAmount,
    getCartCount: cartCount, // Backward compatibility
    getCartAmount: cartAmount, // Backward compatibility
  }), [cartItems, cartCount, cartAmount]);

  // Cart actions - functions that modify cart state
  const cartActions = useMemo(() => ({
    addToCart,
    updateQuantity,
  }), [addToCart, updateQuantity]);

  // Search values without setter dependency (setSearch is stable)
  const searchValues = useMemo(() => ({
    search,
    showSearch,
  }), [search, showSearch]);

  // Animation values - stable callback functions
  const animationValues = useMemo(() => ({
    registerCartAnimation,
    triggerCartAnimation,
  }), [registerCartAnimation, triggerCartAnimation]);

  // Data functions - functions that fetch data
  const dataFunctions = useMemo(() => ({
    getProductsData,
    getFeaturedProducts,
  }), [getProductsData, getFeaturedProducts]);

  // Action functions - functions that trigger actions
  const actionFunctions = useMemo(() => ({
    refreshFeaturedProducts,
  }), [refreshFeaturedProducts]);

  // Stable setter functions - React setters are stable by design
  const setterFunctions = useMemo(() => ({
    setToken,
    setCartItems,
    setSearch,
    setShowSearch,
  }), []);

  // Combine all micro-memoized value groups
  const value = useMemo(() => ({
    ...primitiveValues,
    ...userValues,
    ...loadingValues,
    ...productValues,
    ...cartData,
    ...cartActions,
    ...searchValues,
    ...animationValues,
    ...dataFunctions,
    ...actionFunctions,
    ...setterFunctions,
  }), [primitiveValues, userValues, loadingValues, productValues, cartData, cartActions, searchValues, animationValues, dataFunctions, actionFunctions, setterFunctions]);

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
