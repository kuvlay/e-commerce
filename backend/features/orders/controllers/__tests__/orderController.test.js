import { jest } from '@jest/globals';
import { placeOrderRazorpay, allOrders, updateStatus } from '../orderController.js';
import orderModel from '../models/orderModel.js';
import userModel from '../../auth/models/userModel.js';
import { batchResolveCustomerNames } from '../../../core/utils/customerResolver.js';
import { sendOrdersResponse, sendErrorResponse, sendSuccessResponse, sendNotFoundResponse, sendValidationErrorResponse } from '../../../core/utils/responseWrapper.js';
import { logActivity } from '../utils/activityLogger.js';
import { sendOrderStatusNotification } from '../services/notificationService.js';
import { canTransitionOrderStatus } from '../utils/orderStateMachine.js';

// Mock dependencies
jest.mock('../models/orderModel.js');
jest.mock('../../auth/models/userModel.js');
jest.mock('../utils/activityLogger.js');
jest.mock('../../../core/utils/customerResolver.js');
jest.mock('../../../core/utils/responseWrapper.js');
jest.mock('../services/notificationService.js');
jest.mock('../utils/orderStateMachine.js');

describe('placeOrderRazorpay', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        userId: '507f1f77bcf86cd799439011',
        items: [
          {
            product_id: '507f1f77bcf86cd799439012',
            title: 'Test Product',
            price: 100,
            qty: 2
          }
        ],
        amount: 210, // 200 + 10 shipping
        address: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '1234567890',
          street: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        },
        razorpayOrderId: 'order_test123',
        razorpayPaymentId: 'pay_test123',
        razorpaySignature: 'valid_signature'
      }
    };

    res = {
      json: jest.fn()
    };

    // Mock crypto for signature verification
    const crypto = {
      createHmac: jest.fn(() => ({
        update: jest.fn(() => ({
          digest: jest.fn(() => 'valid_signature')
        }))
      }))
    };
    global.crypto = { default: crypto };
  });

  test('should create order with new schema fields', async () => {
    const mockSavedOrder = {
      _id: 'order123',
      payment_status: 'Paid',
      order_status: 'Placed',
      totals: { grand_total: 210 }
    };

    orderModel.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(mockSavedOrder)
    }));

    userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

    await placeOrderRazorpay(req, res);

    expect(orderModel).toHaveBeenCalledWith(expect.objectContaining({
      user_id: '507f1f77bcf86cd799439011',
      payment_method: 'ONLINE',
      payment_status: 'Paid', 
      order_status: 'Placed',
      totals: expect.objectContaining({
        subtotal: 200,
        shipping: 10,
        grand_total: 210
      })
    }));

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Order placed successfully with Razorpay",
      orderId: 'order123',
      order: expect.any(Object)
    });
  });
});

