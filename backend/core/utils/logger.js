/**
 * Production-ready logging utility
 * Provides structured logging with appropriate levels for different environments
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  _shouldLog(level) {
    return level <= CURRENT_LOG_LEVEL;
  }

  _formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LOG_LEVELS)[level];
    
    const logEntry = {
      timestamp,
      level: levelName,
      context: this.context,
      message
    };

    if (data) {
      logEntry.data = data;
    }

    return logEntry;
  }

  error(message, data = null) {
    if (this._shouldLog(LOG_LEVELS.ERROR)) {
      const logEntry = this._formatMessage(LOG_LEVELS.ERROR, message, data);
      console.error(JSON.stringify(logEntry));
    }
  }

  warn(message, data = null) {
    if (this._shouldLog(LOG_LEVELS.WARN)) {
      const logEntry = this._formatMessage(LOG_LEVELS.WARN, message, data);
      console.warn(JSON.stringify(logEntry));
    }
  }

  info(message, data = null) {
    if (this._shouldLog(LOG_LEVELS.INFO)) {
      const logEntry = this._formatMessage(LOG_LEVELS.INFO, message, data);
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message, data = null) {
    if (this._shouldLog(LOG_LEVELS.DEBUG)) {
      const logEntry = this._formatMessage(LOG_LEVELS.DEBUG, message, data);
      console.log(JSON.stringify(logEntry));
    }
  }

  // Convenience method for shipping operations
  shipping(operation, orderId, data = null) {
    this.info(`Shipping ${operation}`, { orderId, ...data });
  }

  // Convenience method for customer operations
  customer(operation, customerId, data = null) {
    this.info(`Customer ${operation}`, { customerId, ...data });
  }

  // Convenience method for order operations
  order(operation, orderId, data = null) {
    this.info(`Order ${operation}`, { orderId, ...data });
  }
}

// Create logger instances for different contexts
export const createLogger = (context) => new Logger(context);

// Default loggers for common use cases
export const logger = new Logger('App');
export const shippingLogger = new Logger('Shipping');
export const customerLogger = new Logger('Customer');
export const orderLogger = new Logger('Order');
export const dashboardLogger = new Logger('Dashboard');

export default logger;