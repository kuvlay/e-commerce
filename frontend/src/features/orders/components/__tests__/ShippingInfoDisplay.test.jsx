import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ShippingInfoDisplay from '../ShippingInfoDisplay';

describe('ShippingInfoDisplay - Optional Field Handling Tests', () => {
  it('should not render when order has no shipping info', () => {
    const orderWithoutShipping = {
      _id: 'order1',
      amount: 99.99
    };

    const { container } = render(
      <ShippingInfoDisplay order={orderWithoutShipping} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render when shipping info is empty object', () => {
    const orderWithEmptyShipping = {
      _id: 'order1',
      shippingInfo: {}
    };

    const { container } = render(
      <ShippingInfoDisplay order={orderWithEmptyShipping} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render when all shipping fields are empty', () => {
    const orderWithEmptyFields = {
      _id: 'order1',
      shippingInfo: {
        carrier: '',
        trackingNumber: '',
        shippedAt: null,
        estimatedDelivery: null
      }
    };

    const { container } = render(
      <ShippingInfoDisplay order={orderWithEmptyFields} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when at least one shipping field has value', () => {
    const orderWithCarrierOnly = {
      _id: 'order1',
      shippingInfo: {
        carrier: 'FedEx',
        trackingNumber: '',
        shippedAt: null,
        estimatedDelivery: null
      }
    };

    render(<ShippingInfoDisplay order={orderWithCarrierOnly} />);

    expect(screen.getByText(/FedEx/)).toBeInTheDocument();
  });

  it('should handle whitespace-only values correctly', () => {
    const orderWithWhitespace = {
      _id: 'order1',
      shippingInfo: {
        carrier: '   ',
        trackingNumber: '\t\n',
        shippedAt: null,
        estimatedDelivery: null
      }
    };

    const { container } = render(
      <ShippingInfoDisplay order={orderWithWhitespace} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render all valid shipping fields', () => {
    const orderWithAllFields = {
      _id: 'order1',
      shippingInfo: {
        carrier: 'UPS',
        trackingNumber: 'UPS123456789',
        shippedAt: '2024-01-16T08:00:00Z',
        estimatedDelivery: '2024-01-20T18:00:00Z'
      }
    };

    render(<ShippingInfoDisplay order={orderWithAllFields} />);

    expect(screen.getAllByText(/UPS/)).toHaveLength(2); // Carrier and tracking both contain UPS
    expect(screen.getByText(/UPS123456789/)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const orderWithShipping = {
      _id: 'order1',
      shippingInfo: {
        carrier: 'DHL'
      }
    };

    const { container } = render(
      <ShippingInfoDisplay order={orderWithShipping} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should handle null shippingInfo gracefully', () => {
    const orderWithNullShipping = {
      _id: 'order1',
      shippingInfo: null
    };

    const { container } = render(
      <ShippingInfoDisplay order={orderWithNullShipping} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should handle undefined shippingInfo gracefully', () => {
    const orderWithUndefinedShipping = {
      _id: 'order1',
      shippingInfo: undefined
    };

    const { container } = render(
      <ShippingInfoDisplay order={orderWithUndefinedShipping} />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('ShippingInfoDisplay - Dynamic Field Display', () => {
  it('should show only carrier when other fields are empty', () => {
    const order = {
      _id: 'order1',
      shippingInfo: {
        carrier: 'USPS',
        trackingNumber: '',
        shippedAt: null
      }
    };

    render(<ShippingInfoDisplay order={order} />);

    expect(screen.getByText(/USPS/)).toBeInTheDocument();
    expect(screen.queryByText(/tracking/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/shipped/i)).not.toBeInTheDocument();
  });

  it('should show only tracking when carrier is empty', () => {
    const order = {
      _id: 'order1',
      shippingInfo: {
        carrier: '',
        trackingNumber: 'TRACK123',
        shippedAt: null
      }
    };

    render(<ShippingInfoDisplay order={order} />);

    expect(screen.getByText('TRACK123')).toBeInTheDocument();
    expect(screen.queryByText(/carrier/i)).not.toBeInTheDocument();
  });

  it('should show combination of available fields', () => {
    const order = {
      _id: 'order1',
      shippingInfo: {
        carrier: 'FedEx',
        trackingNumber: '',
        shippedAt: '2024-01-16T08:00:00Z',
        estimatedDelivery: null
      }
    };

    render(<ShippingInfoDisplay order={order} />);

    expect(screen.getByText(/FedEx/)).toBeInTheDocument();
    expect(screen.queryByText(/tracking/i)).not.toBeInTheDocument();
    expect(screen.getByText(/shipped/i)).toBeInTheDocument();
    expect(screen.queryByText(/delivery/i)).not.toBeInTheDocument();
  });
});