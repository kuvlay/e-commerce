/**
 * Demonstration of Enhanced Customer Name Resolution
 * 
 * This script shows how the customer name resolution works with various order formats
 * and demonstrates the improvements made for task 8.
 */

import { resolveCustomerName, getNameResolutionDebugInfo } from './customerNameResolver.js';

// Sample orders with different data formats
const sampleOrders = [
  {
    _id: '507f1f77bcf86cd799439011',
    displayCustomerName: 'John Doe',
    user_id: { name: 'Jane Smith', email: 'jane@example.com' },
    order_status: 'shipped',
    description: 'Order with backend-resolved displayCustomerName (highest priority)'
  },
  {
    _id: '507f1f77bcf86cd799439012',
    user_id: { name: 'Jane Smith', email: 'jane@example.com' },
    order_status: 'delivered',
    description: 'Order with populated user_id name (second priority)'
  },
  {
    _id: '507f1f77bcf86cd799439013',
    address_snapshot: { name: 'Bob Wilson' },
    order_status: 'pending',
    description: 'Order with address_snapshot name (new schema, third priority)'
  },
  {
    _id: '507f1f77bcf86cd799439014',
    address: {
      firstName: 'Alice',
      lastName: 'Johnson'
    },
    status: 'shipped',
    description: 'Legacy order with firstName + lastName (fourth priority)'
  },
  {
    _id: '507f1f77bcf86cd799439015',
    address: { name: 'Charlie Brown' },
    status: 'delivered',
    description: 'Legacy order with single name field (fifth priority)'
  },
  {
    _id: '507f1f77bcf86cd799439016',
    user_id: { email: 'mary.jane.watson123@example.com' },
    order_status: 'packed',
    description: 'Order with only email (email extraction, sixth priority)'
  },
  {
    _id: '507f1f77bcf86cd799439017',
    order_status: 'shipped',
    description: 'Order with no customer information (fallback to order ID)'
  },
  {
    _id: '507f1f77bcf86cd799439018',
    displayCustomerName: 'Unknown Customer', // Invalid placeholder
    user_id: { name: 'null', email: 'admin@example.com' }, // Invalid name and admin email
    address_snapshot: { name: 'test' }, // Invalid placeholder
    description: 'Order with invalid names (should use fallback)'
  }
];

console.log('🔍 Enhanced Customer Name Resolution Demonstration\n');
console.log('=' .repeat(80));

sampleOrders.forEach((order, index) => {
  console.log(`\n📋 Order ${index + 1}: ${order.description}`);
  console.log('-'.repeat(60));
  
  try {
    const resolution = resolveCustomerName(order);
    const debugInfo = getNameResolutionDebugInfo(order);
    
    console.log(`✅ Resolved Name: "${resolution.name}"`);
    console.log(`📊 Source: ${resolution.source}`);
    console.log(`🎯 Confidence: ${resolution.confidence}%`);
    console.log(`✔️  Validated: ${resolution.validated}`);
    
    if (resolution.error) {
      console.log(`⚠️  Error: ${resolution.error}`);
    }
    
    // Show available fields for debugging
    console.log(`\n🔧 Available Fields:`);
    Object.entries(debugInfo.availableFields).forEach(([field, info]) => {
      if (info.value) {
        console.log(`   ${field}: "${info.value}" (valid: ${info.valid})`);
      }
    });
    
    console.log(`📋 Schema Type: ${debugInfo.schemaDetection.schemaType}`);
    console.log(`📈 Resolution Summary: ${debugInfo.resolutionSummary.validNameFields}/${debugInfo.resolutionSummary.nameFieldsAvailable} valid name fields`);
    
  } catch (error) {
    console.log(`❌ Resolution failed: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('🎉 Demonstration complete!');
console.log('\nKey improvements in this implementation:');
console.log('✅ Priority-based customer name resolution');
console.log('✅ Comprehensive fallback logic for missing user data');
console.log('✅ Support for both new and legacy order data formats');
console.log('✅ Enhanced validation to reject invalid placeholder names');
console.log('✅ Improved email extraction with better formatting');
console.log('✅ Robust error handling and debugging information');
console.log('✅ Consistent name display across all order entries');

export { sampleOrders };