import express from "express";
import {
  adminLogin,
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  verifyJWTToken,
  verifyEmail,
  resetPassword,
  requestPasswordReset,
} from "../controllers/userController.js";
import emailValidationMiddleware from "../middleware/emailValidationMiddleware.js";
import { loginWithGoogle } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", emailValidationMiddleware, registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/verify-email", verifyEmail); // Updated to use query parameter instead of path parameter
userRouter.post("/admin", adminLogin);
userRouter.post("/login/google", loginWithGoogle);

// Password reset routes
userRouter.post("/forgot-password", requestPasswordReset); // Updated to use our new implementation
userRouter.post("/reset-password", resetPassword);

// Protected routes (require authentication)
userRouter.post("/profile", verifyJWTToken, getUserProfile);
userRouter.get("/profile", verifyJWTToken, getUserProfile);
userRouter.post("/profile/update", verifyJWTToken, updateUserProfile);

export default userRouter;