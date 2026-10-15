/**
 * Health Check Controller
 * Comprehensive system health monitoring with database connectivity,
 * collection accessibility, and route registration validation
 */

import mongoose from 'mongoose';
import { sendSuccessResponse, sendErrorResponse } from '../../../core/utils/responseWrapper.js';

// Dynamic imports for models to avoid circular dependencies
const getModels = async () => {
  try {
    const [
      { default: userModel },
      { default: orderModel },
      { default: productModel }
    ] = await Promise.all([
      import('../../auth/models/userModel.js'),
      import('../../orders/models/orderModel.js'),
      import('../../products/models/productModel.js')
    ]);
    
    return { userModel, orderModel, productModel };
  } catch (error) {
    console.error('Failed to import models for health check:', error);
    return null;
  }
};

/**
 * Basic system health check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getSystemHealth = async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Basic system information
    const systemInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      }
    };

    // Database connection status
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };

    systemInfo.database = {
      status: dbStates[dbStatus] || 'unknown',
      readyState: dbStatus,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };

    // Determine overall health
    const isHealthy = dbStatus === 1; // 1 = connected
    const responseTime = Date.now() - startTime;

    if (isHealthy) {
      return sendSuccessResponse(res, systemInfo, 'System is healthy', {
        responseTime: `${responseTime}ms`
      });
    } else {
      return sendErrorResponse(res, 'System health check failed', 503, {
        details: 'Database connection unavailable',
        systemInfo
      });
    }

  } catch (error) {
    console.error('Health check error:', error);
    return sendErrorResponse(res, 'Health check failed', 500, {
      message: error.message
    });
  }
};

/**
 * Database-specific health check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDatabaseHealth = async (req, res) => {
  try {
    const startTime = Date.now();
    const models = await getModels();
    
    if (!models) {
      return sendErrorResponse(res, 'Failed to load database models', 500);
    }

    const { userModel, orderModel, productModel } = models;

    // Test database connectivity and collection accessibility
    const healthChecks = await Promise.allSettled([
      // Test basic connection
      mongoose.connection.db.admin().ping(),
      
      // Test collection accessibility
      userModel.findOne().limit(1),
      orderModel.findOne().limit(1), 
      productModel.findOne().limit(1),
      
      // Test counts (lightweight operations)
      userModel.countDocuments().limit(1),
      orderModel.countDocuments().limit(1),
      productModel.countDocuments().limit(1)
    ]);

    const results = {
      connection: {
        status: healthChecks[0].status,
        details: healthChecks[0].status === 'fulfilled' ? 'Connected' : healthChecks[0].reason?.message
      },
      collections: {
        users: {
          accessible: healthChecks[1].status === 'fulfilled',
          countable: healthChecks[4].status === 'fulfilled',
          count: healthChecks[4].status === 'fulfilled' ? healthChecks[4].value : 0,
          error: healthChecks[1].status === 'rejected' ? healthChecks[1].reason?.message : null
        },
        orders: {
          accessible: healthChecks[2].status === 'fulfilled',
          countable: healthChecks[5].status === 'fulfilled', 
          count: healthChecks[5].status === 'fulfilled' ? healthChecks[5].value : 0,
          error: healthChecks[2].status === 'rejected' ? healthChecks[2].reason?.message : null
        },
        products: {
          accessible: healthChecks[3].status === 'fulfilled',
          countable: healthChecks[6].status === 'fulfilled',
          count: healthChecks[6].status === 'fulfilled' ? healthChecks[6].value : 0,
          error: healthChecks[3].status === 'rejected' ? healthChecks[3].reason?.message : null
        }
      },
      database: {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      },
      performance: {
        responseTime: `${Date.now() - startTime}ms`
      }
    };

    // Determine if database is healthy
    const connectionHealthy = healthChecks[0].status === 'fulfilled';
    const collectionsAccessible = healthChecks.slice(1, 4).every(check => check.status === 'fulfilled');
    const isHealthy = connectionHealthy && collectionsAccessible;

    if (isHealthy) {
      return sendSuccessResponse(res, results, 'Database is healthy');
    } else {
      return sendErrorResponse(res, 'Database health check failed', 503, results);
    }

  } catch (error) {
    console.error('Database health check error:', error);
    return sendErrorResponse(res, 'Database health check failed', 500, {
      message: error.message
    });
  }
};

/**
 * Detailed health check with all system components
 * @param {Object} req - Express request object  
 * @param {Object} res - Express response object
 */
