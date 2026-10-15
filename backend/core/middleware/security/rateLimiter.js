import arcjet, { tokenBucket, fixedWindow, slidingWindow, shield } from '@arcjet/node';
import { performance } from 'perf_hooks';

// Performance monitoring for Arcjet rate limiter
const rateLimiterMetrics = {
  totalRequests: 0,
  blockedRequests: 0,
  allowedRequests: 0,
  averageProcessingTime: 0,
  processingTimes: [],
  arcjetDecisions: {
    ALLOW: 0,
    DENY: 0,
    CHALLENGE: 0,
    ERROR: 0
  }
};

// Initialize Arcjet with comprehensive security rules
const aj = arcjet({
  key: process.env.ARCJET_KEY || 'ajkey_01jxethfx4e6vs2ft0yh6tmdfv',
  characteristics: ['ip.src'], // Rate limit by IP address
  rules: [
    // Shield protection against common attacks
    shield({
      mode: 'LIVE' // Use 'DRY_RUN' for testing
    }),
    
    // Public endpoints - generous limits
    fixedWindow({
      mode: 'LIVE',
      window: '15m', // 15 minute window
      max: 1000, // 1000 requests per window
      characteristics: ['ip.src']
    }),
    
    // Token bucket for burst handling
    tokenBucket({
      mode: 'LIVE',
      refillRate: 10, // 10 tokens per second
      interval: '1s',
      capacity: 100, // Burst capacity of 100 requests
      characteristics: ['ip.src']
    })
  ]
});

// Auth-specific Arcjet instance with stricter limits
const ajAuth = arcjet({
  key: process.env.ARCJET_KEY || 'ajkey_01jxethfx4e6vs2ft0yh6tmdfv',
  characteristics: ['ip.src'],
  rules: [
    shield({
      mode: 'LIVE'
    }),
    
    // Strict rate limiting for authentication
    fixedWindow({
      mode: 'LIVE',
      window: '15m',
      max: 50, // Only 50 auth attempts per 15 minutes
      characteristics: ['ip.src']
    }),
    
    // Very limited burst capacity for auth
    tokenBucket({
      mode: 'LIVE',
      refillRate: 2, // 2 tokens per second
      interval: '1s',
      capacity: 10, // Small burst capacity
      characteristics: ['ip.src']
    })
  ]
});

// Admin-specific Arcjet instance
const ajAdmin = arcjet({
  key: process.env.ARCJET_KEY || 'ajkey_01jxethfx4e6vs2ft0yh6tmdfv',
  characteristics: ['ip.src'],
  rules: [
    shield({
      mode: 'LIVE'
    }),
    
    // Moderate limits for admin operations
    fixedWindow({
      mode: 'LIVE',
      window: '15m',
      max: 200, // 200 admin requests per 15 minutes
      characteristics: ['ip.src']
    }),
    
    tokenBucket({
      mode: 'LIVE',
      refillRate: 5, // 5 tokens per second
      interval: '1s',
      capacity: 50, // Moderate burst capacity
      characteristics: ['ip.src']
    })
  ]
});

// Performance-optimized Arcjet middleware factory
function createArcjetMiddleware(arcjetInstance, middlewareName = 'default') {
  return async (req, res, next) => {
    const start = performance.now();
    rateLimiterMetrics.totalRequests++;
    
    try {
      // Skip rate limiting for health checks and static assets
      if (req.path === '/health' || req.path.startsWith('/static/')) {
        return next();
      }

      // Get client IP with fallback options
      const clientIP = req.ip || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                      '127.0.0.1';

      // Create request context for Arcjet
      const decision = await arcjetInstance.protect(req, {
        ip: clientIP,
        method: req.method,
        protocol: req.protocol,
        host: req.get('host'),
        path: req.path,
        headers: req.headers,
        'user-agent': req.get('user-agent') || 'unknown'
      });

      // Update metrics based on decision
      rateLimiterMetrics.arcjetDecisions[decision.conclusion]++;
      
      const processingTime = performance.now() - start;
      updateProcessingMetrics(processingTime);

      // Handle different decision types
      switch (decision.conclusion) {
        case 'ALLOW':
          rateLimiterMetrics.allowedRequests++;
          
          // Add rate limit headers for transparency
          if (decision.reason && decision.reason.max) {
            res.set({
              'X-RateLimit-Limit': decision.reason.max.toString(),
              'X-RateLimit-Remaining': Math.max(0, decision.reason.max - decision.reason.count).toString(),
              'X-RateLimit-Reset': new Date(decision.reason.resetTime || Date.now() + 900000).toISOString()
            });
          }
          
          return next();

        case 'DENY':
          rateLimiterMetrics.blockedRequests++;
          
          // Enhanced error response with retry information
          const retryAfter = decision.reason?.resetTime ? 
            Math.ceil((decision.reason.resetTime - Date.now()) / 1000) : 900; // 15 minutes default
          
          res.set({
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': decision.reason?.max?.toString() || 'unknown',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(decision.reason?.resetTime || Date.now() + 900000).toISOString()
          });
          
          return res.status(429).json({
            success: false,
            message: 'Rate limit exceeded. Please try again later.',
            error: 'RATE_LIMIT_EXCEEDED',
            retryAfter: retryAfter,
            details: {
              limit: decision.reason?.max || 'unknown',
              window: '15m',
              resetTime: decision.reason?.resetTime || Date.now() + 900000
            }
          });

        case 'CHALLENGE':
          // Handle challenge (could implement CAPTCHA here)
          rateLimiterMetrics.blockedRequests++;
          return res.status(429).json({
            success: false,
            message: 'Security challenge required. Please verify you are human.',
            error: 'SECURITY_CHALLENGE_REQUIRED'
          });

        case 'ERROR':
          // Log error but allow request to proceed (fail open)
          console.error(`Arcjet error in ${middlewareName}:`, decision.reason);
          return next();

        default:
          console.warn(`Unknown Arcjet decision: ${decision.conclusion}`);
          return next();
      }
    } catch (error) {
      // Log error and fail open for availability
      console.error(`Arcjet middleware error in ${middlewareName}:`, error);
      const processingTime = performance.now() - start;
      updateProcessingMetrics(processingTime);
      return next();
    }
  };
}

