import express from "express";
import { getAllCustomers, getCustomerDetails, getCustomerOrders } from "../controllers/customerController.js";
import adminAuth from "../../auth/middleware/adminAuth.js";

const customerRouter = express.Router();

// Get all customers with statistics (admin only)
customerRouter.get("/list", adminAuth, getAllCustomers);

// Get specific customer orders (admin only)
customerRouter.get("/:customerId/orders", adminAuth, getCustomerOrders);

// Get specific customer details (admin only)
customerRouter.get("/:customerId", adminAuth, getCustomerDetails);

export default customerRouter;