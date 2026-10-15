import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusTimeline from '../StatusTimeline';

describe('StatusTimeline Component', () => {
  it('renders pending status correctly', () => {
    render(<StatusTimeline currentStatus="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders order placed status correctly', () => {
    render(<StatusTimeline currentStatus="placed" />);
    expect(screen.getByText('Order Placed')).toBeInTheDocument();
  });

  it('shows progression for shipped status', () => {
    render(<StatusTimeline currentStatus="shipped" />);
    
    // Should show all previous statuses plus current
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Order Placed')).toBeInTheDocument();
    expect(screen.getByText('Packed')).toBeInTheDocument();
    expect(screen.getByText('Shipped')).toBeInTheDocument();
  });

  it('shows progression for out for delivery status', () => {
    render(<StatusTimeline currentStatus="out for delivery" />);
    
    // Should show all previous statuses plus current
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Order Placed')).toBeInTheDocument();
    expect(screen.getByText('Packed')).toBeInTheDocument();
    expect(screen.getByText('Shipped')).toBeInTheDocument();
    expect(screen.getByText('Out for Delivery')).toBeInTheDocument();
  });

  it('handles cancelled status separately', () => {
    render(<StatusTimeline currentStatus="cancelled" />);
    
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    // Should not show progression for cancelled orders
    expect(screen.queryByText('Order Placed')).not.toBeInTheDocument();
  });

  it('applies scrollable class for long progressions', () => {
    const { container } = render(<StatusTimeline currentStatus="delivered" />);
    
    // Delivered status should show 6 items (pending -> delivered), which is > 3
    const timelineContainer = container.querySelector('.timeline-container');
    expect(timelineContainer).toHaveClass('scrollable');
  });

  it('does not apply scrollable class for short progressions', () => {
    const { container } = render(<StatusTimeline currentStatus="packed" />);
    
    // Packed status should show 3 items (pending, placed, packed), which is = 3
    const timelineContainer = container.querySelector('.timeline-container');
    expect(timelineContainer).not.toHaveClass('scrollable');
  });

  it('handles unknown status gracefully', () => {
    render(<StatusTimeline currentStatus="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });

  it('handles empty status gracefully', () => {
    render(<StatusTimeline currentStatus="" />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('normalizes status formats correctly', () => {
    render(<StatusTimeline currentStatus="Order Placed" />);
    expect(screen.getByText('Order Placed')).toBeInTheDocument();
  });
});