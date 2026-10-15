import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { backendUrl, currency } from "../../../App";
import { toast } from "react-toastify";

const CustomerDetails = ({ token }) => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomerDetails = async () => {
    try {
      setIsLoading(true);
      
      // Fetch customer details and all orders
      const [customerResponse, ordersResponse] = await Promise.all([
        axios.get(
          `${backendUrl}/api/customers/${customerId}`,
          { headers: { token } }
        ),
        axios.get(
          `${backendUrl}/api/customers/${customerId}/orders`,
          { headers: { token } }
        )
      ]);

      if (customerResponse.data.success) {
        setCustomer(customerResponse.data.customer);
        setStatistics(customerResponse.data.statistics);
        
        // Use all orders from the dedicated endpoint, already sorted latest to oldest
        if (ordersResponse.data.success) {
          setRecentOrders(ordersResponse.data.orders || []);
        } else {
          // Fallback to recent orders from customer details if orders endpoint fails
          setRecentOrders(customerResponse.data.recentOrders || []);
        }
      } else {
        toast.error(customerResponse.data.message || "Failed to fetch customer details");
        navigate('/customers');
      }
    } catch (error) {
      console.error('Fetch customer details error:', error);
      toast.error("Failed to fetch customer details");
      navigate('/customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (customerId && token) {
      fetchCustomerDetails();
    }
  }, [customerId, token]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'placed':
        return 'bg-blue-100 text-blue-800';
      case 'packed':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'outfordelivery':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'pendingverification':
        return 'bg-orange-100 text-orange-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Customer not found</h3>
        <button
          onClick={() => navigate('/customers')}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/customers')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              ←
            </button>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {(customer.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{customer.name || 'Unknown Customer'}</h1>
              <p className="text-gray-600">{customer.email || 'No email provided'}</p>
              <p className="text-sm text-gray-500">
                Customer since {customer.joinDate ? new Date(customer.joinDate).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {customer.status === 'active' ? 'Active' : customer.status}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{statistics?.totalOrders || 0}</p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Spent</p>
              <p className="text-3xl font-bold text-gray-900">{currency}{statistics?.totalSpent?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Order Value</p>
              <p className="text-3xl font-bold text-gray-900">{currency}{statistics?.averageOrderValue || 0}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Profile Complete</p>
              <p className="text-3xl font-bold text-gray-900">{customer.profileCompletion || 0}%</p>
            </div>
            <div className="text-3xl">👤</div>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <div className="flex items-center space-x-2">
                <p className="font-medium">{customer.email || 'Not provided'}</p>
                {customer.isEmailVerified && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{customer.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Addresses</p>
              <p className="font-medium">{customer.addressCount || 0} saved addresses</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Wishlist Items</p>
              <p className="font-medium">{customer.wishlistCount || 0} items</p>
            </div>
          </div>
        </div>

        {/* Order Statistics */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Statistics</h3>
          <div className="space-y-3">
            {statistics?.ordersByStatus && Object.entries(statistics.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {status}
                </span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
            {(!statistics?.ordersByStatus || Object.keys(statistics.ordersByStatus).length === 0) && (
              <p className="text-gray-500 text-sm">No orders yet</p>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Email Notifications</span>
              <span className="font-medium">
                {customer.preferences?.notifications ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Newsletter</span>
              <span className="font-medium">
                {customer.preferences?.newsletter ? 'Subscribed' : 'Not subscribed'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Theme</span>
              <span className="font-medium">
                {customer.preferences?.theme || 'Default'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* All Orders */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Orders ({recentOrders.length})</h3>
          <p className="text-sm text-gray-500 mt-1">Latest to oldest order history</p>
        </div>
        
        {recentOrders.length > 0 ? (
          <div className="space-y-4 p-6">
            {recentOrders.map((order) => (
              <div 
                key={order._id}
                className="bg-gray-50 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100"
              >
                {/* Order Header */}
                <div className="p-4 bg-white border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        📦
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          Order #{order._id.slice(-8)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()} • {order.itemCount} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {currency}{order.total?.toFixed(2) || '0.00'}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.order_status)}`}>
                          {order.order_status || 'Unknown'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payment Info */}
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">Payment Details</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Method:</span>
                          <span className="font-medium">{order.payment_method || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                            {order.payment_status || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">Order Timeline</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Placed:</span>
                          <span className="font-medium">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time:</span>
                          <span className="font-medium">
                            {new Date(order.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500">This customer hasn't placed any orders</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetails;