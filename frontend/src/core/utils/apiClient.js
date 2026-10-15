import axios from 'axios';
import { handleApiError, isNetworkError, isTimeoutError } from './globalErrorHandler';

// Queue for managing concurrent requests
const requestQueue = [];
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 5;

// Map to store active AbortControllers
const controllers = new Map();

// Request cache for deduplication
const requestCache = new Map();

// Default timeout configurations
const TIMEOUTS = {
  fast: 3000,    // 3 seconds for fast operations
  medium: 5000,  // 5 seconds for medium operations
  slow: 30000,   // 30 seconds for slow operations (e.g., signup/login on cold-start backend)
};

// Helper utilities for timing and logging

/**
 * Format a duration (ms) into a human readable string.
 * @param {number} ms
 * @returns {string}
 */
const formatDuration = (ms) => {
  if (ms == null || Number.isNaN(ms)) return 'unknown';
  if (ms < 1000) return `${ms} ms`;
  const secs = (ms / 1000).toFixed(2);
  return `${secs} s`;
};

/**
 * Log request start with details.
 * @param {Object} config - Axios config
 */
const logRequestStart = (config) => {
  try {
    const method = (config.method || 'get').toUpperCase();
    const url = (config.baseURL || '') + (config.url || '');
    const timeout = config.timeout != null ? `${config.timeout} ms` : 'default';
    safeLog(console.info, `[API] START ${method} ${url} | timeout: ${timeout}`);
  } catch (err) {
    // Swallow logging errors
  }
};

/**
 * Log request end with details.
 * @param {Object} config - Axios config
 * @param {number} durationMs - duration in ms
 * @param {Object} options - additional options
 * @param {boolean} options.timedOut - whether it timed out
 * @param {number} options.status - HTTP status code if available
 */
const logRequestEnd = (config, durationMs, { timedOut = false, status = null } = {}) => {
  try {
    const method = (config?.method || 'get').toUpperCase();
    const url = (config?.baseURL || '') + (config?.url || '');
    const duration = formatDuration(durationMs);
    const resultText = timedOut ? 'TIMED OUT' : (status && status >= 400 ? 'FAILED' : 'COMPLETED');
    const statusText = status != null ? `status: ${status}` : '';
    safeLog(console.info, `[API] ${resultText} ${method} ${url} | duration: ${duration}${statusText ? ` | ${statusText}` : ''}`);
  } catch (err) {
    // Swallow logging errors
  }
};

/**
 * Log timeout specific error
 * @param {Object} error - Axios error
 * @param {number|null} durationMs
 */
const logTimeoutError = (error, durationMs = null) => {
  try {
    const config = error?.config || {};
    const method = (config.method || 'get').toUpperCase();
    const url = (config.baseURL || '') + (config.url || '');
    const configuredTimeout = config.timeout != null ? `${config.timeout} ms` : 'default';
    const duration = durationMs != null ? formatDuration(durationMs) : 'unknown';
    safeLog(console.warn, `[API] TIMEOUT ${method} ${url} | configured timeout: ${configuredTimeout} | elapsed: ${duration} | message: ${error.message}`);
  } catch (err) {
    // Swallow logging errors
  }
};

