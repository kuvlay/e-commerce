/**
 * Test suite for shipping logging and monitoring functionality
 * Tests comprehensive logging, audit trails, and performance monitoring
 */

import { 
  logShippingInfoSave,
  logOrderQueryPerformance,
  logCustomerNameResolution,
  createShippingAuditTrail
} from '../utils/shippingLogger.js';

// Mock the activity logger
const mockLogActivity = async (userId, type, meta, orderId) => {
  console.log(`Mock logActivity called: ${type} for user ${userId}`);
  return { _id: 'mock_activity_id_' + Date.now() };
};

// Mock the activity logger import
jest.mock('../utils/activityLogger.js', () => ({
  logActivity: mockLogActivity
}));

describe('Shipping Logger Utility', () => {
  const mockRequestId = 'TEST_REQ_123';
  const mockOrderId = '507f1f77bcf86cd799439011';
  const mockAdminUserId = '507f1f77bcf86cd799439012';

  beforeEach(() => {
    // Clear console logs for clean test output
    jest.clearAllMocks();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  describe('logShippingInfoSave', () => {
    test('should log new shipping info save successfully', async () => {
      const shippingInfo = {
        carrier: 'FedEx',
        trackingNumber: 'FX123456789',
        shippedAt: new Date()
      };
      
      const previousShippingInfo = null;
      
      const result = await logShippingInfoSave(
        mockOrderId,
        shippingInfo,
        previousShippingInfo,
        mockAdminUserId,
        mockRequestId,
        { success: true, sanitized: true }
      );
      
      expect(result.success).toBe(true);
      expect(result.logId).toMatch(/^SHIP_\d+_[a-z0-9]+$/);
      expect(result.changes.totalChanges).toBe(3); // carrier, trackingNumber, shippedAt
      expect(result.changes.fieldsUpdated).toContain('carrier');
      expect(result.changes.fieldsUpdated).toContain('trackingNumber');
      expect(result.auditMetadata.operation).toBe('SHIPPING_INFO_SAVE');
      expect(result.auditMetadata.operation_metadata.is_new_shipping_info).toBe(true);
    });

    test('should log shipping info update with changes detection', async () => {
      const previousShippingInfo = {
        carrier: 'UPS',
        trackingNumber: 'UPS123456',
        shippedAt: new Date('2024-01-01')
      };
      
      const newShippingInfo = {
        carrier: 'FedEx',
        trackingNumber: 'FX789012',
        shippedAt: new Date()
      };
      
      const result = await logShippingInfoSave(
        mockOrderId,
        newShippingInfo,
        previousShippingInfo,
        mockAdminUserId,
        mockRequestId
      );
      
      expect(result.success).toBe(true);
      expect(result.changes.carrierChanged).toBe(true);
      expect(result.changes.trackingChanged).toBe(true);
      expect(result.changes.carrier.from).toBe('UPS');
      expect(result.changes.carrier.to).toBe('FedEx');
      expect(result.auditMetadata.operation_metadata.is_new_shipping_info).toBe(false);
    });

    test('should handle partial shipping info updates', async () => {
      const previousShippingInfo = {
        carrier: 'UPS',
        trackingNumber: null,
        shippedAt: null
      };
      
      const newShippingInfo = {
        carrier: 'UPS',
        trackingNumber: 'UPS789012',
        shippedAt: new Date()
      };
      
      const result = await logShippingInfoSave(
        mockOrderId,
        newShippingInfo,
        previousShippingInfo,
        mockAdminUserId,
        mockRequestId
      );
      
      expect(result.success).toBe(true);
      expect(result.changes.carrierChanged).toBe(false);
      expect(result.changes.trackingChanged).toBe(true);
      expect(result.changes.totalChanges).toBe(2); // trackingNumber and shippedAt
    });
  });

  describe('logOrderQueryPerformance', () => {
    test('should log performance metrics for fast queries', async () => {
      const queryMetrics = {
        queryDuration: 150,
        processingDuration: 50,
        ordersFetched: 25,
        ordersWithUsers: 23,
        ordersWithShipping: 15,
        legacyOrdersProcessed: 2,
        dbConnectionState: 1,
        populationSuccessRate: 92,
        userLookupEfficiency: 100
      };
      
      await logOrderQueryPerformance('allOrders', 200, queryMetrics, mockRequestId);
      
      // Verify console logging was called
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Logging performance metrics for allOrders')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Performance metrics:'),
        expect.objectContaining({
          operation: 'allOrders',
          duration: '200ms',
          grade: 'A+'
        })
      );
    });

    test('should log performance warnings for slow queries', async () => {
      const queryMetrics = {
        queryDuration: 8000,
        ordersFetched: 100,
        ordersWithUsers: 95,
        ordersWithShipping: 60
      };
      
      await logOrderQueryPerformance('allOrders', 12000, queryMetrics, mockRequestId);
      
      // Verify warning was logged for slow query
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow query detected'),
        expect.objectContaining({
          duration: '12000ms',
          orderCount: 100,
          grade: 'D'
        })
      );
    });

    test('should calculate correct performance grades', async () => {
      const testCases = [
        { duration: 500, expected: 'A+' },
        { duration: 1500, expected: 'A' },
        { duration: 2500, expected: 'B+' },
        { duration: 4000, expected: 'B' },
        { duration: 6000, expected: 'C+' },
        { duration: 10000, expected: 'C' },
        { duration: 15000, expected: 'D' }
      ];
      
      for (const testCase of testCases) {
        await logOrderQueryPerformance('testQuery', testCase.duration, { ordersFetched: 10 }, mockRequestId);
        
        expect(console.log).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            grade: testCase.expected
          })
        );
      }
    });
  });

  describe('logCustomerNameResolution', () => {
    test('should log high confidence name resolution', async () => {
      const nameResolution = {
        name: 'John Doe',
        source: 'user_id.name',
        confidence: 95,
        metadata: {
          schemaType: 'new_schema',
          dataSourceType: 'populated_reference',
          hasLegacyUserId: false
        }
      };
      
      const orderData = {
        user_id: { name: 'John Doe', email: 'john@example.com' },
        address_snapshot: { name: 'John Doe' }
      };
      
      await logCustomerNameResolution(mockOrderId, nameResolution, orderData, mockRequestId);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Logging customer name resolution')
      );
      
      // Should not log warning for high confidence
      expect(console.warn).not.toHaveBeenCalled();
    });

    test('should log warning for low confidence name resolution', async () => {
      const nameResolution = {
        name: 'Customer #123456',
        source: 'order ID',
        confidence: 10,
        metadata: {
          schemaType: 'no_user_reference',
          dataSourceType: 'address_only'
        }
      };
      
      const orderData = {
        user_id: null,
        address_snapshot: null,
        address: null
      };
      
      await logCustomerNameResolution(mockOrderId, nameResolution, orderData, mockRequestId);
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Low confidence name resolution'),
        expect.objectContaining({
          confidence: 10,
          source: 'order ID'
        })
      );
    });

    test('should log debug info for legacy schema orders', async () => {
      const nameResolution = {
        name: 'Jane Smith',
        source: 'address firstName+lastName',
        confidence: 85,
        metadata: {
          schemaType: 'legacy_schema',
          dataSourceType: 'legacy_string_id',
          hasLegacyUserId: true
        }
      };
      
      const orderData = {
        userId: '507f1f77bcf86cd799439013',
        address: { firstName: 'Jane', lastName: 'Smith' }
      };
      
      await logCustomerNameResolution(mockOrderId, nameResolution, orderData, mockRequestId);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Legacy schema detected'),
        expect.objectContaining({
          schemaType: 'legacy_schema',
          legacyUserId: '507f1f77bcf86cd799439013'
        })
      );
    });
  });

  describe('createShippingAuditTrail', () => {
    test('should create audit trail for shipping changes', async () => {
      const changes = {
        carrierChanged: true,
        trackingChanged: true,
        fieldsUpdated: ['carrier', 'trackingNumber'],
        totalChanges: 2,
        carrier: { from: 'UPS', to: 'FedEx' },
        trackingNumber: { from: null, to: 'FX123456' }
      };
      
      const result = await createShippingAuditTrail(
        mockOrderId,
        changes,
        mockAdminUserId,
        mockRequestId
      );
      
      expect(result.success).toBe(true);
      expect(result.auditId).toMatch(/^AUDIT_\d+_[a-z0-9]+$/);
      expect(result.auditEntry.audit_data.change_type).toBe('SHIPPING_INFO_UPDATE');
      expect(result.auditEntry.audit_data.fields_changed).toEqual(['carrier', 'trackingNumber']);
      expect(result.auditEntry.audit_data.field_changes.carrier.action).toBe('ADDED');
      expect(result.auditEntry.audit_data.field_changes.trackingNumber.action).toBe('ADDED');
    });

    test('should handle audit trail creation errors gracefully', async () => {
      // Mock logActivity to throw an error
      const originalLogActivity = mockLogActivity;
      const mockError = new Error('Database connection failed');
      
      // Temporarily replace the mock
      jest.doMock('../utils/activityLogger.js', () => ({
        logActivity: jest.fn().mockRejectedValue(mockError)
      }));
      
      const changes = {
        carrierChanged: true,
        fieldsUpdated: ['carrier'],
        totalChanges: 1
      };
      
      const result = await createShippingAuditTrail(
        mockOrderId,
        changes,
        mockAdminUserId,
        mockRequestId
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create shipping audit trail'),
        mockError
      );
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete shipping info workflow logging', async () => {
      const previousShippingInfo = null;
      const newShippingInfo = {
        carrier: 'DHL',
        trackingNumber: 'DHL987654321',
        shippedAt: new Date()
      };
      
      // Log shipping info save
      const saveResult = await logShippingInfoSave(
        mockOrderId,
        newShippingInfo,
        previousShippingInfo,
        mockAdminUserId,
        mockRequestId,
        { success: true, sanitized: true }
      );
      
      expect(saveResult.success).toBe(true);
      
      // Create audit trail
      const auditResult = await createShippingAuditTrail(
        mockOrderId,
        saveResult.changes,
        mockAdminUserId,
        mockRequestId
      );
      
      expect(auditResult.success).toBe(true);
      expect(auditResult.auditEntry.audit_data.change_count).toBe(3);
      
      // Verify both operations logged successfully
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Shipping info save logged successfully')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Shipping audit trail created successfully')
      );
    });
  });
});

