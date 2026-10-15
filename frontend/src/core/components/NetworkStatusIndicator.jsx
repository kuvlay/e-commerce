import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Network status indicator component
 * Shows connection status and provides retry functionality
 */
const NetworkStatusIndicator = ({ position = 'bottom-left' }) => {
  const { isOnline, backendStatus, testBackendConnection, isDisconnected } = useNetworkStatus();

  // Don't show anything if everything is working fine
  if (isOnline && backendStatus === 'online') {
    return null;
  }

  const handleRetry = () => {
    testBackendConnection();
  };

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        message: 'No internet connection',
        icon: '📵',
        color: 'bg-red-500',
        canRetry: false
      };
    }
    
    if (backendStatus === 'offline') {
      return {
        message: 'Server unavailable',
        icon: '🔌',
        color: 'bg-yellow-500',
        canRetry: true
      };
    }
    
    return {
      message: 'Checking connection...',
      icon: '🔄',
      color: 'bg-blue-500',
      canRetry: false
    };
  };

  const status = getStatusInfo();
  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4'
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 max-w-sm`}
      role="alert"
    >
      <div className={`${status.color} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
        <span className="text-lg" role="img" aria-label="Status icon">
          {status.icon}
        </span>
        
        <div className="flex-1">
          <p className="text-sm font-medium">
            {status.message}
          </p>
          {status.canRetry && (
            <p className="text-xs opacity-90 mt-1">
              Some features may be limited
            </p>
          )}
        </div>
        
        {status.canRetry && (
          <button
            onClick={handleRetry}
            className="text-white hover:bg-white hover:bg-opacity-20 px-2 py-1 rounded text-xs font-medium transition-colors duration-200"
            aria-label="Retry connection"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default NetworkStatusIndicator;