import React, { useState, useEffect, useRef } from 'react';
import { 
  FaShippingFast, 
  FaTruck, 
  FaEye, 
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaRedo
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/admin-shipping-animations.css';

const ShippingInfoForm = ({ 
  order, 
  shippingData, 
  onUpdate, 
  onSave, 
  isLoading = false,
  validationErrors = [],
  className = '' 
}) => {
  const [localData, setLocalData] = useState({
    carrier: '',
    trackingNumber: '',
    ...shippingData
  });
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);
  const carrierInputRef = useRef(null);
  const trackingInputRef = useRef(null);

  // Sync with parent data
  useEffect(() => {
    setLocalData({
      carrier: '',
      trackingNumber: '',
      ...shippingData
    });
  }, [shippingData]);

  // Check if shipping fields should be available based on order status
  const isShippingAllowed = ['Shipped', 'OutForDelivery', 'Out for Delivery', 'Delivered'].includes(
    order.order_status || order.status || ''
  );

  // Handle input changes with validation
  const handleInputChange = (field, value) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onUpdate(newData);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoading && (localData.carrier.trim() || localData.trackingNumber.trim())) {
      onSave();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'carrier') {
        trackingInputRef.current?.focus();
      } else if (field === 'trackingNumber') {
        handleSubmit(e);
      }
    } else if (e.key === 'Escape') {
      e.target.blur();
    }
  };

  // Get validation errors for specific field
  const getFieldErrors = (field) => {
    return validationErrors.filter(error => error.field === field || error.field === 'both');
  };

  // Check if form has unsaved changes
  const hasUnsavedChanges = shippingData?.hasUnsavedChanges || false;
  const isSaving = shippingData?.isSaving || isLoading;
  const persistenceVerified = shippingData?.persistenceVerified || false;
  const persistenceFailure = shippingData?.persistenceFailure || false;

  if (!isShippingAllowed) {
    return null; // Don't show anything when shipping is not allowed
  }

  return (
    <div className={`admin-shipping-form ${isSaving ? 'loading' : ''} ${className}`}>
      {/* Form Header */}
      <div className="admin-shipping-form-header">
        <div className="admin-shipping-form-title">
          <FaShippingFast />
          <span>Shipping Information</span>
          <div className={`admin-shipping-status-indicator ${
            persistenceFailure ? 'disabled' : 
            persistenceVerified && !hasUnsavedChanges ? 'available' : 
            'restricted'
          }`} />
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
              Unsaved Changes
            </span>
          )}
          {isSaving && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium flex items-center gap-1">
              <FaSpinner className="animate-spin" />
              Saving...
            </span>
          )}
          {persistenceVerified && !hasUnsavedChanges && !isSaving && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium flex items-center gap-1">
              <FaCheckCircle />
              Saved
            </span>
          )}
          {persistenceFailure && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium flex items-center gap-1">
              <FaExclamationTriangle />
              Error
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Group */}
        <div className="admin-shipping-input-group">
          {/* Carrier Input */}
          <div className="admin-shipping-input-wrapper">
            <input
              ref={carrierInputRef}
              id={`carrier-${order._id}`}
              type="text"
              placeholder="Enter carrier name (e.g., FedEx, UPS, DHL)"
              value={localData.carrier}
              maxLength={50}
              disabled={isSaving}
              className={`admin-shipping-input admin-shipping-transition ${
                getFieldErrors('carrier').length > 0 ? 'admin-shipping-input-invalid' : 
                hasUnsavedChanges ? 'border-yellow-400' : 'admin-shipping-input-valid'
              }`}
              onChange={(e) => handleInputChange('carrier', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'carrier')}
              onFocus={() => {
                setIsFocused(true);
                setShowTooltip('carrier');
              }}
              onBlur={() => {
                setIsFocused(false);
                setShowTooltip(null);
              }}
              aria-describedby={`carrier-help-${order._id}`}
              aria-invalid={getFieldErrors('carrier').length > 0}
            />
            <label htmlFor={`carrier-${order._id}`} className="admin-shipping-input-label">
              <FaTruck className="inline mr-1" />
              Carrier Name
            </label>
            
            {/* Character Count */}
            <div className="absolute right-3 top-3 text-xs text-gray-400 bg-white px-1 rounded">
              {localData.carrier.length}/50
            </div>
            
            {/* Tooltip */}
            {showTooltip === 'carrier' && (
              <div className="admin-shipping-tooltip show" style={{ top: '100%', left: '0', marginTop: '0.5rem' }}>
                Common carriers: FedEx, UPS, DHL, USPS, Blue Dart
              </div>
            )}
          </div>

          {/* Tracking Number Input */}
          <div className="admin-shipping-input-wrapper">
            <input
              ref={trackingInputRef}
              id={`tracking-${order._id}`}
              type="text"
              placeholder="Enter tracking number"
              value={localData.trackingNumber}
              maxLength={50}
              disabled={isSaving}
              className={`admin-shipping-input admin-shipping-transition ${
                getFieldErrors('trackingNumber').length > 0 ? 'admin-shipping-input-invalid' : 
                hasUnsavedChanges ? 'border-yellow-400' : 'admin-shipping-input-valid'
              }`}
              onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'trackingNumber')}
              onFocus={() => {
                setIsFocused(true);
                setShowTooltip('tracking');
              }}
              onBlur={() => {
                setIsFocused(false);
                setShowTooltip(null);
              }}
              aria-describedby={`tracking-help-${order._id}`}
              aria-invalid={getFieldErrors('trackingNumber').length > 0}
            />
            <label htmlFor={`tracking-${order._id}`} className="admin-shipping-input-label">
              <FaEye className="inline mr-1" />
              Tracking Number
            </label>
            
            {/* Character Count */}
            <div className="absolute right-3 top-3 text-xs text-gray-400 bg-white px-1 rounded">
              {localData.trackingNumber.length}/50
            </div>
            
            {/* Tooltip */}
            {showTooltip === 'tracking' && (
              <div className="admin-shipping-tooltip show" style={{ top: '100%', left: '0', marginTop: '0.5rem' }}>
                Enter the tracking number provided by the carrier
              </div>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="admin-shipping-error-message">
            <FaExclamationTriangle />
            <div>
              <div className="font-medium">Validation Issues:</div>
              <ul className="text-sm mt-1 space-y-1">
                {validationErrors.slice(0, 3).map((error, index) => (
                  <li key={index}>• {error.message}</li>
                ))}
                {validationErrors.length > 3 && (
                  <li>... and {validationErrors.length - 3} more issue{validationErrors.length - 3 !== 1 ? 's' : ''}</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Success Message */}
        {persistenceVerified && !hasUnsavedChanges && !isSaving && (
          <div className="admin-shipping-success-message">
            <div>
              <div className="font-medium">Shipping information saved successfully!</div>
              <div className="text-sm mt-1">Changes have been verified and stored.</div>
            </div>
          </div>
        )}

        {/* Retry Message */}
        {shippingData?.isRetrying && (
          <div className="admin-shipping-retry-countdown">
            <div className="admin-shipping-retry-countdown-number">
              {shippingData.retryCountdown || 0}
            </div>
            <div>
              <div className="font-medium">Retrying save operation...</div>
              <div className="text-sm">
                {shippingData.retryReason || 'Please wait'} {shippingData.retryCountdown}s
              </div>
              {shippingData.retryProgress !== undefined && (
                <div className="admin-shipping-retry-progress mt-2">
                  <div 
                    className="admin-shipping-retry-progress-bar"
                    style={{ width: `${shippingData.retryProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="admin-shipping-button-group">
          <button
            type="submit"
            disabled={isSaving || (!localData.carrier.trim() && !localData.trackingNumber.trim())}
            className={`admin-shipping-button admin-shipping-button-primary ${
              isSaving ? 'admin-shipping-btn-loading' : ''
            }`}
            data-save-button={order._id}
          >
            {isSaving ? (
              <>
                <FaSpinner className="admin-shipping-loading" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Save Shipping Info</span>
              </>
            )}
          </button>

          {persistenceFailure && (
            <button
              type="button"
              onClick={() => onSave()}
              disabled={isSaving}
              className="admin-shipping-button admin-shipping-button-secondary"
            >
              <FaRedo />
              <span>Retry</span>
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 mt-2">
          <FaInfoCircle className="inline mr-1" />
          Enter at least one field (carrier or tracking number) to save shipping information.
          Press Enter to move between fields or save the form.
        </div>
      </form>

      {/* Loading Overlay */}
      {isSaving && (
        <div className="admin-shipping-loading-overlay">
          <div className="admin-shipping-loading-spinner-container">
            <div className="admin-shipping-loading-pulse" />
            <div className="admin-shipping-loading-text">
              Saving shipping information...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingInfoForm;