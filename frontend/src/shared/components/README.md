# Optional Field Display Components

This directory contains utility components for handling optional field display with optimized conditional rendering and dynamic spacing.

## Components

### OptionalFieldDisplay

A generic utility component for consistent optional field rendering across the application.

**Features:**
- Automatically filters out empty, null, undefined, or whitespace-only fields
- Provides consistent spacing and layout
- Supports custom rendering functions for complex field types
- Returns null when no valid fields exist (prevents empty containers)

**Usage:**
```jsx
import OptionalFieldDisplay from '../shared/components/OptionalFieldDisplay';

const fields = [
  { key: 'name', label: 'Name', value: user.name },
  { key: 'email', label: 'Email', value: user.email },
  { key: 'phone', label: 'Phone', value: user.phone }, // Will be hidden if empty
];

<OptionalFieldDisplay 
  fields={fields}
  className="my-custom-class"
  spacing="space-y-3"
  labelClassName="font-semibold"
/>
```

### OptionalAddressDisplay

Specialized component for address display with smart handling of optional address lines.

**Features:**
- Handles missing `addressLine2` gracefully
- Filters out whitespace-only fields
- Maintains proper address formatting
- Supports compact and full display modes

**Usage:**
```jsx
import { OptionalAddressDisplay } from '../shared/components/OptionalFieldDisplay';

<OptionalAddressDisplay 
  address={userAddress}
  showName={true}
  showPhone={true}
  compact={false}
/>
```

### OptionalShippingDisplay

Specialized component for shipping information with carrier icons and conditional field display.

**Features:**
- Displays carrier-specific icons (FedEx 🚚, UPS 🚛, DHL ✈️, USPS 📮)
- Handles missing tracking numbers, shipping dates, and delivery estimates
- Formats dates consistently
- Returns null when no shipping info is available

**Usage:**
```jsx
import { OptionalShippingDisplay } from '../shared/components/OptionalFieldDisplay';

<OptionalShippingDisplay 
  shippingInfo={order.shippingInfo}
  showIcons={true}
  className="shipping-section"
/>
```

## CSS Classes

### Optional Field Utilities (`optional-fields.css`)

**Dynamic Spacing Classes:**
- `.optional-field-container` - Base container with dynamic spacing
- `.optional-field-container.compact` - Reduced spacing (4px)
- `.optional-field-container.spacious` - Increased spacing (12px)

**Layout Classes:**
- `.optional-field-item` - Individual field styling
- `.optional-field-item:empty` - Hides empty fields
- `.address-display` - Address-specific formatting
- `.shipping-info-display` - Shipping info container styling

**Animation Classes:**
- `.optional-field-fade-in` - Smooth appearance animation
- `.space-y-conditional` - Conditional spacing that adjusts when fields are hidden

## Implementation Examples

### Before Optimization
```jsx
// Problems: Empty lines, inconsistent spacing, always shows containers
<div className="address-section">
  <p>{address.addressLine1}</p>
  <p>{address.addressLine2}</p> {/* Shows empty line if addressLine2 is empty */}
  <p>{address.city}, {address.state} - {address.pincode}</p>
</div>
```

### After Optimization
```jsx
// Solution: Conditional rendering, dynamic spacing, no empty containers
<div className="address-display optional-field-container compact">
  <span className="address-line">{address.addressLine1}</span>
  {address.addressLine2 && address.addressLine2.trim() && (
    <span className="address-line">{address.addressLine2}</span>
  )}
  <span className="address-line">
    {address.city}, {address.state} - {address.pincode}
  </span>
</div>
```

## Benefits

1. **No Empty Gaps**: Optional fields that are empty don't create visual gaps
2. **Dynamic Spacing**: Spacing adjusts automatically when fields are hidden
3. **Consistent Rendering**: Standardized approach across all components
4. **Performance**: Reduces DOM nodes by not rendering empty elements
5. **Accessibility**: Cleaner markup improves screen reader experience
6. **Maintainability**: Centralized logic for optional field handling

## Testing

All components include comprehensive tests covering:
- Valid field rendering
- Empty field filtering
- Whitespace handling
- Null/undefined value handling
- Edge cases and error scenarios

Run tests with:
```bash
npm test -- OptionalFieldDisplay.test.jsx --run
```

## Integration

These components are integrated into:
- `TrackOrders.jsx` - Order details and shipping information
- `AddressManager.jsx` - Address display and management
- `ReviewProduct.jsx` - Address selection and display
- `ShippingInfoDisplay.jsx` - Shipping details component

## Requirements Addressed

This implementation addresses the following requirements from the UI/UX improvements spec:

- **5.1**: Implement conditional rendering for optional shipping fields
- **5.2**: Add dynamic spacing adjustment when optional fields are hidden  
- **5.3**: Remove empty lines and gaps caused by missing optional data
- **5.4**: Ensure consistent display across all order detail components