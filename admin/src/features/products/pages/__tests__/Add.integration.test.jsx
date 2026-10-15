import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Add from '../Add.jsx';
import axios from 'axios';

// Mock dependencies
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('../../../../App', () => ({
  backendUrl: 'http://localhost:4000',
}));

vi.mock('../../../../assets/assets', () => ({
  assets: {
    upload_area: '/mock-upload-area.png',
  },
}));

vi.mock('../../components/CustomCategoryModal', () => ({
  default: ({ isOpen, onClose }) => (
    isOpen ? <div data-testid="modal"><button onClick={onClose}>Close</button></div> : null
  ),
}));

describe('Add Product - Integration Tests', () => {
  const mockToken = 'mock-token';

  beforeEach(() => {
    vi.clearAllMocks();
    axios.post.mockResolvedValue({
      data: { success: true, message: 'Product added successfully' },
      status: 200,
    });
  });

  it('should prevent form submission when no measurement types are selected', async () => {
    render(<Add token={mockToken} />);
    
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('Enter product name'), {
      target: { value: 'Test Product' }
    });
    fireEvent.change(screen.getByPlaceholderText('Describe your product in detail...'), {
      target: { value: 'Test Description' }
    });
    
    // Add a mock image
    const imageInput = screen.getAllByRole('button')[0].querySelector('input[type="file"]');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(imageInput, { target: { files: [file] } });
    
    // Deselect all measurement types
    const weightToggle = screen.getByText('Weight').closest('button');
    const quantityToggle = screen.getByText('Quantity').closest('button');
    const volumeToggle = screen.getByText('Volume').closest('button');
    const sizeToggle = screen.getByText('Size').closest('button');
    
    fireEvent.click(weightToggle);
    fireEvent.click(quantityToggle);
    fireEvent.click(volumeToggle);
    fireEvent.click(sizeToggle);
    
    // Try to submit form
    const submitButton = screen.getByText('Add Product');
    fireEvent.click(submitButton);
    
    // Should not call axios (form should be prevented from submitting)
    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  it('should allow form submission when measurement types are selected and measurements are added', async () => {
    render(<Add token={mockToken} />);
    
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('Enter product name'), {
      target: { value: 'Test Product' }
    });
    fireEvent.change(screen.getByPlaceholderText('Describe your product in detail...'), {
      target: { value: 'Test Description' }
    });
    
    // Add a mock image
    const imageInput = screen.getAllByRole('button')[0].querySelector('input[type="file"]');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(imageInput, { target: { files: [file] } });
    
    // Add a measurement using quick-add
    const quickAddButton = screen.getByText('+ 100 grams');
    fireEvent.click(quickAddButton);
    
    // Set price for the measurement
    const priceInput = screen.getByDisplayValue('0');
    fireEvent.change(priceInput, { target: { value: '150' } });
    
    // Submit form
    const submitButton = screen.getByText('Add Product');
    fireEvent.click(submitButton);
    
    // Should call axios with correct data
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/product/add',
        expect.any(FormData),
        { headers: { token: mockToken } }
      );
    });
  });

  it('should show correct UI states when switching between measurement types', async () => {
    render(<Add token={mockToken} />);
    
    // Initially should show Weight as active
    expect(screen.getByText(/Currently adding: Weight/)).toBeInTheDocument();
    expect(screen.getByText('Quick Add Measurements - Weight')).toBeInTheDocument();
    
    // Click on Quantity to make it active
    const quantityActiveButton = screen.getByText('Weight').closest('div').nextElementSibling.querySelector('button');
    fireEvent.click(quantityActiveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Currently adding: Quantity/)).toBeInTheDocument();
      expect(screen.getByText('Quick Add Measurements - Quantity')).toBeInTheDocument();
    });
  });

  it('should handle custom measurements correctly', async () => {
    render(<Add token={mockToken} />);
    
    // Add custom measurement
    const valueInput = screen.getByPlaceholderText('e.g., 750g');
    const priceInput = screen.getByPlaceholderText('e.g., 150');
    
    fireEvent.change(valueInput, { target: { value: '2.5kg' } });
    fireEvent.change(priceInput, { target: { value: '300' } });
    
    const addCustomButton = screen.getByText('Add Custom Measurement');
    fireEvent.click(addCustomButton);
    
    // Should show the measurement in the list
    await waitFor(() => {
      expect(screen.getByText('2.5kg')).toBeInTheDocument();
      expect(screen.getByDisplayValue('300')).toBeInTheDocument();
    });
    
    // Should clear the custom measurement form
    expect(valueInput.value).toBe('');
    expect(priceInput.value).toBe('');
  });
});