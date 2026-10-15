import express from "express";
import {
  allOrders,
  placeOrder,
  placeOrderRazorpay,
  updateStatus,
  userOrders
} from "../controllers/orderController.js";
import adminAuth from "../../auth/middleware/adminAuth.js";
import authUser from "../../auth/middleware/auth.js";
import { v4 as uuidv4 } from "uuid";

const orderRouter = express.Router();

// Enhanced logging middleware for order routes
const orderLoggingMiddleware = (req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  
  console.log(`📦 Order request [${requestId}]:`, {
    requestId,
    method: req.method,
    path: req.path,
    adminId: req.adminId,
    userId: req.userId,
    orderId: req.params.orderId,
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
  
  // Set response headers
  res.set('Cache-Control', 'no-store');
  
  next();
};

//ADMIN FEATURES
orderRouter.post("/list", adminAuth, orderLoggingMiddleware, allOrders);
orderRouter.post("/status", adminAuth, orderLoggingMiddleware, updateStatus);

//PAYMENT FEATURES
orderRouter.post("/place", authUser, placeOrder);
orderRouter.post("/razorpay", authUser, placeOrderRazorpay);

//USER FEATURES
orderRouter.post("/userorders", authUser, userOrders);

export default orderRouter;
