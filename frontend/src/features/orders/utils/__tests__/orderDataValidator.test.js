import { describe, test, expect } from 'vitest';
import { validateOrder, validateOrdersArray, validateShippingInfo } from '../orderDataValidator';

describe('Order Data Validator', () => {
  test('should validate a valid order', () => {
    const validOrder = {
      _id: '507f1f77bcf86cd799439011',
      order_status: 'shipped',
      date: '2024-01-15T10:30:00Z',
      amount: 99.99,
      items: [
        {
          product_id: 'prod123',
          title: 'Test Product',
          price: 99.99,
          qty: 1
        }
      ]
    };

    const result = validateOrder(validOrder);
    expect(result).not.toBeNull();
    expect(result._validated).toBe(true);
    expect(result._hasValidItems).toBe(true);
    expect(result.items).toHaveLength(1);
  });

  test('should reject order with missing critical fields', () => {
    const invalidOrder = {
      // Missing _id and order_status
      date: '2024-01-15T10:30:00Z',
      amount: 99.99,
      items: []
    };

    const result = validateOrder(invalidOrder);
    expect(result).toBeNull();
  });

  test('should validate orders array', () => {
    const ordersArray = [
      {
        _id: '507f1f77bcf86cd799439011',
        order_status: 'shipped',
        date: '2024-01-15T10:30:00Z',
        amount: 99.99,
        items: []
      },
      {
        // Invalid order - missing _id
        order_status: 'pending',
        date: '2024-01-15T10:30:00Z',
        amount: 50.00,
        items: []
      }
    ];

    const result = validateOrdersArray(ordersArray);
    expect(result.metadata.originalCount).toBe(2);
    expect(result.metadata.validCount).toBe(1);
    expect(result.metadata.invalidCount).toBe(1);
    expect(result.orders).toHaveLength(1);
  });

  test('should validate shipping info', () => {
    const validShippingInfo = {
      carrier: 'FedEx',
      trackingNumber: 'FX123456789',
      shippedAt: '2024-01-15T10:30:00Z'
    };

    const result = validateShippingInfo(validShippingInfo);
    expect(result).not.toBeNull();
    expect(result.carrier).toBe('FedEx');
    expect(result.trackingNumber).toBe('FX123456789');
  });

  test('should handle invalid shipping info', () => {
    const invalidShippingInfo = {
      carrier: '',
      trackingNumber: '   ',
      shippedAt: 'invalid-date'
    };

    const result = validateShippingInfo(invalidShippingInfo);
    expect(result).toBeNull();
  });

  test('should handle malformed orders array', () => {
    const result = validateOrdersArray(null);
    expect(result.orders).toHaveLength(0);
    expect(result.metadata.errors).toHaveLength(1);
  });
});