// Create a single axios instance at module level
const createAxiosInstance = (baseURL = import.meta.env.VITE_BACKEND_URL) => {
  return axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Add logging guard for production
const API_LOGGING_ENABLED = (import.meta.env.VITE_API_LOGGING === 'true');

const safeLog = (fn, ...args) => { 
  if (API_LOGGING_ENABLED) fn(...args);
};

const apiClient = (baseURL = import.meta.env.VITE_BACKEND_URL) => {
  const client = createAxiosInstance(baseURL);

  // Request interceptor for adding auth token and request tracking
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        // Support both Authorization header and custom token header
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.token = token;
      }
      
      // Add AbortController for request cancellation
      const controller = new AbortController();
      config.signal = controller.signal;
      config.controller = controller;
      
      // Store controller for potential cancellation
      const requestKey = generateRequestKey(config);
      controllers.set(requestKey, controller);
      
      // Set up cleanup on request completion
      config.signal.addEventListener('abort', () => {
        controllers.delete(requestKey);
      });

      // Record request start time for duration logging
      config.metadata = {
        ...(config.metadata || {}),
        startTime: Date.now()
      };

      // Log request start info
      logRequestStart(config);
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for handling errors and cleanup
  client.interceptors.response.use(
    (response) => {
      // Calculate and log duration
      try {
        const start = response.config?.metadata?.startTime;
        const duration = start ? Date.now() - start : null;
        logRequestEnd(response.config, duration, { timedOut: false, status: response.status });
      } catch (err) {
        // ignore logging errors
      }

      // Clean up controller on successful response
      if (response.config.controller) {
        const requestKey = generateRequestKey(response.config);
        controllers.delete(requestKey);
      }
      return response;
    },
    async (error) => {
      // Calculate duration if possible
      const cfg = error?.config;
      const start = cfg?.metadata?.startTime;
      const duration = start ? Date.now() - start : null;

      // Clean up controller on error
      if (error.config?.controller) {
        const requestKey = generateRequestKey(error.config);
        controllers.delete(requestKey);
      }
      
      // Detect cancellation
      const canceled = error.code === 'ERR_CANCELED' || error?.name === 'CanceledError';
      if (canceled) {
        logRequestEnd(cfg || {}, duration, { timedOut: false, status: null });
        safeLog(console.info, '[API] CANCELED', (cfg?.method || 'GET').toUpperCase(), (cfg?.baseURL || '') + (cfg?.url || ''));
        return handleApiError(error);
      }

      // Detect if this was a timeout
      const timedOut = isTimeoutError(error) || error.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '');
      if (timedOut) {
        logTimeoutError(error, duration);
      } else {
        // For non-timeout errors, log completion with status if available
        const status = error.response?.status ?? null;
        logRequestEnd(cfg || {}, duration, { timedOut: false, status });
      }

      // Additional network error logging
      if (isNetworkError(error)) {
        safeLog(console.warn, '[API] Network error detected:', error.message);
      }

      // Handle all HTTP errors through the global error handler
      return handleApiError(error);
    }
  );

  // Add request deduplication and queueing
  const requestHandler = (config) => {
    const requestKey = generateRequestKey(config);
    
    // If request is already in progress, return the existing promise
    if (requestCache.has(requestKey)) {
      return requestCache.get(requestKey);
    }

    // Create a new promise that will be resolved when the request completes
    const requestPromise = new Promise((resolve, reject) => {
      // Add to queue
      requestQueue.push({
        config: {
          ...config,
          // Ensure we have a fresh AbortController for each request
          signal: (config.signal || new AbortController()).signal
        },
        resolve,
        reject
      });
      
      // Process the queue
      processQueue();
    });

    // Store the promise in cache
    requestCache.set(requestKey, requestPromise);

    // Clean up after request completes
    const cleanup = () => {
      requestCache.delete(requestKey);
      processQueue(); // Process next in queue
    };
    
    requestPromise.then(cleanup).catch(cleanup);

    return requestPromise;
  };

  // Process the next request in the queue
  const processQueue = (error = null) => {
    if (error) {
      // Process queue with error
      requestQueue.forEach((promise, index) => {
        if (promise.config.url === error.config.url) {
          requestQueue[index].reject(error);
          requestQueue.splice(index, 1);
        }
      });
    } else {
      // Process next in queue
      const item = requestQueue.shift();
      if (item) {
        const { config, resolve, reject } = item;
        // Execute request using the client instance
        executeRequest(config)
          .then(response => {
            resolve(response);
            processQueue();
          })
          .catch(error => {
            reject(error);
            processQueue(error);
          });
      }
    }
  };

  // Execute request using the client instance
  const executeRequest = async (config) => {
    try {
      const response = await client(config);
      return response;
    } catch (error) {
      // All error logging is handled by the interceptor to avoid duplication
      // Preserve the error for the interceptor to handle
      throw error;
    }
  };

  // Add HTTP method helpers with deduplication
  const methods = {
    get: (url, config = {}) => requestHandler({ ...config, method: 'get', url }),
    post: (url, data, config = {}) => requestHandler({ ...config, method: 'post', url, data }),
    put: (url, data, config = {}) => requestHandler({ ...config, method: 'put', url, data }),
    patch: (url, data, config = {}) => requestHandler({ ...config, method: 'patch', url, data }),
    delete: (url, config = {}) => requestHandler({ ...config, method: 'delete', url }),
  };

  return {
    ...methods,
    // Add a method to cancel all pending requests
    cancelAll: () => {
      requestCache.forEach((_, key) => {
        requestCache.delete(key);
      });
    },
    // Add a method to cancel a specific request
    cancelRequest: (requestKey) => {
      if (requestCache.has(requestKey)) {
        requestCache.delete(requestKey);
        return true;
      }
      return false;
    },
  };
};

/**
 * Generate a unique key for request deduplication
 * @param {Object} config - Axios request config
 * @returns {string} Unique request key
 */
const generateRequestKey = (config) => {
  const token = localStorage.getItem('token') || '';
  const authSignature = token ? `_${token.slice(-4)}` : ''; // Use last 4 chars of token
  return `${config.method}:${config.baseURL}${config.url}${authSignature}${JSON.stringify(config.params || {})}${JSON.stringify(config.data || {})}`;
};

// Create default API client with base URL from Vite environment
const api = apiClient(import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_API_URL);

/**
 * Cancel all pending requests
 */
const cancelAllRequests = () => {
  // Clear the request queue
  requestQueue.length = 0;
  
  // Abort all active requests
  controllers.forEach((controller, key) => {
    controller.abort();
    controllers.delete(key);
  });
  
  activeRequests = 0;
};

/**
 * Cancel a specific pending request
 * @param {string} url - The URL of the request to cancel
 * @param {string} method - The HTTP method of the request
 */
const cancelRequest = (url, method = 'get') => {
  // Remove from queue
  const queueIndex = requestQueue.findIndex(
    ({ config }) => config.url === url && config.method?.toLowerCase() === method.toLowerCase()
  );
  
  if (queueIndex !== -1) {
    requestQueue.splice(queueIndex, 1);
    return;
  }
  
  // Abort active request
  const key = `${method.toLowerCase()}:${url}`;
  controllers.forEach((controller, requestKey) => {
    if (requestKey.startsWith(key)) {
      controller.abort();
      controllers.delete(requestKey);
      activeRequests--;
    }
  });
};

export { 
  api as default, 
  apiClient, 
  TIMEOUTS, 
  cancelAllRequests, 
  cancelRequest 
};