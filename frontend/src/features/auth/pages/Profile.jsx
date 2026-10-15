import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../../../core/context/ShopContext";
import { useUser } from "../../../core/context/UserContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as profileService from "../services/profileService";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaEdit,
  FaSave,
  FaTimes,
  FaShoppingCart,
  FaHeart,
  FaCalendarAlt,
  FaShieldAlt,
  FaCog,
  FaCamera,
  FaUserCircle,
  FaMapMarkerAlt,
  FaChartLine,
  FaBell,
  FaSignOutAlt,
  FaShippingFast,
  FaBox
} from "react-icons/fa";
import AddressManager from "../components/AddressManager";
import ProfileCompletion from "../../../components/ProfileCompletion";
import { useWishlist } from "../../../core/context/WishlistContext";

const Profile = () => {
  const { user, updateProfile, logout } = useUser();
  const { cartItems, currency, cartCount, cartAmount } = useContext(ShopContext);
  const { getWishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  
  const [profileCompletion, setProfileCompletion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });

  // Load profile data from backend
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Load profile data
        const profileResponse = await profileService.getProfile();
        if (profileResponse.success && profileResponse.user) {
          setProfileData(profileResponse.user);
          setEditData({
            name: profileResponse.user.name || "",
            phone: profileResponse.user.phone || "",
            dateOfBirth: profileResponse.user.dateOfBirth ? profileResponse.user.dateOfBirth.split('T')[0] : "",
            gender: profileResponse.user.gender || "",
          });
        }

        // Load orders
        try {
          const ordersResponse = await profileService.getUserOrders();
          if (ordersResponse.success) {
            setUserOrders(ordersResponse.orders || []);
          }
        } catch (error) {
          // Orders endpoint might not exist yet, that's ok
          setUserOrders([]);
        }

        // Load profile completion
        try {
          const completionResponse = await profileService.getProfileCompletion();
          if (completionResponse.success) {
            setProfileCompletion(completionResponse);
          }
        } catch (error) {
          // Profile completion endpoint might not exist yet, that's ok
          setProfileCompletion(null);
        }

      } catch (error) {
        console.error('Failed to load profile data:', error);
        // Fallback to user context data
        setEditData({
          name: user.name || "",
          phone: user.phone || "",
          dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : "",
          gender: user.gender || "",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  const handleEdit = () => {
    if (user) {
      setEditData({
        name: user.name || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : "",
        gender: user.gender || "",
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (user) {
      setEditData({
        name: user.name || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : "",
        gender: user.gender || "",
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    const { name, phone, dateOfBirth, gender } = editData;

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    // Validate name (only letters and spaces, 2-50 characters)
    if (!/^[a-zA-Z\s]{2,50}$/.test(name.trim())) {
      toast.error("Name should contain only letters and be 2-50 characters long");
      return;
    }

    // Validate phone number if provided
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Phone number must be a valid 10-digit Indian mobile number");
      return;
    }

    try {
      setIsLoading(true);
      const result = await profileService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
      });

      if (result.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        // Update profile data
        if (result.user) {
          setProfileData(result.user);
        }
        // Also update user context
        await updateProfile({
          name: name.trim(),
          phone: phone.trim(),
          dateOfBirth: dateOfBirth || undefined,
          gender: gender || undefined,
        });
      } else {
        toast.error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error("An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    // Apply field-specific validation and formatting
    switch (field) {
      case 'phone':
        // Only allow digits and limit to 10 characters
        processedValue = value.replace(/\D/g, '').slice(0, 10);
        break;
      case 'name':
        // Only allow letters and spaces
        processedValue = value.replace(/[^a-zA-Z\s]/g, '');
        break;
      default:
        processedValue = value;
    }
    
    setEditData((prev) => ({
      ...prev,
      [field]: processedValue,
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success("Logged out successfully");
  };

  const handlePasswordReset = () => {
    // Navigate to password reset or show modal
    toast.info("Password reset email will be sent to your registered email");
    // You can implement actual password reset logic here
  };

  const handleDeleteAccount = async () => {
    const password = prompt(
      "To delete your account, please enter your password:"
    );
    
    if (!password) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including orders, addresses, and preferences."
    );
    
    if (confirmed) {
      const doubleConfirm = window.confirm(
        "This is your final warning. Deleting your account will permanently remove all your data. Click OK to proceed."
      );
      
      if (doubleConfirm) {
        try {
          setIsLoading(true);
          const response = await profileService.deleteAccount(password);
          
          if (response.success) {
            toast.success("Account deleted successfully");
            logout();
            navigate('/');
          } else {
            toast.error(response.message || "Failed to delete account");
          }
        } catch (error) {
          console.error('Account deletion error:', error);
          toast.error("Failed to delete account. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  const formatDate = (date) => {
    if (!date) return "Not provided";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaUser },
    { id: 'personal', label: 'Personal Info', icon: FaUserCircle },
    { id: 'addresses', label: 'Addresses', icon: FaMapMarkerAlt },
    { id: 'settings', label: 'Settings', icon: FaCog },
  ];

  const quickStats = [
    {
      label: "Total Orders",
      value: userOrders?.length || 0,
      icon: FaBox,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      label: "Cart Items",
      value: cartCount,
      icon: FaShoppingCart,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      label: "Wishlist",
      value: getWishlistCount || 0,
      icon: FaHeart,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    {
      label: "Cart Value",
      value: `${currency}${cartAmount}`,
      icon: FaChartLine,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors">
                    <FaCamera size={10} />
                  </button>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profileData?.name || user?.name}</h1>
                  <p className="text-gray-600">{profileData?.email || user?.email}</p>
                  <p className="text-sm text-gray-500">
                    Member since {formatDate(profileData?.createdAt || profileData?.joinDate || user?.joinDate || user?.createdAt)}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs in Header */}
              <div className="flex items-center space-x-6">
                <nav className="flex space-x-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-orange-100 text-orange-600 border border-orange-200'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="text-sm" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Main Content - Full Width */}
        <div className="w-full">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Profile Completion */}
                <ProfileCompletion />

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={index}
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          </div>
                          <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                            <Icon className={`text-xl ${stat.color}`} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Account Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Account Summary</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Account Status */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <FaShieldAlt className="text-green-500" />
                          Account Status
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Email Verified</span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              ✓ Verified
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Phone Number</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              user?.phone 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user?.phone ? '✓ Added' : '⚠ Not Added'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Profile Complete</span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {profileCompletion?.percentage || 0}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <FaCog className="text-blue-500" />
                          Quick Actions
                        </h4>
                        <div className="space-y-2">
                          <button
                            onClick={() => setActiveTab('personal')}
                            className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <FaEdit className="text-gray-500" />
                            <span className="text-sm text-gray-700">Edit Profile Information</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('addresses')}
                            className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <FaMapMarkerAlt className="text-gray-500" />
                            <span className="text-sm text-gray-700">Manage Addresses</span>
                          </button>
                          <button
                            onClick={() => navigate('/orders')}
                            className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <FaBox className="text-gray-500" />
                            <span className="text-sm text-gray-700">View Order History</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shopping Insights */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Shopping Insights</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FaBox className="text-2xl text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{userOrders?.length || 0}</p>
                        <p className="text-sm text-gray-600">Total Orders</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FaHeart className="text-2xl text-red-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{getWishlistCount() || 0}</p>
                        <p className="text-sm text-gray-600">Wishlist Items</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FaShoppingCart className="text-2xl text-orange-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{cartCount || 0}</p>
                        <p className="text-sm text-gray-600">Cart Items</p>
                      </div>
                    </div>
                    
                    {cartAmount > 0 && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Current Cart Value</p>
                            <p className="text-sm text-gray-600">Ready to checkout</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-orange-600">{currency}{cartAmount}</p>
                            <button
                              onClick={() => navigate('/cart')}
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                              View Cart →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <FaEdit />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaSave />
                        <span>{isLoading ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <FaTimes />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  {/* Profile Picture Section */}
                  <div className="mb-8 text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg mx-auto">
                      {getInitials(user.name)}
                    </div>
                    <p className="text-sm text-gray-600 mt-3">Your profile avatar</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <FaUser className="text-gray-400" />
                          <span className="text-gray-900">{user?.name || "Not provided"}</span>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FaEnvelope className="text-gray-400" />
                        <span className="text-gray-900">{user?.email}</span>
                        <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Verified
                        </span>
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter 10-digit mobile number"
                          maxLength="10"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <FaPhone className="text-gray-400" />
                          <span className="text-gray-900">{user?.phone || "Not provided"}</span>
                        </div>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editData.dateOfBirth || ''}
                          onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <FaCalendarAlt className="text-gray-400" />
                          <span className="text-gray-900">{user?.dateOfBirth ? formatDate(user.dateOfBirth) : "Not provided"}</span>
                        </div>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      {isEditing ? (
                        <select
                          value={editData.gender || ''}
                          onChange={(e) => handleInputChange("gender", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <FaUser className="text-gray-400" />
                          <span className="text-gray-900">{user?.gender || "Not provided"}</span>
                        </div>
                      )}
                    </div>

                    {/* Join Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Member Since
                      </label>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FaCalendarAlt className="text-gray-400" />
                        <span className="text-gray-900">{formatDate(user?.joinDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6">
                  <AddressManager />
                </div>
              </div>
            )}


            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Account Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FaBell className="text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">Email Notifications</p>
                          <p className="text-sm text-gray-600">Receive order updates and promotions</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Security</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600">Security settings will be available in future updates.</p>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-xl shadow-sm border border-red-200">
                  <div className="p-6 border-b border-red-200">
                    <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-900">Delete Account</p>
                        <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                      </div>
                      <button 
                        onClick={handleDeleteAccount}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Deleting...' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Recent Activity Component
const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currency } = useContext(ShopContext);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setActivities([]);
          return;
        }

        // Refactored to apiClient
        const res = await apiClient.get('/api/activity/me', {
          params: { limit: 10 },
          headers: { 'Accept': 'application/json' },
          timeout: TIMEOUTS.medium,
        });

        const result = res.data;
        if (res.status === 200 && result?.success) {
          setActivities(result.activities || []);
        } else {
          console.warn('Activity API returned success=false:', result?.message || 'Unknown error');
          setActivities([]);
        }
      } catch (error) {
        // Network errors, parsing errors, etc.
        console.warn('Activity API request failed:', error.message);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'ORDER_PLACED':
        return { icon: FaBox, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'ORDER_STATUS_CHANGED':
        return { icon: FaShippingFast, color: 'text-green-500', bg: 'bg-green-50' };
      case 'ORDER_DECLINED':
        return { icon: FaTimes, color: 'text-red-500', bg: 'bg-red-50' };
      case 'WISHLIST_ADD':
        return { icon: FaHeart, color: 'text-red-500', bg: 'bg-red-50' };
      case 'WISHLIST_REMOVE':
        return { icon: FaHeart, color: 'text-gray-500', bg: 'bg-gray-50' };
      case 'CART_ADD':
        return { icon: FaShoppingCart, color: 'text-orange-500', bg: 'bg-orange-50' };
      case 'CART_REMOVE':
        return { icon: FaShoppingCart, color: 'text-gray-500', bg: 'bg-gray-50' };
      default:
        return { icon: FaChartLine, color: 'text-gray-500', bg: 'bg-gray-50' };
    }
  };

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'ORDER_PLACED':
        return `Order placed for ${currency}${activity.meta?.grand_total || 0}`;
      case 'ORDER_STATUS_CHANGED':
        return `Order status changed from ${activity.meta?.from_status} to ${activity.meta?.to_status}`;
      case 'ORDER_DECLINED':
        return `Order declined: ${activity.meta?.reason || 'No reason provided'}`;
      case 'WISHLIST_ADD':
        return 'Added item to wishlist';
      case 'WISHLIST_REMOVE':
        return 'Removed item from wishlist';
      case 'CART_ADD':
        return 'Added item to cart';
      case 'CART_REMOVE':
        return 'Removed item from cart';
      default:
        return 'Activity recorded';
    }
  };

  const formatActivityDate = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInHours = Math.floor((now - activityDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else {
        return activityDate.toLocaleDateString();
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const { icon: Icon, color, bg } = getActivityIcon(activity.type);
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`text-sm ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{getActivityMessage(activity)}</p>
                    <p className="text-xs text-gray-500">{formatActivityDate(activity.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FaChartLine className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No recent activity</p>
            <p className="text-sm text-gray-400">Your recent orders and activities will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;