/**
 * Enhanced Shipping Information Logging and Monitoring Utility
 * Provides comprehensive logging for shipping operations, audit trails, and performance monitoring
 */

import { logActivity } from './activityLogger.js';

/**
 * Logs shipping information save operations with detailed metadata
 * @param {string} orderId - Order ID
 * @param {Object} shippingInfo - Shipping information being saved
 * @param {Object} previousShippingInfo - Previous shipping information (for comparison)
 * @param {string} adminUserId - Admin user ID performing the operation
 * @param {string} requestId - Request correlation ID
 * @param {Object} validationResult - Validation result from shipping validation
 * @returns {Promise<Object>} Logging result
 */
export const logShippingInfoSave = async (orderId, shippingInfo, previousShippingInfo, adminUserId, requestId, validationResult = {}) => {
  const timestamp = new Date();
  const logId = `SHIP_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 6)}`;
  
  try {
    console.log(`📦 [${requestId}] [${logId}] Logging shipping info save operation for order ${orderId}`);
    
    // Determine what changed
    const changes = detectShippingChanges(previousShippingInfo, shippingInfo);
    
    // Create comprehensive audit metadata
    const auditMetadata = {
      log_id: logId,
      request_id: requestId,
      operation: 'SHIPPING_INFO_SAVE',
      order_id: orderId,
      admin_user_id: adminUserId,
      timestamp: timestamp.toISOString(),
      
      // Shipping data changes
      changes: {
        carrier: {
          from: previousShippingInfo?.carrier || null,
          to: shippingInfo?.carrier || null,
          changed: changes.carrierChanged
        },
        trackingNumber: {
          from: previousShippingInfo?.trackingNumber || null,
          to: shippingInfo?.trackingNumber || null,
          changed: changes.trackingChanged
        },
        shippedAt: {
          from: previousShippingInfo?.shippedAt || null,
          to: shippingInfo?.shippedAt || null,
          changed: changes.shippedAtChanged
        }
      },
      
      // Validation information
      validation: {
        success: validationResult.success !== false,
        errors: validationResult.errors || [],
        warnings: validationResult.warnings || [],
        sanitized: validationResult.sanitized || false
      },
      
      // Operation metadata
      operation_metadata: {
        fields_updated: changes.fieldsUpdated,
        total_changes: changes.totalChanges,
        is_new_shipping_info: !previousShippingInfo || (!previousShippingInfo.carrier && !previousShippingInfo.trackingNumber),
        is_complete_info: !!(shippingInfo?.carrier && shippingInfo?.trackingNumber),
        data_quality_score: calculateShippingDataQuality(shippingInfo)
      }
    };
    
    // Log to activity system
    const activityResult = await logActivity(
      adminUserId || null, // Allow null for system logs
      'SHIPPING_INFO_UPDATED', 
      auditMetadata, 
      orderId
    );
    
    // Enhanced console logging with structured format
    console.log(`✅ [${requestId}] [${logId}] Shipping info save logged successfully`);
    console.log(`📊 [${requestId}] [${logId}] Change summary:`, {
      fieldsUpdated: changes.fieldsUpdated,
      totalChanges: changes.totalChanges,
      isNewInfo: auditMetadata.operation_metadata.is_new_shipping_info,
      isComplete: auditMetadata.operation_metadata.is_complete_info,
      dataQuality: auditMetadata.operation_metadata.data_quality_score
    });
    
    return {
      success: true,
      logId,
      activityId: activityResult?._id,
      auditMetadata,
      changes
    };
    
  } catch (error) {
    console.error(`❌ [${requestId}] [${logId}] Failed to log shipping info save:`, error);
    return {
      success: false,
      logId,
      error: error.message,
      auditMetadata: null
    };
  }
};

/**
 * Logs performance metrics for order queries with user population
 * @param {string} operation - Operation name (e.g., 'allOrders', 'userOrders')
 * @param {number} duration - Query duration in milliseconds
 * @param {Object} queryMetrics - Query performance metrics
 * @param {string} requestId - Request correlation ID
 * @returns {Promise<void>}
 */
