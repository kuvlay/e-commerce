/**
 * Unit tests for emailValidationMiddleware2.js
 * Tests defensive programming improvements and helper functions
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import emailValidationMiddleware2 from '../emailValidationMiddleware2.js';

// Mock the email validator
vi.mock('../../utils/emailValidator.js', () => ({
  validateEmailForSignup: vi.fn()
}));

// Import the mock after setting up vi mock
import { validateEmailForSignup } from '../../utils/emailValidator.js';

describe('emailValidationMiddleware2', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      method: 'POST',
      url: '/register',
      headers: { 'user-agent': 'test-agent' },
      get: vi.fn().mockReturnValue('test-agent'),
      ip: '127.0.0.1'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();

    // Clear mocks
    vi.clearAllMocks();
    
    // Reset environment variables
    delete process.env.ENABLE_PERF_LOGS;
    delete process.env.ENABLE_SECURITY_LOGS;
    delete process.env.NODE_ENV;

    // Reset global monitoring hooks
    delete global.securityMonitor;
    delete global.performanceMonitor;
  });

  describe('maskEmail helper function', () => {
    test('should mask valid email strings', () => {
      expect(emailValidationMiddleware2.maskEmail('test@example.com')).toBe('tes***');
      expect(emailValidationMiddleware2.maskEmail('a@b.com')).toBe('a@b***');
      expect(emailValidationMiddleware2.maskEmail('ab@example.com')).toBe('ab@***');
    });

    test('should handle short strings safely', () => {
      expect(emailValidationMiddleware2.maskEmail('a')).toBe('a***');
      expect(emailValidationMiddleware2.maskEmail('ab')).toBe('ab***');
      expect(emailValidationMiddleware2.maskEmail('')).toBe('***');
    });

    test('should handle non-string inputs safely', () => {
      expect(emailValidationMiddleware2.maskEmail(null)).toBe('null');
      expect(emailValidationMiddleware2.maskEmail(undefined)).toBe('undefined');
      expect(emailValidationMiddleware2.maskEmail(123)).toBe('number');
      expect(emailValidationMiddleware2.maskEmail({})).toBe('object');
      expect(emailValidationMiddleware2.maskEmail([])).toBe('object');
    });

    test('should handle edge cases gracefully', () => {
      expect(emailValidationMiddleware2.maskEmail(true)).toBe('unknown');
      expect(emailValidationMiddleware2.maskEmail(false)).toBe('unknown');
      expect(emailValidationMiddleware2.maskEmail(NaN)).toBe('number');
      expect(emailValidationMiddleware2.maskEmail(Symbol('test'))).toBe('unknown');
    });
  });

  describe('environment-based logging toggles', () => {
    test('should respect ENABLE_PERF_LOGS=false', async () => {
      process.env.ENABLE_PERF_LOGS = 'false';
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      req.body.email = 'test@example.com';
      validateEmailForSignup.mockReturnValue({
        isValid: true,
        type: 'valid'
      });

      await emailValidationMiddleware2(req, res, next);

      // Performance logs should be disabled
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL_MIDDLEWARE_PERFORMANCE_V2]'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    test('should respect ENABLE_SECURITY_LOGS=false', async () => {
      process.env.ENABLE_SECURITY_LOGS = 'false';
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      req.body.email = 'test@example.com';
      validateEmailForSignup.mockReturnValue({
        isValid: true,
        type: 'valid'
      });

      await emailValidationMiddleware2(req, res, next);

      // Security logs should be disabled
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL_MIDDLEWARE_SECURITY_V2]'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('defensive external monitor hooks', () => {
    test('should handle securityMonitor hook failures gracefully', async () => {
      // Set up failing security monitor
      global.securityMonitor = vi.fn().mockImplementation(() => {
        throw new Error('Security monitor failed');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      req.body.email = 'test@example.com';
      validateEmailForSignup.mockReturnValue({
        isValid: true,
        type: 'valid'
      });

      await emailValidationMiddleware2(req, res, next);

      // Should log warning about monitor failure but continue processing
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security monitor hook failed: Security monitor failed')
      );
      expect(next).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('safe request metadata extraction', () => {
    test('should handle missing req.get method gracefully', async () => {
      // Remove get method to simulate non-Express context
      delete req.get;

      req.body.email = 'test@example.com';
      validateEmailForSignup.mockReturnValue({
        isValid: true,
        type: 'valid'
      });

      await emailValidationMiddleware2(req, res, next);

      // Should extract user agent from headers fallback
      expect(req.emailValidation.security.requestMetadata.userAgent).toBe('test-agent');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('enhanced error response contract', () => {
    test('should set message to validation detail for client compatibility', async () => {
      req.body.email = 'invalid@example';
      validateEmailForSignup.mockReturnValue({
        isValid: false,
        type: 'invalid_format',
        message: 'Invalid email format detected',
        suggestions: ['invalid@example.com'],
        issues: ['missing_tld']
      });

      await emailValidationMiddleware2(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid email format detected', // Main message for client
          code: 'invalid_format', // Validation code
          error: 'Invalid email format detected', // Backward compatibility
          type: 'invalid_format', // Backward compatibility
          suggestions: expect.any(Array),
          issues: ['missing_tld']
        })
      );
    });
  });
});