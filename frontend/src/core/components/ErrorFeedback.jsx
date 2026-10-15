import React from 'react';
import { 
  FaExclamationTriangle, 
  FaRedo, 
  FaWifi, 
  FaServer, 
  FaLock,
  FaHome,
  FaBug,
  FaInfoCircle
} from 'react-icons/fa';
import { COLORS, GRADIENTS } from '../constants/theme';

/**
 * Network error feedback component
 */
export const NetworkErrorFeedback = ({ onRetry, error }) => (
  <div className="min-h-[400px] flex items-center justify-center p-6">
    <div className="max-w-md w-full text-center">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <FaWifi className="text-red-500 text-2xl" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Connection Problem</h3>
        <p className="text-gray-600 mb-4">
          Unable to connect to our servers. Please check your internet connection and try again.
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error.message || 'Network request failed'}
            </p>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-6 py-3 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
            style={{ background: GRADIENTS.primary }}
          >
            <FaRedo />
            Try Again
          </button>
        )}
        
        <button
          onClick={() => window.location.reload()}
          className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  </div>
);

/**
 * Server error feedback component
 */
export const ServerErrorFeedback = ({ onRetry, statusCode = 500 }) => (
  <div className="min-h-[400px] flex items-center justify-center p-6">
    <div className="max-w-md w-full text-center">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
          <FaServer className="text-orange-500 text-2xl" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Server Error</h3>
        <p className="text-gray-600 mb-4">
          Our servers are experiencing issues. Please try again in a few moments.
        </p>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-orange-700">
            <strong>Status Code:</strong> {statusCode}
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-6 py-3 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
            style={{ background: GRADIENTS.primary }}
          >
            <FaRedo />
            Try Again
          </button>
        )}
        
        <button
          onClick={() => window.location.href = '/'}
          className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <FaHome />
          Go Home
        </button>
      </div>
    </div>
  </div>
);

/**
 * Authentication error feedback component
 */
export const AuthErrorFeedback = ({ onLogin }) => (
  <div className="min-h-[400px] flex items-center justify-center p-6">
    <div className="max-w-md w-full text-center">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <FaLock className="text-blue-500 text-2xl" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Authentication Required</h3>
        <p className="text-gray-600 mb-4">
          You need to be logged in to access this content. Please sign in to continue.
        </p>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={onLogin || (() => window.location.href = '/login')}
          className="w-full px-6 py-3 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105"
          style={{ background: GRADIENTS.primary }}
        >
          Sign In
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
);

/**
 * Data validation error feedback component
 */
export const ValidationErrorFeedback = ({ 
  errors = [], 
  onRetry, 
  title = 'Data Validation Error' 
}) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
    <div className="flex items-start gap-4">
      <FaExclamationTriangle className="text-yellow-600 text-xl mt-1 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">{title}</h3>
        <p className="text-yellow-700 text-sm mb-3">
          Some data could not be processed correctly. This might affect the display of certain items.
        </p>
        
        {errors.length > 0 && (
          <div className="bg-yellow-100 rounded-lg p-3 mb-3">
            <h4 className="font-medium text-yellow-800 text-sm mb-2">Issues found:</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              {errors.slice(0, 5).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
              {errors.length > 5 && (
                <li>• ... and {errors.length - 5} more issues</li>
              )}
            </ul>
          </div>
        )}
        
        <div className="flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Retry
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Generic error feedback component
 */
export const GenericErrorFeedback = ({ 
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  showBugReport = false,
  error = null
}) => (
  <div className="min-h-[300px] flex items-center justify-center p-6">
    <div className="max-w-md w-full text-center">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <FaExclamationTriangle className="text-red-500 text-2xl" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        
        {error && process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-red-800 mb-2">
                Error Details (Development)
              </summary>
              <div className="text-red-700 font-mono text-xs whitespace-pre-wrap break-all">
                {error.toString()}
              </div>
            </details>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-6 py-3 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
            style={{ background: GRADIENTS.primary }}
          >
            <FaRedo />
            Try Again
          </button>
        )}
        
        <div className="flex gap-2">
          {showBugReport && (
            <button
              onClick={() => {
                const report = {
                  error: error?.toString(),
                  timestamp: new Date().toISOString(),
                  url: window.location.href,
                  userAgent: navigator.userAgent
                };
                navigator.clipboard.writeText(JSON.stringify(report, null, 2));
                alert('Error report copied to clipboard');
              }}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <FaBug />
              Report Bug
            </button>
          )}
          
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <FaHome />
            Go Home
          </button>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Inline error message component
 */
export const InlineError = ({ message, onDismiss }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
    <div className="flex items-start gap-3">
      <FaExclamationTriangle className="text-red-500 text-sm mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-red-700">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 text-sm"
        >
          ✕
        </button>
      )}
    </div>
  </div>
);

/**
 * Success feedback component
 */
export const SuccessFeedback = ({ message, onDismiss }) => (
  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
    <div className="flex items-start gap-3">
      <FaInfoCircle className="text-green-500 text-sm mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-green-700">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-400 hover:text-green-600 text-sm"
        >
          ✕
        </button>
      )}
    </div>
  </div>
);
