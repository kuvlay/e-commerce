import React from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Report error to monitoring service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <div className="mb-4">
              <FaExclamationTriangle className="mx-auto text-red-500 text-4xl mb-3" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                {this.props.title || 'Something went wrong'}
              </h2>
              <p className="text-red-600 text-sm mb-4">
                {this.props.message || 'An unexpected error occurred while loading this content.'}
              </p>
            </div>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-left">
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium text-red-800 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="text-red-700 font-mono whitespace-pre-wrap break-all">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </div>
                </details>
              </div>
            )}

            {/* Retry button */}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
              disabled={this.state.retryCount >= 3}
            >
              <FaRedo className={this.state.retryCount >= 3 ? '' : 'animate-spin'} />
              {this.state.retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
            </button>

            {this.state.retryCount >= 3 && (
              <p className="text-xs text-red-500 mt-2">
                Please refresh the page or contact support if the problem persists.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook for error boundary functionality in functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error) => {
    console.error('Error captured by useErrorHandler:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

export default ErrorBoundary;