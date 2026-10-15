/**
 * Comprehensive Data Sanitization Utilities
 * Provides robust data cleaning and validation for various data types
 */

/**
 * Sanitizes and validates string data
 * @param {any} value - The value to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string|null} - Sanitized string or null if invalid
 */
export const sanitizeString = (value, options = {}) => {
  const {
    maxLength = 1000,
    minLength = 0,
    allowEmpty = true,
    trim = true,
    removeHtml = true
  } = options;

  try {
    if (value === null || value === undefined) {
      return allowEmpty ? '' : null;
    }

    let sanitized = String(value);

    if (trim) {
      sanitized = sanitized.trim();
    }

    if (removeHtml) {
      // Remove HTML tags and decode HTML entities
      sanitized = sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'");
    }

    if (sanitized.length < minLength || sanitized.length > maxLength) {
      return null;
    }

    return sanitized;
  } catch (error) {
    console.warn('DataSanitizer - String sanitization failed:', error);
    return null;
  }
};

/**
 * Sanitizes and validates numeric data
 * @param {any} value - The value to sanitize
 * @param {Object} options - Sanitization options
 * @returns {number|null} - Sanitized number or null if invalid
 */
export const sanitizeNumber = (value, options = {}) => {
  const {
    min = -Infinity,
    max = Infinity,
    allowFloat = true,
    defaultValue = null
  } = options;

  try {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }

    let num = Number(value);

    if (isNaN(num) || !isFinite(num)) {
      return defaultValue;
    }

    if (!allowFloat) {
      num = Math.floor(num);
    }

    if (num < min || num > max) {
      return defaultValue;
    }

    return num;
  } catch (error) {
    console.warn('DataSanitizer - Number sanitization failed:', error);
    return defaultValue;
  }
};

/**
 * Sanitizes and validates array data
 * @param {any} value - The value to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Array} - Sanitized array
 */
export const sanitizeArray = (value, options = {}) => {
  const {
    maxLength = 1000,
    itemSanitizer = null,
    filterNulls = true
  } = options;

  try {
    if (!Array.isArray(value)) {
      return [];
    }

    let sanitized = [...value];

    if (itemSanitizer && typeof itemSanitizer === 'function') {
      sanitized = sanitized.map(itemSanitizer);
    }

    if (filterNulls) {
      sanitized = sanitized.filter(item => item !== null && item !== undefined);
    }

    if (sanitized.length > maxLength) {
      sanitized = sanitized.slice(0, maxLength);
    }

    return sanitized;
  } catch (error) {
    console.warn('DataSanitizer - Array sanitization failed:', error);
    return [];
  }
};/**

 * Sanitizes product data structure
 * @param {any} product - The product object to sanitize
 * @returns {Object|null} - Sanitized product or null if invalid
 */
export const sanitizeProductData = (product) => {
  try {
    if (!product || typeof product !== 'object' || Array.isArray(product)) {
      return null;
    }

    const sanitized = {
      _id: sanitizeString(product._id, { minLength: 1, maxLength: 100 }),
      name: sanitizeString(product.name, { minLength: 1, maxLength: 200 }),
      category: sanitizeString(product.category, { maxLength: 100 }),
      price: sanitizeNumber(product.price, { min: 0, max: 999999 }),
      image: sanitizeArray(product.image, { 
        maxLength: 10,
        itemSanitizer: (url) => sanitizeString(url, { maxLength: 500 })
      }),
      description: sanitizeString(product.description, { maxLength: 2000 }),
      bestseller: Boolean(product.bestseller),
      featured: Boolean(product.featured),
      featuredPriority: sanitizeNumber(product.featuredPriority, { 
        min: 1, 
        max: 3, 
        allowFloat: false,
        defaultValue: null 
      })
    };

    // Validate required fields
    if (!sanitized._id || !sanitized.name || sanitized.price === null) {
      return null;
    }

    // Ensure image array has at least one valid URL
    if (!sanitized.image || sanitized.image.length === 0) {
      return null;
    }

    // Handle measurements/sizes
    if (product.measurements && Array.isArray(product.measurements)) {
      sanitized.measurements = sanitizeArray(product.measurements, {
        maxLength: 20,
        itemSanitizer: (measurement) => {
          if (!measurement || typeof measurement !== 'object') return null;
          return {
            value: sanitizeString(measurement.value, { minLength: 1, maxLength: 50 }),
            price: sanitizeNumber(measurement.price, { min: 0, max: 999999 }),
            label: sanitizeString(measurement.label, { maxLength: 100 })
          };
        }
      });
    }

    return sanitized;
  } catch (error) {
    console.error('DataSanitizer - Product sanitization failed:', error);
    return null;
  }
};

/**
 * Sanitizes order item data
 * @param {any} item - The order item to sanitize
 * @returns {Object|null} - Sanitized item or null if invalid
 */
