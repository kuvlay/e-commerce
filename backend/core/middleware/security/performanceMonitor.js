import { performance, PerformanceObserver } from 'perf_hooks';
import { getRateLimiterMetrics } from './rateLimiter.js';
import { getTokenRevocationMetrics } from './tokenRevocation.js';
import { getValidationMetrics } from './validation.js';

// Security Performance Monitor
class SecurityPerformanceMonitor {
  constructor() {
    this.metrics = {
      startTime: Date.now(),
      memoryUsage: {
        current: 0,
        peak: 0,
        history: []
      },
      cpuUsage: {
        current: 0,
        history: []
      },
      requestMetrics: {
        totalRequests: 0,
        securityProcessingTime: 0,
        averageSecurityOverhead: 0,
        slowRequests: 0
      },
      alerts: [],
      thresholds: {
        memoryUsageMB: 500, // Alert if memory usage exceeds 500MB
        averageProcessingTimeMs: 50, // Alert if average processing time exceeds 50ms
        errorRatePercent: 5, // Alert if error rate exceeds 5%
        slowRequestThresholdMs: 100 // Consider request slow if security processing > 100ms
      }
    };

    this.performanceObserver = null;
    this.monitoringInterval = null;
    this.alertCooldowns = new Map();
    
    this.startMonitoring();
  }

