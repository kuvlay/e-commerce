import React from 'react';
import { FaExclamationTriangle, FaRedo, FaBug, FaHome } from 'react-icons/fa';
import { COLORS, GRADIENTS } from '../constants/theme';
import errorMonitor, { ERROR_SEVERITY, ERROR_CATEGORIES } from '../utils/errorMonitoring';

/**
 * Comprehensive Error Boundary with enhanced error handling and reporting
 */
class ComprehensiveErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      errorId: null,
      errorTimestamp: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      errorTimestamp: new Date().toISOString()
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorDetails = {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.props.userId || 'anonymous',
      componentName: this.props.componentName || 'Unknown'
    };

    console.error('ComprehensiveErrorBoundary - Error caught:', errorDetails);
    
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Report to error monitoring service
    if (this.props.onError) {
      this.props.onError(errorDetails);
    }

    // Report to centralized error monitoring
    errorMonitor.captureError(
      error,
      {
        ...errorDetails,
        component: this.props.componentName,
        boundary: 'ComprehensiveErrorBoundary'
      },
      ERROR_SEVERITY.HIGH,
      ERROR_CATEGORIES.COMPONENT
    );
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };  ha
ndleReportBug = () => {
    const errorReport = {
      errorId: this.state.errorId,
      timestamp: this.state.errorTimestamp,
      error: this.state.error?.toString(),
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Copy error report to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard. Please share this with support.');
      })
      .catch(() => {
        console.log('Error report:', errorReport);
        alert('Error report logged to console. Please check browser console.');
      });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry, this.state);
      }

      // Enhanced default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="text-center mb-6">
              <FaExclamationTriangle className="mx-auto text-red-500 text-5xl mb-4" />
              <h2 className="text-2xl font-bold text-red-800 mb-2">
                {this.props.title || 'Component Error'}
              </h2>
              <p className="text-red-600 mb-4">
                {this.props.message || 'A component failed to render properly.'}
              </p>
              
              {this.props.componentName && (
                <div className="bg-red-100 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">
                    <strong>Component:</strong> {this.props.componentName}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              )}
            </div>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-red-800 mb-2">
                    🐛 Error Details (Development)
                  </summary>
                  <div className="text-red-700 font-mono text-xs whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.error.stack && (
                      <div className="mb-2">
                        <strong>Stack:</strong> {this.state.error.stack}
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong> {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:opacity-50"
                disabled={this.state.retryCount >= 3}
              >
                <FaRedo className={this.state.retryCount >= 3 ? '' : 'animate-spin'} />
                {this.state.retryCount >= 3 ? 'Max retries reached' : `Try Again (${3 - this.state.retryCount} left)`}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={this.handleReportBug}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  <FaBug />
                  Report Bug
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <FaHome />
                  Go Home
                </button>
              </div>
            </div>

            {this.state.retryCount >= 3 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700 text-center">
                  This component has failed multiple times. Please refresh the page or contact support.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComprehensiveErrorBoundary;