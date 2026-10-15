import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaLock, FaEye, FaEyeSlash, FaTrash, FaShield } from 'react-icons/fa';
import { ShopContext } from '../context/ShopContext';
import { useUser } from '../context/UserContext';
import { COLORS, SHADOWS } from '../constants/theme';
import Title from '../components/Title';
import { toast } from 'react-toastify';
import apiClient, { TIMEOUTS } from '../../../core/utils/apiClient';

const Settings = () => {
  const navigate = useNavigate();
  const { user, updatePreferences, changePassword, deleteAccount, loading } = useUser();
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      orderUpdates: true,
      promotions: false,
      newsletter: true,
      sms: false
    },
    privacy: {
      profileVisibility: 'private',
      dataSharing: false,
      analytics: true
    }
  });

  // Initialize settings from user data
  useEffect(() => {
    if (user?.preferences) {
      setSettings(user.preferences);
    }
  }, [user]);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleSettingChange = async (category, setting, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value
      }
    };
    
    setSettings(newSettings);
    
    // Save notification preferences to backend
    if (category === 'notifications') {
      try {
        // const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/profile/notifications/update`, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${localStorage.getItem('token')}`
        //   },
        //   body: JSON.stringify({
        //     preferences: newSettings
        //   })
        // });

        const { data: result } = await apiClient.post('/api/profile/notifications/update', { preferences: newSettings }, {
          timeout: TIMEOUTS.medium,
        });

        // const result = await response.json();
        if (result.success) {
          toast.success('Notification preferences updated!');
        } else {
          toast.error('Failed to update preferences');
        }
      } catch (error) {
        console.error('Failed to update notification preferences:', error);
        toast.error('Failed to update preferences');
      }
    } else {
      // Save other preferences using existing method
      await updatePreferences(newSettings);
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long!');
      return;
    }

    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    
    if (result.success) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  const handleDeleteAccount = async () => {
    const password = prompt('Please enter your password to confirm account deletion:');
    
    if (!password) {
      return; // User cancelled
    }
    
    if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      const result = await deleteAccount(password);
      
      if (result.success) {
        navigate('/');
      }
    }
  };

  const SettingCard = ({ title, description, children }) => (
    <div 
      className="bg-white rounded-xl p-6 shadow-lg border"
      style={{ 
        borderColor: COLORS.primary + '20',
        boxShadow: SHADOWS.cardOrange 
      }}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {children}
    </div>
  );

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
          enabled ? 'bg-orange-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  // Return loading state or redirect if no user
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Title text1="Account" text2="Settings" />
          <p className="text-gray-600 mt-2">Manage your preferences and security settings</p>
        </div>

        <div className="space-y-8">
          {/* Notification Settings */}
          <SettingCard
            title="Notifications"
            description="Choose what notifications you want to receive"
          >
            <div className="space-y-1">
              <ToggleSwitch
                enabled={settings.notifications.orderUpdates}
                onChange={(value) => handleSettingChange('notifications', 'orderUpdates', value)}
                label="Order Updates"
                description="Get notified about your order status"
              />
              <ToggleSwitch
                enabled={settings.notifications.promotions}
                onChange={(value) => handleSettingChange('notifications', 'promotions', value)}
                label="Promotions & Offers"
                description="Receive special deals and discounts"
              />
              <ToggleSwitch
                enabled={settings.notifications.newsletter}
                onChange={(value) => handleSettingChange('notifications', 'newsletter', value)}
                label="Newsletter"
                description="Weekly updates and new arrivals"
              />
              <ToggleSwitch
                enabled={settings.notifications.sms}
                onChange={(value) => handleSettingChange('notifications', 'sms', value)}
                label="SMS Notifications"
                description="Receive text messages for important updates"
              />
            </div>
          </SettingCard>

          {/* Privacy Settings */}
          <SettingCard
            title="Privacy & Data"
            description="Control your privacy and data sharing preferences"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Visibility
                </label>
                <select
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ 
                    focusRingColor: COLORS.primary + '50',
                    focusBorderColor: COLORS.primary 
                  }}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                </select>
              </div>
              
              <ToggleSwitch
                enabled={settings.privacy.dataSharing}
                onChange={(value) => handleSettingChange('privacy', 'dataSharing', value)}
                label="Data Sharing"
                description="Allow sharing anonymized data for product improvements"
              />
              
              <ToggleSwitch
                enabled={settings.privacy.analytics}
                onChange={(value) => handleSettingChange('privacy', 'analytics', value)}
                label="Analytics"
                description="Help us improve by sharing usage analytics"
              />
            </div>
          </SettingCard>

          {/* Security Settings */}
          <SettingCard
            title="Security"
            description="Manage your password and security preferences"
          >
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ 
                      focusRingColor: COLORS.primary + '50',
                      focusBorderColor: COLORS.primary 
                    }}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ 
                      focusRingColor: COLORS.primary + '50',
                      focusBorderColor: COLORS.primary 
                    }}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ 
                      focusRingColor: COLORS.primary + '50',
                      focusBorderColor: COLORS.primary 
                    }}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-colors duration-200"
                style={{ backgroundColor: COLORS.primary }}
              >
                <FaLock size={14} />
                Update Password
              </button>
            </form>
          </SettingCard>

          {/* Danger Zone */}
          <SettingCard
            title="Danger Zone"
            description="Irreversible and destructive actions"
          >
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-start gap-3">
                <FaTrash className="text-red-500 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 mb-1">Delete Account</h4>
                  <p className="text-sm text-red-700 mb-3">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </SettingCard>
        </div>
      </div>
    </div>
  );
};

export default Settings;