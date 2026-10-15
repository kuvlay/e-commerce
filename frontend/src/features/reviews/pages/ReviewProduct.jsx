import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShopContext } from "../../../core/context/ShopContext";
import { useUser } from "../../../core/context/UserContext";
import { addressService } from "../../auth/services/addressService";
import { FaArrowLeft, FaPlus, FaMinus, FaMapMarkerAlt, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import "../../../shared/styles/optional-fields.css";

const ReviewProduct = () => {
  const { products, currency, cartItems, updateQuantity } = useContext(ShopContext);
  const { user, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [reviewItems, setReviewItems] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Load addresses from API
  const loadAddresses = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoadingAddresses(true);
      const response = await addressService.getAddresses();
      
      if (response.success) {
        setAddresses(response.addresses || []);
        // Set default address
        const defaultAddr = response.addresses?.find(addr => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
        }
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Get product data from location state or cart
  useEffect(() => {
    if (location.state?.productId && location.state?.selectedMeasurement && location.state?.quantity) {
      // Coming from Buy Now
      const { productId, selectedMeasurement, quantity } = location.state;
      const product = products.find(p => p._id === productId);
      
      if (product) {
        const measurement = product.measurements?.find(m => m.value === selectedMeasurement);
        const price = measurement?.price || product.price;
        
        setReviewItems([{
          _id: productId,
          name: product.name,
          image: product.image && product.image.length > 0 ? product.image[0] : '/placeholder-image.jpg',
          price: price,
          measurement: selectedMeasurement,
          measurementLabel: measurement?.label || selectedMeasurement,
          quantity: quantity,
          category: product.category
        }]);
      }
    } else {
      // Coming from cart - convert cart items to review format
      const items = [];
      for (const itemId in cartItems) {
        const product = products.find(p => p._id === itemId);
        if (product) {
          for (const measurement in cartItems[itemId]) {
            const quantity = cartItems[itemId][measurement];
            if (quantity > 0) {
              const measurementData = product.measurements?.find(m => m.value === measurement);
              const price = measurementData?.price || product.price;
              
              items.push({
                _id: itemId,
                name: product.name,
                image: product.image && product.image.length > 0 ? product.image[0] : '/placeholder-image.jpg',
                price: price,
                measurement: measurement,
                measurementLabel: measurementData?.label || measurement,
                quantity: quantity,
                category: product.category
              });
            }
          }
        }
      }
      setReviewItems(items);
    }
  }, [location.state, cartItems, products]);

  // Load addresses when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadAddresses();
    } else if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  const handleQuantityChange = (itemId, measurement, newQuantity) => {
    if (newQuantity <= 0) return;
    
    // Update local state
    setReviewItems(prev => prev.map(item => 
      item._id === itemId && item.measurement === measurement 
        ? { ...item, quantity: newQuantity }
        : item
    ));

    // Update cart context
    updateQuantity(itemId, measurement, newQuantity);
  };

  const removeItem = (itemId, measurement) => {
    setReviewItems(prev => prev.filter(item => 
      !(item._id === itemId && item.measurement === measurement)
    ));
    updateQuantity(itemId, measurement, 0);
  };

  const getTotalAmount = () => {
    return reviewItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleProceedToPayment = () => {
    if (reviewItems.length === 0) {
      toast.error("No items to checkout");
      return;
    }
    
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }
    
    navigate("/final-checkout", {
      state: {
        reviewItems,
        selectedAddress,
        totalAmount: getTotalAmount()
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Review Your Order</h1>
              <p className="text-gray-600">Check your items and delivery details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Items Review */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Items List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Items ({reviewItems.length})
                </h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {reviewItems.map((item, index) => (
                  <div key={`${item._id}-${item.measurement}`} className="p-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                        <p className="text-sm text-blue-600 font-medium mt-1">
                          {item.measurementLabel}
                        </p>
                        <p className="text-lg font-bold text-gray-900 mt-2">
                          {currency}{item.price}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end gap-3">
                        <button
                          onClick={() => removeItem(item._id, item.measurement)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                        
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item._id, item.measurement, item.quantity - 1)}
                            className="p-2 hover:bg-gray-50 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <FaMinus className="text-gray-600 text-sm" />
                          </button>
                          <span className="px-4 py-2 font-semibold min-w-[50px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item._id, item.measurement, item.quantity + 1)}
                            className="p-2 hover:bg-gray-50 transition-colors"
                          >
                            <FaPlus className="text-gray-600 text-sm" />
                          </button>
                        </div>
                        
                        <p className="text-sm font-semibold text-gray-900">
                          {currency}{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Delivery Address</h2>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                  >
                    Change
                  </button>
                </div>
              </div>
              
              {selectedAddress ? (
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-orange-500 mt-1 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{selectedAddress.name}</h3>
                        {selectedAddress.isDefault && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 font-medium">{selectedAddress.fullName}</p>
                      <p className="text-gray-600">{selectedAddress.phone}</p>
                      {/* Optimized address display with conditional rendering and dynamic spacing */}
                      <div className="address-display optional-field-container compact mt-1">
                        <span className="address-line text-gray-600">{selectedAddress.addressLine1}</span>
                        {selectedAddress.addressLine2 && selectedAddress.addressLine2.trim() && (
                          <span className="address-line text-gray-600">{selectedAddress.addressLine2}</span>
                        )}
                        <span className="address-line text-gray-600">
                          {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500 mb-4">
                    {addresses.length === 0 ? "No addresses saved" : "No delivery address selected"}
                  </p>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    {addresses.length === 0 ? "Add Address" : "Select Address"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{currency}{getTotalAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold">{currency}10</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">
                      {currency}{(getTotalAmount() + 10).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100">
                <button
                  onClick={handleProceedToPayment}
                  disabled={!selectedAddress || reviewItems.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Select Delivery Address</h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {loadingAddresses ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Loading addresses...</p>
                </div>
              ) : addresses.length > 0 ? (
                addresses.map((address) => (
                  <div
                    key={address._id}
                    onClick={() => {
                      setSelectedAddress(address);
                      setShowAddressModal(false);
                    }}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedAddress?._id === address._id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{address.name}</h4>
                      {address.isDefault && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 font-medium">{address.fullName}</p>
                    <p className="text-gray-600 text-sm">{address.phone}</p>
                    {/* Optimized address display with conditional rendering and dynamic spacing */}
                    <div className="address-display optional-field-container compact mt-1 text-sm">
                      <span className="address-line text-gray-600">{address.addressLine1}</span>
                      {address.addressLine2 && address.addressLine2.trim() && (
                        <span className="address-line text-gray-600">{address.addressLine2}</span>
                      )}
                      <span className="address-line text-gray-600">
                        {address.city}, {address.state} - {address.pincode}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaMapMarkerAlt className="mx-auto text-4xl mb-4 text-gray-300" />
                  <p>No addresses saved yet</p>
                  <p className="text-sm">Add your first address to continue</p>
                </div>
              )}
              
              <button 
                onClick={() => {
                  setShowAddressModal(false);
                  // Navigate to address management or show add address form
                  navigate('/profile', { state: { tab: 'addresses' } });
                }}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
              >
                + Add New Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewProduct;