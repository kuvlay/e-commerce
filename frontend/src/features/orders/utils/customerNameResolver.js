/**
 * Customer Name Resolution Utility
 * 
 * Provides priority-based customer name resolution for orders with comprehensive
 * fallback mechanisms and validation. Handles both new and legacy order schemas.
 */

/**
 * Resolves customer name from order data using priority-based approach
 * @param {Object} order - Order object containing customer information
 * @returns {Object} - Resolution result with name, source, confidence, and validation status
 */
export const resolveCustomerName = (order) => {
  try {
    // Enhanced order input validation
    if (!order || typeof order !== 'object' || Array.isArray(order)) {
      console.warn('CustomerNameResolver - Invalid order object:', {
        order,
        type: typeof order,
        isArray: Array.isArray(order)
      });
      return createFallbackResult('Invalid Order', 'invalid_input', 0, false);
    }

    // Validate order has minimum required fields
    if (!order._id) {
      console.warn('CustomerNameResolver - Order missing ID:', order);
      return createFallbackResult('Unknown Order', 'missing_id', 0, false);
    }

    // Enhanced priority-based resolution with comprehensive validation
    const resolutionAttempts = [];

    // Priority 1: Backend displayCustomerName (preferred) - with enhanced validation
    if (order.displayCustomerName && typeof order.displayCustomerName === 'string') {
      const trimmedName = order.displayCustomerName.trim();
      if (isValidName(trimmedName)) {
        return createResult(trimmedName, 'backend_resolved', 95, true);
      }
      resolutionAttempts.push({ source: 'displayCustomerName', value: trimmedName, reason: 'invalid_name' });
    }
    
    // Priority 2: User data from populated user_id - with validation
    if (order.user_id?.name && typeof order.user_id.name === 'string') {
      const trimmedName = order.user_id.name.trim();
      if (isValidName(trimmedName)) {
        return createResult(trimmedName, 'user_id_populated', 90, true);
      }
      resolutionAttempts.push({ source: 'user_id.name', value: trimmedName, reason: 'invalid_name' });
    }
    
    // Priority 3: Address snapshot name (new schema) - with validation
    if (order.address_snapshot?.name && typeof order.address_snapshot.name === 'string') {
      const trimmedName = order.address_snapshot.name.trim();
      if (isValidName(trimmedName)) {
        return createResult(trimmedName, 'address_snapshot', 85, true);
      }
      resolutionAttempts.push({ source: 'address_snapshot.name', value: trimmedName, reason: 'invalid_name' });
    }
    
    // Priority 4: Legacy address firstName + lastName combination - with validation
    if (order.address?.firstName || order.address?.lastName) {
      const firstName = sanitizeNameField(order.address.firstName);
      const lastName = sanitizeNameField(order.address.lastName);
      const fullName = [firstName, lastName].filter(name => name.length > 0).join(' ');
      if (isValidName(fullName)) {
        return createResult(fullName, 'legacy_address_names', 80, true);
      }
      resolutionAttempts.push({ 
        source: 'address.firstName+lastName', 
        value: fullName, 
        reason: fullName.length === 0 ? 'empty_after_sanitization' : 'invalid_name' 
      });
    }
    
    // Priority 5: Legacy address single name field - with validation
    if (order.address?.name && typeof order.address.name === 'string') {
      const trimmedName = order.address.name.trim();
      if (isValidName(trimmedName)) {
        return createResult(trimmedName, 'legacy_address_name', 75, true);
      }
      resolutionAttempts.push({ source: 'address.name', value: trimmedName, reason: 'invalid_name' });
    }
    
    // Priority 6: Email prefix fallback - with enhanced formatting
    if (order.user_id?.email && typeof order.user_id.email === 'string') {
      const emailName = extractNameFromEmail(order.user_id.email);
      if (emailName) {
        return createResult(emailName, 'email_prefix', 40, true);
      }
      resolutionAttempts.push({ 
        source: 'user_id.email', 
        value: order.user_id.email, 
        reason: 'email_extraction_failed' 
      });
    }

    // Log resolution attempts in development for debugging
    if (process.env.NODE_ENV === 'development' && resolutionAttempts.length > 0) {
      import('../../../utils/logger.js').then(({ customerLogger }) => {
        customerLogger.debug('All resolution attempts failed', {
          orderId: order._id,
          attempts: resolutionAttempts
        });
      });
    }
    
    // Priority 7: Order ID based fallback
    if (order._id) {
      const orderIdSuffix = order._id.toString().slice(-6);
      return createResult(`Customer #${orderIdSuffix}`, 'order_id_fallback', 20, false);
    }
    
    // Final fallback
    return createFallbackResult('Valued Customer', 'final_fallback', 0, false);
    
  } catch (resolutionError) {
    import('../../../utils/logger.js').then(({ customerLogger }) => {
      customerLogger.error('Resolution error', { 
        orderId: order?._id,
        error: resolutionError.message,
        stack: resolutionError.stack 
      });
    });
    return createFallbackResult('Customer', 'error_fallback', 0, false, resolutionError.message);
  }
};

