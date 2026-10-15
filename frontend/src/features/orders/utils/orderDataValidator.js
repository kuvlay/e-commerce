/**
 * Order Data Validation Utility
 * Provides comprehensive validation and sanitization for order data structures
 */

/**
 * Validates and sanitizes a single order object
 * @param {any} order - The order object to validate
 * @param {number} index - The index of the order in the array (for logging)
 * @returns {Object|null} - Validated order object or null if invalid
 */
export const validateOrder = (order, index = 0) => {
  try {
    // Basic structure validation
    if (!order || typeof order !== 'object' || Array.isArray(order)) {
      console.warn('OrderValidator - Invalid order structure:', {
        order,
        index,
        type: typeof order,
        isArray: Array.isArray(order)
      });
      return null;
    }

    // Critical field validation
    const validation = {
      hasId: !!(order._id && typeof order._id === 'string'),
      hasStatus: !!(order.order_status || order.status),
      hasDate: !!(order.date || order.created_at),
      hasAmount: !!(order.amount || order.totals?.grand_total),
      hasItems: Array.isArray(order.items)
    };

    // Log validation issues in development
    if (process.env.NODE_ENV === 'development') {
      const issues = Object.entries(validation)
        .filter(([key, isValid]) => !isValid)
        .map(([key]) => key);
      
      if (issues.length > 0) {
        console.warn('OrderValidator - Order validation issues:', {
          orderId: order._id,
          index,
          issues,
          validation
        });
      }
    }

    // Reject orders missing critical fields
    if (!validation.hasId || !validation.hasStatus) {
      console.error('OrderValidator - Order missing critical fields:', {
        orderId: order._id,
        index,
        validation
      });
      return null;
    }

    // Validate and sanitize items array
    const validatedItems = validateOrderItems(order.items || [], order._id);

    // Create sanitized order object
    const sanitizedOrder = {
      ...order,
      items: validatedItems,
      // Ensure consistent field names
      order_status: order.order_status || order.status,
      date: order.date || order.created_at,
      amount: order.amount || order.totals?.grand_total || 0,
      // Add validation metadata
      _validated: true,
      _validationTimestamp: Date.now(),
      _hasValidItems: validatedItems.length > 0
    };

    return sanitizedOrder;

  } catch (error) {
    console.error('OrderValidator - Order validation error:', error, {
      order: {
        id: order?._id,
        hasItems: Array.isArray(order?.items)
      },
      index
    });
    return null;
  }
};

/**
 * Validates and sanitizes order items array
 * @param {Array} items - The items array to validate
 * @param {string} orderId - The order ID for logging context
 * @returns {Array} - Array of validated items
 */
export const validateOrderItems = (items, orderId) => {
  if (!Array.isArray(items)) {
    console.warn('OrderValidator - Items is not an array:', {
      items,
      orderId,
      type: typeof items
    });
    return [];
  }

  return items.filter((item, itemIndex) => {
    try {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        console.warn('OrderValidator - Invalid item structure:', {
          item,
          orderId,
          itemIndex,
          type: typeof item
        });
        return false;
      }

      // Validate critical item fields
      const hasProductId = !!(item.product_id || item._id);
      const hasTitle = !!(item.title || item.name);
      const hasPrice = typeof item.price === 'number' && item.price >= 0;
      const hasQuantity = typeof (item.qty || item.quantity) === 'number' && (item.qty || item.quantity) > 0;

      if (!hasProductId) {
        console.warn('OrderValidator - Item missing product identifier:', {
          item,
          orderId,
          itemIndex
        });
        return false;
      }

      // Add validation metadata to item
      item._validated = true;
      item._hasProductId = hasProductId;
      item._hasTitle = hasTitle;
      item._hasPrice = hasPrice;
      item._hasQuantity = hasQuantity;

      return true;

    } catch (itemError) {
      console.error('OrderValidator - Item validation error:', itemError, {
        item,
        orderId,
        itemIndex
      });
      return false;
    }
  });
};

