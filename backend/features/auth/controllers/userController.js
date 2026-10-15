import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import userModel from "../models/userModel.js";
import { updateEmailValidationMetrics, updateSignupProtectionMetrics, updateBotDetectionMetrics } from "../../../core/middleware/security/arcjetEnhancements.js";
import { 
  generateVerificationToken, 
  generatePasswordResetToken, 
  verifyToken, 
  sendVerificationEmail, 
  sendPasswordResetEmail 
} from "../services/emailService.js";
import { 
  validateEmailExistence, 
  registerWithEmailVerification,
  verifyUserEmail
} from "../services/emailVerificationService.js";
import { OAuth2Client } from "google-auth-library";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

//Route for user login with email verification check
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User does not exist" });
    }

    // Check if email is verified
    if (!user.isEmailVerified && process.env.SKIP_EMAIL_VERIFICATION !== 'true') {
      return res.status(403).json({ 
        success: false, 
        message: "Please verify your email before logging in",
        requiresVerification: true
      });
    }

    // Check if account is active
    if (user.accountStatus !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: "Your account is not active. Please contact support."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      const token = createToken(user._id);
      res.json({ success: true, token });
    } else {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

//Route for user register with enhanced email verification
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Update metrics from middleware analysis
    if (req.emailValidation) {
      updateEmailValidationMetrics(req.emailValidation);
    }
    
    if (req.signupAnalysis) {
      updateSignupProtectionMetrics(req.signupAnalysis);
    }
    
    if (req.botAnalysis) {
      updateBotDetectionMetrics(req.botAnalysis);
    }

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Please enter a strong password (at least 8 characters)",
      });
    }

    // Use enhanced registration with email verification
    const result = await registerWithEmailVerification(name, email, password);
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Log successful registration attempt
    console.log(`Registration initiated for: ${email} from IP: ${req.ip}`);
    if (req.signupAnalysis) {
      console.log(`Signup risk level: ${req.signupAnalysis.riskLevel}`);
    }

    res.status(201).json({ 
      success: true, 
      message: result.message,
      requiresVerification: result.requiresVerification,
      emailValidation: req.emailValidation
    });
    
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

// Route for email verification
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: "Verification token is required" });
    }

    const result = await verifyUserEmail(token);
    
    if (result.success) {
      return res.json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, message: "Email verification failed" });
  }
};

//Route for Admin login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation to prevent injection attacks
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Invalid input format",
      });
    }

    // Trim and validate email format
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check multiple admin authentication methods
    let isValidAdmin = false;
    let adminInfo = null;
    
    // Method 1: Check hardcoded admin credentials (backward compatibility)
    if (
      process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD &&
      trimmedEmail === process.env.ADMIN_EMAIL.toLowerCase() &&
      trimmedPassword === process.env.ADMIN_PASSWORD
    ) {
      isValidAdmin = true;
      adminInfo = {
        email: trimmedEmail,
        role: 'admin',
        source: 'hardcoded'
      };
    }
    
    // Method 2: Check admin emails list with user accounts (fallback)
    if (!isValidAdmin && process.env.ADMIN_EMAILS) {
      const adminEmails = process.env.ADMIN_EMAILS.toLowerCase().split(',').map(e => e.trim());
      
      if (adminEmails.includes(trimmedEmail)) {
        // Find user account and verify password
        const adminUser = await userModel.findOne({ email: trimmedEmail });
        if (adminUser) {
          const isMatch = await bcrypt.compare(trimmedPassword, adminUser.password);
          if (isMatch && (adminUser.isEmailVerified || process.env.NODE_ENV === 'development')) {
            isValidAdmin = true;
            adminInfo = {
              email: trimmedEmail,
              role: 'admin',
              source: 'user_account',
              userId: adminUser._id,
              name: adminUser.name
            };
          }
        }
      }
    }
    
    if (isValidAdmin) {
      // Create token with admin info
      const tokenPayload = {
        email: adminInfo.email,
        role: 'admin',
        timestamp: Date.now(),
        ...adminInfo
      };
      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ 
        success: true, 
        token,
        message: "Admin login successful"
      });
    } else {
      // Generic error message to prevent user enumeration
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (e) {
    console.error('Admin login error:', e);
    res.status(500).json({ success: false, message: "Authentication failed" });
  }
};

// Middleware to verify token and get user
export const verifyJWTToken = async (req, res, next) => {
  try {
    console.log('verifyToken middleware called');
    console.log('Request headers:', req.headers);
    
    const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');
    console.log('Resolved token from headers:', token ? 'present' : 'missing');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ success: false, message: "Not Authorized Login Again" });
    }

    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', token_decode);
    req.body.userId = token_decode.id;
    next();
  } catch (error) {
    console.log('Token verification error:', error);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Route to get user profile
export const getUserProfile = async (req, res) => {
  try {
    console.log('getUserProfile called');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    const userId = req.body.userId;
    console.log('User ID from request:', userId);
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID not found in request" });
    }

    // Fetch user profile excluding sensitive fields
    const user = await userModel.findById(userId).select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires');
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: "Failed to fetch user profile" });
  }
};

// Route to update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { name, phone, dateOfBirth, gender, preferences } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID not found in request" });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (preferences !== undefined) updateData.preferences = preferences;

    // Update user profile
    const user = await userModel.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true, select: '-password -emailVerificationToken -passwordResetToken -passwordResetExpires' }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user, message: "Profile updated successfully" });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// Route to request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    // Find user by email
    const user = await userModel.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ success: true, message: "If an account exists with this email, you will receive a password reset link." });
    }

    // Check if account is active
    if (user.accountStatus !== 'active') {
      return res.status(403).json({ success: false, message: "Your account is not active. Please contact support." });
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken(user._id, user.email);
    
    // Save token and expiration to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      res.json({ success: true, message: "Password reset link sent to your email" });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      res.status(500).json({ success: false, message: "Failed to send password reset email. Please try again." });
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ success: false, message: "Failed to process password reset request" });
  }
};

// Route to reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenError) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    // Find user with this reset token
    const user = await userModel.findOne({
      _id: decoded.userId,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Login with Google ID token
export const loginWithGoogle = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: "Missing Google credential" });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = (payload?.email || '').toLowerCase();
    const name = payload?.name || payload?.given_name || 'User';
    const picture = payload?.picture || '';

    if (!email) {
      return res.status(400).json({ success: false, message: "Unable to retrieve email from Google" });
    }

    // Find or create user
    let user = await userModel.findOne({ email });
    if (!user) {
      user = await userModel.create({
        name,
        email,
        password: await bcrypt.hash(jwt.sign({ email }, process.env.JWT_SECRET), 10),
        avatar: picture,
        isEmailVerified: true,
        accountStatus: 'active',
        joinDate: new Date(),
      });
    } else {
      // Ensure account is active
      if (user.accountStatus !== 'active') {
        console.warn('Google login blocked: account inactive', { email: user.email, accountStatus: user.accountStatus });
        return res.status(403).json({ success: false, message: "Your account is not active. Please contact support." });
      }
      // Mark verified via Google and update basic profile fields
      user.isEmailVerified = true;
      if (picture && !user.avatar) user.avatar = picture;
      if (!user.name && name) user.name = name;
      user.lastLogin = new Date();
      await user.save();
    }

    // Issue app JWT
    const token = createToken(user._id);
    return res.json({ success: true, token });
  } catch (e) {
    console.error('Google login error:', e);
    return res.status(500).json({ success: false, message: "Google login failed" });
  }
};