import mongoose from "mongoose";
import userModel from "../../auth/models/userModel.js";
import orderModel from "../../orders/models/orderModel.js";
import { 
  sendCustomersResponse, 
  sendErrorResponse, 
  sendSuccessResponse,
  sendNotFoundResponse 
} from "../../../core/utils/responseWrapper.js";
import { 
  logDetailedError,
  logPerformanceMetrics,
  logAuditTrail
} from "../../orders/utils/errorLogger.js";

// Get all customers with order statistics
export const getAllCustomers = async (req, res) => {
  const requestId = req.admin?.requestId || 'unknown';
  
  try {
    console.log(`👥 [${requestId}] Fetching all customers...`);
    console.log(`🔗 [${requestId}] MongoDB connection state:`, {
      readyState: userModel.db.readyState,
      name: userModel.db.name
    });
    console.log(`🔑 [${requestId}] Admin user:`, req.admin?.email);
    console.log(`🕰 [${requestId}] Request timestamp:`, new Date().toISOString());
    
    // First, check the total number of users in the database
    const totalUsersCount = await userModel.countDocuments();
    console.log(`📂 [${requestId}] Total users in database: ${totalUsersCount}`);
    
    // Check user role distribution
    const roleStats = await userModel.aggregate([
      {
        $group: {
          _id: { 
            role: "$role",
            hasRole: { $ne: ["$role", null] }
          },
          count: { $sum: 1 }
        }
      }
    ]);
    console.log(`📈 [${requestId}] User role distribution:`, roleStats);
    
    // Get all users (customers) - include users without role field OR role != 'admin'
    // Only exclude known admin emails to avoid filtering out legitimate users
    const adminEmails = [];
    if (process.env.ADMIN_EMAIL) adminEmails.push(process.env.ADMIN_EMAIL.toLowerCase());
    if (process.env.ADMIN_EMAILS) {
      adminEmails.push(...process.env.ADMIN_EMAILS.toLowerCase().split(',').map(e => e.trim()));
    }
    
    const users = await userModel.find({ 
      $and: [
        {
          $or: [
            { role: { $ne: 'admin' } },
            { role: { $exists: false } }
          ]
        },
        {
          email: { $nin: adminEmails }
        }
      ]
    })
      .select('-password -cartData')
      .sort({ createdAt: -1 })
      .catch(err => {
        console.error('❌ Error fetching users:', err);
        throw err;
      });

    console.log(`👥 [${requestId}] Found ${users.length} customers (non-admin users)`);
    
    // Log role values for debugging
    const roleValues = users.slice(0, 5).map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasRole: user.role !== undefined
    }));
    console.log(`📝 [${requestId}] Sample user roles:`, roleValues);
    
    if (users.length === 0) {
      console.log(`⚠️ [${requestId}] No customers found - checking all users`);
      const allUsers = await userModel.find({}).limit(3).select('name email role');
      console.log(`📝 [${requestId}] All users sample:`, allUsers);
    }

    // Use aggregation for better performance instead of per-customer queries
    console.log(`📊 [${requestId}] Calculating customer statistics with aggregation...`);
    
    const agg = await orderModel.aggregate([
      {
        $group: {
          _id: '$user_id',
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: {
              $toDouble: {
                $ifNull: ['$totals.grand_total', '$amount']
              }
            }
          },
          lastOrderAt: {
            $max: {
              $ifNull: [
                '$created_at',
                { $toDate: '$date' }
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $match: {
          $and: [
            {
              $or: [
                { 'user.role': { $ne: 'admin' } },
                { 'user.role': { $exists: false } }
              ]
            },
            {
              'user.email': { $nin: adminEmails }
            }
          ]
        }
      },
      {
        $project: {
          _id: '$user._id',
          name: { $ifNull: ['$user.name', 'Unknown'] },
          email: { $ifNull: ['$user.email', 'No email'] },
          phone: { $ifNull: ['$user.phone', 'No phone'] },
          joinDate: { $ifNull: ['$user.createdAt', '$user.joinDate'] },
          totalOrders: 1,
          totalSpent: 1,
          lastOrderAt: 1,
          status: { $ifNull: ['$user.accountStatus', 'active'] },
          isEmailVerified: { $ifNull: ['$user.isEmailVerified', false] },
          profileCompletion: { $ifNull: ['$user.profileCompletionPercentage', 0] },
          wishlistCount: {
            $cond: {
              if: { $isArray: '$user.wishlist' },
              then: { $size: '$user.wishlist' },
              else: 0
            }
          },
          addressCount: {
            $cond: {
              if: { $isArray: '$user.addresses' },
              then: { $size: '$user.addresses' },
              else: 0
            }
          }
        }
      },
      {
        $sort: { totalOrders: -1 }
      }
    ]).catch(err => {
      console.error('❌ Error in customer aggregation:', err);
      return [];
    });
    
    // Also include users with no orders - apply same filtering
    const usersWithNoOrders = users.filter(user => 
      !agg.find(customer => customer._id.toString() === user._id.toString())
    ).map(user => ({
      _id: user._id,
      name: user.name || 'Unknown',
      email: user.email || 'No email',
      phone: user.phone || 'No phone',
      joinDate: user.createdAt || user.joinDate,
      totalOrders: 0,
      totalSpent: 0,
      lastOrderAt: null,
      status: user.accountStatus || 'active',
      isEmailVerified: user.isEmailVerified || false,
      profileCompletion: user.profileCompletionPercentage || 0,
      wishlistCount: user.wishlist?.length || 0,
      addressCount: user.addresses?.length || 0
    }));
    
    // Combine customers with and without orders
    const customersWithStats = [...agg, ...usersWithNoOrders];
    
    console.log(`✅ [${requestId}] Customer statistics calculated with aggregation:`, {
      customersWithOrders: agg.length,
      customersWithoutOrders: usersWithNoOrders.length,
      totalCustomers: customersWithStats.length
    });

    console.log(`📈 [${requestId}] Customer summary:`, {
      totalCustomers: customersWithStats.length,
      customersWithOrders: customersWithStats.filter(c => c.totalOrders > 0).length,
      activeCustomers: customersWithStats.filter(c => c.status === 'active').length,
      totalRevenue: customersWithStats.reduce((sum, c) => sum + c.totalSpent, 0)
    });

    console.log(`✅ [${requestId}] Customer data retrieval completed successfully`);

    return sendCustomersResponse(res, customersWithStats, {
      totalRevenue: customersWithStats.reduce((sum, c) => sum + c.totalSpent, 0),
      customersWithOrders: customersWithStats.filter(c => c.totalOrders > 0).length,
      averageOrderValue: customersWithStats.length > 0 
        ? Math.round(customersWithStats.reduce((sum, c) => sum + c.totalSpent, 0) / customersWithStats.filter(c => c.totalOrders > 0).length)
        : 0
    }, 'Customer data retrieved successfully');

  } catch (error) {
    const totalDuration = Date.now() - (req.startTime || Date.now());
    console.error(`❌ [${requestId}] Get customers error after ${totalDuration}ms:`, error.message);
    console.error(`❌ [${requestId}] Error stack:`, error.stack);
    console.error(`❌ [${requestId}] Error name:`, error.name);
    console.error(`❌ [${requestId}] MongoDB connection state:`, userModel.db.readyState);
    
    // Enhanced error categorization and logging for customer operations
    let errorCategory = 'unknown_error';
    let errorMessage = 'Failed to fetch customers';
    let statusCode = 500;
    let userFriendlyMessage = 'Unable to load customer data. Please try refreshing the page.';
    
    if (error.name === 'MongoTimeoutError' || error.message?.includes('timeout')) {
      errorCategory = 'timeout_error';
      errorMessage = 'Customer query timed out';
      statusCode = 504;
      userFriendlyMessage = 'Customer data is taking longer than usual to load. Please try again.';
    } else if (error.name === 'MongoNetworkError' || error.message?.includes('connection')) {
      errorCategory = 'connection_error';
      errorMessage = 'Database connection failed';
      statusCode = 503;
      userFriendlyMessage = 'Database connection issue. Please try again in a moment.';
    } else if (error.name === 'MongoServerError') {
      errorCategory = 'mongo_server_error';
      errorMessage = 'Database server error';
      statusCode = 503;
      userFriendlyMessage = 'Database server issue. Please try again later.';
    } else if (error.message?.includes('aggregation') || error.message?.includes('pipeline')) {
      errorCategory = 'aggregation_error';
      errorMessage = 'Customer data aggregation failed';
      statusCode = 500;
      userFriendlyMessage = 'Error processing customer statistics. Please try again.';
    } else if (error.name === 'TypeError' && error.message?.includes('Cannot read property')) {
      errorCategory = 'data_structure_error';
      errorMessage = 'Invalid data structure in customer query';
      statusCode = 500;
      userFriendlyMessage = 'Data format issue detected. Please contact support if this persists.';
    }

    // Log detailed error information for debugging
    console.error(`🔍 [${requestId}] Customer error analysis:`, {
      category: errorCategory,
      name: error.name,
      code: error.code,
      message: error.message,
      mongooseError: error.name?.includes('Error'),
      stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack trace
      adminUser: req.admin?.email,
      dbConnectionState: userModel.db.readyState,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      duration: `${totalDuration}ms`
    });

    // Log comprehensive error details and metrics
    try {
      console.log(`📊 [${requestId}] Logging customer error details...`);
      
      await logDetailedError('getAllCustomers', error, {
        adminUser: req.admin?.email,
        dbConnectionState: userModel.db.readyState,
        requestHeaders: req.headers,
        userAgent: req.get('User-Agent')
      }, requestId);
      
      await logPerformanceMetrics('customer_error', totalDuration, {
        errorCategory,
        errorName: error.name,
        errorCode: error.code,
        statusCode,
        adminUser: req.admin?.email,
        dbConnectionState: userModel.db.readyState
      }, requestId);
    } catch (loggingError) {
      console.warn(`⚠️ [${requestId}] Failed to log customer error details:`, loggingError.message);
    }
    
    return sendErrorResponse(res, userFriendlyMessage, statusCode, {
      message: error.message,
      name: error.name,
      requestId,
      errorCategory,
      duration: `${totalDuration}ms`,
      timestamp: new Date().toISOString(),
      // Include additional context for debugging (only in development)
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        adminUser: req.admin?.email
      })
    });
  }
};

