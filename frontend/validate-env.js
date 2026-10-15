#!/usr/bin/env node

/**
 * Frontend Environment Validation Utility
 * Validates that all required environment variables are present and properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required environment variables for frontend
const REQUIRED_VARS = [
  'VITE_API_URL'
];

// Validation patterns
const VALIDATION_PATTERNS = {
  VITE_API_URL: /^https?:\/\/.+/
};

function validateEnvironment() {
  console.log('🔍 Validating Frontend Environment Variables...\n');
  
  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found in frontend directory');
    console.log('💡 Copy .env.example to .env and configure your variables');
    process.exit(1);
  }

  // Load environment variables from .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  let hasErrors = false;
  let hasWarnings = false;

  // Validate required variables
  console.log('📋 Required Variables:');
  REQUIRED_VARS.forEach(varName => {
    const value = envVars[varName];
    
    if (!value) {
      console.error(`❌ ${varName}: Missing (required)`);
      hasErrors = true;
    } else if (VALIDATION_PATTERNS[varName] && !VALIDATION_PATTERNS[varName].test(value)) {
      console.error(`❌ ${varName}: Invalid format (should be a valid URL)`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: OK (${value})`);
    }
  });

  // Security checks
  console.log('\n🔒 Security Checks:');
  
  // Check for default values
  const apiUrl = envVars.VITE_API_URL;
  if (apiUrl === 'http://localhost:5000') {
    console.log('✅ Using development API URL');
  } else if (apiUrl && apiUrl.includes('localhost')) {
    console.log('✅ Using local development setup');
  } else if (apiUrl) {
    console.log('✅ Using production API URL');
  }

  // Check for VITE_ prefix requirement
  Object.keys(envVars).forEach(key => {
    if (!key.startsWith('VITE_') && !key.startsWith('#')) {
      console.warn(`⚠️  ${key}: Environment variables in Vite must start with VITE_ to be accessible in the browser`);
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
    console.log('✅ Frontend environment is ready to use');
  } else {
    console.log('✅ All environment variables are properly configured');
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateEnvironment();
}

export { validateEnvironment };