export const sanitizeOrderItem = (item) => {
  try {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return null;
    }

    const sanitized = {
      _id: sanitizeString(item._id || item.product_id, { minLength: 1, maxLength: 100 }),
      product_id: sanitizeString(item.product_id || item._id, { minLength: 1, maxLength: 100 }),
      title: sanitizeString(item.title || item.name, { minLength: 1, maxLength: 200 }),
      name: sanitizeString(item.name || item.title, { minLength: 1, maxLength: 200 }),
      price: sanitizeNumber(item.price, { min: 0, max: 999999, defaultValue: 0 }),
      qty: sanitizeNumber(item.qty || item.quantity, { min: 1, max: 1000, allowFloat: false, defaultValue: 1 }),
      quantity: sanitizeNumber(item.quantity || item.qty, { min: 1, max: 1000, allowFloat: false, defaultValue: 1 }),
      size: sanitizeString(item.size, { maxLength: 50 }),
      measurement: sanitizeString(item.measurement, { maxLength: 50 })
    };

    // Validate required fields
    if (!sanitized.product_id || !sanitized.title) {
      return null;
    }

    return sanitized;
  } catch (error) {
    console.error('DataSanitizer - Order item sanitization failed:', error);
    return null;
  }
};

/**
 * Sanitizes complete order data
 * @param {any} order - The order object to sanitize
 * @returns {Object|null} - Sanitized order or null if invalid
 */
export const sanitizeOrderData = (order) => {
  try {
    if (!order || typeof order !== 'object' || Array.isArray(order)) {
      return null;
    }

    const sanitized = {
      _id: sanitizeString(order._id, { minLength: 1, maxLength: 100 }),
      order_status: sanitizeString(order.order_status || order.status, { maxLength: 50 }),
      status: sanitizeString(order.status || order.order_status, { maxLength: 50 }),
      date: order.date || order.created_at || new Date().toISOString(),
      amount: sanitizeNumber(order.amount || order.total, { min: 0, max: 999999, defaultValue: 0 }),
      total: sanitizeNumber(order.total || order.amount, { min: 0, max: 999999, defaultValue: 0 }),
      paymentMethod: sanitizeString(order.paymentMethod, { maxLength: 50 }),
      items: sanitizeArray(order.items, {
        maxLength: 100,
        itemSanitizer: sanitizeOrderItem
      })
    };

    // Validate required fields
    if (!sanitized._id || !sanitized.order_status) {
      return null;
    }

    // Validate date
    try {
      const dateObj = new Date(sanitized.date);
      if (isNaN(dateObj.getTime())) {
        sanitized.date = new Date().toISOString();
      }
    } catch (dateError) {
      sanitized.date = new Date().toISOString();
    }

    // Handle shipping info
    if (order.shippingInfo && typeof order.shippingInfo === 'object') {
      sanitized.shippingInfo = {
        carrier: sanitizeString(order.shippingInfo.carrier, { maxLength: 100 }),
        trackingNumber: sanitizeString(order.shippingInfo.trackingNumber, { maxLength: 100 }),
        shippedAt: order.shippingInfo.shippedAt,
        estimatedDelivery: order.shippingInfo.estimatedDelivery
      };

      // Remove empty shipping info
      const hasValidShippingInfo = Object.values(sanitized.shippingInfo)
        .some(value => value && value.toString().trim().length > 0);
      
      if (!hasValidShippingInfo) {
        delete sanitized.shippingInfo;
      }
    }

    // Add validation metadata
    sanitized._sanitized = true;
    sanitized._sanitizedAt = Date.now();
    sanitized._hasValidItems = sanitized.items.length > 0;

    return sanitized;
  } catch (error) {
    console.error('DataSanitizer - Order sanitization failed:', error);
    return null;
  }
};

/**
 * Sanitizes API response data
 * @param {any} response - The API response to sanitize
 * @param {string} dataType - The type of data being sanitized
 * @returns {Object} - Sanitized response with metadata
 */
export const sanitizeApiResponse = (response, dataType = 'unknown') => {
  const result = {
    success: false,
    data: null,
    errors: [],
    metadata: {
      dataType,
      originalSize: 0,
      sanitizedSize: 0,
      sanitizedAt: Date.now()
    }
  };

  try {
    if (!response || typeof response !== 'object') {
      result.errors.push('Invalid response structure');
      return result;
    }

    result.success = Boolean(response.success);

    switch (dataType) {
      case 'orders':
        if (Array.isArray(response.orders)) {
          result.metadata.originalSize = response.orders.length;
          result.data = sanitizeArray(response.orders, {
            itemSanitizer: sanitizeOrderData
          });
          result.metadata.sanitizedSize = result.data.length;
        }
        break;

      case 'products':
        if (Array.isArray(response.products)) {
          result.metadata.originalSize = response.products.length;
          result.data = sanitizeArray(response.products, {
            itemSanitizer: sanitizeProductData
          });
          result.metadata.sanitizedSize = result.data.length;
        }
        break;

      default:
        result.data = response;
        break;
    }

    return result;
  } catch (error) {
    console.error('DataSanitizer - API response sanitization failed:', error);
    result.errors.push(`Sanitization failed: ${error.message}`);
    return result;
  }
};