// Get customer details with recent orders
export const getCustomerDetails = async (req, res) => {
  const requestId = req.admin?.requestId || 'unknown';
  
  try {
    const { customerId } = req.params;
    console.log(`👤 [${requestId}] Fetching customer details for ID: ${customerId}`);
    console.log(`🔑 [${requestId}] Admin user:`, req.admin?.email);
    console.log(`🌐 [${requestId}] Request origin:`, req.headers.origin);
    console.log(`🔗 [${requestId}] Full request URL:`, req.originalUrl);

    // Get customer info
    const customer = await userModel.findById(customerId)
      .select('-password -cartData');

    if (!customer) {
      console.log(`❌ [${requestId}] Customer not found: ${customerId}`);
      return sendNotFoundResponse(res, 'Customer', customerId);
    }
    
    console.log(`✅ [${requestId}] Customer found: ${customer.name} (${customer.email})`);

    // Get customer's recent orders
    console.log(`📄 [${requestId}] Fetching orders for customer: ${customerId}`);
    const orders = await orderModel.find({ 
      $or: [
        { user_id: customerId },
        { userId: customerId } // Legacy field support
      ]
    })
    .sort({ created_at: -1, date: -1 })
    .limit(10);
    
    console.log(`📄 [${requestId}] Found ${orders.length} orders for customer`);

    // Calculate statistics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => {
      return sum + (order.totals?.grand_total || order.amount || 0);
    }, 0);

    const ordersByStatus = orders.reduce((acc, order) => {
      const status = order.order_status || order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return sendSuccessResponse(res, {
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        joinDate: customer.createdAt || customer.joinDate,
        status: customer.accountStatus || 'active',
        isEmailVerified: customer.isEmailVerified || false,
        profileCompletion: customer.profileCompletionPercentage || 0,
        preferences: customer.preferences || {},
        wishlistCount: customer.wishlist?.length || 0,
        addressCount: customer.addresses?.length || 0
      },
      statistics: {
        totalOrders,
        totalSpent,
        ordersByStatus,
        averageOrderValue: totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0
      },
      recentOrders: orders.map(order => ({
        _id: order._id,
        order_status: order.order_status || order.status,
        payment_status: order.payment_status || (order.payment ? 'Paid' : 'Pending'),
        payment_method: order.payment_method || order.paymentMethod,
        total: order.totals?.grand_total || order.amount,
        itemCount: order.items?.length || 0,
        created_at: order.created_at || (order.date ? new Date(order.date) : new Date()),
        updated_at: order.updated_at || (order.date ? new Date(order.date) : new Date())
      }))
    }, 'Customer details retrieved successfully', {
      customerId,
      ordersIncluded: orders.length
    });

  } catch (error) {
    const totalDuration = Date.now() - (req.startTime || Date.now());
    console.error(`❌ [${requestId}] Get customer details error after ${totalDuration}ms:`, error.message);
    console.error(`❌ [${requestId}] Error stack:`, error.stack);
    console.error(`❌ [${requestId}] Error name:`, error.name);
    
    // Enhanced error categorization for customer details
    let errorCategory = 'unknown_error';
    let errorMessage = 'Failed to fetch customer details';
    let statusCode = 500;
    let userFriendlyMessage = 'Unable to load customer details. Please try again.';
    
    if (error.name === 'CastError' && error.path === '_id') {
      errorCategory = 'invalid_customer_id';
      errorMessage = 'Invalid customer ID format';
      statusCode = 400;
      userFriendlyMessage = 'Invalid customer ID. Please check the customer ID and try again.';
    } else if (error.name === 'MongoTimeoutError' || error.message?.includes('timeout')) {
      errorCategory = 'timeout_error';
      errorMessage = 'Customer details query timed out';
      statusCode = 504;
      userFriendlyMessage = 'Customer details are taking longer than usual to load. Please try again.';
    } else if (error.name === 'MongoNetworkError' || error.message?.includes('connection')) {
      errorCategory = 'connection_error';
      errorMessage = 'Database connection failed';
      statusCode = 503;
      userFriendlyMessage = 'Database connection issue. Please try again in a moment.';
    }

    // Log detailed error information
    console.error(`🔍 [${requestId}] Customer details error analysis:`, {
      category: errorCategory,
      name: error.name,
      code: error.code,
      message: error.message,
      customerId: req.params?.customerId,
      adminUser: req.admin?.email,
      dbConnectionState: userModel.db.readyState,
      timestamp: new Date().toISOString(),
      duration: `${totalDuration}ms`
    });

    return sendErrorResponse(res, userFriendlyMessage, statusCode, {
      message: error.message,
      requestId,
      errorCategory,
      duration: `${totalDuration}ms`,
      timestamp: new Date().toISOString(),
      customerId: req.params?.customerId
    });
  }
};

