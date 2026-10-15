/**
 * Comprehensive Request Logging Middleware
 * Based on DEBUG_LOG.md requirements for debugging production issues
 * Implements route-specific logging, authentication status, and full URL paths
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Request logging middleware with comprehensive tracking
 * @param {Object} options - Logging configuration options
 * @returns {Function} Express middleware function
 */
export const requestLogger = (options = {}) => {
  const {
    logLevel = 'info',
    logBody = process.env.NODE_ENV !== 'production',
    logHeaders = process.env.NODE_ENV !== 'production', 
    excludePaths = ['/health', '/ping'],
    sensitiveFields = ['password', 'token', 'authorization', 'cookie'],
    maxBodySize = 1000, // chars
    colorize = true
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || uuidv4();
    
    // Attach request ID to request object for use in controllers
    req.requestId = requestId;
    
    // Skip logging for excluded paths
    if (excludePaths.some(path => req.path.includes(path))) {
      return next();
    }

    // Extract key request information
    const requestInfo = {
      requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      route: req.route?.path || 'unknown',
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      protocol: req.protocol,
      httpVersion: req.httpVersion,
      referer: req.get('Referer'),
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      query: Object.keys(req.query).length > 0 ? req.query : undefined
    };

    // Authentication information
    const authInfo = extractAuthInfo(req);
    
    // Log headers (filtered for sensitive data)
    const headers = logHeaders ? sanitizeHeaders(req.headers, sensitiveFields) : undefined;
    
    // Log request body (filtered and size-limited)
    const body = logBody && req.body ? sanitizeBody(req.body, sensitiveFields, maxBodySize) : undefined;

    // Log incoming request
    logRequest('INCOMING', {
      ...requestInfo,
      auth: authInfo,
      headers,
      body
    }, colorize);

    // Capture response details
    const originalSend = res.send;
    const originalJson = res.json;
    let responseBody = null;
    let responseSize = 0;

    // Override res.send to capture response
    res.send = function(data) {
      responseBody = logLevel === 'debug' && data ? sanitizeBody(data, sensitiveFields, maxBodySize) : null;
      responseSize = data ? Buffer.byteLength(data, 'utf8') : 0;
      return originalSend.call(this, data);
    };

    // Override res.json to capture JSON responses
    res.json = function(data) {
      responseBody = logLevel === 'debug' && data ? sanitizeBody(data, sensitiveFields, maxBodySize) : null;
      responseSize = data ? Buffer.byteLength(JSON.stringify(data), 'utf8') : 0;
      return originalJson.call(this, data);
    };

    // Log response when request completes
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const responseInfo = {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        duration: `${duration}ms`,
        responseSize: `${responseSize} bytes`,
        headers: logHeaders ? sanitizeHeaders(res.getHeaders(), sensitiveFields) : undefined,
        body: responseBody
      };

      logRequest('RESPONSE', responseInfo, colorize);
      
      // Log slow requests
      if (duration > 1000) {
        logRequest('SLOW_REQUEST', {
          requestId,
          url: req.originalUrl || req.url,
          duration: `${duration}ms`,
          threshold: '1000ms'
        }, colorize);
      }
      
      // Log error responses
      if (res.statusCode >= 400) {
        logRequest('ERROR_RESPONSE', {
          requestId,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          method: req.method,
          auth: authInfo,
          userAgent: req.get('User-Agent')
        }, colorize);
      }
    });

    next();
  };
};

/**
 * Extract authentication information from request
 * @param {Object} req - Express request object
 * @returns {Object} Authentication details
 */
const extractAuthInfo = (req) => {
  const authHeader = req.get('Authorization');
  const hasToken = !!authHeader;
  const tokenType = hasToken ? authHeader.split(' ')[0] : null;
  
  return {
    hasAuth: hasToken,
    tokenType,
    userId: req.userId || req.user?.id || null,
    userRole: req.user?.role || req.admin?.role || null,
    isAdmin: !!(req.admin || req.user?.role === 'admin'),
    sessionId: req.sessionID || null
  };
};

