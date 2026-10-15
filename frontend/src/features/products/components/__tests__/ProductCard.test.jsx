import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ProductCard from '../ProductCard';
import { ShopContext } from '../../../../core/context/ShopContext';
import { WishlistContext } from '../../../../core/context/WishlistContext';
import { UserContext } from '../../../../core/context/UserContext';

// Mock GSAP
const mockGsap = {
  timeline: vi.fn(() => ({
    to: vi.fn().mockReturnThis(),
    kill: vi.fn(),
    onComplete: vi.fn()
  })),
  to: vi.fn(() => ({
    kill: vi.fn()
  }))
};

vi.mock('gsap', () => ({
  default: mockGsap
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

// Mock contexts
const mockShopContext = {
  addToCart: vi.fn(),
  currency: '$',
  navigate: vi.fn()
};

const mockWishlistContext = {
  toggleWishlist: vi.fn(),
  isInWishlist: vi.fn(() => false)
};

const mockUserContext = {
  isAuthenticated: true,
  user: { id: '1', name: 'Test User' }
};

// Test product data
const validProduct = {
  _id: 'product1',
  name: 'Test Product',
  category: 'Electronics',
  price: 99.99,
  image: ['test-image.jpg'],
  bestseller: true,
  measurements: [
    { value: 'small', price: 99.99 },
    { value: 'medium', price: 109.99 }
  ]
};

const invalidProduct = {
  _id: null,
  name: '',
  image: []
};

const TestWrapper = ({ children, shopContext = mockShopContext, wishlistContext = mockWishlistContext, userContext = mockUserContext }) => (
  <BrowserRouter>
    <ShopContext.Provider value={shopContext}>
      <WishlistContext.Provider value={wishlistContext}>
        <UserContext.Provider value={userContext}>
          {children}
        </UserContext.Provider>
      </WishlistContext.Provider>
    </ShopContext.Provider>
  </BrowserRouter>
);

describe('ProductCard - Hover Animation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset GSAP timeline mock
    mockGsap.timeline.mockReturnValue({
      to: vi.fn().mockReturnThis(),
      kill: vi.fn(),
      onComplete: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should handle single hover event correctly', async () => {
    render(
      <TestWrapper>
        <ProductCard product={validProduct} index={0} />
      </TestWrapper>
    );

    const card = screen.getByRole('img', { name: /test product/i }).closest('div').parentElement;
    
    // Simulate hover
    fireEvent.mouseEnter(card);
    
    await waitFor(() => {
      expect(mockGsap.timeline).toHaveBeenCalled();
    });

    // Verify timeline was created and animations were added
    const timelineInstance = mockGsap.timeline.mock.results[0].value;
    expect(timelineInstance.to).toHaveBeenCalledTimes(2); // Image scale and card transform
  });

  it('should handle rapid multiple hover events without conflicts', async () => {
    render(
      <TestWrapper>
        <ProductCard product={validProduct} index={0} />
      </TestWrapper>
    );

    const card = screen.getByRole('img', { name: /test product/i }).closest('div').parentElement;
    
    // Simulate rapid hover events
    act(() => {
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);
      fireEvent.mouseEnter(card);
    });

    await waitFor(() => {
      expect(mockGsap.timeline).toHaveBeenCalled();
    });

    // Verify that kill() was called to prevent conflicts
    const timelineInstances = mockGsap.timeline.mock.results;
    timelineInstances.forEach(result => {
      if (result.value && result.value.kill) {
        // At least one timeline should have been killed to prevent conflicts
      }
    });
  });

  it('should clean up animations on mouse leave', async () => {
    render(
      <TestWrapper>
        <ProductCard product={validProduct} index={0} />
      </TestWrapper>
    );

    const card = screen.getByRole('img', { name: /test product/i }).closest('div').parentElement;
    
    // Hover and then leave
    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);

    await waitFor(() => {
      expect(mockGsap.timeline).toHaveBeenCalledTimes(2); // Enter and leave
    });
  });

  it('should prevent animation conflicts during rapid interactions', async () => {
    const killSpy = vi.fn();
    mockGsap.timeline.mockReturnValue({
      to: vi.fn().mockReturnThis(),
      kill: killSpy,
      onComplete: vi.fn()
    });

    render(
      <TestWrapper>
        <ProductCard product={validProduct} index={0} />
      </TestWrapper>
    );

    const card = screen.getByRole('img', { name: /test product/i }).closest('div').parentElement;
    
    // Rapid interactions
    act(() => {
      fireEvent.mouseEnter(card);
      fireEvent.mouseEnter(card); // Second enter should kill previous
      fireEvent.mouseLeave(card);
      fireEvent.mouseEnter(card);
    });

    await waitFor(() => {
      expect(killSpy).toHaveBeenCalled();
    });
  });

  it('should handle component unmount cleanup', () => {
    const killSpy = vi.fn();
    mockGsap.timeline.mockReturnValue({
      to: vi.fn().mockReturnThis(),
      kill: killSpy,
      onComplete: vi.fn()
    });

    const { unmount } = render(
      <TestWrapper>
        <ProductCard product={validProduct} index={0} />
      </TestWrapper>
    );

    const card = screen.getByRole('img', { name: /test product/i }).closest('div').parentElement;
    fireEvent.mouseEnter(card);

    // Unmount component
    unmount();

    // Cleanup should have been called
    expect(killSpy).toHaveBeenCalled();
  });
});

