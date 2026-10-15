/**
 * Frontend logging utility for production environments
 * Provides structured logging with appropriate levels
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

class FrontendLogger {
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
      message,
      url: window.location.href
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
      
      // In production, could send to error reporting service
      if (process.env.NODE_ENV === 'production') {
        this._sendToErrorService(logEntry);
      }
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

  _sendToErrorService(logEntry) {
    // Placeholder for error reporting service integration
    // Could integrate with services like Sentry, LogRocket, etc.
    try {
      // Example: Send to error reporting endpoint
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // }).catch(() => {}); // Silent fail for error reporting
    } catch (e) {
      // Silent fail - don't break app if error reporting fails
    }
  }
}

// Create logger instances for different contexts
export const createLogger = (context) => new FrontendLogger(context);

// Default loggers for common use cases
export const logger = new FrontendLogger('App');
export const orderLogger = new FrontendLogger('Orders');
export const shippingLogger = new FrontendLogger('Shipping');
export const customerLogger = new FrontendLogger('Customer');

export default logger;