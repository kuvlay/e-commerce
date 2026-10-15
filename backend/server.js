import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import config, { validateConfig } from "./core/config/index.js";
import connectDB from "./core/config/mongodb.js";
import connectCloudinary from "./core/config/cloudinary.js";
import userRouter from "./features/auth/routes/userRoutes.js";
import productRouter from "./features/products/routes/productRoute.js";
import cartRouter from "./features/orders/routes/cartRoute.js";
import orderRouter from "./features/orders/routes/orderRoute.js";
import activityRouter from "./features/orders/routes/activityRoute.js";
import contactRouter from "./features/contact/routes/contactRoute.js";
import securityRouter from "./core/middleware/securityRoute.js";
import paymentRouter from "./features/payments/routes/payment.js";
import wishlistRouter from "./features/wishlist/routes/wishlistRoute.js";
import addressRouter from "./features/profile/routes/addressRoute.js";
import profileRouter from "./features/profile/routes/profileRoute.js";
import reviewRouter from "./features/reviews/routes/reviewRoutes.js";
import customerRouter from "./features/customers/routes/customerRoutes.js";
import dashboardRouter from "./features/dashboard/routes/dashboardRoutes.js";

// Import security middleware
import { publicRateLimit, authRateLimit, adminRateLimit, requestMetricsMiddleware } from "./core/middleware/security/rateLimiter.js";
import { checkTokenRevocation } from "./core/middleware/security/tokenRevocation.js";
import { securityPerformanceMiddleware } from "./core/middleware/security/performanceMonitor.js";
import { validateUserRegistration, validateUserLogin } from "./core/middleware/security/validation.js";
import { validateEmailMiddleware, botProtectionMiddleware, signupProtectionMiddleware, piiDetectionMiddleware } from "./core/middleware/security/arcjetEnhancements.js";
import adminAuth from "./features/auth/middleware/adminAuth.js";

// Validate configuration before starting server
if (!validateConfig()) {
  console.error('❌ Server startup failed due to missing configuration');
  process.exit(1);
}

//App Config
const app = express();
const port = config.server.port;
connectDB();
connectCloudinary();
//Middlewares
app.use(express.json());

// CORS configuration for multiple origins
const getAllowedOrigins = () => {
  const developmentOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175'
  ];

  const productionOrigins = [
    'https://e-commerce-v8m7.vercel.app',           // Frontend production
    'https://e-commerce-admin-tau-three.vercel.app', // Admin production
    config.server?.frontendUrl,                      // From env
    config.server?.adminUrl                          // From env
  ].filter(Boolean); // Remove undefined values

  return [...developmentOrigins, ...productionOrigins];
};

const corsOptions = {
  origin: function (origin, callback) {
    // In development environment, be more permissive
    if (process.env.NODE_ENV === 'development') {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost requests and known development origins
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      
      // For other origins in development, be permissive but log for debugging
      console.log(`[DEV] CORS allowing origin: ${origin}`);
      return callback(null, true);
    }
    
    // Production CORS logic
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      console.log(`Allowed origins:`, allowedOrigins);
      // Return a JSON response on CORS failures to ease debugging
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'token'
  ],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Add comprehensive request logging middleware for debugging
app.use((req, res, next) => {
  // Verbose logging only in development or when security logs are enabled
  const enableVerboseLogging = process.env.NODE_ENV !== 'production' || process.env.ENABLE_SECURITY_LOGS === 'true';
  
  if (enableVerboseLogging) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    console.log(`Headers:`, {
      origin: req.headers.origin,
      token: req.headers.token ? 'Present' : 'Missing',
      'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
    });
    
    // Special logging for dashboard routes
    if (req.url.includes('/dashboard')) {
      console.log(`🎯 Dashboard route accessed: ${req.url}`);
      console.log(`🔑 Token status: ${req.headers.token ? 'Present' : 'Missing'}`);
    }
  }
  
  next();
});

// Simplified security middleware for development
app.use(checkTokenRevocation); // Keep token revocation check only

