/**
 * Backward Compatibility Utilities for Order Data
 * Ensures seamless operation with both legacy and new order formats
 */

import { orderLogger } from "../../../core/utils/logger.js";

/**
 * Normalizes order data to ensure compatibility with both old and new schemas
 * @param {Object} order - Order object (can be legacy or new format)
 * @returns {Object} Normalized order object
 */
export const normalizeOrderData = (order) => {
  if (!order) return null;

  const normalized = { ...order };

  // Ensure user_id is properly set
  if (!normalized.user_id && normalized.userId) {
    normalized.user_id = normalized.userId;
  }

  // Ensure new schema fields exist with fallbacks to legacy fields
  if (!normalized.payment_method && normalized.paymentMethod) {
    normalized.payment_method = normalized.paymentMethod === 'Razorpay' ? 'ONLINE' : 'COD';
  }

  if (!normalized.payment_status) {
    if (normalized.payment === true) {
      normalized.payment_status = 'Paid';
    } else if (normalized.payment === false && normalized.payment_method === 'COD') {
      normalized.payment_status = 'PendingVerification';
    } else {
      normalized.payment_status = 'Pending';
    }
  }

  if (!normalized.order_status && normalized.status) {
    normalized.order_status = mapLegacyStatus(normalized.status);
  }

  // Ensure totals object exists
  if (!normalized.totals && normalized.amount) {
    normalized.totals = {
      subtotal: normalized.amount - 10, // Assuming 10 delivery charge
      shipping: 10,
      tax: 0,
      grand_total: normalized.amount
    };
  }

  // Ensure address_snapshot exists
  if (!normalized.address_snapshot && normalized.address) {
    normalized.address_snapshot = normalizeAddress(normalized.address);
  }

  // Ensure items array is properly formatted
  if (normalized.items && Array.isArray(normalized.items)) {
    normalized.items = normalized.items.map(normalizeItem);
  }

  // Ensure timestamps
  if (!normalized.created_at && normalized.date) {
    normalized.created_at = new Date(normalized.date);
  }

  if (!normalized.updated_at) {
    normalized.updated_at = normalized.created_at || new Date();
  }

  return normalized;
};

/**
 * Maps legacy status values to new schema status values
 * @param {string} legacyStatus - Legacy status string
 * @returns {string} New schema status
 */
const mapLegacyStatus = (legacyStatus) => {
  const statusMap = {
    'Order Placed': 'Placed',
    'Packing': 'Packed',
    'Shipped': 'Shipped',
    'Out for delivery': 'OutForDelivery',
    'Delivered': 'Delivered',
    'Cancelled': 'Cancelled',
    'Pending': 'Pending'
  };

  return statusMap[legacyStatus] || 'Pending';
};

/**
 * Normalizes address data from legacy format to new schema
 * @param {Object} legacyAddress - Legacy address object
 * @returns {Object} Normalized address object
 */
const normalizeAddress = (legacyAddress) => {
  if (!legacyAddress) return null;

  return {
    name: legacyAddress.firstName && legacyAddress.lastName 
      ? `${legacyAddress.firstName} ${legacyAddress.lastName}`
      : legacyAddress.name || 'Unknown Customer',
    phone: legacyAddress.phone || 'Not provided',
    line1: legacyAddress.street || legacyAddress.line1 || legacyAddress.addressLine1 || 'Not provided',
    line2: legacyAddress.line2 || legacyAddress.addressLine2 || null,
    city: legacyAddress.city || 'Not provided',
    state: legacyAddress.state || 'Not provided',
    pincode: legacyAddress.zipcode || legacyAddress.pincode || 'Not provided',
    country: legacyAddress.country || 'India'
  };
};

/**
 * Normalizes item data from legacy format to new schema
 * @param {Object} item - Item object
 * @returns {Object} Normalized item object
 */
const normalizeItem = (item) => {
  if (!item) return null;

  return {
    product_id: item.product_id || item._id,
    title: item.title || item.name,
    price: item.price,
    qty: item.qty || item.quantity || 1,
    variant: item.variant || item.size || null,
    imageUrl: item.imageUrl || (item.image && item.image[0]) || null
  };
};

