import apiClient, { TIMEOUTS } from '../../../core/utils/apiClient';

// API endpoint configurations
const ENDPOINT_CONFIGS = {
  // Fast operations (3s timeout)
  getProfile: { timeout: TIMEOUTS.fast },
  getProfileCompletion: { timeout: TIMEOUTS.fast },
  
  // Medium operations (5s timeout)
  updateProfile: { timeout: TIMEOUTS.medium },
  getUserOrders: { timeout: TIMEOUTS.medium },
  
  // Slow operations (8s timeout)
  deleteAccount: { timeout: TIMEOUTS.slow }
};

// Helper to get endpoint config with defaults
const getEndpointConfig = (endpoint) => ({
  timeout: TIMEOUTS.medium, // default timeout
  ...(ENDPOINT_CONFIGS[endpoint] || {})
});

// Get user profile
export const getProfile = async () => {
  const config = getEndpointConfig('getProfile');
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await apiClient.post('/api/user/profile', {}, { ...config, headers: { token } });
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error.message);
    throw error;
  }
};

// Update user profile
export const updateProfile = async (profileData) => {
  const config = getEndpointConfig('updateProfile');
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await apiClient.post('/api/user/profile/update', profileData, { ...config, headers: { token } });
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error.message);
    throw error;
  }
};

// Get profile completion
export const getProfileCompletion = async () => {
  const config = getEndpointConfig('getProfileCompletion');
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await apiClient.post('/api/profile/completion', {}, { ...config, headers: { token } });
    return response.data;
  } catch (error) {
    console.error('Get profile completion error:', error.message);
    throw error;
  }
};

// Get user orders
export const getUserOrders = async () => {
  const config = getEndpointConfig('getUserOrders');
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await apiClient.post('/api/user/orders', {}, { ...config, headers: { token } });
    return response.data;
  } catch (error) {
    console.error('Get orders error:', error.message);
    throw error;
  }
};

// Delete user account
export const deleteAccount = async (password) => {
  const config = getEndpointConfig('deleteAccount');
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await apiClient.post('/api/user/account/delete', { password }, { ...config, headers: { token } });
    return response.data;
  } catch (error) {
    console.error('Delete account error:', error.message);
    throw error;
  }
};