import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: '',
    },
    // address: { type: String, default: '' }, // Removed - using separate address model
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say', ''],
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    preferences: {
      type: Object,
      default: {
        notifications: true,
        newsletter: false,
        theme: 'light'
      },
    },
    cartData: {
      type: Object,
      default: {},
    },
    wishlist: {
      type: Array,
      default: [],
    },
    addresses: {
      type: Array,
      default: [],
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    
    // Account status and verification
    isEmailVerified: { type: Boolean, default: false },
    accountStatus: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    
    // Tracking and analytics
    lastLogin: { type: Date },
    profileCompletionPercentage: { type: Number, default: 0 },
    
    // Security
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    emailVerificationToken: { type: String },
  },
  { minimize: false }
);

// Method to get default address
userSchema.methods.getDefaultAddress = function() {
  if (!this.addresses || this.addresses.length === 0) {
    return null;
  }
  
  const defaultAddress = this.addresses.find(addr => addr.isDefault === true);
  return defaultAddress || null;
};

// Method to calculate profile completion percentage
userSchema.methods.calculateProfileCompletion = function() {
  let completedFields = 0;
  const totalFields = 7; // name, email, phone, dateOfBirth, gender, preferences, addresses
  
  if (this.name) completedFields++;
  if (this.email) completedFields++;
  if (this.phone) completedFields++;
  if (this.dateOfBirth) completedFields++;
  if (this.gender) completedFields++;
  if (this.preferences && Object.keys(this.preferences).length > 0) completedFields++;
  if (this.addresses && this.addresses.length > 0) completedFields++; // Updated to check addresses array
  
  this.profileCompletionPercentage = Math.round((completedFields / totalFields) * 100);
  return this.profileCompletionPercentage;
};

// Pre-save middleware to validate address data consistency
userSchema.pre('save', function(next) {
  // Normalize email casing for uniqueness
  if (this.isModified('email') && typeof this.email === 'string') {
    this.email = this.email.toLowerCase().trim();
  }
  // Validate address consistency if addresses exist
  if (this.addresses && this.addresses.length > 0) {
    const defaultAddresses = this.addresses.filter(addr => addr.isDefault === true);
    
    if (defaultAddresses.length > 1) {
      // Fix multiple defaults by keeping only the first one
      console.log(`⚠️ Pre-save: Found ${defaultAddresses.length} default addresses for user ${this._id}, fixing...`);
      let firstDefaultFound = false;
      this.addresses.forEach(addr => {
        if (addr.isDefault && !firstDefaultFound) {
          firstDefaultFound = true;
        } else if (addr.isDefault && firstDefaultFound) {
          addr.isDefault = false;
        }
      });
    } else if (defaultAddresses.length === 0) {
      // No default but addresses exist, make first one default
      console.log(`⚠️ Pre-save: No default address found for user ${this._id}, setting first address as default`);
      this.addresses[0].isDefault = true;
    }
  }
  
  this.calculateProfileCompletion();
  this.updatedAt = new Date();
  next();
});

// Database indexes for performance optimization
// Email is already unique (creates index automatically) - no need for explicit index
userSchema.index({ role: 1 }); // For admin/user filtering
userSchema.index({ accountStatus: 1 }); // For active user queries
userSchema.index({ createdAt: -1 }); // For registration date sorting
userSchema.index({ lastLogin: -1 }); // For activity tracking
userSchema.index({ isEmailVerified: 1 }); // For verification status

// Compound indexes for common queries
userSchema.index({ role: 1, accountStatus: 1 }); // Admin queries for user management
userSchema.index({ accountStatus: 1, createdAt: -1 }); // Active users by registration date
userSchema.index({ isEmailVerified: 1, accountStatus: 1 }); // Verification and status combination

// Sparse indexes for optional fields
userSchema.index({ phone: 1 }, { sparse: true }); // Phone lookup (only when exists)
userSchema.index({ passwordResetToken: 1 }, { sparse: true }); // Password reset lookup
userSchema.index({ emailVerificationToken: 1 }, { sparse: true }); // Email verification lookup

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
