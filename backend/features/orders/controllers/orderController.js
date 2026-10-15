import orderModel from "../models/orderModel.js";
import userModel from "../../auth/models/userModel.js";
import { logActivity } from "../utils/activityLogger.js";
import { canTransitionOrderStatus } from "../utils/orderStateMachine.js";
import { 
  sendOrderStatusNotification, 
  sendCODApprovalNotification, 
  sendCODDeclineNotification 
} from "../services/notificationService.js";
import { validateShippingInfo } from "../utils/shippingValidation.js";
import { 
  sendOrdersResponse, 
  sendErrorResponse, 
  sendSuccessResponse,
  sendNotFoundResponse,
  sendServiceUnavailableResponse,
  sendValidationErrorResponse 
} from "../../../core/utils/responseWrapper.js";
import { batchResolveCustomerNames } from "../../../core/utils/customerResolver.js";
import { 
  logShippingInfoSave,
  logOrderQueryPerformance,
  logCustomerNameResolution,
  createShippingAuditTrail
} from "../utils/shippingLogger.js";
import { 
  logDetailedError,
  logPerformanceMetrics,
  logAuditTrail
} from "../utils/errorLogger.js";
import { orderLogger, shippingLogger } from "../../../core/utils/logger.js";
import { batchEnsureCompatibility } from "../utils/backwardCompatibility.js";

//GLOBAL VARIABLES
const currency = "inr";
const deliveryCharges = 10;

// PLACING ORDERS USING COD
export const placeOrder = async (req, res) => {
  try {
    orderLogger.info('Placing COD order', { body: req.body });
    
    const { items, payment_method = 'COD', address_id } = req.body;
    const userId = req.userId; // From auth middleware

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ 
        success: false, 
        message: "Items are required and must be a non-empty array" 
      });
    }

    // Get user with addresses
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user has at least one address
    let userAddress;
    if (address_id) {
      // Find specific address by ID in user's addresses array
      userAddress = user.addresses.find(addr => addr._id.toString() === address_id);
      if (!userAddress) {
        return res.json({
          success: false,
          message: "Address not found",
          redirectTo: "/profile/addresses"
        });
      }
    } else {
      // Use default address
      userAddress = user.addresses.find(addr => addr.isDefault === true);
      if (!userAddress) {
        // Check if user has any address
        if (user.addresses.length === 0) {
          return res.json({
            success: false,
            message: "Please add a delivery address first",
            redirectTo: "/profile/addresses"
          });
        }
        // Use first address if no default is set
        userAddress = user.addresses[0];
      }
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = items.map(item => {
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      return {
        product_id: item.product_id,
        title: item.title,
        price: item.price,
        qty: item.qty,
        variant: item.variant || null,
        imageUrl: item.imageUrl || null
      };
    });

    const shipping = deliveryCharges;
    const tax = 0; // Can be calculated based on requirements
    const grand_total = subtotal + shipping + tax;

    // Create address snapshot
    const address_snapshot = {
      name: userAddress.fullName,
      phone: userAddress.phone,
      line1: userAddress.addressLine1,
      line2: userAddress.addressLine2 || null,
      city: userAddress.city,
      state: userAddress.state,
      pincode: userAddress.pincode,
      country: 'India'
    };

    const orderData = {
      user_id: userId,
      items: processedItems,
      address_snapshot,
      payment_method,
      payment_status: payment_method === 'COD' ? 'PendingVerification' : 'Pending',
      order_status: 'Pending', // COD orders start as "Pending"
      totals: {
        subtotal,
        shipping,
        tax,
        grand_total
      },
      // Legacy fields for backward compatibility
      userId,
      amount: grand_total,
      address: address_snapshot,
      paymentMethod: payment_method,
      payment: false,
      date: Date.now(),
      status: "Order Placed"
    };

    orderLogger.debug('Creating order', { orderData });

    const newOrder = new orderModel(orderData);
    const savedOrder = await newOrder.save();

    orderLogger.info('Order saved successfully', { orderId: savedOrder._id });

    // Log activity
    await logActivity(userId, 'ORDER_PLACED', {
      order_id: savedOrder._id,
      payment_method,
      grand_total
    }, savedOrder._id);

    // Clear user cart
    try {
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      orderLogger.debug('User cart cleared', { userId });
    } catch (cartError) {
      orderLogger.warn('Could not clear user cart', { userId, error: cartError.message });
    }

    res.json({ 
      success: true, 
      message: payment_method === 'COD' ? "COD Order placed successfully. Awaiting verification." : "Order placed successfully",
      orderId: savedOrder._id,
      order: {
        _id: savedOrder._id,
        payment_status: savedOrder.payment_status,
        order_status: savedOrder.order_status,
        grand_total: savedOrder.totals.grand_total
      }
    });
  } catch (error) {
    orderLogger.error('Order placement error', { error: error.message, stack: error.stack });
    res.json({ 
      success: false, 
      message: "Failed to place order",
      error: error.message 
    });
  }
};



