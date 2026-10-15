/**
 * Order status state machine - flexible transitions for admin control
 */
const ORDER_STATUS_TRANSITIONS = {
  Pending: ['Placed', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled'],
  Placed: ['Pending', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled'],
  Packed: ['Pending', 'Placed', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled'],
  Shipped: ['Pending', 'Placed', 'Packed', 'OutForDelivery', 'Delivered', 'Cancelled'],
  OutForDelivery: ['Pending', 'Placed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
  Delivered: ['Cancelled'], // Can only cancel delivered orders
  Cancelled: [] // Final state - no transitions allowed
};

/**
 * Check if order status transition is valid (relaxed for admin flexibility)
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {boolean} - Whether transition is valid
 */
export const canTransitionOrderStatus = (fromStatus, toStatus) => {
  // Prevent same status transitions
  if (fromStatus === toStatus) {
    return false;
  }
  
  const allowedTransitions = ORDER_STATUS_TRANSITIONS[fromStatus];
  return Array.isArray(allowedTransitions) && allowedTransitions.includes(toStatus);
};

/**
 * Get all possible next statuses for current status
 * @param {string} currentStatus - Current order status
 * @returns {string[]} - Array of possible next statuses
 */
export const getNextPossibleStatuses = (currentStatus) => {
  return ORDER_STATUS_TRANSITIONS[currentStatus] || [];
};

/**
 * Check if status is final (no further transitions possible)
 * @param {string} status - Order status to check
 * @returns {boolean} - Whether status is final
 */
export const isFinalStatus = (status) => {
  const transitions = ORDER_STATUS_TRANSITIONS[status];
  return Array.isArray(transitions) && transitions.length === 0;
};