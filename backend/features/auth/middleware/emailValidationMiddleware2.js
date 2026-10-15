import { validateEmailForSignup } from '../utils/emailValidator.js';

/**
 * Enhanced email validation middleware v2 with improved error handling and security
 * Provides comprehensive email validation with defensive programming practices
 * 
 * Improvements:
 * - Safe email masking with non-string input handling
 * - Defensive external monitor hook calls
 * - Enhanced error response contract matching legacy middleware
 * - Safe request metadata extraction
 * - Environment-based logging toggles
 */

/**
 * Safely mask email addresses to prevent exposure in logs
 * Handles non-string inputs gracefully
 * @param {any} email - Email input (may be string, number, null, undefined, etc.)
 * @returns {string} - Masked email or safe fallback
 */
const maskEmail = (email) => {
  try {
    if (typeof email === 'string') {
      if (email.length === 0) return '***';
      return email.length >= 3 ? email.substring(0, 3) + '***' : email + '***';
    }
    if (email === null) return 'null';
    if (email === undefined) return 'undefined';
    if (typeof email === 'number') return 'number';
    if (typeof email === 'object') return 'object';
    return 'unknown';
  } catch (error) {
    return 'mask_error';
  }
};

/**
 * Performance and security metrics collector
 */
class MiddlewareMetrics {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulValidations: 0,
      failedValidations: 0,
      securityViolations: 0,
      averageExecutionTime: 0,
      securityViolationTypes: {}
    };
  }

  recordRequest(executionTime, isValid, securityViolations = []) {
    this.metrics.totalRequests++;

    if (isValid) {
      this.metrics.successfulValidations++;
    } else {
      this.metrics.failedValidations++;
    }

    // Update average execution time (ms)
    this.metrics.averageExecutionTime =
      (this.metrics.averageExecutionTime * (this.metrics.totalRequests - 1) + executionTime) /
      this.metrics.totalRequests;

    // Track security violations
    if (securityViolations.length > 0) {
      this.metrics.securityViolations++;
      securityViolations.forEach((violation) => {
        this.metrics.securityViolationTypes[violation] =
          (this.metrics.securityViolationTypes[violation] || 0) + 1;
      });
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulValidations: 0,
      failedValidations: 0,
      securityViolations: 0,
      averageExecutionTime: 0,
      securityViolationTypes: {}
    };
  }
}

// Global metrics instance
const metricsCollector = new MiddlewareMetrics();

/**
 * Enhanced security logger with defensive external hook calls
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {Object} details - Additional details including request metadata
 */
const enhancedSecurityLog = (level, message, details = {}) => {
  // Gate security logging in production - check dynamically
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SECURITY_LOGS !== 'true') {
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    component: 'EMAIL_VALIDATION_MIDDLEWARE_V2',
    message,
    ...details
  };

  // Use appropriate console method if available
  try {
    if (console && typeof console[level] === 'function') {
      console[level](`[EMAIL_MIDDLEWARE_SECURITY_V2] ${timestamp}: ${message}`, details);
    } else if (console && typeof console.log === 'function') {
      console.log(`[EMAIL_MIDDLEWARE_SECURITY_V2] ${timestamp}: ${message}`, details);
    }
  } catch (err) {
    // swallow logging errors to avoid impacting validation flow
    try {
      console.log(`[EMAIL_MIDDLEWARE_SECURITY_V2] ${timestamp}: ${message}`, details);
    } catch (e) {
      // noop
    }
  }

  // Defensive external monitoring hook with try/catch
  if (typeof global.securityMonitor === 'function') {
    try {
      global.securityMonitor(logEntry);
    } catch (error) {
      // Log non-fatal warning on monitoring failure
      try {
        console.warn(`[EMAIL_MIDDLEWARE_SECURITY_V2] Security monitor hook failed: ${error.message}`);
      } catch (e) {
        // Silent failure if console is not available
      }
    }
  }

  return logEntry;
};

/**
 * Performance logger with defensive external hook calls
 * @param {string} operation - Operation being measured
 * @param {number} duration - Duration in milliseconds
 * @param {Object} metadata - Additional metadata
 */
const performanceLog = (operation, duration, metadata = {}) => {
  // Gate performance logging in production - check dynamically
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_PERF_LOGS !== 'true') {
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    component: 'EMAIL_VALIDATION_MIDDLEWARE_V2',
    operation,
    duration,
    unit: 'ms',
    ...metadata
  };

  try {
    console.info(`[EMAIL_MIDDLEWARE_PERFORMANCE_V2] ${timestamp}: ${operation} completed in ${duration}ms`, metadata);
  } catch (_) {
    // ignore logging errors
  }

  // Defensive external monitoring hook with try/catch
  if (typeof global.performanceMonitor === 'function') {
    try {
      global.performanceMonitor(logEntry);
    } catch (error) {
      // Log non-fatal warning on monitoring failure
      try {
        console.warn(`[EMAIL_MIDDLEWARE_PERFORMANCE_V2] Performance monitor hook failed: ${error.message}`);
      } catch (e) {
        // Silent failure if console is not available
      }
    }
  }

  return logEntry;
};

/**
 * Safely extract request metadata with defensive programming
 * @param {Object} req - Express request object
 * @returns {Object} - Request metadata
 */
const extractRequestMetadata = (req) => {
  try {
    return {
      ip: req?.ip || req?.connection?.remoteAddress || req?.socket?.remoteAddress || 'unknown',
      userAgent: req.get?.('User-Agent') || req.headers?.['user-agent'] || 'unknown',
      method: req.method || 'unknown',
      url: req.originalUrl || req.url || 'unknown',
      timestamp: new Date().toISOString(),
      requestId: req.id || req.headers?.['x-request-id'] || 'unknown'
    };
  } catch (error) {
    return {
      ip: 'unknown',
      userAgent: 'unknown',
      method: 'unknown',
      url: 'unknown',
      timestamp: new Date().toISOString(),
      requestId: 'unknown',
      extractionError: error.message || 'metadata_extraction_failed'
    };
  }
};

/**
 * Analyze security violations from validation result
 * @param {Object} validationResult - Result from validateEmailForSignup
 * @returns {Array} - Array of security violation types
 */
const analyzeSecurityViolations = (validationResult) => {
  const violations = [];

  if (!validationResult || typeof validationResult !== 'object') return violations;

  if (!validationResult.isValid && validationResult.securityChecks) {
    const { securityChecks } = validationResult;

    if (securityChecks.homographAttack) {
      violations.push('homograph_attack');
    }

    if (securityChecks.subdomainAttack) {
      violations.push('subdomain_attack');
    }

    if (securityChecks.suspiciousTLD) {
      violations.push('suspicious_tld');
    }

    if (securityChecks.multipleAtSymbols) {
      violations.push('multiple_at_symbols');
    }
  }

  if (validationResult.type === 'security_violation') {
    violations.push('general_security_violation');
  }

  if (validationResult.type === 'domain_restricted') {
    violations.push('domain_restricted');
  }

  return violations;
};

/**
 * Enhanced email validation middleware v2 with improved error handling
 * Maintains backward compatibility while adding defensive programming practices
 * NOTE: This middleware is intentionally synchronous to avoid blocking the request thread.
 * All SMTP/MX checks and async operations should be performed in the controller or background jobs.
 */
