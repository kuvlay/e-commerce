/**
 * Input Validation Middleware
 * Comprehensive validation for API endpoints based on DEBUG_LOG.md requirements
 * Provides consistent input validation across all controllers
 */

import { sendValidationErrorResponse } from '../utils/responseWrapper.js';

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} Whether ID is valid
 */
const isValidObjectId = (id) => {
  return id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email && typeof email === 'string' && emailRegex.test(email);
};

/**
 * Validate phone format
 * @param {string} phone - Phone to validate
 * @returns {boolean} Whether phone is valid
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phone && typeof phone === 'string' && phoneRegex.test(phone);
};

/**
 * Validate order status
 * @param {string} status - Status to validate
 * @returns {boolean} Whether status is valid
 */
const isValidOrderStatus = (status) => {
  const validStatuses = ['Pending', 'Placed', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled'];
  return status && typeof status === 'string' && validStatuses.includes(status);
};

/**
 * Validate payment method
 * @param {string} method - Payment method to validate
 * @returns {boolean} Whether method is valid
 */
const isValidPaymentMethod = (method) => {
  const validMethods = ['COD', 'ONLINE', 'Razorpay'];
  return method && typeof method === 'string' && validMethods.includes(method);
};

/**
 * Validate shipping info object
 * @param {Object} shippingInfo - Shipping info to validate
 * @returns {Object} Validation result
 */
const validateShippingInfo = (shippingInfo) => {
  const errors = [];
  
  if (!shippingInfo || typeof shippingInfo !== 'object') {
    return { isValid: false, errors: ['Shipping info must be an object'] };
  }

  if (!shippingInfo.carrier || typeof shippingInfo.carrier !== 'string' || shippingInfo.carrier.trim().length === 0) {
    errors.push('Carrier is required and must be a non-empty string');
  }

  if (!shippingInfo.trackingNumber || typeof shippingInfo.trackingNumber !== 'string' || shippingInfo.trackingNumber.trim().length === 0) {
    errors.push('Tracking number is required and must be a non-empty string');
  }

  if (shippingInfo.carrier && shippingInfo.carrier.length > 100) {
    errors.push('Carrier name must be less than 100 characters');
  }

  if (shippingInfo.trackingNumber && shippingInfo.trackingNumber.length > 50) {
    errors.push('Tracking number must be less than 50 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate order items array
 * @param {Array} items - Items array to validate
 * @returns {Object} Validation result
 */
const validateOrderItems = (items) => {
  const errors = [];

  if (!Array.isArray(items)) {
    return { isValid: false, errors: ['Items must be an array'] };
  }

  if (items.length === 0) {
    return { isValid: false, errors: ['Items array cannot be empty'] };
  }

  items.forEach((item, index) => {
    if (!item.product_id || !isValidObjectId(item.product_id)) {
      errors.push(`Item ${index + 1}: Invalid product_id`);
    }

    if (!item.title || typeof item.title !== 'string' || item.title.trim().length === 0) {
      errors.push(`Item ${index + 1}: Title is required`);
    }

    if (typeof item.price !== 'number' || item.price <= 0) {
      errors.push(`Item ${index + 1}: Price must be a positive number`);
    }

    if (typeof item.qty !== 'number' || item.qty <= 0 || !Number.isInteger(item.qty)) {
      errors.push(`Item ${index + 1}: Quantity must be a positive integer`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate pagination parameters
 * @param {Object} query - Query parameters
 * @returns {Object} Validation result with sanitized values
 */
const validatePagination = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const maxLimit = 100;

  const errors = [];

  if (page < 1) {
    errors.push('Page must be a positive integer');
  }

  if (limit < 1) {
    errors.push('Limit must be a positive integer');
  }

  if (limit > maxLimit) {
    errors.push(`Limit cannot exceed ${maxLimit}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    page: Math.max(1, page),
    limit: Math.min(Math.max(1, limit), maxLimit),
    skip: (Math.max(1, page) - 1) * Math.min(Math.max(1, limit), maxLimit)
  };
};

/**
 * Order status update validation middleware
 */
export const validateOrderStatusUpdate = (req, res, next) => {
  const errors = [];
  const { orderId, status, shippingInfo } = req.body;

  // Validate order ID
  if (!orderId || !isValidObjectId(orderId)) {
    errors.push('Valid order ID is required');
  }

  // Validate status
  if (!status || !isValidOrderStatus(status)) {
    errors.push('Valid order status is required (Pending, Placed, Packed, Shipped, OutForDelivery, Delivered, Cancelled)');
  }

  // Validate shipping info if provided
  if (shippingInfo) {
    const shippingValidation = validateShippingInfo(shippingInfo);
    if (!shippingValidation.isValid) {
      errors.push(...shippingValidation.errors);
    }
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors, 'Invalid order status update data');
  }

  next();
};

/**
 * Order placement validation middleware
 */
export const validateOrderPlacement = (req, res, next) => {
  const errors = [];
  const { items, payment_method, address_id } = req.body;

  // Validate items
  if (items) {
    const itemsValidation = validateOrderItems(items);
    if (!itemsValidation.isValid) {
      errors.push(...itemsValidation.errors);
    }
  } else {
    errors.push('Items are required');
  }

  // Validate payment method
  if (payment_method && !isValidPaymentMethod(payment_method)) {
    errors.push('Valid payment method is required (COD, ONLINE, Razorpay)');
  }

  // Validate address ID if provided
  if (address_id && !isValidObjectId(address_id)) {
    errors.push('Valid address ID is required');
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors, 'Invalid order placement data');
  }

  next();
};

/**
 * Customer ID validation middleware
 */
export const validateCustomerId = (req, res, next) => {
  const { customerId } = req.params;

  if (!customerId || !isValidObjectId(customerId)) {
    return sendValidationErrorResponse(res, 
      [{ field: 'customerId', message: 'Valid customer ID is required' }], 
      'Invalid customer ID'
    );
  }

  next();
};

/**
 * Pagination validation middleware
 */
export const validatePaginationParams = (req, res, next) => {
  const validation = validatePagination(req.query);

  if (!validation.isValid) {
    return sendValidationErrorResponse(res, validation.errors, 'Invalid pagination parameters');
  }

  // Attach validated pagination to request
  req.pagination = {
    page: validation.page,
    limit: validation.limit,
    skip: validation.skip
  };

  next();
};

/**
 * General request body validation middleware
 * @param {Object} schema - Validation schema
 * @returns {Function} Middleware function
 */
export const validateRequestBody = (schema) => {
  return (req, res, next) => {
    const errors = [];

    Object.keys(schema).forEach(field => {
      const rules = schema[field];
      const value = req.body[field];

      // Required validation
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        return;
      }

      // Skip other validations if field is not required and not provided
      if (!rules.required && (value === undefined || value === null)) {
        return;
      }

      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
      }

      // String length validation
      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters long`);
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
      }

      // Number range validation
      if (rules.min && typeof value === 'number' && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }

      if (rules.max && typeof value === 'number' && value > rules.max) {
        errors.push(`${field} must be no more than ${rules.max}`);
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }

      // Custom validation
      if (rules.custom && typeof rules.custom === 'function') {
        const customError = rules.custom(value);
        if (customError) {
          errors.push(customError);
        }
      }

      // Email validation
      if (rules.email && !isValidEmail(value)) {
        errors.push(`${field} must be a valid email address`);
      }

      // ObjectId validation
      if (rules.objectId && !isValidObjectId(value)) {
        errors.push(`${field} must be a valid ObjectId`);
      }
    });

    if (errors.length > 0) {
      return sendValidationErrorResponse(res, errors, 'Validation failed');
    }

    next();
  };
};

/**
 * Sanitize input data
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
export const sanitizeInput = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = {};

  Object.keys(data).forEach(key => {
    const value = data[key];

    if (typeof value === 'string') {
      // Trim whitespace and remove potential XSS
      sanitized[key] = value.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => sanitizeInput(item));
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
};

/**
 * Sanitization middleware
 */
export const sanitizeRequestBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeInput(req.query);
  }

  next();
};

export default {
  validateOrderStatusUpdate,
  validateOrderPlacement,
  validateCustomerId,
  validatePaginationParams,
  validateRequestBody,
  sanitizeRequestBody,
  sanitizeInput,
  isValidObjectId,
  isValidEmail,
  isValidPhone,
  isValidOrderStatus,
  isValidPaymentMethod,
  validateShippingInfo,
  validateOrderItems,
  validatePagination
};