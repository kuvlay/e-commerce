/**
 * Client-side shipping information validation utility
 * Provides comprehensive validation, sanitization, and error handling
 * for shipping info forms in the admin interface
 */

export const VALIDATION_RULES = {
  CARRIER_MAX_LENGTH: 50,
  TRACKING_MAX_LENGTH: 50,
  MIN_FIELD_LENGTH: 1,
  REQUIRED_FIELDS: ['carrier', 'trackingNumber'], // At least one required
  ALLOWED_SPECIAL_CHARS: /^[a-zA-Z0-9\s\-_.#()]+$/,
  TRACKING_PATTERNS: {
    // Common tracking number patterns for validation
    FEDEX: /^(\d{12}|\d{14}|\d{20})$/,
    UPS: /^1Z[0-9A-Z]{16}$/,
    USPS: /^(\d{20}|\d{26})$/,
    DHL: /^(\d{10,11})$/,
    GENERIC: /^[A-Z0-9]{6,30}$/i
  }
};

export const ERROR_TYPES = {
  REQUIRED: 'required',
  TOO_LONG: 'too_long',
  INVALID_CHARS: 'invalid_chars',
  INVALID_FORMAT: 'invalid_format',
  NETWORK_ERROR: 'network_error',
  SERVER_ERROR: 'server_error',
  VALIDATION_ERROR: 'validation_error'
};

export const ERROR_MESSAGES = {
  [ERROR_TYPES.REQUIRED]: 'Please enter at least carrier name or tracking number',
  [ERROR_TYPES.TOO_LONG]: 'Field exceeds maximum length',
  [ERROR_TYPES.INVALID_CHARS]: 'Contains invalid characters',
  [ERROR_TYPES.INVALID_FORMAT]: 'Invalid format',
  [ERROR_TYPES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [ERROR_TYPES.SERVER_ERROR]: 'Server error occurred. Please try again in a moment.',
  [ERROR_TYPES.VALIDATION_ERROR]: 'Validation failed'
};

/**
 * Validates a single field value
 * @param {string} fieldName - Name of the field ('carrier' or 'trackingNumber')
 * @param {string} value - Value to validate
 * @returns {Object} Validation result with isValid, error, and sanitizedValue
 */
export const validateField = (fieldName, value) => {
  const result = {
    isValid: true,
    error: null,
    errorType: null,
    sanitizedValue: '',
    warnings: []
  };

  // Sanitize input
  const trimmedValue = (value || '').toString().trim();
  result.sanitizedValue = trimmedValue;

  // Skip validation for empty values (they're optional individually)
  if (!trimmedValue) {
    return result;
  }

  // Length validation
  const maxLength = fieldName === 'carrier' ? 
    VALIDATION_RULES.CARRIER_MAX_LENGTH : 
    VALIDATION_RULES.TRACKING_MAX_LENGTH;

  if (trimmedValue.length > maxLength) {
    result.isValid = false;
    result.error = `${fieldName === 'carrier' ? 'Carrier name' : 'Tracking number'} must be ${maxLength} characters or less (currently ${trimmedValue.length})`;
    result.errorType = ERROR_TYPES.TOO_LONG;
    return result;
  }

  // Character validation
  if (!VALIDATION_RULES.ALLOWED_SPECIAL_CHARS.test(trimmedValue)) {
    result.isValid = false;
    result.error = `${fieldName === 'carrier' ? 'Carrier name' : 'Tracking number'} contains invalid characters. Only letters, numbers, spaces, and basic punctuation allowed.`;
    result.errorType = ERROR_TYPES.INVALID_CHARS;
    return result;
  }

  // Specific validation for tracking numbers
  if (fieldName === 'trackingNumber' && trimmedValue.length >= 6) {
    const isValidFormat = Object.values(VALIDATION_RULES.TRACKING_PATTERNS)
      .some(pattern => pattern.test(trimmedValue));
    
    if (!isValidFormat && trimmedValue.length > 8) {
      result.warnings.push('Tracking number format not recognized. Please verify it\'s correct.');
    }
  }

  // Specific validation for carrier names
  if (fieldName === 'carrier') {
    const commonCarriers = ['fedex', 'ups', 'usps', 'dhl', 'amazon', 'ontrac', 'lasership'];
    const lowerValue = trimmedValue.toLowerCase();
    const isKnownCarrier = commonCarriers.some(carrier => 
      lowerValue.includes(carrier) || carrier.includes(lowerValue)
    );
    
    if (!isKnownCarrier && trimmedValue.length > 3) {
      result.warnings.push('Carrier name not recognized. Please verify spelling.');
    }
  }

  return result;
};

/**
 * Validates complete shipping information
 * @param {Object} shippingInfo - Object with carrier and trackingNumber
 * @returns {Object} Complete validation result
 */
export const validateShippingInfo = (shippingInfo) => {
  const result = {
    isValid: true,
    errors: {},
    warnings: {},
    sanitizedData: {},
    hasRequiredField: false
  };

  const { carrier = '', trackingNumber = '' } = shippingInfo || {};

  // Validate individual fields
  const carrierValidation = validateField('carrier', carrier);
  const trackingValidation = validateField('trackingNumber', trackingNumber);

  result.sanitizedData.carrier = carrierValidation.sanitizedValue;
  result.sanitizedData.trackingNumber = trackingValidation.sanitizedValue;

  // Check if at least one field has content
  result.hasRequiredField = !!(carrierValidation.sanitizedValue || trackingValidation.sanitizedValue);

  // Collect field-specific errors
  if (!carrierValidation.isValid) {
    result.isValid = false;
    result.errors.carrier = carrierValidation.error;
  }

  if (!trackingValidation.isValid) {
    result.isValid = false;
    result.errors.trackingNumber = trackingValidation.error;
  }

  // Collect warnings
  if (carrierValidation.warnings.length > 0) {
    result.warnings.carrier = carrierValidation.warnings;
  }

  if (trackingValidation.warnings.length > 0) {
    result.warnings.trackingNumber = trackingValidation.warnings;
  }

  // Overall validation - require at least one field
  if (!result.hasRequiredField) {
    result.isValid = false;
    result.errors.general = ERROR_MESSAGES[ERROR_TYPES.REQUIRED];
  }

  return result;
};

/**
 * Sanitizes shipping info for safe storage
 * @param {Object} shippingInfo - Raw shipping info
 * @returns {Object} Sanitized shipping info
 */
export const sanitizeShippingInfo = (shippingInfo) => {
  const validation = validateShippingInfo(shippingInfo);
  return validation.sanitizedData;
};

/**
 * Formats error messages for display
 * @param {Object} validationResult - Result from validateShippingInfo
 * @returns {Object} Formatted error messages
 */
export const formatErrorMessages = (validationResult) => {
  const formatted = {
    fieldErrors: {},
    generalError: null,
    warnings: {},
    hasErrors: false,
    hasWarnings: false
  };

  // Format field-specific errors
  Object.entries(validationResult.errors || {}).forEach(([field, error]) => {
    if (field === 'general') {
      formatted.generalError = error;
    } else {
      formatted.fieldErrors[field] = error;
    }
    formatted.hasErrors = true;
  });

  // Format warnings
  Object.entries(validationResult.warnings || {}).forEach(([field, warnings]) => {
    formatted.warnings[field] = Array.isArray(warnings) ? warnings : [warnings];
    formatted.hasWarnings = true;
  });

  return formatted;
};

/**
 * Determines retry strategy based on error type
 * @param {Error} error - The error that occurred
 * @returns {Object} Retry strategy configuration
 */
export const getRetryStrategy = (error) => {
  const strategy = {
    shouldRetry: false,
    maxRetries: 0,
    delayMs: 1000,
    backoffMultiplier: 1.5,
    errorType: ERROR_TYPES.VALIDATION_ERROR
  };

  // Network errors - retry with backoff
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    strategy.shouldRetry = true;
    strategy.maxRetries = 3;
    strategy.delayMs = 2000;
    strategy.errorType = ERROR_TYPES.NETWORK_ERROR;
  }
  // Server errors (5xx) - retry with longer delay
  else if (error.response?.status >= 500) {
    strategy.shouldRetry = true;
    strategy.maxRetries = 2;
    strategy.delayMs = 5000;
    strategy.errorType = ERROR_TYPES.SERVER_ERROR;
  }
  // Client errors (4xx) - don't retry
  else if (error.response?.status >= 400 && error.response?.status < 500) {
    strategy.shouldRetry = false;
    strategy.errorType = ERROR_TYPES.VALIDATION_ERROR;
  }
  // Timeout errors - retry once
  else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    strategy.shouldRetry = true;
    strategy.maxRetries = 1;
    strategy.delayMs = 3000;
    strategy.errorType = ERROR_TYPES.NETWORK_ERROR;
  }

  return strategy;
};

/**
 * Creates a delay for retry operations
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validates shipping info with real-time feedback
 * @param {Object} shippingInfo - Current shipping info state
 * @param {Object} previousInfo - Previous shipping info for comparison
 * @returns {Object} Real-time validation result
 */
export const validateRealTime = (shippingInfo, previousInfo = {}) => {
  const validation = validateShippingInfo(shippingInfo);
  const formatted = formatErrorMessages(validation);
  
  // Add change detection
  const hasChanges = 
    shippingInfo.carrier !== previousInfo.carrier ||
    shippingInfo.trackingNumber !== previousInfo.trackingNumber;

  return {
    ...formatted,
    hasChanges,
    isReadyToSave: validation.isValid && validation.hasRequiredField && hasChanges,
    sanitizedData: validation.sanitizedData
  };
};

export default {
  validateField,
  validateShippingInfo,
  sanitizeShippingInfo,
  formatErrorMessages,
  getRetryStrategy,
  delay,
  validateRealTime,
  VALIDATION_RULES,
  ERROR_TYPES,
  ERROR_MESSAGES
};