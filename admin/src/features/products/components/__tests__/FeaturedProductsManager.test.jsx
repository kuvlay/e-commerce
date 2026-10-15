import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import FeaturedProductsManager from '../FeaturedProductsManager';

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

// Mock App imports
vi.mock('../../../App', () => ({
  backendUrl: 'http://localhost:4000',
  currency: '$'
}));

// Test data
const validFeaturedProducts = {
  success: true,
  products: [
    {
      _id: 'featured1',
      name: 'Featured Product 1',
      category: 'Electronics',
      price: 299.99,
      image: ['featured1.jpg'],
      featured: true,
      featuredPriority: 1
    },
    {
      _id: 'featured2',
      name: 'Featured Product 2',
      category: 'Clothing',
      price: 99.99,
      image: ['featured2.jpg'],
      featured: true,
      featuredPriority: 2
    }
  ]
};

const validAllProducts = {
  success: true,
  products: [
    {
      _id: 'product1',
      name: 'Regular Product 1',
      category: 'Books',
      price: 19.99,
      image: ['product1.jpg'],
      featured: false
    },
    {
      _id: 'product2',
      name: 'Regular Product 2',
      category: 'Sports',
      price: 49.99,
      image: ['product2.jpg'],
      featured: false
    }
  ]
};

const malformedProductData = {
  success: true,
  products: [
    {
      _id: null, // Invalid ID
      name: '',  // Empty name
      price: 'invalid-price',
      image: null,
      featured: 'not-boolean'
    },
    {
      // Missing required fields
      category: 'Test'
    }
  ]
};

describe('FeaturedProductsManager - Interface Changes Tests', () => {
  const mockToken = 'test-token';
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display featured products in position-based layout', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: validFeaturedProducts })
      .mockResolvedValueOnce({ data: validAllProducts });

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Featured Product 1')).toBeInTheDocument();
      expect(screen.getByText('Featured Product 2')).toBeInTheDocument();
      expect(screen.getByText('Position 1')).toBeInTheDocument();
      expect(screen.getByText('Position 2')).toBeInTheDocument();
    });
  });

  it('should show empty slots with position indicators', async () => {
    const singleFeaturedProduct = {
      success: true,
      products: [validFeaturedProducts.products[0]] // Only one featured product
    };

    mockedAxios.get
      .mockResolvedValueOnce({ data: singleFeaturedProduct })
      .mockResolvedValueOnce({ data: validAllProducts });

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Position 1')).toBeInTheDocument();
      expect(screen.getByText('Position 2')).toBeInTheDocument();
      expect(screen.getByText('Position 3')).toBeInTheDocument();
      expect(screen.getByText('Main Spotlight')).toBeInTheDocument();
      expect(screen.getByText('Top Right')).toBeInTheDocument();
      expect(screen.getByText('Bottom Right')).toBeInTheDocument();
    });
  });

  it('should display correct slot usage count', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: validFeaturedProducts })
      .mockResolvedValueOnce({ data: validAllProducts });

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('2/3 slots used')).toBeInTheDocument();
    });
  });

  it('should handle position priority changes', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: validFeaturedProducts })
      .mockResolvedValueOnce({ data: validAllProducts });
    
    mockedAxios.post.mockResolvedValueOnce({ 
      data: { success: true, message: 'Priority updated' } 
    });

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      const priorityButtons = screen.getAllByText('3');
      fireEvent.click(priorityButtons[0]); // Click position 3 for first product
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:4000/api/product/set-featured-priority',
      { productId: 'featured1', priority: 3 },
      { headers: { token: mockToken } }
    );
  });

  it('should show visual effects based on position priority', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: validFeaturedProducts })
      .mockResolvedValueOnce({ data: validAllProducts });

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      const position1Card = screen.getByText('Featured Product 1').closest('div');
      const position2Card = screen.getByText('Featured Product 2').closest('div');
      
      // Position 1 should have golden glow (animate-pulse class)
      expect(position1Card).toHaveClass('animate-pulse');
      
      // Different positions should have different styling
      expect(position1Card).not.toEqual(position2Card);
    });
  });
});

