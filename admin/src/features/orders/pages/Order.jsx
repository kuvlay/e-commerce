import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl, currency } from "../../../App";
import { assets } from "../../../assets/assets";
import "../styles/admin-shipping-animations.css";
import { 
  handleError, 
  handleErrorWithRetry, 
  createErrorReport, 
  handleValidationErrors 
} from "../../../utils/errorHandler";

const Order = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [shippingInfo, setShippingInfo] = useState({});

  const fetchAllOrders = async () => {
    try {
      setIsLoading(true);
      
      if (!token) {
        toast.error('Admin session expired. Please login again.');
        setIsLoading(false);
        return null;
      }
      
      console.log('📆 Fetching all orders...');
      
      const res = await axios.post(
        backendUrl + "/api/order/list",
        {},
        { headers: { token } }
      );

      if (res.data.success) {
        const ordersData = res.data.orders || [];
        console.log(`📆 Received ${ordersData.length} orders from backend`);
        
        setOrders(ordersData.reverse());
        
        // Process shipping info from backend data (Requirements 1.2, 1.3)
        const shippingInfoData = {};
        let shippingInfoCount = 0;
        
        ordersData.forEach(order => {
          const shippingInfo = order.shippingInfo;
          
          // Check if order has valid shipping info from backend
          if (shippingInfo && typeof shippingInfo === 'object' && !Array.isArray(shippingInfo)) {
            // Extract and validate carrier and tracking number
            const carrier = (shippingInfo.carrier && typeof shippingInfo.carrier === 'string') 
              ? shippingInfo.carrier.trim() 
              : '';
            const trackingNumber = (shippingInfo.trackingNumber && typeof shippingInfo.trackingNumber === 'string') 
              ? shippingInfo.trackingNumber.trim() 
              : '';
            
            // Include shipping info if at least one field has data
            if (carrier || trackingNumber) {
              shippingInfoData[order._id] = {
                carrier,
                trackingNumber,
                lastUpdated: shippingInfo.shippedAt ? new Date(shippingInfo.shippedAt) : new Date()
              };
              shippingInfoCount++;
              
              console.log(`🚚 Order ${order._id.slice(-6)} shipping info loaded:`, {
                carrier: carrier || '(empty)',
                trackingNumber: trackingNumber || '(empty)'
              });
            }
          }
        });
        
        console.log(`🚚 Shipping info processing complete: ${shippingInfoCount}/${ordersData.length} orders have shipping data`);
        
        // Clean state replacement to fix persistence issues (Requirements 1.2, 1.3, 1.4)
        // Replace problematic state merging with clean state replacement on data load
        const cleanShippingInfoState = {};
        
        // Initialize shipping info for all orders with clean state management
        ordersData.forEach(order => {
          const orderId = order._id;
          
          // Use backend data if available - clean initialization from backend
          if (shippingInfoData[orderId]) {
            cleanShippingInfoState[orderId] = {
              carrier: shippingInfoData[orderId].carrier || '',
              trackingNumber: shippingInfoData[orderId].trackingNumber || '',
              hasUnsavedChanges: false,
              isFromBackend: true,
              lastUpdated: shippingInfoData[orderId].lastUpdated || new Date(),
              persistenceVerified: true,
              validationError: null,
              persistenceFailure: false,
              isSaving: false,
              dataSource: 'backend_load',
              backendLoadTimestamp: new Date()
            };
          }
          // Initialize empty state for orders without shipping info
          else {
            cleanShippingInfoState[orderId] = {
              carrier: '',
              trackingNumber: '',
              hasUnsavedChanges: false,
              isFromBackend: false,
              lastUpdated: null,
              persistenceVerified: false,
              validationError: null,
              persistenceFailure: false,
              isSaving: false,
              dataSource: 'initialized_empty',
              backendLoadTimestamp: new Date()
            };
          }
        });
        
        // Clean state replacement - no merging with previous state to ensure proper reload
        setShippingInfo(cleanShippingInfoState);
        
        // Log clean state replacement summary for debugging
        const stateStats = {
          totalOrders: ordersData.length,
          withBackendData: Object.values(cleanShippingInfoState).filter(info => info.isFromBackend).length,
          newlyInitialized: Object.values(cleanShippingInfoState).filter(info => info.dataSource === 'initialized_empty').length
        };
        console.log('🔄 Clean shipping info state replacement completed:', stateStats);
        
        if (ordersData.length === 0) {
          toast.info("No orders found. This is normal for a new store.");
        } else {
          console.log(`✅ Orders loaded successfully. ${shippingInfoCount} with shipping info.`);
        }
        
        // Return fresh orders data for immediate use by callers
        return ordersData;
      } else {
        console.error('❌ Failed to fetch orders:', res.data.message);
        toast.error(res.data.message || "Failed to fetch orders");
        setOrders([]);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      
      // Use comprehensive error handler utility
      const errorInfo = handleError(
        error, 
        'fetching orders', 
        () => fetchAllOrders(),
        { 
          showToast: true,
          logToConsole: true,
          duration: 6000
        }
      );
      
      // Create detailed error report for debugging
      const errorReport = createErrorReport(error, 'order fetching', {
        tokenPresent: !!token,
        ordersCount: orders.length,
        lastFetchTime: new Date().toISOString()
      });
      
      console.error('Order fetch error report:', errorReport);
      
      setOrders([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced validation utility function for shipping information with comprehensive error handling
  const validateShippingInfo = (carrier, trackingNumber) => {
    const errors = [];
    const warnings = [];
    
    // Trim inputs for validation
    const trimmedCarrier = carrier ? carrier.trim() : '';
    const trimmedTracking = trackingNumber ? trackingNumber.trim() : '';
    
    // Check if at least one field is provided
    if (!trimmedCarrier && !trimmedTracking) {
      errors.push({
        field: 'both',
        message: 'Please enter either a carrier name or tracking number',
        code: 'REQUIRED_FIELD_MISSING',
        severity: 'error'
      });
    }
    
    // Enhanced network connectivity check
    if (!navigator.onLine) {
      errors.push({
        field: 'network',
        message: 'No internet connection. Please check your network and try again.',
        code: 'NETWORK_OFFLINE',
        severity: 'error'
      });
    }
    
    // Enhanced carrier name validation
    if (trimmedCarrier) {
      // Length validation
      if (trimmedCarrier.length > 50) {
        errors.push({
          field: 'carrier',
          message: `Carrier name is too long (${trimmedCarrier.length}/50 characters)`,
          code: 'CARRIER_TOO_LONG',
          severity: 'error'
        });
      } else if (trimmedCarrier.length < 2) {
        errors.push({
          field: 'carrier',
          message: 'Carrier name must be at least 2 characters',
          code: 'CARRIER_TOO_SHORT',
          severity: 'error'
        });
      }
      
      // Character validation with specific guidance
      if (!/^[a-zA-Z0-9\s\-&.()]+$/.test(trimmedCarrier)) {
        const invalidChars = trimmedCarrier.match(/[^a-zA-Z0-9\s\-&.()]/g);
        errors.push({
          field: 'carrier',
          message: `Invalid characters found: ${[...new Set(invalidChars)].join(', ')}. Only letters, numbers, spaces, hyphens, &, periods, and parentheses are allowed.`,
          code: 'CARRIER_INVALID_CHARS',
          severity: 'error'
        });
      }
      
      // Common carrier name suggestions and warnings
      const commonCarriers = ['fedex', 'ups', 'dhl', 'usps', 'amazon', 'blue dart', 'dtdc', 'ecom express'];
      const lowerCarrier = trimmedCarrier.toLowerCase();
      const isCommonCarrier = commonCarriers.some(common => lowerCarrier.includes(common));
      
      if (!isCommonCarrier && trimmedCarrier.length > 0) {
        warnings.push({
          field: 'carrier',
          message: 'Consider using a standard carrier name (e.g., FedEx, UPS, DHL, USPS)',
          code: 'CARRIER_UNCOMMON',
          severity: 'warning'
        });
      }
      
      // Check for potential typos in common carriers
      const typoSuggestions = {
        'fedx': 'FedEx',
        'fed ex': 'FedEx',
        'fedexp': 'FedEx',
        'upss': 'UPS',
        'dhll': 'DHL',
        'uspss': 'USPS',
        'amazn': 'Amazon',
        'bluedart': 'Blue Dart'
      };
      
      const suggestion = typoSuggestions[lowerCarrier];
      if (suggestion) {
        warnings.push({
          field: 'carrier',
          message: `Did you mean "${suggestion}"?`,
          code: 'CARRIER_TYPO_SUGGESTION',
          severity: 'suggestion'
        });
      }
    }
    
    // Enhanced tracking number validation
    if (trimmedTracking) {
      // Length validation
      if (trimmedTracking.length > 50) {
        errors.push({
          field: 'trackingNumber',
          message: `Tracking number is too long (${trimmedTracking.length}/50 characters)`,
          code: 'TRACKING_TOO_LONG',
          severity: 'error'
        });
      } else if (trimmedTracking.length < 3) {
        errors.push({
          field: 'trackingNumber',
          message: 'Tracking number must be at least 3 characters',
          code: 'TRACKING_TOO_SHORT',
          severity: 'error'
        });
      }
      
      // Character validation with specific guidance
      if (!/^[a-zA-Z0-9\s\-]+$/.test(trimmedTracking)) {
        const invalidChars = trimmedTracking.match(/[^a-zA-Z0-9\s\-]/g);
        errors.push({
          field: 'trackingNumber',
          message: `Invalid characters found: ${[...new Set(invalidChars)].join(', ')}. Only letters, numbers, spaces, and hyphens are allowed.`,
          code: 'TRACKING_INVALID_CHARS',
          severity: 'error'
        });
      }
      
      // Format validation for common tracking number patterns
      const trackingPatterns = {
        fedex: /^(\d{12}|\d{14}|96\d{20})$/,
        ups: /^1Z[0-9A-Z]{16}$/,
        dhl: /^\d{10,11}$/,
        usps: /^(94\d{20}|92\d{20}|93\d{20})$/
      };
      
      // Check if tracking number matches common patterns
      let formatValid = false;
      const cleanTracking = trimmedTracking.replace(/[\s\-]/g, '');
      
      for (const [carrier, pattern] of Object.entries(trackingPatterns)) {
        if (pattern.test(cleanTracking)) {
          formatValid = true;
          warnings.push({
            field: 'trackingNumber',
            message: `Format matches ${carrier.toUpperCase()} tracking number`,
            code: 'TRACKING_FORMAT_RECOGNIZED',
            severity: 'info'
          });
          break;
        }
      }
      
      // Warn about unusual tracking number format
      if (!formatValid && cleanTracking.length > 6) {
        warnings.push({
          field: 'trackingNumber',
          message: 'Tracking number format not recognized. Please verify it\'s correct.',
          code: 'TRACKING_FORMAT_UNKNOWN',
          severity: 'warning'
        });
      }
      
      // Check for common tracking number issues
      if (/^[0]+$/.test(cleanTracking)) {
        errors.push({
          field: 'trackingNumber',
          message: 'Tracking number cannot be all zeros',
          code: 'TRACKING_ALL_ZEROS',
          severity: 'error'
        });
      }
      
      if (/test|sample|dummy|placeholder/i.test(trimmedTracking)) {
        warnings.push({
          field: 'trackingNumber',
          message: 'This appears to be a test tracking number',
          code: 'TRACKING_TEST_VALUE',
          severity: 'warning'
        });
      }
    }
    
    // Cross-field validation
    if (trimmedCarrier && trimmedTracking) {
      // Check if carrier and tracking number are consistent
      const carrierLower = trimmedCarrier.toLowerCase();
      const trackingUpper = trimmedTracking.toUpperCase();
      
      if (carrierLower.includes('fedex') && !trackingUpper.match(/^\d{12}|\d{14}|96\d{20}$/)) {
        warnings.push({
          field: 'both',
          message: 'Tracking number format may not match FedEx format',
          code: 'CARRIER_TRACKING_MISMATCH',
          severity: 'warning'
        });
      }
      
      if (carrierLower.includes('ups') && !trackingUpper.match(/^1Z[0-9A-Z]{16}$/)) {
        warnings.push({
          field: 'both',
          message: 'Tracking number format may not match UPS format',
          code: 'CARRIER_TRACKING_MISMATCH',
          severity: 'warning'
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: {
        carrier: trimmedCarrier,
        trackingNumber: trimmedTracking
      },
      validationSummary: {
        errorCount: errors.length,
        warningCount: warnings.length,
        hasBlockingErrors: errors.some(e => e.severity === 'error'),
        hasSuggestions: warnings.some(w => w.severity === 'suggestion')
      }
    };
  };

  // Enhanced retry mechanism with intelligent backoff and comprehensive error handling
  const saveShippingInfoWithRetry = async (orderId, maxRetries = 3, baseDelay = 1000) => {
    const retryStartTime = Date.now();
    let lastError = null;
    
    // Enhanced retry strategy based on error type
    const getRetryStrategy = (error, attempt) => {
      if (error?.response?.status === 401) {
        // Auth errors - don't retry, need re-login
        return { shouldRetry: false, delay: 0, reason: 'Authentication expired' };
      }
      
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        // Client errors (except auth) - retry with shorter delay
        return { shouldRetry: attempt < 2, delay: baseDelay, reason: 'Client error' };
      }
      
      if (error?.response?.status >= 500) {
        // Server errors - retry with exponential backoff
        return { shouldRetry: true, delay: baseDelay * Math.pow(2, attempt - 1), reason: 'Server error' };
      }
      
      if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
        // Network errors - retry with longer delay
        return { shouldRetry: true, delay: baseDelay * Math.pow(1.5, attempt - 1) + 2000, reason: 'Network error' };
      }
      
      // Unknown errors - standard exponential backoff
      return { shouldRetry: true, delay: baseDelay * Math.pow(2, attempt - 1), reason: 'Unknown error' };
    };
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Update UI to show current attempt
        setShippingInfo(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            retryAttempt: attempt,
            maxRetries,
            isRetrying: true,
            retryStartTime,
            retryReason: attempt === 1 ? 'Initial attempt' : `Retry ${attempt}/${maxRetries}`,
            lastRetryError: lastError
          }
        }));
        
        const result = await saveShippingInfo(orderId, attempt);
        if (result) {
          // Success - clear retry state and show success feedback
          setShippingInfo(prev => ({
            ...prev,
            [orderId]: {
              ...prev[orderId],
              isRetrying: false,
              retryAttempt: 0,
              retrySuccess: true,
              retryDuration: Date.now() - retryStartTime,
              lastRetryError: null
            }
          }));
          
          // Show success message with retry context
          if (attempt > 1) {
            toast.success(`✅ Shipping info saved successfully after ${attempt} attempt${attempt > 1 ? 's' : ''}!`, {
              duration: 4000
            });
          }
          
          return true;
        }
        
        // If validation failed, don't retry
        const currentInfo = shippingInfo[orderId];
        if (currentInfo?.validationError && !currentInfo?.persistenceFailure) {
          setShippingInfo(prev => ({
            ...prev,
            [orderId]: {
              ...prev[orderId],
              isRetrying: false,
              retryAttempt: 0,
              retryFailureReason: 'Validation error - no retry needed'
            }
          }));
          return false;
        }
        
        // If this was the last attempt, don't wait
        if (attempt === maxRetries) {
          setShippingInfo(prev => ({
            ...prev,
            [orderId]: {
              ...prev[orderId],
              isRetrying: false,
              retryAttempt: 0,
              retryFailureReason: 'Maximum retry attempts reached',
              retryDuration: Date.now() - retryStartTime
            }
          }));
          return false;
        }
        
        // Determine retry strategy for next attempt
        const strategy = getRetryStrategy(lastError, attempt);
        if (!strategy.shouldRetry) {
          setShippingInfo(prev => ({
            ...prev,
            [orderId]: {
              ...prev[orderId],
              isRetrying: false,
              retryAttempt: 0,
              retryFailureReason: strategy.reason
            }
          }));
          return false;
        }
        
        const delay = strategy.delay;
        console.log(`🔄 Retry attempt ${attempt} failed (${strategy.reason}), waiting ${delay}ms before retry ${attempt + 1}`);
        
        // Enhanced countdown with retry reason
        setShippingInfo(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            retryCountdown: Math.ceil(delay / 1000),
            retryReason: `${strategy.reason} - retrying in`,
            nextRetryDelay: delay
          }
        }));
        
        // Smooth countdown timer with progress indication
        const countdownInterval = 100; // Update every 100ms for smooth progress
        const totalSteps = Math.ceil(delay / countdownInterval);
        
        for (let step = 0; step < totalSteps; step++) {
          const remainingMs = delay - (step * countdownInterval);
          const remainingSeconds = Math.ceil(remainingMs / 1000);
          const progress = (step / totalSteps) * 100;
          
          setShippingInfo(prev => ({
            ...prev,
            [orderId]: {
              ...prev[orderId],
              retryCountdown: remainingSeconds,
              retryProgress: progress
            }
          }));
          
          await new Promise(resolve => setTimeout(resolve, countdownInterval));
        }
        
      } catch (error) {
        lastError = error;
        console.error(`Retry attempt ${attempt} failed:`, error);
        
        // Determine if we should continue retrying
        const strategy = getRetryStrategy(error, attempt);
        
        if (attempt === maxRetries || !strategy.shouldRetry) {
          setShippingInfo(prev => ({
            ...prev,
            [orderId]: {
              ...prev[orderId],
              isRetrying: false,
              retryAttempt: 0,
              retryFailureReason: strategy.reason,
              retryDuration: Date.now() - retryStartTime,
              lastRetryError: error.message || 'Unknown error'
            }
          }));
          
          // Show comprehensive error message
          const errorMsg = strategy.reason === 'Authentication expired' 
            ? 'Session expired. Please refresh the page and login again.'
            : strategy.reason === 'Network error'
            ? 'Network connection failed. Please check your internet connection.'
            : `Failed to save after ${maxRetries} attempts. Please try again later.`;
          
          toast.error(errorMsg, { duration: 6000 });
          return false;
        }
      }
    }
    return false;
  };

  const saveShippingInfo = async (orderId, retryAttempt = 1) => {
    try {
      if (!token) {
        const errorMsg = 'Admin session expired. Please login again.';
        toast.error(errorMsg);
        setShippingInfo(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            validationError: errorMsg,
            persistenceFailure: true,
            errorType: 'auth_error'
          }
        }));
        return false;
      }

      const order = orders.find(o => o._id === orderId);
      if (!order) {
        const errorMsg = 'Order not found';
        toast.error(errorMsg);
        setShippingInfo(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            validationError: errorMsg,
            persistenceFailure: true,
            errorType: 'order_not_found'
          }
        }));
        return false;
      }

      const shipping = shippingInfo[orderId];
      const rawCarrier = shipping?.carrier || '';
      const rawTrackingNumber = shipping?.trackingNumber || '';
      
      // Enhanced validation with detailed error reporting
      const validation = validateShippingInfo(rawCarrier, rawTrackingNumber);
      
      if (!validation.isValid) {
        const primaryError = validation.errors[0];
        toast.error(primaryError.message);
        
        setShippingInfo(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            validationError: primaryError.message,
            validationErrors: validation.errors,
            persistenceFailure: false,
            errorType: 'validation_error',
            errorCode: primaryError.code
          }
        }));
        return false;
      }
      
      const { carrier, trackingNumber } = validation.sanitizedData;
      
      console.log(`💾 Saving shipping info for order ${orderId}:`, { carrier, trackingNumber });

      // Clear any previous validation errors and show saving state
      setShippingInfo(prev => ({
        ...prev,
        [orderId]: {
          ...prev[orderId],
          isSaving: true,
          validationError: null,
          persistenceFailure: false,
          saveAttemptTimestamp: new Date()
        }
      }));

      const requestBody = {
        orderId,
        status: order.order_status || order.status, // Keep current status
        shippingInfo: { carrier, trackingNumber }
      };

      const res = await axios.post(backendUrl + "/api/order/status", requestBody, { headers: { token } });

      if (res.data.success) {
        // Enhanced immediate feedback with persistence verification (Requirement 2.2)
        toast.success("Shipping information saved successfully!");
        
        // Update local state immediately with comprehensive tracking (Requirement 2.1)
        setShippingInfo(prev => ({
          ...prev,
          [orderId]: { 
            carrier, 
            trackingNumber, 
            hasUnsavedChanges: false,
            isFromBackend: true,
            lastUpdated: new Date(),
            isSaving: false,
            persistenceVerified: true,
            validationError: null,
            persistenceFailure: false,
            saveSuccessTimestamp: new Date(),
            dataSource: 'admin_save'
          }
        }));
        
        // Simple persistence verification without recursive fetchAllOrders call (Requirement 1.4)
        console.log(`✅ Shipping info saved successfully for order ${orderId}`);
        
        return true;
        
      } else {
        // Enhanced error handling with specific failure tracking (Requirement 2.4)
        const errorMessage = res.data.message || "Failed to save shipping information";
        toast.error(errorMessage);
        
        setShippingInfo(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            isSaving: false,
            persistenceFailure: true,
            persistenceVerified: false,
            errorMessage: errorMessage,
            errorTimestamp: new Date()
          }
        }));
        
        return false;
      }
    } catch (error) {
      console.error('Error saving shipping info:', error);
      
      // Use comprehensive error handler utility
      const errorInfo = handleError(
        error, 
        `saving shipping info for order ${orderId}`, 
        () => saveShippingInfo(orderId),
        { 
          showToast: true,
          logToConsole: true,
          duration: 6000
        }
      );
      
      // Handle validation errors specifically
      if (error.response?.status === 400 && error.response?.data?.errors) {
        handleValidationErrors(error.response.data.errors, 'shipping information');
      }
      
      // Enhanced error state tracking with comprehensive metadata
      setShippingInfo(prev => ({
        ...prev,
        [orderId]: {
          ...prev[orderId],
          isSaving: false,
          persistenceFailure: true,
          persistenceVerified: false,
          errorMessage: errorInfo.message,
          errorTimestamp: new Date(),
          errorType: errorInfo.category,
          errorCode: error.response?.status || error.code,
          errorDetails: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            responseData: error.response?.data,
            requestUrl: error.config?.url,
            requestMethod: error.config?.method,
            userAgent: navigator.userAgent,
            connectionType: navigator.connection?.effectiveType,
            onlineStatus: navigator.onLine
          },
          retryable: errorInfo.retryable,
          userAction: errorInfo.action,
          retryCount: (prev[orderId]?.retryCount || 0) + 1,
          lastRetryAt: new Date(),
          errorReport: createErrorReport(error, `shipping info save for order ${orderId}`, {
            orderId,
            shippingInfo: shippingInfo[orderId]
          })
        }
      }));
      
      return false;
    }
  };

  const statusHandler = async (e, orderId) => {
    const newStatus = e.target.value;
    
    try {
      if (!token) {
        toast.error('Admin session expired. Please login again.');
        return;
      }
      
      // For real orders, confirm and then make API call
      if (!window.confirm(`Change status to "${newStatus}"?`)) return;
      
      const requestBody = { orderId, status: newStatus };
      
      // Include shipping info if status is shipped and we have shipping data
      if (['Shipped', 'OutForDelivery', 'Delivered'].includes(newStatus) && shippingInfo[orderId]) {
        console.log(`🚚 Including shipping info for order ${orderId}:`, shippingInfo[orderId]);
        requestBody.shippingInfo = shippingInfo[orderId];
      }
      
      console.log(`🔄 Updating order ${orderId} status to ${newStatus}`);
      
      const res = await axios.post(
        backendUrl + "/api/order/status",
        requestBody,
        { headers: { token } }
      );

      if (res.data.success) {
        console.log(`✅ Order ${orderId} status updated successfully`);
        
        // Refresh orders to get updated data from backend
        await fetchAllOrders();
        
        toast.success("Order status updated successfully!");
        
        // Keep shipping info in local state - don't clear it
        // This allows users to see what they entered and make corrections if needed
        console.log(`💾 Keeping shipping info in local state for order ${orderId}`);
        
      } else {
        console.error(`❌ Failed to update order ${orderId}:`, res.data.message);
        toast.error(res.data.message || "Failed to update order status");
      }
    } catch (error) {
      console.error(`❌ Error updating order ${orderId}:`, error);
      
      // Use comprehensive error handler utility
      const errorInfo = handleError(
        error, 
        `updating order ${orderId} status to ${newStatus}`, 
        () => statusHandler({ target: { value: newStatus } }, orderId),
        { 
          showToast: true,
          logToConsole: true,
          duration: 6000
        }
      );
      
      // Handle validation errors specifically
      if (error.response?.status === 400 && error.response?.data?.message) {
        toast.error(`❌ Status Update Failed: ${error.response.data.message}`, { duration: 8000 });
      }
      
      // Create detailed error report for debugging
      const errorReport = createErrorReport(error, `status update for order ${orderId}`, {
        orderId,
        newStatus,
        currentStatus: orders.find(o => o._id === orderId)?.order_status,
        tokenPresent: !!token,
        hasShippingInfo: !!shippingInfo[orderId]
      });
      
      console.error('Status update error report:', errorReport);
    }
  };

  // Enhanced unsaved changes warning with detailed information
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const unsavedOrders = Object.entries(shippingInfo)
        .filter(([orderId, info]) => info?.hasUnsavedChanges)
        .map(([orderId]) => orderId);
      
      if (unsavedOrders.length > 0) {
        e.preventDefault();
        const message = `You have unsaved shipping information for ${unsavedOrders.length} order${unsavedOrders.length !== 1 ? 's' : ''}. Are you sure you want to leave?`;
        e.returnValue = message;
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shippingInfo]);

  // Enhanced keyboard shortcuts and auto-save functionality
  useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      // Ctrl+S or Cmd+S to save all unsaved shipping info
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        
        const unsavedOrders = Object.entries(shippingInfo)
          .filter(([orderId, info]) => info?.hasUnsavedChanges && !info?.isSaving && !info?.isRetrying)
          .map(([orderId]) => orderId);
        
        if (unsavedOrders.length > 0) {
          console.log(`⌨️ Keyboard shortcut: Saving ${unsavedOrders.length} orders`);
          
          // Validate and save all valid orders
          const saveValidOrders = async () => {
            const validationResults = unsavedOrders.map(orderId => {
              const info = shippingInfo[orderId];
              const validation = validateShippingInfo(info?.carrier || '', info?.trackingNumber || '');
              return { orderId, validation };
            });
            
            const validOrders = validationResults.filter(r => r.validation.isValid).map(r => r.orderId);
            const invalidCount = validationResults.length - validOrders.length;
            
            if (invalidCount > 0) {
              toast.warning(`Skipped ${invalidCount} order${invalidCount !== 1 ? 's' : ''} with validation errors`);
            }
            
            if (validOrders.length > 0) {
              const savePromises = validOrders.map(orderId => saveShippingInfo(orderId));
              const results = await Promise.allSettled(savePromises);
              const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
              const failed = results.length - successful;
              
              if (successful > 0) {
                toast.success(`⌨️ Keyboard save: ${successful} order${successful !== 1 ? 's' : ''} saved`);
              }
              if (failed > 0) {
                toast.error(`Failed to save ${failed} order${failed !== 1 ? 's' : ''}`);
              }
            }
          };
          
          saveValidOrders();
        } else {
          toast.info('No unsaved shipping information to save');
        }
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [shippingInfo]);

  // Auto-save functionality with smart timing
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const ordersWithUnsavedChanges = Object.entries(shippingInfo)
        .filter(([orderId, info]) => {
          if (!info?.hasUnsavedChanges || info?.isSaving || info?.isRetrying) return false;
          
          // Only auto-save if changes are older than 2 minutes and valid
          const changeAge = Date.now() - (info.lastModified?.getTime() || 0);
          const isOldEnough = changeAge > 120000; // 2 minutes
          
          if (!isOldEnough) return false;
          
          // Check if data is valid before auto-saving
          const validation = validateShippingInfo(info.carrier || '', info.trackingNumber || '');
          return validation.isValid;
        })
        .map(([orderId]) => orderId);
      
      if (ordersWithUnsavedChanges.length > 0) {
        console.log(`🤖 Auto-save triggered for ${ordersWithUnsavedChanges.length} orders with old unsaved changes`);
        
        // Auto-save valid orders
        ordersWithUnsavedChanges.forEach(async (orderId) => {
          try {
            const success = await saveShippingInfo(orderId);
            if (success) {
              console.log(`🤖 Auto-saved order ${orderId}`);
              // Show subtle notification for auto-save
              toast.info(`Auto-saved shipping info for order #${orderId.slice(-6)}`, {
                position: "bottom-right",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: false
              });
            }
          } catch (error) {
            console.warn(`🤖 Auto-save failed for order ${orderId}:`, error);
          }
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(autoSaveInterval);
  }, [shippingInfo]);

  // Enhanced error clearing with user feedback and smart timing
  useEffect(() => {
    const clearErrorsTimeout = setTimeout(() => {
      const ordersWithErrors = Object.entries(shippingInfo)
        .filter(([orderId, info]) => info?.persistenceFailure || info?.validationError)
        .map(([orderId]) => orderId);
      
      if (ordersWithErrors.length > 0) {
        setShippingInfo(prev => {
          const updated = { ...prev };
          let clearedCount = 0;
          
          ordersWithErrors.forEach(orderId => {
            if (updated[orderId]) {
              // Clear old errors but keep recent ones
              const errorAge = Date.now() - (updated[orderId].errorTimestamp?.getTime() || 0);
              const isOldError = errorAge > 120000; // Clear errors older than 2 minutes
              const isValidationError = updated[orderId].validationError && !updated[orderId].persistenceFailure;
              
              // Clear validation errors after user stops typing for 30 seconds
              const validationAge = Date.now() - (updated[orderId].lastModified?.getTime() || 0);
              const shouldClearValidation = isValidationError && validationAge > 30000;
              
              if (isOldError || shouldClearValidation) {
                updated[orderId] = {
                  ...updated[orderId],
                  persistenceFailure: false,
                  validationError: null,
                  validationErrors: [],
                  carrierValidationErrors: [],
                  trackingValidationErrors: [],
                  errorMessage: null,
                  errorType: null,
                  errorCleared: true,
                  errorClearedAt: new Date()
                };
                clearedCount++;
              }
            }
          });
          
          // Provide user feedback when errors are auto-cleared
          if (clearedCount > 0) {
            console.log(`🧹 Auto-cleared ${clearedCount} old error${clearedCount !== 1 ? 's' : ''}`);
          }
          
          return updated;
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearTimeout(clearErrorsTimeout);
  }, [shippingInfo]);

  // Enhanced validation state management
  const getValidationSummary = (orderId) => {
    const info = shippingInfo[orderId];
    if (!info) return { isValid: true, errors: [], warnings: [] };
    
    const errors = [];
    const warnings = [];
    
    // Collect all validation errors
    if (info.validationErrors?.length > 0) {
      errors.push(...info.validationErrors);
    }
    if (info.carrierValidationErrors?.length > 0) {
      errors.push(...info.carrierValidationErrors.map(err => ({ field: 'carrier', message: err })));
    }
    if (info.trackingValidationErrors?.length > 0) {
      errors.push(...info.trackingValidationErrors.map(err => ({ field: 'trackingNumber', message: err })));
    }
    
    // Add warnings for potential issues
    if (info.carrier && info.carrier.length < 3) {
      warnings.push({ field: 'carrier', message: 'Very short carrier name' });
    }
    if (info.trackingNumber && info.trackingNumber.length < 5) {
      warnings.push({ field: 'trackingNumber', message: 'Very short tracking number' });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      hasUnsavedChanges: info.hasUnsavedChanges,
      isSaving: info.isSaving,
      isRetrying: info.isRetrying,
      persistenceFailure: info.persistenceFailure
    };
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  // Filter and sort orders with safe property access
  const filteredOrders = orders
    .filter(order => {
      try {
        // Enhanced customer name resolution with improved validation and backend consistency
        const resolveCustomerName = (order) => {
          try {
            // Priority 1: Backend displayCustomerName (preferred) - with enhanced validation
            if (order.displayCustomerName && typeof order.displayCustomerName === 'string') {
              const trimmedName = order.displayCustomerName.trim();
              if (trimmedName.length > 0 && trimmedName !== 'Unknown Customer' && trimmedName !== 'null' && trimmedName !== 'undefined') {
                return {
                  name: trimmedName,
                  source: 'backend_resolved',
                  confidence: 95,
                  validated: true
                };
              }
            }
            
            // Priority 2: User data from populated user_id - with validation
            if (order.user_id?.name && typeof order.user_id.name === 'string') {
              const trimmedName = order.user_id.name.trim();
              if (trimmedName.length > 0) {
                return {
                  name: trimmedName,
                  source: 'user_id_populated',
                  confidence: 90,
                  validated: true
                };
              }
            }
            
            // Priority 3: Address snapshot name (new schema) - with validation
            if (order.address_snapshot?.name && typeof order.address_snapshot.name === 'string') {
              const trimmedName = order.address_snapshot.name.trim();
              if (trimmedName.length > 0) {
                return {
                  name: trimmedName,
                  source: 'address_snapshot',
                  confidence: 85,
                  validated: true
                };
              }
            }
            
            // Priority 4: Legacy address firstName + lastName - with validation
            if (order.address?.firstName || order.address?.lastName) {
              const firstName = order.address.firstName && typeof order.address.firstName === 'string' ? order.address.firstName.trim() : '';
              const lastName = order.address.lastName && typeof order.address.lastName === 'string' ? order.address.lastName.trim() : '';
              const fullName = [firstName, lastName].filter(name => name.length > 0).join(' ');
              if (fullName.length > 0) {
                return {
                  name: fullName,
                  source: 'legacy_address_names',
                  confidence: 80,
                  validated: true
                };
              }
            }
            
            // Priority 5: Legacy address single name field - with validation
            if (order.address?.name && typeof order.address.name === 'string') {
              const trimmedName = order.address.name.trim();
              if (trimmedName.length > 0) {
                return {
                  name: trimmedName,
                  source: 'legacy_address_name',
                  confidence: 75,
                  validated: true
                };
              }
            }
            
            // Priority 6: Email prefix fallback - with enhanced formatting
            if (order.user_id?.email && typeof order.user_id.email === 'string') {
              try {
                const emailParts = order.user_id.email.split('@');
                const emailPrefix = emailParts[0];
                if (emailPrefix && emailPrefix.length > 0 && emailPrefix.length <= 30) {
                  const readablePrefix = emailPrefix
                    .replace(/[._-]+/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase())
                    .replace(/\s+/g, ' ')
                    .trim();
                  if (readablePrefix.length > 0) {
                    return {
                      name: readablePrefix,
                      source: 'email_prefix',
                      confidence: 40,
                      validated: true
                    };
                  }
                }
              } catch (emailError) {
                console.warn('Admin Order - Email parsing error:', emailError);
              }
            }
            
            // Priority 7: Order ID based fallback
            if (order._id) {
              const orderIdSuffix = order._id.toString().slice(-6);
              return {
                name: `Customer #${orderIdSuffix}`,
                source: 'order_id_fallback',
                confidence: 20,
                validated: false
              };
            }
            
            // Final fallback
            return {
              name: 'Unknown Customer',
              source: 'final_fallback',
              confidence: 0,
              validated: false
            };
          } catch (resolutionError) {
            console.error('Admin Order - Customer name resolution error:', resolutionError, { orderId: order._id });
            return {
              name: 'Customer',
              source: 'error_fallback',
              confidence: 0,
              validated: false,
              error: resolutionError.message
            };
          }
        };
        
        const customerInfo = resolveCustomerName(order);
        const customerName = customerInfo.name;
        
        // Enhanced debug logging for first few orders with validation status
        if (orders.indexOf(order) < 3 && process.env.NODE_ENV === 'development') {
          console.log(`📝 Admin Order - Enhanced customer name resolution:`, {
            orderId: order._id,
            resolution: {
              name: customerName,
              source: customerInfo.source,
              confidence: customerInfo.confidence,
              validated: customerInfo.validated,
              hasError: !!customerInfo.error
            },
            availableFields: {
              displayCustomerName: {
                value: order.displayCustomerName,
                type: typeof order.displayCustomerName,
                length: order.displayCustomerName ? order.displayCustomerName.length : 0
              },
              userId_name: {
                value: order.user_id?.name,
                type: typeof order.user_id?.name,
                populated: !!order.user_id
              },
              addressSnapshot_name: {
                value: order.address_snapshot?.name,
                hasAddressSnapshot: !!order.address_snapshot
              },
              address_firstName: order.address?.firstName,
              address_lastName: order.address?.lastName,
              address_name: order.address?.name,
              user_email: order.user_id?.email
            },
            schemaDetection: {
              hasNewSchema: !!(order.order_status && order.address_snapshot),
              hasLegacySchema: !!(order.status && order.address),
              hasMixedFields: !!(order.order_status && order.status)
            }
          });
        }
        
        const orderId = order._id || '';
        
        const matchesSearch = 
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          orderId.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Normalize status for filtering
        let orderStatus = order.order_status || order.status || '';
        if (orderStatus === 'Order Placed') orderStatus = 'Placed';
        
        const matchesStatus = statusFilter === "all" || orderStatus === statusFilter;
        return matchesSearch && matchesStatus;
      } catch (error) {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        switch (sortBy) {
          case "date":
            const dateA = new Date(a.created_at || a.date || 0);
            const dateB = new Date(b.created_at || b.date || 0);
            return dateB - dateA;
          case "amount":
            const amountA = a.totals?.grand_total || a.amount || 0;
            const amountB = b.totals?.grand_total || b.amount || 0;
            return amountB - amountA;
          case "status":
            const statusA = a.order_status || a.status || '';
            const statusB = b.order_status || b.status || '';
            return statusA.localeCompare(statusB);
          default:
            return 0;
        }
      } catch (error) {
        return 0;
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Placed":
        return "bg-blue-100 text-blue-800";
      case "Packed":
        return "bg-indigo-100 text-indigo-800";
      case "Shipped":
        return "bg-purple-100 text-purple-800";
      case "OutForDelivery":
        return "bg-orange-100 text-orange-800";
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return "⏳";
      case "Placed":
        return "📋";
      case "Packed":
        return "📦";
      case "Shipped":
        return "🚚";
      case "OutForDelivery":
        return "🏃";
      case "Delivered":
        return "✅";
      case "Cancelled":
        return "❌";
      default:
        return "📋";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1 flex items-center">
              <span className="mr-2">🛒</span>
              Order Management
            </h1>
            <p className="text-gray-600 text-sm">Track and manage customer orders</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">💡 Quick Actions</div>
            <div className="text-xs text-gray-400 space-y-0.5">
              <div>⌨️ <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+S</kbd> Save all valid shipping info</div>
              <div>🤖 Auto-save after 2 minutes of inactivity</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg text-white">
          <div className="text-center">
            <p className="text-blue-100 text-sm">Total Orders</p>
            <p className="text-2xl font-bold">{orders.length}</p>
            <div className="text-xl mt-1">📋</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-xl shadow-lg text-white">
          <div className="text-center">
            <p className="text-yellow-100 text-sm">Pending</p>
            <p className="text-2xl font-bold">{orders.filter(o => (o.order_status || o.status) === "Pending").length}</p>
            <div className="text-xl mt-1">⏳</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg text-white">
          <div className="text-center">
            <p className="text-purple-100 text-sm">Shipped</p>
            <p className="text-2xl font-bold">{orders.filter(o => (o.order_status || o.status) === "Shipped").length}</p>
            <div className="text-xl mt-1">🚚</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl shadow-lg text-white">
          <div className="text-center">
            <p className="text-green-100 text-sm">Delivered</p>
            <p className="text-2xl font-bold">{orders.filter(o => (o.order_status || o.status) === "Delivered").length}</p>
            <div className="text-xl mt-1">✅</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-xl shadow-lg text-white">
          <div className="text-center">
            <p className="text-orange-100 text-sm">Revenue</p>
            <p className="text-xl font-bold">{currency}{orders.reduce((sum, o) => sum + (o.totals?.grand_total || o.amount || 0), 0)}</p>
            <div className="text-xl mt-1">💰</div>
          </div>
        </div>
      </div>

      {/* Orders Management */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="px-4 py-2 rounded-xl font-medium bg-blue-500 text-white shadow-lg">
            All Orders ({orders.length})
          </div>
          {(() => {
            const unsavedCount = Object.values(shippingInfo).filter(info => info?.hasUnsavedChanges).length;
            const errorCount = Object.values(shippingInfo).filter(info => info?.persistenceFailure).length;
            const validationErrorCount = Object.values(shippingInfo).filter(info => info?.validationError || info?.validationErrors?.length > 0).length;
            const savingCount = Object.values(shippingInfo).filter(info => info?.isSaving || info?.isRetrying).length;
            
            if (unsavedCount > 0 || errorCount > 0 || validationErrorCount > 0 || savingCount > 0) {
              return (
                <div className="flex flex-wrap items-center gap-3">
                  {/* Saving Status */}
                  {savingCount > 0 && (
                    <div className="px-3 py-1.5 rounded-xl font-medium bg-blue-100 text-blue-800 border border-blue-300 animate-pulse flex items-center space-x-2">
                      <span>⏳ {savingCount} order{savingCount !== 1 ? 's' : ''} being saved</span>
                    </div>
                  )}
                  
                  {/* Unsaved Changes */}
                  {unsavedCount > 0 && (
                    <div className="px-3 py-1.5 rounded-xl font-medium bg-yellow-100 text-yellow-800 border border-yellow-300 animate-pulse flex items-center space-x-2">
                      <span>⚠️ {unsavedCount} order{unsavedCount !== 1 ? 's' : ''} with unsaved shipping info</span>
                      <button
                        onClick={async () => {
                          const unsavedOrders = Object.entries(shippingInfo)
                            .filter(([orderId, info]) => info?.hasUnsavedChanges && !info?.isSaving && !info?.isRetrying)
                            .map(([orderId]) => orderId);
                          
                          if (unsavedOrders.length > 0 && window.confirm(`Save shipping info for ${unsavedOrders.length} orders?`)) {
                            console.log(`🔄 Bulk saving shipping info for ${unsavedOrders.length} orders`);
                            
                            // Validate all orders first
                            const validationResults = unsavedOrders.map(orderId => {
                              const info = shippingInfo[orderId];
                              const validation = validateShippingInfo(info?.carrier || '', info?.trackingNumber || '');
                              return { orderId, validation };
                            });
                            
                            const validOrders = validationResults.filter(r => r.validation.isValid).map(r => r.orderId);
                            const invalidOrders = validationResults.filter(r => !r.validation.isValid);
                            
                            if (invalidOrders.length > 0) {
                              toast.error(`${invalidOrders.length} order${invalidOrders.length !== 1 ? 's have' : ' has'} validation errors. Please fix them first.`);
                              return;
                            }
                            
                            const savePromises = validOrders.map(orderId => saveShippingInfo(orderId));
                            const results = await Promise.allSettled(savePromises);
                            const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
                            const failed = results.length - successful;
                            
                            if (successful > 0) {
                              toast.success(`Successfully saved ${successful} order${successful !== 1 ? 's' : ''}`);
                            }
                            if (failed > 0) {
                              toast.error(`Failed to save ${failed} order${failed !== 1 ? 's' : ''}`);
                            }
                          }
                        }}
                        disabled={savingCount > 0}
                        className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Save All Valid
                      </button>
                    </div>
                  )}
                  
                  {/* Validation Errors */}
                  {validationErrorCount > 0 && (
                    <div className="px-3 py-1.5 rounded-xl font-medium bg-orange-100 text-orange-800 border border-orange-300 flex items-center space-x-2">
                      <span>⚠️ {validationErrorCount} order{validationErrorCount !== 1 ? 's' : ''} with validation errors</span>
                      <button
                        onClick={() => {
                          // Clear all validation errors
                          setShippingInfo(prev => {
                            const updated = { ...prev };
                            Object.keys(updated).forEach(orderId => {
                              if (updated[orderId]?.validationError || updated[orderId]?.validationErrors?.length > 0) {
                                updated[orderId] = {
                                  ...updated[orderId],
                                  validationError: null,
                                  validationErrors: [],
                                  carrierValidationErrors: [],
                                  trackingValidationErrors: []
                                };
                              }
                            });
                            return updated;
                          });
                          toast.info('Validation errors cleared');
                        }}
                        className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors"
                      >
                        Clear Validation Errors
                      </button>
                    </div>
                  )}
                  
                  {/* Persistence Errors */}
                  {errorCount > 0 && (
                    <div className="px-3 py-1.5 rounded-xl font-medium bg-red-100 text-red-800 border border-red-300 flex items-center space-x-2">
                      <span>❌ {errorCount} order{errorCount !== 1 ? 's' : ''} with save errors</span>
                      <button
                        onClick={async () => {
                          const failedOrders = Object.entries(shippingInfo)
                            .filter(([orderId, info]) => info?.persistenceFailure)
                            .map(([orderId]) => orderId);
                          
                          if (failedOrders.length > 0 && window.confirm(`Retry saving ${failedOrders.length} failed orders?`)) {
                            console.log(`🔄 Bulk retry for ${failedOrders.length} failed orders`);
                            const retryPromises = failedOrders.map(orderId => saveShippingInfoWithRetry(orderId, 2));
                            const results = await Promise.allSettled(retryPromises);
                            const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
                            const failed = results.length - successful;
                            
                            if (successful > 0) {
                              toast.success(`Successfully retried ${successful} order${successful !== 1 ? 's' : ''}`);
                            }
                            if (failed > 0) {
                              toast.error(`${failed} order${failed !== 1 ? 's' : ''} still failed after retry`);
                            }
                          }
                        }}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors mr-1"
                      >
                        Retry All
                      </button>
                      <button
                        onClick={() => {
                          // Clear all error states
                          setShippingInfo(prev => {
                            const updated = { ...prev };
                            Object.keys(updated).forEach(orderId => {
                              if (updated[orderId]?.persistenceFailure) {
                                updated[orderId] = {
                                  ...updated[orderId],
                                  persistenceFailure: false,
                                  errorMessage: null,
                                  errorType: null,
                                  errorTimestamp: null
                                };
                              }
                            });
                            return updated;
                          });
                          toast.info('Error states cleared');
                        }}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                      >
                        Clear Errors
                      </button>
                    </div>
                  )}
                  
                  {/* Summary Statistics */}
                  <div className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs">
                    📊 {Object.keys(shippingInfo).length} orders tracked
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Placed">Placed</option>
              <option value="Packed">Packed</option>
              <option value="Shipped">Shipped</option>
              <option value="OutForDelivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-3">🛍️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredOrders.map((order, i) => {
            const isExpanded = expandedOrder === order._id;
            
            // Use displayCustomerName from backend or compute fallback
            const customerName = order.displayCustomerName || 
                               order.user_id?.name || 
                               order.address_snapshot?.name ||
                               order.address?.name || 
                               [order.address?.firstName, order.address?.lastName].filter(Boolean).join(' ') || 
                               order.user_id?.email?.split('@')[0] || 
                               'Unknown Customer';
            
            // Extract address info
            const address = order.address || {};
            const orderStatus = order.order_status || order.status || 'Pending';
            const orderAmount = order.totals?.grand_total || order.amount || 0;
            const orderDate = order.created_at || order.date;
            const paymentMethod = order.payment_method || order.paymentMethod || 'Unknown';
            
            return (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Main Order Row - Clickable */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Order Icon */}
                    <div className="lg:col-span-1 flex justify-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">
                        📦
                      </div>
                    </div>

                    {/* Customer & Order Info */}
                    <div className="lg:col-span-4">
                      <h3 className="font-semibold text-gray-800 mb-0.5">{customerName}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        Order #{order._id.slice(-6)} • {order.items?.length || 0} items
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(orderStatus)}`}>
                          {getStatusIcon(orderStatus)} {orderStatus}
                        </span>
                        {order.shippingInfo?.carrier && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                            <span>📦</span>
                            <span>{order.shippingInfo.carrier}</span>
                            {order.shippingInfo.trackingNumber && (
                              <span className="bg-purple-200 px-1 rounded text-xs">#{order.shippingInfo.trackingNumber}</span>
                            )}
                          </span>
                        )}
                        {/* Enhanced shipping info visual indicators with comprehensive status tracking */}
                        {shippingInfo[order._id] && (
                          <div className="flex items-center space-x-1 flex-wrap">
                            {/* Unsaved changes indicator with enhanced visibility */}
                            {shippingInfo[order._id].hasUnsavedChanges && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 animate-pulse border border-yellow-300">
                                <span>⚠️</span>
                                <span>Unsaved Changes</span>
                              </span>
                            )}
                            
                            {/* Saving state indicator */}
                            {shippingInfo[order._id].isSaving && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border border-blue-300">
                                <span className="animate-spin">⏳</span>
                                <span>Saving...</span>
                              </span>
                            )}
                            
                            {/* Success indicator removed - purple box already shows saved info */}
                            
                            {/* Error indicators with specific error types */}
                            {shippingInfo[order._id].persistenceFailure && (
                              <span 
                                className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border border-red-300 cursor-help"
                                title={shippingInfo[order._id].errorMessage || 'Save operation failed'}
                              >
                                <span>❌</span>
                                <span>
                                  {shippingInfo[order._id].errorType === 'network_error' ? 'Network Error' : 
                                   shippingInfo[order._id].errorType === 'http_error' ? 'Server Error' : 
                                   'Save Failed'}
                                </span>
                              </span>
                            )}
                            
                            {/* Validation error indicator */}
                            {shippingInfo[order._id].validationError && (
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border border-orange-300">
                                <span>⚠️</span>
                                <span>Validation Error</span>
                              </span>
                            )}
                            
                            {/* Synced indicators removed - unnecessary UI clutter */}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Payment:</span> {paymentMethod}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Date:</span> {new Date(orderDate).toLocaleDateString()}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {currency}{orderAmount}
                      </p>
                    </div>

                    {/* Status Actions */}
                    <div className="lg:col-span-3">
                      <select
                        value={orderStatus}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium mb-2"
                        onChange={(e) => {
                          e.stopPropagation(); // Prevent row expansion
                          statusHandler(e, order._id);
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent row expansion
                      >
                        <option value="Pending">⏳ Pending</option>
                        <option value="Placed">📋 Placed</option>
                        <option value="Packed">📦 Packed</option>
                        <option value="Shipped">🚚 Shipped</option>
                        <option value="OutForDelivery">🏃‍♂️ Out for Delivery</option>
                        <option value="Delivered">✅ Delivered</option>
                        <option value="Cancelled">❌ Cancelled</option>
                      </select>
                      
                      {/* Enhanced Shipping Info Input with Status-Based Access Control and Real-time Validation */}
                      <div className="space-y-2 admin-shipping-fade-in admin-shipping-transition" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          // Status-based access control (Requirements 5.1, 5.2, 5.3, 5.4)
                          const currentStatus = orderStatus;
                          const shippingAllowedStatuses = ['Shipped', 'OutForDelivery', 'Out for Delivery', 'Delivered'];
                          const isShippingAllowed = shippingAllowedStatuses.includes(currentStatus);
                          
                          // Check if order has existing shipping data that should be preserved
                          const hasExistingShippingData = (
                            (order.shippingInfo?.carrier && order.shippingInfo.carrier.trim()) ||
                            (order.shippingInfo?.trackingNumber && order.shippingInfo.trackingNumber.trim()) ||
                            (shippingInfo[order._id]?.carrier && shippingInfo[order._id].carrier.trim()) ||
                            (shippingInfo[order._id]?.trackingNumber && shippingInfo[order._id].trackingNumber.trim())
                          );
                          
                          if (!isShippingAllowed) {
                            return null; // Don't show shipping section when not allowed
                          }
                          
                          // If shipping is allowed, show the full shipping form
                          return (
                            <>
                              <div className="text-xs font-medium text-gray-700 mb-1 flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm sm:text-xs">Shipping Information</span>
                                </div>
                                <div 
                              className="cursor-help text-gray-400 hover:text-gray-600 transition-colors relative group"
                              title="Click for detailed help and tips"
                              tabIndex="0"
                              role="button"
                              aria-label="Shipping information help"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  // Toggle help visibility on keyboard interaction
                                }
                              }}
                            >
                              ℹ️
                              
                              {/* Enhanced Help Tooltip with Responsive Design */}
                              <div className="absolute right-0 sm:right-auto sm:left-0 top-6 w-80 max-w-[90vw] bg-gray-900 text-white text-xs rounded-lg p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50 shadow-xl">
                                <div className="space-y-3">
                                  <div>
                                    <div className="font-semibold text-yellow-300 mb-1">⌨️ Keyboard Shortcuts</div>
                                    <div>• <kbd className="bg-gray-700 px-1 rounded text-xs">Ctrl+S</kbd> - Save all valid shipping info</div>
                                    <div>• <kbd className="bg-gray-700 px-1 rounded text-xs">Tab</kbd> - Navigate between fields</div>
                                    <div>• <kbd className="bg-gray-700 px-1 rounded text-xs">Enter</kbd> - Save current order</div>
                                  </div>
                                  
                                  <div>
                                    <div className="font-semibold text-blue-300 mb-1">🤖 Auto-Features</div>
                                    <div>• Auto-save after 2 minutes of inactivity</div>
                                    <div>• Auto-retry on network failures</div>
                                    <div>• Real-time validation feedback</div>
                                    <div>• Smart field suggestions</div>
                                  </div>
                                  
                                  <div>
                                    <div className="font-semibold text-green-300 mb-1">✅ Best Practices</div>
                                    <div>• Use standard carrier names (FedEx, UPS, DHL)</div>
                                    <div>• Verify tracking numbers before saving</div>
                                    <div>• At least one field is required</div>
                                    <div>• Check format matches carrier type</div>
                                  </div>
                                  
                                  <div>
                                    <div className="font-semibold text-orange-300 mb-1">🔧 Troubleshooting</div>
                                    <div>• Check internet connection if saves fail</div>
                                    <div>• Refresh page if session expires</div>
                                    <div>• Use retry button for temporary failures</div>
                                    <div>• Clear browser cache if issues persist</div>
                                  </div>
                                  
                                  <div className="border-t border-gray-700 pt-2 text-gray-300">
                                    <div className="text-xs">Supported characters: Letters, numbers, spaces, hyphens, &, periods, parentheses</div>
                                    <div className="text-xs">Max length: 50 characters per field</div>
                                  </div>
                                </div>
                                
                                {/* Responsive Tooltip Arrow */}
                                <div className="absolute top-0 right-4 sm:right-auto sm:left-4 transform -translate-y-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                              </div>
                            </div>
                          <div className="flex flex-wrap items-center gap-2 sm:space-x-2">
                            {shippingInfo[order._id]?.validationErrors?.length > 0 && (
                              <span className="text-red-600 text-xs flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                                <span className="animate-pulse">⚠️</span>
                                <span className="hidden sm:inline">{shippingInfo[order._id].validationErrors.length} error{shippingInfo[order._id].validationErrors.length !== 1 ? 's' : ''}</span>
                                <span className="sm:hidden">Error</span>
                              </span>
                            )}
                            {shippingInfo[order._id]?.hasUnsavedChanges && (
                              <span className="text-yellow-600 text-xs animate-pulse flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200">
                                <span>💾</span>
                                <span className="hidden sm:inline">Unsaved</span>
                              </span>
                            )}
                            {shippingInfo[order._id]?.isSaving && (
                              <span className="text-blue-600 text-xs flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                                <span className="animate-spin">⏳</span>
                                <span className="hidden sm:inline">Saving...</span>
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Carrier Name Input with Enhanced Validation and Accessibility */}
                        <div className="relative">
                          <label htmlFor={`carrier-${order._id}`} className="sr-only">
                            Carrier Name for Order {order._id.slice(-6)}
                          </label>
                          <input
                            id={`carrier-${order._id}`}
                            type="text"
                            placeholder="Carrier Name (e.g., FedEx, UPS, DHL)"
                            value={shippingInfo[order._id]?.carrier || ''}
                            maxLength={50}
                            aria-describedby={`carrier-help-${order._id} carrier-error-${order._id}`}
                            aria-invalid={shippingInfo[order._id]?.carrierValidationErrors?.length > 0}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              
                              // Real-time validation
                              const carrierErrors = [];
                              if (newValue && newValue.length > 50) {
                                carrierErrors.push('Carrier name too long');
                              }
                              if (newValue && newValue.length > 0 && newValue.length < 2) {
                                carrierErrors.push('Carrier name too short');
                              }
                              if (newValue && !/^[a-zA-Z0-9\s\-&.()]*$/.test(newValue)) {
                                carrierErrors.push('Invalid characters in carrier name');
                              }
                              
                              setShippingInfo(prev => ({
                                ...prev,
                                [order._id]: {
                                  ...prev[order._id],
                                  carrier: newValue,
                                  lastModified: new Date(),
                                  hasUnsavedChanges: true,
                                  isFromBackend: false,
                                  carrierValidationErrors: carrierErrors,
                                  // Clear previous validation errors when user starts typing
                                  validationError: carrierErrors.length > 0 ? carrierErrors[0] : null,
                                  validationErrors: carrierErrors.length > 0 ? carrierErrors.map(err => ({ field: 'carrier', message: err })) : []
                                }
                              }));
                            }}
                            onBlur={() => {
                              // Validate on blur for better UX
                              const currentValue = shippingInfo[order._id]?.carrier || '';
                              const trackingValue = shippingInfo[order._id]?.trackingNumber || '';
                              const validation = validateShippingInfo(currentValue, trackingValue);
                              
                              if (!validation.isValid) {
                                setShippingInfo(prev => ({
                                  ...prev,
                                  [order._id]: {
                                    ...prev[order._id],
                                    validationError: validation.errors[0]?.message,
                                    validationErrors: validation.errors
                                  }
                                }));
                              }
                            }}
                            onKeyDown={(e) => {
                              // Enhanced keyboard navigation
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                // Move to tracking number field
                                const trackingInput = document.getElementById(`tracking-${order._id}`);
                                if (trackingInput) {
                                  trackingInput.focus();
                                }
                              }
                              if (e.key === 'Escape') {
                                e.target.blur();
                              }
                            }}
                            className={`w-full px-3 py-2 sm:px-2 sm:py-1 border rounded-lg sm:rounded text-sm sm:text-xs admin-shipping-transition admin-shipping-focus admin-shipping-md-full transition-all duration-200 focus:outline-none focus:ring-2 ${
                              shippingInfo[order._id]?.carrierValidationErrors?.length > 0 ? 
                              'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20 admin-shipping-input-invalid admin-shipping-error' :
                              shippingInfo[order._id]?.hasUnsavedChanges ? 
                              'border-yellow-400 bg-yellow-50 focus:border-yellow-500 focus:ring-yellow-500/20' : 
                              'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 admin-shipping-input-valid'
                            }`}
                          />
                          {/* Character count indicator with responsive design */}
                          <div className="absolute right-2 top-2 sm:right-1 sm:top-1 text-xs text-gray-400 bg-white px-1 rounded">
                            <span className="hidden sm:inline">{(shippingInfo[order._id]?.carrier || '').length}/50</span>
                            <span className="sm:hidden">{(shippingInfo[order._id]?.carrier || '').length}</span>
                          </div>
                          
                          {/* Field-specific error message with enhanced styling */}
                          {shippingInfo[order._id]?.carrierValidationErrors?.length > 0 && (
                            <div 
                              id={`carrier-error-${order._id}`}
                              className="text-red-600 text-xs mt-1 flex items-start space-x-1 bg-red-50 p-2 rounded-lg border border-red-200"
                              role="alert"
                              aria-live="polite"
                            >
                              <span className="text-red-500 mt-0.5 flex-shrink-0">⚠️</span>
                              <span className="flex-1">{shippingInfo[order._id].carrierValidationErrors[0]}</span>
                            </div>
                          )}
                          
                          {/* Hidden help text for screen readers */}
                          <div id={`carrier-help-${order._id}`} className="sr-only">
                            Enter the shipping carrier name. Supported carriers include FedEx, UPS, DHL, USPS. Maximum 50 characters.
                          </div>
                        </div>
                        
                        {/* Tracking Number Input with Enhanced Validation and Accessibility */}
                        <div className="relative">
                          <label htmlFor={`tracking-${order._id}`} className="sr-only">
                            Tracking Number for Order {order._id.slice(-6)}
                          </label>
                          <input
                            id={`tracking-${order._id}`}
                            type="text"
                            placeholder="Tracking Number"
                            value={shippingInfo[order._id]?.trackingNumber || ''}
                            maxLength={50}
                            aria-describedby={`tracking-help-${order._id} tracking-error-${order._id}`}
                            aria-invalid={shippingInfo[order._id]?.trackingValidationErrors?.length > 0}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              
                              // Real-time validation
                              const trackingErrors = [];
                              if (newValue && newValue.length > 50) {
                                trackingErrors.push('Tracking number too long');
                              }
                              if (newValue && newValue.length > 0 && newValue.length < 3) {
                                trackingErrors.push('Tracking number too short');
                              }
                              if (newValue && !/^[a-zA-Z0-9\s\-]*$/.test(newValue)) {
                                trackingErrors.push('Invalid characters in tracking number');
                              }
                              
                              setShippingInfo(prev => ({
                                ...prev,
                                [order._id]: {
                                  ...prev[order._id],
                                  trackingNumber: newValue,
                                  lastModified: new Date(),
                                  hasUnsavedChanges: true,
                                  isFromBackend: false,
                                  trackingValidationErrors: trackingErrors,
                                  // Clear previous validation errors when user starts typing
                                  validationError: trackingErrors.length > 0 ? trackingErrors[0] : null,
                                  validationErrors: trackingErrors.length > 0 ? trackingErrors.map(err => ({ field: 'trackingNumber', message: err })) : []
                                }
                              }));
                            }}
                            onBlur={() => {
                              // Validate on blur for better UX
                              const carrierValue = shippingInfo[order._id]?.carrier || '';
                              const currentValue = shippingInfo[order._id]?.trackingNumber || '';
                              const validation = validateShippingInfo(carrierValue, currentValue);
                              
                              if (!validation.isValid) {
                                setShippingInfo(prev => ({
                                  ...prev,
                                  [order._id]: {
                                    ...prev[order._id],
                                    validationError: validation.errors[0]?.message,
                                    validationErrors: validation.errors
                                  }
                                }));
                              }
                            }}
                            onKeyDown={(e) => {
                              // Enhanced keyboard navigation
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                // Trigger save action
                                const saveButton = document.querySelector(`[data-save-button="${order._id}"]`);
                                if (saveButton && !saveButton.disabled) {
                                  saveButton.click();
                                }
                              }
                              if (e.key === 'Escape') {
                                e.target.blur();
                              }
                              // Navigate back to carrier field with Shift+Tab
                              if (e.key === 'Tab' && e.shiftKey) {
                                // Let default behavior handle this
                              }
                            }}
                            className={`w-full px-3 py-2 sm:px-2 sm:py-1 border rounded-lg sm:rounded text-sm sm:text-xs admin-shipping-transition admin-shipping-focus admin-shipping-md-full transition-all duration-200 focus:outline-none focus:ring-2 ${
                              shippingInfo[order._id]?.trackingValidationErrors?.length > 0 ? 
                              'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20 admin-shipping-input-invalid admin-shipping-error' :
                              shippingInfo[order._id]?.hasUnsavedChanges ? 
                              'border-yellow-400 bg-yellow-50 focus:border-yellow-500 focus:ring-yellow-500/20' : 
                              'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 admin-shipping-input-valid'
                            }`}
                          />
                          {/* Character count indicator with responsive design */}
                          <div className="absolute right-2 top-2 sm:right-1 sm:top-1 text-xs text-gray-400 bg-white px-1 rounded">
                            <span className="hidden sm:inline">{(shippingInfo[order._id]?.trackingNumber || '').length}/50</span>
                            <span className="sm:hidden">{(shippingInfo[order._id]?.trackingNumber || '').length}</span>
                          </div>
                          
                          {/* Field-specific error message with enhanced styling */}
                          {shippingInfo[order._id]?.trackingValidationErrors?.length > 0 && (
                            <div 
                              id={`tracking-error-${order._id}`}
                              className="text-red-600 text-xs mt-1 flex items-start space-x-1 bg-red-50 p-2 rounded-lg border border-red-200"
                              role="alert"
                              aria-live="polite"
                            >
                              <span className="text-red-500 mt-0.5 flex-shrink-0">⚠️</span>
                              <span className="flex-1">{shippingInfo[order._id].trackingValidationErrors[0]}</span>
                            </div>
                          )}
                          
                          {/* Hidden help text for screen readers */}
                          <div id={`tracking-help-${order._id}`} className="sr-only">
                            Enter the tracking number for this shipment. Alphanumeric characters, spaces, and hyphens are allowed. Maximum 50 characters.
                          </div>
                        </div>
                        
                        {/* Enhanced validation summary with suggestions */}
                        {(() => {
                          const validationSummary = getValidationSummary(order._id);
                          const hasGeneralErrors = shippingInfo[order._id]?.validationError && 
                                                 !shippingInfo[order._id]?.carrierValidationErrors?.length && 
                                                 !shippingInfo[order._id]?.trackingValidationErrors?.length;
                          
                          if (!hasGeneralErrors && validationSummary.errors.length === 0) return null;
                          
                          return (
                            <div className="text-red-600 text-xs mt-1 bg-red-50 p-3 rounded-lg border border-red-200">
                              <div className="flex items-start space-x-2">
                                <span className="text-red-500 mt-0.5">⚠️</span>
                                <div className="flex-1">
                                  <div className="font-medium text-red-800 mb-1">Validation Issues</div>
                                  
                                  {/* Show general validation error */}
                                  {hasGeneralErrors && (
                                    <div className="text-red-700 mb-2">{shippingInfo[order._id].validationError}</div>
                                  )}
                                  
                                  {/* Show specific field errors */}
                                  {validationSummary.errors.length > 0 && (
                                    <div className="space-y-1 mb-2">
                                      {validationSummary.errors.slice(0, 3).map((error, index) => (
                                        <div key={index} className="text-red-700">
                                          • {error.message}
                                        </div>
                                      ))}
                                      {validationSummary.errors.length > 3 && (
                                        <div className="text-red-600">
                                          ... and {validationSummary.errors.length - 3} more issue{validationSummary.errors.length - 3 !== 1 ? 's' : ''}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Helpful suggestions */}
                                  <div className="text-red-600 text-xs">
                                    💡 <strong>Quick fixes:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                                      <li>Ensure at least one field has valid data</li>
                                      <li>Use only letters, numbers, spaces, and hyphens</li>
                                      <li>Keep field lengths under 50 characters</li>
                                      <li>Double-check spelling of carrier names</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Enhanced Network/Server error display with recovery options */}
                        {shippingInfo[order._id]?.persistenceFailure && shippingInfo[order._id]?.errorMessage && (
                          <div className="text-red-600 text-xs mt-1 bg-red-50 p-3 rounded-lg border border-red-200">
                            <div className="flex items-start space-x-2">
                              <span className="text-red-500 mt-0.5">❌</span>
                              <div className="flex-1">
                                <div className="font-medium text-red-800 mb-1">Save Failed</div>
                                <div className="text-red-700 mb-2">{shippingInfo[order._id].errorMessage}</div>
                                
                                {/* Error-specific recovery suggestions */}
                                <div className="text-red-600 text-xs mb-2">
                                  {shippingInfo[order._id]?.errorType === 'network_error' && (
                                    <div>💡 <strong>Network Issue:</strong> Check your internet connection and try again.</div>
                                  )}
                                  {shippingInfo[order._id]?.errorType === 'auth_error' && (
                                    <div>💡 <strong>Session Expired:</strong> Please refresh the page and login again.</div>
                                  )}
                                  {shippingInfo[order._id]?.errorType === 'http_error' && (
                                    <div>💡 <strong>Server Issue:</strong> The server is experiencing problems. Try again in a moment.</div>
                                  )}
                                  {!shippingInfo[order._id]?.errorType && (
                                    <div>💡 <strong>Tip:</strong> Try refreshing the page or check your connection.</div>
                                  )}
                                </div>
                                
                                {/* Recovery action buttons */}
                                <div className="flex space-x-2">
                                  {shippingInfo[order._id]?.errorType === 'network_error' && (
                                    <button
                                      onClick={() => saveShippingInfoWithRetry(order._id)}
                                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                                      title="Retry with automatic retries"
                                    >
                                      🔄 Auto Retry
                                    </button>
                                  )}
                                  
                                  {shippingInfo[order._id]?.errorType === 'auth_error' && (
                                    <button
                                      onClick={() => window.location.reload()}
                                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                    >
                                      🔄 Refresh Page
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => {
                                      // Clear error state and allow user to try again
                                      setShippingInfo(prev => ({
                                        ...prev,
                                        [order._id]: {
                                          ...prev[order._id],
                                          persistenceFailure: false,
                                          errorMessage: null,
                                          errorType: null,
                                          errorCleared: true,
                                          errorClearedAt: new Date()
                                        }
                                      }));
                                      toast.info('Error cleared. You can try saving again.');
                                    }}
                                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                                  >
                                    ✖️ Dismiss
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Success confirmation display */}
                        {shippingInfo[order._id]?.saveSuccess && !shippingInfo[order._id]?.hasUnsavedChanges && (
                          <div className="text-green-600 text-xs mt-1 bg-green-50 p-2 rounded-lg border border-green-200 flex items-center space-x-2">
                            <span className="text-green-500">✅</span>
                            <span className="text-green-800">
                              Shipping information saved successfully
                              {shippingInfo[order._id]?.persistenceVerified && ' and verified'}!
                            </span>
                          </div>
                        )}
                              {/* Enhanced Save Button with Retry Mechanism, Loading States, and Accessibility */}
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-1 mt-3">
                          <button
                            data-save-button={order._id}
                            onClick={async (e) => {
                              e.stopPropagation();
                              
                              // Enhanced pre-save validation with user feedback
                              const carrierValue = shippingInfo[order._id]?.carrier || '';
                              const trackingValue = shippingInfo[order._id]?.trackingNumber || '';
                              
                              // Show immediate loading state
                              setShippingInfo(prev => ({
                                ...prev,
                                [order._id]: {
                                  ...prev[order._id],
                                  isValidating: true,
                                  validationStartTime: new Date()
                                }
                              }));
                              
                              // Add small delay to show validation feedback
                              await new Promise(resolve => setTimeout(resolve, 200));
                              
                              const validation = validateShippingInfo(carrierValue, trackingValue);
                              
                              setShippingInfo(prev => ({
                                ...prev,
                                [order._id]: {
                                  ...prev[order._id],
                                  isValidating: false,
                                  validationCompleted: true,
                                  validationDuration: Date.now() - prev[order._id]?.validationStartTime?.getTime()
                                }
                              }));
                              
                              if (!validation.isValid) {
                                const primaryError = validation.errors[0];
                                toast.error(primaryError.message, {
                                  position: "top-right",
                                  autoClose: 5000,
                                  hideProgressBar: false,
                                  closeOnClick: true,
                                  pauseOnHover: true,
                                  draggable: true
                                });
                                
                                setShippingInfo(prev => ({
                                  ...prev,
                                  [order._id]: {
                                    ...prev[order._id],
                                    validationError: primaryError.message,
                                    validationErrors: validation.errors,
                                    validationFailed: true,
                                    validationFailedAt: new Date()
                                  }
                                }));
                                return;
                              }
                              
                              // Show warnings if any
                              if (validation.warnings && validation.warnings.length > 0) {
                                validation.warnings.forEach(warning => {
                                  if (warning.severity === 'warning') {
                                    toast.warning(warning.message, {
                                      position: "top-right",
                                      autoClose: 4000
                                    });
                                  } else if (warning.severity === 'info') {
                                    toast.info(warning.message, {
                                      position: "top-right",
                                      autoClose: 3000
                                    });
                                  }
                                });
                              }
                              
                              const success = await saveShippingInfo(order._id);
                              if (success) {
                                console.log(`✅ Successfully saved shipping info for order ${order._id}`);
                                
                                // Enhanced success feedback with animation
                                setShippingInfo(prev => ({
                                  ...prev,
                                  [order._id]: {
                                    ...prev[order._id],
                                    saveSuccess: true,
                                    saveSuccessAnimation: true
                                  }
                                }));
                                
                                // Clear success animation after delay
                                setTimeout(() => {
                                  setShippingInfo(prev => ({
                                    ...prev,
                                    [order._id]: {
                                      ...prev[order._id],
                                      saveSuccessAnimation: false
                                    }
                                  }));
                                }, 2000);
                              }
                            }}
                            disabled={
                              (!shippingInfo[order._id]?.carrier && !shippingInfo[order._id]?.trackingNumber) ||
                              shippingInfo[order._id]?.isSaving ||
                              shippingInfo[order._id]?.isRetrying ||
                              shippingInfo[order._id]?.isValidating ||
                              (shippingInfo[order._id]?.validationError && 
                               !shippingInfo[order._id]?.persistenceFailure)
                            }
                            aria-label={`Save shipping information for order ${order._id.slice(-6)}`}
                            aria-describedby={`save-status-${order._id}`}
                            className={`flex-1 px-3 py-2 sm:px-2 sm:py-1 rounded-lg sm:rounded text-sm sm:text-xs font-medium admin-shipping-transition admin-shipping-hover admin-shipping-md-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                              shippingInfo[order._id]?.isValidating
                                ? 'bg-blue-400 text-white cursor-wait animate-pulse focus:ring-blue-300'
                                : shippingInfo[order._id]?.isSaving
                                ? 'bg-yellow-500 text-white cursor-wait animate-pulse focus:ring-yellow-300 admin-shipping-btn-loading'
                                : shippingInfo[order._id]?.isRetrying
                                ? 'bg-orange-500 text-white cursor-wait animate-pulse focus:ring-orange-300'
                                : shippingInfo[order._id]?.saveSuccessAnimation
                                ? 'bg-green-500 text-white animate-bounce shadow-lg focus:ring-green-300 admin-shipping-success'
                                : shippingInfo[order._id]?.validationError && !shippingInfo[order._id]?.persistenceFailure
                                ? 'bg-orange-400 text-white cursor-not-allowed focus:ring-orange-300'
                                : shippingInfo[order._id]?.hasUnsavedChanges
                                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:scale-105 focus:ring-blue-300'
                                : shippingInfo[order._id]?.persistenceVerified && !shippingInfo[order._id]?.hasUnsavedChanges
                                ? 'bg-green-500 text-white shadow-sm focus:ring-green-300'
                                : shippingInfo[order._id]?.persistenceFailure
                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg focus:ring-red-300'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 focus:ring-gray-300'
                            } disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:focus:ring-0`}
                            title={
                              shippingInfo[order._id]?.validationError && !shippingInfo[order._id]?.persistenceFailure ? 
                              `Validation Error: ${shippingInfo[order._id].validationError}` :
                              shippingInfo[order._id]?.errorMessage ?
                              `Last Error: ${shippingInfo[order._id].errorMessage}` :
                              shippingInfo[order._id]?.hasUnsavedChanges ?
                              'Click to save your changes to the server (or press Enter)' :
                              shippingInfo[order._id]?.persistenceVerified ?
                              'Shipping information is saved and verified' :
                              'Enter carrier name or tracking number to save'
                            }
                          >
                            {shippingInfo[order._id]?.isValidating
                              ? '🔍 Validating...'
                              : shippingInfo[order._id]?.isSaving
                              ? '⏳ Saving...'
                              : shippingInfo[order._id]?.isRetrying
                              ? `🔄 Retry ${shippingInfo[order._id].retryCountdown || ''}`
                              : shippingInfo[order._id]?.saveSuccessAnimation
                              ? '🎉 Success!'
                              : shippingInfo[order._id]?.validationError && !shippingInfo[order._id]?.persistenceFailure
                              ? '⚠️ Invalid'
                              : shippingInfo[order._id]?.hasUnsavedChanges
                              ? '💾 Save Changes'
                              : shippingInfo[order._id]?.persistenceVerified && !shippingInfo[order._id]?.hasUnsavedChanges
                              ? '✅ Saved & Verified'
                              : shippingInfo[order._id]?.persistenceFailure
                              ? '🔄 Retry Save'
                              : '💾 Save Info'
                            }
                          </button>
                          
                          {/* Advanced Retry Button with Progress Indicator and Responsive Design */}
                          {shippingInfo[order._id]?.persistenceFailure && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-1">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const success = await saveShippingInfoWithRetry(order._id, 3);
                                  if (success) {
                                    toast.success('🎉 Shipping info saved successfully after retry!', {
                                      position: "top-right",
                                      autoClose: 4000,
                                      hideProgressBar: false,
                                      closeOnClick: true,
                                      pauseOnHover: true
                                    });
                                  } else {
                                    toast.error('❌ All retry attempts failed. Please check your connection and try again.', {
                                      position: "top-right",
                                      autoClose: 6000
                                    });
                                  }
                                }}
                                disabled={shippingInfo[order._id]?.isSaving || shippingInfo[order._id]?.isRetrying}
                                aria-label={`Retry saving shipping information for order ${order._id.slice(-6)}`}
                                className="px-3 py-2 sm:px-2 sm:py-1 bg-orange-500 text-white rounded-lg sm:rounded text-sm sm:text-xs hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
                                title="Retry with automatic retries and exponential backoff"
                              >
                                <span>🔄</span>
                                <span className="hidden sm:inline">Auto Retry</span>
                                <span className="sm:hidden">Retry</span>
                              </button>
                              
                              {/* Retry Progress Indicator with Enhanced Mobile Design */}
                              {shippingInfo[order._id]?.isRetrying && (
                                <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                  <span className="font-medium">
                                    Attempt {shippingInfo[order._id]?.retryAttempt}/{shippingInfo[order._id]?.maxRetries}
                                  </span>
                                  {shippingInfo[order._id]?.retryCountdown && (
                                    <span className="text-orange-700">
                                      ({shippingInfo[order._id].retryCountdown}s)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Clear/Reset Button with Enhanced Accessibility */}
                          {(shippingInfo[order._id]?.hasUnsavedChanges || shippingInfo[order._id]?.persistenceFailure) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Clear all shipping information for this order?')) {
                                  setShippingInfo(prev => ({
                                    ...prev,
                                    [order._id]: {
                                      carrier: '',
                                      trackingNumber: '',
                                      hasUnsavedChanges: false,
                                      isFromBackend: false,
                                      lastUpdated: null,
                                      lastModified: null,
                                      persistenceVerified: false,
                                      persistenceFailure: false,
                                      validationError: null,
                                      validationErrors: [],
                                      carrierValidationErrors: [],
                                      trackingValidationErrors: [],
                                      isSaving: false,
                                      isRetrying: false,
                                      errorMessage: null,
                                      errorType: null
                                    }
                                  }));
                                  toast.info('Shipping information cleared');
                                }
                              }}
                              aria-label={`Clear shipping information for order ${order._id.slice(-6)}`}
                              className="px-3 py-2 sm:px-2 sm:py-1 bg-gray-400 text-white rounded-lg sm:rounded text-sm sm:text-xs hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center justify-center space-x-1"
                              title="Clear all shipping information"
                            >
                              <span>🗑️</span>
                              <span className="hidden sm:inline">Clear</span>
                            </button>
                          )}
                          
                              {/* Status indicator for screen readers */}
                              <div id={`save-status-${order._id}`} className="sr-only" aria-live="polite">
                                {shippingInfo[order._id]?.isSaving && "Saving shipping information..."}
                                {shippingInfo[order._id]?.isRetrying && `Retrying save operation, attempt ${shippingInfo[order._id]?.retryAttempt}`}
                                {shippingInfo[order._id]?.persistenceVerified && "Shipping information saved successfully"}
                                {shippingInfo[order._id]?.persistenceFailure && "Save failed, retry available"}
                              </div>
                            </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className="lg:col-span-1 flex justify-center">
                      <div className={`transform transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}>
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Items Grid */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4">Order Items</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {order.items?.map((item, idx) => (
                            <div 
                              key={idx} 
                              className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => {
                                // Navigate to product page
                                window.open(`/product/${item.product_id || item._id}`, '_blank');
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <img 
                                  src={item.imageUrl || item.image?.[0] || '/placeholder-image.jpg'} 
                                  alt={item.title || item.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm text-gray-800 truncate">
                                    {item.title || item.name}
                                  </h5>
                                  <p className="text-xs text-gray-600">
                                    {item.variant || item.size} • Qty: {item.qty || item.quantity}
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {currency}{item.price}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Address Details */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Delivery Address</h4>
                        <div className="bg-white rounded-lg p-3">
                          <p className="font-medium text-gray-900 mb-1">{customerName}</p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {(() => {
                              const addr = order.address_snapshot || order.address || {};
                              const line1 = addr.line1 || addr.addressLine1 || addr.street || '—';
                              const line2 = addr.line2 || addr.addressLine2;
                              const city = addr.city || '—';
                              const state = addr.state || '';
                              const zip = addr.pincode || addr.zipcode || '';
                              const country = addr.country || 'India';
                              const phone = addr.phone || '—';
                              
                              return (
                                <>
                                  {line1}<br/>
                                  {line2 && `${line2}`}<br/>
                                  {city}, {state} {zip}<br/>
                                  {country}<br/>
                                  Phone: {phone}
                                </>
                              );
                            })()} 
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Order;