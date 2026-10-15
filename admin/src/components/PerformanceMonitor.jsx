/**
 * Performance monitoring component for admin interface
 * Tracks page load times, API response times, and user interactions
 */

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const PerformanceMonitor = ({ 
  enabled = true, 
  showNotifications = false,
  thresholds = {
    slow: 2000,
    verySlow: 5000,
    critical: 10000
  }
}) => {
  const [metrics, setMetrics] = useState({
    pageLoadTime: 0,
    apiCalls: [],
    userInteractions: [],
    memoryUsage: null,
    connectionType: null
  });

  useEffect(() => {
    if (!enabled) return;

    // Monitor page load performance
    const measurePageLoad = () => {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        
        setMetrics(prev => ({
          ...prev,
          pageLoadTime
        }));

        // Show notification for slow page loads
        if (showNotifications && pageLoadTime > thresholds.slow) {
          const severity = pageLoadTime > thresholds.critical ? 'critical' : 
                          pageLoadTime > thresholds.verySlow ? 'very slow' : 'slow';
          
          toast.warn(`⏰ ${severity.toUpperCase()} page load: ${pageLoadTime}ms`, {
            duration: 4000
          });
        }

        console.log(`📊 Page load performance: ${pageLoadTime}ms`);
      }
    };

    // Monitor memory usage
    const measureMemoryUsage = () => {
      if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
          }
        }));
      }
    };

    // Monitor connection type
    const measureConnection = () => {
      if (navigator.connection) {
        setMetrics(prev => ({
          ...prev,
          connectionType: {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData
          }
        }));
      }
    };

    // Initial measurements
    setTimeout(measurePageLoad, 100);
    measureMemoryUsage();
    measureConnection();

    // Periodic memory monitoring
    const memoryInterval = setInterval(measureMemoryUsage, 30000); // Every 30 seconds

    // Monitor connection changes
    const handleConnectionChange = () => {
      measureConnection();
      console.log('📡 Connection type changed:', navigator.connection?.effectiveType);
    };

    if (navigator.connection) {
      navigator.connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      clearInterval(memoryInterval);
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [enabled, showNotifications, thresholds]);

  // API call monitoring hook
  const trackApiCall = (url, method, startTime, endTime, success, error = null) => {
    if (!enabled) return;

    const duration = endTime - startTime;
    const apiCall = {
      url,
      method,
      duration,
      success,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    };

    setMetrics(prev => ({
      ...prev,
      apiCalls: [...prev.apiCalls.slice(-49), apiCall] // Keep last 50 calls
    }));

    // Show notification for slow API calls
    if (showNotifications && duration > thresholds.slow) {
      const severity = duration > thresholds.critical ? 'critical' : 
                      duration > thresholds.verySlow ? 'very slow' : 'slow';
      
      toast.warn(`🐌 ${severity.toUpperCase()} API call: ${method} ${url} (${duration}ms)`, {
        duration: 4000
      });
    }

    console.log(`📡 API call performance: ${method} ${url} - ${duration}ms ${success ? '✅' : '❌'}`);
  };

  // User interaction monitoring
  const trackUserInteraction = (action, element, duration = null) => {
    if (!enabled) return;

    const interaction = {
      action,
      element,
      duration,
      timestamp: new Date().toISOString()
    };

    setMetrics(prev => ({
      ...prev,
      userInteractions: [...prev.userInteractions.slice(-99), interaction] // Keep last 100 interactions
    }));

    if (duration && duration > 1000) {
      console.log(`🖱️ Slow user interaction: ${action} on ${element} took ${duration}ms`);
    }
  };

  // Performance summary
  const getPerformanceSummary = () => {
    const recentApiCalls = metrics.apiCalls.slice(-10);
    const avgApiTime = recentApiCalls.length > 0 
      ? recentApiCalls.reduce((sum, call) => sum + call.duration, 0) / recentApiCalls.length 
      : 0;
    
    const slowApiCalls = recentApiCalls.filter(call => call.duration > thresholds.slow).length;
    const failedApiCalls = recentApiCalls.filter(call => !call.success).length;

    return {
      pageLoadTime: metrics.pageLoadTime,
      avgApiResponseTime: Math.round(avgApiTime),
      slowApiCalls,
      failedApiCalls,
      totalApiCalls: recentApiCalls.length,
      memoryUsage: metrics.memoryUsage,
      connectionType: metrics.connectionType?.effectiveType || 'unknown',
      userInteractions: metrics.userInteractions.length
    };
  };

  // Export performance data
  const exportPerformanceData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      summary: getPerformanceSummary(),
      detailedMetrics: metrics,
      browserInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      },
      pageInfo: {
        url: window.location.href,
        referrer: document.referrer,
        title: document.title
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('📊 Performance data exported successfully!');
  };

  // Expose methods globally for use in other components
  useEffect(() => {
    if (enabled) {
      window.performanceMonitor = {
        trackApiCall,
        trackUserInteraction,
        getPerformanceSummary,
        exportPerformanceData,
        metrics
      };
    }

    return () => {
      if (window.performanceMonitor) {
        delete window.performanceMonitor;
      }
    };
  }, [enabled, metrics]);

  // Development mode performance display
  if (process.env.NODE_ENV === 'development' && enabled) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px'
      }}>
        <div><strong>Performance Monitor</strong></div>
        <div>Page Load: {metrics.pageLoadTime}ms</div>
        <div>API Calls: {metrics.apiCalls.length}</div>
        {metrics.memoryUsage && (
          <div>Memory: {metrics.memoryUsage.used}MB / {metrics.memoryUsage.total}MB</div>
        )}
        {metrics.connectionType && (
          <div>Connection: {metrics.connectionType.effectiveType}</div>
        )}
        <button 
          onClick={exportPerformanceData}
          style={{
            marginTop: '5px',
            padding: '2px 5px',
            fontSize: '10px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Export Data
        </button>
      </div>
    );
  }

  return null;
};

export default PerformanceMonitor;