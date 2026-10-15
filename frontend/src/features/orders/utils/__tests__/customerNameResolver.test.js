/**
 * Tests for Customer Name Resolution Utility
 */

import { resolveCustomerName, getNameResolutionDebugInfo } from '../customerNameResolver';

describe('Customer Name Resolution', () => {
  describe('resolveCustomerName', () => {
    test('should return backend displayCustomerName with highest priority', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        displayCustomerName: 'John Doe',
        user_id: { name: 'Jane Smith', email: 'jane@example.com' },
        address_snapshot: { name: 'Bob Wilson' }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('John Doe');
      expect(result.source).toBe('backend_resolved');
      expect(result.confidence).toBe(95);
      expect(result.validated).toBe(true);
    });

    test('should use user_id name when displayCustomerName is invalid', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        displayCustomerName: 'Unknown Customer',
        user_id: { name: 'Jane Smith', email: 'jane@example.com' }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Jane Smith');
      expect(result.source).toBe('user_id_populated');
      expect(result.confidence).toBe(90);
    });

    test('should use address_snapshot name when higher priorities unavailable', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        address_snapshot: { name: 'Bob Wilson' }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Bob Wilson');
      expect(result.source).toBe('address_snapshot');
      expect(result.confidence).toBe(85);
    });

    test('should combine firstName and lastName from legacy address', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        address: { 
          firstName: 'Alice', 
          lastName: 'Johnson' 
        }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Alice Johnson');
      expect(result.source).toBe('legacy_address_names');
      expect(result.confidence).toBe(80);
    });

    test('should handle partial names from legacy address', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        address: { 
          firstName: 'Alice',
          lastName: '' 
        }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Alice');
      expect(result.source).toBe('legacy_address_names');
    });

    test('should use legacy address name field', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        address: { name: 'Charlie Brown' }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Charlie Brown');
      expect(result.source).toBe('legacy_address_name');
      expect(result.confidence).toBe(75);
    });

    test('should extract name from email when other options unavailable', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        user_id: { email: 'john.doe@example.com' }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('John Doe');
      expect(result.source).toBe('email_prefix');
      expect(result.confidence).toBe(40);
    });

    test('should handle complex email formats', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        user_id: { email: 'jane_smith123@example.com' }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Jane Smith');
      expect(result.source).toBe('email_prefix');
    });

    test('should fallback to order ID when no name available', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011'
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Customer #439011');
      expect(result.source).toBe('order_id_fallback');
      expect(result.confidence).toBe(20);
      expect(result.validated).toBe(false);
    });

    test('should handle invalid order input gracefully', () => {
      const result = resolveCustomerName(null);
      
      expect(result.name).toBe('Invalid Order');
      expect(result.source).toBe('invalid_input');
      expect(result.confidence).toBe(0);
      expect(result.validated).toBe(false);
    });

    test('should reject invalid name values', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        displayCustomerName: 'null',
        user_id: { name: 'undefined' },
        address_snapshot: { name: 'test' }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Customer #439011');
      expect(result.source).toBe('order_id_fallback');
    });

    test('should handle errors gracefully', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        get displayCustomerName() {
          throw new Error('Test error');
        }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Customer');
      expect(result.source).toBe('error_fallback');
      expect(result.error).toBe('Test error');
    });

    test('should handle order without ID', () => {
      const order = {
        displayCustomerName: 'John Doe'
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Unknown Order');
      expect(result.source).toBe('missing_id');
      expect(result.confidence).toBe(0);
    });

    test('should reject names with excessive special characters', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        displayCustomerName: '!@#$%^&*()',
        user_id: { name: 'John@#$%Doe' }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Customer #439011');
      expect(result.source).toBe('order_id_fallback');
    });

    test('should reject single letter names', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        displayCustomerName: 'A',
        user_id: { name: 'B' }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Customer #439011');
      expect(result.source).toBe('order_id_fallback');
    });

    test('should handle admin/service emails properly', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        user_id: { email: 'admin@example.com' }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Customer #439011');
      expect(result.source).toBe('order_id_fallback');
    });

    test('should extract names from complex email formats', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        user_id: { email: 'mary.jane.watson123@example.com' }
      };

      const result = resolveCustomerName(order);
      
      expect(result.name).toBe('Mary Jane Watson');
      expect(result.source).toBe('email_prefix');
    });
  });

  describe('getNameResolutionDebugInfo', () => {
    test('should return comprehensive debug information', () => {
      const order = {
        _id: '507f1f77bcf86cd799439011',
        displayCustomerName: 'John Doe',
        user_id: { name: 'Jane Smith', email: 'jane@example.com' },
        address_snapshot: { name: 'Bob Wilson' },
        order_status: 'shipped'
      };

      const debugInfo = getNameResolutionDebugInfo(order);
      
      expect(debugInfo.orderId).toBe('507f1f77bcf86cd799439011');
      expect(debugInfo.availableFields.displayCustomerName.valid).toBe(true);
      expect(debugInfo.availableFields.userId_name.valid).toBe(true);
      expect(debugInfo.schemaDetection.hasNewSchema).toBe(true);
    });

    test('should handle missing order gracefully', () => {
      const debugInfo = getNameResolutionDebugInfo(null);
      
      expect(debugInfo.error).toBe('No order provided');
    });
  });
});