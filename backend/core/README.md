# Backend Core Infrastructure

This directory contains the core infrastructure that is shared across all domains in the backend application.

## 📁 Structure

### **Config** (`/config`)
Configuration files for external services and database connections:
- `mongodb.js` - MongoDB database configuration
- `cloudinary.js` - Cloudinary image upload configuration
- `index.js` - Centralized configuration exports

### **Middleware** (`/middleware`)
Global middleware that can be used across multiple domains:
- `multer.js` - File upload middleware
- `security/` - Security-related middleware (if any)

### **Scripts** (`/scripts`)
Utility scripts for development, testing, and maintenance:
- `enhanced-security-demo.js` - Security demonstration script
- `security-performance-demo.js` - Performance testing script

## 🔄 Usage

Core infrastructure is imported by domains using relative paths:

```javascript
// From a domain controller
const { connectDB } = require('../../core/config/mongodb');
const upload = require('../../core/middleware/multer');
```

## 🎯 Design Principles

1. **Shared Responsibility**: Only code used by multiple domains
2. **No Domain Logic**: Pure infrastructure, no business logic
3. **Stable APIs**: Changes should be backward compatible
4. **Clear Boundaries**: Well-defined interfaces between core and domains

---

*Core infrastructure provides the foundation for all domain-specific functionality.*