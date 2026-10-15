import React, { useState, useEffect } from 'react';

// Simple cache stats from global cache
const getGlobalCacheStats = () => {
  if (typeof window !== 'undefined' && window.globalCache) {
    const cache = window.globalCache;
    const stats = { totalItems: 0, items: {} };

    Object.keys(cache).forEach(key => {
      if (cache[key].data) {
        stats.totalItems++;
        stats.items[key] = {
          size: JSON.stringify(cache[key].data).length,
          expiresIn: Math.max(0, (cache[key].timestamp + 5 * 60 * 1000) - Date.now()),
          age: Date.now() - cache[key].timestamp
        };
      }
    });
    return stats;
  }
  return { totalItems: 0, items: {} };
};

const CacheStatus = () => {
  const [stats, setStats] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(getGlobalCacheStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, []);

  // Only show in development with debug flag
  if (import.meta.env.PROD || !window.location.search.includes('debug')) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`text-white px-3 py-1 rounded-full text-xs transition-colors ${
          stats?.totalItems > 0 
            ? 'bg-green-500 hover:bg-green-600 animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {stats?.totalItems > 0 ? '⚡ Cached' : 'No Cache'} ({stats?.totalItems || 0})
      </button>
      
      {isVisible && stats && (
        <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-64 max-h-64 overflow-auto">
          <h3 className="font-bold text-sm mb-2">Cache Status</h3>
          <div className="text-xs space-y-1">
            <div>Total Items: {stats.totalItems}</div>
            {Object.entries(stats.items).map(([key, item]) => (
              <div key={key} className="border-t pt-1">
                <div className="font-medium">{key}</div>
                <div>Size: {(item.size / 1024).toFixed(1)}KB</div>
                <div>Expires: {Math.round(item.expiresIn / 1000)}s</div>
                <div>Age: {Math.round(item.age / 1000)}s</div>
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => {
                if (window.globalCache) {
                  Object.keys(window.globalCache).forEach(key => {
                    window.globalCache[key] = { data: null, timestamp: 0 };
                  });
                  setStats(getGlobalCacheStats());
                }
              }}
              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
            >
              Clear
            </button>
            <button
              onClick={() => {
                console.log('🔍 Global Cache Debug:', window.globalCache);
                setStats(getGlobalCacheStats());
              }}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
            >
              Debug
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheStatus;