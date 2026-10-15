/**
 * Status normalization utilities to handle inconsistent status formats
 * Addresses Comment 16: Type coercion: status comparison uses exact strings; normalize cases to avoid mismatches
 */

// Map of legacy/variant status names to canonical values
const STATUS_MAPPING = {
  'order placed': 'Placed',
  'orderplaced': 'Placed',
  'order_placed': 'Placed',
  'placed order': 'Placed',
  'order confirmed': 'Placed',
  'order processing': 'Packed',
  'out for delivery': 'OutForDelivery',
  'outfordelivery': 'OutForDelivery',
  'out_for_delivery': 'OutForDelivery',
  'out-for-delivery': 'OutForDelivery',
  'on the way': 'OutForDelivery',
  'in transit': 'Shipped',
  'intransit': 'Shipped',
  'in_transit': 'Shipped',
  'in-transit': 'Shipped',
  'dispatched': 'Shipped',
  'shipped out': 'Shipped',
  'processing': 'Packed',
  'packing': 'Packed',
  'preparing': 'Packed',
  'confirmed': 'Placed',
  'accepted': 'Placed',
  'approved': 'Placed',
  'complete': 'Delivered',
  'completed': 'Delivered',
  'finished': 'Delivered',
  'done': 'Delivered',
  'received': 'Delivered',
  'fulfilled': 'Delivered',
  'canceled': 'Cancelled',
  'cancelled': 'Cancelled',
  'declined': 'Cancelled',
  'rejected': 'Cancelled',
  'failed': 'Cancelled',
  'void': 'Cancelled',
  'aborted': 'Cancelled'
};

// Canonical status values for validation
const CANONICAL_STATUSES = [
  'Pending',
  'Placed', 
  'Packed',
  'Shipped',
  'OutForDelivery',
  'Delivered',
  'Cancelled'
];

/**
 * Normalize order status to canonical format
 * @param {string} status - Raw status string
 * @returns {string} Normalized status
 */
export const normalizeOrderStatus = (status) => {
  if (!status || typeof status !== 'string') {
    return 'Pending';
  }
  
  // Remove extra spaces and convert to lowercase for mapping lookup
  const cleaned = status.trim().toLowerCase();
  
  // Check if it's a variant that needs mapping
  if (STATUS_MAPPING[cleaned]) {
    return STATUS_MAPPING[cleaned];
  }
  
  // Convert to PascalCase for canonical format
  const pascalCase = status
    .trim()
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  
  // Validate against canonical statuses
  if (CANONICAL_STATUSES.includes(pascalCase)) {
    return pascalCase;
  }
  
  // Fallback to original with proper casing if no exact match
  return pascalCase || 'Pending';
};

/**
 * Normalize payment status to canonical format
 * @param {string} status - Raw payment status string
 * @returns {string} Normalized payment status
 */
export const normalizePaymentStatus = (status) => {
  if (!status || typeof status !== 'string') {
    return 'Pending';
  }
  
  const cleaned = status.trim().toLowerCase();
  
  const paymentMapping = {
    'pending verification': 'PendingVerification',
    'pendingverification': 'PendingVerification',
    'pending_verification': 'PendingVerification',
    'awaiting': 'Pending',
    'unpaid': 'Pending',
    'success': 'Paid',
    'successful': 'Paid',
    'completed': 'Paid',
    'complete': 'Paid',
    'confirmed': 'Paid',
    'error': 'Failed',
    'failure': 'Failed',
    'declined': 'Failed',
    'rejected': 'Failed',
    'cancelled': 'Failed',
    'canceled': 'Failed',
    'refund': 'Refunded',
    'refund_pending': 'Refunded',
    'refunded': 'Refunded',
    'reversed': 'Refunded'
  };
  
  if (paymentMapping[cleaned]) {
    return paymentMapping[cleaned];
  }
  
  // Convert to PascalCase
  const pascalCase = status
    .trim()
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  
  return pascalCase || 'Pending';
};

/**
 * Get status display properties (color, icon, etc.)
 * @param {string} status - Normalized status
 * @param {string} type - 'order' or 'payment'
 * @returns {object} Display properties
 */
export const getStatusDisplay = (status, type = 'order') => {
  const normalizedStatus = type === 'order' 
    ? normalizeOrderStatus(status) 
    : normalizePaymentStatus(status);
  
  if (type === 'order') {
    const orderDisplayMap = {
      'Pending': { color: 'yellow', icon: '⏳', priority: 1 },
      'Placed': { color: 'blue', icon: '📋', priority: 2 },
      'Packed': { color: 'purple', icon: '📦', priority: 3 },
      'Shipped': { color: 'indigo', icon: '🚚', priority: 4 },
      'OutForDelivery': { color: 'orange', icon: '🏃', priority: 5 },
      'Delivered': { color: 'green', icon: '✅', priority: 6 },
      'Cancelled': { color: 'red', icon: '❌', priority: 0 }
    };
    
    return orderDisplayMap[normalizedStatus] || orderDisplayMap['Pending'];
  }
  
  if (type === 'payment') {
    const paymentDisplayMap = {
      'Pending': { color: 'yellow', icon: '⏳' },
      'PendingVerification': { color: 'orange', icon: '🔍' },
      'Paid': { color: 'green', icon: '✅' },
      'Failed': { color: 'red', icon: '❌' },
      'Refunded': { color: 'gray', icon: '🔄' }
    };
    
    return paymentDisplayMap[normalizedStatus] || paymentDisplayMap['Pending'];
  }
  
  return { color: 'gray', icon: '❓', priority: 0 };
};

/**
 * Validate if status transition is logical
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {boolean} Whether transition makes sense
 */
export const isValidStatusTransition = (fromStatus, toStatus) => {
  const from = normalizeOrderStatus(fromStatus);
  const to = normalizeOrderStatus(toStatus);
  
  // Same status is not a valid transition
  if (from === to) {
    return false;
  }
  
  // Cancelled can only transition from non-final states
  if (to === 'Cancelled') {
    return from !== 'Delivered';
  }
  
  // Can't transition from final states except to Cancelled
  if (from === 'Delivered' || from === 'Cancelled') {
    return false;
  }
  
  return true;
};

/**
 * Get all canonical statuses for a type
 * @param {string} type - 'order' or 'payment'
 * @returns {array} Array of canonical status strings
 */
export const getCanonicalStatuses = (type = 'order') => {
  if (type === 'payment') {
    return ['Pending', 'PendingVerification', 'Paid', 'Failed', 'Refunded'];
  }
  
  return CANONICAL_STATUSES;
};

/**
 * Batch normalize order statuses for multiple orders
 * @param {Array} orders - Array of order objects
 * @param {string} statusField - Field name containing status (default: 'order_status')
 * @param {string} legacyField - Legacy status field (default: 'status')
 * @returns {Array} Orders with normalized statuses
 */
export const batchNormalizeOrderStatuses = (orders, statusField = 'order_status', legacyField = 'status') => {
  if (!Array.isArray(orders)) {
    return [];
  }

  return orders.map(order => {
    const currentStatus = order[statusField] || order[legacyField];
    const normalizedStatus = normalizeOrderStatus(currentStatus);
    
    return {
      ...order,
      [statusField]: normalizedStatus,
      originalStatus: currentStatus, // Preserve original for debugging
      statusNormalized: currentStatus !== normalizedStatus
    };
  });
};

/**
 * Get status statistics from array of orders
 * @param {Array} orders - Array of order objects
 * @param {string} statusField - Field name containing status
 * @returns {Object} Status distribution statistics
 */
export const getStatusStatistics = (orders, statusField = 'order_status') => {
  if (!Array.isArray(orders)) {
    return {};
  }

  const stats = orders.reduce((acc, order) => {
    const status = normalizeOrderStatus(order[statusField]);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Add totals and percentages
  const total = orders.length;
  const enrichedStats = {};
  
  Object.keys(stats).forEach(status => {
    enrichedStats[status] = {
      count: stats[status],
      percentage: total > 0 ? Math.round((stats[status] / total) * 100) : 0
    };
  });

  return {
    statuses: enrichedStats,
    total,
    uniqueStatuses: Object.keys(stats).length
  };
};

/**
 * Create MongoDB aggregation pipeline for status normalization
 * @param {string} statusField - Primary status field
 * @param {string} legacyField - Legacy status field
 * @returns {Array} MongoDB aggregation pipeline stages
 */
export const createStatusNormalizationPipeline = (statusField = 'order_status', legacyField = 'status') => {
  return [
    {
      $addFields: {
        normalized_status: {
          $function: {
            body: function(orderStatus, legacyStatus) {
              const status = orderStatus || legacyStatus || 'Pending';
              
              // Basic normalization mapping for MongoDB
              const statusMapping = {
                'Order Placed': 'Placed',
                'order placed': 'Placed',
                'Out For Delivery': 'OutForDelivery',
                'out for delivery': 'OutForDelivery',
                'In Transit': 'Shipped',
                'in transit': 'Shipped',
                'Complete': 'Delivered',
                'Completed': 'Delivered',
                'Canceled': 'Cancelled',
                'Cancelled': 'Cancelled'
              };
              
              if (statusMapping[status]) {
                return statusMapping[status];
              }
              
              // Basic PascalCase conversion
              return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
            },
            args: [`$${statusField}`, `$${legacyField}`],
            lang: 'js'
          }
        }
      }
    }
  ];
};

/**
 * Validate status consistency across an order object
 * @param {Object} order - Order object
 * @returns {Object} Validation result
 */
export const validateStatusConsistency = (order) => {
  const orderStatus = order.order_status;
  const legacyStatus = order.status;
  const paymentStatus = order.payment_status;
  
  const normalizedOrderStatus = normalizeOrderStatus(orderStatus);
  const normalizedLegacyStatus = normalizeOrderStatus(legacyStatus);
  
  const isConsistent = normalizedOrderStatus === normalizedLegacyStatus;
  
  return {
    isConsistent,
    orderStatus: normalizedOrderStatus,
    legacyStatus: normalizedLegacyStatus,
    paymentStatus: normalizePaymentStatus(paymentStatus),
    hasDiscrepancy: !isConsistent,
    recommendation: !isConsistent ? `Update ${legacyStatus} to ${normalizedOrderStatus}` : 'Status fields are consistent'
  };
};

export default {
  normalizeOrderStatus,
  normalizePaymentStatus,
  getStatusDisplay,
  isValidStatusTransition,
  getCanonicalStatuses,
  batchNormalizeOrderStatuses,
  getStatusStatistics,
  createStatusNormalizationPipeline,
  validateStatusConsistency
};