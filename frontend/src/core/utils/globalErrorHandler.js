import { toast } from 'react-toastify';

/**
 * Global error handler for API requests
 * Provides consistent error handling and user feedback across the application
 * 
 * This version is designed to work with the centralized apiClient
 * and does not use axios interceptors
 */

const ERROR_THROTTLE_TIME = 5000; // 5 seconds between similar error toasts
const BACKEND_WAKEUP_THROTTLE_TIME = 45000; // Prevent repeated cold-start toasts

// Store error timestamps by error key
const errorTimestamps = new Map();
// Store active toasts to prevent duplicates
const activeToasts = new Map();

/**
 * Throttle error messages to prevent flooding the UI
 * @param {string} key - A unique key for the error type/message
 * @param {number} [throttleTime=ERROR_THROTTLE_TIME] - Throttle time in ms
 * @returns {boolean} - Whether the error should be shown
 */
const throttleError = (key, throttleTime = ERROR_THROTTLE_TIME) => {
  const now = Date.now();
  const lastTime = errorTimestamps.get(key) || 0;
  
  if (now - lastTime > throttleTime) {
    errorTimestamps.set(key, now);
    // Clean up old entries to prevent memory leaks
    errorTimestamps.forEach((time, errorKey) => {
      if (now - time > throttleTime * 10) { // Keep for 10x throttle time
        errorTimestamps.delete(errorKey);
      }
    });
    return true;
  }
  return false;
};

// Check if error is a network error
export const isNetworkError = (error) => {
  return error.code === 'ERR_NETWORK' || !error.response;
};

// Detect likely backend cold starts (Render sleep/wake behavior)
const isLikelyBackendWakeup = (error) => {
  if (!error || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    return false;
  }

  const status = error.response?.status;
  const code = error.code;
  const message = String(error.message || '').toLowerCase();
  const url = String(error.config?.url || '').toLowerCase();
  const baseURL = String(error.config?.baseURL || '').toLowerCase();

  const isApiRequest = url.includes('/api/') || baseURL.includes('render.com') || baseURL.includes('onrender.com');
  const isWakeupStatus = [502, 503, 504].includes(status);
  const isWakeupError =
    code === 'ECONNABORTED' ||
    code === 'ERR_NETWORK' ||
    message.includes('timeout') ||
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('load failed');

  return isApiRequest && (isWakeupStatus || isWakeupError);
};

// Check if error is a timeout error
export const isTimeoutError = (error) => {
  return error.code === 'ECONNABORTED';
};

// Check if error is a server error (5xx)
export const isServerError = (error) => {
  return error.response?.status >= 500 && error.response?.status < 600;
};

// Check if error is a client error (4xx)
export const isClientError = (error) => {
  return error.response?.status >= 400 && error.response?.status < 500;
};

