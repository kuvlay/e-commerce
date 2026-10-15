import express from "express";
import { 
  getUserAddresses, 
  addAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress, 
  getDefaultAddress 
} from "../controllers/addressController.js";
import authUser from "../../auth/middleware/auth.js";

const addressRouter = express.Router();

// Get all addresses for user
addressRouter.get("/list", authUser, getUserAddresses);

// Add new address
addressRouter.post("/add", authUser, addAddress);

// Update address
addressRouter.post("/update", authUser, updateAddress);

// Delete address
addressRouter.post("/delete", authUser, deleteAddress);

// Set default address
addressRouter.post("/set-default", authUser, setDefaultAddress);

// Get default address
addressRouter.get("/default", authUser, getDefaultAddress);

export default addressRouter;