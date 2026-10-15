import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../../features/auth/services/userService';
import { toast } from 'react-toastify';
import { isValidToken } from '../../core/utils/authUtils';
import apiClient, { TIMEOUTS } from '../utils/apiClient';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize user data on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      loadUserProfile();
    }
  }, []);

  // Test backend connectivity
  const testBackendConnection = async () => {
    try {
      const response = await apiClient.get('/api/test', { timeout: TIMEOUTS.fast });
      const data = response.data;
      console.log('Backend test:', data);
      return !!data?.success;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  };

  // Load user profile from API
  const loadUserProfile = async () => {
    // Prevent multiple simultaneous calls
    if (loading) {
      console.log('Profile loading already in progress, skipping...');
      return;
    }

    try {
      setLoading(true);
      const response = await userService.getProfile();
      
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        // Token might be invalid
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      
      // Handle different error types
      if (error.code === 'ECONNABORTED') {
        console.error('Profile request timeout - backend may be sleeping on Render');
        // Create fallback user from token if available
        const token = localStorage.getItem('token');
        if (isValidToken(token)) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({
              _id: payload.id,
              name: 'User',
              email: 'user@example.com',
              phone: '',
              dateOfBirth: null,
              gender: '',
              avatar: '',
              preferences: {},
              addresses: [],
              wishlist: [],
              cartData: {},
              joinDate: new Date()
            });
            setIsAuthenticated(true);
          } catch (tokenError) {
            console.error('Failed to parse token:', tokenError);
          }
        }
      } else if (error.response?.status === 404) {
        console.error('Profile endpoint not found - backend may not be running');
        // Test backend connection
        const backendWorking = await testBackendConnection();
        if (!backendWorking) {
          console.error('Backend server is not responding');
          // Create a fallback user object from token
          try {
            const token = localStorage.getItem('token');
            if (isValidToken(token)) {
              const payload = JSON.parse(atob(token.split('.')[1]));
              setUser({
                _id: payload.id,
                name: 'User',
                email: 'user@example.com',
                phone: '',
                dateOfBirth: null,
                gender: '',
                avatar: '',
                preferences: {},
                addresses: [],
                wishlist: [],
                cartData: {},
                joinDate: new Date()
              });
            }
          } catch (tokenError) {
            console.error('Failed to parse token:', tokenError);
          }
        }
      } else if (error.response?.status === 401) {
        // Clear token only for auth errors
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        console.error('Network error - backend server may be down');
        // Don't clear token for network errors
      }
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await userService.login(email, password);
      
      if (response.success) {
        // Store token and update authentication state
        localStorage.setItem('token', response.token);
        setIsAuthenticated(true);
        toast.success('Logged in successfully!');
        
        // Load user profile to update state properly
        await loadUserProfile();
        
        return { success: true };
      } else {
        toast.error(response.message || 'Login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return { success: false, message: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Login with Google token (after backend verification)
  const loginWithGoogleToken = async (token) => {
    try {
      setLoading(true);
      if (!token || !isValidToken(token)) {
        toast.error('Invalid login token');
        return { success: false, message: 'Invalid token' };
      }
      // Store token and update authentication state
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      // Load user profile
      await loadUserProfile();
      toast.success('Logged in with Google!');
      return { success: true };
    } catch (error) {
      console.error('Google token handling error:', error);
      toast.error('Login failed. Please try again.');
      return { success: false, message: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await userService.register(name, email, password);
      
      if (response.success) {
        // Signup should not auto-authenticate; guide user to verify email
        if (response.requiresVerification) {
          toast.success(response.message || 'Account created. Please verify your email to continue.');
          return { success: true, requiresVerification: true };
        }
        // If backend ever returns a token post-verification, handle gracefully
        if (response.token && isValidToken(response.token)) {
          localStorage.setItem('token', response.token);
          setIsAuthenticated(true);
          await loadUserProfile();
          toast.success('Account verified and logged in!');
          return { success: true };
        }
        // Default: success without token
        toast.success(response.message || 'Account created. Please verify your email.');
        return { success: true, requiresVerification: true };
      } else {
        toast.error(response.message || 'Registration failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
      return { success: false, message: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    // Clear all user-related data
    localStorage.removeItem('token');
    localStorage.removeItem('cartItems');
    localStorage.removeItem('userPreferences');
    
    // Clear session storage
    sessionStorage.clear();
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    
    // Show success message
    toast.success('Logged out successfully!');
    
    // Immediately redirect to homepage with refresh (no delay, no navigation)
    window.location.href = '/';
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await userService.updateProfile(profileData);
      
      if (response.success && response.user) {
        setUser(response.user);
        toast.success('Profile updated successfully!');
        return { success: true };
      } else {
        toast.error(response.message || 'Failed to update profile');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
      return { success: false, message: 'Update failed' };
    } finally {
      setLoading(false);
    }
  };

  // Update user preferences
  const updatePreferences = async (preferences) => {
    try {
      setLoading(true);
      const response = await userService.updatePreferences(preferences);
      
      if (response.success) {
        setUser(prev => ({ ...prev, preferences: response.preferences }));
        toast.success('Preferences updated successfully!');
        return { success: true };
      } else {
        toast.error(response.message || 'Failed to update preferences');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Update preferences error:', error);
      toast.error('Failed to update preferences');
      return { success: false, message: 'Update failed' };
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      const response = await userService.changePassword({
        currentPassword,
        newPassword
      });
      
      if (response.success) {
        toast.success('Password changed successfully!');
        return { success: true };
      } else {
        toast.error(response.message || 'Failed to change password');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error('Failed to change password');
      return { success: false, message: 'Password change failed' };
    } finally {
      setLoading(false);
    }
  };

  // Upload avatar
  const uploadAvatar = async (file) => {
    try {
      setLoading(true);
      const response = await userService.uploadAvatar(file);
      
      if (response.success) {
        setUser(prev => ({ ...prev, avatar: response.avatar }));
        toast.success('Profile picture updated successfully!');
        return { success: true, avatar: response.avatar };
      } else {
        toast.error(response.message || 'Failed to upload avatar');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      toast.error('Failed to upload profile picture');
      return { success: false, message: 'Upload failed' };
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const deleteAccount = async (password) => {
    try {
      setLoading(true);
      const response = await userService.deleteAccount(password);
      
      if (response.success) {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        toast.success('Account deleted successfully');
        return { success: true };
      } else {
        toast.error(response.message || 'Failed to delete account');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Failed to delete account');
      return { success: false, message: 'Delete failed' };
    } finally {
      setLoading(false);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get formatted join date
  const getJoinDate = () => {
    if (!user?.joinDate) return 'Recently';
    return new Date(user.joinDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const value = {
    // State
    user,
    loading,
    isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
    changePassword,
    uploadAvatar,
    deleteAccount,
    loadUserProfile,
    loginWithGoogleToken,
    
    // Utilities
    getUserInitials,
    getJoinDate
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;