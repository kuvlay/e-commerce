import {
  sanitizeString,
  sanitizeNumber,
  sanitizeArray,
  sanitizeProductData,
  sanitizeOrderData,
  sanitizeApiResponse
} from '../dataSanitizer';

describe('dataSanitizer', () => {
  describe('sanitizeString', () => {
    test('sanitizes valid strings', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
      expect(sanitizeString('<script>alert("xss")</script>test')).toBe('test');
      expect(sanitizeString('<div>content</div>')).toBe('content');
    });

    test('handles null and undefined', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(null, { allowEmpty: false })).toBe(null);
    });

    test('respects length limits', () => {
      expect(sanitizeString('test', { maxLength: 2 })).toBe(null);
      expect(sanitizeString('test', { minLength: 5 })).toBe(null);
    });
  });

  describe('sanitizeNumber', () => {
    test('sanitizes valid numbers', () => {
      expect(sanitizeNumber('123')).toBe(123);
      expect(sanitizeNumber('123.45')).toBe(123.45);
      expect(sanitizeNumber(123)).toBe(123);
    });

    test('handles invalid numbers', () => {
      expect(sanitizeNumber('abc')).toBe(null);
      expect(sanitizeNumber(NaN)).toBe(null);
      expect(sanitizeNumber(Infinity)).toBe(null);
    });

    test('respects range limits', () => {
      expect(sanitizeNumber(5, { min: 10 })).toBe(null);
      expect(sanitizeNumber(15, { max: 10 })).toBe(null);
    });

    test('handles integer-only mode', () => {
      expect(sanitizeNumber(123.45, { allowFloat: false })).toBe(123);
    });
  });

  describe('sanitizeArray', () => {
    test('sanitizes valid arrays', () => {
      expect(sanitizeArray([1, 2, 3])).toEqual([1, 2, 3]);
      expect(sanitizeArray([1, null, 3])).toEqual([1, 3]);
    });

    test('handles non-arrays', () => {
      expect(sanitizeArray('not array')).toEqual([]);
      expect(sanitizeArray(null)).toEqual([]);
    });

    test('applies item sanitizer', () => {
      const itemSanitizer = (item) => typeof item === 'string' ? item.toUpperCase() : null;
      expect(sanitizeArray(['hello', 123, 'world'], { itemSanitizer })).toEqual(['HELLO', 'WORLD']);
    });
  });

  describe('sanitizeProductData', () => {
    test('sanitizes valid product', () => {
      const product = {
        _id: 'prod123',
        name: 'Test Product',
        category: 'Electronics',
        price: 99.99,
        image: ['http://example.com/image.jpg'],
        description: 'A test product'
      };

      const result = sanitizeProductData(product);
      expect(result).toBeTruthy();
      expect(result._id).toBe('prod123');
      expect(result.name).toBe('Test Product');
      expect(result.price).toBe(99.99);
    });

    test('rejects invalid product data', () => {
      expect(sanitizeProductData(null)).toBe(null);
      expect(sanitizeProductData({})).toBe(null);
      expect(sanitizeProductData({ _id: 'test' })).toBe(null); // Missing required fields
    });

    test('handles measurements', () => {
      const product = {
        _id: 'prod123',
        name: 'Test Product',
        category: 'Electronics',
        price: 99.99,
        image: ['http://example.com/image.jpg'],
        measurements: [
          { value: 'small', price: 99.99, label: 'Small' },
          { value: 'large', price: 129.99, label: 'Large' }
        ]
      };

      const result = sanitizeProductData(product);
      expect(result.measurements).toHaveLength(2);
      expect(result.measurements[0].value).toBe('small');
    });
  });

  describe('sanitizeOrderData', () => {
    test('sanitizes valid order', () => {
      const order = {
        _id: 'order123',
        order_status: 'pending',
        date: '2023-01-01T00:00:00Z',
        amount: 199.99,
        items: [
          {
            _id: 'item1',
            title: 'Product 1',
            price: 99.99,
            qty: 2
          }
        ]
      };

      const result = sanitizeOrderData(order);
      expect(result).toBeTruthy();
      expect(result._id).toBe('order123');
      expect(result.items).toHaveLength(1);
      expect(result._sanitized).toBe(true);
    });

    test('rejects invalid order data', () => {
      expect(sanitizeOrderData(null)).toBe(null);
      expect(sanitizeOrderData({})).toBe(null);
    });

    test('handles shipping info', () => {
      const order = {
        _id: 'order123',
        order_status: 'shipped',
        date: '2023-01-01T00:00:00Z',
        amount: 199.99,
        items: [],
        shippingInfo: {
          carrier: 'FedEx',
          trackingNumber: '123456789',
          shippedAt: '2023-01-02T00:00:00Z'
        }
      };

      const result = sanitizeOrderData(order);
      expect(result.shippingInfo).toBeTruthy();
      expect(result.shippingInfo.carrier).toBe('FedEx');
    });
  });

  describe('sanitizeApiResponse', () => {
    test('sanitizes orders response', () => {
      const response = {
        success: true,
        orders: [
          {
            _id: 'order1',
            order_status: 'pending',
            date: '2023-01-01T00:00:00Z',
            amount: 99.99,
            items: []
          }
        ]
      };

      const result = sanitizeApiResponse(response, 'orders');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.dataType).toBe('orders');
    });

    test('sanitizes products response', () => {
      const response = {
        success: true,
        products: [
          {
            _id: 'prod1',
            name: 'Product 1',
            category: 'Electronics',
            price: 99.99,
            image: ['http://example.com/image.jpg']
          }
        ]
      };

      const result = sanitizeApiResponse(response, 'products');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.dataType).toBe('products');
    });

    test('handles invalid response', () => {
      const result = sanitizeApiResponse(null);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid response structure');
    });
  });
});