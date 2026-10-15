#!/usr/bin/env node

/**
 * Backend Environment Validation Utility
 * Validates that all required environment variables are present and properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required environment variables for backend
const REQUIRED_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL',
  'ADMIN_URL'
];

// Optional but recommended variables
const OPTIONAL_VARS = [
  'JWT_EXPIRE',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
];

// Validation patterns
const VALIDATION_PATTERNS = {
  MONGODB_URI: /^mongodb(\+srv)?:\/\/.+/,
  JWT_SECRET: /.{32,}/, // At least 32 characters
  PORT: /^\d+$/,
  NODE_ENV: /^(development|production|test)$/,
  FRONTEND_URL: /^https?:\/\/.+/,
  ADMIN_URL: /^https?:\/\/.+/,
  CLOUDINARY_API_KEY: /^\d+$/,
  RAZORPAY_KEY_ID: /^rzp_(test_|live_).+/,
  RAZORPAY_KEY_SECRET: /^.{24,}$/
};

function validateEnvironment() {
  console.log('🔍 Validating Backend Environment Variables...\n');
  
  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found in backend directory');
    console.log('💡 Copy .env.example to .env and configure your variables');
    process.exit(1);
  }

  // Load environment variables
  dotenv.config({ path: envPath });

  let hasErrors = false;
  let hasWarnings = false;

  // Validate required variables
  console.log('📋 Required Variables:');
  REQUIRED_VARS.forEach(varName => {
    const value = process.env[varName];
    
    if (!value) {
      console.error(`❌ ${varName}: Missing (required)`);
      hasErrors = true;
    } else if (VALIDATION_PATTERNS[varName] && !VALIDATION_PATTERNS[varName].test(value)) {
      console.error(`❌ ${varName}: Invalid format`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: OK`);
    }
  });

  // Check optional variables
  console.log('\n📋 Optional Variables:');
  OPTIONAL_VARS.forEach(varName => {
    const value = process.env[varName];
    
    if (!value) {
      console.warn(`⚠️  ${varName}: Not set (optional)`);
      hasWarnings = true;
    } else if (VALIDATION_PATTERNS[varName] && !VALIDATION_PATTERNS[varName].test(value)) {
      console.warn(`⚠️  ${varName}: Invalid format`);
      hasWarnings = true;
    } else {
      console.log(`✅ ${varName}: OK`);
    }
  });

  // Security checks
  console.log('\n🔒 Security Checks:');
  
  // Check JWT secret strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    if (jwtSecret.length < 32) {
      console.warn('⚠️  JWT_SECRET: Should be at least 32 characters long');
      hasWarnings = true;
    } else if (jwtSecret === 'your_jwt_secret_key_here') {
      console.error('❌ JWT_SECRET: Using default example value (security risk)');
      hasErrors = true;
    } else {
      console.log('✅ JWT_SECRET: Strong');
    }
  }

  // Check for default values
  const defaultValues = {
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'admin123',
    CLOUDINARY_CLOUD_NAME: 'your_cloudinary_cloud_name',
    CLOUDINARY_API_KEY: 'your_cloudinary_api_key',
    CLOUDINARY_API_SECRET: 'your_cloudinary_api_secret'
  };

  Object.entries(defaultValues).forEach(([key, defaultValue]) => {
    if (process.env[key] === defaultValue) {
      console.warn(`⚠️  ${key}: Using default example value`);
      hasWarnings = true;
    }
  });

  // Summary
  console.log('\n📊 Validation Summary:');
  if (hasErrors) {
    console.error('❌ Environment validation failed - fix errors before starting the application');
    process.exit(1);
  } else if (hasWarnings) {
    console.warn('⚠️  Environment validation passed with warnings - consider addressing them');
    console.log('✅ Backend environment is ready to use');
  } else {
    console.log('✅ All environment variables are properly configured');
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateEnvironment();
}

export { validateEnvironment };