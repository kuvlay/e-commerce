import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Add from '../Add.jsx';
import { MEASUREMENT_TYPES, getMeasurementTypesForCategory } from '../../../../constants/measurements.js';

// Mock dependencies
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('axios');

vi.mock('../../../../App', () => ({
  backendUrl: 'http://localhost:4000',
}));

vi.mock('../../../../assets/assets', () => ({
  assets: {
    upload_area: '/mock-upload-area.png',
  },
}));

// Mock CustomCategoryModal component
vi.mock('../../components/CustomCategoryModal', () => ({
  default: ({ isOpen, onClose, onAdd, type }) => (
    isOpen ? (
      <div data-testid={`custom-${type}-modal`}>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onAdd({ name: `Test ${type}` })}>Add</button>
      </div>
    ) : null
  ),
}));

describe('Add Product - Measurement Type Selection', () => {
  const mockToken = 'mock-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with all measurement types selected for Food category', () => {
    render(<Add token={mockToken} />);
    
    // Check that Food category measurement types are initially selected
    const foodMeasurementTypes = getMeasurementTypesForCategory('Food');
    
    foodMeasurementTypes.forEach(type => {
      const typeInfo = MEASUREMENT_TYPES[type];
      const toggleButton = screen.getByText(typeInfo.label).closest('button');
      expect(toggleButton).toHaveClass('border-green-500', 'bg-green-50');
    });
  });

  it('should allow deselecting measurement types', async () => {
    render(<Add token={mockToken} />);
    
    // Find the weight measurement type toggle button
    const weightToggle = screen.getByText('Weight').closest('button');
    expect(weightToggle).toHaveClass('border-green-500', 'bg-green-50');
    
    // Click to deselect
    fireEvent.click(weightToggle);
    
    // Should now be deselected (gray styling)
    await waitFor(() => {
      expect(weightToggle).toHaveClass('border-gray-200', 'bg-gray-50', 'text-gray-400');
    });
  });

  it('should allow reselecting deselected measurement types', async () => {
    render(<Add token={mockToken} />);
    
    // Find and deselect weight measurement type
    const weightToggle = screen.getByText('Weight').closest('button');
    fireEvent.click(weightToggle);
    
    await waitFor(() => {
      expect(weightToggle).toHaveClass('border-gray-200', 'bg-gray-50', 'text-gray-400');
    });
    
    // Click again to reselect
    fireEvent.click(weightToggle);
    
    // Should now be selected again
    await waitFor(() => {
      expect(weightToggle).toHaveClass('border-green-500', 'bg-green-50');
    });
  });

  it('should show selection summary with correct count', () => {
    render(<Add token={mockToken} />);
    
    const foodMeasurementTypes = getMeasurementTypesForCategory('Food');
    const expectedCount = foodMeasurementTypes.length;
    
    // Check selection summary shows correct count
    expect(screen.getByText(`${expectedCount} measurement type${expectedCount > 1 ? 's' : ''} selected`)).toBeInTheDocument();
  });

  it('should hide Quick Add section when no measurement types are selected', async () => {
    render(<Add token={mockToken} />);
    
    // Initially should show Quick Add section
    expect(screen.getByText(/Quick Add Measurements/)).toBeInTheDocument();
    
    // Deselect all measurement types
    const foodMeasurementTypes = getMeasurementTypesForCategory('Food');
    for (const type of foodMeasurementTypes) {
      const typeInfo = MEASUREMENT_TYPES[type];
      const toggleButton = screen.getByText(typeInfo.label).closest('button');
      fireEvent.click(toggleButton);
    }
    
    // Quick Add section should be hidden
    await waitFor(() => {
      expect(screen.queryByText(/Quick Add Measurements/)).not.toBeInTheDocument();
    });
    
    // Should show message about no measurement types selected
    expect(screen.getByText('No Measurement Types Selected')).toBeInTheDocument();
  });

  it('should show active measurement type in selection summary', () => {
    render(<Add token={mockToken} />);
    
    // Should show currently active measurement type
    expect(screen.getByText(/Currently adding: Weight/)).toBeInTheDocument();
  });

  it('should switch active measurement type when current active type is deselected', async () => {
    render(<Add token={mockToken} />);
    
    // Initially weight should be active
    expect(screen.getByText(/Currently adding: Weight/)).toBeInTheDocument();
    
    // Deselect weight (which is currently active)
    const weightToggle = screen.getByText('Weight').closest('button');
    fireEvent.click(weightToggle);
    
    // Should switch to another available measurement type
    await waitFor(() => {
      const summaryText = screen.getByText(/Currently adding:/);
      expect(summaryText).not.toHaveTextContent('Weight');
    });
  });

  it('should show visual selection indicators correctly', () => {
    render(<Add token={mockToken} />);
    
    const foodMeasurementTypes = getMeasurementTypesForCategory('Food');
    
    foodMeasurementTypes.forEach(type => {
      const typeInfo = MEASUREMENT_TYPES[type];
      const toggleButton = screen.getByText(typeInfo.label).closest('button');
      
      // Should have checkmark indicator for selected types
      const checkmark = toggleButton.querySelector('.text-xs');
      expect(checkmark).toHaveTextContent('✓');
    });
  });

  it('should handle category change and reset measurement type selection', async () => {
    render(<Add token={mockToken} />);
    
    // Change category to Spices (which only has weight measurement)
    const categorySelect = screen.getByDisplayValue('Food');
    fireEvent.change(categorySelect, { target: { value: 'Spices' } });
    
    await waitFor(() => {
      // Should only show weight measurement type for Spices
      expect(screen.getByText('Weight')).toBeInTheDocument();
      expect(screen.queryByText('Size')).not.toBeInTheDocument();
    });
    
    // Selection summary should show 1 measurement type selected
    expect(screen.getByText('1 measurement type selected')).toBeInTheDocument();
  });
});