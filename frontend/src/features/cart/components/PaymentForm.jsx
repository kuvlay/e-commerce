import React, { useState } from 'react';
import { toast } from 'react-toastify';
import apiClient, { TIMEOUTS } from '../../../core/utils/apiClient';

const RazorpayPayment = ({ amount, orderData, onPaymentSuccess, onPaymentError }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create order on backend
      const response = await apiClient.post('/api/payment/create-order', {
        amount: amount,
        currency: 'INR',
        receipt: `receipt_${orderData?.orderId || Date.now()}`,
        notes: {
          orderId: orderData?.orderId || 'temp-order',
          customerEmail: orderData?.customerEmail || 'customer@example.com',
        },
      }, { timeout: TIMEOUTS.medium });

      const data = response.data;
      
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
            
            // Create order with Razorpay payment details - uses same processing as COD after confirmation
            const orderResponse = await apiClient.post('/api/order/razorpay', {
              userId: orderData.userId,
              items: orderData.items,
              amount: orderData.amount,
              address: orderData.address,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              // Ensure online payment gets "Placed" status (payment confirmed)
              initialStatus: 'Placed'
            }, { timeout: TIMEOUTS.medium });

            const orderResult = orderResponse.data;
            console.log('📊 Order creation result:', orderResult);

            if (orderResult.success) {
              console.log('✅ Order created successfully with "Placed" status:', orderResult.orderId);
              toast.success('Payment successful! Order placed and confirmed.');
              onPaymentSuccess && onPaymentSuccess({
                ...response,
                orderId: orderResult.orderId,
                initialStatus: 'Placed' // Confirm the initial status
              });
            } else {
              throw new Error(orderResult.message || 'Failed to create order');
            }
          } catch (error) {
            console.error('❌ Order creation error:', error);
            toast.error(`Order creation failed: ${error.message}`);
            onPaymentError && onPaymentError(error);
          }
        },
        prefill: {
          name: orderData?.customerName || 'Customer',
          email: orderData?.customerEmail || 'customer@example.com',
          contact: orderData?.address?.phone || '9999999999',
        },
        notes: {
          address: orderData?.address?.address || 'Customer Address',
        },
        theme: {
          color: '#f97316', // Orange color to match your theme
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
      onPaymentError && onPaymentError(error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Complete Your Payment</h3>
      
      <div className="space-y-6">
        {/* Streamlined Payment Info */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Secure Online Payment</h4>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <span className="text-blue-600 font-bold text-lg">₹</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">All Payment Methods Supported</p>
                <p className="text-sm text-gray-600">UPI, Cards, Net Banking & Wallets via Razorpay</p>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Amount:</span>
            <span className="text-2xl font-bold text-gray-900">₹{amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
            isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Opening Payment Gateway...
            </div>
          ) : (
            `Pay Securely ₹${amount.toFixed(2)}`
          )}
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Your payment is secured by Razorpay. We never store your payment details.
        </p>
      </div>
    </div>
  );
};

export default RazorpayPayment;