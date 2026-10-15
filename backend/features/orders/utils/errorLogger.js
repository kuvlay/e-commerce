/**
 * Comprehensive error logging and monitoring utility
 * Provides detailed error tracking, performance monitoring, and audit logging
 */

import fs from 'fs/promises';
import path from 'path';

// Error log file paths
const ERROR_LOG_DIR = path.join(process.cwd(), 'logs', 'errors');
const PERFORMANCE_LOG_DIR = path.join(process.cwd(), 'logs', 'performance');
const AUDIT_LOG_DIR = path.join(process.cwd(), 'logs', 'audit');

// Ensure log directories exist
const ensureLogDirectories = async () => {
  try {
    await fs.mkdir(ERROR_LOG_DIR, { recursive: true });
    await fs.mkdir(PERFORMANCE_LOG_DIR, { recursive: true });
    await fs.mkdir(AUDIT_LOG_DIR, { recursive: true });
  } catch (error) {
    console.warn('Failed to create log directories:', error.message);
  }
};

// Initialize log directories
ensureLogDirectories();

/**
 * Log detailed error information for debugging and monitoring
 * @param {string} operation - The operation that failed
 * @param {Error} error - The error object
 * @param {Object} context - Additional context information
 * @param {string} requestId - Request correlation ID
 */
export const logDetailedError = async (operation, error, context = {}, requestId = null) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      requestId,
      operation,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      context: {
        ...context,
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      },
      severity: categorizeErrorSeverity(error),
      category: categorizeError(error)
    };

    // Write to daily error log file
    const logFileName = `errors-${timestamp.split('T')[0]}.json`;
    const logFilePath = path.join(ERROR_LOG_DIR, logFileName);
    
    await appendToLogFile(logFilePath, logEntry);
    
    // Log to console with appropriate level
    if (logEntry.severity === 'critical') {
      console.error(`🚨 CRITICAL ERROR [${requestId}]:`, logEntry);
    } else if (logEntry.severity === 'high') {
      console.error(`❌ HIGH SEVERITY ERROR [${requestId}]:`, logEntry);
    } else {
      console.warn(`⚠️ ERROR [${requestId}]:`, logEntry);
    }

    return logEntry;
  } catch (loggingError) {
    console.error('Failed to log error:', loggingError.message);
    return null;
  }
};

/**
 * Log performance metrics for monitoring and optimization
 * @param {string} operation - The operation being measured
 * @param {number} duration - Duration in milliseconds
 * @param {Object} metrics - Additional performance metrics
 * @param {string} requestId - Request correlation ID
 */
export const logPerformanceMetrics = async (operation, duration, metrics = {}, requestId = null) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      requestId,
      operation,
      duration,
      metrics: {
        ...metrics,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime()
      },
      performance: {
        category: categorizePerformance(duration),
        isSlowQuery: duration > 5000,
        isVerySlowQuery: duration > 10000
      }
    };

    // Write to daily performance log file
    const logFileName = `performance-${timestamp.split('T')[0]}.json`;
    const logFilePath = path.join(PERFORMANCE_LOG_DIR, logFileName);
    
    await appendToLogFile(logFilePath, logEntry);
    
    // Log performance warnings
    if (logEntry.performance.isVerySlowQuery) {
      console.warn(`🐌 VERY SLOW QUERY [${requestId}]: ${operation} took ${duration}ms`);
    } else if (logEntry.performance.isSlowQuery) {
      console.warn(`⏰ SLOW QUERY [${requestId}]: ${operation} took ${duration}ms`);
    }

    return logEntry;
  } catch (loggingError) {
    console.error('Failed to log performance metrics:', loggingError.message);
    return null;
  }
};

/**
 * Log audit trail for security and compliance
 * @param {string} userId - User performing the action
 * @param {string} action - Action being performed
 * @param {Object} details - Action details
 * @param {string} requestId - Request correlation ID
 */
export const logAuditTrail = async (userId, action, details = {}, requestId = null) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      requestId,
      userId,
      action,
      details: {
        ...details,
        userAgent: details.userAgent || 'Unknown',
        ipAddress: details.ipAddress || 'Unknown',
        sessionId: details.sessionId || 'Unknown'
      },
      security: {
        riskLevel: categorizeSecurityRisk(action, details),
        requiresReview: isHighRiskAction(action, details)
      }
    };

    // Write to daily audit log file
    const logFileName = `audit-${timestamp.split('T')[0]}.json`;
    const logFilePath = path.join(AUDIT_LOG_DIR, logFileName);
    
    await appendToLogFile(logFilePath, logEntry);
    
    // Log high-risk actions
    if (logEntry.security.requiresReview) {
      console.warn(`🔒 HIGH RISK ACTION [${requestId}]: ${action} by user ${userId}`);
    }

    return logEntry;
  } catch (loggingError) {
    console.error('Failed to log audit trail:', loggingError.message);
    return null;
  }
};

/**
 * Append log entry to file with proper formatting
 * @param {string} filePath - Path to log file
 * @param {Object} logEntry - Log entry to append
 */
