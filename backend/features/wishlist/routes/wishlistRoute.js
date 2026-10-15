import express from "express";
import { getWishlist, addToWishlist, removeFromWishlist } from "../controllers/wishlistController.js";
import authUser from "../../auth/middleware/auth.js";

const wishlistRouter = express.Router();

// Get user wishlist
wishlistRouter.get("/get", authUser, getWishlist);

// Add item to wishlist
wishlistRouter.post("/add", authUser, addToWishlist);

// Remove item from wishlist
wishlistRouter.post("/remove", authUser, removeFromWishlist);

export default wishlistRouter;