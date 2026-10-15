import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { backendUrl } from "../../../App";
import { toast } from "react-toastify";

const Customers = ({ token }) => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      
      if (!token) {
        console.log('👥 Customers: No token available');
        toast.error('Admin session expired. Please login again.');
        setIsLoading(false);
        return;
      }
      
      if (!backendUrl) {
        console.error('❌ Customers: Backend URL not configured');
        toast.error('Backend URL not configured');
        setIsLoading(false);
        return;
      }
      
      const endpoint = backendUrl + "/api/customers/list";
      console.log('👥 Customers: Fetching from:', endpoint);
      console.log('🔑 Customers: Token present:', !!token);
      
      // Fetch customers from dedicated API
      const customersRes = await axios.get(endpoint, { 
        headers: { token },
        timeout: 10000
      });
      
      console.log('👥 Customers: API response:', {
        status: customersRes.status,
        success: customersRes.data.success,
        customersCount: customersRes.data.customers?.length || 0,
        hasCustomers: !!customersRes.data.customers
      });

      if (customersRes.data.success) {
        const customersData = customersRes.data.customers || [];
        console.log('✅ Customers: Data received successfully:', {
          count: customersData.length,
          sampleCustomers: customersData.slice(0, 3).map(c => ({
            id: c._id,
            name: c.name,
            email: c.email,
            totalOrders: c.totalOrders
          }))
        });
        
        setCustomers(customersData);
        
        if (customersData.length === 0) {
          console.log('⚠️ Customers: No customers found in response');
          toast.info("No customers found. This is normal for a new store.");
        }
      } else {
        console.error('❌ Customers: API returned success: false:', customersRes.data.message);
        toast.error(customersRes.data.message || "Failed to fetch customers");
        setCustomers([]);
      }
    } catch (error) {
      console.error('❌ Customers: Fetch error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      let errorMessage = "Failed to fetch customers data";
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Customers API endpoint not found. Please check backend configuration.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        errorMessage = "Cannot connect to server. Please check if backend is running.";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please try again.";
      }
      
      toast.error(errorMessage);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(customer => 
      (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone || '').includes(searchTerm)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || '').localeCompare(b.name || '');
        case "orders":
          return b.totalOrders - a.totalOrders;
        case "spent":
          return b.totalSpent - a.totalSpent;
        case "date":
          const aDate = a.lastOrderAt ? new Date(a.lastOrderAt) : new Date(0);
          const bDate = b.lastOrderAt ? new Date(b.lastOrderAt) : new Date(0);
          return bDate - aDate;
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <span className="mr-3">👥</span>
          Customer Management
        </h1>
        <p className="text-gray-600">Manage and view your customer base</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Customers</p>
              <p className="text-3xl font-bold">{customers.length}</p>
            </div>
            <div className="text-4xl opacity-80">👥</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Customers</p>
              <p className="text-3xl font-bold">{customers.filter(c => c.status === 'active').length}</p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Orders</p>
              <p className="text-3xl font-bold">
                {customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length) : 0}
              </p>
            </div>
            <div className="text-4xl opacity-80">📊</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Top Customer</p>
              <p className="text-lg font-bold">
                {customers.length > 0 ? customers.sort((a, b) => b.totalSpent - a.totalSpent)[0]?.name.split(' ')[0] : 'N/A'}
              </p>
            </div>
            <div className="text-4xl opacity-80">👑</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="orders">Sort by Orders</option>
              <option value="spent">Sort by Amount Spent</option>
              <option value="date">Sort by Last Order</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Order</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer, index) => (
                <tr 
                  key={customer._id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/customers/${customer._id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                        {(customer.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">
                          Joined {customer.joinDate ? new Date(customer.joinDate).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.email || 'No email'}
                      {customer.isEmailVerified && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{customer.phone || 'No phone'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.totalOrders}</div>
                    <div className="text-sm text-gray-500">
                      {customer.totalOrders === 0 ? 'No orders' : 
                       customer.totalOrders === 1 ? '1 order' : `${customer.totalOrders} orders`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₹{customer.totalSpent.toFixed(2)}</div>
                    {customer.totalOrders > 0 && (
                      <div className="text-sm text-gray-500">
                        Avg: ₹{(customer.totalSpent / customer.totalOrders).toFixed(0)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.lastOrderAt ? 
                        new Date(customer.lastOrderAt).toLocaleDateString() : 
                        'Never'
                      }
                    </div>
                    {customer.lastOrderAt && (
                      <div className="text-sm text-gray-500">
                        {(() => {
                          const daysSince = Math.floor((new Date() - new Date(customer.lastOrderAt)) / (1000 * 60 * 60 * 24));
                          return daysSince === 0 ? 'Today' : 
                                 daysSince === 1 ? 'Yesterday' : 
                                 `${daysSince} days ago`;
                        })()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.status === 'active' ? 'Active' : customer.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${customer._id}`);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Orders →
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;