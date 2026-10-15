/**
 * Enhanced Customer Name Resolution Utility
 * Implements improved field mapping logic as outlined in DEBUG_LOG.md
 * Provides fallback mechanisms for customer name resolution in orders
 */

/**
 * Validates and normalizes user_id data for mixed schema handling
 * @param {Object|null} userIdData - The user_id field data
 * @returns {Object} Validation result with normalized data
 */
const validateUserIdData = (userIdData) => {
  if (!userIdData) {
    return {
      isValid: false,
      isPopulated: false,
      hasName: false,
      name: null,
      email: null,
      phone: null
    };
  }

  // Check if it's a populated Mongoose document
  const isPopulated = !!(userIdData._id && (userIdData.name || userIdData.email));
  
  // Check if it's a plain object with user data
  const isPlainObject = typeof userIdData === 'object' && userIdData !== null && !Array.isArray(userIdData);
  
  // Extract and validate name
  const name = userIdData.name && typeof userIdData.name === 'string' 
    ? userIdData.name.trim() 
    : null;
  const hasName = name && name.length > 0;
  
  // Extract email and phone
  const email = userIdData.email && typeof userIdData.email === 'string' 
    ? userIdData.email.trim() 
    : null;
  const phone = userIdData.phone && typeof userIdData.phone === 'string' 
    ? userIdData.phone.trim() 
    : null;
  
  return {
    isValid: isPlainObject && (hasName || email || phone),
    isPopulated,
    hasName,
    name,
    email,
    phone,
    sourceType: isPopulated ? 'mongoose_populated' : 'manual_attachment'
  };
};

/**
 * Resolves customer name from order data with multiple fallback strategies
 * @param {Object} order - Order object with user and address information
 * @param {Object} options - Configuration options
 * @returns {Object} Resolution result with name, source, and confidence
 */
export const resolveCustomerName = (order, options = {}) => {
  const { 
    includeOrderId = true, 
    preferFullNames = true,
    allowEmailFallback = true,
    allowPhoneFallback = false 
  } = options;

  let displayCustomerName = 'Unknown Customer';
  let nameSource = 'default';
  let confidence = 0; // 0-100 confidence score
  let schemaType = 'unknown'; // Track schema version
  let dataSourceType = 'unknown'; // Track data source type

  // Enhanced user data validation for mixed schema handling
  const userIdData = validateUserIdData(order.user_id);
  const hasLegacyUserId = order.userId && typeof order.userId === 'string';
  
  // Determine schema type for debugging
  if (userIdData.isValid) {
    schemaType = 'new_schema'; // user_id with populated data
    dataSourceType = userIdData.isPopulated ? 'populated_reference' : 'manual_attachment';
  } else if (hasLegacyUserId) {
    schemaType = 'legacy_schema'; // userId string field
    dataSourceType = 'legacy_string_id';
  } else {
    schemaType = 'no_user_reference';
    dataSourceType = 'address_only';
  }

  // Priority 1: user_id.name (populated user data) - Highest confidence
  if (userIdData.isValid && userIdData.hasName) {
    displayCustomerName = userIdData.name;
    nameSource = 'user_id.name';
    confidence = userIdData.isPopulated ? 95 : 90; // Slightly lower confidence for manually attached
  }
  // Priority 2: address_snapshot.name (current order address) - High confidence
  else if (order.address_snapshot?.name && typeof order.address_snapshot.name === 'string' && order.address_snapshot.name.trim().length > 0) {
    displayCustomerName = order.address_snapshot.name.trim();
    nameSource = 'address_snapshot.name';
    confidence = 90;
  }
  // Priority 3: firstName + lastName from legacy address - Good confidence
  else if (order.address?.firstName || order.address?.lastName) {
    const firstName = order.address.firstName?.trim() || '';
    const lastName = order.address.lastName?.trim() || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    
    if (fullName.length > 0) {
      displayCustomerName = fullName;
      nameSource = 'address firstName+lastName';
      confidence = 85;
    }
  }
  // Priority 4: address.name (legacy single name field) - Medium confidence
  else if (order.address?.name && typeof order.address.name === 'string' && order.address.name.trim().length > 0) {
    displayCustomerName = order.address.name.trim();
    nameSource = 'address.name';
    confidence = 75;
  }
  // Priority 5: email prefix (if allowed) - Lower confidence
  else if (allowEmailFallback && (order.user_id?.email || order.address_snapshot?.email || order.address?.email)) {
    const email = order.user_id?.email || order.address_snapshot?.email || order.address?.email;
    const emailPrefix = email.split('@')[0];
    if (emailPrefix && emailPrefix.length > 0) {
      // Attempt to make email prefix more readable
      const readablePrefix = emailPrefix
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      displayCustomerName = readablePrefix;
      nameSource = `email prefix (${order.user_id?.email ? 'user' : (order.address_snapshot?.email ? 'address_snapshot' : 'legacy_address')})`;
      confidence = order.user_id?.email ? 40 : 35;
    }
  }
  // Priority 6: phone fallback (if allowed) - Very low confidence
  else if (allowPhoneFallback && (order.user_id?.phone || order.address_snapshot?.phone || order.address?.phone)) {
    const phone = order.user_id?.phone || order.address_snapshot?.phone || order.address?.phone;
    const phoneSource = order.user_id?.phone ? 'user' : (order.address_snapshot?.phone ? 'address_snapshot' : 'legacy_address');
    displayCustomerName = `Customer ${phone.slice(-4)}`;
    nameSource = `phone fallback (${phoneSource})`;
    confidence = order.user_id?.phone ? 20 : 15;
  }
  // Priority 7: order ID fallback (if allowed) - Lowest confidence
  else if (includeOrderId && order._id) {
    const orderIdSuffix = order._id.toString().slice(-6);
    displayCustomerName = `Customer #${orderIdSuffix}`;
    nameSource = 'order ID';
    confidence = 10;
  }

  // Clean up the resolved name
  displayCustomerName = cleanCustomerName(displayCustomerName);

  return {
    name: displayCustomerName,
    source: nameSource,
    confidence,
    metadata: {
      hasUserId: !!order.user_id,
      hasUserName: !!(order.user_id?.name),
      hasAddressSnapshot: !!(order.address_snapshot?.name),
      hasLegacyAddress: !!(order.address?.firstName || order.address?.lastName || order.address?.name),
      hasEmail: !!(order.user_id?.email),
      hasPhone: !!(order.user_id?.phone || order.address_snapshot?.phone || order.address?.phone),
      // Enhanced schema tracking
      schemaType,
      dataSourceType,
      hasLegacyUserId: hasLegacyUserId,
      legacyUserIdValue: hasLegacyUserId ? order.userId : null,
      userDataValidation: userIdData,
      fieldSources: {
        nameFrom: nameSource,
        emailFrom: order.user_id?.email ? 'user_id' : (order.address_snapshot?.email ? 'address_snapshot' : (order.address?.email ? 'legacy_address' : null)),
        phoneFrom: order.user_id?.phone ? 'user_id' : (order.address_snapshot?.phone ? 'address_snapshot' : (order.address?.phone ? 'legacy_address' : null))
      }
    }
  };
};

