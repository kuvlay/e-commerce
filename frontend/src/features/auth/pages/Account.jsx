import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaCamera } from 'react-icons/fa';
import { ShopContext } from '../context/ShopContext';
import { useUser } from '../context/UserContext';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/theme';
import Title from '../components/Title';

const Account = () => {
  const navigate = useNavigate();
  const { user, updateProfile, uploadAvatar, loading, getUserInitials, getJoinDate } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Initialize edit data when user data loads
  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || ''
      });
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    if (user) {
      setEditData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || ''
      });
    }
  };

  const handleSave = async () => {
    const result = await updateProfile(editData);
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || ''
      });
    }
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Return loading state or redirect if no user
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen py-8" style={{ background: GRADIENTS.backgroundGradient }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div 
            className="inline-block px-6 py-3 rounded-full text-sm font-semibold mb-6 text-white"
            style={{ background: GRADIENTS.secondary, boxShadow: SHADOWS.cardOrange }}
          >
            User Profile
          </div>
          <Title text1="My" text2="Account" />
          <p className="mt-4 text-xl" style={{ color: COLORS.textSecondary }}>
            Manage your profile and account settings
          </p>
          <div className="w-24 h-1 mx-auto mt-6 rounded-full" style={{ background: GRADIENTS.secondary }}></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div 
              className="bg-white rounded-xl p-6 shadow-lg border"
              style={{ 
                borderColor: COLORS.primary + '20',
                boxShadow: SHADOWS.cardOrange 
              }}
            >
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div 
                    className="w-24 h-24 rounded-full mx-auto flex items-center justify-center font-bold text-xl border-4 mb-4"
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
                  
                  {/* Avatar Upload Button */}
                  <label className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <FaCamera size={14} style={{ color: COLORS.primary }} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                <p className="text-gray-500">{user.email}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Member since {getJoinDate()}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-gray-700 font-medium"
                >
                  View Orders
                </button>
                <button
                  onClick={() => {
                    // Open cart drawer instead of navigating to cart page
                    const cartButton = document.querySelector('[title="Cart"]');
                    if (cartButton) cartButton.click();
                  }}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-gray-700 font-medium"
                >
                  View Cart
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-gray-700 font-medium"
                >
                  Account Settings
                </button>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div 
              className="bg-white rounded-xl p-6 shadow-lg border"
              style={{ 
                borderColor: COLORS.primary + '20',
                boxShadow: SHADOWS.cardOrange 
              }}
            >
              {/* Header with Edit Button */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                    style={{ 
                      backgroundColor: COLORS.primary + '10',
                      color: COLORS.primary 
                    }}
                  >
                    <FaEdit size={14} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 font-medium"
                    >
                      <FaSave size={14} />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                    >
                      <FaTimes size={14} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaUser size={14} style={{ color: COLORS.primary }} />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={{ 
                        focusRingColor: COLORS.primary + '50',
                        focusBorderColor: COLORS.primary 
                      }}
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaEnvelope size={14} style={{ color: COLORS.primary }} />
                    Email Address
                  </label>
                  <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaPhone size={14} style={{ color: COLORS.primary }} />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={{ 
                        focusRingColor: COLORS.primary + '50',
                        focusBorderColor: COLORS.primary 
                      }}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {user.phone || 'No phone number provided'}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaMapMarkerAlt size={14} style={{ color: COLORS.primary }} />
                    Address
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 resize-none"
                      style={{ 
                        focusRingColor: COLORS.primary + '50',
                        focusBorderColor: COLORS.primary 
                      }}
                      placeholder="Enter your address"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {user.address || 'No address provided'}
                    </p>
                  )}
                </div>

                {/* Date of Birth - New Field */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaUser size={14} style={{ color: COLORS.primary }} />
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.dateOfBirth || ''}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={{ 
                        focusRingColor: COLORS.primary + '50',
                        focusBorderColor: COLORS.primary 
                      }}
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Gender - New Field */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaUser size={14} style={{ color: COLORS.primary }} />
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.gender || ''}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={{ 
                        focusRingColor: COLORS.primary + '50',
                        focusBorderColor: COLORS.primary 
                      }}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 capitalize">
                      {user.gender || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;