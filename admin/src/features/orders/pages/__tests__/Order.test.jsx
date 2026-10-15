import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Order from '../Order.jsx'
import axios from 'axios'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_BACKEND_URL: 'http://localhost:4000'
  }
})

// Mock toast notifications
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock order data representing mixed schema scenarios
const mockNewSchemaOrder = {
  _id: '507f1f77bcf86cd799439011',
  user_id: {
    _id: '507f1f77bcf86cd799439012',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890'
  },
  order_status: 'Shipped',
  items: [
    {
      product_id: '507f1f77bcf86cd799439013',
      title: 'Premium T-Shirt',
      price: 29.99,
      qty: 2,
      variant: { size: 'M', color: 'Blue' },
      imageUrl: '/images/tshirt.jpg'
    }
  ],
  address_snapshot: {
    name: 'John Doe',
    phone: '+1234567890',
    line1: '123 Main Street',
    line2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    pincode: '10001',
    country: 'USA'
  },
  shippingInfo: {
    carrier: 'DHL Express',
    trackingNumber: 'DHL123456789',
    shippedAt: new Date('2024-01-15T10:30:00Z')
  },
  totals: {
    subtotal: 59.98,
    shipping: 10.00,
    tax: 5.99,
    grand_total: 75.97
  },
  displayCustomerName: 'John Doe',
  nameResolution: {
    source: 'user_id.name',
    confidence: 95
  },
  created_at: new Date('2024-01-10T09:00:00Z'),
  updated_at: new Date('2024-01-15T10:30:00Z')
}

const mockLegacyOrder = {
  _id: '507f1f77bcf86cd799439021',
  userId: '507f1f77bcf86cd799439022',
  status: 'Order Placed',
  order_status: 'Placed', // May have both fields
  items: [
    {
      product_id: '507f1f77bcf86cd799439023',
      title: 'Classic Jeans',
      price: 49.99,
      qty: 1,
      size: 'L',
      image: '/images/jeans.jpg'
    }
  ],
  address: {
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+0987654321',
    street: '456 Oak Avenue',
    city: 'Boston',
    state: 'MA',
    pincode: '02101',
    country: 'USA'
  },
  // No shippingInfo for legacy orders
  amount: 59.99,
  date: Date.now() - 86400000, // 1 day ago
  payment: true,
  paymentMethod: 'COD',
  displayCustomerName: 'Jane Smith',
  nameResolution: {
    source: 'address firstName+lastName',
    confidence: 85
  }
}

const mockPartialShippingOrder = {
  ...mockNewSchemaOrder,
  _id: '507f1f77bcf86cd799439031',
  order_status: 'Processing',
  shippingInfo: {
    carrier: 'FedEx',
    // Missing trackingNumber - partial shipping info
    shippedAt: new Date('2024-01-14T08:00:00Z')
  }
}

const mockOrdersResponse = {
  success: true,
  orders: [mockNewSchemaOrder, mockLegacyOrder, mockPartialShippingOrder],
  metadata: {
    totalOrders: 3,
    highConfidenceNames: 2,
    averageDataQuality: 87
  }
}