// Helper function to run tests
export const runShippingLoggerTests = () => {
  console.log('🧪 Running shipping logger tests...');
  
  // This would typically be run with a test runner like Jest
  // For now, we'll just export the test functions for manual testing
  return {
    testShippingInfoSave: async () => {
      const shippingInfo = {
        carrier: 'Test Carrier',
        trackingNumber: 'TEST123',
        shippedAt: new Date()
      };
      
      return await logShippingInfoSave(
        'test_order_id',
        shippingInfo,
        null,
        'test_admin_id',
        'test_request_id'
      );
    },
    
    testPerformanceLogging: async () => {
      const metrics = {
        queryDuration: 100,
        ordersFetched: 10,
        ordersWithUsers: 9,
        ordersWithShipping: 5
      };
      
      return await logOrderQueryPerformance('testQuery', 150, metrics, 'test_request_id');
    },
    
    testNameResolutionLogging: async () => {
      const nameResolution = {
        name: 'Test Customer',
        source: 'user_id.name',
        confidence: 95,
        metadata: { schemaType: 'new_schema' }
      };
      
      const orderData = {
        user_id: { name: 'Test Customer', email: 'test@example.com' }
      };
      
      return await logCustomerNameResolution('test_order_id', nameResolution, orderData, 'test_request_id');
    }
  };
};