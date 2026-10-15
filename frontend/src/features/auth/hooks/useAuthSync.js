import { useEffect, useContext } from 'react';
import { ShopContext } from '../../../core/context/ShopContext';
import { useUser } from '../../../core/context/UserContext';

// Custom hook to synchronize authentication state between contexts
export const useAuthSync = () => {
  const { setToken } = useContext(ShopContext);
  const { isAuthenticated, user } = useUser();

  useEffect(() => {
    // Sync token when authentication state changes
    const token = localStorage.getItem('token');
    if (isAuthenticated && token) {
      setToken(token);
    } else if (!isAuthenticated) {
      setToken('');
    }
  }, [isAuthenticated, setToken]);

  return { isAuthenticated, user };
};