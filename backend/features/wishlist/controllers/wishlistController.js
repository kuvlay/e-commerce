import userModel from "../../auth/models/userModel.js";
import { logActivity } from "../../orders/utils/activityLogger.js";

// Get user wishlist
const getWishlist = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ 
      success: true, 
      wishlist: user.wishlist || [] 
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Add item to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    if (user.wishlist.includes(productId)) {
      return res.json({ success: false, message: "Item already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    // Log activity
    await logActivity(userId, 'WISHLIST_ADD', {
      product_id: productId
    });

    res.json({ 
      success: true, 
      message: "Item added to wishlist",
      wishlist: user.wishlist 
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Remove item from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    user.wishlist = user.wishlist.filter(id => id !== productId);
    await user.save();

    // Log activity
    await logActivity(userId, 'WISHLIST_REMOVE', {
      product_id: productId
    });

    res.json({ 
      success: true, 
      message: "Item removed from wishlist",
      wishlist: user.wishlist 
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { getWishlist, addToWishlist, removeFromWishlist };