/**
 * Sanitize headers by removing sensitive information
 * @param {Object} headers - Request/response headers
 * @param {Array} sensitiveFields - Fields to redact
 * @returns {Object} Sanitized headers
 */
const sanitizeHeaders = (headers, sensitiveFields) => {
  const sanitized = {};
  
  Object.keys(headers).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = headers[key];
    }
  });
  
  return sanitized;
};

/**
 * Sanitize request/response body
 * @param {*} body - Body data
 * @param {Array} sensitiveFields - Fields to redact
 * @param {number} maxSize - Maximum size to log
 * @returns {*} Sanitized body
 */
const sanitizeBody = (body, sensitiveFields, maxSize) => {
  if (!body) return body;
  
  let sanitized;
  
  if (typeof body === 'string') {
    try {
      sanitized = JSON.parse(body);
    } catch {
      // If not JSON, just truncate string
      return body.length > maxSize ? body.substring(0, maxSize) + '...' : body;
    }
  } else {
    sanitized = { ...body };
  }
  
  // Recursively sanitize object
  if (typeof sanitized === 'object' && sanitized !== null) {
    sanitized = sanitizeObject(sanitized, sensitiveFields);
  }
  
  // Convert back to string and check size
  const stringified = JSON.stringify(sanitized);
  return stringified.length > maxSize ? stringified.substring(0, maxSize) + '...' : sanitized;
};

/**
 * Recursively sanitize object properties
 * @param {Object} obj - Object to sanitize
 * @param {Array} sensitiveFields - Fields to redact
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj, sensitiveFields) => {
  const sanitized = {};
  
  Object.keys(obj).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (Array.isArray(obj[key])) {
        sanitized[key] = obj[key].map(item => 
          typeof item === 'object' ? sanitizeObject(item, sensitiveFields) : item
        );
      } else {
        sanitized[key] = sanitizeObject(obj[key], sensitiveFields);
      }
    } else {
      sanitized[key] = obj[key];
    }
  });
  
  return sanitized;
};

/**
 * Enhanced logging function with formatting
 * @param {string} type - Log type (INCOMING, RESPONSE, etc.)
 * @param {Object} data - Data to log
 * @param {boolean} colorize - Whether to use colors
 */