// PLACING ORDERS USING RAZORPAY
export const placeOrderRazorpay = async (req, res) => {
  try {
    orderLogger.info('Placing Razorpay order', { bodyKeys: Object.keys(req.body) });
    
    const { userId, items, amount, address, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Validate required fields
    if (!userId || !items || !amount || !address || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      orderLogger.warn('Missing required fields for Razorpay order', { userId: !!userId, items: !!items, amount: !!amount });
      return res.json({ 
        success: false, 
        message: "Missing required fields for Razorpay payment verification" 
      });
    }

    // Import crypto for signature verification
    const crypto = await import('crypto');
    
    // Verify payment signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto.default
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    orderLogger.debug('Verifying payment signature');

    if (expectedSignature !== razorpaySignature) {
      orderLogger.error('Payment signature verification failed', { orderId: razorpayOrderId });
      return res.json({ success: false, message: "Payment verification failed" });
    }

    orderLogger.info('Payment signature verified', { orderId: razorpayOrderId });

    // Calculate totals structure
    const deliveryCharges = 10;
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = deliveryCharges;
    const tax = 0; // Can be calculated based on requirements
    const grand_total = subtotal + shipping + tax;

    // Validate amount matches calculated total
    if (Math.abs(grand_total - amount) > 0.01) {
      orderLogger.error('Payment amount mismatch', { calculated: grand_total, received: amount });
      return res.json({ 
        success: false, 
        message: "Payment amount mismatch" 
      });
    }

    // Create address snapshot from legacy address format
    const address_snapshot = {
      name: address.firstName && address.lastName 
        ? `${address.firstName} ${address.lastName}` 
        : address.name || 'Unknown Customer',
      phone: address.phone || 'Not provided',
      line1: address.street || address.line1 || address.addressLine1 || 'Not provided',
      line2: address.line2 || address.addressLine2 || null,
      city: address.city || 'Not provided',
      state: address.state || 'Not provided',
      pincode: address.zipcode || address.pincode || 'Not provided',
      country: address.country || 'India'
    };

    // Process items to match new schema
    const processedItems = items.map(item => ({
      product_id: item.product_id || item._id,
      title: item.title || item.name,
      price: item.price,
      qty: item.qty || item.quantity,
      variant: item.variant || item.size || null,
      imageUrl: item.imageUrl || item.image?.[0] || null
    }));

    // Create order with new schema format
    const orderData = {
      // New schema fields
      user_id: userId,
      items: processedItems, // items shape compatible with legacy consumers
      address_snapshot,
      payment_method: 'ONLINE',
      payment_status: 'Paid',
      order_status: 'Placed', // Online payments start as "Placed"
      totals: {
        subtotal,
        shipping,
        tax,
        grand_total
      },
      
      // Legacy fields for backward compatibility
      userId,
      address,
      amount,
      paymentMethod: "Razorpay",
      payment: true, // Payment is verified
      razorpayOrderId,
      razorpayPaymentId,
      date: Date.now(),
      status: "Placed" // Legacy status field - matches order_status for online payments
    };

    orderLogger.debug('Creating Razorpay order with new schema');

    const newOrder = new orderModel(orderData);
    const savedOrder = await newOrder.save();

    orderLogger.info('Razorpay order saved successfully', { orderId: savedOrder._id });

    // Log activity
    await logActivity(userId, 'ORDER_PLACED', {
      order_id: savedOrder._id,
      payment_method: 'ONLINE',
      grand_total,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId
    }, savedOrder._id);

    // Clear user cart after successful order
    try {
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      orderLogger.debug('User cart cleared after Razorpay payment', { userId });
    } catch (cartError) {
      orderLogger.warn('Could not clear user cart', { userId, error: cartError.message });
      // Don't fail the order if cart clearing fails
    }

    res.json({ 
      success: true, 
      message: "Order placed successfully with Razorpay",
      orderId: savedOrder._id,
      order: {
        _id: savedOrder._id,
        payment_status: savedOrder.payment_status,
        order_status: savedOrder.order_status,
        grand_total: savedOrder.totals.grand_total
      }
    });

  } catch (error) {
    orderLogger.error("Razorpay order error", { error: error.message, stack: error.stack });
    res.json({ 
      success: false, 
      message: "Failed to place Razorpay order",
      error: error.message 
    });
  }
};

//ALL ORDERS DATA FOR ADMIN PANEL
export const allOrders = async (req, res) => {
  const requestId = `ADMIN_ORDERS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  try {
    orderLogger.info('Fetching all orders for admin panel', { 
      requestId,
      dbState: orderModel.db.readyState 
    });
    
    // Enhanced query with comprehensive user population and performance tracking
    const queryStartTime = Date.now();
    const orders = await orderModel.find()
      .populate({
        path: 'user_id',
        select: 'name email phone created_at',
        options: { 
          strictPopulate: false, // Allow null user_id references
          lean: false // Keep mongoose documents for better error handling
        }
      })
      .sort({ created_at: -1, date: -1 })
      .catch(err => {
        orderLogger.error('Error fetching orders', { requestId, error: err.message });
        throw err;
      });
    const queryDuration = Date.now() - queryStartTime;
    
    orderLogger.info('Orders fetched', { requestId, count: orders.length, queryDuration });
    
    // Calculate initial metrics for performance monitoring
    const ordersWithUsers = orders.filter(o => o.user_id).length;
    const ordersWithoutUsers = orders.filter(o => !o.user_id).length;
    const ordersWithShipping = orders.filter(o => o.shippingInfo?.carrier || o.shippingInfo?.trackingNumber).length;
    
    console.log(`📝 [${requestId}] Initial population success rate:`, {
      ordersWithUsers,
      ordersWithoutUsers,
      ordersWithShipping
    });
    
    // Enhanced post-processing for legacy orders with userId field
    // Removed console.log for production
    const ordersWithMissingUserData = orders.filter(order => 
      !order.user_id && order.userId && typeof order.userId === 'string'
    );
    
    // Also check for orders with invalid ObjectId references
    const ordersWithInvalidUserRefs = orders.filter(order => 
      order.user_id && !order.user_id.name && !order.user_id.email
    );
    
    // Removed console.log for production
    // Removed console.log for production
    
    // Initialize counters
    let attachedCount = 0;
    let repairedCount = 0;
    
    // Process legacy orders with userId field
    if (ordersWithMissingUserData.length > 0) {
      try {
        // Extract unique userIds for batch lookup, with validation
        const uniqueUserIds = [...new Set(
          ordersWithMissingUserData
            .map(order => order.userId)
            .filter(userId => {
              // Validate ObjectId format
              if (!userId || typeof userId !== 'string') return false;
              return /^[0-9a-fA-F]{24}$/.test(userId);
            })
        )];
        
        // Removed console.log for production
        
        if (uniqueUserIds.length > 0) {
          // Batch fetch missing user documents with enhanced selection and performance tracking
          const userLookupStartTime = Date.now();
          const legacyUsers = await userModel.find({ 
            _id: { $in: uniqueUserIds } 
          }).select('name email phone created_at').lean();
          const userLookupDuration = Date.now() - userLookupStartTime;
          
          // Removed console.log for production
          
          // Create lookup map for efficient user attachment
          const userLookupMap = new Map();
          legacyUsers.forEach(user => {
            userLookupMap.set(user._id.toString(), user);
          });
          
          // Attach user data to orders with legacy userId
          ordersWithMissingUserData.forEach(order => {
            const userData = userLookupMap.get(order.userId);
            if (userData) {
              order.user_id = userData;
              attachedCount++;
            }
          });
          
          // Removed console.log for production
        }
        
        // Removed console.log for production
        
      } catch (userLookupError) {
        // Removed console.error for production
        // Removed console.log for production
      }
    }
    
    // Process orders with invalid user references (re-populate)
    if (ordersWithInvalidUserRefs.length > 0) {
      try {
        // Removed console.log for production
        
        const userIdsToRepair = [...new Set(
          ordersWithInvalidUserRefs
            .map(order => order.user_id?._id?.toString())
            .filter(Boolean)
        )];
        
        if (userIdsToRepair.length > 0) {
          const repairStartTime = Date.now();
          const repairUsers = await userModel.find({
            _id: { $in: userIdsToRepair }
          }).select('name email phone created_at').lean();
          const repairDuration = Date.now() - repairStartTime;
          
          // Removed console.log for production
          
          const repairLookupMap = new Map();
          repairUsers.forEach(user => {
            repairLookupMap.set(user._id.toString(), user);
          });
          
          ordersWithInvalidUserRefs.forEach(order => {
            const userId = order.user_id?._id?.toString();
            const userData = repairLookupMap.get(userId);
            if (userData) {
              order.user_id = userData;
              repairedCount++;
            }
          });
          
          // Removed console.log for production
        }
      } catch (repairError) {
        // Removed console.error for production
        // Removed console.log for production
      }
    }
    
    // Enhanced customer name resolution and shipping info processing with performance tracking
    // Removed console.log for production
    const processingStartTime = Date.now();
    
    const enhancedOrders = batchResolveCustomerNames(
      orders.map(order => {
        const orderObj = order.toObject();
        
        // Enhanced shipping info processing with comprehensive null handling
        orderObj.shippingInfo = orderObj.shippingInfo ? {
          carrier: orderObj.shippingInfo.carrier || null,
          trackingNumber: orderObj.shippingInfo.trackingNumber || null,
          shippedAt: orderObj.shippingInfo.shippedAt || null
        } : null;
        
        // Ensure user information is properly structured for admin interface
        if (orderObj.user_id) {
          // Handle both populated and lean user objects
          const userData = orderObj.user_id;
          orderObj.user_id = {
            _id: userData._id,
            name: userData.name || null,
            email: userData.email || null,
            phone: userData.phone || null,
            created_at: userData.created_at || null
          };
        }
        
        // Add legacy user ID for debugging purposes
        if (orderObj.userId && !orderObj.user_id) {
          orderObj._legacyUserId = orderObj.userId;
        }
        
        return orderObj;
      }),
      { 
        logStats: true, 
        maxLogEntries: 10, // Increased for better debugging
        includeOrderId: true,
        allowEmailFallback: true,
        allowPhoneFallback: false, // Keep phone fallback disabled for admin
        preferFullNames: true
      }
    );
    const processingDuration = Date.now() - processingStartTime;
    
    // Removed console.log for production
    
    // Calculate final metrics
    const finalOrdersWithShipping = enhancedOrders.filter(o => o.shippingInfo?.carrier || o.shippingInfo?.trackingNumber).length;
    const finalOrdersWithUserData = enhancedOrders.filter(o => o.user_id?.name || o.user_id?.email).length;
    const highConfidenceNames = enhancedOrders.filter(o => o.nameResolution?.confidence >= 80).length;
    
    // Removed console.log for production
    // Removed console.log for production
    // Removed console.log for production
    
    // Log performance metrics
    const totalDuration = Date.now() - startTime;
    await logOrderQueryPerformance('allOrders', totalDuration, {
      queryDuration,
      processingDuration,
      ordersFetched: orders.length,
      ordersWithUsers: finalOrdersWithUserData,
      ordersWithShipping: finalOrdersWithShipping,
      legacyOrdersProcessed: ordersWithMissingUserData.length,
      invalidReferencesRepaired: repairedCount,
      dbConnectionState: orderModel.db.readyState,
      populationSuccessRate: Math.round((finalOrdersWithUserData / Math.max(orders.length, 1)) * 100),
      userLookupEfficiency: ordersWithMissingUserData.length > 0 ? Math.round((attachedCount / ordersWithMissingUserData.length) * 100) : 100,
      repairEfficiency: ordersWithInvalidUserRefs.length > 0 ? Math.round((repairedCount / ordersWithInvalidUserRefs.length) * 100) : 100
    }, requestId);
    
    // Ensure backward compatibility for all orders
    const compatibleOrders = batchEnsureCompatibility(enhancedOrders);
    
    // Enhanced response with comprehensive metadata
    return sendOrdersResponse(res, compatibleOrders, 'Orders retrieved successfully with enhanced customer name resolution', {
      totalOrders: enhancedOrders.length,
      ordersWithShipping: enhancedOrders.filter(o => o.shippingInfo?.carrier || o.shippingInfo?.trackingNumber).length,
      ordersWithUserData: enhancedOrders.filter(o => o.user_id?.name || o.user_id?.email).length,
      highConfidenceNames: enhancedOrders.filter(o => o.nameResolution?.confidence >= 80).length,
      averageDataQuality: Math.round(enhancedOrders.reduce((sum, o) => sum + (o.dataQuality || 0), 0) / enhancedOrders.length),
      userPopulationStats: {
        directPopulation: enhancedOrders.filter(o => o.user_id && !o.nameResolution?.source?.includes('legacy')).length,
        legacyResolution: enhancedOrders.filter(o => o.nameResolution?.source?.includes('legacy')).length,
        fallbackResolution: enhancedOrders.filter(o => o.nameResolution?.source?.includes('fallback')).length
      },
      dataRepairStats: {
        legacyOrdersFound: ordersWithMissingUserData.length,
        legacyOrdersRepaired: attachedCount,
        invalidReferencesFound: ordersWithInvalidUserRefs.length,
        invalidReferencesRepaired: repairedCount,
        totalRepairOperations: attachedCount + repairedCount
      },
      customerNameResolution: {
        totalProcessed: enhancedOrders.length,
        highConfidence: enhancedOrders.filter(o => o.nameResolution?.confidence >= 80).length,
        mediumConfidence: enhancedOrders.filter(o => o.nameResolution?.confidence >= 40 && o.nameResolution?.confidence < 80).length,
        lowConfidence: enhancedOrders.filter(o => o.nameResolution?.confidence < 40).length,
        unknownCustomers: enhancedOrders.filter(o => o.displayCustomerName === 'Unknown Customer' || o.displayCustomerName?.includes('Customer #')).length
      }
    });
  } catch (error) {
    orderLogger.error('AllOrders error', { error: error.message, stack: error.stack });
    return sendErrorResponse(res, 'Failed to fetch all orders', 500, {
      message: error.message,
      name: error.name
    });
  }
};

//USER ORDERS DATA FOR FRONTEND
export const userOrders = async (req, res) => {
  const requestId = `USER_ORDERS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  try {
    orderLogger.info('Fetching user orders for frontend', { requestId });
    const userId = req.userId; // from auth middleware
    if (!userId) {
      orderLogger.warn('Unauthorized access attempt - no userId in request', { requestId });
      return sendErrorResponse(res, 'Unauthorized', 401);
    }

    // Removed console.log for production

    const queryStartTime = Date.now();
    const orders = await orderModel.find({
      $or: [
        { user_id: userId },
        { userId: userId } // legacy
      ]
    })
    .populate({
      path: 'user_id',
      select: 'name email phone',
      options: { strictPopulate: false } // Allow null user_id references
    })
    .sort({ created_at: -1, date: -1 });
    const queryDuration = Date.now() - queryStartTime;

    // Removed console.log for production

    // Process orders to ensure shipping information is included and properly formatted with enhanced logging
    const processingStartTime = Date.now();
    const processedOrders = orders.map((order, index) => {
      const orderObj = order.toObject();
      
      // Ensure shipping info is properly structured with explicit null handling
      orderObj.shippingInfo = orderObj.shippingInfo ? {
        carrier: orderObj.shippingInfo.carrier || null,
        trackingNumber: orderObj.shippingInfo.trackingNumber || null,
        shippedAt: orderObj.shippingInfo.shippedAt || null
      } : null;
      
      // Ensure user information is available for frontend display
      if (!orderObj.user_id && orderObj.userId) {
        // Handle legacy orders where user_id might not be populated
        // Removed console.log for production
      }
      
      // Log customer name resolution for debugging (sample first few orders)
      if (index < 3) {
        // Use a simplified name resolution for logging purposes
        const nameResolution = {
          name: orderObj.user_id?.name || orderObj.address_snapshot?.name || 'Unknown',
          source: orderObj.user_id?.name ? 'user_id.name' : (orderObj.address_snapshot?.name ? 'address_snapshot.name' : 'fallback'),
          confidence: orderObj.user_id?.name ? 95 : (orderObj.address_snapshot?.name ? 90 : 10),
          metadata: {
            schemaType: orderObj.user_id ? 'new_schema' : 'legacy_schema',
            dataSourceType: orderObj.user_id ? 'populated_reference' : 'address_only'
          }
        };
        
        // Log customer name resolution asynchronously (don't await to avoid slowing down response)
        logCustomerNameResolution(orderObj._id, nameResolution, orderObj, requestId).catch(err => {
          // Removed console.warn for production
        });
      }
      
      return orderObj;
    });
    const processingDuration = Date.now() - processingStartTime;

    const ordersWithShipping = processedOrders.filter(o => o.shippingInfo?.carrier || o.shippingInfo?.trackingNumber).length;
    const ordersWithUserData = processedOrders.filter(o => o.user_id).length;
    
    // Removed console.log for production
    // Removed console.log for production
    
    // Log performance metrics for user orders query
    const totalDuration = Date.now() - startTime;
    await logOrderQueryPerformance('userOrders', totalDuration, {
      queryDuration,
      processingDuration,
      ordersFetched: orders.length,
      ordersWithUsers: ordersWithUserData,
      ordersWithShipping: ordersWithShipping,
      legacyOrdersProcessed: 0, // Not applicable for user orders
      dbConnectionState: orderModel.db.readyState,
      populationSuccessRate: Math.round((ordersWithUserData / Math.max(orders.length, 1)) * 100),
      userLookupEfficiency: 100 // Direct user query, no lookup needed
    }, requestId);

    return sendSuccessResponse(res, { orders: processedOrders }, 'User orders retrieved successfully', {
      requestId,
      userId,
      totalOrders: processedOrders.length,
      ordersWithShipping: ordersWithShipping,
      ordersWithUserData: ordersWithUserData,
      performanceMetrics: {
        totalDuration: `${totalDuration}ms`,
        queryDuration: `${queryDuration}ms`,
        processingDuration: `${processingDuration}ms`
      }
    });
  } catch (error) {
    // Removed console.error for production
    return sendErrorResponse(res, 'Failed to fetch user orders', 500, {
      requestId,
      message: error.message,
      userId: req.userId
    });
  }
};

//UPDATE ORDER STATUS FROM ADMIN PANEL



/**
 * Verifies shipping info persistence with independent database query
 * @param {string} orderId - Order ID to verify
 * @param {Object} expectedShippingInfo - Expected shipping info values
 * @param {string} requestId - Request correlation ID
 * @returns {Object} Verification report with success/failure status
 */
const verifyShippingInfoPersistence = async (orderId, expectedShippingInfo, requestId) => {
  // Removed console.log for production
  
  try {
    // Check database connection state before querying
    const dbState = orderModel.db.readyState;
    console.log(`🗄️ [${requestId}] Database connection state during verification: ${dbState}`);
    
    if (dbState !== 1) {
      // Removed console.error for production
      return {
        success: false,
        error: `Database connection unavailable during verification (state: ${dbState})`,
        orderId
      };
    }
    
    const startTime = Date.now();
    console.log(`🔎 [${requestId}] Executing verification query for order ${orderId}...`);
    
    // Use lean() for faster queries and ensure we get the latest data
    const order = await orderModel.findById(orderId)
      .select('shippingInfo order_status updated_at')
      .lean();
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ [${requestId}] Verification query completed in ${duration}ms`);
    
    if (!order) {
      // Removed console.error for production
      return {
        success: false,
        error: 'Order not found during verification',
        duration,
        orderId
      };
    }
    
    orderLogger.debug('Raw order data from verification query', {
      requestId,
      orderId: order._id,
      hasShippingInfo: !!order.shippingInfo,
      order_status: order.order_status,
      updated_at: order.updated_at
    });
    
    const actualShippingInfo = order.shippingInfo || {};
    console.log(`🔍 [${requestId}] Detailed field comparison:`, {
      expected: {
        carrier: expectedShippingInfo.carrier,
        trackingNumber: expectedShippingInfo.trackingNumber,
        shippedAt: expectedShippingInfo.shippedAt
      },
      actual: {
        carrier: actualShippingInfo.carrier,
        trackingNumber: actualShippingInfo.trackingNumber,
        shippedAt: actualShippingInfo.shippedAt
      },
      types: {
        expectedCarrierType: typeof expectedShippingInfo.carrier,
        actualCarrierType: typeof actualShippingInfo.carrier,
        expectedTrackingType: typeof expectedShippingInfo.trackingNumber,
        actualTrackingType: typeof actualShippingInfo.trackingNumber
      }
    });
    
    const carrierMatch = actualShippingInfo.carrier === expectedShippingInfo.carrier;
    const trackingMatch = actualShippingInfo.trackingNumber === expectedShippingInfo.trackingNumber;
    const hasShippedAt = !!actualShippingInfo.shippedAt;
    
    const verification = {
      success: carrierMatch && trackingMatch && hasShippedAt,
      duration,
      orderId,
      matches: {
        carrier: carrierMatch,
        trackingNumber: trackingMatch,
        shippedAt: hasShippedAt
      },
      values: {
        expected: expectedShippingInfo,
        actual: actualShippingInfo
      },
      persistence: {
        carrierPersisted: !!actualShippingInfo.carrier,
        trackingPersisted: !!actualShippingInfo.trackingNumber,
        shippedAtPersisted: hasShippedAt,
        allFieldsPersisted: !!(actualShippingInfo.carrier && actualShippingInfo.trackingNumber && hasShippedAt)
      },
      dbConnectionState: dbState
    };
    
    if (verification.success) {
      // Removed console.log for production
    } else {
      orderLogger.error('Shipping info persistence verification FAILED', {
        requestId,
        carrierIssue: !carrierMatch ? `Expected: "${expectedShippingInfo.carrier}", Got: "${actualShippingInfo.carrier}"` : null,
        trackingIssue: !trackingMatch ? `Expected: "${expectedShippingInfo.trackingNumber}", Got: "${actualShippingInfo.trackingNumber}"` : null,
        shippedAtIssue: !hasShippedAt ? 'shippedAt field missing or null' : null,
        rawShippingInfo: actualShippingInfo
      });
    }
    
    return verification;
    
  } catch (error) {
    // Removed console.error for production
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      duration: 0,
      orderId
    };
  }
};

export const updateStatus = async (req, res) => {
  const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { orderId, status, shippingInfo } = req.body;
    
    console.log(`🆔 [${requestId}] Starting order status update`);
    // Removed console.log for production
    // Removed console.log for production
    
    // Validate required fields
    if (!orderId) {
      // Removed console.error for production
      return sendValidationErrorResponse(res, 
        [{ field: 'orderId', message: 'Order ID is required' }],
        'Order ID is required'
      );
    }
    
    if (!status) {
      // Removed console.error for production
      return sendValidationErrorResponse(res, 
        [{ field: 'status', message: 'Status is required' }],
        'Status is required'
      );
    }
    
    // Early shipping info validation (before database operations)
    let normalizedShippingInfo = null;
    if (shippingInfo) {
      // Removed console.log for production
      
      try {
        // Use validation utility for early validation (without existing data)
        normalizedShippingInfo = validateShippingInfo(shippingInfo, {});
        // Removed console.log for production
        
      } catch (validationError) {
        // Removed console.error for production
        return sendValidationErrorResponse(res, 
          [{ field: 'shippingInfo', message: validationError.message }],
          `Invalid shipping information: ${validationError.message}`
        );
      }
    }

    // Database connection verification
    const dbState = orderModel.db.readyState;
    console.log(`🗄️ [${requestId}] MongoDB connection state: ${dbState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
    if (dbState !== 1) {
      // Removed console.error for production
      return sendServiceUnavailableResponse(res, 'Database connection unavailable');
    }

    // Get current order with comprehensive logging
    // Removed console.log for production
    const order = await orderModel.findById(orderId);
    if (!order) {
      // Removed console.error for production
      return sendNotFoundResponse(res, 'Order', orderId);
    }
    
    // Removed console.log for production

    // Check if transition is valid (bypass if status is same and only updating shipping info)
    const currentStatus = order.order_status;
    // Removed console.log for production
    
    const isSameStatus = status === currentStatus;
    const isValidTransition = canTransitionOrderStatus(currentStatus, status);
    
    console.log(`🔍 [${requestId}] Transition validation:`, {
      isSameStatus,
      isValidTransition,
      hasShippingInfo: !!shippingInfo,
      bypassValidation: isSameStatus && !!shippingInfo
    });
    
    if (!isSameStatus && !isValidTransition) {
      // Removed console.error for production
      return sendValidationErrorResponse(res, 
        [{ field: 'status', message: `Invalid transition from ${currentStatus} to ${status}` }],
        `Invalid status transition from ${currentStatus} to ${status}`
      );
    }

    // Prepare update data with enhanced logging
    const updateData = {
      order_status: status,
      status: status, // Legacy field
      updated_at: new Date()
    };
    
    // Removed console.log for production

    // Enhanced shipping information handling with proper field mapping
    if (normalizedShippingInfo) {
      // Removed console.log for production
      
      // Re-validate with existing order data for better shippedAt handling
      try {
        normalizedShippingInfo = validateShippingInfo(shippingInfo, order.shippingInfo);
        
        // Removed console.log for production
        console.log(`🔍 [${requestId}] Pre-update comparison:`, {
          existing: order.shippingInfo,
          normalized: normalizedShippingInfo,
          willChange: {
            carrier: order.shippingInfo?.carrier !== normalizedShippingInfo.carrier,
            trackingNumber: order.shippingInfo?.trackingNumber !== normalizedShippingInfo.trackingNumber
          }
        });
        
      } catch (validationError) {
        // Removed console.error for production
        return sendValidationErrorResponse(res, 
          [{ field: 'shippingInfo', message: validationError.message }],
          `Invalid shipping information: ${validationError.message}`
        );
      }
    }

    // Enhanced shipping info update with proper field mapping and null handling
    if (normalizedShippingInfo) {
      // Ensure proper field mapping to match schema exactly
      updateData.shippingInfo = {
        carrier: normalizedShippingInfo.carrier || null,
        trackingNumber: normalizedShippingInfo.trackingNumber || null,
        shippedAt: normalizedShippingInfo.shippedAt || new Date()
      };
      
      // Ensure we're not overwriting existing shippedAt if it already exists
      if (order.shippingInfo?.shippedAt && !shippingInfo.shippedAt) {
        updateData.shippingInfo.shippedAt = order.shippingInfo.shippedAt;
      }
      
      console.log(`🛠️ [${requestId}] Adding shipping info to update with correct field mapping:`, updateData.shippingInfo);
    }
    
    // Removed console.log for production

    // Enhanced database update with proper options for persistence
    console.log(`💾 [${requestId}] Executing database update with enhanced options...`);
    
    const updateStartTime = Date.now();
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId, 
      updateData,
      { 
        new: true,
        runValidators: true,
        upsert: false, // Don't create if not exists
        strict: true,  // Enforce schema validation
        timestamps: true // Update timestamps
      }
    ).populate({
      path: 'user_id',
      select: 'name email phone',
      options: { strictPopulate: false } // Allow null user_id references
    });
    const updateDuration = Date.now() - updateStartTime;
    
    console.log(`⏱️ [${requestId}] Database update completed in ${updateDuration}ms`);
    
    if (!updatedOrder) {
      // Removed console.error for production
      return sendNotFoundResponse(res, 'Order', orderId);
    }
    
    orderLogger.debug('Updated order shipping info', { 
      requestId, 
      orderId: updatedOrder._id,
      shippingInfo: updatedOrder.shippingInfo 
    });

    // Immediate persistence verification after shipping info updates
    let verificationResult = null;
    if (normalizedShippingInfo) {
      // Removed console.log for production
      verificationResult = await verifyShippingInfoPersistence(orderId, updateData.shippingInfo, requestId);
      
      if (!verificationResult.success) {
        // Removed console.error for production
        
        // Log the failure but don't fail the entire operation
        // Removed console.warn for production
      } else {
        // Removed console.log for production
      }
    }

    // Enhanced activity logging with request tracking
    // Removed console.log for production
    await logActivity(order.user_id, 'ORDER_STATUS_CHANGED', {
      order_id: orderId,
      from_status: currentStatus,
      to_status: status,
      shipping_info: shippingInfo,
      request_id: requestId,
      updated_at: new Date(),
      verification_result: verificationResult
    }, orderId);

    // Comprehensive audit logging for compliance and security
    console.log(`🔒 [${requestId}] Creating audit trail for order status update...`);
    await logAuditTrail(req.admin?.id || order.user_id || 'system', 'ORDER_STATUS_UPDATED', {
      orderId,
      statusChange: {
        from: currentStatus,
        to: status
      },
      shippingInfoUpdated: !!normalizedShippingInfo,
      shippingInfo: normalizedShippingInfo,
      adminEmail: req.admin?.email,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection?.remoteAddress,
      sessionId: req.sessionID,
      verificationResult: verificationResult,
      orderValue: order.totals?.grand_total || order.amount,
      customerEmail: order.user_id?.email
    }, requestId);

    // Enhanced shipping information logging and audit trail
    if (normalizedShippingInfo) {
      console.log(`📦 [${requestId}] Logging shipping information save operation...`);
      
      // Log shipping info save with comprehensive metadata
      const shippingLogResult = await logShippingInfoSave(
        orderId,
        normalizedShippingInfo,
        order.shippingInfo,
        req.adminUserId || 'system', // Assuming admin user ID is available in request
        requestId,
        { 
          success: verificationResult?.success || true, 
          sanitized: true,
          verification: verificationResult
        }
      );
      
      if (shippingLogResult.success) {
        // Removed console.log for production
        
        // Create audit trail for shipping changes
        if (shippingLogResult.changes.totalChanges > 0) {
          const auditResult = await createShippingAuditTrail(
            orderId,
            shippingLogResult.changes,
            req.adminUserId || 'system',
            requestId
          );
          
          if (auditResult.success) {
            orderLogger.debug('Shipping audit trail created', { requestId, auditId: auditResult.auditId });
          } else {
            orderLogger.warn('Failed to create shipping audit trail', { requestId, error: auditResult.error });
          }
        }
      } else {
        // Removed console.warn for production
      }
    }

    // Enhanced logging for order cancellations
    if (status.toLowerCase() === 'cancelled') {
      // Removed console.log for production
      await logActivity(order.user_id, 'ORDER_DECLINED', {
        order_id: orderId,
        decline_reason: req.body.decline_reason || 'Order cancelled by admin',
        cancelled_at: new Date(),
        request_id: requestId
      }, orderId);
    }

    // Send notification email with error handling
    try {
      console.log(`📧 [${requestId}] Sending status notification...`);
      const user = await userModel.findById(order.user_id);
      if (user && updatedOrder) {
        await sendOrderStatusNotification(user, updatedOrder, currentStatus, status);
        // Removed console.log for production
      } else {
        // Removed console.log for production
      }
    } catch (notificationError) {
      console.error(`⚠️ [${requestId}] Failed to send status notification:`, notificationError);
      // Don't fail the status update if notification fails
    }

    // Removed console.log for production
    
    // Enhanced response with verification results
    const responseData = {
      order: {
        id: orderId,
        status: status,
        shippingInfo: updatedOrder.shippingInfo
      }
    };
    
    // Include verification results if shipping info was updated
    if (verificationResult) {
      responseData.verification = {
        success: verificationResult.success,
        persistence: verificationResult.persistence
      };
    }
    
    return sendSuccessResponse(res, responseData, 'Status updated successfully', {
      requestId,
      statusTransition: `${currentStatus} -> ${status}`,
      shippingInfoUpdated: !!normalizedShippingInfo,
      verificationPassed: verificationResult?.success || null
    });
  } catch (error) {
    const totalDuration = Date.now() - (req.startTime || Date.now());
    // Removed console.error for production
    // Removed console.error for production
    // Removed console.error for production
    
    // Enhanced error categorization and logging
    let errorCategory = 'unknown_error';
    let errorMessage = 'Failed to update order status';
    let statusCode = 500;
    let userFriendlyMessage = 'An unexpected error occurred. Please try again.';
    
    if (error.name === 'ValidationError') {
      errorCategory = 'validation_error';
      errorMessage = 'Order data validation failed';
      statusCode = 400;
      userFriendlyMessage = 'Invalid data provided. Please check your input and try again.';
      
      // Log specific validation errors
      if (error.errors) {
        const validationDetails = Object.keys(error.errors).map(field => ({
          field,
          message: error.errors[field].message,
          value: error.errors[field].value
        }));
        console.error(`🔍 [${requestId}] Validation error details:`, validationDetails);
      }
    } else if (error.name === 'CastError') {
      errorCategory = 'cast_error';
      errorMessage = 'Invalid data format';
      statusCode = 400;
      userFriendlyMessage = 'Invalid order ID format. Please check the order ID and try again.';
    } else if (error.code === 11000) {
      errorCategory = 'duplicate_key_error';
      errorMessage = 'Duplicate data detected';
      statusCode = 409;
      userFriendlyMessage = 'This operation conflicts with existing data. Please refresh and try again.';
    } else if (error.message?.includes('timeout') || error.name === 'MongoTimeoutError') {
      errorCategory = 'timeout_error';
      errorMessage = 'Database operation timed out';
      statusCode = 504;
      userFriendlyMessage = 'The operation took too long to complete. Please try again.';
    } else if (error.message?.includes('connection') || error.name === 'MongoNetworkError') {
      errorCategory = 'connection_error';
      errorMessage = 'Database connection failed';
      statusCode = 503;
      userFriendlyMessage = 'Database connection issue. Please try again in a moment.';
    } else if (error.name === 'MongoServerError') {
      errorCategory = 'mongo_server_error';
      errorMessage = 'Database server error';
      statusCode = 503;
      userFriendlyMessage = 'Database server issue. Please try again later.';
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
      errorCategory = 'network_error';
      errorMessage = 'Network connection failed';
      statusCode = 503;
      userFriendlyMessage = 'Network connection issue. Please check your connection and try again.';
    } else if (error.name === 'TypeError' && error.message?.includes('Cannot read property')) {
      errorCategory = 'data_structure_error';
      errorMessage = 'Invalid data structure';
      statusCode = 400;
      userFriendlyMessage = 'Invalid request format. Please check your data and try again.';
    }

    // Log detailed error information for debugging
    console.error(`🔍 [${requestId}] Error analysis:`, {
      category: errorCategory,
      name: error.name,
      code: error.code,
      message: error.message,
      mongooseError: error.name?.includes('Error'),
      validationErrors: error.errors ? Object.keys(error.errors) : null,
      stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack trace
      requestBody: req.body ? JSON.stringify(req.body, null, 2) : 'No body',
      dbConnectionState: orderModel.db.readyState,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });

    // Log comprehensive error details and metrics
    try {
      await logDetailedError('updateStatus', error, {
        orderId: req.body?.orderId,
        requestedStatus: req.body?.status,
        hasShippingInfo: !!req.body?.shippingInfo,
        adminUser: req.admin?.email,
        dbConnectionState: orderModel.db.readyState,
        requestBody: req.body
      }, requestId);
      
      await logPerformanceMetrics('updateStatus_error', totalDuration, {
        errorCategory,
        errorName: error.name,
        errorCode: error.code,
        statusCode,
        orderId: req.body?.orderId,
        requestedStatus: req.body?.status,
        hasShippingInfo: !!req.body?.shippingInfo,
        dbConnectionState: orderModel.db.readyState
      }, requestId);
    } catch (loggingError) {
      // Removed console.warn for production
    }

    return sendErrorResponse(res, userFriendlyMessage, statusCode, {
      requestId,
      errorCategory,
      message: error.message,
      name: error.name,
      duration: `${totalDuration}ms`,
      timestamp: new Date().toISOString(),
      // Include additional context for debugging (only in development)
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        validationErrors: error.errors
      })
    });
  }
};


