import React from 'react';
import { 
  FaExclamationTriangle, 
  FaRedo, 
  FaShoppingCart, 
  FaBox,
  FaHome
} from 'react-icons/fa';
import { COLORS, GRADIENTS } from '../../../core/constants/theme';

/**
 * Fallback component for when orders data is missing or corrupted
 */
export const NoOrdersFound = ({ onRetry }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-6">
      <div className="mb-6">
        <FaShoppingCart className="mx-auto text-gray-400 text-6xl mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Orders Found</h2>
        <p className="text-gray-600">
          You haven't placed any orders yet. Start shopping to see your orders here!
        </p>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={() => window.location.href = '/'}
          className="w-full px-6 py-3 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105"
          style={{ background: GRADIENTS.primary }}
        >
          Start Shopping
        </button>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <FaRedo />
            Refresh Orders
          </button>
        )}
      </div>
    </div>
  </div>
);

/**
 * Fallback component for corrupted order data
 */
export const CorruptedOrderData = ({ orderCount, onRetry }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-6">
      <div className="mb-6">
        <FaExclamationTriangle className="mx-auto text-orange-500 text-6xl mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Data Loading Issue</h2>
        <p className="text-gray-600 mb-4">
          We're having trouble loading your order information. This might be a temporary issue.
        </p>
        {orderCount > 0 && (
          <p className="text-sm text-gray-500">
            Found {orderCount} orders, but some data appears to be corrupted.
          </p>
        )}
      </div>
      
      <div className="space-y-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-6 py-3 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
            style={{ background: GRADIENTS.primary }}
          >
            <FaRedo />
            Try Again
          </button>
        )}
        
        <button
          onClick={() => window.location.reload()}
          className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  </div>
);

/**
 * Fallback component for individual corrupted orders
 */
export const CorruptedOrderCard = ({ order, index, onRemove }) => (
  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-4">
    <div className="flex items-start gap-4">
      <FaExclamationTriangle className="text-red-500 text-xl mt-1 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Order Data Issue
        </h3>
        <p className="text-red-700 text-sm mb-3">
          This order contains corrupted data and cannot be displayed properly.
        </p>
        
        {/* Show available order info if any */}
        {order && (
          <div className="bg-red-100 rounded-lg p-3 mb-3">
            <h4 className="font-medium text-red-800 text-sm mb-2">Available Information:</h4>
            <div className="text-xs text-red-700 space-y-1">
              {order._id && <div>Order ID: {order._id.slice(-8)}</div>}
              {order.date && <div>Date: {new Date(order.date).toLocaleDateString()}</div>}
              {order.amount && <div>Amount: ${order.amount}</div>}
              {order.order_status && <div>Status: {order.order_status}</div>}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
          
          {onRemove && (
            <button
              onClick={() => onRemove(index)}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
            >
              Hide This Order
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

/**
 * Fallback component for missing order items
 */
export const MissingOrderItems = ({ orderId }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
    <div className="flex items-center gap-3">
      <FaBox className="text-yellow-600" />
      <div>
        <h4 className="font-medium text-yellow-800">Items Not Available</h4>
        <p className="text-sm text-yellow-700">
          Order items could not be loaded for this order.
        </p>
      </div>
    </div>
  </div>
);

/**
 * Fallback component for network errors
 */
export const NetworkError = ({ onRetry, error }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-6">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <FaExclamationTriangle className="text-red-500 text-2xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Problem</h2>
        <p className="text-gray-600 mb-4">
          Unable to load your orders. Please check your internet connection and try again.
        </p>
        
        {error && process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg text-left">
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Error Details (Development)
              </summary>
              <div className="text-gray-600 font-mono whitespace-pre-wrap break-all">
                {error.toString()}
              </div>
            </details>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-6 py-3 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
            style={{ background: GRADIENTS.primary }}
          >
            <FaRedo />
            Try Again
          </button>
        )}
        
        <button
          onClick={() => window.location.href = '/'}
          className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <FaHome />
          Go Home
        </button>
      </div>
    </div>
  </div>
);

/**
 * Loading skeleton for orders
 */
export const OrdersLoadingSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    ))}
  </div>
);