describe('Admin Order Component - Mixed Schema Handling', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockedAxios.post.mockResolvedValue({ data: mockOrdersResponse })
    
    // Mock localStorage for admin token
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-admin-token'),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
    })
  })

  it('should load and display orders with mixed schema data', async () => {
    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      // New schema order
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Premium T-Shirt')).toBeInTheDocument()
      
      // Legacy schema order  
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Classic Jeans')).toBeInTheDocument()
    })
  })

  it('should display shipping info for orders that have it', async () => {
    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      // Should show shipping info badge for new schema order
      expect(screen.getByText('DHL Express')).toBeInTheDocument()
      expect(screen.getByText('DHL123456789')).toBeInTheDocument()
      
      // Should show partial shipping info
      expect(screen.getByText('FedEx')).toBeInTheDocument()
    })
  })

  it('should pre-populate shipping info in local state from backend data', async () => {
    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      // Find the order with shipping info and expand it
      const expandButton = screen.getAllByText('View Details')[0]
      fireEvent.click(expandButton)
    })

    await waitFor(() => {
      // Check if shipping info inputs are pre-populated
      const carrierInput = screen.getByDisplayValue('DHL Express')
      const trackingInput = screen.getByDisplayValue('DHL123456789')
      
      expect(carrierInput).toBeInTheDocument()
      expect(trackingInput).toBeInTheDocument()
    })
  })

  it('should handle shipping info save functionality', async () => {
    const mockUpdateResponse = {
      success: true,
      message: 'Status updated successfully',
      order: {
        id: '507f1f77bcf86cd799439011',
        status: 'Shipped',
        shippingInfo: {
          carrier: 'Updated Carrier',
          trackingNumber: 'NEW123456789',
          shippedAt: new Date()
        }
      }
    }

    mockedAxios.post.mockResolvedValue({ data: mockUpdateResponse })

    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      const expandButton = screen.getAllByText('View Details')[0]
      fireEvent.click(expandButton)
    })

    await waitFor(async () => {
      // Update shipping info
      const carrierInput = screen.getByDisplayValue('DHL Express')
      const trackingInput = screen.getByDisplayValue('DHL123456789')
      
      await user.clear(carrierInput)
      await user.type(carrierInput, 'Updated Carrier')
      
      await user.clear(trackingInput)
      await user.type(trackingInput, 'NEW123456789')
      
      // Save shipping info
      const saveButton = screen.getByText('Save Shipping Info')
      fireEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/order/status',
        expect.objectContaining({
          orderId: '507f1f77bcf86cd799439011',
          status: 'Shipped',
          shippingInfo: {
            carrier: 'Updated Carrier',
            trackingNumber: 'NEW123456789'
          }
        }),
        expect.objectContaining({
          headers: { token: 'mock-admin-token' }
        })
      )
    })
  })

  it('should validate shipping info before saving', async () => {
    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      const expandButton = screen.getAllByText('View Details')[0]
      fireEvent.click(expandButton)
    })

    await waitFor(async () => {
      // Clear required fields
      const carrierInput = screen.getByDisplayValue('DHL Express')
      const trackingInput = screen.getByDisplayValue('DHL123456789')
      
      await user.clear(carrierInput)
      await user.clear(trackingInput)
      
      // Try to save with empty fields
      const saveButton = screen.getByText('Save Shipping Info')
      fireEvent.click(saveButton)
    })

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Carrier and tracking number are required/i)).toBeInTheDocument()
    })

    // Should not make API call with invalid data
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  it('should handle customer name display from different sources', async () => {
    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      // Backend displayCustomerName (preferred)
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      
      // Should not show fallback names when displayCustomerName exists
      expect(screen.queryByText('Unknown Customer')).not.toBeInTheDocument()
    })
  })

  it('should handle order filtering by customer name', async () => {
    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Search orders/i)
      fireEvent.change(searchInput, { target: { value: 'John Doe' } })
    })

    await waitFor(() => {
      // Should show orders matching the search
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })
  })

  it('should handle order status updates with shipping info', async () => {
    const mockStatusUpdateResponse = {
      success: true,
      message: 'Status updated successfully'
    }

    mockedAxios.post.mockResolvedValue({ data: mockStatusUpdateResponse })

    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      const expandButton = screen.getAllByText('View Details')[1] // Legacy order
      fireEvent.click(expandButton)
    })

    await waitFor(async () => {
      // Change status to Shipped
      const statusSelect = screen.getByDisplayValue('Placed')
      fireEvent.change(statusSelect, { target: { value: 'Shipped' } })
      
      // Add shipping info
      const carrierInput = screen.getByPlaceholderText(/Carrier name/i)
      const trackingInput = screen.getByPlaceholderText(/Tracking number/i)
      
      await user.type(carrierInput, 'UPS')
      await user.type(trackingInput, 'UPS987654321')
      
      // Update status
      const updateButton = screen.getByText('Update Status')
      fireEvent.click(updateButton)
    })

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/order/status',
        expect.objectContaining({
          orderId: '507f1f77bcf86cd799439021',
          status: 'Shipped',
          shippingInfo: {
            carrier: 'UPS',
            trackingNumber: 'UPS987654321'
          }
        }),
        expect.any(Object)
      )
    })
  })

  it('should handle address display from both schemas', async () => {
    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      const expandButtons = screen.getAllByText('View Details')
      fireEvent.click(expandButtons[0]) // New schema order
    })

    await waitFor(() => {
      // New schema: address_snapshot
      expect(screen.getByText(/123 Main Street/)).toBeInTheDocument()
      expect(screen.getByText(/New York, NY 10001/)).toBeInTheDocument()
    })

    // Check legacy order address
    const expandButtons = screen.getAllByText('View Details')
    fireEvent.click(expandButtons[1]) // Legacy order

    await waitFor(() => {
      // Legacy schema: address
      expect(screen.getByText(/456 Oak Avenue/)).toBeInTheDocument()
      expect(screen.getByText(/Boston, MA 02101/)).toBeInTheDocument()
    })
  })

  it('should handle shipping info persistence verification with fresh data', async () => {
    const mockSaveResponse = {
      success: true,
      message: 'Status updated successfully'
    }
    
    const mockFreshOrdersResponse = {
      success: true,
      orders: [
        {
          ...mockNewSchemaOrder,
          shippingInfo: {
            carrier: 'Fresh Updated Carrier',
            trackingNumber: 'FRESH123456789',
            shippedAt: new Date()
          }
        },
        mockLegacyOrder,
        mockPartialShippingOrder
      ]
    }

    // Mock the save call
    mockedAxios.post.mockResolvedValueOnce({ data: mockSaveResponse })
    // Mock the fresh data fetch call
    mockedAxios.post.mockResolvedValueOnce({ data: mockFreshOrdersResponse })

    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      const expandButton = screen.getAllByText('View Details')[0]
      fireEvent.click(expandButton)
    })

    await waitFor(async () => {
      // Update shipping info
      const carrierInput = screen.getByDisplayValue('DHL Express')
      const trackingInput = screen.getByDisplayValue('DHL123456789')
      
      await user.clear(carrierInput)
      await user.type(carrierInput, 'Fresh Updated Carrier')
      
      await user.clear(trackingInput)
      await user.type(trackingInput, 'FRESH123456789')
      
      // Confirm save in the dialog
      window.confirm = vi.fn(() => true)
      
      // Save shipping info
      const saveButton = screen.getByText('Save Shipping Info')
      fireEvent.click(saveButton)
    })

    await waitFor(() => {
      // Should make save API call
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/order/status',
        expect.objectContaining({
          orderId: '507f1f77bcf86cd799439011',
          shippingInfo: {
            carrier: 'Fresh Updated Carrier',
            trackingNumber: 'FRESH123456789'
          }
        }),
        expect.objectContaining({
          headers: { token: 'mock-admin-token' }
        })
      )
      
      // Should make refresh API call to get fresh data
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/order/list',
        {},
        { headers: { token: 'mock-admin-token' } }
      )
    })
  })

  it('should verify persistence using fresh API data instead of stale state', async () => {
    const mockSaveResponse = {
      success: true,
      message: 'Status updated successfully'
    }
    
    // Mock fresh data with the saved shipping info
    const mockFreshOrdersWithSavedInfo = {
      success: true,
      orders: [
        {
          ...mockNewSchemaOrder,
          shippingInfo: {
            carrier: 'Verified Carrier',
            trackingNumber: 'VERIFIED123',
            shippedAt: new Date()
          }
        }
      ]
    }

    mockedAxios.post.mockResolvedValueOnce({ data: mockSaveResponse })
    mockedAxios.post.mockResolvedValueOnce({ data: mockFreshOrdersWithSavedInfo })

    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      const expandButton = screen.getAllByText('View Details')[0]
      fireEvent.click(expandButton)
    })

    await waitFor(async () => {
      const carrierInput = screen.getByDisplayValue('DHL Express')
      const trackingInput = screen.getByDisplayValue('DHL123456789')
      
      await user.clear(carrierInput)
      await user.type(carrierInput, 'Verified Carrier')
      
      await user.clear(trackingInput)
      await user.type(trackingInput, 'VERIFIED123')
      
      window.confirm = vi.fn(() => true)
      
      const saveButton = screen.getByText('Save Shipping Info')
      fireEvent.click(saveButton)
    })

    // Verification should use fresh data, not stale React state
    await waitFor(() => {
      // Should call fetchAllOrders which returns fresh data
      expect(mockedAxios.post).toHaveBeenCalledTimes(3) // Initial load + save + refresh
    })
  })

  it('should handle persistence verification failures with fresh data', async () => {
    const mockSaveResponse = {
      success: true,
      message: 'Status updated successfully'
    }
    
    // Mock fresh data showing persistence failure
    const mockFreshOrdersWithFailedPersistence = {
      success: true,
      orders: [
        {
          ...mockNewSchemaOrder,
          // Shipping info not persisted correctly
          shippingInfo: {
            carrier: 'DHL Express', // Original value, not updated
            trackingNumber: 'DHL123456789', // Original value, not updated
            shippedAt: new Date('2024-01-15T10:30:00Z')
          }
        }
      ]
    }

    mockedAxios.post.mockResolvedValueOnce({ data: mockSaveResponse })
    mockedAxios.post.mockResolvedValueOnce({ data: mockFreshOrdersWithFailedPersistence })

    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      const expandButton = screen.getAllByText('View Details')[0]
      fireEvent.click(expandButton)
    })

    await waitFor(async () => {
      const carrierInput = screen.getByDisplayValue('DHL Express')
      const trackingInput = screen.getByDisplayValue('DHL123456789')
      
      await user.clear(carrierInput)
      await user.type(carrierInput, 'Failed Update Carrier')
      
      await user.clear(trackingInput)
      await user.type(trackingInput, 'FAILED123')
      
      window.confirm = vi.fn(() => true)
      
      const saveButton = screen.getByText('Save Shipping Info')
      fireEvent.click(saveButton)
    })

    // Should detect persistence failure using fresh data
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledTimes(3) // Initial + save + verification fetch
    })
  })

  it('should handle network failures during fresh data verification', async () => {
    const mockSaveResponse = {
      success: true,
      message: 'Status updated successfully'
    }

    mockedAxios.post.mockResolvedValueOnce({ data: mockSaveResponse })
    // Simulate network failure on verification fetch
    mockedAxios.post.mockRejectedValueOnce(new Error('Network timeout'))

    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      const expandButton = screen.getAllByText('View Details')[0]
      fireEvent.click(expandButton)
    })

    await waitFor(async () => {
      const carrierInput = screen.getByDisplayValue('DHL Express')
      await user.clear(carrierInput)
      await user.type(carrierInput, 'Network Test Carrier')
      
      const trackingInput = screen.getByDisplayValue('DHL123456789')
      await user.clear(trackingInput)
      await user.type(trackingInput, 'NETWORK123')
      
      window.confirm = vi.fn(() => true)
      
      const saveButton = screen.getByText('Save Shipping Info')
      fireEvent.click(saveButton)
    })

    // Should handle verification failure gracefully
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledTimes(3) // Initial + save + failed verification
    })
  })

  it('should handle edge cases with malformed fresh data', async () => {
    const mockSaveResponse = {
      success: true,
      message: 'Status updated successfully'
    }
    
    // Mock malformed fresh data response
    const mockMalformedFreshData = {
      success: true,
      orders: null // Invalid orders array
    }

    mockedAxios.post.mockResolvedValueOnce({ data: mockSaveResponse })
    mockedAxios.post.mockResolvedValueOnce({ data: mockMalformedFreshData })

    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      const expandButton = screen.getAllByText('View Details')[0]
      fireEvent.click(expandButton)
    })

    await waitFor(async () => {
      const carrierInput = screen.getByDisplayValue('DHL Express')
      await user.clear(carrierInput)
      await user.type(carrierInput, 'Malformed Test')
      
      const trackingInput = screen.getByDisplayValue('DHL123456789')
      await user.clear(trackingInput)
      await user.type(trackingInput, 'MALFORMED123')
      
      window.confirm = vi.fn(() => true)
      
      const saveButton = screen.getByText('Save Shipping Info')
      fireEvent.click(saveButton)
    })

    // Should handle malformed verification data gracefully
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledTimes(3)
    })
  })

  it('should handle network errors gracefully', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Network error'))

    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to connect to server/i)).toBeInTheDocument()
    })
  })

  it('should handle malformed order data', async () => {
    const malformedResponse = {
      success: true,
      orders: [
        {
          _id: '507f1f77bcf86cd799439041',
          // Missing required fields
          items: null,
          shippingInfo: 'invalid-string' // Should be object
        }
      ]
    }

    mockedAxios.post.mockResolvedValue({ data: malformedResponse })

    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      // Should handle malformed data gracefully
      expect(screen.queryByText('Unknown Customer')).toBeInTheDocument()
    })
  })

  it('should handle token expiration', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { status: 401, data: { message: 'Token expired' } }
    })

    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      expect(screen.getByText(/Admin session expired/i)).toBeInTheDocument()
    })
  })

  it('should trim whitespace from shipping info inputs', async () => {
    const mockUpdateResponse = {
      success: true,
      message: 'Status updated successfully'
    }

    mockedAxios.post.mockResolvedValue({ data: mockUpdateResponse })

    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      const expandButton = screen.getAllByText('View Details')[0]
      fireEvent.click(expandButton)
    })

    await waitFor(async () => {
      // Add shipping info with whitespace
      const carrierInput = screen.getByDisplayValue('DHL Express')
      const trackingInput = screen.getByDisplayValue('DHL123456789')
      
      await user.clear(carrierInput)
      await user.type(carrierInput, '  Trimmed Carrier  ')
      
      await user.clear(trackingInput)
      await user.type(trackingInput, '  TRIM123456789  ')
      
      const saveButton = screen.getByText('Save Shipping Info')
      fireEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          shippingInfo: {
            carrier: 'Trimmed Carrier',
            trackingNumber: 'TRIM123456789'
          }
        }),
        expect.any(Object)
      )
    })
  })

  it('should handle shipping info visual indicators correctly', async () => {
    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      // Orders with shipping info should show badges
      expect(screen.getByText('DHL Express')).toBeInTheDocument()
      expect(screen.getByText('FedEx')).toBeInTheDocument()
      
      // Legacy order without shipping info should not show badges
      const legacyOrderRow = screen.getByText('Jane Smith').closest('tr')
      expect(legacyOrderRow?.querySelector('.bg-purple-100')).toBeNull()
    })
  })

  it('should verify correct API endpoint calls', async () => {
    render(<Order token="mock-admin-token" />)

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/order/list',
        {},
        {
          headers: { token: 'mock-admin-token' }
        }
      )
    })
  })
})