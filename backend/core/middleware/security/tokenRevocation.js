import { performance } from 'perf_hooks';

// Performance-optimized token revocation system
class OptimizedTokenBlacklist {
  constructor() {
    // Use Map for O(1) lookups
    this.blacklist = new Map();
    this.cleanupInterval = null;
    this.metrics = {
      totalChecks: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCheckTime: 0,
      checkTimes: [],
      blacklistSize: 0,
      cleanupRuns: 0
    };
    
    // Start cleanup process
    this.startCleanup();
  }

  // Optimized token revocation check
  isRevoked(tokenId) {
    const start = performance.now();
    this.metrics.totalChecks++;
    
    try {
      const entry = this.blacklist.get(tokenId);
      const isRevoked = entry && entry.expiresAt > Date.now();
      
      if (entry) {
        this.metrics.cacheHits++;
      } else {
        this.metrics.cacheMisses++;
      }
      
      const checkTime = performance.now() - start;
      this.updateCheckMetrics(checkTime);
      
      return isRevoked;
    } catch (error) {
      console.error('Token revocation check error:', error);
      return false; // Fail open for availability
    }
  }

  // Add token to blacklist with TTL
  revokeToken(tokenId, expiresAt) {
    try {
      this.blacklist.set(tokenId, {
        revokedAt: Date.now(),
        expiresAt: expiresAt
      });
      this.metrics.blacklistSize = this.blacklist.size;
    } catch (error) {
      console.error('Token revocation error:', error);
    }
  }

  // Batch revoke multiple tokens (for user logout from all devices)
  revokeTokensBatch(tokenIds, expiresAt) {
    const start = performance.now();
    
    try {
      for (const tokenId of tokenIds) {
        this.blacklist.set(tokenId, {
          revokedAt: Date.now(),
          expiresAt: expiresAt
        });
      }
      this.metrics.blacklistSize = this.blacklist.size;
      
      const batchTime = performance.now() - start;
      console.log(`Batch revoked ${tokenIds.length} tokens in ${batchTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('Batch token revocation error:', error);
    }
  }

  // Efficient cleanup of expired tokens
  cleanup() {
    const start = performance.now();
    const now = Date.now();
    let removedCount = 0;
    
    try {
      // Use iterator for memory-efficient cleanup
      for (const [tokenId, entry] of this.blacklist.entries()) {
        if (entry.expiresAt <= now) {
          this.blacklist.delete(tokenId);
          removedCount++;
        }
      }
      
      this.metrics.blacklistSize = this.blacklist.size;
      this.metrics.cleanupRuns++;
      
      const cleanupTime = performance.now() - start;
      console.log(`Cleaned up ${removedCount} expired tokens in ${cleanupTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('Token cleanup error:', error);
    }
  }

  // Start automatic cleanup process
  startCleanup() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  // Stop cleanup process
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Update performance metrics
  updateCheckMetrics(checkTime) {
    this.metrics.checkTimes.push(checkTime);
    
    // Keep only last 1000 measurements
    if (this.metrics.checkTimes.length > 1000) {
      this.metrics.checkTimes.shift();
    }
    
    this.metrics.averageCheckTime = 
      this.metrics.checkTimes.reduce((a, b) => a + b, 0) / 
      this.metrics.checkTimes.length;
  }

  // Get performance metrics
  getMetrics() {
    return {
      ...this.metrics,
      hitRate: this.metrics.totalChecks > 0 ? 
        (this.metrics.cacheHits / this.metrics.totalChecks) * 100 : 0,
      memoryUsage: this.blacklist.size * 64 // Approximate bytes per entry
    };
  }

  // Clear all tokens (for testing or emergency)
  clear() {
    this.blacklist.clear();
    this.metrics.blacklistSize = 0;
  }
}

// Create singleton instance
const tokenBlacklist = new OptimizedTokenBlacklist();

// Optimized middleware for token revocation checking
export const checkTokenRevocation = (req, res, next) => {
  const start = performance.now();
  
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    // Extract token ID from JWT (assuming it has 'jti' claim)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return next();
    }

    try {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      const tokenId = payload.jti;
      
      if (tokenId && tokenBlacklist.isRevoked(tokenId)) {
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked'
        });
      }
    } catch (parseError) {
      // If we can't parse the token, let other middleware handle it
      console.warn('Token parsing error in revocation check:', parseError.message);
    }

    const processingTime = performance.now() - start;
    if (processingTime > 10) { // Log slow checks
      console.warn(`Slow token revocation check: ${processingTime.toFixed(2)}ms`);
    }

    next();
  } catch (error) {
    console.error('Token revocation middleware error:', error);
    // Fail open - don't block requests on errors
    next();
  }
};

// Export functions for token management
export const revokeToken = (tokenId, expiresAt) => {
  tokenBlacklist.revokeToken(tokenId, expiresAt);
};

export const revokeTokensBatch = (tokenIds, expiresAt) => {
  tokenBlacklist.revokeTokensBatch(tokenIds, expiresAt);
};

export const getTokenRevocationMetrics = () => {
  return tokenBlacklist.getMetrics();
};

export const clearTokenBlacklist = () => {
  tokenBlacklist.clear();
};

// Graceful shutdown
process.on('SIGTERM', () => {
  tokenBlacklist.stopCleanup();
});

process.on('SIGINT', () => {
  tokenBlacklist.stopCleanup();
});