export const logOrderQueryPerformance = async (operation, duration, queryMetrics, requestId) => {
  const timestamp = new Date();
  const logId = `PERF_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 6)}`;
  
  try {
    console.log(`⏱️ [${requestId}] [${logId}] Logging performance metrics for ${operation}`);
    
    const performanceData = {
      log_id: logId,
      request_id: requestId,
      operation,
      timestamp: timestamp.toISOString(),
      
      // Performance metrics
      performance: {
        total_duration_ms: duration,
        query_duration_ms: queryMetrics.queryDuration || duration,
        population_duration_ms: queryMetrics.populationDuration || 0,
        processing_duration_ms: queryMetrics.processingDuration || 0,
        
        // Query statistics
        orders_fetched: queryMetrics.ordersFetched || 0,
        orders_with_users: queryMetrics.ordersWithUsers || 0,
        orders_with_shipping: queryMetrics.ordersWithShipping || 0,
        legacy_orders_processed: queryMetrics.legacyOrdersProcessed || 0,
        
        // Performance thresholds
        is_slow_query: duration > 5000, // > 5 seconds
        is_very_slow_query: duration > 10000, // > 10 seconds
        performance_grade: getPerformanceGrade(duration, queryMetrics.ordersFetched || 0)
      },
      
      // Database metrics
      database: {
        connection_state: queryMetrics.dbConnectionState || 'unknown',
        population_success_rate: queryMetrics.populationSuccessRate || 0,
        user_lookup_efficiency: queryMetrics.userLookupEfficiency || 0
      }
    };
    
    // Log performance warning if query is slow
    if (performanceData.performance.is_slow_query) {
      console.warn(`⚠️ [${requestId}] [${logId}] Slow query detected for ${operation}:`, {
        duration: `${duration}ms`,
        orderCount: queryMetrics.ordersFetched,
        grade: performanceData.performance.performance_grade
      });
    }
    
    // Enhanced performance logging
    console.log(`📈 [${requestId}] [${logId}] Performance metrics:`, {
      operation,
      duration: `${duration}ms`,
      orderCount: queryMetrics.ordersFetched || 0,
      populationRate: `${Math.round((queryMetrics.ordersWithUsers || 0) / Math.max(queryMetrics.ordersFetched || 1, 1) * 100)}%`,
      shippingInfoRate: `${Math.round((queryMetrics.ordersWithShipping || 0) / Math.max(queryMetrics.ordersFetched || 1, 1) * 100)}%`,
      grade: performanceData.performance.performance_grade
    });
    
    // Store performance data (could be extended to write to a performance log file or database)
    // For now, we'll use the activity logger with a special type
    await logActivity(null, 'PERFORMANCE_METRIC', performanceData, null);
    
  } catch (error) {
    console.error(`❌ [${requestId}] [${logId}] Failed to log performance metrics:`, error);
  }
};

/**
 * Logs customer name resolution process with debugging information
 * @param {string} orderId - Order ID
 * @param {Object} nameResolution - Name resolution result
 * @param {Object} orderData - Original order data for debugging
 * @param {string} requestId - Request correlation ID
 * @returns {Promise<void>}
 */
