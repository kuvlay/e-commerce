/**
 * Comprehensive Error Handling Middleware
 * Implements consistent error handling across all controllers
 * Based on DEBUG_LOG.md requirements for proper error categorization
 */

import { sendErrorResponse, sendServiceUnavailableResponse } from '../utils/responseWrapper.js';
import { logError } from './requestLogger.js';

/**
 * Error types for categorization
 */
export const ErrorTypes = {
  VALIDATION_ERROR: 'ValidationError',
  AUTHENTICATION_ERROR: 'AuthenticationError',
  AUTHORIZATION_ERROR: 'AuthorizationError',
  DATABASE_ERROR: 'DatabaseError',
  NETWORK_ERROR: 'NetworkError',
  BUSINESS_LOGIC_ERROR: 'BusinessLogicError',
  EXTERNAL_SERVICE_ERROR: 'ExternalServiceError',
  FILE_PROCESSING_ERROR: 'FileProcessingError',
  RATE_LIMIT_ERROR: 'RateLimitError'
};

/**
 * Custom Error Classes
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, type = 'AppError', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, ErrorTypes.VALIDATION_ERROR, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details = {}) {
    super(message, 401, ErrorTypes.AUTHENTICATION_ERROR, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient privileges', details = {}) {
    super(message, 403, ErrorTypes.AUTHORIZATION_ERROR, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message, details = {}) {
    super(message, 503, ErrorTypes.DATABASE_ERROR, details);
  }
}

export class NetworkError extends AppError {
  constructor(message, details = {}) {
    super(message, 503, ErrorTypes.NETWORK_ERROR, details);
  }
}

export class BusinessLogicError extends AppError {
  constructor(message, statusCode = 400, details = {}) {
    super(message, statusCode, ErrorTypes.BUSINESS_LOGIC_ERROR, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message, details = {}) {
    super(message, 503, ErrorTypes.EXTERNAL_SERVICE_ERROR, details);
  }
}

export class FileProcessingError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, ErrorTypes.FILE_PROCESSING_ERROR, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', details = {}) {
    super(message, 429, ErrorTypes.RATE_LIMIT_ERROR, details);
  }
}

/**
 * Error classification helper
 * @param {Error} error - Error to classify
 * @returns {Object} Classified error information
 */
const classifyError = (error) => {
  // MongoDB/Mongoose errors
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return {
      type: ErrorTypes.DATABASE_ERROR,
      statusCode: 503,
      message: 'Database operation failed',
      category: 'database'
    };
  }

  // MongoDB duplicate key error
  if (error.code === 11000) {
    return {
      type: ErrorTypes.VALIDATION_ERROR,
      statusCode: 409,
      message: 'Duplicate value detected',
      category: 'validation'
    };
  }

  // Mongoose validation errors
  if (error.name === 'ValidationError') {
    return {
      type: ErrorTypes.VALIDATION_ERROR,
      statusCode: 400,
      message: 'Validation failed',
      category: 'validation'
    };
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return {
      type: ErrorTypes.AUTHENTICATION_ERROR,
      statusCode: 401,
      message: 'Authentication token invalid',
      category: 'authentication'
    };
  }

  // Multer file upload errors
  if (error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_FILE_COUNT') {
    return {
      type: ErrorTypes.FILE_PROCESSING_ERROR,
      statusCode: 400,
      message: 'File upload error',
      category: 'file'
    };
  }

  // Network/connection errors
  if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    return {
      type: ErrorTypes.NETWORK_ERROR,
      statusCode: 503,
      message: 'Network connectivity issue',
      category: 'network'
    };
  }

  // Rate limiting errors
  if (error.status === 429 || error.message.includes('rate limit')) {
    return {
      type: ErrorTypes.RATE_LIMIT_ERROR,
      statusCode: 429,
      message: 'Rate limit exceeded',
      category: 'rate_limit'
    };
  }

  // Default classification
  return {
    type: 'UnknownError',
    statusCode: 500,
    message: 'Internal server error',
    category: 'unknown'
  };
};

