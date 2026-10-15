//change logo and add some fading animations

import React, {useEffect, useRef, useState, useContext} from 'react'
import { 
  FaUserPlus, 
  FaSignInAlt, 
  FaShoppingCart, 
  FaSearch, 
  FaSignOutAlt, 
  FaUser, 
  FaUserCircle,
  FaChevronDown,
  FaBox,
  FaHeart
} from "react-icons/fa";
import {TiLocationArrow} from "react-icons/ti";
import {useWindowScroll} from "react-use";
import {useGSAP} from "@gsap/react";
import gsap from 'gsap';
import logo from '../../assets/logo.png';
import { ShopContext } from '../../core/context/ShopContext';
import { Link, useNavigate } from 'react-router-dom';
import { useCartAnimations } from '../../features/cart/hooks/useCartAnimations.js';
import CartDrawer from '../../features/cart/components/CartDrawer.jsx';
import WishlistDrawer from '../../features/wishlist/components/WishlistDrawer.jsx';
import { toast } from 'react-toastify';
import { COLORS, GRADIENTS, SHADOWS } from '../../core/constants/theme';
import { useUser } from '../../core/context/UserContext';
import { useWishlist } from '../../core/context/WishlistContext';

// Replace navItems array with objects containing name and path
const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Shop', path: '/collection' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];


