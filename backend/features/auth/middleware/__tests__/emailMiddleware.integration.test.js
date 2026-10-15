/**
 * Integration test for email middleware environment toggle
 * Tests that the correct middleware is applied based on USE_LEGACY_EMAIL_VALIDATOR env var
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the middleware modules before importing userRoutes
const mockLegacyMiddleware = vi.fn((req, res, next) => {
  req.middlewareUsed = 'legacy';
  next();
});

const mockNewMiddleware = vi.fn((req, res, next) => {
  req.middlewareUsed = 'new';
  next();
});

// Mock controller
const mockRegisterUser = vi.fn((req, res) => {
  res.json({ 
    success: true, 
    middlewareUsed: req.middlewareUsed,
    message: 'Registration successful'
  });
});

// Mock the middleware modules
vi.mock('../../middleware/emailValidationMiddleware.js', () => mockLegacyMiddleware);
vi.mock('../../middleware/emailValidationMiddleware2.js', () => mockNewMiddleware);
vi.mock('../../controllers/userController.js', () => ({
  registerUser: mockRegisterUser,
  // Mock other exports to prevent import errors
  loginUser: vi.fn(),
  adminLogin: vi.fn(),
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  updateUserPreferences: vi.fn(),
  changeUserPassword: vi.fn(),
  verifyJWTToken: vi.fn(),
  sendEmailVerification: vi.fn(),
  resendVerificationEmail: vi.fn(),
  checkEmailVerificationStatus: vi.fn(),
  validateEmailEndpoint: vi.fn(),
  verifyEmail: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  getProfileCompletion: vi.fn(),
  getUserOrders: vi.fn(),
  deleteUserAccount: vi.fn(),
}));

describe('Email Middleware Environment Toggle Integration Tests', () => {
  let app;
  
  beforeEach(() => {
    // Clear all mocks and reset modules
    vi.clearAllMocks();
    vi.resetModules();
    
    // Create fresh app instance
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.USE_LEGACY_EMAIL_VALIDATOR;
  });

  test('should use new middleware when USE_LEGACY_EMAIL_VALIDATOR is not set', async () => {
    // Don't set the environment variable (defaults to new middleware)
    
    // Import userRoutes after setting environment
    const userRoutes = await import('../../routes/userRoutes.js');
    app.use('/api/auth', userRoutes.default);

    // Make request to register endpoint
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    // Verify new middleware was called
    expect(mockNewMiddleware).toHaveBeenCalled();
    expect(mockLegacyMiddleware).not.toHaveBeenCalled();
    expect(response.body.middlewareUsed).toBe('new');
    expect(response.status).toBe(200);
  });

  test('should use new middleware when USE_LEGACY_EMAIL_VALIDATOR is false', async () => {
    // Set environment variable to false
    process.env.USE_LEGACY_EMAIL_VALIDATOR = 'false';
    
    // Import userRoutes after setting environment
    const userRoutes = await import('../../routes/userRoutes.js');
    app.use('/api/auth', userRoutes.default);

    // Make request to register endpoint
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    // Verify new middleware was called
    expect(mockNewMiddleware).toHaveBeenCalled();
    expect(mockLegacyMiddleware).not.toHaveBeenCalled();
    expect(response.body.middlewareUsed).toBe('new');
    expect(response.status).toBe(200);
  });

  test('should use legacy middleware when USE_LEGACY_EMAIL_VALIDATOR is true', async () => {
    // Set environment variable to true
    process.env.USE_LEGACY_EMAIL_VALIDATOR = 'true';
    
    // Import userRoutes after setting environment
    const userRoutes = await import('../../routes/userRoutes.js');
    app.use('/api/auth', userRoutes.default);

    // Make request to register endpoint
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    // Verify legacy middleware was called
    expect(mockLegacyMiddleware).toHaveBeenCalled();
    expect(mockNewMiddleware).not.toHaveBeenCalled();
    expect(response.body.middlewareUsed).toBe('legacy');
    expect(response.status).toBe(200);
  });

  test('should handle middleware switching between requests', async () => {
    // First request with legacy middleware
    process.env.USE_LEGACY_EMAIL_VALIDATOR = 'true';
    
    const userRoutes1 = await import('../../routes/userRoutes.js');
    const app1 = express();
    app1.use(express.json());
    app1.use('/api/auth', userRoutes1.default);

    const response1 = await request(app1)
      .post('/api/auth/register')
      .send({
        email: 'test1@example.com',
        password: 'password123'
      });

    expect(response1.body.middlewareUsed).toBe('legacy');

    // Clear modules and create new instance
    vi.resetModules();
    vi.clearAllMocks();

    // Second request with new middleware
    delete process.env.USE_LEGACY_EMAIL_VALIDATOR;
    
    const userRoutes2 = await import('../../routes/userRoutes.js');
    const app2 = express();
    app2.use(express.json());
    app2.use('/api/auth', userRoutes2.default);

    const response2 = await request(app2)
      .post('/api/auth/register')
      .send({
        email: 'test2@example.com',
        password: 'password123'
      });

    expect(response2.body.middlewareUsed).toBe('new');
  });

  test('should handle edge cases in environment variable values', async () => {
    const testCases = [
      { env: 'TRUE', expected: 'new' }, // Case sensitivity
      { env: '1', expected: 'new' }, // Number string
      { env: 'yes', expected: 'new' }, // Other truthy strings
      { env: '', expected: 'new' }, // Empty string
      { env: 'true', expected: 'legacy' }, // Exact match
    ];

    for (const testCase of testCases) {
      // Reset modules for each test case
      vi.resetModules();
      vi.clearAllMocks();
      
      // Set environment variable
      if (testCase.env === '') {
        delete process.env.USE_LEGACY_EMAIL_VALIDATOR;
      } else {
        process.env.USE_LEGACY_EMAIL_VALIDATOR = testCase.env;
      }

      // Import userRoutes after setting environment
      const userRoutes = await import('../userRoutes.js');
      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api/auth', userRoutes.default);

      // Make request
      const response = await request(testApp)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.body.middlewareUsed).toBe(testCase.expected);
    }
  });
});