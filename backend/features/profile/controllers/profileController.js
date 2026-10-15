import userModel from "../../auth/models/userModel.js";

// Get profile completion status
export const getProfileCompletion = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await userModel.findById(userId).select('-password');
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Calculate profile completion
    const fields = {
      name: !!user.name,
      email: !!user.email,
      phone: !!user.phone,
      dateOfBirth: !!user.dateOfBirth,
      gender: !!user.gender,
      preferences: !!(user.preferences && Object.keys(user.preferences).length > 0),
      addresses: !!(user.addresses && user.addresses.length > 0)
    };

    const completedFields = Object.values(fields).filter(Boolean).length;
    const totalFields = Object.keys(fields).length;
    const percentage = Math.round((completedFields / totalFields) * 100);

    res.json({ 
      success: true, 
      profileCompletion: {
        percentage,
        completedFields,
        totalFields,
        missingFields: Object.fromEntries(
          Object.entries(fields).map(([key, value]) => [key, !value])
        )
      }
    });
  } catch (error) {
    console.error('Get profile completion error:', error);
    res.json({ success: false, message: "Failed to get profile completion" });
  }
};

// Get user profile with all details
export const getFullProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await userModel.findById(userId).select('-password');
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Calculate profile completion
    const fields = {
      name: !!user.name,
      email: !!user.email,
      phone: !!user.phone,
      dateOfBirth: !!user.dateOfBirth,
      gender: !!user.gender,
      preferences: !!(user.preferences && Object.keys(user.preferences).length > 0),
      addresses: !!(user.addresses && user.addresses.length > 0)
    };

    const completedFields = Object.values(fields).filter(Boolean).length;
    const totalFields = Object.keys(fields).length;
    const percentage = Math.round((completedFields / totalFields) * 100);

    res.json({ 
      success: true, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || null,
        gender: user.gender || '',
        avatar: user.avatar || '',
        preferences: user.preferences || {},
        addresses: user.addresses || [],
        wishlist: user.wishlist || [],
        cartData: user.cartData || {},
        joinDate: user.joinDate || user.createdAt || new Date(),
        profileCompletion: {
          percentage,
          completedFields,
          totalFields,
          missingFields: Object.fromEntries(
            Object.entries(fields).map(([key, value]) => [key, !value])
          )
        }
      }
    });
  } catch (error) {
    console.error('Get full profile error:', error);
    res.json({ success: false, message: "Failed to get profile" });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, dateOfBirth, gender } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updateData.gender = gender;

    const user = await userModel.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true }
    ).select('-password');

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ 
      success: true, 
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || null,
        gender: user.gender || '',
        avatar: user.avatar || '',
        preferences: user.preferences || {},
        addresses: user.addresses || [],
        wishlist: user.wishlist || [],
        cartData: user.cartData || {},
        joinDate: user.joinDate || user.createdAt || new Date()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.json({ success: false, message: "Error updating profile" });
  }
};

// Get notification preferences
export const getNotificationPreferences = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await userModel.findById(userId).select('preferences');
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const defaultPreferences = {
      notifications: true,
      newsletter: false,
      theme: 'light'
    };

    res.json({ 
      success: true, 
      preferences: user.preferences || defaultPreferences
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.json({ success: false, message: "Failed to get preferences" });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Merge with existing preferences
    const updatedPreferences = {
      ...user.preferences,
      ...preferences
    };

    await userModel.findByIdAndUpdate(userId, { 
      preferences: updatedPreferences 
    });

    res.json({ 
      success: true, 
      message: "Notification preferences updated successfully",
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.json({ success: false, message: "Failed to update preferences" });
  }
};