/**
 * Validates if a name is acceptable for display
 * @param {string} name - Name to validate
 * @returns {boolean} - True if name is valid
 */
const isValidName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  
  // Check minimum and maximum length
  if (trimmed.length === 0 || trimmed.length > 100) return false;
  
  // Check for invalid placeholder values (case-insensitive)
  const invalidValues = [
    'unknown customer', 'unknown', 'null', 'undefined', 'n/a', 'na', 
    'anonymous', 'guest', 'customer', 'user', 'test', 'admin',
    'default', 'placeholder', 'temp', 'temporary', 'sample',
    'example', 'demo', 'none', 'empty', 'blank'
  ];
  
  if (invalidValues.includes(trimmed.toLowerCase())) return false;
  
  // Check for suspicious patterns
  if (/^[\d\s\-_\.#@]+$/.test(trimmed)) return false; // All numbers/special chars
  if (/^[a-zA-Z]{1}$/.test(trimmed)) return false; // Single letter
  if (/^\d+$/.test(trimmed)) return false; // Only numbers
  if (/^[^a-zA-Z]*$/.test(trimmed)) return false; // No letters at all
  
  // Must contain at least one letter and reasonable character distribution
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  
  // Check for excessive special characters (more than 30% of the string)
  const specialCharCount = (trimmed.match(/[^a-zA-Z0-9\s]/g) || []).length;
  if (specialCharCount > trimmed.length * 0.3) return false;
  
  // Check for repeated characters (like "aaaa" or "1111")
  if (/(.)\1{3,}/.test(trimmed)) return false;
  
  return true;
};

/**
 * Sanitizes and validates a name field
 * @param {string} field - Name field to sanitize
 * @returns {string} - Sanitized name or empty string
 */
const sanitizeNameField = (field) => {
  if (!field || typeof field !== 'string') return '';
  
  const trimmed = field.trim();
  
  // Basic sanitization - remove excessive whitespace and special chars
  const sanitized = trimmed
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-'\.]/g, '')
    .trim();
  
  return sanitized.length > 0 && sanitized.length <= 50 ? sanitized : '';
};

/**
 * Extracts a readable name from email address
 * @param {string} email - Email address
 * @returns {string|null} - Formatted name or null
 */
const extractNameFromEmail = (email) => {
  try {
    if (!email || typeof email !== 'string') return null;
    
    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return null;
    
    const emailParts = email.split('@');
    const emailPrefix = emailParts[0];
    const domain = emailParts[1];
    
    // Validate email structure and length
    if (!emailPrefix || !domain || emailPrefix.length === 0 || emailPrefix.length > 50) return null;
    
    // Skip common non-name prefixes
    const nonNamePrefixes = [
      'admin', 'support', 'info', 'contact', 'sales', 'help', 'service',
      'noreply', 'no-reply', 'donotreply', 'test', 'demo', 'example',
      'user', 'customer', 'guest', 'temp', 'temporary'
    ];
    
    if (nonNamePrefixes.includes(emailPrefix.toLowerCase())) return null;
    
    // Format email prefix into readable name
    let readablePrefix = emailPrefix
      .replace(/[._-]+/g, ' ') // Replace separators with spaces
      .replace(/\d+$/g, '') // Remove trailing numbers
      .replace(/\d{3,}/g, '') // Remove long number sequences
      .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    // Additional cleanup for common patterns
    readablePrefix = readablePrefix
      .replace(/\b(The|A|An)\b/gi, '') // Remove articles
      .replace(/\s+/g, ' ')
      .trim();
    
    // Validate the result
    if (readablePrefix.length >= 2 && 
        readablePrefix.length <= 50 && 
        /[a-zA-Z]{2,}/.test(readablePrefix) &&
        isValidName(readablePrefix)) {
      return readablePrefix;
    }
    
    return null;
  } catch (emailError) {
    console.warn('CustomerNameResolver - Email parsing error:', emailError, { email });
    return null;
  }
};

/**
 * Creates a standard result object
 * @param {string} name - Resolved name
 * @param {string} source - Source of the name
 * @param {number} confidence - Confidence level (0-100)
 * @param {boolean} validated - Whether the name passed validation
 * @returns {Object} - Result object
 */
const createResult = (name, source, confidence, validated) => ({
  name,
  source,
  confidence,
  validated,
  timestamp: new Date().toISOString()
});

/**
 * Creates a fallback result object
 * @param {string} name - Fallback name
 * @param {string} source - Source identifier
 * @param {number} confidence - Confidence level
 * @param {boolean} validated - Validation status
 * @param {string} error - Optional error message
 * @returns {Object} - Fallback result object
 */
const createFallbackResult = (name, source, confidence, validated, error = null) => ({
  name,
  source,
  confidence,
  validated,
  error,
  timestamp: new Date().toISOString()
});

/**
 * Gets debug information about available name fields in an order
 * @param {Object} order - Order object
 * @returns {Object} - Debug information
 */
export const getNameResolutionDebugInfo = (order) => {
  if (!order) return { error: 'No order provided' };
  
  try {
    const debugInfo = {
      orderId: order._id,
      timestamp: new Date().toISOString(),
      availableFields: {
        displayCustomerName: {
          value: order.displayCustomerName,
          type: typeof order.displayCustomerName,
          length: order.displayCustomerName ? order.displayCustomerName.length : 0,
          valid: isValidName(order.displayCustomerName),
          sanitized: order.displayCustomerName ? sanitizeNameField(order.displayCustomerName) : null
        },
        userId_name: {
          value: order.user_id?.name,
          type: typeof order.user_id?.name,
          populated: !!order.user_id,
          valid: isValidName(order.user_id?.name),
          sanitized: order.user_id?.name ? sanitizeNameField(order.user_id.name) : null
        },
        addressSnapshot_name: {
          value: order.address_snapshot?.name,
          hasAddressSnapshot: !!order.address_snapshot,
          valid: isValidName(order.address_snapshot?.name),
          sanitized: order.address_snapshot?.name ? sanitizeNameField(order.address_snapshot.name) : null
        },
        address_firstName: {
          value: order.address?.firstName,
          valid: isValidName(order.address?.firstName),
          sanitized: sanitizeNameField(order.address?.firstName)
        },
        address_lastName: {
          value: order.address?.lastName,
          valid: isValidName(order.address?.lastName),
          sanitized: sanitizeNameField(order.address?.lastName)
        },
        address_name: {
          value: order.address?.name,
          valid: isValidName(order.address?.name),
          sanitized: order.address?.name ? sanitizeNameField(order.address.name) : null
        },
        user_email: {
          value: order.user_id?.email,
          extractedName: extractNameFromEmail(order.user_id?.email),
          isValidEmail: order.user_id?.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.user_id.email) : false
        }
      },
      schemaDetection: {
        hasNewSchema: !!(order.order_status && order.address_snapshot),
        hasLegacySchema: !!(order.status && order.address),
        hasMixedFields: !!(order.order_status && order.status),
        schemaType: (() => {
          if (order.order_status && order.address_snapshot) return 'new';
          if (order.status && order.address) return 'legacy';
          if (order.order_status && order.status) return 'mixed';
          return 'unknown';
        })()
      },
      resolutionSummary: {
        totalFields: Object.keys(order).length,
        nameFieldsAvailable: [
          order.displayCustomerName,
          order.user_id?.name,
          order.address_snapshot?.name,
          order.address?.firstName,
          order.address?.lastName,
          order.address?.name,
          order.user_id?.email
        ].filter(field => field && typeof field === 'string' && field.trim().length > 0).length,
        validNameFields: [
          order.displayCustomerName,
          order.user_id?.name,
          order.address_snapshot?.name,
          order.address?.firstName,
          order.address?.lastName,
          order.address?.name
        ].filter(field => isValidName(field)).length
      }
    };

    return debugInfo;
  } catch (debugError) {
    console.error('CustomerNameResolver - Debug info generation failed:', debugError);
    return { 
      error: 'Debug info generation failed', 
      orderId: order._id,
      errorMessage: debugError.message 
    };
  }
};

export default resolveCustomerName;