export const logCustomerNameResolution = async (orderId, nameResolution, orderData, requestId) => {
  const timestamp = new Date();
  const logId = `NAME_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 6)}`;
  
  try {
    console.log(`👤 [${requestId}] [${logId}] Logging customer name resolution for order ${orderId}`);
    
    const resolutionData = {
      log_id: logId,
      request_id: requestId,
      operation: 'CUSTOMER_NAME_RESOLUTION',
      order_id: orderId,
      timestamp: timestamp.toISOString(),
      
      // Resolution results
      resolution: {
        resolved_name: nameResolution.name,
        source: nameResolution.source,
        confidence: nameResolution.confidence,
        data_quality: nameResolution.metadata?.dataQuality || 0
      },
      
      // Available data sources for debugging
      available_sources: {
        user_id_name: !!orderData.user_id?.name,
        user_id_email: !!orderData.user_id?.email,
        address_snapshot_name: !!orderData.address_snapshot?.name,
        legacy_address_firstName: !!orderData.address?.firstName,
        legacy_address_lastName: !!orderData.address?.lastName,
        legacy_address_name: !!orderData.address?.name,
        legacy_userId_field: !!orderData.userId
      },
      
      // Schema information for debugging
      schema_info: {
        schema_type: nameResolution.metadata?.schemaType || 'unknown',
        data_source_type: nameResolution.metadata?.dataSourceType || 'unknown',
        has_legacy_fields: nameResolution.metadata?.hasLegacyUserId || false,
        user_data_reliability: nameResolution.metadata?.userDataValidation?.sourceType || 'unknown'
      },
      
      // Resolution quality metrics
      quality_metrics: {
        is_high_confidence: nameResolution.confidence >= 80,
        is_fallback_resolution: nameResolution.confidence < 40,
        has_complete_user_data: !!(orderData.user_id?.name && orderData.user_id?.email),
        resolution_method: determineResolutionMethod(nameResolution.source)
      }
    };
    
    // Log resolution issues for debugging
    if (nameResolution.confidence < 60) {
      console.warn(`⚠️ [${requestId}] [${logId}] Low confidence name resolution for order ${orderId}:`, {
        resolvedName: nameResolution.name,
        source: nameResolution.source,
        confidence: nameResolution.confidence,
        availableSources: Object.entries(resolutionData.available_sources)
          .filter(([key, value]) => value)
          .map(([key]) => key)
      });
    }
    
    // Debug logging for schema issues
    if (resolutionData.schema_info.has_legacy_fields) {
      console.log(`🔍 [${requestId}] [${logId}] Legacy schema detected for order ${orderId}:`, {
        schemaType: resolutionData.schema_info.schema_type,
        dataSourceType: resolutionData.schema_info.data_source_type,
        legacyUserId: orderData.userId
      });
    }
    
    // Store resolution data for analysis
    // Extract user ID properly if it's an object
    const userId = orderData.user_id?._id || orderData.user_id || orderData.userId || null;
    await logActivity(userId, 'NAME_RESOLUTION_DEBUG', resolutionData, orderId);
    
  } catch (error) {
    console.error(`❌ [${requestId}] [${logId}] Failed to log customer name resolution:`, error);
  }
};

/**
 * Creates an audit trail entry for shipping information changes
 * @param {string} orderId - Order ID
 * @param {Object} changes - Detected changes
 * @param {string} adminUserId - Admin user ID
 * @param {string} requestId - Request correlation ID
 * @returns {Promise<Object>} Audit trail result
 */
export const createShippingAuditTrail = async (orderId, changes, adminUserId, requestId) => {
  const timestamp = new Date();
  const auditId = `AUDIT_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 8)}`;
  
  try {
    console.log(`📋 [${requestId}] [${auditId}] Creating shipping audit trail for order ${orderId}`);
    
    const auditEntry = {
      audit_id: auditId,
      request_id: requestId,
      operation: 'SHIPPING_AUDIT_TRAIL',
      order_id: orderId,
      admin_user_id: adminUserId,
      timestamp: timestamp.toISOString(),
      
      // Audit trail data
      audit_data: {
        change_type: 'SHIPPING_INFO_UPDATE',
        fields_changed: changes.fieldsUpdated,
        change_count: changes.totalChanges,
        
        // Detailed field changes
        field_changes: {
          carrier: changes.carrierChanged ? {
            action: changes.carrier?.from ? 'UPDATED' : 'ADDED',
            old_value: changes.carrier?.from || null,
            new_value: changes.carrier?.to || null
          } : null,
          
          trackingNumber: changes.trackingChanged ? {
            action: changes.trackingNumber?.from ? 'UPDATED' : 'ADDED',
            old_value: changes.trackingNumber?.from || null,
            new_value: changes.trackingNumber?.to || null
          } : null,
          
          shippedAt: changes.shippedAtChanged ? {
            action: changes.shippedAt?.from ? 'UPDATED' : 'ADDED',
            old_value: changes.shippedAt?.from || null,
            new_value: changes.shippedAt?.to || null
          } : null
        },
        
        // Compliance and security
        compliance: {
          data_retention_required: true,
          sensitive_data_present: !!(changes.trackingNumber?.to),
          audit_level: 'STANDARD',
          retention_period_days: 2555 // 7 years for shipping records
        }
      }
    };
    
    // Log audit entry
    const activityResult = await logActivity(
      adminUserId || null,
      'SHIPPING_AUDIT_ENTRY',
      auditEntry,
      orderId
    );
    
    console.log(`✅ [${requestId}] [${auditId}] Shipping audit trail created successfully`);
    
    return {
      success: true,
      auditId,
      activityId: activityResult?._id,
      auditEntry
    };
    
  } catch (error) {
    console.error(`❌ [${requestId}] [${auditId}] Failed to create shipping audit trail:`, error);
    return {
      success: false,
      auditId,
      error: error.message
    };
  }
};

