import "dotenv/config";

// Centralized configuration for the backend application
const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    adminUrl: process.env.ADMIN_URL || 'http://localhost:5174'
  },

  // Database Configuration
  database: {
    mongoUri: process.env.MONGODB_URI,
    dbName: 'ecommerce_kharido'
  },

  // Authentication Configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD
  },

  // Cloudinary Configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },

  // Payment Configuration
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET
  }
};

// Validation function to ensure required config is present
export const validateConfig = () => {
  const requiredFields = [
    'database.mongoUri',
    'auth.jwtSecret',
    'cloudinary.cloudName',
    'cloudinary.apiKey',
    'cloudinary.apiSecret'
  ];

  const missing = [];
  
  requiredFields.forEach(field => {
    const keys = field.split('.');
    let value = config;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    if (!value) {
      missing.push(field);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required configuration:', missing);
    return false;
  }

  return true;
};

export default config;