const logRequest = (type, data, colorize = true) => {
  const colors = {
    INCOMING: '\x1b[36m',     // Cyan
    RESPONSE: '\x1b[32m',     // Green
    ERROR_RESPONSE: '\x1b[31m', // Red
    SLOW_REQUEST: '\x1b[33m',  // Yellow
    reset: '\x1b[0m'
  };
  
  const color = colorize && colors[type] ? colors[type] : '';
  const reset = colorize ? colors.reset : '';
  
  const prefix = `${color}[${type}]${reset}`;
  const timestamp = new Date().toISOString();
  
  if (type === 'INCOMING') {
    console.log(`${prefix} ${timestamp} ${data.method} ${data.url} - ${data.requestId}`);
    if (data.auth?.hasAuth) {
      console.log(`  🔐 Auth: ${data.auth.tokenType} | User: ${data.auth.userId || 'unknown'} | Role: ${data.auth.userRole || 'none'}`);
    }
    if (data.query) {
      console.log(`  📋 Query:`, data.query);
    }
    if (data.body && Object.keys(data.body).length > 0) {
      console.log(`  📦 Body:`, data.body);
    }
  } else if (type === 'RESPONSE') {
    const statusColor = data.statusCode >= 400 ? '\x1b[31m' : data.statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${prefix} ${timestamp} ${data.method} ${data.url} - ${statusColor}${data.statusCode}${reset} - ${data.duration} - ${data.responseSize}`);
    if (data.body && process.env.NODE_ENV !== 'production') {
      console.log(`  📤 Response:`, data.body);
    }
  } else if (type === 'ERROR_RESPONSE') {
    console.log(`${prefix} ${timestamp} ${data.method} ${data.url} - Status: ${data.statusCode}`);
    if (data.auth?.hasAuth) {
      console.log(`  🔐 User: ${data.auth.userId} | Role: ${data.auth.userRole}`);
    }
    console.log(`  🌐 User-Agent: ${data.userAgent}`);
  } else if (type === 'SLOW_REQUEST') {
    console.log(`${prefix} ${timestamp} ${data.url} took ${data.duration} (threshold: ${data.threshold})`);
  }
};

/**
 * Route-specific logging decorator
 * @param {string} routeName - Name of the route for logging
 * @returns {Function} Route decorator
 */
export const routeLogger = (routeName) => {
  return (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    console.log(`🛣️ [ROUTE:${routeName}] ${req.method} ${req.path} - ${requestId}`);
    
    // Add route name to request for downstream logging
    req.routeName = routeName;
    
    next();
  };
};

/**
 * Database operation logger
 * @param {string} operation - Database operation name
 * @param {Object} details - Operation details
 * @param {Object} req - Express request object
 */
export const logDatabaseOperation = (operation, details, req) => {
  const requestId = req?.requestId || 'unknown';
  const timestamp = new Date().toISOString();
  
  console.log(`🗄️ [DB:${operation}] ${timestamp} - ${requestId}`);
  if (details.collection) {
    console.log(`  📚 Collection: ${details.collection}`);
  }
  if (details.query) {
    console.log(`  🔍 Query:`, details.query);
  }
  if (details.duration) {
    console.log(`  ⏱️ Duration: ${details.duration}ms`);
  }
  if (details.results) {
    console.log(`  📊 Results: ${details.results} records`);
  }
};

/**
 * Performance monitoring logger
 * @param {string} operation - Operation name
 * @param {number} startTime - Start timestamp
 * @param {Object} metadata - Additional metadata
 * @param {Object} req - Express request object
 */
export const logPerformance = (operation, startTime, metadata = {}, req) => {
  const duration = Date.now() - startTime;
  const requestId = req?.requestId || 'unknown';
  
  const color = duration > 1000 ? '\x1b[31m' : duration > 500 ? '\x1b[33m' : '\x1b[32m';
  const reset = '\x1b[0m';
  
  console.log(`⚡ [PERF:${operation}] ${color}${duration}ms${reset} - ${requestId}`);
  
  if (Object.keys(metadata).length > 0) {
    console.log(`  📊 Metadata:`, metadata);
  }
  
  // Log warning for slow operations
  if (duration > 1000) {
    console.log(`  ⚠️ SLOW OPERATION detected (>${1000}ms)`);
  }
};

/**
 * Error logging with context
 * @param {Error} error - Error object
 * @param {Object} context - Error context
 * @param {Object} req - Express request object
 */
export const logError = (error, context = {}, req) => {
  const requestId = req?.requestId || 'unknown';
  const timestamp = new Date().toISOString();
  
  console.error(`❌ [ERROR] ${timestamp} - ${requestId}`);
  console.error(`  🚨 Message: ${error.message}`);
  console.error(`  📍 Stack: ${error.stack}`);
  
  if (context.operation) {
    console.error(`  🔧 Operation: ${context.operation}`);
  }
  
  if (context.userId) {
    console.error(`  👤 User: ${context.userId}`);
  }
  
  if (context.additional) {
    console.error(`  📋 Additional:`, context.additional);
  }
  
  if (req) {
    console.error(`  🌐 Request: ${req.method} ${req.originalUrl || req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.error(`  📦 Body:`, sanitizeBody(req.body, ['password', 'token'], 500));
    }
  }
};

export default {
  requestLogger,
  routeLogger,
  logDatabaseOperation,
  logPerformance,
  logError
};