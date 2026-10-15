import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import TrackOrders from '../TrackOrders';
import { ShopContext } from '../../../../core/context/ShopContext';
import { UserContext } from '../../../../core/context/UserContext';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Test data
const validOrderData = {
  success: true,
  orders: [
    {
      _id: 'order123',
      date: '2024-01-15T10:00:00Z',
      amount: 299.99,
      paymentMethod: 'Credit Card',
      order_status: 'shipped',
      items: [
        {
          title: 'Test Product 1',
          price: 149.99,
          qty: 1,
          product_id: 'prod1'
        }
      ],
      shippingInfo: {
        carrier: 'FedEx',
        trackingNumber: 'FX123456789',
        shippedAt: '2024-01-16T08:00:00Z',
        estimatedDelivery: '2024-01-20T18:00:00Z'
      }
    }
  ]
};

const malformedOrderData = {
  success: true,
  orders: [
    {
      _id: null,
      date: 'invalid-date',
      amount: 'not-a-number',
      items: [null]
    }
  ]
};

const mockShopContext = {
  backendUrl: 'http://localhost:4000',
  token: 'valid-token',
  currency: '$',
  navigate: vi.fn(),
  products: [],
  cartItems: {},
  cartCount: 0,
  getFeaturedProducts: vi.fn(() => Promise.resolve([]))
};

const mockUserContext = {
  user: { id: '1', name: 'Test User' },
  isAuthenticated: true,
  loading: false
};

const TestWrapper = ({ children, shopContext = mockShopContext, userContext = mockUserContext }) => (
  <BrowserRouter>
    <ShopContext.Provider value={shopContext}>
      <UserContext.Provider value={userContext}>
        {children}
      </UserContext.Provider>
    </ShopContext.Provider>
  </BrowserRouter>
);

describe('TrackOrders - Order Data Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should validate and display valid order data correctly', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: validOrderData });

    render(
      <TestWrapper>
        <TrackOrders />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Order #order123/)).toBeInTheDocument();
      expect(screen.getByText('$299.99')).toBeInTheDocument();
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });
  });

  it('should handle malformed order data gracefully', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: malformedOrderData });

    render(
      <TestWrapper>
        <TrackOrders />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText(/could not be displayed/)).toBeInTheDocument();
    });
  });
});
desc
ribe('TrackOrders - Shipping Info Display Optimization', () => {
  it('should only display shipping info when valid data exists', async () => {
    const orderWithoutShipping = {
      success: true,
      orders: [{
        _id: 'order789',
        date: '2024-01-15T10:00:00Z',
        amount: 99.99,
        items: [{ title: 'Product', price: 99.99, qty: 1 }]
      }]
    };

    mockedAxios.post.mockResolvedValueOnce({ data: orderWithoutShipping });

    render(
      <TestWrapper>
        <TrackOrders />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Shipping Information/)).not.toBeInTheDocument();
    });
  });

  it('should display shipping info with proper formatting', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: validOrderData });

    render(
      <TestWrapper>
        <TrackOrders />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Shipping Information/)).toBeInTheDocument();
      expect(screen.getByText('FedEx')).toBeInTheDocument();
      expect(screen.getByText('FX123456789')).toBeInTheDocument();
    });
  });

  it('should validate shipping info and show only valid fields', async () => {
    const orderWithPartialShipping = {
      success: true,
      orders: [{
        _id: 'order456',
        date: '2024-01-15T10:00:00Z',
        amount: 199.99,
        items: [{ title: 'Product', price: 199.99, qty: 1 }],
        shippingInfo: {
          carrier: 'UPS',
          trackingNumber: '',
          shippedAt: '2024-01-16T08:00:00Z',
          estimatedDelivery: null
        }
      }]
    };

    mockedAxios.post.mockResolvedValueOnce({ data: orderWithPartialShipping });

    render(
      <TestWrapper>
        <TrackOrders />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('UPS')).toBeInTheDocument();
      expect(screen.queryByText(/Tracking:/)).not.toBeInTheDocument();
      expect(screen.getByText(/Shipped:/)).toBeInTheDocument();
      expect(screen.queryByText(/Est. Delivery:/)).not.toBeInTheDocument();
    });
  });
});

describe('TrackOrders - Error Handling Tests', () => {
  it('should handle network errors appropriately', async () => {
    const networkError = new Error('Network Error');
    networkError.name = 'NetworkError';
    mockedAxios.post.mockRejectedValueOnce(networkError);

    render(
      <TestWrapper>
        <TrackOrders />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('should handle timeout errors', async () => {
    const timeoutError = new Error('Request timeout');
    timeoutError.code = 'ECONNABORTED';
    mockedAxios.post.mockRejectedValueOnce(timeoutError);

    render(
      <TestWrapper>
        <TrackOrders />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Request timeout/)).toBeInTheDocument();
    });
  });

  it('should handle 401 unauthorized errors', async () => {
    const unauthorizedError = new Error('Unauthorized');
    unauthorizedError.response = { status: 401 };
    mockedAxios.post.mockRejectedValueOnce(unauthorizedError);

    render(
      <TestWrapper>
        <TrackOrders />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should provide retry functionality on network errors', async () => {
    mockedAxios.post
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({ data: validOrderData });

    render(
      <TestWrapper>
        <TrackOrders />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/try again/)).toBeInTheDocument();
    });

    const retryButton = screen.getByText(/try again/i);
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/Order #order123/)).toBeInTheDocument();
    });
  });
});