/**
 * Detects changes between previous and new shipping information
 * @param {Object} previous - Previous shipping info
 * @param {Object} current - Current shipping info
 * @returns {Object} Change detection result
 */
const detectShippingChanges = (previous, current) => {
  const changes = {
    carrierChanged: false,
    trackingChanged: false,
    shippedAtChanged: false,
    fieldsUpdated: [],
    totalChanges: 0
  };
  
  // Check carrier changes
  const prevCarrier = previous?.carrier || null;
  const currCarrier = current?.carrier || null;
  if (prevCarrier !== currCarrier) {
    changes.carrierChanged = true;
    changes.fieldsUpdated.push('carrier');
    changes.carrier = { from: prevCarrier, to: currCarrier };
  }
  
  // Check tracking number changes
  const prevTracking = previous?.trackingNumber || null;
  const currTracking = current?.trackingNumber || null;
  if (prevTracking !== currTracking) {
    changes.trackingChanged = true;
    changes.fieldsUpdated.push('trackingNumber');
    changes.trackingNumber = { from: prevTracking, to: currTracking };
  }
  
  // Check shipped date changes
  const prevShipped = previous?.shippedAt ? new Date(previous.shippedAt).getTime() : null;
  const currShipped = current?.shippedAt ? new Date(current.shippedAt).getTime() : null;
  if (prevShipped !== currShipped) {
    changes.shippedAtChanged = true;
    changes.fieldsUpdated.push('shippedAt');
    changes.shippedAt = { from: previous?.shippedAt, to: current?.shippedAt };
  }
  
  changes.totalChanges = changes.fieldsUpdated.length;
  
  return changes;
};

/**
 * Calculates data quality score for shipping information
 * @param {Object} shippingInfo - Shipping information
 * @returns {number} Quality score 0-100
 */
const calculateShippingDataQuality = (shippingInfo) => {
  if (!shippingInfo) return 0;
  
  let score = 0;
  let maxScore = 0;
  
  // Carrier name (40 points)
  maxScore += 40;
  if (shippingInfo.carrier) {
    score += 40;
    // Bonus for known carriers
    const knownCarriers = ['fedex', 'ups', 'dhl', 'usps', 'amazon'];
    if (knownCarriers.some(carrier => shippingInfo.carrier.toLowerCase().includes(carrier))) {
      score += 5;
      maxScore += 5;
    }
  }
  
  // Tracking number (40 points)
  maxScore += 40;
  if (shippingInfo.trackingNumber) {
    score += 40;
    // Bonus for valid tracking format
    if (shippingInfo.trackingNumber.length >= 8) {
      score += 5;
      maxScore += 5;
    }
  }
  
  // Shipped date (20 points)
  maxScore += 20;
  if (shippingInfo.shippedAt) {
    score += 20;
  }
  
  return Math.round((score / maxScore) * 100);
};

/**
 * Gets performance grade based on duration and order count
 * @param {number} duration - Duration in milliseconds
 * @param {number} orderCount - Number of orders processed
 * @returns {string} Performance grade
 */
const getPerformanceGrade = (duration, orderCount) => {
  const ordersPerSecond = orderCount / (duration / 1000);
  
  if (duration < 1000) return 'A+';
  if (duration < 2000) return 'A';
  if (duration < 3000) return 'B+';
  if (duration < 5000) return 'B';
  if (duration < 8000) return 'C+';
  if (duration < 12000) return 'C';
  return 'D';
};

/**
 * Determines resolution method category
 * @param {string} source - Resolution source
 * @returns {string} Resolution method
 */
const determineResolutionMethod = (source) => {
  if (source.includes('user_id')) return 'DATABASE_REFERENCE';
  if (source.includes('address_snapshot')) return 'ORDER_SNAPSHOT';
  if (source.includes('address')) return 'LEGACY_ADDRESS';
  if (source.includes('email')) return 'EMAIL_FALLBACK';
  if (source.includes('phone')) return 'PHONE_FALLBACK';
  if (source.includes('order')) return 'ORDER_ID_FALLBACK';
  return 'UNKNOWN';
};

export default {
  logShippingInfoSave,
  logOrderQueryPerformance,
  logCustomerNameResolution,
  createShippingAuditTrail,
  detectShippingChanges: detectShippingChanges,
  calculateShippingDataQuality
};