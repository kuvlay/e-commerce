import React from 'react';
import { 
  FaShippingFast, 
  FaBox, 
  FaCheckCircle, 
  FaClock, 
  FaTruck,
  FaHome
} from 'react-icons/fa';
import '../styles/status-timeline.css';

const StatusTimeline = ({ currentStatus, paymentStatus }) => {
  // Define the standard order status progression
  const statusProgression = [
    { key: 'pending', label: 'Pending', icon: FaClock },
    { key: 'placed', label: 'Order Placed', icon: FaClock },
    { key: 'packed', label: 'Packed', icon: FaBox },
    { key: 'shipped', label: 'Shipped', icon: FaShippingFast },
    { key: 'outfordelivery', label: 'Out for Delivery', icon: FaTruck },
    { key: 'delivered', label: 'Delivered', icon: FaCheckCircle }
  ];

  // Normalize current status for comparison
  const normalizeStatus = (status) => {
    if (!status) return null;
    const normalized = status.toLowerCase().replace(/\s+/g, '');
    
    // Handle various status formats
    switch (normalized) {
      case 'pending':
        return 'pending';
      case 'orderplaced':
      case 'placed':
        return 'placed';
      case 'packing':
      case 'packed':
        return 'packed';
      case 'shipped':
        return 'shipped';
      case 'outfordelivery':
        return 'outfordelivery';
      case 'delivered':
        return 'delivered';
      case 'cancelled':
        return 'cancelled';
      default:
        return null; // Return null for unknown statuses
    }
  };

  const currentStatusNormalized = normalizeStatus(currentStatus);
  
  // Handle cancelled orders separately
  if (currentStatusNormalized === 'cancelled') {
    return (
      <div className="status-timeline">
        <div className="timeline-container">
          <div className="timeline-item current cancelled">
            <div className="timeline-icon">
              <FaClock className="text-red-500" />
            </div>
            <div className="timeline-content">
              <span className="status-label text-red-600 font-medium">Cancelled</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Find current status index in progression
  const currentStatusIndex = currentStatusNormalized ? statusProgression.findIndex(
    status => status.key === currentStatusNormalized
  ) : -1;

  // If status not found in progression, show just current status
  if (currentStatusIndex === -1) {
    return (
      <div className="status-timeline">
        <div className="timeline-container">
          <div className="timeline-item current">
            <div className="timeline-icon">
              <FaClock className="text-gray-500" />
            </div>
            <div className="timeline-content">
              <span className="status-label text-gray-600 font-medium">
                {currentStatus || 'Processing'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generate timeline items (completed statuses + current status)
  const timelineItems = statusProgression.slice(0, currentStatusIndex + 1).map((status, index) => {
    const isCurrentStatus = index === currentStatusIndex;
    const StatusIcon = status.icon;
    
    return {
      ...status,
      isCurrentStatus,
      isCompleted: !isCurrentStatus
    };
  });

  // Determine if scrolling is needed (more than 3 items)
  const needsScrolling = timelineItems.length > 3;

  return (
    <div className="status-timeline">
      <div className={`timeline-container ${needsScrolling ? 'scrollable' : ''}`}>
        {timelineItems.map((item, index) => {
          const StatusIcon = item.icon;
          
          return (
            <div 
              key={item.key}
              className={`timeline-item ${item.isCurrentStatus ? 'current' : 'completed'}`}
            >
              <div className="timeline-icon">
                <StatusIcon 
                  className={
                    item.isCurrentStatus 
                      ? 'text-orange-500' 
                      : 'text-green-500'
                  } 
                />
              </div>
              <div className="timeline-content">
                <span 
                  className={`status-label ${
                    item.isCurrentStatus 
                      ? 'text-orange-600 font-semibold' 
                      : 'text-green-600 font-medium'
                  }`}
                >
                  {item.label}
                </span>
                {item.isCurrentStatus && (
                  <div className="current-indicator">
                    <div className="pulse-dot"></div>
                  </div>
                )}
              </div>
              {index < timelineItems.length - 1 && (
                <div className="timeline-connector completed"></div>
              )}
            </div>
          );
        })}
      </div>
      

    </div>
  );
};

export default StatusTimeline;