/**
 * Comprehensive error handling utility for admin interface
 * Provides user-friendly error messages, retry logic, and error reporting
 */

import { toast } from 'react-toastify';

/**
 * Error categories and their user-friendly messages
 */
const ERROR_MESSAGES = {
  network_error: {
    title: 'Connection Problem',
    message: 'Unable to connect to the server. Please check your internet connection.',
    action: 'Check your network connection and try again.',
    retryable: true,
    icon: '🌐'
  },
  auth_error: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
    action: 'You will be redirected to the login page.',
    retryable: false,
    icon: '🔐'
  },
  validation_error: {
    title: 'Invalid Input',
    message: 'The information provided is not valid.',
    action: 'Please check your input and try again.',
    retryable: false,
    icon: '⚠️'
  },
  server_error: {
    title: 'Server Problem',
    message: 'The server encountered an error.',
    action: 'Please try again in a moment.',
    retryable: true,
    icon: '🔧'
  },
  timeout_error: {
    title: 'Request Timeout',
    message: 'The request took too long to complete.',
    action: 'The server may be busy. Please try again.',
    retryable: true,
    icon: '⏰'
  },
  rate_limit_error: {
    title: 'Too Many Requests',
    message: 'You are making requests too quickly.',
    action: 'Please wait a moment before trying again.',
    retryable: true,
    icon: '🚦'
  },
  not_found_error: {
    title: 'Not Found',
    message: 'The requested item could not be found.',
    action: 'It may have been deleted. Please refresh the page.',
    retryable: false,
    icon: '🔍'
  },
  forbidden_error: {
    title: 'Access Denied',
    message: 'You do not have permission to perform this action.',
    action: 'Please contact your administrator if you believe this is an error.',
    retryable: false,
    icon: '🚫'
  },
  unknown_error: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred.',
    action: 'Please try again or contact support if the problem persists.',
    retryable: true,
    icon: '❓'
  }
};

/**
 * Categorize error based on error object
 * @param {Error|Object} error - Error object or axios error response
 * @returns {string} Error category
 */
export const categorizeError = (error) => {
  // Network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return 'network_error';
  }
  
  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'timeout_error';
  }
  
  // HTTP status code based categorization
  if (error.response?.status) {
    const status = error.response.status;
    
    if (status === 401) return 'auth_error';
    if (status === 400) return 'validation_error';
    if (status === 403) return 'forbidden_error';
    if (status === 404) return 'not_found_error';
    if (status === 429) return 'rate_limit_error';
    if (status >= 500) return 'server_error';
  }
  
  return 'unknown_error';
};

/**
 * Get user-friendly error information
 * @param {Error|Object} error - Error object
 * @param {string} context - Context where error occurred (optional)
 * @returns {Object} User-friendly error information
 */
export const getErrorInfo = (error, context = '') => {
  const category = categorizeError(error);
  const errorInfo = ERROR_MESSAGES[category];
  
  // Extract specific error message if available
  let specificMessage = null;
  if (error.response?.data?.message) {
    specificMessage = error.response.data.message;
  } else if (error.message && !error.message.includes('Network Error')) {
    specificMessage = error.message;
  }
  
  return {
    category,
    title: errorInfo.title,
    message: specificMessage || errorInfo.message,
    action: errorInfo.action,
    retryable: errorInfo.retryable,
    icon: errorInfo.icon,
    context,
    originalError: error
  };
};

/**
 * Handle error with appropriate user feedback
 * @param {Error|Object} error - Error object
 * @param {string} context - Context where error occurred
 * @param {Function} retryFunction - Function to call for retry (optional)
 * @param {Object} options - Additional options
 */
