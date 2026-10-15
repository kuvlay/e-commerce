/**
 * Shipping Information Validation Utility
 * 
 * This utility provides validation and sanitization functions for shipping information
 * including carrier names and tracking numbers to ensure data integrity and prevent XSS attacks.
 */

/**
 * Sanitizes a string by trimming whitespace and limiting length
 * @param {string} value - The string to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 50)
 * @returns {string|null} Sanitized string or null if empty
 */
const sanitizeString = (value, maxLength = 50) => {
  if (typeof value !== 'string') return null;
  
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  
  // Limit length to prevent database overflow
  return trimmed.substring(0, maxLength);
};

/**
 * Validates and normalizes shipping information
 * @param {Object} shippingInfo - Raw shipping info from request
 * @param {string} shippingInfo.carrier - Carrier name
 * @param {string} shippingInfo.trackingNumber - Tracking number
 * @param {Date|string} shippingInfo.shippedAt - Shipped date (optional)
 * @param {Object} existingShippingInfo - Current shipping info from database (optional)
 * @returns {Object} Normalized and validated shipping info
 * @throws {Error} If validation fails
 */
export const validateShippingInfo = (shippingInfo, existingShippingInfo = {}) => {
  if (!shippingInfo || typeof shippingInfo !== 'object') {
    throw new Error('Shipping info must be a valid object');
  }
  
  // Sanitize and validate carrier name
  const carrier = sanitizeString(shippingInfo.carrier, 50);
  
  // Sanitize and validate tracking number
  const trackingNumber = sanitizeString(shippingInfo.trackingNumber, 50);
  
  // Allow empty shipping info to clear fields (set to null)
  // But require at least one field if any data is provided
  const hasAnyData = shippingInfo.carrier || shippingInfo.trackingNumber;
  if (hasAnyData && !carrier && !trackingNumber) {
    throw new Error('At least carrier name or tracking number must be valid if shipping info is provided');
  }
  
  // Handle shipped date with proper validation
  let shippedAt;
  if (shippingInfo.shippedAt) {
    shippedAt = new Date(shippingInfo.shippedAt);
    if (isNaN(shippedAt.getTime())) {
      throw new Error('Invalid shipped date format');
    }
  } else {
    // Use existing shippedAt or current date if shipping info is being added
    shippedAt = existingShippingInfo?.shippedAt || new Date();
  }
  
  // Validate field lengths more strictly
  if (carrier && carrier.length > 50) {
    throw new Error('Carrier name cannot exceed 50 characters');
  }
  
  if (trackingNumber && trackingNumber.length > 50) {
    throw new Error('Tracking number cannot exceed 50 characters');
  }
  
  // Validate carrier name format (basic validation)
  if (carrier && !/^[a-zA-Z0-9\s\-_.&()]+$/.test(carrier)) {
    throw new Error('Carrier name contains invalid characters');
  }
  
  // Validate tracking number format (basic validation)
  if (trackingNumber && !/^[a-zA-Z0-9\-_]+$/.test(trackingNumber)) {
    throw new Error('Tracking number contains invalid characters');
  }
  
  return {
    carrier: carrier || null,
    trackingNumber: trackingNumber || null,
    shippedAt
  };
};

/**
 * Validates carrier name specifically
 * @param {string} carrier - Carrier name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidCarrier = (carrier) => {
  if (typeof carrier !== 'string') return false;
  
  const trimmed = carrier.trim();
  return trimmed.length > 0 && trimmed.length <= 50;
};

/**
 * Validates tracking number specifically
 * @param {string} trackingNumber - Tracking number to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidTrackingNumber = (trackingNumber) => {
  if (typeof trackingNumber !== 'string') return false;
  
  const trimmed = trackingNumber.trim();
  return trimmed.length > 0 && trimmed.length <= 50;
};

/**
 * Checks if shipping info has any meaningful data
 * @param {Object} shippingInfo - Shipping info to check
 * @returns {boolean} True if has meaningful data, false otherwise
 */
export const hasShippingData = (shippingInfo) => {
  if (!shippingInfo || typeof shippingInfo !== 'object') return false;
  
  return !!(shippingInfo.carrier?.trim() || shippingInfo.trackingNumber?.trim());
};

/**
 * Creates a clean shipping info object with null values for empty fields
 * @param {Object} shippingInfo - Raw shipping info
 * @returns {Object} Clean shipping info object
 */
export const cleanShippingInfo = (shippingInfo) => {
  if (!shippingInfo || typeof shippingInfo !== 'object') {
    return {
      carrier: null,
      trackingNumber: null,
      shippedAt: null
    };
  }
  
  return {
    carrier: sanitizeString(shippingInfo.carrier) || null,
    trackingNumber: sanitizeString(shippingInfo.trackingNumber) || null,
    shippedAt: shippingInfo.shippedAt ? new Date(shippingInfo.shippedAt) : null
  };
};