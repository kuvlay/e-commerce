import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../../../core/config/index.js';

// Initialize Razorpay only if credentials are available
let razorpay = null;

const initializeRazorpay = () => {
  if (!razorpay && config.razorpay.keyId && config.razorpay.keySecret) {
    razorpay = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return razorpay;
};

const checkRazorpayConfig = (req, res, next) => {
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    return res.status(503).json({
      success: false,
      message: 'Payment service is not configured. Please contact administrator.',
      error: 'Razorpay credentials not found'
    });
  }
  next();
};

const router = express.Router();

// Health check endpoint for payment service
router.get('/health', (req, res) => {
  const isConfigured = !!(config.razorpay.keyId && config.razorpay.keySecret);
  const hasValidKeys = config.razorpay.keyId && config.razorpay.keyId.startsWith('rzp_') && 
                     config.razorpay.keySecret && config.razorpay.keySecret.length > 10;
  
  // Additional validation for dummy/example keys
  const isDummyKeys = config.razorpay.keyId?.includes('your_key_id') || 
                     config.razorpay.keySecret?.includes('your_key_secret');
  
  res.json({
    success: true,
    message: 'Payment service health check',
    configured: isConfigured && hasValidKeys && !isDummyKeys,
    status: isConfigured && hasValidKeys && !isDummyKeys ? 'ready' : 'not_configured',
    details: {
      hasKeyId: !!config.razorpay.keyId,
      hasKeySecret: !!config.razorpay.keySecret,
      keyIdFormat: config.razorpay.keyId ? config.razorpay.keyId.startsWith('rzp_') : false,
      isDummyConfig: isDummyKeys
    }
  });
});

// Create Razorpay order
router.post('/create-order', checkRazorpayConfig, async (req, res) => {
  try {
    const razorpayInstance = initializeRazorpay();
    if (!razorpayInstance) {
      return res.status(503).json({
        success: false,
        message: 'Payment service initialization failed'
      });
    }

    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise (1 INR = 100 paise)
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes,
    };

    const order = await razorpayInstance.orders.create(options);

    res.json({
      success: true,
      order: order,
      key_id: config.razorpay.keyId
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Verify payment signature
router.post('/verify-payment', checkRazorpayConfig, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Create signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment is verified
      console.log('Payment verified successfully:', razorpay_payment_id);
      
      res.json({
        success: true,
        message: 'Payment verified successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// Get payment details
router.get('/payment/:paymentId', checkRazorpayConfig, async (req, res) => {
  try {
    const razorpayInstance = initializeRazorpay();
    if (!razorpayInstance) {
      return res.status(503).json({
        success: false,
        message: 'Payment service initialization failed'
      });
    }

    const { paymentId } = req.params;
    const payment = await razorpayInstance.payments.fetch(paymentId);

    res.json({
      success: true,
      payment: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
});

export default router;