const Navbar = () => {

    const navContainerRef = useRef(null);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isNavVisible, setIsNavVisible] = useState(true);
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
    const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);
    
    // Search functionality states - using context showSearch instead of local state
    const searchInputRef = useRef(null);
    
    // User profile dropdown state
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const profileDropdownRef = useRef(null);

    // Auth state from context
    const { token, setToken, getCartCount, registerCartAnimation, setSearch, search, showSearch, setShowSearch } = useContext(ShopContext);
    const { logout, user } = useUser();
    const { getWishlistCount } = useWishlist();
    const navigate = useNavigate();
    const isLoggedIn = Boolean(token);
    
    // Cart animations
    const { cartIconRef, animateCartAdd, animateCartCountChange } = useCartAnimations();
    const cartCountRef = useRef(null);
    const prevCartCount = useRef(getCartCount);

    // Register cart animation callback
    useEffect(() => {
        registerCartAnimation('cartAdd', animateCartAdd);
    }, [registerCartAnimation, animateCartAdd]);

    // Logout function
    const handleLogout = () => {
        setIsProfileDropdownOpen(false);
        logout(); // Use UserContext logout which handles cache clearing and refresh
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Animate cart count changes
    useEffect(() => {
        const currentCartCount = getCartCount;
        if (currentCartCount !== prevCartCount.current && prevCartCount.current !== null) {
            if (cartCountRef.current) {
                animateCartCountChange(cartCountRef.current, prevCartCount.current, currentCartCount);
            }
        }
        prevCartCount.current = currentCartCount;
    }, [getCartCount, animateCartCountChange]);

    const { y: currentScrollY} = useWindowScroll();

    // Add a state to track if navbar is at top
    const isAtTop = currentScrollY === 0;

    useEffect(()=>{
        if (!navContainerRef.current) return;

        if(currentScrollY === 0){
            // At top - show navbar and remove floating style
            setIsNavVisible(true);
            navContainerRef.current.classList.remove("floating-nav");
        }
        else if(currentScrollY > lastScrollY && currentScrollY > 100){
            // Scrolling down and past threshold - hide navbar
            setIsNavVisible(false);
            navContainerRef.current.classList.add("floating-nav");
        }
        else if(currentScrollY < lastScrollY && currentScrollY > 100){
            // Scrolling up and past threshold - show navbar with floating style
            setIsNavVisible(true);
            navContainerRef.current.classList.add("floating-nav");
        }

        setLastScrollY(currentScrollY);
    },[currentScrollY, lastScrollY]);

    useEffect(()=>{
        gsap.to(navContainerRef.current,{
            y: isNavVisible?0:-100,
            opacity: isNavVisible?1:0,
            duration: 0.2,
        })
    },[isNavVisible])

    // Handle search functionality
    const handleSearchClick = () => {
        setShowSearch(true);
        setTimeout(() => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, 300);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        
        // Update search immediately for UI feedback
        setSearch(value);
        
        // NO NAVIGATION HERE - only update search state
    };

    const handleSearchBlur = () => {
        if (search === '') {
            setShowSearch(false);
        }
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter' && search.length > 0) {
            if (window.location.pathname !== '/collection') {
                navigate('/collection');
            }
            // Scroll to "All Products" section
            setTimeout(() => {
                const allProductsSection = document.querySelector('[data-section="all-products"]');
                if (allProductsSection) {
                    allProductsSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }
            }, 200);
        }
    };



    // Premium orange color logic for nav items and icons:
    const navColorClass = isAtTop ? 'hover:after:bg-primary-500' : 'text-white hover:after:bg-white';
    const iconColorClass = isAtTop ? '' : 'text-white';
    const navTextColor = isAtTop ? COLORS.textPrimary : COLORS.white;
    const navIconColor = isAtTop ? COLORS.primary : COLORS.white;

    return (
        <>
            <div className="fixed inset-x-0 top-4 z-50 h-16 border-none transition-all duration-700 sm:inset-x-6 ">
                <header className="absolute top-1/2 w-full  -translate-y-1/2">
                    <nav
                        ref={navContainerRef}
                        className={`justify-between flex size-full items-center p-4 transition-all duration-500 ${isAtTop ? '' : 'floating-nav'}`}
                    >
                        {/* Left: Logo */}
                        <div className="flex items-center gap-7">
                            <img src={logo} alt="Kharido"
                                 className="w-16 transition-all duration-300"/>
                        </div>
                        {/* Center: Nav Items */}
                        <div className="flex-1 flex justify-center">
                            <div className="flex gap-8">
                                {navItems.map((item) => (
                                    <Link 
                                        key={item.name} 
                                        to={item.path} 
                                        className={`nav-hover-btn ${navColorClass} font-semibold`}
                                        style={{color: navTextColor}}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        {/* Right: Icons */}
                        <div className={`flex h-full items-center gap-6 ${iconColorClass}`} style={{color: navIconColor}}>
                            {/* Search Bar / Icon */}
                            <div className="relative flex items-center">
                                {/* Search Input - Animated */}
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={search}
                                    onChange={handleSearchChange}
                                    onBlur={handleSearchBlur}
                                    onKeyPress={handleSearchKeyPress}
                                    placeholder="Search products..."
                                    className={`absolute right-0 top-1/2 transform -translate-y-1/2 transition-all duration-300 ease-in-out rounded-full px-4 py-2 text-sm font-medium border-2 ${
                                        showSearch 
                                            ? 'w-64 opacity-100 pointer-events-auto' 
                                            : 'w-0 opacity-0 pointer-events-none'
                                    }`}
                                    style={{
                                        borderColor: isAtTop ? COLORS.primary : COLORS.white,
                                        backgroundColor: 'white',
                                        color: COLORS.textPrimary,
                                        boxShadow: showSearch ? SHADOWS.cardOrange : 'none'
                                    }}
                                />
                                
                                {/* Search Icon */}
                                <button 
                                    onClick={handleSearchClick}
                                    title="Search" 
                                    className={`relative z-10 hover:scale-110 transition-all duration-300 ${
                                        showSearch ? 'opacity-0 pointer-events-none' : 'opacity-100'
                                    }`}
                                >
                                    <FaSearch size={22} />
                                </button>
                            </div>

                            {/* Authentication Icons */}
                            {isLoggedIn ? (
                                <div className="relative" ref={profileDropdownRef}>
                                    <button 
                                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                        title="User Profile" 
                                        className="flex items-center gap-2 hover:scale-110 transition-transform duration-200"
                                    >
                                        <FaUserCircle size={24} />
                                        <FaChevronDown 
                                            size={12} 
                                            className={`transition-transform duration-200 ${
                                                isProfileDropdownOpen ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>

                                    {/* Profile Dropdown */}
                                    {isProfileDropdownOpen && (
                                        <div 
                                            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50"
                                            style={{ boxShadow: SHADOWS.cardOrange }}
                                        >
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm font-medium text-gray-800">
                                                    {user?.name ? `Hi, ${user.name.split(' ')[0]}!` : 'Welcome back!'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {user?.email || 'Manage your account'}
                                                </p>
                                            </div>
                                            
                                            <div className="py-1">
                                                <button
                                                    onClick={() => {
                                                        navigate('/orders');
                                                        setIsProfileDropdownOpen(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-3"
                                                >
                                                    <FaBox size={14} />
                                                    Track Orders
                                                </button>
                                                
                                                <button
                                                    onClick={() => {
                                                        setIsWishlistDrawerOpen(true);
                                                        setIsProfileDropdownOpen(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-3"
                                                >
                                                    <FaHeart size={14} />
                                                    <span>Wishlist</span>
                                                    {getWishlistCount() > 0 && (
                                                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                                            {getWishlistCount()}
                                                        </span>
                                                    )}
                                                </button>
                                                
                                                <button
                                                    onClick={() => {
                                                        navigate('/profile');
                                                        setIsProfileDropdownOpen(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-3"
                                                >
                                                    <FaUser size={14} />
                                                    View Profile
                                                </button>
                                            </div>
                                            
                                            <div className="border-t border-gray-100 pt-1">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                                                >
                                                    <FaSignOutAlt size={14} />
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link to="/login" title="Login / Sign Up" className="hover:scale-110 transition-transform duration-200">
                                    <FaUser size={22} />
                                </Link>
                            )}

                            {/* Cart Icon */}
                            <button 
                                onClick={() => setIsCartDrawerOpen(true)} 
                                title="Cart" 
                                className="relative hover:scale-110 transition-transform duration-200"
                            >
                                <div ref={cartIconRef} className="relative">
                                    <FaShoppingCart size={22} />
                                    {getCartCount > 0 && (
                                        <span 
                                            ref={cartCountRef}
                                            className="absolute -top-2 -right-2 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse"
                                            style={{
                                                background: GRADIENTS.primary,
                                                boxShadow: SHADOWS.cardOrange
                                            }}
                                        >
                                            {getCartCount}
                                        </span>
                                    )}
                                </div>
                            </button>
                        </div>
                    </nav>
                </header>
            </div>
            
            {/* Cart Drawer */}
            <CartDrawer 
                isOpen={isCartDrawerOpen} 
                onClose={() => setIsCartDrawerOpen(false)} 
            />
            
            {/* Wishlist Drawer */}
            <WishlistDrawer 
                isOpen={isWishlistDrawerOpen} 
                onClose={() => setIsWishlistDrawerOpen(false)} 
            />
        </>
    )
}
export default Navbar
