import userModel from "../../auth/models/userModel.js";

// Helper function to ensure only one default address per user
const ensureOnlyOneDefault = (user) => {
  const defaultAddresses = user.addresses.filter(addr => addr.isDefault);
  
  if (defaultAddresses.length > 1) {
    // Fix multiple defaults by keeping only the first one
    console.log(`⚠️ Found ${defaultAddresses.length} default addresses for user ${user._id}, fixing...`);
    user.addresses.forEach((addr, index) => {
      addr.isDefault = index === user.addresses.findIndex(a => a.isDefault);
    });
  } else if (defaultAddresses.length === 0 && user.addresses.length > 0) {
    // No default but addresses exist, make first one default
    console.log(`⚠️ No default address found for user ${user._id}, setting first address as default`);
    user.addresses[0].isDefault = true;
  }
  
  return user;
};

// Add new address
export const addAddress = async (req, res) => {
  try {
    const { userId } = req.body;
    const { type, name, fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Initialize addresses array if it doesn't exist
    if (!user.addresses) {
      user.addresses = [];
    }

    // Validate required fields
    if (!name || !fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.json({ success: false, message: "All required address fields must be provided" });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // Create new address
    const newAddress = {
      _id: new Date().getTime().toString(), // Simple ID generation
      type: type || 'home',
      name,
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state,
      pincode,
      isDefault: isDefault || user.addresses.length === 0 // First address is default
    };

    user.addresses.push(newAddress);
    
    // Ensure data consistency
    ensureOnlyOneDefault(user);
    
    await user.save();
    
    console.log(`✅ Address added for user ${userId}. Default: ${newAddress.isDefault}`);

    res.json({ 
      success: true, 
      message: "Address added successfully",
      addresses: user.addresses 
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.json({ success: false, message: "Failed to add address" });
  }
};

// Update address
export const updateAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.body;
    const { type, name, fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id === addressId);
    if (addressIndex === -1) {
      return res.json({ success: false, message: "Address not found" });
    }

    // Validate required fields
    if (!name || !fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.json({ success: false, message: "All required address fields must be provided" });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // Update address
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex],
      type: type || 'home',
      name,
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state,
      pincode,
      isDefault: isDefault || false
    };
    
    // Ensure data consistency
    ensureOnlyOneDefault(user);

    await user.save();
    
    console.log(`✅ Address updated for user ${userId}. Address ID: ${addressId}`);

    res.json({ 
      success: true, 
      message: "Address updated successfully",
      addresses: user.addresses 
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.json({ success: false, message: "Failed to update address" });
  }
};

// Delete address
export const deleteAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id === addressId);
    if (addressIndex === -1) {
      return res.json({ success: false, message: "Address not found" });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    const addressName = user.addresses[addressIndex].name;
    
    // Prevent deletion if it's the only address and user has orders
    if (user.addresses.length === 1) {
      console.log(`⚠️ Attempting to delete the only address for user ${userId}`);
    }
    
    user.addresses.splice(addressIndex, 1);

    // If deleted address was default, make first remaining address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
      console.log(`✅ Deleted default address '${addressName}', promoted '${user.addresses[0].name}' to default`);
    }
    
    // Ensure data consistency
    ensureOnlyOneDefault(user);

    await user.save();
    
    console.log(`✅ Address deleted for user ${userId}. Remaining addresses: ${user.addresses.length}`);

    res.json({ 
      success: true, 
      message: "Address deleted successfully",
      addresses: user.addresses 
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.json({ success: false, message: "Failed to delete address" });
  }
};

// List addresses
export const listAddresses = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ 
      success: true, 
      addresses: user.addresses || [] 
    });
  } catch (error) {
    console.error('List addresses error:', error);
    res.json({ success: false, message: "Failed to fetch addresses" });
  }
};

// Set default address
export const setDefaultAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id === addressId);
    if (addressIndex === -1) {
      return res.json({ success: false, message: "Address not found" });
    }

    // Check if address is already default
    if (user.addresses[addressIndex].isDefault) {
      return res.json({ 
        success: true, 
        message: "Address is already set as default",
        addresses: user.addresses 
      });
    }

    // Unset all defaults and set new default
    user.addresses.forEach(addr => addr.isDefault = false);
    user.addresses[addressIndex].isDefault = true;
    
    // Ensure data consistency
    ensureOnlyOneDefault(user);

    await user.save();
    
    console.log(`✅ Default address changed for user ${userId} to '${user.addresses[addressIndex].name}'`);

    res.json({ 
      success: true, 
      message: "Default address updated successfully",
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.json({ success: false, message: "Failed to set default address" });
  }
};

// Get user addresses (alias for listAddresses)
export const getUserAddresses = listAddresses;

// Get default address
export const getDefaultAddress = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const defaultAddress = user.addresses?.find(addr => addr.isDefault);

    res.json({ 
      success: true, 
      address: defaultAddress || null 
    });
  } catch (error) {
    console.error('Get default address error:', error);
    res.json({ success: false, message: "Failed to get default address" });
  }
};