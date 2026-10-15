import apiClient, { TIMEOUTS } from '../../../core/utils/apiClient';

// API endpoint configurations
const ENDPOINT_CONFIGS = {
  // Fast operations (3s timeout)
  getProfile: { timeout: TIMEOUTS.fast },
  // Increase login timeout to handle cold-start production backends
  login: { timeout: TIMEOUTS.slow },
  register: { timeout: TIMEOUTS.slow },
  googleLogin: { timeout: TIMEOUTS.slow },
  
  // Medium operations (5s timeout)
  updateProfile: { timeout: TIMEOUTS.medium },
  updatePreferences: { timeout: TIMEOUTS.medium },
  changePassword: { timeout: TIMEOUTS.medium },
  uploadAvatar: { timeout: TIMEOUTS.medium },
  
  // Slow operations (8s timeout)
  deleteAccount: { timeout: TIMEOUTS.slow }
};

// Helper to get endpoint config with defaults
const getEndpointConfig = (endpoint) => ({
  timeout: TIMEOUTS.medium, // default timeout
  ...(ENDPOINT_CONFIGS[endpoint] || {})
});

export const userService = {
  // Get user profile
  async getProfile() {
    const config = getEndpointConfig('getProfile');
    try {
      const response = await apiClient.post('/api/user/profile', {}, config);
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error.message);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    const config = getEndpointConfig('updateProfile');
    try {
      const response = await apiClient.post('/api/user/profile/update', profileData, config);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error.message);
      throw error;
    }
  },

  // Update user preferences
  async updatePreferences(preferences) {
    const config = getEndpointConfig('updatePreferences');
    try {
      const response = await apiClient.post('/api/user/preferences/update', { preferences }, config);
      return response.data;
    } catch (error) {
      console.error('Update preferences error:', error.message);
      throw error;
    }
  },

  // Change password
  async changePassword(passwordData) {
    const config = getEndpointConfig('changePassword');
    try {
      const response = await apiClient.post('/api/user/password/change', passwordData, config);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error.message);
      throw error;
    }
  },

  // Upload avatar
  async uploadAvatar(file) {
    const config = getEndpointConfig('uploadAvatar');
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await apiClient.post('/api/user/avatar/upload', formData, config);
      return response.data;
    } catch (error) {
      console.error('Upload avatar error:', error.message);
      throw error;
    }
  },

  // Delete account
  async deleteAccount(password) {
    const config = getEndpointConfig('deleteAccount');
    try {
      const response = await apiClient.post('/api/user/account/delete', { password }, config);
      return response.data;
    } catch (error) {
      console.error('Delete account error:', error.message);
      throw error;
    }
  },

  // Login user
  async login(email, password) {
    const config = getEndpointConfig('login');
    try {
      const response = await apiClient.post('/api/user/login', { email, password }, config);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  },

  // Register user
  async register(name, email, password) {
    const config = getEndpointConfig('register');
    try {
      const response = await apiClient.post('/api/user/register', { name, email, password }, config);
      return response.data;
    } catch (error) {
      console.error('Register error:', error.message);
      throw error;
    }
  },
  // Login with Google
  async googleLogin(credential) {
    const config = getEndpointConfig('googleLogin');
    try {
      const response = await apiClient.post('/api/user/login/google', { credential }, config);
      return response.data;
    } catch (error) {
      console.error('Google login error:', error.message);
      throw error;
    }
  },
};

export default userService;