/**
 * Validates that an order has all required fields for both schemas
 * @param {Object} order - Order object to validate
 * @returns {Object} Validation result with success flag and missing fields
 */
export const validateOrderCompatibility = (order) => {
  const missing = [];
  const warnings = [];

  // Check required new schema fields
  if (!order.user_id && !order.userId) {
    missing.push('user_id or userId');
  }

  if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
    missing.push('items array');
  }

  if (!order.payment_method && !order.paymentMethod) {
    missing.push('payment_method or paymentMethod');
  }

  if (!order.totals && !order.amount) {
    missing.push('totals or amount');
  }

  // Check for potential data quality issues
  if (!order.address_snapshot && !order.address) {
    warnings.push('No address information available');
  }

  if (!order.created_at && !order.date) {
    warnings.push('No creation timestamp available');
  }

  return {
    success: missing.length === 0,
    missing,
    warnings,
    hasLegacyFields: !!(order.userId || order.paymentMethod || order.status || order.amount),
    hasNewFields: !!(order.user_id || order.payment_method || order.order_status || order.totals)
  };
};

/**
 * Migrates a legacy order to new schema format
 * @param {Object} legacyOrder - Legacy order object
 * @returns {Object} Migrated order object
 */
export const migrateLegacyOrder = (legacyOrder) => {
  orderLogger.debug('Migrating legacy order', { orderId: legacyOrder._id });

  const migrated = normalizeOrderData(legacyOrder);
  
  // Preserve legacy fields for backward compatibility
  migrated.userId = legacyOrder.userId;
  migrated.amount = legacyOrder.amount;
  migrated.address = legacyOrder.address;
  migrated.status = legacyOrder.status;
  migrated.paymentMethod = legacyOrder.paymentMethod;
  migrated.payment = legacyOrder.payment;
  migrated.date = legacyOrder.date;

  orderLogger.debug('Legacy order migration completed', { 
    orderId: legacyOrder._id,
    hasNewFields: true,
    preservedLegacyFields: true
  });

  return migrated;
};

/**
 * Ensures order data is compatible with frontend expectations
 * @param {Object} order - Order object
 * @returns {Object} Frontend-compatible order object
 */
export const prepareFrontendOrder = (order) => {
  const prepared = { ...order };

  // Ensure legacy fields exist for older frontend code
  if (!prepared.userId && prepared.user_id) {
    prepared.userId = prepared.user_id.toString();
  }

  if (!prepared.amount && prepared.totals) {
    prepared.amount = prepared.totals.grand_total;
  }

  if (!prepared.status && prepared.order_status) {
    prepared.status = prepared.order_status;
  }

  if (!prepared.paymentMethod && prepared.payment_method) {
    prepared.paymentMethod = prepared.payment_method === 'ONLINE' ? 'Razorpay' : 'COD';
  }

  if (!prepared.payment && prepared.payment_status) {
    prepared.payment = prepared.payment_status === 'Paid';
  }

  if (!prepared.date && prepared.created_at) {
    prepared.date = new Date(prepared.created_at).getTime();
  }

  // Ensure address exists for legacy frontend components
  if (!prepared.address && prepared.address_snapshot) {
    prepared.address = prepared.address_snapshot;
  }

  return prepared;
};

/**
 * Batch processes orders to ensure compatibility
 * @param {Array} orders - Array of order objects
 * @returns {Array} Array of compatible order objects
 */
export const batchEnsureCompatibility = (orders) => {
  if (!Array.isArray(orders)) return [];

  return orders.map(order => {
    try {
      const normalized = normalizeOrderData(order);
      return prepareFrontendOrder(normalized);
    } catch (error) {
      orderLogger.error('Failed to ensure order compatibility', {
        orderId: order._id,
        error: error.message
      });
      return order; // Return original if normalization fails
    }
  });
};

export default {
  normalizeOrderData,
  validateOrderCompatibility,
  migrateLegacyOrder,
  prepareFrontendOrder,
  batchEnsureCompatibility
};