//API endpoints - Simplified for development
app.use("/api/user", userRouter); // Temporarily disable heavy middleware for admin login
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/activity", activityRouter);
app.use("/api/contact", contactRouter);
app.use("/api/security", securityRouter); // Security dashboard without heavy rate limiting
app.use("/api/payment", paymentRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/address", addressRouter);
app.use("/api/profile", profileRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/customers", customerRouter);
app.use("/api/dashboard", dashboardRouter);

// Log route registrations for debugging
console.log('✅ Routes registered successfully:');
console.log('  👤 /api/user - User authentication routes');
console.log('  📱 /api/product - Product management routes');
console.log('  🛍 /api/cart - Shopping cart routes');
console.log('  📄 /api/order - Order management routes');
console.log('  📈 /api/dashboard - Dashboard statistics routes');
console.log('  👥 /api/customers - Customer management routes');
console.log('  📝 /api/activity - Activity logging routes');
console.log('  📧 /api/contact - Contact form routes');
console.log('  🔒 /api/security - Security monitoring routes');
console.log('  💳 /api/payment - Payment processing routes');
console.log('  ❤️ /api/wishlist - Wishlist management routes');
console.log('  📍 /api/address - Address management routes');
console.log('  👤 /api/profile - Profile management routes');
console.log('  ⭐ /api/reviews - Review management routes');

// IMPORTANT: Dashboard route specific logging
console.log('🎆 Dashboard route mounted at: /api/dashboard');
console.log('🎆 Dashboard stats endpoint: /api/dashboard/stats');

// Cache for health endpoint model imports
let cachedModels = null;
async function getModels() {
  if (cachedModels) return cachedModels;
  
  const [userModel, orderModel, productModel] = await Promise.all([
    import('./features/auth/models/userModel.js'),
    import('./features/orders/models/orderModel.js'),
    import('./features/products/models/productModel.js')
  ]);
  
  cachedModels = {
    userModel: userModel.default,
    orderModel: orderModel.default,
    productModel: productModel.default
  };
  
  return cachedModels;
}

// Helper to build health data. 'detailed' controls inclusion of sensitive/debug info.
async function buildHealthData(detailed = false) {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  };

  // Test MongoDB connectivity
  try {
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState === 1) {
      healthData.database = {
        status: 'connected'
      };
      
      // Include detailed DB info when requested
      if (detailed) {
        healthData.database.name = mongoose.default.connection.name;
        healthData.database.host = mongoose.default.connection.host;
        healthData.database.port = mongoose.default.connection.port;
      }
      
      // For detailed requests, test collection accessibility and counts
      if (detailed) {
        try {
          const { userModel, orderModel, productModel } = await getModels();
          
          const [userCount, orderCount, productCount] = await Promise.all([
            userModel.estimatedDocumentCount().catch(() => 0),
            orderModel.estimatedDocumentCount().catch(() => 0),
            productModel.estimatedDocumentCount().catch(() => 0)
          ]);
          
          healthData.collections = {
            users: { accessible: true, count: userCount },
            orders: { accessible: true, count: orderCount },
            products: { accessible: true, count: productCount }
          };
        } catch (collectionError) {
          console.error('❌ Health check: Collection access error:', collectionError);
          healthData.collections = { error: collectionError.message };
        }
      } else {
        // For public health endpoint, only check DB readyState (no model imports or counts)
        healthData.collections = { accessible: true };
      }
      
    } else {
      healthData.database = {
        status: 'disconnected',
        readyState: mongoose.default.connection.readyState
      };
    }
  } catch (dbError) {
    console.error('❌ Health check: Database error:', dbError);
    healthData.database = { status: 'error', error: dbError.message };
  }

  // Verify route registration (basic)
  healthData.routes = {
    dashboard: '/api/dashboard/stats',
    customers: '/api/customers/list',
    orders: '/api/order/list',
    products: '/api/product/list',
    health: '/api/health'
  };

  // Memory usage
  const memUsage = process.memoryUsage();
  if (detailed) {
    healthData.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    };
  } else {
    healthData.memory = {
      status: 'monitored'
    };
  }

  return healthData;
}

// Comprehensive API health check endpoint
// This endpoint is intentionally public to allow connectivity checks from admin dashboards and CI systems.
// Rate limiting is applied to prevent abuse, but authentication is NOT required.
const healthMiddleware = [publicRateLimit];

app.get("/api/health", ...healthMiddleware, async (req, res) => {
  try {
    console.log('🚑 Public health check requested at:', new Date().toISOString());
    console.log('ℹ️ Health endpoint is public and intended for quick connectivity checks.');

    const healthData = await buildHealthData(false);

    console.log('✅ Public health check completed successfully');
    res.json({
      success: true,
      health: healthData
    });
  } catch (error) {
    console.error('❌ Public health check failed:', error);
    res.status(500).json({
      success: false,
      health: {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Admin-only health endpoint for detailed system information.
// Requires admin authentication and a stricter rate limit.
app.get("/api/health/admin", adminRateLimit, adminAuth, async (req, res) => {
  try {
    console.log('🚑 Admin health check requested by admin at:', new Date().toISOString());

    const healthData = await buildHealthData(true);

    // Include additional admin-only metadata
    healthData.admin = {
      serverTime: new Date().toISOString(),
      nodeVersion: process.version,
      envVars: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        // Do NOT include secrets here; only safe configuration values
        frontendUrl: config.server?.frontendUrl || null,
        adminUrl: config.server?.adminUrl || null
      }
    };

    console.log('✅ Admin health check completed successfully');
    res.json({
      success: true,
      health: healthData
    });
  } catch (error) {
    console.error('❌ Admin health check failed:', error);
    res.status(500).json({
      success: false,
      health: {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Test endpoint to verify backend is working
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
    routes: {
      profile: "/api/user/profile",
      profileCompletion: "/api/profile/completion",
      wishlist: "/api/wishlist/add"
    }
  });
});

// Test protected endpoint
app.get("/api/test/protected", (req, res) => {
  const { token } = req.headers;
  if (!token) {
    return res.json({ success: false, message: "No token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      success: true,
      message: "Protected endpoint working!",
      userId: decoded.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ success: false, message: "Invalid token" });
  }
});

// Diagnostic endpoint to check CORS configuration
app.get("/api/debug/cors", (req, res) => {
  const allowedOrigins = getAllowedOrigins();
  res.json({
    message: "CORS Debug Info",
    allowedOrigins,
    requestOrigin: req.headers.origin,
    environment: process.env.NODE_ENV,
    frontendUrl: config.server?.frontendUrl,
    // Added for easier remote verification
    adminUrl: config.server?.adminUrl,
    skipEmailVerification: process.env.SKIP_EMAIL_VERIFICATION === 'true'
  });
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port} ❤️`);
});

// smimtiaz58
// YgDk3SE4kqmRIwjt