describe('updateStatus', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        orderId: '507f1f77bcf86cd799439011',
        status: 'Shipped',
        shippingInfo: {
          carrier: 'DHL Express',
          trackingNumber: 'DHL123456789'
        }
      }
    };

    res = {
      json: jest.fn(),
      status: jest.fn(() => res)
    };

    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock database state
    orderModel.db = { readyState: 1, name: 'test' };
    
    // Mock canTransitionOrderStatus
    canTransitionOrderStatus.mockReturnValue(true);
    
    // Mock response utilities
    sendSuccessResponse.mockResolvedValue(undefined);
    sendErrorResponse.mockResolvedValue(undefined);
    sendNotFoundResponse.mockResolvedValue(undefined);
    sendValidationErrorResponse.mockResolvedValue(undefined);
    
    // Mock activity logging
    logActivity.mockResolvedValue(undefined);
    
    // Mock notification service
    sendOrderStatusNotification.mockResolvedValue(undefined);
  });

  test('should persist shipping info when status changes to Shipped', async () => {
    const mockOrder = {
      _id: '507f1f77bcf86cd799439011',
      user_id: '507f1f77bcf86cd799439012',
      order_status: 'Processing',
      shippingInfo: null
    };

    const mockUpdatedOrder = {
      _id: '507f1f77bcf86cd799439011',
      user_id: '507f1f77bcf86cd799439012',
      order_status: 'Shipped',
      shippingInfo: {
        carrier: 'DHL Express',
        trackingNumber: 'DHL123456789',
        shippedAt: expect.any(Date)
      }
    };

    const mockVerificationOrder = {
      _id: '507f1f77bcf86cd799439011',
      shippingInfo: {
        carrier: 'DHL Express',
        trackingNumber: 'DHL123456789',
        shippedAt: expect.any(Date)
      }
    };

    // Mock orderModel methods
    orderModel.findById.mockResolvedValueOnce(mockOrder);
    orderModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedOrder);
    orderModel.findById.mockResolvedValueOnce(mockVerificationOrder);
    const mockSelect = jest.fn().mockResolvedValue(mockVerificationOrder);
    orderModel.findById.mockReturnValueOnce({ select: mockSelect });

    // Mock userModel for notification
    const mockUser = { _id: '507f1f77bcf86cd799439012', email: 'test@example.com' };
    userModel.findById.mockResolvedValue(mockUser);

    await updateStatus(req, res);

    // Verify database update was called with correct $set operations
    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      {
        $set: expect.objectContaining({
          order_status: 'Shipped',
          status: 'Shipped',
          updated_at: expect.any(Date),
          'shippingInfo.carrier': 'DHL Express',
          'shippingInfo.trackingNumber': 'DHL123456789',
          'shippingInfo.shippedAt': expect.any(Date)
        })
      },
      {
        new: true,
        runValidators: true,
        context: 'query',
        lean: false,
        upsert: false
      }
    );

    // Verify verification query was called
    expect(mockSelect).toHaveBeenCalledWith('shippingInfo order_status updated_at');

    // Verify success response
    expect(sendSuccessResponse).toHaveBeenCalledWith(
      res,
      {
        order: {
          id: '507f1f77bcf86cd799439011',
          status: 'Shipped',
          shippingInfo: mockUpdatedOrder.shippingInfo
        }
      },
      'Status updated successfully',
      expect.objectContaining({
        statusTransition: 'Processing -> Shipped',
        shippingInfoUpdated: true
      })
    );
  });

  test('should persist shipping info when status remains same (shipping info only update)', async () => {
    req.body.status = 'Shipped'; // Same as current status
    
    const mockOrder = {
      _id: '507f1f77bcf86cd799439011',
      user_id: '507f1f77bcf86cd799439012',
      order_status: 'Shipped',
      shippingInfo: {
        carrier: 'Old Carrier',
        trackingNumber: 'OLD123',
        shippedAt: new Date('2024-01-01')
      }
    };

    const mockUpdatedOrder = {
      ...mockOrder,
      shippingInfo: {
        carrier: 'DHL Express',
        trackingNumber: 'DHL123456789',
        shippedAt: new Date('2024-01-01') // Should preserve existing shippedAt
      }
    };

    orderModel.findById.mockResolvedValueOnce(mockOrder);
    orderModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedOrder);
    
    const mockVerificationOrder = { ...mockUpdatedOrder };
    const mockSelect = jest.fn().mockResolvedValue(mockVerificationOrder);
    orderModel.findById.mockReturnValueOnce({ select: mockSelect });

    userModel.findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439012', email: 'test@example.com' });

    await updateStatus(req, res);

    // Should use existing shippedAt when updating shipping info
    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      {
        $set: expect.objectContaining({
          'shippingInfo.carrier': 'DHL Express',
          'shippingInfo.trackingNumber': 'DHL123456789',
          'shippingInfo.shippedAt': new Date('2024-01-01')
        })
      },
      expect.any(Object)
    );

    expect(sendSuccessResponse).toHaveBeenCalled();
  });

  test('should auto-populate shippedAt when not provided', async () => {
    // Remove shippedAt from request
    delete req.body.shippingInfo.shippedAt;
    
    const mockOrder = {
      _id: '507f1f77bcf86cd799439011',
      user_id: '507f1f77bcf86cd799439012',
      order_status: 'Processing',
      shippingInfo: null
    };

    orderModel.findById.mockResolvedValueOnce(mockOrder);
    orderModel.findByIdAndUpdate.mockResolvedValue({ ...mockOrder, order_status: 'Shipped' });
    
    const mockSelect = jest.fn().mockResolvedValue({});
    orderModel.findById.mockReturnValueOnce({ select: mockSelect });
    userModel.findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439012', email: 'test@example.com' });

    await updateStatus(req, res);

    // Should auto-populate shippedAt
    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      {
        $set: expect.objectContaining({
          'shippingInfo.shippedAt': expect.any(Date)
        })
      },
      expect.any(Object)
    );
  });

  test('should reject empty carrier name', async () => {
    req.body.shippingInfo.carrier = '  '; // Empty after trim
    
    const mockOrder = {
      _id: '507f1f77bcf86cd799439011',
      order_status: 'Processing'
    };

    orderModel.findById.mockResolvedValue(mockOrder);

    await updateStatus(req, res);

    expect(sendValidationErrorResponse).toHaveBeenCalledWith(
      res,
      [{ field: 'shippingInfo', message: 'Carrier name is required and must be non-empty' }],
      'Invalid shipping information: Carrier name is required and must be non-empty'
    );

    expect(orderModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('should reject empty tracking number', async () => {
    req.body.shippingInfo.trackingNumber = ''; // Empty string
    
    const mockOrder = {
      _id: '507f1f77bcf86cd799439011',
      order_status: 'Processing'
    };

    orderModel.findById.mockResolvedValue(mockOrder);

    await updateStatus(req, res);

    expect(sendValidationErrorResponse).toHaveBeenCalledWith(
      res,
      [{ field: 'shippingInfo', message: 'Tracking number is required and must be non-empty' }],
      'Invalid shipping information: Tracking number is required and must be non-empty'
    );

    expect(orderModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('should trim whitespace from shipping info fields', async () => {
    req.body.shippingInfo = {
      carrier: '  DHL Express  ',
      trackingNumber: '  DHL123456789  '
    };
    
    const mockOrder = {
      _id: '507f1f77bcf86cd799439011',
      user_id: '507f1f77bcf86cd799439012',
      order_status: 'Processing',
      shippingInfo: null
    };

    orderModel.findById.mockResolvedValueOnce(mockOrder);
    orderModel.findByIdAndUpdate.mockResolvedValue({ ...mockOrder, order_status: 'Shipped' });
    
    const mockSelect = jest.fn().mockResolvedValue({});
    orderModel.findById.mockReturnValueOnce({ select: mockSelect });
    userModel.findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439012', email: 'test@example.com' });

    await updateStatus(req, res);

    // Should use trimmed values
    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      {
        $set: expect.objectContaining({
          'shippingInfo.carrier': 'DHL Express',
          'shippingInfo.trackingNumber': 'DHL123456789'
        })
      },
      expect.any(Object)
    );
  });

  test('should handle invalid status transitions with shipping info', async () => {
    req.body.status = 'Delivered';
    
    const mockOrder = {
      _id: '507f1f77bcf86cd799439011',
      order_status: 'Pending' // Invalid transition to Delivered
    };

    orderModel.findById.mockResolvedValue(mockOrder);
    canTransitionOrderStatus.mockReturnValue(false); // Invalid transition

    await updateStatus(req, res);

    expect(sendValidationErrorResponse).toHaveBeenCalledWith(
      res,
      [{ field: 'status', message: 'Invalid transition from Pending to Delivered' }],
      'Invalid status transition from Pending to Delivered'
    );

    expect(orderModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('should handle database update failures gracefully', async () => {
    const mockOrder = {
      _id: '507f1f77bcf86cd799439011',
      user_id: '507f1f77bcf86cd799439012',
      order_status: 'Processing'
    };

    orderModel.findById.mockResolvedValue(mockOrder);
    orderModel.findByIdAndUpdate.mockRejectedValue(new Error('Database connection failed'));

    await updateStatus(req, res);

    expect(sendErrorResponse).toHaveBeenCalledWith(
      res,
      'Failed to update order status',
      500,
      expect.objectContaining({
        message: 'Database connection failed',
        name: 'Error'
      })
    );
  });

  test('should continue processing when notification fails', async () => {
    const mockOrder = {
      _id: '507f1f77bcf86cd799439011',
      user_id: '507f1f77bcf86cd799439012',
      order_status: 'Processing'
    };

    const mockUpdatedOrder = {
      ...mockOrder,
      order_status: 'Shipped',
      shippingInfo: {
        carrier: 'DHL Express',
        trackingNumber: 'DHL123456789',
        shippedAt: expect.any(Date)
      }
    };

    orderModel.findById.mockResolvedValueOnce(mockOrder);
    orderModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedOrder);
    
    const mockSelect = jest.fn().mockResolvedValue(mockUpdatedOrder);
    orderModel.findById.mockReturnValueOnce({ select: mockSelect });
    
    userModel.findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439012', email: 'test@example.com' });
    sendOrderStatusNotification.mockRejectedValue(new Error('Email service down'));

    await updateStatus(req, res);

    // Should still succeed despite notification failure
    expect(sendSuccessResponse).toHaveBeenCalledWith(
      res,
      expect.any(Object),
      'Status updated successfully',
      expect.any(Object)
    );
  });

  test('should handle order not found scenarios', async () => {
    orderModel.findById.mockResolvedValue(null); // Order not found

    await updateStatus(req, res);

    expect(sendNotFoundResponse).toHaveBeenCalledWith(
      res,
      'Order',
      '507f1f77bcf86cd799439011'
    );

    expect(orderModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('should verify persistence with independent query', async () => {
    const mockOrder = {
      _id: '507f1f77bcf86cd799439011',
      user_id: '507f1f77bcf86cd799439012',
      order_status: 'Processing'
    };

    const mockUpdatedOrder = {
      ...mockOrder,
      order_status: 'Shipped',
      shippingInfo: {
        carrier: 'DHL Express',
        trackingNumber: 'DHL123456789',
        shippedAt: expect.any(Date)
      }
    };

    const mockVerificationOrder = {
      shippingInfo: {
        carrier: 'DHL Express',
        trackingNumber: 'DHL123456789',
        shippedAt: expect.any(Date)
      }
    };

    orderModel.findById.mockResolvedValueOnce(mockOrder);
    orderModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedOrder);
    
    const mockSelect = jest.fn().mockResolvedValue(mockVerificationOrder);
    orderModel.findById.mockReturnValueOnce({ select: mockSelect });
    
    userModel.findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439012', email: 'test@example.com' });

    await updateStatus(req, res);

    // Verify independent query was made
    expect(mockSelect).toHaveBeenCalledWith('shippingInfo order_status updated_at');
    
    // Should complete successfully
    expect(sendSuccessResponse).toHaveBeenCalled();
  });

  test('should use correct findByIdAndUpdate options', async () => {
    const mockOrder = {
      _id: '507f1f77bcf86cd799439011',
      user_id: '507f1f77bcf86cd799439012',
      order_status: 'Processing'
    };

    orderModel.findById.mockResolvedValueOnce(mockOrder);
    orderModel.findByIdAndUpdate.mockResolvedValue({ ...mockOrder, order_status: 'Shipped' });
    
    const mockSelect = jest.fn().mockResolvedValue({});
    orderModel.findById.mockReturnValueOnce({ select: mockSelect });
    userModel.findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439012', email: 'test@example.com' });

    await updateStatus(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      {
        new: true,
        runValidators: true,
        context: 'query',
        lean: false,
        upsert: false
      }
    );
  });
});

describe('allOrders', () => {
  let req, res;

  beforeEach(() => {
    req = {
      userId: '507f1f77bcf86cd799439011' // Admin user
    };

    res = {
      json: jest.fn(),
      status: jest.fn(() => res)
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  test('should handle legacy orders with userId field only', async () => {
    const mockLegacyOrder = {
      _id: 'order123',
      userId: '507f1f77bcf86cd799439011', // Legacy string field
      user_id: null, // No populated user data
      items: [{ title: 'Test Product', price: 100, qty: 1 }],
      toObject: () => ({
        _id: 'order123',
        userId: '507f1f77bcf86cd799439011',
        user_id: null,
        items: [{ title: 'Test Product', price: 100, qty: 1 }]
      })
    };

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890'
    };

    const mockEnhancedOrders = [{
      _id: 'order123',
      userId: '507f1f77bcf86cd799439011',
      user_id: mockUser,
      displayCustomerName: 'John Doe',
      nameResolution: { source: 'user_id.name', confidence: 95 }
    }];

    // Mock the orderModel query chain
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      catch: jest.fn().mockResolvedValue([mockLegacyOrder])
    };
    orderModel.find = jest.fn().mockReturnValue(mockQuery);
    orderModel.db = { readyState: 1, name: 'test' };

    // Mock userModel.find for legacy user lookup
    userModel.find = jest.fn().mockResolvedValue([mockUser]);

    // Mock batchResolveCustomerNames
    batchResolveCustomerNames.mockReturnValue(mockEnhancedOrders);

    // Mock response utilities
    sendOrdersResponse.mockResolvedValue(undefined);

    await allOrders(req, res);

    // Verify legacy user lookup was called
    expect(userModel.find).toHaveBeenCalledWith({
      _id: { $in: ['507f1f77bcf86cd799439011'] }
    });
    expect(userModel.find().select).toHaveBeenCalledWith('name email phone');

    // Verify batchResolveCustomerNames was called with enhanced orders
    expect(batchResolveCustomerNames).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          _id: 'order123',
          user_id: mockUser
        })
      ]),
      expect.objectContaining({
        logStats: true,
        maxLogEntries: 5,
        includeOrderId: true,
        allowEmailFallback: true
      })
    );

    // Verify response was sent successfully
    expect(sendOrdersResponse).toHaveBeenCalledWith(
      res,
      mockEnhancedOrders,
      'Orders retrieved successfully',
      expect.objectContaining({
        totalOrders: 1,
        highConfidenceNames: 1
      })
    );
  });

  test('should handle mixed schema orders (new and legacy)', async () => {
    const mockNewOrder = {
      _id: 'newOrder123',
      user_id: { _id: '507f1f77bcf86cd799439011', name: 'John Doe', email: 'john@example.com' },
      userId: '507f1f77bcf86cd799439011',
      toObject: () => ({ _id: 'newOrder123', user_id: { name: 'John Doe' }, userId: '507f1f77bcf86cd799439011' })
    };

    const mockLegacyOrder = {
      _id: 'legacyOrder123',
      userId: '507f1f77bcf86cd799439012',
      user_id: null,
      toObject: () => ({ _id: 'legacyOrder123', userId: '507f1f77bcf86cd799439012', user_id: null })
    };

    const mockLegacyUser = {
      _id: '507f1f77bcf86cd799439012',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '0987654321'
    };

    // Mock the orderModel query chain
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      catch: jest.fn().mockResolvedValue([mockNewOrder, mockLegacyOrder])
    };
    orderModel.find = jest.fn().mockReturnValue(mockQuery);
    orderModel.db = { readyState: 1, name: 'test' };

    // Mock userModel.find for legacy user lookup
    userModel.find = jest.fn().mockResolvedValue([mockLegacyUser]);

    const mockEnhancedOrders = [
      { _id: 'newOrder123', displayCustomerName: 'John Doe', nameResolution: { confidence: 95 } },
      { _id: 'legacyOrder123', displayCustomerName: 'Jane Doe', nameResolution: { confidence: 95 } }
    ];
    batchResolveCustomerNames.mockReturnValue(mockEnhancedOrders);
    sendOrdersResponse.mockResolvedValue(undefined);

    await allOrders(req, res);

    // Should only fetch legacy user (not the one already populated)
    expect(userModel.find).toHaveBeenCalledWith({
      _id: { $in: ['507f1f77bcf86cd799439012'] }
    });

    expect(batchResolveCustomerNames).toHaveBeenCalled();
    expect(sendOrdersResponse).toHaveBeenCalledWith(
      res,
      mockEnhancedOrders,
      'Orders retrieved successfully',
      expect.objectContaining({
        totalOrders: 2,
        highConfidenceNames: 2
      })
    );
  });

  test('should handle error when legacy user lookup fails', async () => {
    const mockLegacyOrder = {
      _id: 'order123',
      userId: 'nonexistent-user-id',
      user_id: null,
      toObject: () => ({ _id: 'order123', userId: 'nonexistent-user-id', user_id: null })
    };

    // Mock the orderModel query chain
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      catch: jest.fn().mockResolvedValue([mockLegacyOrder])
    };
    orderModel.find = jest.fn().mockReturnValue(mockQuery);
    orderModel.db = { readyState: 1, name: 'test' };

    // Mock userModel.find to throw error
    userModel.find = jest.fn().mockRejectedValue(new Error('Database connection failed'));

    const mockEnhancedOrders = [{
      _id: 'order123',
      displayCustomerName: 'Unknown Customer',
      nameResolution: { source: 'default', confidence: 0 }
    }];
    batchResolveCustomerNames.mockReturnValue(mockEnhancedOrders);
    sendOrdersResponse.mockResolvedValue(undefined);

    await allOrders(req, res);

    // Should continue processing despite the error
    expect(batchResolveCustomerNames).toHaveBeenCalled();
    expect(sendOrdersResponse).toHaveBeenCalledWith(
      res,
      mockEnhancedOrders,
      'Orders retrieved successfully',
      expect.objectContaining({
        totalOrders: 1,
        highConfidenceNames: 0
      })
    );
  });

  test('should handle orders with non-existent legacy userIds', async () => {
    const mockLegacyOrder = {
      _id: 'order123',
      userId: 'nonexistent-user-id',
      user_id: null,
      toObject: () => ({ _id: 'order123', userId: 'nonexistent-user-id', user_id: null })
    };

    // Mock the orderModel query chain
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      catch: jest.fn().mockResolvedValue([mockLegacyOrder])
    };
    orderModel.find = jest.fn().mockReturnValue(mockQuery);
    orderModel.db = { readyState: 1, name: 'test' };

    // Mock userModel.find to return empty array (no users found)
    userModel.find = jest.fn().mockResolvedValue([]);

    const mockEnhancedOrders = [{
      _id: 'order123',
      displayCustomerName: 'Customer #order123',
      nameResolution: { source: 'order ID', confidence: 10 }
    }];
    batchResolveCustomerNames.mockReturnValue(mockEnhancedOrders);
    sendOrdersResponse.mockResolvedValue(undefined);

    await allOrders(req, res);

    // Verify legacy user lookup was attempted
    expect(userModel.find).toHaveBeenCalledWith({
      _id: { $in: ['nonexistent-user-id'] }
    });

    // Should continue processing and use fallback customer names
    expect(batchResolveCustomerNames).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          _id: 'order123',
          user_id: null // Should remain null since no user was found
        })
      ]),
      expect.any(Object)
    );

    expect(sendOrdersResponse).toHaveBeenCalled();
  });
});