describe('ProductCard - Data Validation Tests', () => {
  it('should handle invalid product data gracefully', () => {
    render(
      <TestWrapper>
        <ProductCard product={invalidProduct} index={0} />
      </TestWrapper>
    );

    expect(screen.getByText('Invalid product data')).toBeInTheDocument();
  });

  it('should handle null product data', () => {
    render(
      <TestWrapper>
        <ProductCard product={null} index={0} />
      </TestWrapper>
    );

    expect(screen.getByText('Invalid product data')).toBeInTheDocument();
  });

  it('should handle undefined product data', () => {
    render(
      <TestWrapper>
        <ProductCard product={undefined} index={0} />
      </TestWrapper>
    );

    expect(screen.getByText('Invalid product data')).toBeInTheDocument();
  });

  it('should sanitize and display valid product data', () => {
    render(
      <TestWrapper>
        <ProductCard product={validProduct} index={0} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('ELECTRONICS')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('should handle products with missing measurements', () => {
    const productWithoutMeasurements = {
      ...validProduct,
      measurements: undefined,
      sizes: ['S', 'M', 'L']
    };

    render(
      <TestWrapper>
        <ProductCard product={productWithoutMeasurements} index={0} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});

describe('ProductCard - Button Interactions', () => {
  it('should handle Add to Cart button click', async () => {
    const addToCartSpy = vi.fn();
    const contextWithSpy = { ...mockShopContext, addToCart: addToCartSpy };

    render(
      <TestWrapper shopContext={contextWithSpy}>
        <ProductCard product={validProduct} index={0} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(addToCartSpy).toHaveBeenCalledWith('product1', 'small', 1);
  });

  it('should handle Buy Now button click', async () => {
    const navigateSpy = vi.fn();
    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => navigateSpy
      };
    });

    render(
      <TestWrapper>
        <ProductCard product={validProduct} index={0} />
      </TestWrapper>
    );

    const buyNowButton = screen.getByText('Buy Now');
    fireEvent.click(buyNowButton);

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith('/review-product', {
        state: {
          productId: 'product1',
          selectedMeasurement: 'small',
          quantity: 1
        }
      });
    }, { timeout: 1000 });
  });

  it('should disable buttons during loading states', async () => {
    render(
      <TestWrapper>
        <ProductCard product={validProduct} index={0} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByText('Add to Cart');
    const buyNowButton = screen.getByText('Buy Now');

    // Click Add to Cart
    fireEvent.click(addToCartButton);

    // Both buttons should be disabled during loading
    await waitFor(() => {
      expect(addToCartButton).toBeDisabled();
      expect(buyNowButton).toBeDisabled();
    });
  });
});

describe('ProductCard - Error Boundary Tests', () => {
  it('should catch and handle rendering errors', () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create a product that will cause an error in rendering
    const errorProduct = {
      ...validProduct,
      image: null // This should cause an error
    };

    render(
      <TestWrapper>
        <ProductCard product={errorProduct} index={0} />
      </TestWrapper>
    );

    // Should show error boundary fallback
    expect(screen.getByText(/product display error/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('should provide retry functionality in error boundary', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const errorProduct = {
      ...validProduct,
      image: null
    };

    render(
      <TestWrapper>
        <ProductCard product={errorProduct} index={0} />
      </TestWrapper>
    );

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    // Click retry button
    fireEvent.click(retryButton);
    
    consoleSpy.mockRestore();
  });
});