import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";

const Dashboard = ({ token }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(null);
  const [lastFetchAttempt, setLastFetchAttempt] = useState(null);

  // Refs for cleanup
  const timeoutIds = useRef([]);
  const abortController = useRef(null);
  const isMounted = useRef(true);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  const fetchDashboardData = async (attempt = 0) => {
    try {
      if (!token) {
        console.log('📋 Dashboard: No token available, skipping fetch');
        if (isMounted.current) setIsLoading(false);
        return;
      }
      
      // Validate backend URL
      if (!backendUrl) {
        console.error('❌ Dashboard: Backend URL not configured');
        if (isMounted.current) {
          setError('Backend URL not configured. Please check environment settings.');
          toast.error('Backend URL not configured');
          setIsLoading(false);
        }
        return;
      }
      
      const now = Date.now();
      if (isMounted.current) setLastFetchAttempt(now);
      
      console.log(`🔄 Dashboard: Fetch attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
      console.log(`📡 Dashboard: Using backend URL: ${backendUrl}/api/dashboard/stats`);
      console.log(`🔑 Dashboard: Token present:`, !!token);
      
      if (isMounted.current) {
        setIsLoading(true);
        setError(null);
      }
      
      // Test backend connectivity first (only on first attempt)
      if (attempt === 0) {
        try {
          console.log('🔗 Dashboard: Testing backend connectivity...');
          const healthCheck = await axios.get(
            backendUrl + "/api/health",
            { 
              timeout: 5000,
              headers: { 
                'Authorization': `Bearer ${token}`,
                'token': token // Keep legacy header for backward compatibility
              }
            }
          );
          console.log('✅ Dashboard: Backend connectivity verified', healthCheck.data);
        } catch (healthError) {
          console.warn('⚠️ Dashboard: Health check failed, proceeding anyway:', healthError.message);
          // Continue with dashboard request even if health check fails
        }
      }
      
      // Create new abort controller for this request
      abortController.current = new AbortController();
      const timeoutId = setTimeout(() => abortController.current?.abort(), 10000); // 10 second timeout
      timeoutIds.current.push(timeoutId);
      
      try {
        // Fetch dashboard stats from dedicated API
        const dashboardRes = await axios.get(
          backendUrl + "/api/dashboard/stats",
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'token': token // Keep legacy header for backward compatibility
            },
            signal: abortController.current.signal,
            timeout: 10000
          }
        );
        
        // Clear timeout on successful response
        clearTimeout(timeoutId);
        timeoutIds.current = timeoutIds.current.filter(id => id !== timeoutId);
        
        console.log('✅ Dashboard: API response received', {
          status: dashboardRes.status,
          success: dashboardRes.data.success,
          hasStats: !!dashboardRes.data.stats
        });

        if (dashboardRes.data.success) {
          const data = dashboardRes.data.stats;
          
          // Guard setState calls with isMounted check
          if (isMounted.current) {
            setStats({
              totalProducts: data.totalProducts,
              totalOrders: data.totalOrders,
              totalCustomers: data.totalUsers,
              totalRevenue: data.totalRevenue,
              recentOrders: data.recentOrders,
              topProducts: data.topProducts,
              // Add trend data
              revenueTrend: data.revenueTrend,
              ordersTrend: data.ordersTrend,
              customersTrend: data.customersTrend,
              ordersByStatus: data.ordersByStatus,
              currentMonthRevenue: data.currentMonthRevenue,
              lastMonthRevenue: data.lastMonthRevenue
            });
            
            setRetryCount(0); // Reset retry count on success
          }
          
          console.log('✅ Dashboard: Data fetched successfully');
        } else {
          throw new Error(dashboardRes.data.message || 'API returned success: false');
        }
        
      } catch (fetchError) {
        // Clear timeout on error
        clearTimeout(timeoutId);
        timeoutIds.current = timeoutIds.current.filter(id => id !== timeoutId);
        throw fetchError;
      }
      
    } catch (error) {
      console.error('❌ Dashboard fetch error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        attempt: attempt + 1,
        isTimeout: error.name === 'AbortError' || error.code === 'ECONNABORTED'
      });
      
      // Handle specific error types
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('❌ Dashboard: Authentication/Authorization failed');
        if (isMounted.current) {
          toast.error("Session expired or insufficient permissions. Please login again.");
          setError('Authentication failed. Please login again.');
        }
        return;
      }
      
      if (error.response?.status === 404) {
        console.error('❌ Dashboard: API endpoint not found');
        console.error('❌ Dashboard: Full URL attempted:', backendUrl + "/api/dashboard/stats");
        console.error('❌ Dashboard: Response data:', error.response?.data);
        console.error('❌ Dashboard: Available routes might be:', {
          'Expected': '/api/dashboard/stats',
          'Backend URL': backendUrl,
          'Full URL': backendUrl + "/api/dashboard/stats"
        });
        
        // Check if this might be an auth/CORS issue
        if (isMounted.current) {
          const errorMsg = "Dashboard API endpoint not found. This might be due to:";
          const suggestions = [
            "1. Authentication/Authorization failure (check admin token)",
            "2. CORS configuration issues (check allowed origins)",
            "3. Backend route mounting problems",
            "4. Network connectivity issues"
          ];
          setError(errorMsg + "\n" + suggestions.join("\n"));
        }
      }
      
      if (error.response?.status >= 500) {
        console.error('❌ Dashboard: Server error');
        if (isMounted.current) {
          setError('Server error. The backend may be experiencing issues.');
        }
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.error('❌ Dashboard: Connection error - backend may be down');
        if (isMounted.current) {
          setError('Cannot connect to backend server. Please check if the server is running.');
        }
      }
      
      // Implement exponential backoff retry logic
      if (attempt < MAX_RETRIES && isMounted.current) {
        const nextAttempt = attempt + 1;
        const delay = RETRY_DELAY * Math.pow(1.5, attempt); // Exponential backoff
        
        console.log(`⏳ Dashboard: Retrying in ${delay}ms (attempt ${nextAttempt}/${MAX_RETRIES + 1})`);
        setRetryCount(nextAttempt);
        
        const retryTimeoutId = setTimeout(() => {
          if (isMounted.current) {
            fetchDashboardData(nextAttempt);
          }
        }, delay);
        
        timeoutIds.current.push(retryTimeoutId);
        return;
      }
      
      // Max retries reached
      console.error('❌ Dashboard: Max retries reached, giving up');
      
      if (isMounted.current) {
        setRetryCount(0);
        
        // Set fallback stats on final failure
        setStats({
          totalProducts: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalRevenue: 0,
          recentOrders: [],
          topProducts: [],
          revenueTrend: 0,
          ordersTrend: 0,
          customersTrend: 0,
          ordersByStatus: {},
          currentMonthRevenue: 0,
          lastMonthRevenue: 0
        });
        
        const errorMessage = error.response?.status === 404 
          ? "Dashboard API endpoint not found. Please check backend configuration and route mounting."
          : error.response?.status >= 500
          ? "Server error. The backend may be experiencing issues."
          : error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND'
          ? "Cannot connect to backend server. Please check if the server is running."
          : error.name === 'AbortError' || error.code === 'ECONNABORTED'
          ? "Request timed out. Please check your connection and try again."
          : `Failed to fetch dashboard data: ${error.message}. Please try again later.`;
        
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // Only fetch data when token is available
    if (token) {
      console.log('📋 Dashboard: Token available, fetching data...');
      fetchDashboardData();
    } else {
      console.log('📋 Dashboard: Waiting for token...');
      if (isMounted.current) setIsLoading(false);
    }
    
    // Cleanup function
    return () => {
      console.log('🧹 Dashboard: Cleaning up on unmount');
      isMounted.current = false;
      
      // Clear all pending timeouts
      timeoutIds.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutIds.current = [];
      
      // Abort any in-flight request
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [token]);

  const StatCard = ({ title, value, icon, color, trend }) => (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-white text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <p className="text-white/80 text-sm mt-1">
              <span className="text-green-300">↗ {trend}%</span> from last month
            </p>
          )}
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {retryCount > 0 ? `Retrying... (${retryCount}/${MAX_RETRIES})` : 'Loading dashboard...'}
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Attempting to connect to backend...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😵</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setError(null);
                setRetryCount(0);
                fetchDashboardData();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <div className="text-xs text-gray-500">
              <p>Backend URL: {backendUrl}</p>
              <p>Last attempt: {lastFetchAttempt ? new Date(lastFetchAttempt).toLocaleTimeString() : 'Never'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon="📦"
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon="🛒"
          color="from-green-500 to-green-600"
          trend={stats.ordersTrend}
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          icon="👥"
          color="from-purple-500 to-purple-600"
          trend={stats.customersTrend}
        />
        <StatCard
          title="Revenue"
          value={`${currency}${stats.totalRevenue.toFixed(2)}`}
          icon="💰"
          color="from-yellow-500 to-orange-500"
          trend={stats.revenueTrend}
        />
      </div>

      {/* Orders by Status */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📊</span>
          Orders by Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.ordersByStatus || {}).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <p className="text-sm text-gray-600 capitalize">{status.replace(/([A-Z])/g, ' $1').trim()}</p>
            </div>
          ))}
          {Object.keys(stats.ordersByStatus || {}).length === 0 && (
            <div className="col-span-full text-center py-4">
              <p className="text-gray-500">No order data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📋</span>
            Recent Orders
          </h2>
          <div className="space-y-4">
            {stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order, index) => (
                <div key={order._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {order.customerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.itemCount} items • {new Date(order.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.paymentMethod} • {order.paymentStatus}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{currency}{order.total.toFixed(2)}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'Placed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-500">No recent orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🏆</span>
            Top Products
          </h2>
          <div className="space-y-4">
            {stats.topProducts.length > 0 ? (
              stats.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-500">{currency}{product.totalRevenue?.toFixed(2) || '0.00'} revenue</p>
                  </div>
                  </div>
                  <p className="text-gray-600 font-medium">{product.totalSold} sold</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-gray-500">No product sales data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">⚡</span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/add')}
            className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="font-semibold">Add Product</div>
          </button>
          <button 
            onClick={() => navigate('/order')}
            className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="font-semibold">Manage Orders</div>
          </button>
          <button 
            onClick={() => navigate('/customers')}
            className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-semibold">View Customers</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;