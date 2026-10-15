import { useState, useEffect } from 'react';
import apiClient, { TIMEOUTS } from '../utils/apiClient';

/**
 * Custom hook to monitor network status and provide offline/online detection
 * Also tracks backend connection status with retry mechanism
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = useState('unknown'); // 'online', 'offline', 'unknown'
  const [lastChecked, setLastChecked] = useState(Date.now());

  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('📶 Network: Back online');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('📵 Network: Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Test backend connectivity
  const testBackendConnection = async (silent = false) => {
    if (!isOnline) {
      setBackendStatus('offline');
      return false;
    }

    try {
      const response = await apiClient.get('/api/test', {
        timeout: TIMEOUTS.fast,
      });

      if (response.status === 200 && response.data?.success) {
        setBackendStatus('online');
        setLastChecked(Date.now());
        if (!silent) console.log('✅ Backend: Connected');
        return true;
      } else {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
    } catch (error) {
      setBackendStatus('offline');
      setLastChecked(Date.now());

      if (error.code === 'ECONNABORTED') {
        if (!silent) console.log('⏰ Backend: Connection timeout (may be sleeping on Render)');
      } else {
        if (!silent) console.log('❌ Backend: Connection failed -', error.message);
      }

      return false;
    }
  };

  // Periodic backend health check (every 30 seconds when online)
  useEffect(() => {
    if (!isOnline) return;

    // Initial test
    testBackendConnection(true);

    const interval = setInterval(() => {
      testBackendConnection(true);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline]);

  // Retry mechanism for failed requests
  const retryWithBackoff = async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries} in ${backoffDelay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  };

  return {
    isOnline,
    backendStatus,
    lastChecked,
    testBackendConnection,
    retryWithBackoff,
    // Helper methods
    isConnected: isOnline && backendStatus === 'online',
    isDisconnected: !isOnline || backendStatus === 'offline',
    needsRetry: backendStatus === 'offline' && isOnline
  };
};

export default useNetworkStatus;