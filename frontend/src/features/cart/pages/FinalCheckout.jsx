import React, { useContext, useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShopContext } from "../../../core/context/ShopContext";
import { useUser } from "../../../core/context/UserContext";
import { FaArrowLeft, FaMapMarkerAlt, FaMoneyBillWave, FaLock, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";
// RazorpayPayment component removed - using direct integration
import apiClient, { TIMEOUTS } from "../../../core/utils/apiClient";

const FinalCheckout = () => {
  const { currency, setCartItems } = useContext(ShopContext);
  const { isAuthenticated, user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [reviewItems, setReviewItems] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);
  // Removed showPaymentForm state - using direct Razorpay integration

  const paymentMethods = [
    {
      id: "razorpay",
      name: "Online Payment",
      description: "Secure payment via Razorpay - All methods supported",
      icon: <FaLock className="text-blue-600" />,
      popular: true
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      description: "Pay when your order arrives",
      icon: <FaMoneyBillWave className="text-orange-600" />,
      popular: false
    }
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate('/login');
      return;
    }

    if (location.state) {
      setReviewItems(location.state.reviewItems || []);
      setSelectedAddress(location.state.selectedAddress || null);
      setTotalAmount(location.state.totalAmount || 0);
      setDeliveryFee(location.state.deliveryFee || 10);
    } else {
      // No state passed, redirect back
      toast.error("No order data found");
      navigate('/cart');
    }
  }, [location.state, isAuthenticated, navigate]);



  // Removed handlePaymentSuccess and handlePaymentError callbacks - using direct integration

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleDirectRazorpayPayment = async () => {
    try {
      console.log('🔄 Initiating direct Razorpay payment...');
      
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
        return;
      }

      // Create order on backend
      // const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      // console.log('🔄 Using backend URL for payment:', backendUrl);
      // const response = await fetch(`${backendUrl}/api/payment/create-order`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     amount: getFinalTotal(),
      //     currency: 'INR',
      //     receipt: `receipt_${Date.now()}`,
      //     notes: {
      //       orderId: `order_${Date.now()}`,
      //       customerEmail: user?.email || 'customer@example.com',
      //     },
      //   }),
      // });

      const { data } = await apiClient.post("/api/payment/create-order", {
        amount: getFinalTotal(),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          orderId: `order_${Date.now()}`,
          customerEmail: user?.email || "customer@example.com",
        },
      }, {
        timeout: TIMEOUTS.medium,
      });

      // const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create order');
      }

      const { order, key_id } = data;

      // Razorpay options
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Your E-commerce Store',
        description: 'Order Payment',
        order_id: order.id,
        handler: async function (response) {
          try {
            console.log('🔄 Payment successful, creating order with "Placed" status...');
            
            // Create order with Razorpay payment details
            // const orderResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/order/razorpay`, {
            //   method: 'POST',
            //   headers: {
            //     'Content-Type': 'application/json',
            //     'Authorization': `Bearer ${localStorage.getItem('token')}`
            //   },
            //   body: JSON.stringify({
            //     userId: localStorage.getItem('userId') || user?.id || user?._id,
            //     items: reviewItems.map(item => ({
            //       product_id: item._id,
            //       title: item.name,
            //       price: item.price,
            //       qty: item.quantity,
            //       variant: item.measurement?.value || item.measurement?.type || 'Standard',
            //       imageUrl: item.image
            //     })),
            //     amount: getFinalTotal(),
            //     address: {
            //       _id: selectedAddress?.id || selectedAddress?._id || null,
            //       fullName: selectedAddress.fullName,
            //       phone: selectedAddress.phone,
            //       addressLine1: selectedAddress.addressLine1,
            //       addressLine2: selectedAddress.addressLine2,
            //       city: selectedAddress.city,
            //       state: selectedAddress.state,
            //       pincode: selectedAddress.pincode
            //     },
            //     razorpayOrderId: response.razorpay_order_id,
            //     razorpayPaymentId: response.razorpay_payment_id,
            //     razorpaySignature: response.razorpay_signature,
            //     initialStatus: 'Placed'
            //   }),
            // });

            const { data: orderResult } = await apiClient.post("/api/order/razorpay", {
              userId: localStorage.getItem('userId') || user?.id || user?._id,
              items: reviewItems.map(item => ({
                product_id: item._id,
                title: item.name,
                price: item.price,
                qty: item.quantity,
                variant: item.measurement?.value || item.measurement?.type || 'Standard',
                imageUrl: item.image
              })),
              amount: getFinalTotal(),
              address: {
                _id: selectedAddress?.id || selectedAddress?._id || null,
                fullName: selectedAddress.fullName,
                phone: selectedAddress.phone,
                addressLine1: selectedAddress.addressLine1,
                addressLine2: selectedAddress.addressLine2,
                city: selectedAddress.city,
                state: selectedAddress.state,
                pincode: selectedAddress.pincode
              },
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              initialStatus: 'Placed'
            }, {
              timeout: TIMEOUTS.medium,
            });

            // const orderResult = await orderResponse.json();
            console.log('📊 Order creation result:', orderResult);

            if (orderResult.success) {
              console.log('✅ Order created successfully with "Placed" status:', orderResult.orderId);
              
              // Clear cart locally and trigger orders refresh
              setCartItems({});
              localStorage.setItem('ordersRefresh', '1');

              toast.success('Payment successful! Order placed and confirmed.');
              navigate('/orders', { 
                state: { 
                  orderSuccess: true, 
                  orderId: orderResult.orderId,
                  paymentMethod: 'Online Payment',
                  initialStatus: 'Placed'
                },
                replace: true
              });
            } else {
              throw new Error(orderResult.message || 'Failed to create order');
            }
          } catch (error) {
            console.error('❌ Order creation error:', error);
            toast.error(`Order creation failed: ${error.message}`);
            setIsProcessing(false);
          }
        },
        prefill: {
          name: selectedAddress?.fullName || 'Customer',
          email: user?.email || 'customer@example.com',
          contact: selectedAddress?.phone || '9999999999',
        },
        notes: {
          address: `${selectedAddress?.addressLine1}, ${selectedAddress?.city}` || 'Customer Address',
        },
        theme: {
          color: '#f97316', // Orange color to match theme
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(`Payment error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Relaxed validation - only check for essential fields
    if (!selectedPayment) {
      toast.error('Please select a payment method');
      return;
    }

    // For COD, we only need items - address validation is handled by backend
    if (selectedPayment === 'cod' && (!reviewItems || reviewItems.length === 0)) {
      toast.error('Your cart is empty');
      return;
    }

    // For Razorpay, we need address for payment processing
    if (selectedPayment === 'razorpay' && !selectedAddress) {
      toast.error('Please select a delivery address for online payment');
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedPayment === 'cod') {
        // Handle COD order according to blueprint
        console.log('🔄 Placing COD order...');
        
        // Early check for COD without address
        if (!selectedAddress) {
          toast.error('Please select a delivery address for COD orders');
          setIsProcessing(false);
          return;
        }

        const orderData = {
          userId: localStorage.getItem('userId') || user?.id || user?._id,
          items: reviewItems.map(item => ({
            product_id: item._id,
            title: item.name,
            price: item.price,
            qty: item.quantity,
            variant: item.measurement?.value || item.measurement?.type || 'Standard',
            imageUrl: item.image
          })),
          amount: getFinalTotal(),
          address: {
            _id: selectedAddress?.id || selectedAddress?._id || null,
            fullName: selectedAddress.fullName,
            phone: selectedAddress.phone,
            addressLine1: selectedAddress.addressLine1,
            addressLine2: selectedAddress.addressLine2,
            city: selectedAddress.city,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode
          }
        };

        // Check if user is authenticated
        if (!user) {
          toast.error('Please login to place order');
          navigate('/login', { state: { from: location.pathname } });
          return;
        }

        const response = await apiClient.post('/api/order/place', orderData);

        const result = response.data;
        console.log('📊 COD Order result:', result);

        if (result.success) {
          console.log('✅ COD Order placed successfully');
          
          // Check if user needs to add address
          if (result.redirectTo) {
            toast.info('Please add a delivery address first');
            navigate(result.redirectTo);
            return;
          }
          
          // Clear cart locally and trigger orders refresh
          setCartItems({});
          localStorage.setItem('ordersRefresh', '1');

          toast.success(result.message || 'COD Order placed successfully! Awaiting verification.');
          navigate('/orders', { 
            state: { 
              orderSuccess: true, 
              paymentMethod: 'COD',
              orderId: result.orderId,
              initialStatus: 'Pending' // COD orders start as "Pending"
            } 
          });
        } else {
          // Handle redirect to address page
          if (result.redirectTo) {
            toast.info(result.message || 'Please add a delivery address to continue');
            navigate(result.redirectTo);
            return;
          }
          // Use user-friendly error messages instead of throwing errors
          const errorMessage = result.message || 'Unable to place order. Please try again.';
          console.error('❌ COD Order failed:', errorMessage);
          toast.error(errorMessage);
        }
      } else if (selectedPayment === 'razorpay') {
        // Handle direct Razorpay payment - bypass intermediate page
        console.log('🔄 Initiating direct Razorpay payment...');
        await handleDirectRazorpayPayment();
        return; // Don't set isProcessing to false here as it's handled in the payment flow
      }
    } catch (error) {
      console.error('❌ Order placement error:', error);
      toast.error(`Order failed: ${error.message}`);
    } finally {
      if (selectedPayment === 'cod') {
        setIsProcessing(false);
      }
      // For Razorpay, isProcessing is handled in the payment flow
    }
  };

  const getFinalTotal = useCallback(() => {
    return (parseFloat(totalAmount) || 0) + (parseFloat(deliveryFee) || 0);
  }, [totalAmount, deliveryFee]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Final Checkout</h1>
              <p className="text-gray-600">Review and confirm your order</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Items ({reviewItems.length})
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {reviewItems.map((item, index) => (
                    <div key={`${item._id}-${item.measurement}`} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.category}</p>
                        <p className="text-sm text-blue-600 font-medium">{item.measurementLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {currency}{item.price} × {item.quantity}
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {currency}{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Delivery Address</h2>
              </div>
              
              {selectedAddress && (
                <div className="p-6">
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <FaMapMarkerAlt className="text-green-600 mt-1 flex-shrink-0" />
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
                      <p className="text-gray-600 mt-1">
                        {selectedAddress.addressLine1}
                        {selectedAddress.addressLine2 && `, ${selectedAddress.addressLine2}`}
                        <br />
                        {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FaLock className="text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
                  <span className="text-sm text-green-600 font-medium">Secure</span>
                </div>
              </div>
              
              <div className="p-6 space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedPayment === method.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Selection Indicator */}
                    {selectedPayment === method.id && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <FaCheck className="text-white text-sm" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 pr-12">
                      <div className="text-2xl">{method.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{method.name}</h3>
                          {method.popular && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{method.description}</p>
                        {method.id === 'razorpay' && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                            <FaLock className="text-xs" />
                            <span>UPI • Cards • Net Banking • Wallets</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Direct Payment Notice for Online Payment */}
              {selectedPayment === 'razorpay' && (
                <div className="px-6 pb-6">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-sm flex items-center gap-2">
                      <FaLock className="text-xs" />
                      Clicking "Place Order" will open Razorpay gateway directly for secure payment
                    </p>
                  </div>
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
                  <span className="text-gray-600">Items ({reviewItems.length})</span>
                  <span className="font-semibold">{currency}{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold">{currency}{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-semibold">-{currency}0</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">
                      {currency}{getFinalTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 space-y-4">
                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg">
                  <FaLock className="text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    Your payment is secured with SSL encryption
                  </span>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || !selectedPayment || !selectedAddress}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    `Place Order • ${currency}${getFinalTotal().toFixed(2)}`
                  )}
                </button>

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center">
                  By placing your order, you agree to our{" "}
                  <button className="text-orange-600 hover:underline">Terms & Conditions</button>
                  {" "}and{" "}
                  <button className="text-orange-600 hover:underline">Privacy Policy</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalCheckout;