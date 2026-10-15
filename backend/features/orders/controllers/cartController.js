import userModel from "../../auth/models/userModel.js";
import { logActivity } from "../utils/activityLogger.js";

//ADD PRODUCT TO USER CART
export const addToCart = async (req, res) => {
  try {
    const { userId, itemId, size } = req.body;

    const userData = await userModel.findById(userId);
    const cartData = await userData.cartData;

    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
      } else {
        cartData[itemId][size] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }

    await userModel.findByIdAndUpdate(userId, { cartData });

    // Log activity
    await logActivity(userId, 'CART_ADD', {
      product_id: itemId,
      size: size,
      quantity: cartData[itemId][size]
    });

    res.json({ success: true, message: "Added to cart" });
  } catch (e) {
    res.json({ success: false, message: "Failed to add to cart" });
  }
};

//UPDATE  USER CART
export const updateCart = async (req, res) => {
  try {
    const { userId, itemId, size, quantity } = req.body;
    const userData = await userModel.findById(userId);
    const cartData = await userData.cartData;

    const oldQuantity = cartData[itemId][size];
    cartData[itemId][size] = quantity;

    await userModel.findByIdAndUpdate(userId, { cartData });

    // Log activity based on quantity change
    if (quantity === 0) {
      await logActivity(userId, 'CART_REMOVE', {
        product_id: itemId,
        size: size,
        removed_quantity: oldQuantity
      });
    } else if (quantity > oldQuantity) {
      await logActivity(userId, 'CART_ADD', {
        product_id: itemId,
        size: size,
        added_quantity: quantity - oldQuantity,
        total_quantity: quantity
      });
    } else {
      await logActivity(userId, 'CART_REMOVE', {
        product_id: itemId,
        size: size,
        removed_quantity: oldQuantity - quantity,
        remaining_quantity: quantity
      });
    }

    res.json({ success: true, message: "Cart updated" });
  } catch (e) {
    res.json({ success: false, message: "Failed to update cart" });
  }
};

//GET USER CART
export const getUserCart = async (req, res) => {
  try {
    const { userId } = req.body;

    const userData = await userModel.findById(userId);
    const cartData = await userData.cartData;

    res.json({ success: true, cartData });
  } catch (e) {
    res.json({ success: false, message: "Failed to get cart data" });
  }
};
