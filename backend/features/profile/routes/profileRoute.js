import express from "express";
import { 
  getProfileCompletion, 
  getFullProfile, 
  updateProfile,
  getNotificationPreferences,
  updateNotificationPreferences
} from "../controllers/profileController.js";
import authUser from "../../auth/middleware/auth.js";

const profileRouter = express.Router();

// Get profile completion status
profileRouter.get("/completion", authUser, getProfileCompletion);
profileRouter.post("/completion", authUser, getProfileCompletion);

// Get full profile with all details
profileRouter.get("/full", authUser, getFullProfile);
profileRouter.post("/full", authUser, getFullProfile);

// Update profile
profileRouter.post("/update", authUser, updateProfile);

// Notification preferences
profileRouter.get("/notifications", authUser, getNotificationPreferences);
profileRouter.post("/notifications", authUser, getNotificationPreferences);
profileRouter.post("/notifications/update", authUser, updateNotificationPreferences);

export default profileRouter;