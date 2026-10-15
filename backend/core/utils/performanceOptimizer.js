/**
 * Performance Optimization Utilities
 * Provides caching, query optimization, and performance monitoring
 */

import { logger } from "./logger.js";

// Simple in-memory cache for frequently accessed data
class MemoryCache {
  constructor(defaultTTL = 300000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
    
    // Clean up expired entries periodically
    if (this.cache.size % 100 === 0) {
      this.cleanup();
    }
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instances
export const orderCache = new MemoryCache(180000); // 3 minutes for orders
export const userCache = new MemoryCache(600000); // 10 minutes for users
export const productCache = new MemoryCache(900000); // 15 minutes for products

/**
 * Performance monitoring decorator
 */
export const withPerformanceMonitoring = (fn, context = 'Operation') => {
  return async (...args) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();
      
      // Log performance metrics for slow operations
      if (duration > 1000) {
        logger.warn(`Slow operation detected: ${context}`, {
          duration: `${duration}ms`,
          memoryDelta: {
            heapUsed: `${(endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024}MB`,
            external: `${(endMemory.external - startMemory.external) / 1024 / 1024}MB`
          }
        });
      } else if (duration > 500) {
        logger.info(`Operation completed: ${context}`, { duration: `${duration}ms` });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Operation failed: ${context}`, {
        duration: `${duration}ms`,
        error: error.message
      });
      throw error;
    }
  };
};

/**
 * Database query optimization helpers
 */
export const optimizeQuery = (query) => {
  // Add lean() for read-only operations to improve performance
  if (query.op === 'find' || query.op === 'findOne') {
    return query.lean();
  }
  return query;
};

/**
 * Batch processing utility for large datasets
 */
export const processBatch = async (items, processor, batchSize = 100) => {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    // Small delay between batches to prevent overwhelming the system
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  return results;
};

/**
 * Memory usage monitoring
 */
export const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`
  };
};

/**
 * Request rate limiting helper
 */
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    this.requests.set(identifier, validRequests);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    return true;
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

/**
 * Cleanup unused resources periodically
 */
export const startPerformanceCleanup = () => {
  setInterval(() => {
    orderCache.cleanup();
    userCache.cleanup();
    productCache.cleanup();
    
    // Log memory usage periodically in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Memory usage', getMemoryUsage());
    }
  }, 300000); // Every 5 minutes
};

export default {
  MemoryCache,
  orderCache,
  userCache,
  productCache,
  withPerformanceMonitoring,
  optimizeQuery,
  processBatch,
  getMemoryUsage,
  RateLimiter,
  startPerformanceCleanup
};