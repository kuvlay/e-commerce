import React from 'react';

/**
 * OptionalFieldDisplay - A utility component for consistent optional field rendering
 * Handles conditional display and dynamic spacing for optional fields
 */
const OptionalFieldDisplay = ({ 
  fields, 
  className = '', 
  spacing = 'space-y-2',
  itemClassName = '',
  labelClassName = 'font-medium',
  valueClassName = ''
}) => {
  // Filter out empty, null, undefined, or whitespace-only fields
  const validFields = fields.filter(field => {
    if (!field || typeof field !== 'object') return false;
    
    const value = field.value;
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && !value.trim()) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    
    return true;
  });

  if (validFields.length === 0) {
    return null;
  }

  return (
    <div className={`${spacing} ${className}`}>
      {validFields.map((field, index) => (
        <div key={field.key || index} className={`flex items-center gap-2 ${itemClassName}`}>
          {field.label && (
            <span className={labelClassName}>
              {field.label}:
            </span>
          )}
          <span className={valueClassName}>
            {field.render ? field.render(field.value) : field.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * OptionalAddressDisplay - Specialized component for address display
 */
export const OptionalAddressDisplay = ({ 
  address, 
  className = '', 
  showName = true,
  showPhone = true,
  compact = false 
}) => {
  if (!address) return null;

  const addressFields = [];

  if (showName && address.fullName) {
    addressFields.push({
      key: 'fullName',
      value: address.fullName,
      render: (value) => <span className="font-medium text-gray-900">{value}</span>
    });
  }

  if (showPhone && address.phone) {
    addressFields.push({
      key: 'phone',
      value: address.phone,
      render: (value) => <span className="text-gray-600">{value}</span>
    });
  }

  // Address lines with conditional rendering
  const addressLines = [];
  
  if (address.addressLine1) {
    addressLines.push(address.addressLine1);
  }
  
  if (address.addressLine2 && address.addressLine2.trim()) {
    addressLines.push(address.addressLine2);
  }

  if (addressLines.length > 0) {
    addressFields.push({
      key: 'addressLines',
      value: addressLines,
      render: (lines) => (
        <div className="text-gray-600 space-y-1">
          {lines.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      )
    });
  }

  // City, state, pincode
  if (address.city && address.state && address.pincode) {
    const locationText = `${address.city}, ${address.state} - ${address.pincode}`;
    addressFields.push({
      key: 'location',
      value: locationText,
      render: (value) => <span className="text-gray-600">{value}</span>
    });
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {addressFields.map((field, index) => (
        <div key={field.key}>
          {field.render(field.value)}
        </div>
      ))}
    </div>
  );
};

/**
 * OptionalShippingDisplay - Specialized component for shipping info display
 */
export const OptionalShippingDisplay = ({ 
  shippingInfo, 
  className = '',
  showIcons = true 
}) => {
  if (!shippingInfo) return null;

  const getCarrierIcon = (carrier) => {
    if (!showIcons || !carrier) return null;
    
    const carrierLower = carrier.toLowerCase();
    if (carrierLower.includes('fedex')) return '🚚';
    if (carrierLower.includes('ups')) return '🚛';
    if (carrierLower.includes('dhl')) return '✈️';
    if (carrierLower.includes('usps')) return '📮';
    return '📦';
  };

  const shippingFields = [
    {
      key: 'carrier',
      label: 'Carrier',
      value: shippingInfo.carrier,
      render: (value) => (
        <span className="flex items-center gap-1">
          {getCarrierIcon(value)}
          {value}
        </span>
      )
    },
    {
      key: 'trackingNumber',
      label: 'Tracking',
      value: shippingInfo.trackingNumber,
      render: (value) => (
        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
          {value}
        </span>
      )
    },
    {
      key: 'shippedAt',
      label: 'Shipped',
      value: shippingInfo.shippedAt,
      render: (value) => {
        try {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        } catch (error) {
          return null;
        }
      }
    },
    {
      key: 'estimatedDelivery',
      label: 'Est. Delivery',
      value: shippingInfo.estimatedDelivery,
      render: (value) => (
        <span className="text-green-600 font-medium">
          {new Date(value).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      )
    }
  ];

  return (
    <OptionalFieldDisplay
      fields={shippingFields}
      className={className}
      spacing="space-y-2"
      itemClassName=""
      labelClassName="font-medium"
      valueClassName=""
    />
  );
};

export default OptionalFieldDisplay;