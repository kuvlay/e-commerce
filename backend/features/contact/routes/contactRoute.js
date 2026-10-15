import express from "express";
import { 
  submitContactMessage, 
  getAllMessages, 
  updateMessageStatus, 
  deleteMessage, 
  getMessageStats 
} from "../controllers/contactController.js";
import adminAuth from "../../auth/middleware/adminAuth.js";

const contactRouter = express.Router();

// Public route - Submit contact message
contactRouter.post("/submit", submitContactMessage);

// Admin routes - Require admin authentication
contactRouter.get("/messages", adminAuth, getAllMessages);
contactRouter.post("/update-status", adminAuth, updateMessageStatus);
contactRouter.post("/delete", adminAuth, deleteMessage);
contactRouter.get("/stats", adminAuth, getMessageStats);

export default contactRouter;