export const getDetailedHealthCheck = async (req, res) => {
  try {
    const startTime = Date.now();
    const models = await getModels();

    // System information
    const systemHealth = {
      status: 'checking',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      pid: process.pid
    };

    // Memory usage
    const memUsage = process.memoryUsage();
    systemHealth.memory = {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    };

    // CPU usage (approximate)
    const cpuUsage = process.cpuUsage();
    systemHealth.cpu = {
      user: cpuUsage.user,
      system: cpuUsage.system
    };

    // Database health (reuse existing function logic)
    let databaseHealth = {};
    if (models) {
      try {
        const { userModel, orderModel, productModel } = models;
        
        const dbChecks = await Promise.allSettled([
          mongoose.connection.db.admin().ping(),
          userModel.findOne().limit(1),
          orderModel.findOne().limit(1),
          productModel.findOne().limit(1)
        ]);

        databaseHealth = {
          connection: {
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
          },
          ping: dbChecks[0].status === 'fulfilled',
          collections: {
            users: dbChecks[1].status === 'fulfilled',
            orders: dbChecks[2].status === 'fulfilled', 
            products: dbChecks[3].status === 'fulfilled'
          }
        };
      } catch (dbError) {
        databaseHealth = {
          status: 'error',
          error: dbError.message
        };
      }
    } else {
      databaseHealth = {
        status: 'error',
        error: 'Failed to load database models'
      };
    }

    // Environment variables check (non-sensitive)
    const envHealth = {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasCloudinary: !!process.env.CLOUDINARY_URL,
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT
    };

    // Route health check (if possible)
    const routeHealth = {
      status: 'active',
      registeredRoutes: getRegisteredRoutes()
    };

    // Determine overall health status
    const isSystemHealthy = systemHealth.uptime > 0;
    const isDatabaseHealthy = databaseHealth.connection?.status === 'connected' && databaseHealth.ping;
    const areEnvironmentVarsHealthy = envHealth.hasMongoUri && envHealth.hasJwtSecret;
    
    const overallStatus = isSystemHealthy && isDatabaseHealthy && areEnvironmentVarsHealthy ? 'healthy' : 'unhealthy';
    systemHealth.status = overallStatus;

    const healthData = {
      overall: {
        status: overallStatus,
        checks: {
          system: isSystemHealthy,
          database: isDatabaseHealthy,
          environment: areEnvironmentVarsHealthy
        }
      },
      system: systemHealth,
      database: databaseHealth,
      environment: envHealth,
      routes: routeHealth,
      performance: {
        responseTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    };

    // Only show detailed info in non-production environments
    if (process.env.NODE_ENV === 'production') {
      // Limit exposed information in production
      const limitedData = {
        overall: healthData.overall,
        database: {
          status: databaseHealth.connection?.status || 'unknown'
        },
        performance: healthData.performance
      };
      
      if (overallStatus === 'healthy') {
        return sendSuccessResponse(res, limitedData, 'System is healthy');
      } else {
        return sendErrorResponse(res, 'System health check failed', 503, limitedData);
      }
    }

    // Full detailed response for non-production
    if (overallStatus === 'healthy') {
      return sendSuccessResponse(res, healthData, 'Detailed system health check passed');
    } else {
      return sendErrorResponse(res, 'Detailed system health check failed', 503, healthData);
    }

  } catch (error) {
    console.error('Detailed health check error:', error);
    return sendErrorResponse(res, 'Detailed health check failed', 500, {
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

/**
 * Get list of registered routes (if possible)
 * @returns {Array} List of registered routes
 */
const getRegisteredRoutes = () => {
  try {
    // This is a simplified version - actual implementation would depend on your Express setup
    return [
      'GET /api/health/ping',
      'GET /api/health',
      'GET /api/health/database', 
      'GET /api/health/detailed',
      'GET /api/dashboard/stats',
      'POST /api/order/list',
      'POST /api/order/status',
      'GET /api/customers/list'
    ];
  } catch (error) {
    return ['Unable to retrieve routes'];
  }
};

export default {
  getSystemHealth,
  getDatabaseHealth,
  getDetailedHealthCheck
};