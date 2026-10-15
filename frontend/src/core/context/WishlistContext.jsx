import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { ShopContext } from './ShopContext';
import { toast } from 'react-toastify';
import apiClient from '../utils/apiClient';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useUser();
  const { backendUrl } = useContext(ShopContext);

  // Load wishlist when user logs in, clear when user logs out
  useEffect(() => {
    if (isAuthenticated && user) {
      loadWishlist();
    } else {
      // Clear wishlist when user logs out or is not authenticated
      setWishlistItems([]);
    }
  }, [isAuthenticated, user]);

  // Load wishlist from backend
  const loadWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await apiClient.get('/api/wishlist/get', {
        headers: { token }
      });

      if (response.data.success) {
        setWishlistItems(response.data.wishlist || []);
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.post(
        '/api/wishlist/add',
        { productId },
        { headers: { token } }
      );

      if (response.data.success) {
        setWishlistItems(prev => [...prev, productId]);
        toast.success('Added to wishlist!');
        return true;
      } else {
        toast.error(response.data.message || 'Failed to add to wishlist');
        return false;
      }
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      
      if (error.response?.status === 404) {
        toast.error('Wishlist feature temporarily unavailable');
      } else if (error.response?.status === 401) {
        toast.error('Please login again to use wishlist');
      } else {
        toast.error('Failed to add to wishlist - please try again');
      }
      return false;
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated) return false;

    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.post(
        '/api/wishlist/remove',
        { productId },
        { headers: { token } }
      );

      if (response.data.success) {
        setWishlistItems(prev => prev.filter(id => id !== productId));
        toast.success('Removed from wishlist');
        return true;
      } else {
        toast.error(response.data.message || 'Failed to remove from wishlist');
        return false;
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      toast.error('Failed to remove from wishlist');
      return false;
    }
  };

  // Toggle wishlist item
  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      return false;
    }

    const isInWishlist = wishlistItems.includes(productId);
    
    if (isInWishlist) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  // Check if item is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.includes(productId);
  };

  // Get wishlist count
  const getWishlistCount = () => {
    return wishlistItems.length;
  };

  // Clear wishlist (for logout)
  const clearWishlist = () => {
    setWishlistItems([]);
  };

  const value = {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    getWishlistCount,
    clearWishlist,
    loadWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;