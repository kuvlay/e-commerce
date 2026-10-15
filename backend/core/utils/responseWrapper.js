/**
 * Standardized API Response Wrapper Utility
 * Ensures consistent response structures across all controllers
 * Based on DEBUG_LOG.md analysis and recommendations
 */

/**
 * Success Response Wrapper
 * @param {Object} res - Express response object
 * @param {Object|Array} data - Response data
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata (pagination, counts, etc.)
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccessResponse = (res, data, message = 'Operation successful', meta = {}, statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };

  return res.status(statusCode).json(response);
};

/**
 * Error Response Wrapper
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} errorDetails - Additional error details for debugging
 */
export const sendErrorResponse = (res, message = 'Operation failed', statusCode = 500, errorDetails = {}) => {
  const response = {
    success: false,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      statusCode
    }
  };

  // Include error details only in development/debug mode
  if (process.env.NODE_ENV !== 'production' && Object.keys(errorDetails).length > 0) {
    response.debug = {
      error: errorDetails.message || errorDetails,
      stack: errorDetails.stack,
      name: errorDetails.name
    };
  }

  return res.status(statusCode).json(response);
};

/**
 * Dashboard Response Wrapper - Legacy support for existing frontend
 * @param {Object} res - Express response object
 * @param {Object} stats - Dashboard statistics data
 * @param {string} message - Success message
 */
export const sendDashboardResponse = (res, stats, message = 'Dashboard data retrieved successfully') => {
  // Maintain legacy structure for dashboard while adding standardization
  const response = {
    success: true,
    message,
    stats, // Keep existing stats structure for frontend compatibility
    meta: {
      timestamp: new Date().toISOString(),
      dataSource: 'dashboard',
      totalMetrics: Object.keys(stats).length
    }
  };

  return res.status(200).json(response);
};

/**
 * Orders Response Wrapper - Enhanced for order management
 * @param {Object} res - Express response object
 * @param {Array} orders - Orders array
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata
 */
export const sendOrdersResponse = (res, orders, message = 'Orders retrieved successfully', meta = {}) => {
  const response = {
    success: true,
    message,
    orders, // Keep existing orders structure for frontend compatibility
    meta: {
      timestamp: new Date().toISOString(),
      totalOrders: orders.length,
      dataSource: 'orders',
      ...meta
    }
  };

  return res.status(200).json(response);
};

/**
 * Customers Response Wrapper - Enhanced for customer management
 * @param {Object} res - Express response object
 * @param {Array} customers - Customers array
 * @param {Object} summary - Customer summary statistics
 * @param {string} message - Success message
 */
export const sendCustomersResponse = (res, customers, summary = {}, message = 'Customers retrieved successfully') => {
  const response = {
    success: true,
    message,
    customers, // Keep existing customers structure for frontend compatibility
    summary: {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      ...summary
    },
    meta: {
      timestamp: new Date().toISOString(),
      dataSource: 'customers',
      totalRecords: customers.length
    }
  };

  return res.status(200).json(response);
};

/**
 * Validation Error Response
 * @param {Object} res - Express response object
 * @param {Array|Object} validationErrors - Validation error details
 * @param {string} message - Error message
 */
export const sendValidationErrorResponse = (res, validationErrors, message = 'Validation failed') => {
  const response = {
    success: false,
    message,
    errors: validationErrors,
    meta: {
      timestamp: new Date().toISOString(),
      type: 'validation_error',
      statusCode: 400
    }
  };

  return res.status(400).json(response);
};

/**
 * Not Found Response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource that was not found
 * @param {string} identifier - Resource identifier
 */
export const sendNotFoundResponse = (res, resource = 'Resource', identifier = '') => {
  const message = identifier 
    ? `${resource} with identifier '${identifier}' not found`
    : `${resource} not found`;

  const response = {
    success: false,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      type: 'not_found',
      statusCode: 404,
      resource,
      identifier
    }
  };

  return res.status(404).json(response);
};

/**
 * Unauthorized Response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
export const sendUnauthorizedResponse = (res, message = 'Unauthorized access') => {
  const response = {
    success: false,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      type: 'unauthorized',
      statusCode: 401
    }
  };

  return res.status(401).json(response);
};

/**
 * Forbidden Response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 */
export const sendForbiddenResponse = (res, message = 'Forbidden access') => {
  const response = {
    success: false,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      type: 'forbidden',
      statusCode: 403
    }
  };

  return res.status(403).json(response);
};

/**
 * Service Unavailable Response
 * @param {Object} res - Express response object
 * @param {string} message - Service unavailable message
 */
export const sendServiceUnavailableResponse = (res, message = 'Service temporarily unavailable') => {
  const response = {
    success: false,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      type: 'service_unavailable',
      statusCode: 503
    }
  };

  return res.status(503).json(response);
};