describe('FeaturedProductsManager - Data Validation Tests', () => {
  const mockToken = 'test-token';
  const mockOnUpdate = vi.fn();

  it('should handle malformed product data gracefully', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: malformedProductData })
      .mockResolvedValueOnce({ data: validAllProducts });

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByText(/Product Data Validation Issues/)).toBeInTheDocument();
    });
  });

  it('should show validation error feedback with retry option', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: malformedProductData })
      .mockResolvedValueOnce({ data: validAllProducts });

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      const retryButton = screen.getByText(/retry/i);
      expect(retryButton).toBeInTheDocument();
      
      // Test retry functionality
      fireEvent.click(retryButton);
    });

    // Should make new API calls on retry
    expect(mockedAxios.get).toHaveBeenCalledTimes(4); // Initial 2 + retry 2
  });

  it('should sanitize product data and filter invalid products', async () => {
    const mixedValidityData = {
      success: true,
      products: [
        validFeaturedProducts.products[0], // Valid
        malformedProductData.products[0],  // Invalid
        validFeaturedProducts.products[1]  // Valid
      ]
    };

    mockedAxios.get
      .mockResolvedValueOnce({ data: mixedValidityData })
      .mockResolvedValueOnce({ data: validAllProducts });

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      // Should show valid products
      expect(screen.getByText('Featured Product 1')).toBeInTheDocument();
      expect(screen.getByText('Featured Product 2')).toBeInTheDocument();
      
      // Should show validation warning
      expect(screen.queryByText(/validation issues/i)).toBeInTheDocument();
    });
  });

  it('should handle network errors with appropriate feedback', async () => {
    const networkError = new Error('Network Error');
    mockedAxios.get.mockRejectedValueOnce(networkError);

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    });
  });

  it('should handle API response validation', async () => {
    const invalidApiResponse = {
      success: false,
      message: 'API Error'
    };

    mockedAxios.get.mockResolvedValueOnce({ data: invalidApiResponse });

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      // Should handle unsuccessful API response
      expect(screen.queryByText('Featured Product 1')).not.toBeInTheDocument();
    });
  });
});

describe('FeaturedProductsManager - Product Management Tests', () => {
  const mockToken = 'test-token';
  const mockOnUpdate = vi.fn();

  it('should toggle product featured status', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: validFeaturedProducts })
      .mockResolvedValueOnce({ data: validAllProducts });
    
    mockedAxios.post.mockResolvedValueOnce({ 
      data: { success: true, message: 'Product featured status updated' } 
    });

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      const removeButton = screen.getAllByText('Remove')[0];
      fireEvent.click(removeButton);
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:4000/api/product/toggle-featured',
      { productId: 'featured1' },
      { headers: { token: mockToken } }
    );
  });

  it('should show product selector when Add Featured is clicked', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: validFeaturedProducts })
      .mockResolvedValueOnce({ data: validAllProducts });

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      const addButton = screen.getByText('Add Featured');
      fireEvent.click(addButton);
    });

    expect(screen.getByText('Select Product to Feature')).toBeInTheDocument();
    expect(screen.getByText('Regular Product 1')).toBeInTheDocument();
    expect(screen.getByText('Regular Product 2')).toBeInTheDocument();
  });

  it('should filter products in selector based on search', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: validFeaturedProducts })
      .mockResolvedValueOnce({ data: validAllProducts });

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      const addButton = screen.getByText('Add Featured');
      fireEvent.click(addButton);
    });

    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'Books' } });

    expect(screen.getByText('Regular Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Regular Product 2')).not.toBeInTheDocument();
  });

  it('should feature a product from selector', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: validFeaturedProducts })
      .mockResolvedValueOnce({ data: validAllProducts });
    
    mockedAxios.post.mockResolvedValueOnce({ 
      data: { success: true, message: 'Product featured' } 
    });

    render(<FeaturedProductsManager token={mockToken} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      const addButton = screen.getByText('Add Featured');
      fireEvent.click(addButton);
    });

    const featureButtons = screen.getAllByText('Feature');
    fireEvent.click(featureButtons[0]);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:4000/api/product/toggle-featured',
      { productId: 'product1' },
      { headers: { token: mockToken } }
    );
  });
});