const emailValidationMiddleware = (req, res, next) => {
  // Record middleware start time
  const middlewareStartTime = process.hrtime.bigint();
  const startTimestamp = Date.now();

  // Extract request metadata for security logging
  const requestMetadata = extractRequestMetadata(req);

  // Short-circuit when skipping email verification entirely
  if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
    // Minimal logging for visibility
    performanceLog('email_validation_skipped', 0, {
      reason: 'SKIP_EMAIL_VERIFICATION enabled',
      ...requestMetadata
    });

    // Provide a stub validation result for downstream usage
    req.emailValidation = {
      isValid: true,
      type: 'skipped',
      message: 'Email validation skipped by configuration',
      performance: { validationTime: 0, totalTime: 0, timestamp: startTimestamp },
      security: { violations: [], requestMetadata }
    };

    // Record successful metrics
    metricsCollector.recordRequest(0, true, []);

    return next();
  }
  try {
    const { email } = req.body;

    // Enhanced logging with safe email masking
    enhancedSecurityLog('info', 'Email validation middleware started', {
      email: maskEmail(email),
      ...requestMetadata
    });

    // Record validation start time
    const validationStartTime = process.hrtime.bigint();

    // Perform comprehensive email validation using secure validator
    // NOTE: This validation is intentionally synchronous and does not perform SMTP/MX checks
    // SMTP/MX checks are performed asynchronously in the controller or background jobs
    const validationResult = validateEmailForSignup(email);

    // Calculate validation execution time
    const validationEndTime = process.hrtime.bigint();
    const validationDuration = Number(validationEndTime - validationStartTime) / 1000000; // Convert to milliseconds

    // Log validation performance
    performanceLog('email_validation', validationDuration, {
      email: maskEmail(email),
      isValid: validationResult.isValid,
      validationType: validationResult.type,
      ...requestMetadata
    });

    // Analyze security violations
    const securityViolations = analyzeSecurityViolations(validationResult);

    // If email is invalid, return error with enhanced security information
    if (!validationResult.isValid) {
      const middlewareEndTime = process.hrtime.bigint();
      const totalDuration = Number(middlewareEndTime - middlewareStartTime) / 1000000;

      // Log security violations if any
      if (securityViolations.length > 0) {
        enhancedSecurityLog('error', 'Security violation detected during email validation', {
          email: maskEmail(email),
          violations: securityViolations,
          validationResult: {
            type: validationResult.type,
            message: validationResult.message,
            securityChecks: validationResult.securityChecks
          },
          executionTime: totalDuration,
          ...requestMetadata
        });
      } else {
        enhancedSecurityLog('warn', 'Email validation failed', {
          email: maskEmail(email),
          reason: validationResult.message,
          type: validationResult.type,
          executionTime: totalDuration,
          ...requestMetadata
        });
      }

      // Record metrics
      metricsCollector.recordRequest(totalDuration, false, securityViolations);

      // Log final performance metrics
      performanceLog('middleware_total', totalDuration, {
        result: 'failed',
        reason: validationResult.type,
        securityViolations: securityViolations.length,
        ...requestMetadata
      });

      // Enhanced error response contract matching legacy middleware
      // Set message to validation detail for client compatibility
      const errorResponse = {
        success: false,
        message: validationResult.message, // Main validation message for client compatibility
        code: validationResult.type, // Add validation code while keeping message
        error: validationResult.message, // Keep existing error field for backward compatibility
        type: validationResult.type, // Keep existing type field
        suggestions: validationResult.suggestions?.map(s => maskEmail(s)) || [],
        issues: validationResult.issues || []
      };

      // Add debugging information in development
      if (process.env.NODE_ENV === 'development') {
        errorResponse.debug = {
          executionTime: totalDuration,
          validationTime: validationDuration,
          securityChecks: validationResult.securityChecks,
          securityViolations,
          requestMetadata
        };
      }

      return res.status(400).json(errorResponse);
    }

    // If email has suggestions (typos detected but still valid)
    if (validationResult.type === 'suggestion' && validationResult.suggestions.length > 0) {
      enhancedSecurityLog('info', 'Email valid but has suggestions', {
        email: maskEmail(email),
        suggestions: validationResult.suggestions.map(s => maskEmail(s)),
        ...requestMetadata
      });

      // Store masked suggestions in request for potential use in response
      req.emailSuggestions = validationResult.suggestions.map(s => maskEmail(s));
    }

    // Calculate total middleware execution time
    const middlewareEndTime = process.hrtime.bigint();
    const totalDuration = Number(middlewareEndTime - middlewareStartTime) / 1000000;

    // Log successful validation with performance metrics
    enhancedSecurityLog('info', 'Email validation successful', {
      email: maskEmail(email),
      type: validationResult.type,
      executionTime: totalDuration,
      validationTime: validationDuration,
      ...requestMetadata
    });

    // Record successful metrics
    metricsCollector.recordRequest(totalDuration, true, []);

    // Log final performance metrics
    performanceLog('middleware_total', totalDuration, {
      result: 'success',
      type: validationResult.type,
      validationTime: validationDuration,
      hasSuggestions: validationResult.suggestions?.length > 0,
      ...requestMetadata
    });

    // Store enhanced validation result in request for controller use
    req.emailValidation = {
      ...validationResult,
      performance: {
        validationTime: validationDuration,
        totalTime: totalDuration,
        timestamp: startTimestamp
      },
      security: {
        violations: securityViolations,
        requestMetadata
      }
    };

    // Continue to next middleware/controller
    next();
  } catch (error) {
    // Calculate execution time even for errors
    const middlewareEndTime = process.hrtime.bigint();
    const totalDuration = Number(middlewareEndTime - middlewareStartTime) / 1000000;

    // Enhanced error logging with security context
    enhancedSecurityLog('error', 'Error during email validation middleware execution', {
      error: error?.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      executionTime: totalDuration,
      ...extractRequestMetadata(req)
    });

    // Record error metrics
    metricsCollector.recordRequest(totalDuration, false, ['middleware_error']);

    // Log performance even for errors
    performanceLog('middleware_total', totalDuration, {
      result: 'error',
      error: error?.message || String(error),
      ...extractRequestMetadata(req)
    });

    // Return enhanced error response
    const errorResponse = {
      success: false,
      message: process.env.NODE_ENV === 'development' 
        ? error?.message || 'Internal server error during email validation'
        : 'Validation service unavailable',
      error: process.env.NODE_ENV === 'development' ? error?.message || String(error) : 'Validation service unavailable'
    };

    // Add debugging information in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.debug = {
        executionTime: totalDuration,
        stack: error?.stack,
        requestMetadata: extractRequestMetadata(req)
      };
    }

    return res.status(500).json(errorResponse);
  }
};

/**
 * Get current middleware metrics for monitoring
 * @returns {Object} - Current metrics
 */
emailValidationMiddleware.getMetrics = () => {
  return metricsCollector.getMetrics();
};

/**
 * Reset metrics (useful for testing or periodic resets)
 */
emailValidationMiddleware.resetMetrics = () => {
  metricsCollector.reset();
};

// Export the maskEmail helper for testing
emailValidationMiddleware.maskEmail = maskEmail;

export default emailValidationMiddleware;