const appendToLogFile = async (filePath, logEntry) => {
  try {
    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.appendFile(filePath, logLine, 'utf8');
  } catch (error) {
    // Fallback to console if file writing fails
    console.error('Failed to write to log file:', error.message);
    console.log('Log entry:', logEntry);
  }
};

/**
 * Categorize error severity based on error type and context
 * @param {Error} error - The error object
 * @returns {string} Severity level
 */
const categorizeErrorSeverity = (error) => {
  if (error.name === 'MongoNetworkError' || error.message?.includes('ECONNREFUSED')) {
    return 'critical';
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return 'low';
  }
  if (error.name === 'MongoTimeoutError' || error.message?.includes('timeout')) {
    return 'medium';
  }
  if (error.name === 'MongoServerError' || error.code === 11000) {
    return 'high';
  }
  return 'medium';
};

/**
 * Categorize error type for better organization
 * @param {Error} error - The error object
 * @returns {string} Error category
 */
const categorizeError = (error) => {
  if (error.name?.includes('Mongo')) return 'database';
  if (error.name === 'ValidationError') return 'validation';
  if (error.name === 'CastError') return 'data_type';
  if (error.message?.includes('timeout')) return 'timeout';
  if (error.message?.includes('network') || error.message?.includes('ECONNREFUSED')) return 'network';
  if (error.name === 'TypeError') return 'programming';
  return 'unknown';
};

/**
 * Categorize performance based on duration
 * @param {number} duration - Duration in milliseconds
 * @returns {string} Performance category
 */
const categorizePerformance = (duration) => {
  if (duration < 100) return 'excellent';
  if (duration < 500) return 'good';
  if (duration < 1000) return 'acceptable';
  if (duration < 5000) return 'slow';
  return 'very_slow';
};

/**
 * Categorize security risk level
 * @param {string} action - Action being performed
 * @param {Object} details - Action details
 * @returns {string} Risk level
 */
const categorizeSecurityRisk = (action, details) => {
  const highRiskActions = ['ORDER_STATUS_UPDATED', 'SHIPPING_INFO_UPDATED', 'ORDER_DECLINED'];
  const mediumRiskActions = ['ORDER_VIEWED', 'CUSTOMER_VIEWED'];
  
  if (highRiskActions.includes(action)) return 'high';
  if (mediumRiskActions.includes(action)) return 'medium';
  return 'low';
};

/**
 * Determine if action requires security review
 * @param {string} action - Action being performed
 * @param {Object} details - Action details
 * @returns {boolean} Whether review is required
 */
const isHighRiskAction = (action, details) => {
  const criticalActions = ['ORDER_DECLINED', 'BULK_STATUS_UPDATE'];
  return criticalActions.includes(action) || details.bulkOperation === true;
};

/**
 * Get error statistics for monitoring dashboard
 * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to today)
 * @returns {Object} Error statistics
 */
export const getErrorStatistics = async (date = null) => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const logFileName = `errors-${targetDate}.json`;
    const logFilePath = path.join(ERROR_LOG_DIR, logFileName);
    
    try {
      const logContent = await fs.readFile(logFilePath, 'utf8');
      const logLines = logContent.trim().split('\n').filter(line => line.trim());
      const errors = logLines.map(line => JSON.parse(line));
      
      const statistics = {
        totalErrors: errors.length,
        bySeverity: {},
        byCategory: {},
        byOperation: {},
        timeRange: {
          start: errors[0]?.timestamp,
          end: errors[errors.length - 1]?.timestamp
        }
      };
      
      errors.forEach(error => {
        // Count by severity
        statistics.bySeverity[error.severity] = (statistics.bySeverity[error.severity] || 0) + 1;
        
        // Count by category
        statistics.byCategory[error.category] = (statistics.byCategory[error.category] || 0) + 1;
        
        // Count by operation
        statistics.byOperation[error.operation] = (statistics.byOperation[error.operation] || 0) + 1;
      });
      
      return statistics;
    } catch (fileError) {
      return {
        totalErrors: 0,
        bySeverity: {},
        byCategory: {},
        byOperation: {},
        message: 'No error log found for this date'
      };
    }
  } catch (error) {
    console.error('Failed to get error statistics:', error.message);
    return null;
  }
};

/**
 * Clean up old log files to prevent disk space issues
 * @param {number} retentionDays - Number of days to retain logs
 */
export const cleanupOldLogs = async (retentionDays = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const directories = [ERROR_LOG_DIR, PERFORMANCE_LOG_DIR, AUDIT_LOG_DIR];
    
    for (const directory of directories) {
      try {
        const files = await fs.readdir(directory);
        
        for (const file of files) {
          const filePath = path.join(directory, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            console.log(`Cleaned up old log file: ${file}`);
          }
        }
      } catch (dirError) {
        console.warn(`Failed to clean up directory ${directory}:`, dirError.message);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup old logs:', error.message);
  }
};

// Schedule daily log cleanup (run once per day)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    cleanupOldLogs(30); // Keep logs for 30 days
  }, 24 * 60 * 60 * 1000); // Run daily
}