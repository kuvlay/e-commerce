/**
 * Product utility functions for consistent pricing and product data handling
 */

/**
 * Get the variant price for a product based on size/measurement
 * @param {Object} product - The product object
 * @param {string} size - The size/measurement value
 * @returns {number} The price for the specific variant or base price
 */
export const getVariantPrice = (product, size) => {
  if (!product) return 0;
  
  // If the product has measurements array, find the matching measurement
  if (product.measurements && Array.isArray(product.measurements)) {
    const measurement = product.measurements.find(m => m.value === size);
    if (measurement && measurement.price) {
      return measurement.price;
    }
  }
  
  // Fallback to base product price
  return product.price || 0;
};

/**
 * Format price for display
 * @param {number} price - The price to format
 * @param {string} currency - Currency symbol (default: '₹')
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency = '₹') => {
  return `${currency}${price}`;
};

/**
 * Calculate total price for a quantity of items
 * @param {number} price - Unit price
 * @param {number} quantity - Quantity of items
 * @returns {number} Total price
 */
export const calculateItemTotal = (price, quantity) => {
  return price * quantity;
};