# Customer Name Resolution Utility

## Overview

The `customerNameResolver.js` utility provides robust, priority-based customer name resolution for order displays. It handles both new and legacy order schemas with comprehensive fallback mechanisms.

## Features

- **Priority-based Resolution**: Uses a hierarchical approach to find the best available customer name
- **Schema Compatibility**: Supports both new blueprint schema and legacy order formats
- **Validation**: Validates names to reject placeholder values and invalid data
- **Fallback Mechanisms**: Provides graceful degradation when primary data sources are unavailable
- **Error Handling**: Robust error handling with detailed logging for debugging
- **Consistent Results**: Ensures consistent name display across all order entries

## Priority Order

1. **Backend displayCustomerName** (95% confidence) - Preferred backend-resolved name
2. **User ID populated name** (90% confidence) - From populated user_id.name field
3. **Address snapshot name** (85% confidence) - From new schema address_snapshot.name
4. **Legacy address names** (80% confidence) - Combined firstName + lastName from legacy schema
5. **Legacy address name** (75% confidence) - Single name field from legacy address
6. **Email prefix** (40% confidence) - Formatted name extracted from email address
7. **Order ID fallback** (20% confidence) - Customer #[order_id_suffix]
8. **Final fallback** (0% confidence) - "Valued Customer"

## Usage

```javascript
import { resolveCustomerName, getNameResolutionDebugInfo } from './customerNameResolver';

// Basic usage
const customerInfo = resolveCustomerName(order);
console.log(customerInfo.name); // "John Smith"
console.log(customerInfo.source); // "backend_resolved"
console.log(customerInfo.confidence); // 95

// Debug information
const debugInfo = getNameResolutionDebugInfo(order);
console.log(debugInfo.availableFields);
```

## Return Object Structure

```javascript
{
  name: string,           // Resolved customer name
  source: string,         // Source identifier (e.g., 'backend_resolved')
  confidence: number,     // Confidence level (0-100)
  validated: boolean,     // Whether the name passed validation
  timestamp: string,      // ISO timestamp of resolution
  error?: string         // Error message if resolution failed
}
```

## Validation Rules

Names are validated to ensure quality:

- Must contain at least one letter
- Cannot be empty or whitespace-only
- Rejects common placeholder values (null, undefined, unknown customer, etc.)
- Rejects suspicious patterns (all numbers, special characters only)
- Maximum length validation for security

## Error Handling

The utility handles various error conditions gracefully:

- Invalid order objects
- Missing or corrupted data fields
- Malformed email addresses
- Runtime errors during processing
- Network or data access issues

## Testing

Comprehensive test coverage includes:

- Unit tests for all resolution priorities
- Integration tests with real-world data structures
- Edge case handling
- Error condition testing
- Consistency validation

Run tests with:
```bash
npm test -- src/features/orders/utils/__tests__/
```

## Implementation Notes

- **Performance**: Optimized for fast resolution with early returns
- **Memory**: Minimal memory footprint with efficient string processing
- **Debugging**: Extensive logging in development mode for troubleshooting
- **Compatibility**: Works with both new and legacy order schemas
- **Maintainability**: Clean, documented code with clear separation of concerns

## Migration from Inline Logic

This utility replaces the previous inline customer name resolution logic in `TrackOrders.jsx`, providing:

- Better maintainability and testability
- Consistent behavior across components
- Enhanced validation and error handling
- Improved debugging capabilities
- Reusable functionality for other components