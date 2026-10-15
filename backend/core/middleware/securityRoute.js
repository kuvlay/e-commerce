import express from 'express';
import { getSecurityPerformanceReport, updatePerformanceThresholds } from '../middleware/security/performanceMonitor.js';
import { getRateLimiterMetrics, checkArcjetHealth } from '../middleware/security/rateLimiter.js';
import { getEnhancedArcjetMetrics } from '../middleware/security/arcjetEnhancements.js';
import { getTokenRevocationMetrics, clearTokenBlacklist } from '../middleware/security/tokenRevocation.js';
import { getValidationMetrics } from '../middleware/security/validation.js';
import adminAuth from '../../features/auth/middleware/adminAuth.js';

const securityRouter = express.Router();

// Get comprehensive security performance dashboard
securityRouter.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const performanceReport = getSecurityPerformanceReport();
    const enhancedMetrics = getEnhancedArcjetMetrics();
    
    res.json({
      success: true,
      data: {
        ...performanceReport,
        enhancedSecurity: enhancedMetrics,
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      }
    });
  } catch (error) {
    console.error('Security dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate security dashboard'
    });
  }
});

// Get rate limiter specific metrics
securityRouter.get('/metrics/rate-limiter', adminAuth, async (req, res) => {
  try {
    const metrics = getRateLimiterMetrics();
    
    res.json({
      success: true,
      data: {
        ...metrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Rate limiter metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rate limiter metrics'
    });
  }
});

// Get token revocation specific metrics
securityRouter.get('/metrics/token-revocation', adminAuth, async (req, res) => {
  try {
    const metrics = getTokenRevocationMetrics();
    
    res.json({
      success: true,
      data: {
        ...metrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Token revocation metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get token revocation metrics'
    });
  }
});

// Get validation specific metrics
securityRouter.get('/metrics/validation', adminAuth, async (req, res) => {
  try {
    const metrics = getValidationMetrics();
    
    res.json({
      success: true,
      data: {
        ...metrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Validation metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get validation metrics'
    });
  }
});

// Update performance thresholds
securityRouter.put('/thresholds', adminAuth, async (req, res) => {
  try {
    const { thresholds } = req.body;
    
    // Validate thresholds
    const validThresholds = {};
    const allowedThresholds = ['memoryUsageMB', 'averageProcessingTimeMs', 'errorRatePercent', 'slowRequestThresholdMs'];
    
    for (const [key, value] of Object.entries(thresholds)) {
      if (allowedThresholds.includes(key) && typeof value === 'number' && value > 0) {
        validThresholds[key] = value;
      }
    }
    
    if (Object.keys(validThresholds).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid thresholds provided'
      });
    }
    
    updatePerformanceThresholds(validThresholds);
    
    res.json({
      success: true,
      message: 'Performance thresholds updated successfully',
      data: {
        updatedThresholds: validThresholds
      }
    });
  } catch (error) {
    console.error('Update thresholds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update performance thresholds'
    });
  }
});

// Clear token blacklist (emergency endpoint)
securityRouter.delete('/token-blacklist', adminAuth, async (req, res) => {
  try {
    clearTokenBlacklist();
    
    res.json({
      success: true,
      message: 'Token blacklist cleared successfully'
    });
  } catch (error) {
    console.error('Clear token blacklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear token blacklist'
    });
  }
});

// Get enhanced Arcjet metrics
securityRouter.get('/metrics/enhanced', adminAuth, async (req, res) => {
  try {
    const enhancedMetrics = getEnhancedArcjetMetrics();
    
    res.json({
      success: true,
      data: enhancedMetrics
    });
  } catch (error) {
    console.error('Enhanced metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get enhanced security metrics'
    });
  }
});

// Get system health status
securityRouter.get('/health', async (req, res) => {
  try {
    const performanceReport = getSecurityPerformanceReport();
    const rateLimiterMetrics = getRateLimiterMetrics();
    const tokenRevocationMetrics = getTokenRevocationMetrics();
    const validationMetrics = getValidationMetrics();
    
    // Check Arcjet health
    const arcjetHealth = await checkArcjetHealth();
    
    // Determine overall health status
    let status = 'healthy';
    const issues = [];
    
    // Check Arcjet connectivity
    if (arcjetHealth.status === 'error') {
      status = 'critical';
      issues.push('Arcjet service connectivity issues');
    }
    
    // Check memory usage
    if (performanceReport.systemMetrics.memory.current > 400) {
      status = 'warning';
      issues.push('High memory usage');
    }
    
    // Check average processing times
    if (performanceReport.overview.averageSecurityOverhead > 50) {
      status = 'warning';
      issues.push('High security processing overhead');
    }
    
    // Check Arcjet error rate
    if (rateLimiterMetrics.arcjetDecisions.ERROR > 0) {
      status = 'warning';
      issues.push('Arcjet API errors detected');
    }
    
    // Check validation error rates
    if (validationMetrics.errorRate > 10) {
      status = 'critical';
      issues.push('High validation error rate');
    }
    
    // Check recent alerts
    const criticalAlerts = performanceReport.alerts.recent.filter(alert => alert.severity === 'CRITICAL');
    if (criticalAlerts.length > 0) {
      status = 'critical';
      issues.push('Critical security alerts detected');
    }
    
    res.json({
      success: true,
      data: {
        status,
        issues,
        uptime: performanceReport.overview.uptime,
        timestamp: new Date().toISOString(),
        components: {
          arcjet: arcjetHealth,
          rateLimiter: rateLimiterMetrics.totalRequests > 0 ? 'active' : 'idle',
          tokenRevocation: tokenRevocationMetrics.totalChecks > 0 ? 'active' : 'idle',
          validation: validationMetrics.totalValidations > 0 ? 'active' : 'idle'
        },
        arcjetMetrics: {
          decisions: rateLimiterMetrics.arcjetDecisions,
          allowRate: rateLimiterMetrics.allowRate,
          blockRate: rateLimiterMetrics.blockRate,
          averageResponseTime: rateLimiterMetrics.averageProcessingTime
        }
      }
    });
  } catch (error) {
    console.error('Security health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security health status',
      data: {
        status: 'error',
        issues: ['Health check failed']
      }
    });
  }
});

export default securityRouter;