/**
 * Cleans and normalizes customer name
 * @param {string} name - Raw customer name
 * @returns {string} Cleaned customer name
 */
export const cleanCustomerName = (name) => {
  if (!name || typeof name !== 'string') {
    return 'Unknown Customer';
  }

  return name
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s.-]/g, '') // Remove special characters except common name chars
    .slice(0, 50); // Limit length
};

/**
 * Resolves customer email with fallback strategies
 * @param {Object} order - Order object
 * @returns {string|null} Customer email or null
 */
export const resolveCustomerEmail = (order) => {
  return order.user_id?.email || 
         order.address_snapshot?.email || 
         order.address?.email || 
         null;
};

/**
 * Resolves customer phone with fallback strategies
 * @param {Object} order - Order object
 * @returns {string|null} Customer phone or null
 */
export const resolveCustomerPhone = (order) => {
  return order.user_id?.phone || 
         order.address_snapshot?.phone || 
         order.address?.phone || 
         null;
};

/**
 * Enhanced customer data resolver for admin panels
 * @param {Object} order - Order object
 * @param {Object} options - Resolution options
 * @returns {Object} Complete customer data object
 */
export const resolveCustomerData = (order, options = {}) => {
  const nameResolution = resolveCustomerName(order, options);
  
  return {
    displayCustomerName: nameResolution.name,
    customerEmail: resolveCustomerEmail(order),
    customerPhone: resolveCustomerPhone(order),
    nameResolution: {
      source: nameResolution.source,
      confidence: nameResolution.confidence,
      metadata: nameResolution.metadata
    },
    hasCompleteUserData: !!(order.user_id?.name && order.user_id?.email),
    dataQuality: calculateDataQuality(order),
    // Enhanced schema tracking for debugging
    schemaInfo: {
      type: nameResolution.metadata.schemaType,
      dataSource: nameResolution.metadata.dataSourceType,
      hasLegacyFields: nameResolution.metadata.hasLegacyUserId,
      userDataReliability: nameResolution.metadata.userDataValidation?.sourceType || 'unknown'
    }
  };
};

/**
 * Calculates overall data quality score for customer information
 * @param {Object} order - Order object
 * @returns {number} Quality score 0-100
 */
export const calculateDataQuality = (order) => {
  let score = 0;
  let maxScore = 0;

  // User ID presence (20 points)
  maxScore += 20;
  if (order.user_id) score += 20;

  // User name (25 points)
  maxScore += 25;
  if (order.user_id?.name) score += 25;

  // User email (20 points)
  maxScore += 20;
  if (order.user_id?.email) score += 20;

  // Address data (20 points)
  maxScore += 20;
  if (order.address_snapshot?.name || order.address?.firstName || order.address?.lastName) {
    score += 20;
  } else if (order.address?.name) {
    score += 10;
  }

  // Phone data (15 points)
  maxScore += 15;
  if (order.user_id?.phone || order.address_snapshot?.phone || order.address?.phone) {
    score += 15;
  }

  return Math.round((score / maxScore) * 100);
};

/**
 * Batch process orders for enhanced customer name resolution
 * @param {Array} orders - Array of order objects
 * @param {Object} options - Resolution options
 * @returns {Array} Orders with enhanced customer data
 */
export const batchResolveCustomerNames = (orders, options = {}) => {
  const { logStats = false, maxLogEntries = 5 } = options;

  if (!Array.isArray(orders)) {
    return [];
  }

  console.log(`🔄 Processing ${orders.length} orders for customer name resolution...`);

  const enhancedOrders = orders.map((order, index) => {
    const customerData = resolveCustomerData(order, options);
    
    // Enhanced logging for mixed schema debugging
    if (logStats && index < maxLogEntries) {
      console.log(`📝 Order ${order._id} customer resolution:`, {
        originalName: order.user_id?.name,
        resolvedName: customerData.displayCustomerName,
        source: customerData.nameResolution.source,
        confidence: customerData.nameResolution.confidence,
        dataQuality: customerData.dataQuality,
        schemaType: customerData.schemaInfo.type,
        dataSource: customerData.schemaInfo.dataSource,
        hasLegacyUserId: customerData.schemaInfo.hasLegacyFields,
        legacyUserIdValue: customerData.nameResolution.metadata.legacyUserIdValue,
        userDataReliability: customerData.schemaInfo.userDataReliability,
        fieldSources: customerData.nameResolution.metadata.fieldSources
      });
    }

    // Return order with enhanced customer data
    return {
      ...order,
      ...customerData
    };
  });

  // Enhanced summary statistics for schema analysis
  if (logStats) {
    const schemaStats = {
      totalOrders: enhancedOrders.length,
      highConfidenceNames: enhancedOrders.filter(o => o.nameResolution.confidence >= 80).length,
      mediumConfidenceNames: enhancedOrders.filter(o => o.nameResolution.confidence >= 40 && o.nameResolution.confidence < 80).length,
      lowConfidenceNames: enhancedOrders.filter(o => o.nameResolution.confidence < 40).length,
      averageDataQuality: Math.round(enhancedOrders.reduce((sum, o) => sum + o.dataQuality, 0) / enhancedOrders.length),
      sourcesUsed: [...new Set(enhancedOrders.map(o => o.nameResolution.source))],
      // Schema distribution analysis
      schemaTypes: {
        newSchema: enhancedOrders.filter(o => o.schemaInfo.type === 'new_schema').length,
        legacySchema: enhancedOrders.filter(o => o.schemaInfo.type === 'legacy_schema').length,
        noUserReference: enhancedOrders.filter(o => o.schemaInfo.type === 'no_user_reference').length
      },
      dataSourceTypes: {
        populatedReference: enhancedOrders.filter(o => o.schemaInfo.dataSource === 'populated_reference').length,
        manualAttachment: enhancedOrders.filter(o => o.schemaInfo.dataSource === 'manual_attachment').length,
        legacyStringId: enhancedOrders.filter(o => o.schemaInfo.dataSource === 'legacy_string_id').length,
        addressOnly: enhancedOrders.filter(o => o.schemaInfo.dataSource === 'address_only').length
      },
      legacyOrdersProcessed: enhancedOrders.filter(o => o.schemaInfo.hasLegacyFields).length
    };

    console.log('📊 Enhanced customer name resolution summary:', schemaStats);
    console.log('🔍 Schema distribution analysis:', {
      newVsLegacy: `${schemaStats.schemaTypes.newSchema} new, ${schemaStats.schemaTypes.legacySchema} legacy`,
      dataReliability: `${schemaStats.dataSourceTypes.populatedReference} populated, ${schemaStats.dataSourceTypes.manualAttachment} manual`,
      resolutionEffectiveness: `${schemaStats.highConfidenceNames}/${schemaStats.totalOrders} high confidence (${Math.round(schemaStats.highConfidenceNames/schemaStats.totalOrders*100)}%)`
    });
  }

  return enhancedOrders;
};

export default {
  resolveCustomerName,
  resolveCustomerEmail,
  resolveCustomerPhone,
  resolveCustomerData,
  cleanCustomerName,
  calculateDataQuality,
  batchResolveCustomerNames
};