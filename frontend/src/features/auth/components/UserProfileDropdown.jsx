import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaShoppingBag, FaShoppingCart, FaCog, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { ShopContext } from '../../../core/context/ShopContext';
import { useUser } from '../../../core/context/UserContext';
import { toast } from 'react-toastify';
import { COLORS, GRADIENTS, SHADOWS } from '../../../core/constants/theme';

const UserProfileDropdown = ({ isAtTop = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { getCartCount } = useContext(ShopContext);
  const { user, logout, getUserInitials } = useUser();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Return early if no user data
  if (!user) {
    return null;
  }

  // Color scheme based on navbar position
  const iconColor = isAtTop ? COLORS.primary : COLORS.white;
  const textColor = isAtTop ? COLORS.textPrimary : COLORS.white;
  const dropdownBg = 'white';
  const dropdownBorder = isAtTop ? COLORS.primary : COLORS.gray300;

  const menuItems = [
    {
      icon: FaUser,
      label: 'My Account',
      path: '/account',
      description: 'Manage your profile'
    },
    {
      icon: FaShoppingBag,
      label: 'My Orders',
      path: '/orders',
      description: 'Track your orders'
    },
    {
      icon: FaShoppingCart,
      label: 'My Cart',
      path: '/cart',
      description: `${getCartCount()} items`,
      badge: getCartCount() > 0 ? getCartCount() : null
    },
    {
      icon: FaCog,
      label: 'Settings',
      path: '/settings',
      description: 'Account preferences'
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 hover:scale-105 transition-all duration-200 focus:outline-none group"
        title={`${user.name} - Click for menu`}
      >
        {/* Avatar Circle */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 animate-avatar-hover"
          style={{
            backgroundColor: user.avatar ? 'transparent' : GRADIENTS.primary,
            borderColor: iconColor,
            color: user.avatar ? textColor : COLORS.white,
            backgroundImage: user.avatar ? `url(${user.avatar})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!user.avatar && getUserInitials()}
        </div>

        {/* Dropdown Arrow */}
        <FaChevronDown 
          size={12} 
          style={{ color: iconColor }}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-2xl border z-50 overflow-hidden animate-dropdown-in"
          style={{
            backgroundColor: dropdownBg,
            borderColor: dropdownBorder,
            boxShadow: SHADOWS.cardOrange
          }}
        >
          {/* User Info Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center font-semibold border-2"
                style={{
                  backgroundColor: user.avatar ? 'transparent' : GRADIENTS.primary,
                  borderColor: COLORS.primary,
                  color: user.avatar ? COLORS.textPrimary : COLORS.white,
                  backgroundImage: user.avatar ? `url(${user.avatar})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!user.avatar && getUserInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 animate-menu-item group"
                onClick={() => setIsOpen(false)}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-150"
                  style={{ backgroundColor: `${COLORS.primary}15` }}
                >
                  <item.icon 
                    size={16} 
                    style={{ color: COLORS.primary }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span 
                        className="px-2 py-1 text-xs font-bold rounded-full text-white"
                        style={{ backgroundColor: COLORS.primary }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Logout Button */}
          <div className="border-t border-gray-100 p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-150 bg-red-50">
                <FaSignOutAlt size={16} />
              </div>
              <div className="flex-1 text-left">
                <span className="font-medium">Sign Out</span>
                <p className="text-sm text-red-400">
                  See you next time!
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;