/**
 * Validates the entire orders array from API response
 * @param {any} ordersData - The orders data from API response
 * @returns {Object} - Validation result with sanitized orders and metadata
 */
export const validateOrdersArray = (ordersData) => {
  const result = {
    orders: [],
    metadata: {
      originalCount: 0,
      validCount: 0,
      invalidCount: 0,
      errors: [],
      warnings: []
    }
  };

  try {
    // Handle null/undefined data
    if (ordersData === null || ordersData === undefined) {
      console.warn('OrderValidator - Orders data is null/undefined, returning empty array');
      return result;
    }

    // Validate orders array structure
    if (!Array.isArray(ordersData)) {
      const error = `Invalid orders data structure: expected array, got ${typeof ordersData}`;
      console.error('OrderValidator - ' + error, {
        ordersData: typeof ordersData === 'object' ? Object.keys(ordersData || {}) : ordersData,
        type: typeof ordersData,
        isArray: Array.isArray(ordersData)
      });
      result.metadata.errors.push(error);
      return result;
    }

    result.metadata.originalCount = ordersData.length;

    // Validate each order
    const validatedOrders = ordersData
      .map((order, index) => validateOrder(order, index))
      .filter(order => order !== null);

    result.orders = validatedOrders;
    result.metadata.validCount = validatedOrders.length;
    result.metadata.invalidCount = result.metadata.originalCount - result.metadata.validCount;

    // Log validation summary
    if (process.env.NODE_ENV === 'development') {
      console.log('OrderValidator - Validation summary:', {
        originalCount: result.metadata.originalCount,
        validCount: result.metadata.validCount,
        invalidCount: result.metadata.invalidCount,
        successRate: `${((result.metadata.validCount / result.metadata.originalCount) * 100).toFixed(1)}%`
      });
    }

    return result;

  } catch (error) {
    console.error('OrderValidator - Orders array validation error:', error);
    result.metadata.errors.push(`Validation failed: ${error.message}`);
    return result;
  }
};

/**
 * Validates shipping information structure
 * @param {any} shippingInfo - The shipping info object to validate
 * @returns {Object|null} - Validated shipping info or null if invalid
 */
export const validateShippingInfo = (shippingInfo) => {
  try {
    if (!shippingInfo || typeof shippingInfo !== 'object' || Array.isArray(shippingInfo)) {
      return null;
    }

    const validated = {};
    
    // Validate and sanitize carrier
    if (shippingInfo.carrier && typeof shippingInfo.carrier === 'string') {
      const carrier = shippingInfo.carrier.trim();
      if (carrier.length > 0) {
        validated.carrier = carrier;
      }
    }

    // Validate and sanitize tracking number
    if (shippingInfo.trackingNumber && typeof shippingInfo.trackingNumber === 'string') {
      const trackingNumber = shippingInfo.trackingNumber.trim();
      if (trackingNumber.length > 0) {
        validated.trackingNumber = trackingNumber;
      }
    }

    // Validate shipping date
    if (shippingInfo.shippedAt) {
      try {
        const date = new Date(shippingInfo.shippedAt);
        if (!isNaN(date.getTime())) {
          validated.shippedAt = shippingInfo.shippedAt;
        }
      } catch (dateError) {
        console.warn('OrderValidator - Invalid shipping date:', shippingInfo.shippedAt);
      }
    }

    // Return validated object only if it has at least one valid field
    return Object.keys(validated).length > 0 ? validated : null;

  } catch (error) {
    console.error('OrderValidator - Shipping info validation error:', error);
    return null;
  }
};

/**
 * Creates a fallback order object for display when validation fails
 * @param {any} originalOrder - The original order data that failed validation
 * @param {number} index - The index of the order
 * @returns {Object} - Fallback order object
 */
export const createFallbackOrder = (originalOrder, index) => {
  return {
    _id: originalOrder?._id || `fallback-${index}-${Date.now()}`,
    order_status: 'unknown',
    date: originalOrder?.date || originalOrder?.created_at || new Date().toISOString(),
    amount: 0,
    items: [],
    _isFallback: true,
    _originalData: originalOrder,
    _validated: false
  };
};