import userModel from "../../auth/models/userModel.js";
import orderModel from "../../orders/models/orderModel.js";
import productModel from "../../products/models/productModel.js";
import { normalizeOrderStatus } from "../../../core/utils/statusHelpers.js";
import { 
  sendDashboardResponse, 
  sendErrorResponse, 
  sendServiceUnavailableResponse,
  sendSuccessResponse 
} from "../../../core/utils/responseWrapper.js";
import { resolveCustomerName } from "../../../core/utils/customerResolver.js";
import { 
  logDetailedError,
  logPerformanceMetrics,
  logAuditTrail
} from "../../orders/utils/errorLogger.js";

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    console.log('📈 Dashboard stats request started at:', new Date().toISOString());
    console.log('🔑 Admin info:', req.admin);
    console.log('🔗 MongoDB connection state:', {
      readyState: userModel.db.readyState,
      host: userModel.db.host,
      port: userModel.db.port
    });
    
    // Test MongoDB connection
    try {
      await userModel.findOne().limit(1);
      console.log('✅ MongoDB connection verified');
    } catch (dbError) {
      console.error('❌ MongoDB connection failed:', dbError);
      return sendServiceUnavailableResponse(res, 'Database connection unavailable');
    }
    
    // Get current date and calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    console.log('📅 Date ranges calculated:', {
      startOfMonth: startOfMonth.toISOString(),
      startOfLastMonth: startOfLastMonth.toISOString(),
      endOfLastMonth: endOfLastMonth.toISOString()
    });

    console.log('📊 Fetching total counts and revenue in parallel...');
    const [      totalUsers, 
      totalProducts, 
      totalOrders,
      revenueAgg,
      currentMonthOrders,
      lastMonthOrders
    ] = await Promise.all([
      userModel.countDocuments({
        role: { $ne: 'admin' },
        $or: [
          { accountStatus: 'active' },
          { accountStatus: { $exists: false } }
        ]
      })
        .catch(err => {
          console.error('❌ Error counting users:', err);
          return 0;
        }),
      productModel.countDocuments()
        .catch(err => {
          console.error('❌ Error counting products:', err);
          return 0;
        }),
      orderModel.countDocuments()
        .catch(err => {
          console.error('❌ Error counting orders:', err);
          return 0;
        }),
      // Use aggregation to compute total revenue instead of find + reduce
      orderModel.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $toDouble: {
                  $ifNull: ["$totals.grand_total", "$amount"]
                }
              }
            }
          }
        }
      ]).catch(err => {
        console.error('❌ Error aggregating revenue:', err);
        return [{ totalRevenue: 0 }];
      }),
      // Monthly orders queries in parallel
      orderModel.find({
        $or: [
          { created_at: { $gte: startOfMonth } },
          { date: { $gte: startOfMonth.getTime() } }
        ]
      }).catch(err => {
        console.error('❌ Error fetching current month orders:', err);
        return [];
      }),
      orderModel.find({
        $or: [
          { 
            created_at: { 
              $gte: startOfLastMonth, 
              $lte: endOfLastMonth 
            } 
          },
          { 
            date: { 
              $gte: startOfLastMonth.getTime(), 
              $lte: endOfLastMonth.getTime() 
            } 
          }
        ]
      }).catch(err => {
        console.error('❌ Error fetching last month orders:', err);
        return [];
      })
    ]);
    
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    
    console.log('📊 Total counts:', { totalUsers, totalProducts, totalOrders, totalRevenue });
    
    // Debug empty results
    if (totalUsers === 0) {
      console.log('⚠️ No active users found - checking user collection structure');
      const sampleUsers = await userModel.find({}).limit(3).select('role accountStatus name email');
      console.log('📝 Sample users:', sampleUsers);
    }
    
    if (totalOrders === 0) {
      console.log('⚠️ No orders found - checking order collection structure');
      const sampleOrders = await orderModel.find({}).limit(3).select('order_status status amount created_at date');
      console.log('📝 Sample orders:', sampleOrders);
    }

    const currentMonthRevenue = Number(currentMonthOrders.reduce((sum, order) => {
      return sum + Number(order.totals?.grand_total || order.amount || 0);
    }, 0));

    const lastMonthRevenue = Number(lastMonthOrders.reduce((sum, order) => {
      return sum + Number(order.totals?.grand_total || order.amount || 0);
    }, 0));
    
    console.log('📈 Monthly revenue data:', {
      currentMonthOrders: currentMonthOrders.length,
      lastMonthOrders: lastMonthOrders.length,
      currentMonthRevenue,
      lastMonthRevenue
    });

    // Calculate revenue trend
    const revenueTrend = lastMonthRevenue > 0 
      ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : currentMonthRevenue > 0 ? 100 : 0;

    console.log('📈 Fetching dashboard data in parallel...');
    const [
      ordersByStatus,
      recentOrders,
      topProductsAgg,
      currentMonthUsers,
      lastMonthUsers
    ] = await Promise.all([
      // Get orders by status with Atlas-compatible normalization
      orderModel.aggregate([
        {
          $addFields: {
            normalized_status: {
              $switch: {
                branches: [
                  { case: { $eq: ['$order_status', 'Order Placed'] }, then: 'Placed' },
                  { case: { $eq: ['$order_status', 'Out For Delivery'] }, then: 'OutForDelivery' },
                  { case: { $ne: ['$order_status', null] }, then: '$order_status' },
                  { case: { $eq: ['$status', 'Order Placed'] }, then: 'Placed' },
                  { case: { $eq: ['$status', 'Out For Delivery'] }, then: 'OutForDelivery' },
                  { case: { $ne: ['$status', null] }, then: '$status' }
                ],
                default: 'Pending'
              }
            }
          }
        },
        {
          $group: {
            _id: '$normalized_status',
            count: { $sum: 1 }
          }
        }
      ]).catch(err => {
        console.error('❌ Error aggregating orders by status:', err);
        return [];
      }),
      
      // Get recent orders
      orderModel
        .find({})
        .populate('user_id', 'name email')
        .sort({ created_at: -1, date: -1 })
        .limit(10)
        .catch(err => {
          console.error('❌ Error fetching recent orders:', err);
          console.error('❌ Populate error details:', err.message);
          return [];
        }),
        
      // Get top products
      orderModel.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.title",
            totalSold: { $sum: "$items.qty" },
            totalRevenue: { 
              $sum: { 
                $multiply: ["$items.price", "$items.qty"] 
              } 
            }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 }
      ]).catch(err => {
        console.error('❌ Error aggregating top products:', err);
        return [];
      }),
      
      // Customer growth queries
      userModel.countDocuments({
        role: { $ne: 'admin' },
        $or: [
          { accountStatus: 'active' },
          { accountStatus: { $exists: false } }
        ],
        createdAt: { $gte: startOfMonth }
      }).catch(err => {
        console.error('❌ Error counting current month users:', err);
        return 0;
      }),
      
      userModel.countDocuments({
        role: { $ne: 'admin' },
        $or: [
          { accountStatus: 'active' },
          { accountStatus: { $exists: false } }
        ],
        createdAt: { 
          $gte: startOfLastMonth, 
          $lte: endOfLastMonth 
        }
      }).catch(err => {
        console.error('❌ Error counting last month users:', err);
        return 0;
      })
    ]);

    // Format recent orders
    console.log('📄 Formatting recent orders, count:', recentOrders.length);
    if (recentOrders.length === 0) {
      console.log('⚠️ No recent orders found - checking populate results');
      const unpopulatedOrders = await orderModel.find({}).limit(3).select('user_id items order_status status');
      console.log('📝 Sample unpopulated orders:', unpopulatedOrders);
    }
    
    const formattedRecentOrders = recentOrders.map((order, index) => {
      // Use enhanced customer name resolution
      const nameResolution = resolveCustomerName(order, {
        includeOrderId: true,
        allowEmailFallback: true
      });
      
      if (index < 3) {
        console.log(`📝 Dashboard order ${order._id} customer resolution:`, {
          resolvedName: nameResolution.name,
          source: nameResolution.source,
          confidence: nameResolution.confidence,
          originalUserName: order.user_id?.name,
          originalAddressName: order.address_snapshot?.name
        });
      }
      
      return {
        _id: order._id,
        customerName: nameResolution.name,
        customerEmail: order.user_id?.email || order.address?.email || null,
        itemCount: order.items?.length || 0,
        total: order.totals?.grand_total || order.amount || 0,
        status: normalizeOrderStatus(order.order_status || order.status || 'Pending'),
        paymentMethod: order.payment_method || order.paymentMethod || 'Unknown',
        paymentStatus: order.payment_status || (order.payment ? 'Paid' : 'Pending'),
        date: order.created_at || new Date(order.date),
        isLegacy: !order.created_at, // Flag to identify legacy orders
        nameResolution: {
          source: nameResolution.source,
          confidence: nameResolution.confidence
        }
      };
    });

    // Calculate monthly trend for orders
    const currentMonthOrderCount = currentMonthOrders.length;
    const lastMonthOrderCount = lastMonthOrders.length;
    const ordersTrend = lastMonthOrderCount > 0 
      ? Math.round(((currentMonthOrderCount - lastMonthOrderCount) / lastMonthOrderCount) * 100)
      : currentMonthOrderCount > 0 ? 100 : 0;

    // Process results from parallel queries
    const statusCounts = ordersByStatus.reduce((acc, item) => {
      acc[item._id || 'unknown'] = item.count;
      return acc;
    }, {});
    
    console.log('📈 Parallel queries completed:', {
      ordersByStatusCount: ordersByStatus.length,
      recentOrdersCount: recentOrders.length,
      topProductsCount: topProductsAgg.length,
      statusCounts
    });

    const customersTrend = lastMonthUsers > 0 
      ? Math.round(((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100)
      : currentMonthUsers > 0 ? 100 : 0;
    
    console.log('👥 Customer growth data:', {
      currentMonthUsers,
      lastMonthUsers,
      customersTrend
    });
    
    const statsResponse = {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      currentMonthRevenue,
      lastMonthRevenue,
      revenueTrend,
      ordersTrend,
      customersTrend,
      ordersByStatus: statusCounts,
      recentOrders: formattedRecentOrders,
      topProducts: topProductsAgg.map(product => ({
        name: product._id || 'Unknown Product',
        totalSold: product.totalSold,
        totalRevenue: product.totalRevenue
      })),
      // Ensure all fields expected by admin UI are included
      revenue: totalRevenue,
      users: totalUsers,
      orders: totalOrders,
      products: totalProducts
    };
    
    console.log('✅ Dashboard stats compiled successfully');
    console.log('📈 Response summary:', {
      totalUsers: statsResponse.totalUsers,
      totalOrders: statsResponse.totalOrders,
      totalRevenue: statsResponse.totalRevenue,
      recentOrdersCount: statsResponse.recentOrders.length,
      topProductsCount: statsResponse.topProducts.length
    });

    return sendDashboardResponse(res, statsResponse, 'Dashboard statistics retrieved successfully');

  } catch (error) {
    const totalDuration = Date.now() - (req.startTime || Date.now());
    console.error(`🔴 Dashboard stats error after ${totalDuration}ms:`, error);
    console.error('🔴 Error stack:', error.stack);
    console.error('🔴 Error name:', error.name);
    
    // Enhanced error categorization and logging for dashboard
    let errorCategory = 'unknown_error';
    let errorMessage = 'Failed to fetch dashboard statistics';
    let statusCode = 500;
    let userFriendlyMessage = 'Unable to load dashboard data. Please try refreshing the page.';
    
    if (error.name === 'MongoTimeoutError' || error.message?.includes('timeout')) {
      errorCategory = 'timeout_error';
      errorMessage = 'Database query timed out';
      statusCode = 504;
      userFriendlyMessage = 'Dashboard is taking longer than usual to load. Please try again.';
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
      errorMessage = 'Data aggregation failed';
      statusCode = 500;
      userFriendlyMessage = 'Error processing dashboard data. Please try again.';
    } else if (error.name === 'TypeError' && error.message?.includes('Cannot read property')) {
      errorCategory = 'data_structure_error';
      errorMessage = 'Invalid data structure in dashboard query';
      statusCode = 500;
      userFriendlyMessage = 'Data format issue detected. Please contact support if this persists.';
    }

    // Log detailed error information for debugging
    console.error(`🔍 Dashboard error analysis:`, {
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
      console.log(`📊 Logging dashboard error details...`);
      const dashboardRequestId = `DASHBOARD_ERROR_${Date.now()}`;
      
      await logDetailedError('getDashboardStats', error, {
        adminUser: req.admin?.email,
        dbConnectionState: userModel.db.readyState,
        requestHeaders: req.headers,
        userAgent: req.get('User-Agent')
      }, dashboardRequestId);
      
      await logPerformanceMetrics('dashboard_error', totalDuration, {
        errorCategory,
        errorName: error.name,
        errorCode: error.code,
        statusCode,
        adminUser: req.admin?.email,
        dbConnectionState: userModel.db.readyState
      }, dashboardRequestId);
    } catch (loggingError) {
      console.warn(`⚠️ Failed to log dashboard error details:`, loggingError.message);
    }
    
    return sendErrorResponse(res, userFriendlyMessage, statusCode, {
      message: error.message,
      name: error.name,
      timestamp: new Date().toISOString(),
      errorCategory,
      duration: `${totalDuration}ms`,
      // Include additional context for debugging (only in development)
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        adminUser: req.admin?.email
      })
    });
  }
};

// Get monthly revenue trend (for charts)
export const getMonthlyRevenueTrend = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const monthsToFetch = parseInt(months);
    
    const trends = [];
    const now = new Date();
    
    for (let i = monthsToFetch - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthOrders = await orderModel.find({
        $or: [
          { 
            created_at: { 
              $gte: startDate, 
              $lte: endDate 
            } 
          },
          { 
            date: { 
              $gte: startDate.getTime(), 
              $lte: endDate.getTime() 
            } 
          }
        ]
      });

      const monthRevenue = Number(monthOrders.reduce((sum, order) => {
        return sum + Number(order.totals?.grand_total || order.amount || 0);
      }, 0));

      trends.push({
        month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        orderCount: monthOrders.length
      });
    }

    return sendSuccessResponse(res, { trends }, 'Monthly revenue trends retrieved successfully', {
      monthsRequested: monthsToFetch,
      monthsReturned: trends.length
    });

  } catch (error) {
    console.error('Monthly revenue trend error:', error);
    return sendErrorResponse(res, 'Failed to fetch revenue trends', 500, {
      message: error.message
    });
  }
};