  // Start performance monitoring
  startMonitoring() {
    // Monitor memory and CPU usage every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkThresholds();
      this.cleanupOldData();
    }, 30000);

    // Set up performance observer for detailed timing
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.name.startsWith('security-')) {
          this.recordSecurityTiming(entry);
        }
      }
    });

    this.performanceObserver.observe({ entryTypes: ['measure'] });
  }

  // Collect system metrics
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const currentMemoryMB = memUsage.heapUsed / 1024 / 1024;
    
    // Update memory metrics
    this.metrics.memoryUsage.current = currentMemoryMB;
    this.metrics.memoryUsage.peak = Math.max(this.metrics.memoryUsage.peak, currentMemoryMB);
    this.metrics.memoryUsage.history.push({
      timestamp: Date.now(),
      value: currentMemoryMB
    });

    // Keep only last 100 memory readings (50 minutes of data)
    if (this.metrics.memoryUsage.history.length > 100) {
      this.metrics.memoryUsage.history.shift();
    }

    // CPU usage (simplified - in production, use more sophisticated CPU monitoring)
    const cpuUsage = process.cpuUsage();
    const currentCpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    
    this.metrics.cpuUsage.current = currentCpuPercent;
    this.metrics.cpuUsage.history.push({
      timestamp: Date.now(),
      value: currentCpuPercent
    });

    // Keep only last 100 CPU readings
    if (this.metrics.cpuUsage.history.length > 100) {
      this.metrics.cpuUsage.history.shift();
    }
  }

  // Record security-related timing
  recordSecurityTiming(entry) {
    this.metrics.requestMetrics.securityProcessingTime += entry.duration;
    this.metrics.requestMetrics.totalRequests++;
    
    // Calculate average security overhead
    this.metrics.requestMetrics.averageSecurityOverhead = 
      this.metrics.requestMetrics.securityProcessingTime / 
      this.metrics.requestMetrics.totalRequests;

    // Track slow requests
    if (entry.duration > this.metrics.thresholds.slowRequestThresholdMs) {
      this.metrics.requestMetrics.slowRequests++;
    }
  }

  // Check performance thresholds and generate alerts
  checkThresholds() {
    const now = Date.now();
    
    // Memory usage alert
    if (this.metrics.memoryUsage.current > this.metrics.thresholds.memoryUsageMB) {
      this.generateAlert('HIGH_MEMORY_USAGE', 
        `Memory usage is ${this.metrics.memoryUsage.current.toFixed(2)}MB, exceeding threshold of ${this.metrics.thresholds.memoryUsageMB}MB`);
    }

    // Average processing time alert
    if (this.metrics.requestMetrics.averageSecurityOverhead > this.metrics.thresholds.averageProcessingTimeMs) {
      this.generateAlert('SLOW_SECURITY_PROCESSING', 
        `Average security processing time is ${this.metrics.requestMetrics.averageSecurityOverhead.toFixed(2)}ms, exceeding threshold of ${this.metrics.thresholds.averageProcessingTimeMs}ms`);
    }

    // Get component-specific metrics for error rate checking
    const rateLimiterMetrics = getRateLimiterMetrics();
    const validationMetrics = getValidationMetrics();
    
    // Rate limiter error rate
    if (rateLimiterMetrics.totalRequests > 0) {
      const errorRate = (rateLimiterMetrics.blockedRequests / rateLimiterMetrics.totalRequests) * 100;
      if (errorRate > this.metrics.thresholds.errorRatePercent) {
        this.generateAlert('HIGH_RATE_LIMIT_BLOCKS', 
          `Rate limiter blocking ${errorRate.toFixed(2)}% of requests, exceeding threshold of ${this.metrics.thresholds.errorRatePercent}%`);
      }
    }

    // Validation error rate
    if (validationMetrics.errorRate > this.metrics.thresholds.errorRatePercent) {
      this.generateAlert('HIGH_VALIDATION_ERROR_RATE', 
        `Validation error rate is ${validationMetrics.errorRate.toFixed(2)}%, exceeding threshold of ${this.metrics.thresholds.errorRatePercent}%`);
    }
  }

  // Generate alert with cooldown to prevent spam
  generateAlert(type, message) {
    const now = Date.now();
    const cooldownPeriod = 5 * 60 * 1000; // 5 minutes
    
    const lastAlert = this.alertCooldowns.get(type);
    if (lastAlert && (now - lastAlert) < cooldownPeriod) {
      return; // Skip alert due to cooldown
    }

    const alert = {
      type,
      message,
      timestamp: now,
      severity: this.getAlertSeverity(type)
    };

    this.metrics.alerts.push(alert);
    this.alertCooldowns.set(type, now);

    // Log alert
    console.warn(`[SECURITY PERFORMANCE ALERT] ${alert.severity}: ${message}`);

    // Keep only last 50 alerts
    if (this.metrics.alerts.length > 50) {
      this.metrics.alerts.shift();
    }
  }

  // Determine alert severity
  getAlertSeverity(type) {
    const severityMap = {
      'HIGH_MEMORY_USAGE': 'WARNING',
      'SLOW_SECURITY_PROCESSING': 'WARNING',
      'HIGH_RATE_LIMIT_BLOCKS': 'INFO',
      'HIGH_VALIDATION_ERROR_RATE': 'WARNING'
    };
    
    return severityMap[type] || 'INFO';
  }

  // Clean up old data to prevent memory leaks
  cleanupOldData() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Clean up old alerts
    this.metrics.alerts = this.metrics.alerts.filter(alert => alert.timestamp > oneHourAgo);
    
    // Clean up old cooldowns
    for (const [type, timestamp] of this.alertCooldowns.entries()) {
      if (timestamp < oneHourAgo) {
        this.alertCooldowns.delete(type);
      }
    }
  }

  // Get comprehensive security performance report
  getPerformanceReport() {
    const rateLimiterMetrics = getRateLimiterMetrics();
    const tokenRevocationMetrics = getTokenRevocationMetrics();
    const validationMetrics = getValidationMetrics();
    
    return {
      overview: {
        uptime: Date.now() - this.metrics.startTime,
        totalRequests: this.metrics.requestMetrics.totalRequests,
        averageSecurityOverhead: this.metrics.requestMetrics.averageSecurityOverhead,
        slowRequestsCount: this.metrics.requestMetrics.slowRequests,
        slowRequestsPercentage: this.metrics.requestMetrics.totalRequests > 0 ? 
          (this.metrics.requestMetrics.slowRequests / this.metrics.requestMetrics.totalRequests) * 100 : 0
      },
      systemMetrics: {
        memory: {
          current: this.metrics.memoryUsage.current,
          peak: this.metrics.memoryUsage.peak,
          trend: this.calculateTrend(this.metrics.memoryUsage.history)
        },
        cpu: {
          current: this.metrics.cpuUsage.current,
          trend: this.calculateTrend(this.metrics.cpuUsage.history)
        }
      },
      componentMetrics: {
        rateLimiter: rateLimiterMetrics,
        tokenRevocation: tokenRevocationMetrics,
        validation: validationMetrics
      },
      alerts: {
        recent: this.metrics.alerts.slice(-10), // Last 10 alerts
        summary: this.getAlertSummary()
      },
      recommendations: this.generateRecommendations()
    };
  }

  // Calculate trend for metrics
  calculateTrend(history) {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-10); // Last 10 readings
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  // Get alert summary
  getAlertSummary() {
    const summary = {};
    for (const alert of this.metrics.alerts) {
      summary[alert.type] = (summary[alert.type] || 0) + 1;
    }
    return summary;
  }

  // Generate performance recommendations
  generateRecommendations() {
    const recommendations = [];
    const rateLimiterMetrics = getRateLimiterMetrics();
    const tokenRevocationMetrics = getTokenRevocationMetrics();
    const validationMetrics = getValidationMetrics();

    // Memory recommendations
    if (this.metrics.memoryUsage.current > 300) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: 'Consider implementing memory optimization strategies or increasing available memory'
      });
    }

    // Arcjet rate limiter recommendations
    if (rateLimiterMetrics.averageProcessingTime > 10) {
      recommendations.push({
        type: 'rate-limiter',
        priority: 'high',
        message: 'Arcjet rate limiter processing time is high. Check network connectivity to Arcjet service'
      });
    }

    // Arcjet-specific recommendations
    if (rateLimiterMetrics.blockRate > 20) {
      recommendations.push({
        type: 'rate-limiter',
        priority: 'medium',
        message: 'High block rate detected. Consider adjusting Arcjet rate limiting rules or investigating potential attacks'
      });
    }

    if (rateLimiterMetrics.arcjetDecisions.ERROR > 0) {
      recommendations.push({
        type: 'rate-limiter',
        priority: 'high',
        message: 'Arcjet errors detected. Check API key configuration and network connectivity'
      });
    }

    // Token revocation recommendations
    if (tokenRevocationMetrics.averageCheckTime > 5) {
      recommendations.push({
        type: 'token-revocation',
        priority: 'medium',
        message: 'Token revocation checks are slow. Consider implementing Redis for distributed caching'
      });
    }

    // Validation recommendations
    if (validationMetrics.averageValidationTime > 10) {
      recommendations.push({
        type: 'validation',
        priority: 'medium',
        message: 'Validation processing is slow. Consider pre-compiling schemas or using a faster validation library'
      });
    }

    return recommendations;
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }

  // Update thresholds
  updateThresholds(newThresholds) {
    this.metrics.thresholds = { ...this.metrics.thresholds, ...newThresholds };
  }
}

// Create singleton instance
const securityMonitor = new SecurityPerformanceMonitor();

// Middleware to measure security processing time
export const securityPerformanceMiddleware = (req, res, next) => {
  const startMark = `security-start-${Date.now()}-${Math.random()}`;
  const endMark = `security-end-${Date.now()}-${Math.random()}`;
  const measureName = `security-processing-${Date.now()}-${Math.random()}`;
  
  performance.mark(startMark);
  
  // Wrap the response end to measure total security processing time
  const originalEnd = res.end;
  res.end = function(...args) {
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    // Clean up marks
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// Export functions
export const getSecurityPerformanceReport = () => {
  return securityMonitor.getPerformanceReport();
};

export const updatePerformanceThresholds = (thresholds) => {
  securityMonitor.updateThresholds(thresholds);
};

// Graceful shutdown
process.on('SIGTERM', () => {
  securityMonitor.stopMonitoring();
});

process.on('SIGINT', () => {
  securityMonitor.stopMonitoring();
});