// Get all orders for a specific customer
export const getCustomerOrders = async (req, res) => {
  const requestId = req.admin?.requestId || 'unknown';
  
  try {
    const { customerId } = req.params;
    console.log(`📄 [${requestId}] Fetching orders for customer ID: ${customerId}`);
    console.log(`🔑 [${requestId}] Admin user:`, req.admin?.email);

    // Validate customer exists first
    const customer = await userModel.findById(customerId)
      .select('name email');

    if (!customer) {
      console.log(`❌ [${requestId}] Customer not found: ${customerId}`);
      return sendNotFoundResponse(res, 'Customer', customerId);
    }
    
    console.log(`✅ [${requestId}] Customer found: ${customer.name} (${customer.email})`);

    // Get all orders for the customer, sorted by date (latest to oldest)
    console.log(`📄 [${requestId}] Fetching all orders for customer: ${customerId}`);
    
    const orders = await orderModel.find({ 
      $or: [
        { user_id: new mongoose.Types.ObjectId(customerId) }, // ObjectId format
        { userId: customerId }                                // Legacy string format
      ]
    })
    .populate('items.product_id', 'name images price')
    .sort({ created_at: -1, date: -1 }) // Sort by latest first
    .lean(); // Use lean for better performance
    
    console.log(`📄 [${requestId}] Found ${orders.length} orders for customer`);

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      order_status: order.order_status || order.status || 'Pending',
      payment_status: order.payment_status || (order.payment ? 'Paid' : 'Pending'),
      payment_method: order.payment_method || order.paymentMethod || 'Unknown',
      total: order.totals?.grand_total || order.amount || 0,
      subtotal: order.totals?.subtotal || 0,
      shipping: order.totals?.shipping || 0,
      tax: order.totals?.tax || 0,
      itemCount: order.items?.length || 0,
      items: order.items?.map(item => ({
        product_id: item.product_id?._id || item.product_id,
        title: item.title,
        price: item.price,
        qty: item.qty,
        variant: item.variant,
        imageUrl: item.imageUrl,
        // Include populated product data if available
        productName: item.product_id?.name,
        productImages: item.product_id?.images,
        productPrice: item.product_id?.price
      })) || [],
      address_snapshot: order.address_snapshot || order.address,
      shippingInfo: order.shippingInfo || {},
      notes: order.notes,
      decline_reason: order.decline_reason,
      created_at: order.created_at || (order.date ? new Date(order.date) : new Date()),
      updated_at: order.updated_at || (order.date ? new Date(order.date) : new Date())
    }));

    // Calculate summary statistics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => {
      return sum + (order.totals?.grand_total || order.amount || 0);
    }, 0);

    const ordersByStatus = orders.reduce((acc, order) => {
      const status = order.order_status || order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const ordersByPaymentMethod = orders.reduce((acc, order) => {
      const method = order.payment_method || order.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    console.log(`✅ [${requestId}] Customer orders retrieved successfully:`, {
      customerId,
      customerName: customer.name,
      totalOrders,
      totalSpent,
      ordersByStatus
    });

    return sendSuccessResponse(res, {
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email
      },
      orders: formattedOrders,
      summary: {
        totalOrders,
        totalSpent,
        averageOrderValue: totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0,
        ordersByStatus,
        ordersByPaymentMethod
      }
    }, 'Customer orders retrieved successfully', {
      customerId,
      ordersCount: orders.length,
      requestId
    });

  } catch (error) {
    const totalDuration = Date.now() - (req.startTime || Date.now());
    console.error(`❌ [${requestId}] Get customer orders error after ${totalDuration}ms:`, error.message);
    console.error(`❌ [${requestId}] Error stack:`, error.stack);
    console.error(`❌ [${requestId}] Error name:`, error.name);
    
    // Enhanced error categorization for customer orders
    let errorCategory = 'unknown_error';
    let errorMessage = 'Failed to fetch customer orders';
    let statusCode = 500;
    let userFriendlyMessage = 'Unable to load customer orders. Please try again.';
    
    if (error.name === 'CastError' && error.path === '_id') {
      errorCategory = 'invalid_customer_id';
      errorMessage = 'Invalid customer ID format';
      statusCode = 400;
      userFriendlyMessage = 'Invalid customer ID. Please check the customer ID and try again.';
    } else if (error.name === 'MongoTimeoutError' || error.message?.includes('timeout')) {
      errorCategory = 'timeout_error';
      errorMessage = 'Customer orders query timed out';
      statusCode = 504;
      userFriendlyMessage = 'Customer orders are taking longer than usual to load. Please try again.';
    } else if (error.name === 'MongoNetworkError' || error.message?.includes('connection')) {
      errorCategory = 'connection_error';
      errorMessage = 'Database connection failed';
      statusCode = 503;
      userFriendlyMessage = 'Database connection issue. Please try again in a moment.';
    } else if (error.message?.includes('populate') || error.message?.includes('ref')) {
      errorCategory = 'population_error';
      errorMessage = 'Failed to populate order product data';
      statusCode = 500;
      userFriendlyMessage = 'Error loading complete order details. Please try again.';
    }

    // Log detailed error information
    console.error(`🔍 [${requestId}] Customer orders error analysis:`, {
      category: errorCategory,
      name: error.name,
      code: error.code,
      message: error.message,
      customerId: req.params?.customerId,
      adminUser: req.admin?.email,
      dbConnectionState: orderModel.db.readyState,
      timestamp: new Date().toISOString(),
      duration: `${totalDuration}ms`
    });

    // Log comprehensive error details
    try {
      await logDetailedError('getCustomerOrders', error, {
        customerId: req.params?.customerId,
        adminUser: req.admin?.email,
        dbConnectionState: orderModel.db.readyState,
        requestHeaders: req.headers,
        userAgent: req.get('User-Agent')
      }, requestId);
      
      await logPerformanceMetrics('customer_orders_error', totalDuration, {
        errorCategory,
        errorName: error.name,
        errorCode: error.code,
        statusCode,
        customerId: req.params?.customerId,
        adminUser: req.admin?.email,
        dbConnectionState: orderModel.db.readyState
      }, requestId);
    } catch (loggingError) {
      console.warn(`⚠️ [${requestId}] Failed to log customer orders error details:`, loggingError.message);
    }

    return sendErrorResponse(res, userFriendlyMessage, statusCode, {
      message: error.message,
      requestId,
      errorCategory,
      duration: `${totalDuration}ms`,
      timestamp: new Date().toISOString(),
      customerId: req.params?.customerId,
      // Include additional context for debugging (only in development)
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        adminUser: req.admin?.email
      })
    });
  }
};