/**
 * Extract meaningful error details
 * @param {Error} error - Error object
 * @returns {Object} Error details
 */
const extractErrorDetails = (error) => {
  const details = {
    name: error.name,
    message: error.message,
    timestamp: new Date().toISOString()
  };

  // Add specific details based on error type
  if (error.name === 'ValidationError' && error.errors) {
    details.validationErrors = Object.keys(error.errors).map(field => ({
      field,
      message: error.errors[field].message,
      value: error.errors[field].value
    }));
  }

  if (error.code) {
    details.code = error.code;
  }

  if (error.keyPattern) {
    details.duplicateFields = Object.keys(error.keyPattern);
  }

  if (error.path) {
    details.path = error.path;
  }

  return details;
};

/**
 * Main error handling middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (error, req, res, next) => {
  // Skip if response already sent
  if (res.headersSent) {
    return next(error);
  }

  const requestId = req.requestId || 'unknown';
  
  // Classify the error
  const classification = classifyError(error);
  const errorDetails = extractErrorDetails(error);

  // Log the error with context
  logError(error, {
    operation: `${req.method} ${req.originalUrl || req.url}`,
    userId: req.userId || req.user?.id,
    classification,
    additional: errorDetails
  }, req);

  // Handle custom application errors
  if (error instanceof AppError) {
    return sendErrorResponse(res, error.message, error.statusCode, {
      type: error.type,
      details: error.details,
      requestId,
      timestamp: error.timestamp
    });
  }

  // Handle specific error types
  switch (classification.category) {
    case 'database':
      return sendServiceUnavailableResponse(res, 'Database service temporarily unavailable');

    case 'authentication':
      return sendErrorResponse(res, classification.message, 401, {
        type: classification.type,
        requestId,
        hint: 'Please check your authentication credentials'
      });

    case 'validation':
      const validationDetails = errorDetails.validationErrors || [
        { field: 'unknown', message: error.message }
      ];
      return sendErrorResponse(res, classification.message, 400, {
        type: classification.type,
        validation: validationDetails,
        requestId
      });

    case 'network':
      return sendServiceUnavailableResponse(res, 'Network service temporarily unavailable');

    case 'file':
      return sendErrorResponse(res, classification.message, 400, {
        type: classification.type,
        details: errorDetails,
        requestId
      });

    case 'rate_limit':
      return sendErrorResponse(res, classification.message, 429, {
        type: classification.type,
        requestId,
        retryAfter: '60'
      });

    default:
      // Generic server error
      const isDevelopment = process.env.NODE_ENV !== 'production';
      return sendErrorResponse(res, 
        isDevelopment ? error.message : 'Internal server error', 
        500, 
        isDevelopment ? {
          stack: error.stack,
          details: errorDetails,
          requestId
        } : { requestId }
      );
  }
};

/**
 * Async error wrapper for controllers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function with error handling
 */
export const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found error handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'NotFoundError',
    {
      method: req.method,
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  );
  
  next(error);
};

/**
 * Graceful shutdown handler
 * @param {Object} server - HTTP server instance
 */
export const gracefulShutdown = (server) => {
  const shutdown = (signal) => {
    console.log(`🔄 Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('✅ HTTP server closed.');
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

/**
 * Unhandled rejection handler
 */
export const setupUnhandledRejectionHandler = () => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    
    // Log the error
    console.error('🔍 Unhandled Rejection Details:', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      timestamp: new Date().toISOString()
    });
    
    // In production, you might want to restart the process
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Shutting down due to unhandled rejection...');
      process.exit(1);
    }
  });
};

/**
 * Uncaught exception handler
 */
export const setupUncaughtExceptionHandler = () => {
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('🔍 Exception Details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    console.log('🔄 Shutting down due to uncaught exception...');
    process.exit(1);
  });
};

export default {
  errorHandler,
  asyncErrorHandler,
  notFoundHandler,
  gracefulShutdown,
  setupUnhandledRejectionHandler,
  setupUncaughtExceptionHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  NetworkError,
  BusinessLogicError,
  ExternalServiceError,
  FileProcessingError,
  RateLimitError
};