import React from 'react';
import { OptionalShippingDisplay } from '../../../shared/components/OptionalFieldDisplay';

const ShippingInfoDisplay = ({ order, className = '' }) => {
  // Check if order has shipping info
  const hasShippingInfo = order.shippingInfo && typeof order.shippingInfo === 'object';
  
  // Only show if there's actual shipping info
  if (!hasShippingInfo) {
    return null; // No placeholder banners when shipping info is unavailable
  }

  // Check if any shipping fields have actual values
  const carrier = order.shippingInfo.carrier?.trim();
  const trackingNumber = order.shippingInfo.trackingNumber?.trim();
  const shippedAt = order.shippingInfo.shippedAt;
  const estimatedDelivery = order.shippingInfo.estimatedDelivery;
  
  if (!carrier && !trackingNumber && !shippedAt && !estimatedDelivery) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <OptionalShippingDisplay 
        shippingInfo={order.shippingInfo}
        className="text-sm"
        showIcons={true}
      />
    </div>
  );
};

export default ShippingInfoDisplay;