import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OptionalFieldDisplay, { OptionalAddressDisplay, OptionalShippingDisplay } from '../OptionalFieldDisplay';

describe('OptionalFieldDisplay', () => {
  it('should render valid fields and hide empty ones', () => {
    const fields = [
      { key: 'field1', label: 'Field 1', value: 'Valid Value' },
      { key: 'field2', label: 'Field 2', value: '' }, // Should be hidden
      { key: 'field3', label: 'Field 3', value: 'Another Valid Value' },
      { key: 'field4', label: 'Field 4', value: null }, // Should be hidden
      { key: 'field5', label: 'Field 5', value: '   ' }, // Should be hidden (whitespace)
    ];

    render(<OptionalFieldDisplay fields={fields} />);

    // Should show valid fields
    expect(screen.getByText('Field 1:')).toBeInTheDocument();
    expect(screen.getByText('Valid Value')).toBeInTheDocument();
    expect(screen.getByText('Field 3:')).toBeInTheDocument();
    expect(screen.getByText('Another Valid Value')).toBeInTheDocument();

    // Should not show empty fields
    expect(screen.queryByText('Field 2:')).not.toBeInTheDocument();
    expect(screen.queryByText('Field 4:')).not.toBeInTheDocument();
    expect(screen.queryByText('Field 5:')).not.toBeInTheDocument();
  });

  it('should return null when no valid fields exist', () => {
    const fields = [
      { key: 'field1', label: 'Field 1', value: '' },
      { key: 'field2', label: 'Field 2', value: null },
      { key: 'field3', label: 'Field 3', value: '   ' },
    ];

    const { container } = render(<OptionalFieldDisplay fields={fields} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('OptionalAddressDisplay', () => {
  it('should render complete address with all fields', () => {
    const address = {
      fullName: 'John Doe',
      phone: '1234567890',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      pincode: '10001'
    };

    render(<OptionalAddressDisplay address={address} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Apt 4B')).toBeInTheDocument();
    expect(screen.getByText('New York, NY - 10001')).toBeInTheDocument();
  });

  it('should handle missing optional addressLine2', () => {
    const address = {
      fullName: 'Jane Smith',
      phone: '9876543210',
      addressLine1: '456 Oak Ave',
      addressLine2: '', // Empty optional field
      city: 'Los Angeles',
      state: 'CA',
      pincode: '90210'
    };

    render(<OptionalAddressDisplay address={address} />);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
    expect(screen.getByText('Los Angeles, CA - 90210')).toBeInTheDocument();
    
    // Should not render empty addressLine2
    expect(screen.queryByText('Apt')).not.toBeInTheDocument();
  });

  it('should handle whitespace-only addressLine2', () => {
    const address = {
      fullName: 'Bob Johnson',
      phone: '5555555555',
      addressLine1: '789 Pine St',
      addressLine2: '   ', // Whitespace only
      city: 'Chicago',
      state: 'IL',
      pincode: '60601'
    };

    render(<OptionalAddressDisplay address={address} />);

    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText('789 Pine St')).toBeInTheDocument();
    expect(screen.getByText('Chicago, IL - 60601')).toBeInTheDocument();
    
    // Should not render whitespace-only addressLine2
    const addressLines = screen.getAllByText(/Pine St|Chicago/);
    expect(addressLines).toHaveLength(2); // Only addressLine1 and city/state/pincode
  });

  it('should return null for null address', () => {
    const { container } = render(<OptionalAddressDisplay address={null} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('OptionalShippingDisplay', () => {
  it('should render complete shipping info with icons', () => {
    const shippingInfo = {
      carrier: 'FedEx',
      trackingNumber: 'FX123456789',
      shippedAt: '2024-01-15T10:30:00Z',
      estimatedDelivery: '2024-01-18T18:00:00Z'
    };

    render(<OptionalShippingDisplay shippingInfo={shippingInfo} showIcons={true} />);

    expect(screen.getByText('Carrier:')).toBeInTheDocument();
    expect(screen.getByText((content, element) => content.includes('FedEx'))).toBeInTheDocument();
    expect(screen.getByText('Tracking:')).toBeInTheDocument();
    expect(screen.getByText('FX123456789')).toBeInTheDocument();
    expect(screen.getByText('Shipped:')).toBeInTheDocument();
    expect(screen.getByText('Est. Delivery:')).toBeInTheDocument();
  });

  it('should handle missing optional fields', () => {
    const shippingInfo = {
      carrier: 'UPS',
      trackingNumber: '', // Empty
      shippedAt: '2024-01-15T10:30:00Z',
      estimatedDelivery: null // Null
    };

    render(<OptionalShippingDisplay shippingInfo={shippingInfo} />);

    expect(screen.getByText('Carrier:')).toBeInTheDocument();
    expect(screen.getByText((content, element) => content.includes('UPS'))).toBeInTheDocument();
    expect(screen.getByText('Shipped:')).toBeInTheDocument();
    
    // Should not show empty/null fields
    expect(screen.queryByText('Tracking:')).not.toBeInTheDocument();
    expect(screen.queryByText('Est. Delivery:')).not.toBeInTheDocument();
  });

  it('should return null for null shipping info', () => {
    const { container } = render(<OptionalShippingDisplay shippingInfo={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should return null when all fields are empty', () => {
    const shippingInfo = {
      carrier: '',
      trackingNumber: '   ',
      shippedAt: null,
      estimatedDelivery: undefined
    };

    const { container } = render(<OptionalShippingDisplay shippingInfo={shippingInfo} />);
    expect(container.firstChild).toBeNull();
  });
});