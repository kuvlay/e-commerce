import apiClient, { TIMEOUTS } from '../../../core/utils/apiClient';

// API endpoint configurations
const ENDPOINT_CONFIGS = {
  // Fast operations (3s timeout)
  getAddresses: { timeout: TIMEOUTS.fast },
  
  // Medium operations (5s timeout)
  addAddress: { timeout: TIMEOUTS.medium },
  updateAddress: { timeout: TIMEOUTS.medium },
  deleteAddress: { timeout: TIMEOUTS.medium },
  setDefaultAddress: { timeout: TIMEOUTS.medium }
};

// Helper to get endpoint config with defaults
const getEndpointConfig = (endpoint) => ({
  timeout: TIMEOUTS.medium, // default timeout
  ...(ENDPOINT_CONFIGS[endpoint] || {})
});

export const addressService = {
  // Get all addresses for the user
  getAddresses: async () => {
    const config = getEndpointConfig('getAddresses');
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.get('/api/address/list', { ...config, headers: { token } });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch addresses:', error.message);
      throw error;
    }
  },

  // Add new address
  addAddress: async (addressData) => {
    const config = getEndpointConfig('addAddress');
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.post('/api/address/add', addressData, { ...config, headers: { token } });
      return response.data;
    } catch (error) {
      console.error('Failed to add address:', error.message);
      throw error;
    }
  },

  // Update existing address
  updateAddress: async (addressId, addressData) => {
    const config = getEndpointConfig('updateAddress');
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.post('/api/address/update', 
        { ...addressData, addressId },
        { ...config, headers: { token }, params: { _t: Date.now() } } // Add timestamp to prevent caching
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update address:', error.message);
      throw error;
    }
  },

  // Delete address
  deleteAddress: async (addressId) => {
    const config = getEndpointConfig('deleteAddress');
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.post('/api/address/delete', { addressId }, { ...config, headers: { token } });
      return response.data;
    } catch (error) {
      console.error('Failed to delete address:', error.message);
      throw error;
    }
  },

  // Set default address
  setDefaultAddress: async (addressId) => {
    const config = getEndpointConfig('setDefaultAddress');
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.post(
        '/api/address/set-default', 
        { addressId },
        { ...config, headers: { token }, params: { _t: Date.now() } } // Add timestamp to prevent caching
      );
      return response.data;
    } catch (error) {
      console.error('Failed to set default address:', error.message);
      throw error;
    }
  }
};