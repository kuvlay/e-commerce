/**
 * Integration test for customer name resolution in TrackOrders context
 */

import { resolveCustomerName } from '../customerNameResolver';

describe('Customer Name Resolution Integration', () => {
  test('should handle real-world order data structures', () => {
    // Test with new schema order
    const newSchemaOrder = {
      _id: '507f1f77bcf86cd799439011',
      order_status: 'shipped',
      displayCustomerName: 'John Smith',
      user_id: {
        _id: '507f1f77bcf86cd799439012',
        name: 'John Smith',
        email: 'john.smith@example.com'
      },
      address_snapshot: {
        name: 'John Smith',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        pincode: '10001'
      },
      shippingInfo: {
        carrier: 'FedEx',
        trackingNumber: '1234567890'
      }
    };

    const result = resolveCustomerName(newSchemaOrder);
    expect(result.name).toBe('John Smith');
    expect(result.source).toBe('backend_resolved');
    expect(result.validated).toBe(true);
  });

  test('should handle legacy schema order', () => {
    const legacyOrder = {
      _id: '507f1f77bcf86cd799439013',
      status: 'delivered',
      user_id: {
        _id: '507f1f77bcf86cd799439014',
        email: 'jane.doe@example.com'
      },
      address: {
        firstName: 'Jane',
        lastName: 'Doe',
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipcode: '90210'
      }
    };

    const result = resolveCustomerName(legacyOrder);
    expect(result.name).toBe('Jane Doe');
    expect(result.source).toBe('legacy_address_names');
    expect(result.validated).toBe(true);
  });

  test('should handle mixed schema with missing user population', () => {
    const mixedOrder = {
      _id: '507f1f77bcf86cd799439015',
      order_status: 'pending',
      status: 'pending', // legacy field also present
      user_id: '507f1f77bcf86cd799439016', // Not populated, just ID
      address_snapshot: {
        name: 'Bob Johnson',
        addressLine1: '789 Pine St'
      }
    };

    const result = resolveCustomerName(mixedOrder);
    expect(result.name).toBe('Bob Johnson');
    expect(result.source).toBe('address_snapshot');
    expect(result.validated).toBe(true);
  });

  test('should handle order with only email available', () => {
    const emailOnlyOrder = {
      _id: '507f1f77bcf86cd799439017',
      order_status: 'processing',
      user_id: {
        _id: '507f1f77bcf86cd799439018',
        email: 'alice_wonderland@example.com'
      }
    };

    const result = resolveCustomerName(emailOnlyOrder);
    expect(result.name).toBe('Alice Wonderland');
    expect(result.source).toBe('email_prefix');
    expect(result.confidence).toBe(40);
  });

  test('should handle minimal order data', () => {
    const minimalOrder = {
      _id: '507f1f77bcf86cd799439019',
      order_status: 'pending'
    };

    const result = resolveCustomerName(minimalOrder);
    expect(result.name).toBe('Customer #439019');
    expect(result.source).toBe('order_id_fallback');
    expect(result.validated).toBe(false);
  });

  test('should handle corrupted or incomplete data gracefully', () => {
    const corruptedOrder = {
      _id: '507f1f77bcf86cd799439020',
      displayCustomerName: '', // Empty string
      user_id: {
        name: '   ', // Whitespace only
        email: 'invalid-email'
      },
      address_snapshot: {
        name: 'null' // Invalid placeholder
      },
      address: {
        firstName: null,
        lastName: undefined
      }
    };

    const result = resolveCustomerName(corruptedOrder);
    expect(result.name).toBe('Customer #439020');
    expect(result.source).toBe('order_id_fallback');
  });

  test('should maintain consistency across multiple calls', () => {
    const order = {
      _id: '507f1f77bcf86cd799439021',
      displayCustomerName: 'Consistent User',
      user_id: {
        name: 'Different Name',
        email: 'user@example.com'
      }
    };

    const result1 = resolveCustomerName(order);
    const result2 = resolveCustomerName(order);
    const result3 = resolveCustomerName(order);

    expect(result1.name).toBe(result2.name);
    expect(result2.name).toBe(result3.name);
    expect(result1.source).toBe(result2.source);
    expect(result2.source).toBe(result3.source);
  });
});