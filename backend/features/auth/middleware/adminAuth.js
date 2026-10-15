import jwt from "jsonwebtoken";
import { randomUUID } from 'crypto';

// Helper function to get allowed admin emails
const getAllowedAdminEmails = () => {
  const adminEmails = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL;
  if (!adminEmails) return [];
  
  // Support both comma-separated ADMIN_EMAILS and single ADMIN_EMAIL
  return adminEmails.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
};

const adminAuth = async (req, res, next) => {
  // Generate unique request ID for tracking
  const requestId = randomUUID().substring(0, 8);
  req.requestId = requestId;
  
  // Verbose logging only in development or when security logs are enabled
  const enableVerboseLogging = process.env.NODE_ENV !== 'production' || process.env.ENABLE_SECURITY_LOGS === 'true';
  
  if (enableVerboseLogging) {
    console.log(`🔐 MIDDLEWARE [${requestId}]: Admin auth check started`);
    console.log(`🌐 MIDDLEWARE [${requestId}]: Request URL: ${req.originalUrl}`);
    console.log(`🌐 MIDDLEWARE [${requestId}]: Request Method: ${req.method}`);
  }
  
  try {
    // Support both Bearer Authorization header and custom token header for standards compliance
    let token = req.headers.token; // Legacy custom header
    
    // Check for Bearer Authorization header (preferred standard)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
      if (enableVerboseLogging) {
        console.log(`🔑 MIDDLEWARE [${requestId}]: Using Bearer Authorization header`);
      }
    } else if (token) {
      if (enableVerboseLogging) {
        console.log(`🔑 MIDDLEWARE [${requestId}]: Using custom token header (legacy)`);
      }
    }
    
    if (enableVerboseLogging) {
      console.log(`🔑 MIDDLEWARE [${requestId}]: Token received: ${token ? "Present" : "Missing"}`);
      console.log(`🕰 MIDDLEWARE [${requestId}]: Request timestamp: ${new Date().toISOString()}`);
    }
    if (!token || typeof token !== 'string') {
      if (enableVerboseLogging) {
        console.error(`❌ MIDDLEWARE [${requestId}]: Authentication failed - No token provided`);
        console.error(`❌ MIDDLEWARE [${requestId}]: Request path: ${req.originalUrl}`);
        console.error(`❌ MIDDLEWARE [${requestId}]: Request method: ${req.method}`);
        console.error(`❌ MIDDLEWARE [${requestId}]: Headers present: ${Object.keys(req.headers).join(', ')}`);
      }
      
      // Return 401 for authentication issues
      return res.status(401).json({ 
        success: false, 
        message: "Access denied. Authentication token required. Use either 'Authorization: Bearer <token>' header or 'token' header.",
        error: "MISSING_TOKEN",
        requestId
      });
    }
    
    // Verify and decode token
    if (enableVerboseLogging) {
      console.log(`🔍 MIDDLEWARE [${requestId}]: Verifying JWT token...`);
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (enableVerboseLogging) {
      console.log(`✅ MIDDLEWARE [${requestId}]: Token decoded successfully, type: ${typeof decoded}`);
    }
    
    // Check if it's the new token format (object) or old format (string)
    if (typeof decoded === 'object') {
      if (enableVerboseLogging) {
        console.log(`🔒 MIDDLEWARE [${requestId}]: New token format detected`);
        console.log(`🔒 MIDDLEWARE [${requestId}]: Token role: ${decoded.role}`);
        console.log(`🔒 MIDDLEWARE [${requestId}]: Token email: ${decoded.email}`);
      }
      
      // New secure token format
      const allowedEmails = getAllowedAdminEmails();
      if (decoded.role !== 'admin' || !allowedEmails.includes(decoded.email?.toLowerCase())) {
        if (enableVerboseLogging) {
          console.error(`❌ MIDDLEWARE [${requestId}]: Authorization failed - Invalid admin credentials`);
          console.error(`❌ MIDDLEWARE [${requestId}]: Token role: ${decoded.role}`);
          console.error(`❌ MIDDLEWARE [${requestId}]: Token email: ${decoded.email}`);
          console.error(`❌ MIDDLEWARE [${requestId}]: Allowed emails: ${allowedEmails.join(', ')}`);
        }
        
        // Return 403 for authorization issues
        return res.status(403).json({ 
          success: false, 
          message: "Access denied. Admin privileges required.",
          error: "INSUFFICIENT_PRIVILEGES",
          requestId
        });
      }
      
      // Check token age using JWT exp claim (standard approach)
      const currentTimestamp = Math.floor(Date.now() / 1000); // Convert to seconds for JWT compatibility
      
      if (decoded.exp && decoded.exp < currentTimestamp) {
        console.error(`❌ MIDDLEWARE [${requestId}]: Token expired (using exp claim)`);
        console.error(`❌ MIDDLEWARE [${requestId}]: Token exp: ${decoded.exp}, Current: ${currentTimestamp}`);
        
        return res.status(401).json({ 
          success: false, 
          message: "Token expired. Please login again.",
          error: "TOKEN_EXPIRED",
          requestId
        });
      }
      
      // Additional security check using custom timestamp if present (fallback)
      if (decoded.timestamp) {
        const tokenAge = Date.now() - decoded.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (tokenAge > maxAge) {
          console.error(`❌ MIDDLEWARE [${requestId}]: Token expired (using custom timestamp)`);
          console.error(`❌ MIDDLEWARE [${requestId}]: Token age: ${tokenAge}ms`);
          console.error(`❌ MIDDLEWARE [${requestId}]: Max age: ${maxAge}ms`);
          
          return res.status(401).json({ 
            success: false, 
            message: "Token expired. Please login again.",
            error: "TOKEN_EXPIRED",
            requestId
          });
        }
      }
    } else {
      if (enableVerboseLogging) {
        console.log(`🔓 MIDDLEWARE [${requestId}]: Legacy token format detected`);
      }
      // Legacy token format support (for backward compatibility)
      if (decoded !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
        console.error(`❌ MIDDLEWARE [${requestId}]: Invalid legacy token`);
        console.error(`❌ MIDDLEWARE [${requestId}]: Expected: ${process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD}`);
        
        return res.status(403).json({ 
          success: false, 
          message: "Access denied. Invalid token.",
          error: "INVALID_LEGACY_TOKEN",
          requestId
        });
      }
    }
    
    if (enableVerboseLogging) {
      console.log(`🎉 MIDDLEWARE [${requestId}]: Admin authentication successful`);
      console.log(`🎯 MIDDLEWARE [${requestId}]: Proceeding to route: ${req.originalUrl}`);
    }
    
    // Add admin info to request for use in routes
    req.admin = {
      email: typeof decoded === 'object' ? decoded.email : getAllowedAdminEmails()[0],
      role: 'admin',
      requestId
    };
    
    next();
  } catch (error) {
    if (enableVerboseLogging) {
      console.error(`💥 MIDDLEWARE [${requestId}]: Authentication error: ${error.message}`);
      console.error(`💥 MIDDLEWARE [${requestId}]: Request path: ${req.originalUrl}`);
      console.error(`💥 MIDDLEWARE [${requestId}]: Error type: ${error.name}`);
      console.error(`💥 MIDDLEWARE [${requestId}]: Error stack: ${error.stack}`);
    }
    
    // Handle specific JWT errors with proper status codes
    if (error.name === 'TokenExpiredError') {
      if (enableVerboseLogging) {
        console.error(`❌ MIDDLEWARE [${requestId}]: Token expired error`);
      }
      return res.status(401).json({ 
        success: false, 
        message: "Token expired. Please login again.",
        error: "TOKEN_EXPIRED",
        requestId
      });
    } else if (error.name === 'JsonWebTokenError') {
      if (enableVerboseLogging) {
        console.error(`❌ MIDDLEWARE [${requestId}]: Invalid JWT format error`);
      }
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token format. Please login again.",
        error: "INVALID_TOKEN_FORMAT",
        requestId
      });
    } else if (error.name === 'NotBeforeError') {
      if (enableVerboseLogging) {
        console.error(`❌ MIDDLEWARE [${requestId}]: Token not active yet`);
      }
      return res.status(401).json({ 
        success: false, 
        message: "Token not active yet.",
        error: "TOKEN_NOT_ACTIVE",
        requestId
      });
    }
    
    if (enableVerboseLogging) {
      console.error(`💥 MIDDLEWARE [${requestId}]: Unexpected auth error:`, error);
    }
    // Return 500 for unexpected errors, not 404
    res.status(500).json({ 
      success: false, 
      message: "Internal authentication error",
      error: "INTERNAL_AUTH_ERROR",
      requestId
    });
  }
};

export default adminAuth;
