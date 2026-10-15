import axios from "axios";
import { useEffect, useState } from "react";
import { backendUrl, currency } from "../../../App";
import { toast } from "react-toastify";
import { getMeasurementTypeInfo } from "../../../constants/measurements";
// Removed dummy products dependency

const List = ({ token }) => {
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterCategory, setFilterCategory] = useState("all");
  const [featuredProducts, setFeaturedProducts] = useState([]);

  const fetchList = async () => {
    try {
      setIsLoading(true);
      
      if (backendUrl) {
        const response = await axios.get(backendUrl + "/api/product/list", {
          timeout: 5000
        });
        
        if (response.data.success) {
          setList(response.data.products);
        } else {
          setList([]);
        }
      } else {
        setList([]);
      }
      
    } catch (error) {
      setList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/featured-with-priority", {
        headers: { token }
      });
      
      if (response.data.success) {
        setFeaturedProducts(response.data.products);
      }
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
    }
  };

  const toggleFeatured = async (productId, currentStatus) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/toggle-featured",
        { productId },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList(); // Refresh the list
        await fetchFeaturedProducts(); // Refresh featured products
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const response = await axios.post(
          backendUrl + "/api/product/remove",
          { id },
          { headers: { token } }
        );

        if (response.data.success) {
          toast.success(response.data.message);
          await fetchList();
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  useEffect(() => {
    fetchList();
    fetchFeaturedProducts();
  }, []);

  // Filter and sort products
  const filteredProducts = list
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return a.price - b.price;
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

  const categories = [...new Set(list.map((product) => product.category))];

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
          <span className="mr-3">📦</span>
          Product Management
        </h1>
        <p className="text-gray-600">
          Manage your product inventory and listings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Products</p>
              <p className="text-3xl font-bold">{list.length}</p>
            </div>
            <div className="text-4xl opacity-80">📦</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Categories</p>
              <p className="text-3xl font-bold">{categories.length}</p>
            </div>
            <div className="text-4xl opacity-80">🏷️</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Featured Products</p>
              <p className="text-3xl font-bold">
                {list.filter((p) => p.featured).length}/3
              </p>
            </div>
            <div className="text-4xl opacity-80">🌟</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Avg Price</p>
              <p className="text-3xl font-bold">
                {currency}
                {list.length > 0
                  ? Math.round(
                      list.reduce((sum, p) => sum + p.price, 0) / list.length
                    )
                  : 0}
              </p>
            </div>
            <div className="text-4xl opacity-80">💰</div>
          </div>
        </div>
      </div>

      {/* Featured Products Management */}
      {featuredProducts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">🌟</span>
              Featured Products Management
            </h2>
            <div className="text-sm text-gray-600">
              {featuredProducts.length}/3 slots used
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredProducts.map((product, index) => (
              <div key={product._id} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    🌟
                  </div>
                  <div className="text-lg">🏆</div>
                </div>
                <img
                  src={product.image[0]}
                  alt={product.name}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <h3 className="font-semibold text-sm text-gray-800 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-600">{product.category}</p>
                <div className="text-sm font-bold text-purple-600 mt-1">
                  {currency}{product.price}
                </div>
              </div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: 3 - featuredProducts.length }).map((_, index) => (
              <div key={`empty-${index}`} className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-2xl mb-2">➕</div>
                  <div className="text-xs">Available Slot</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-blue-700">
              <strong>💡 How it works:</strong> When you feature a 4th product, the oldest featured product (lowest priority) will be automatically removed. New featured products always get 1st priority.
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search products..."
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
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or add some products
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredProducts.map((item) => (
              <div
                key={item._id}
                className="bg-gray-50 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                {/* Product Image */}
                <div className="relative mb-4">
                  <img
                    className="w-full h-48 object-cover rounded-xl"
                    src={item.image[0]}
                    alt={item.name}
                  />
                  <div className="absolute top-2 left-2 flex gap-2">
                    {item.bestseller && (
                      <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        ⭐ Bestseller
                      </div>
                    )}
                    {item.featured && (
                      <div className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        🌟 Featured
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 text-lg line-clamp-2">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {item.category}
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      {currency}
                      {item.price}
                    </span>
                  </div>
                  
                  {/* Measurement Type Display */}
                  {item.measurementType && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {getMeasurementTypeInfo(item.measurementType).icon}
                      </span>
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {getMeasurementTypeInfo(item.measurementType).label}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Measurements Display */}
                {item.measurements && item.measurements.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-2">Available Options:</div>
                    <div className="flex flex-wrap gap-1">
                      {item.measurements.slice(0, 3).map((measurement, idx) => (
                        <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {measurement.label}
                          {measurement.priceModifier !== 0 && (
                            <span className="ml-1 text-green-600">
                              ({measurement.priceModifier > 0 ? '+' : ''}{currency}{measurement.priceModifier})
                            </span>
                          )}
                        </span>
                      ))}
                      {item.measurements.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{item.measurements.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleFeatured(item._id, item.featured)}
                      className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center space-x-1 text-xs ${
                        item.featured
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                      title={item.featured 
                        ? 'Remove from featured' 
                        : featuredProducts.length >= 3 
                          ? 'Feature this product (will remove lowest priority featured product)'
                          : 'Add to featured products'
                      }
                    >
                      <span>{item.featured ? '🌟' : '⭐'}</span>
                      <span>
                        {item.featured 
                          ? 'Featured' 
                          : featuredProducts.length >= 3 
                            ? 'Feature (3/3)' 
                            : `Feature (${featuredProducts.length}/3)`
                        }
                      </span>
                    </button>
                    <button
                      onClick={() => removeProduct(item._id, item.name)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center space-x-1 text-xs"
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default List;
