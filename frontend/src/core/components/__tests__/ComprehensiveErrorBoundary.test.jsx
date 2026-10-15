import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ComprehensiveErrorBoundary from '../ComprehensiveErrorBoundary';

import { vi } from 'vitest';

// Mock error monitoring
vi.mock('../../utils/errorMonitoring', () => ({
  default: {
    captureError: vi.fn()
  },
  ERROR_SEVERITY: {
    HIGH: 'high'
  },
  ERROR_CATEGORIES: {
    COMPONENT: 'component'
  }
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ComprehensiveErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('renders children when there is no error', () => {
    render(
      <ComprehensiveErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ComprehensiveErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  test('renders error UI when child component throws', () => {
    render(
      <ComprehensiveErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ComprehensiveErrorBoundary>
    );

    expect(screen.getByText('Component Error')).toBeInTheDocument();
    expect(screen.getByText('A component failed to render properly.')).toBeInTheDocument();
  });

  test('shows custom title and message', () => {
    render(
      <ComprehensiveErrorBoundary
        title="Custom Error Title"
        message="Custom error message"
      >
        <ThrowError shouldThrow={true} />
      </ComprehensiveErrorBoundary>
    );

    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  test('retry button works correctly', () => {
    const { rerender } = render(
      <ComprehensiveErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ComprehensiveErrorBoundary>
    );

    expect(screen.getByText('Component Error')).toBeInTheDocument();

    const retryButton = screen.getByText(/Try Again/);
    fireEvent.click(retryButton);

    // After retry, re-render with no error
    rerender(
      <ComprehensiveErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ComprehensiveErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  test('shows component name when provided', () => {
    render(
      <ComprehensiveErrorBoundary componentName="TestComponent">
        <ThrowError shouldThrow={true} />
      </ComprehensiveErrorBoundary>
    );

    expect(screen.getByText('Component: TestComponent')).toBeInTheDocument();
  });

  test('uses custom fallback when provided', () => {
    const customFallback = (error, retry) => (
      <div>
        <p>Custom fallback UI</p>
        <button onClick={retry}>Custom Retry</button>
      </div>
    );

    render(
      <ComprehensiveErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ComprehensiveErrorBoundary>
    );

    expect(screen.getByText('Custom fallback UI')).toBeInTheDocument();
    expect(screen.getByText('Custom Retry')).toBeInTheDocument();
  });
});