import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import TrackOrders from '../TrackOrders';
import { ShopContext } from '../../../../core/context/ShopContext';
import { UserContext } from '../../../../core/context/UserContext';

// Mock dependencies
vi.mock('axios');
vi.mock('react-toastify');

const mockShopContext = {
  backendUrl: 'http://localhost:3000',
  token: 'mock-token',
  currency: '$',
  navigate: vi.fn(),
  products: [],
  cartItems: {},
  cartCount: 0,
  getFeaturedProducts: vi.fn().mockResolvedValue([])
};

const mockUserContext = {
  user: { id: 'user123', name: 'Test User' },
  isAuthenticated: true,
  loading: false
};

const renderTrackOrders = () => {
  return render(
    <BrowserRouter>
      <ShopContext.Provider value={mockShopContext}>
        <UserContext.Provider value={mockUserContext}>
          <TrackOrders />
        </UserContext.Provider>
      </ShopContext.Provider>
    </BrowserRouter>
  );
};

describe('TrackOrders Data Validation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.error = vi.fn();
    toast.warn = vi.fn();
    toast.success = vi.fn();
  });

  test('should handle valid orders data', async () => {
    const validOrdersResponse = {
      data: {
        success: true,
        orders: [
          {
            _id: '507f1f77bcf86cd799439011',
            order_status: 'shipped',
            date: '2024-01-15T10:30:00Z',
            amount: 99.99,
            paymentMethod: 'Credit Card',
            items: [
              {
                product_id: 'prod123',
                title: 'Test Product',
                price: 99.99,
                qty: 1
              }
            ]
          }
        ]
      }
    };

    axios.post.mockResolvedValueOnce(validOrdersResponse);

    renderTrackOrders();

    await waitFor(() => {
      expect(screen.getByText('Track Your Orders')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Order #39439011/)).toBeInTheDocument();
    });

    // Should not show any error toasts for valid data
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.warn).not.toHaveBeenCalled();
  });

  test('should handle corrupted orders data gracefully', async () => {
    const corruptedOrdersResponse = {
      data: {
        success: true,
        orders: [
          {
            _id: '507f1f77bcf86cd799439011',
            order_status: 'shipped',
            date: '2024-01-15T10:30:00Z',
            amount: 99.99,
            paymentMethod: 'Credit Card',
            items: [
              {
                product_id: 'prod123',
                title: 'Test Product',
                price: 99.99,
                qty: 1
              }
            ]
          },
          {
            // Corrupted order - missing _id
            order_status: 'pending',
            date: '2024-01-15T10:30:00Z',
            amount: 50.00,
            items: []
          },
          null, // Completely invalid order
          {
            // Another corrupted order - missing order_status
            _id: '507f1f77bcf86cd799439013',
            date: '2024-01-15T10:30:00Z',
            amount: 75.00,
            items: []
          }
        ]
      }
    };

    axios.post.mockResolvedValueOnce(corruptedOrdersResponse);

    renderTrackOrders();

    await waitFor(() => {
      expect(screen.getByText('Track Your Orders')).toBeInTheDocument();
    });

    // Should show warning about corrupted orders
    await waitFor(() => {
      expect(toast.warn).toHaveBeenCalledWith(
        expect.stringContaining('orders could not be displayed due to data issues'),
        expect.any(Object)
      );
    });

    // Should still display the valid order
    await waitFor(() => {
      expect(screen.getByText(/Order #39439011/)).toBeInTheDocument();
    });
  });

  test('should handle completely invalid orders array', async () => {
    const invalidOrdersResponse = {
      data: {
        success: true,
        orders: null // Invalid - not an array
      }
    };

    axios.post.mockResolvedValueOnce(invalidOrdersResponse);

    renderTrackOrders();

    await waitFor(() => {
      expect(screen.getByText('Track Your Orders')).toBeInTheDocument();
    });

    // Should show no orders found message
    await waitFor(() => {
      expect(screen.getByText('No Orders Found')).toBeInTheDocument();
    });

    expect(toast.error).toHaveBeenCalledWith('Some order data could not be loaded properly');
  });

  test('should handle network errors gracefully', async () => {
    const networkError = new Error('Network Error');
    networkError.name = 'NetworkError';
    
    axios.post.mockRejectedValueOnce(networkError);

    renderTrackOrders();

    await waitFor(() => {
      expect(screen.getByText('Track Your Orders')).toBeInTheDocument();
    });

    // Should show network error fallback
    await waitFor(() => {
      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    });

    expect(toast.error).toHaveBeenCalledWith('Network error - please check your internet connection');
  });

  test('should validate shipping information', async () => {
    const ordersWithShippingResponse = {
      data: {
        success: true,
        orders: [
          {
            _id: '507f1f77bcf86cd799439011',
            order_status: 'shipped',
            date: '2024-01-15T10:30:00Z',
            amount: 99.99,
            paymentMethod: 'Credit Card',
            items: [
              {
                product_id: 'prod123',
                title: 'Test Product',
                price: 99.99,
                qty: 1
              }
            ],
            shippingInfo: {
              carrier: 'FedEx',
              trackingNumber: 'FX123456789',
              shippedAt: '2024-01-16T10:30:00Z'
            }
          },
          {
            _id: '507f1f77bcf86cd799439012',
            order_status: 'shipped',
            date: '2024-01-15T10:30:00Z',
            amount: 50.00,
            paymentMethod: 'Credit Card',
            items: [
              {
                product_id: 'prod124',
                title: 'Another Product',
                price: 50.00,
                qty: 1
              }
            ],
            shippingInfo: {
              carrier: '',  // Invalid - empty carrier
              trackingNumber: '   ', // Invalid - whitespace only
              shippedAt: 'invalid-date' // Invalid date
            }
          }
        ]
      }
    };

    axios.post.mockResolvedValueOnce(ordersWithShippingResponse);

    renderTrackOrders();

    await waitFor(() => {
      expect(screen.getByText('Track Your Orders')).toBeInTheDocument();
    });

    // Should display valid shipping info for first order
    await waitFor(() => {
      expect(screen.getByText('FedEx')).toBeInTheDocument();
      expect(screen.getByText('FX123456789')).toBeInTheDocument();
    });

    // Second order should not show shipping info due to validation failure
    // (The invalid shipping info should be filtered out)
  });
});