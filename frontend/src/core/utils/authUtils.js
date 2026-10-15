/**
 * Authentication utility functions
 * Provides helper functions for token management and auth state cleanup
 */

/**
 * Check if a token is valid (basic JWT format validation)
 * @param {string} token - The token to validate
 * @returns {boolean} - Whether the token appears to be valid
 */
export const isValidToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  if (token.trim() === '' || token === 'null' || token === 'undefined') return false;
  
  // Check if token looks like a JWT (has 3 parts separated by dots)
  const parts = token.split('.');
  return parts.length === 3;
};

/**
 * Get token from localStorage with validation
 * @returns {string|null} - Valid token or null
 */
export const getValidToken = () => {
  const token = localStorage.getItem('token');
  return isValidToken(token) ? token : null;
};

/**
 * Clear authentication state from localStorage
 */
export const clearAuthState = () => {
  localStorage.removeItem('token');
  
  // Clear any other auth-related localStorage items
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('auth') || key.includes('user') || key.includes('login'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

/**
 * Perform logout cleanup
 */
export const logout = () => {
  clearAuthState();
  sessionStorage.clear();
};