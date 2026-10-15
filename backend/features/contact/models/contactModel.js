import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true
  },
  subject: { 
    type: String, 
    required: true,
    trim: true
  },
  message: { 
    type: String, 
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
contactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const contactModel = mongoose.models.contact || mongoose.model("contact", contactSchema);
export default contactModel;