export const handleError = (error, context = '', retryFunction = null, options = {}) => {
  const errorInfo = getErrorInfo(error, context);
  const {
    showToast = true,
    logToConsole = true,
    duration = 6000,
    autoRetry = false,
    maxRetries = 3
  } = options;
  
  // Log to console for debugging
  if (logToConsole) {
    console.error(`Error in ${context}:`, {
      category: errorInfo.category,
      message: errorInfo.message,
      originalError: error,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }
  
  // Show user-friendly toast notification
  if (showToast) {
    const toastMessage = `${errorInfo.icon} ${errorInfo.title}: ${errorInfo.message}`;
    const toastOptions = {
      duration,
      action: errorInfo.retryable && retryFunction ? {
        label: 'Retry',
        onClick: retryFunction
      } : undefined
    };
    
    if (errorInfo.category === 'auth_error') {
      toast.error(toastMessage, { ...toastOptions, duration: 3000 });
      // Redirect to login after showing error
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } else {
      toast.error(toastMessage, toastOptions);
    }
  }
  
  // Handle auto-retry for retryable errors
  if (autoRetry && errorInfo.retryable && retryFunction && maxRetries > 0) {
    const retryDelay = Math.min(1000 * Math.pow(2, 3 - maxRetries), 10000); // Exponential backoff
    
    setTimeout(() => {
      console.log(`Auto-retrying ${context} in ${retryDelay}ms (${maxRetries} retries left)`);
      handleErrorWithRetry(retryFunction, context, maxRetries - 1);
    }, retryDelay);
  }
  
  return errorInfo;
};

/**
 * Handle error with automatic retry logic
 * @param {Function} asyncFunction - Async function to retry
 * @param {string} context - Context for error handling
 * @param {number} maxRetries - Maximum number of retries
 * @param {Object} options - Additional options
 */
export const handleErrorWithRetry = async (asyncFunction, context = '', maxRetries = 3, options = {}) => {
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFunction();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        // Final attempt failed, handle error normally
        handleError(error, context, null, { ...options, autoRetry: false });
        throw error;
      }
      
      const errorInfo = getErrorInfo(error, context);
      
      // Don't retry non-retryable errors
      if (!errorInfo.retryable) {
        handleError(error, context, null, { ...options, autoRetry: false });
        throw error;
      }
      
      // Calculate retry delay with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
      
      console.log(`Retrying ${context} in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      // Show retry notification for longer delays
      if (retryDelay > 2000) {
        toast.info(`Retrying in ${Math.ceil(retryDelay / 1000)} seconds...`, { duration: retryDelay });
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw lastError;
};

/**
 * Validate network connectivity
 * @returns {Object} Network status information
 */
export const checkNetworkStatus = () => {
  const isOnline = navigator.onLine;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  return {
    isOnline,
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false
  };
};

/**
 * Create error report for debugging
 * @param {Error|Object} error - Error object
 * @param {string} context - Context where error occurred
 * @param {Object} additionalInfo - Additional information
 * @returns {Object} Comprehensive error report
 */
export const createErrorReport = (error, context = '', additionalInfo = {}) => {
  const errorInfo = getErrorInfo(error, context);
  const networkStatus = checkNetworkStatus();
  
  return {
    timestamp: new Date().toISOString(),
    context,
    errorInfo,
    networkStatus,
    browserInfo: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    },
    pageInfo: {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title
    },
    additionalInfo,
    originalError: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    }
  };
};

/**
 * Send error report to server (if endpoint is available)
 * @param {Object} errorReport - Error report object
 */
export const sendErrorReport = async (errorReport) => {
  try {
    // Only send in production and if endpoint is configured
    if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_ERROR_REPORTING_ENDPOINT) {
      await fetch(process.env.REACT_APP_ERROR_REPORTING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      });
    }
  } catch (reportingError) {
    console.warn('Failed to send error report:', reportingError.message);
  }
};

/**
 * Enhanced error boundary helper
 * @param {Error} error - Error caught by error boundary
 * @param {Object} errorInfo - Error info from React error boundary
 */
export const handleErrorBoundary = (error, errorInfo) => {
  const errorReport = createErrorReport(error, 'React Error Boundary', {
    componentStack: errorInfo.componentStack,
    errorBoundary: true
  });
  
  console.error('React Error Boundary caught an error:', errorReport);
  
  // Send error report
  sendErrorReport(errorReport);
  
  // Show user-friendly message
  toast.error('🚨 Application Error: The page encountered an unexpected error. Please refresh the page.', {
    duration: 10000,
    action: {
      label: 'Refresh Page',
      onClick: () => window.location.reload()
    }
  });
};

/**
 * Validation error helper
 * @param {Object} validationErrors - Validation errors object
 * @param {string} context - Context where validation failed
 */
export const handleValidationErrors = (validationErrors, context = 'form') => {
  if (Array.isArray(validationErrors)) {
    // Handle array of validation errors
    validationErrors.forEach((error, index) => {
      const message = `${error.field}: ${error.message}`;
      toast.error(`⚠️ ${message}`, { duration: 5000 });
    });
  } else if (typeof validationErrors === 'object') {
    // Handle object with field-specific errors
    Object.entries(validationErrors).forEach(([field, message]) => {
      toast.error(`⚠️ ${field}: ${message}`, { duration: 5000 });
    });
  } else {
    // Handle single validation error message
    toast.error(`⚠️ Validation Error: ${validationErrors}`, { duration: 5000 });
  }
  
  console.warn(`Validation errors in ${context}:`, validationErrors);
};

export default {
  categorizeError,
  getErrorInfo,
  handleError,
  handleErrorWithRetry,
  checkNetworkStatus,
  createErrorReport,
  sendErrorReport,
  handleErrorBoundary,
  handleValidationErrors
};