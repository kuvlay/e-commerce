/**
 * Error Monitoring and Reporting Utilities
 * Provides centralized error tracking and reporting functionality
 */

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Error categories
 */
export const ERROR_CATEGORIES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  COMPONENT: 'component',
  API: 'api',
  AUTHENTICATION: 'authentication',
  PERMISSION: 'permission',
  UNKNOWN: 'unknown'
};

/**
 * Error monitoring class
 */
class ErrorMonitor {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors
    this.listeners = [];
    this.isEnabled = process.env.NODE_ENV === 'development' || process.env.REACT_APP_ERROR_MONITORING === 'true';
  }

  /**
   * Capture and log an error
   * @param {Error|string} error - The error to capture
   * @param {Object} context - Additional context information
   * @param {string} severity - Error severity level
   * @param {string} category - Error category
   */
  captureError(error, context = {}, severity = ERROR_SEVERITY.MEDIUM, category = ERROR_CATEGORIES.UNKNOWN) {
    if (!this.isEnabled) return;

    const errorEntry = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.toString() : String(error),
      stack: error instanceof Error ? error.stack : null,
      severity,
      category,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        ...context
      }
    };

    // Add to errors array
    this.errors.unshift(errorEntry);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Captured [${severity.toUpperCase()}]`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Category:', category);
      console.groupEnd();
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(errorEntry);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    // Report to external service if available
    this.reportToExternalService(errorEntry);

    return errorEntry.id;
  }

  /**
   * Add error listener
   * @param {Function} listener - Function to call when error is captured
   */
  addListener(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
  }

  /**
   * Remove error listener
   * @param {Function} listener - Listener to remove
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get recent errors
   * @param {number} limit - Number of errors to return
   * @returns {Array} Recent errors
   */
  getRecentErrors(limit = 10) {
    return this.errors.slice(0, limit);
  }

  /**
   * Get errors by category
   * @param {string} category - Error category to filter by
   * @returns {Array} Filtered errors
   */
  getErrorsByCategory(category) {
    return this.errors.filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   * @param {string} severity - Error severity to filter by
   * @returns {Array} Filtered errors
   */
  getErrorsBySeverity(severity) {
    return this.errors.filter(error => error.severity === severity);
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Generate error report
   * @returns {Object} Error report
   */
  generateReport() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(
      error => new Date(error.timestamp) > last24Hours
    );

    const categoryCounts = {};
    const severityCounts = {};

    recentErrors.forEach(error => {
      categoryCounts[error.category] = (categoryCounts[error.category] || 0) + 1;
      severityCounts[error.severity] = (severityCounts[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      recentErrors: recentErrors.length,
      categoryCounts,
      severityCounts,
      generatedAt: now.toISOString(),
      errors: recentErrors.slice(0, 20) // Include last 20 errors
    };
  }

  /**
   * Report error to external monitoring service
   * @param {Object} errorEntry - Error entry to report
   */
  reportToExternalService(errorEntry) {
    // Check if external error reporting is available
    if (window.errorReporting && typeof window.errorReporting.captureException === 'function') {
      try {
        window.errorReporting.captureException(new Error(errorEntry.error), {
          extra: errorEntry.context,
          tags: {
            severity: errorEntry.severity,
            category: errorEntry.category
          }
        });
      } catch (reportingError) {
        console.warn('Failed to report error to external service:', reportingError);
      }
    }

    // Send to custom endpoint if configured
    const endpoint = import.meta.env.VITE_ERROR_ENDPOINT || process.env.REACT_APP_ERROR_ENDPOINT;
    if (endpoint) {
      import('../utils/apiClient').then(({ default: apiClient, TIMEOUTS }) => {
        apiClient.post(endpoint.replace(import.meta.env.VITE_BACKEND_URL, ''), errorEntry, {
          timeout: TIMEOUTS.medium,
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(fetchError => {
          console.warn('Failed to send error to endpoint:', fetchError);
        });
      }).catch(() => {
        // Fallback to fetch if dynamic import fails
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorEntry)
        }).catch(fetchError => {
          console.warn('Failed to send error to endpoint:', fetchError);
        });
      });
    }
  }
}

// Create singleton instance
const errorMonitor = new ErrorMonitor();

// Global error handler
window.addEventListener('error', (event) => {
  errorMonitor.captureError(
    event.error || event.message,
    {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'global'
    },
    ERROR_SEVERITY.HIGH,
    ERROR_CATEGORIES.UNKNOWN
  );
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorMonitor.captureError(
    event.reason,
    {
      type: 'unhandledPromise'
    },
    ERROR_SEVERITY.HIGH,
    ERROR_CATEGORIES.UNKNOWN
  );
});

export default errorMonitor;

/**
 * Convenience functions for common error types
 */
export const captureNetworkError = (error, context = {}) => {
  return errorMonitor.captureError(
    error,
    { ...context, type: 'network' },
    ERROR_SEVERITY.MEDIUM,
    ERROR_CATEGORIES.NETWORK
  );
};

export const captureValidationError = (error, context = {}) => {
  return errorMonitor.captureError(
    error,
    { ...context, type: 'validation' },
    ERROR_SEVERITY.LOW,
    ERROR_CATEGORIES.VALIDATION
  );
};

export const captureComponentError = (error, context = {}) => {
  return errorMonitor.captureError(
    error,
    { ...context, type: 'component' },
    ERROR_SEVERITY.MEDIUM,
    ERROR_CATEGORIES.COMPONENT
  );
};

export const captureApiError = (error, context = {}) => {
  return errorMonitor.captureError(
    error,
    { ...context, type: 'api' },
    ERROR_SEVERITY.MEDIUM,
    ERROR_CATEGORIES.API
  );
};

export const captureAuthError = (error, context = {}) => {
  return errorMonitor.captureError(
    error,
    { ...context, type: 'authentication' },
    ERROR_SEVERITY.HIGH,
    ERROR_CATEGORIES.AUTHENTICATION
  );
};