// Main error handler for API requests
export const handleApiError = (error) => {
  const { response, code, message, config, isCancel } = error;
  
  // Handle request cancellation
  if (isCancel || code === 'ERR_CANCELED') {
    console.log('Request was cancelled:', config?.url);
    return; // Don't show toast for cancelled requests
  }

  // Collapse repeated cold-start failures into one friendly message.
  if (isLikelyBackendWakeup(error)) {
    const toastId = 'backend_wakeup';

    if (throttleError(toastId, BACKEND_WAKEUP_THROTTLE_TIME) && !activeToasts.has(toastId)) {
      activeToasts.set(toastId, true);
      toast.info('Please wait, backend is starting...', {
        position: 'bottom-right',
        autoClose: 6000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        onClose: () => activeToasts.delete(toastId)
      });
    }

    console.warn('Backend wake-up in progress:', config?.url);
    return Promise.reject(error);
  }
  
  // Handle different types of errors
  if (isTimeoutError(error)) {
    // Timeout errors
    if (throttleError(`timeout_${config?.url}`)) {
      const toastId = `timeout_${config?.url}`;
      if (!activeToasts.has(toastId)) {
        activeToasts.set(toastId, true);
        
        const toastProps = {
          position: 'bottom-right',
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClose: () => activeToasts.delete(toastId)
        };
        
        toast.warning('⏱️ Request timeout - backend may be slow', toastProps);
      }
    }
    console.warn('🕐 Request timeout:', config?.url);
    
  } else if (isNetworkError(error)) {
    // Network errors (no response from server)
    if (throttleError(`network_${config?.url}`)) {
      const toastId = `network_${config?.url}`;
      if (!activeToasts.has(toastId)) {
        activeToasts.set(toastId, true);
        
        const toastProps = {
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClose: () => activeToasts.delete(toastId)
        };
        
        toast.error('🌐 Network error - check your connection', toastProps);
      }
    }
    console.error('🔌 Network error:', config?.url);
    
  } else if (response) {
    // HTTP error responses
    const { status, data, config } = response;
    
    switch (status) {
      case 400:
        // Bad request - show specific message if available
        if (data?.message && throttleError(`badrequest_${data.message}`)) {
          const toastId = `badrequest_${data.message}`;
          if (!activeToasts.has(toastId)) {
            activeToasts.set(toastId, true);
            
            toast.error(`❌ ${data.message}`, {
              position: 'bottom-right',
              autoClose: 4000,
              onClose: () => activeToasts.delete(toastId)
            });
          }
        }
        break;
        
      case 401:
        // Unauthorized - handled by individual services (redirect to login)
        if (throttleError('unauthorized')) {
          const toastId = 'unauthorized';
          if (!activeToasts.has(toastId)) {
            activeToasts.set(toastId, true);
            
            toast.warning('🔒 Session expired - please log in again', {
              position: 'bottom-right',
              autoClose: 4000,
              onClose: () => activeToasts.delete(toastId)
            });
          }
        }
        console.warn('🔐 Unauthorized access - redirecting to login');
        break;
        
      case 403:
        // Forbidden
        if (throttleError('forbidden')) {
          const toastId = 'forbidden';
          if (!activeToasts.has(toastId)) {
            activeToasts.set(toastId, true);
            
            toast.error('🚫 Access denied', {
              position: 'bottom-right',
              autoClose: 4000,
              onClose: () => activeToasts.delete(toastId)
            });
          }
        }
        break;
        
      case 404:
        // Not found - usually handled by individual components
        console.warn('📭 Resource not found:', config?.url);
        break;
        
      case 500:
        // Internal server error
        if (throttleError('server')) {
          toast.error('⚠️ Server error - please try again later', {
            position: 'bottom-right',
            autoClose: 5000,
          });
        }
        console.error('🔥 Server error:', config?.url);
        break;
        
      case 503:
        // Service unavailable
        if (throttleError('unavailable')) {
          toast.warning('🔧 Service temporarily unavailable', {
            position: 'bottom-right',
            autoClose: 6000,
          });
        }
        break;
        
      default:
        // Other HTTP errors
        if (status >= 400 && throttleError('http')) {
          toast.error(`❌ Request failed (${status})`, {
            position: 'bottom-right',
            autoClose: 4000,
          });
        }
    }
  } else {
    // Unknown error
    if (throttleError('unknown')) {
      toast.error('❓ An unexpected error occurred', {
        position: 'bottom-right',
        autoClose: 4000,
      });
      console.error('❓ Unknown error:', message);
    }
  }

  // Always return the rejected promise to allow individual error handling
  return Promise.reject(error);
};

// Helper function to check if error is retryable
export const isRetryableError = (error) => {
  // Don't retry if it's not an error
  if (!error) return false;
  
  // Don't retry if the request was cancelled
  if (error.isCancel || error.code === 'ERR_CANCELED') {
    return false;
  }
  
  // Don't retry if it's a client error (4xx) except 408 (Request Timeout) and 429 (Too Many Requests)
  if (isClientError(error) && ![408, 429].includes(error.response?.status)) {
    return false;
  }
  
  // Retry on network errors, timeouts, and server errors
  return isNetworkError(error) || isTimeoutError(error) || isServerError(error);
};

// Helper function to get user-friendly error message
export const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  // Handle cancelled requests
  if (error.isCancel || error.code === 'ERR_CANCELED') {
    return 'Request was cancelled';
  }
  
  // Handle network errors
  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  // Handle timeout errors
  if (isTimeoutError(error)) {
    return `Request timed out after ${error.config?.timeout || 'unknown'}ms. The server is taking too long to respond.`;
  }
  
  // Handle rate limiting
  if (error.response?.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  // Handle server validation errors
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    return Object.values(errors).flat().join(' ');
  }
  
  // Handle custom error messages from API
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Handle HTTP error status codes
  if (error.response?.status) {
    switch (error.response.status) {
      case 400: return 'Bad request. Please check your input and try again.';
      case 401: return 'Session expired. Please log in again.';
      case 403: return 'You do not have permission to perform this action.';
      case 404: return 'The requested resource was not found.';
      case 500: return 'An internal server error occurred. Please try again later.';
      case 502: 
      case 503: 
      case 504: return 'The server is temporarily unavailable. Please try again later.';
      default: return `An error occurred (${error.response.status}). Please try again.`;
    }
  }
  
  // Fallback to error message or default
  return error.message || 'An unexpected error occurred. Please try again later.';
};

// Helper to clear all active toasts (useful for testing)
export const clearAllToasts = () => {
  activeToasts.clear();
  toast.dismiss();
};

export default {
  isRetryableError,
  getErrorMessage,
  handleApiError,
  isNetworkError,
  isTimeoutError,
  isServerError,
  isClientError,
  clearAllToasts,
  // Export constants for testing
  _constants: {
    ERROR_THROTTLE_TIME
  }
};