// Update processing time metrics
function updateProcessingMetrics(processingTime) {
  rateLimiterMetrics.processingTimes.push(processingTime);
  
  // Keep only last 1000 measurements for rolling average
  if (rateLimiterMetrics.processingTimes.length > 1000) {
    rateLimiterMetrics.processingTimes.shift();
  }
  
  rateLimiterMetrics.averageProcessingTime = 
    rateLimiterMetrics.processingTimes.reduce((a, b) => a + b, 0) / 
    rateLimiterMetrics.processingTimes.length;
}

// Create middleware instances
export const publicRateLimit = createArcjetMiddleware(aj, 'public');
export const authRateLimit = createArcjetMiddleware(ajAuth, 'auth');
export const adminRateLimit = createArcjetMiddleware(ajAdmin, 'admin');

// Request metrics middleware
export const requestMetricsMiddleware = (req, res, next) => {
  const start = performance.now();
  
  res.on('finish', () => {
    const processingTime = performance.now() - start;
    updateProcessingMetrics(processingTime);
  });
  
  next();
};

// Enhanced metrics with Arcjet-specific data
export const getRateLimiterMetrics = () => {
  const totalDecisions = Object.values(rateLimiterMetrics.arcjetDecisions).reduce((a, b) => a + b, 0);
  
  return {
    totalRequests: rateLimiterMetrics.totalRequests,
    allowedRequests: rateLimiterMetrics.allowedRequests,
    blockedRequests: rateLimiterMetrics.blockedRequests,
    averageProcessingTime: rateLimiterMetrics.averageProcessingTime,
    
    // Arcjet-specific metrics
    arcjetDecisions: rateLimiterMetrics.arcjetDecisions,
    allowRate: rateLimiterMetrics.totalRequests > 0 ? 
      (rateLimiterMetrics.allowedRequests / rateLimiterMetrics.totalRequests) * 100 : 0,
    blockRate: rateLimiterMetrics.totalRequests > 0 ? 
      (rateLimiterMetrics.blockedRequests / rateLimiterMetrics.totalRequests) * 100 : 0,
    
    // Performance metrics
    processingTimeP95: calculatePercentile(rateLimiterMetrics.processingTimes, 95),
    processingTimeP99: calculatePercentile(rateLimiterMetrics.processingTimes, 99),
    
    // System info
    provider: 'Arcjet',
    version: '1.0.0',
    features: ['rate-limiting', 'shield-protection', 'bot-detection', 'attack-protection']
  };
};

// Calculate percentile for performance analysis
function calculatePercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Health check function for Arcjet
export const checkArcjetHealth = async () => {
  try {
    // Create a test request to check Arcjet connectivity
    const testReq = {
      ip: '127.0.0.1',
      method: 'GET',
      protocol: 'http',
      path: '/health-check',
      headers: { 'user-agent': 'health-check' }
    };
    
    const decision = await aj.protect(testReq, testReq);
    
    return {
      status: 'healthy',
      provider: 'Arcjet',
      decision: decision.conclusion,
      responseTime: decision.duration || 0
    };
  } catch (error) {
    return {
      status: 'error',
      provider: 'Arcjet',
      error: error.message
    };
  }
};

// Reset metrics (for testing)
export const resetRateLimiterMetrics = () => {
  rateLimiterMetrics.totalRequests = 0;
  rateLimiterMetrics.blockedRequests = 0;
  rateLimiterMetrics.allowedRequests = 0;
  rateLimiterMetrics.averageProcessingTime = 0;
  rateLimiterMetrics.processingTimes = [];
  rateLimiterMetrics.arcjetDecisions = {
    ALLOW: 0,
    DENY: 0,
    CHALLENGE: 0,
    ERROR: 0
  };
};