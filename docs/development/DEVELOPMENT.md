# Development Guide

This guide provides comprehensive instructions for setting up, developing, and maintaining the Forever E-commerce Platform.

## 🚀 Quick Setup

### Prerequisites
- **Node.js**: Version 16.0 or higher
- **npm**: Version 8.0 or higher
- **MongoDB**: Local installation or MongoDB Atlas account
- **Git**: For version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd forever-ecommerce
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment setup**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp admin/.env.example admin/.env
   ```

4. **Configure environment variables**
   - Update `backend/.env` with your MongoDB URI and API keys
   - Update frontend and admin .env files with backend URL

5. **Start development servers**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
forever-ecommerce/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React Context providers
│   │   ├── constants/      # Application constants
│   │   ├── assets/         # Static assets
│   │   └── styles/         # CSS and styling files
│   ├── public/             # Public assets
│   └── package.json        # Frontend dependencies
├── backend/                 # Node.js/Express backend
│   ├── controllers/        # Route controllers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── config/            # Configuration files
│   └── package.json       # Backend dependencies
├── admin/                  # React admin panel
│   ├── src/
│   │   ├── components/    # Admin UI components
│   │   ├── pages/         # Admin pages
│   │   ├── constants/     # Admin constants
│   │   └── assets/        # Admin assets
│   └── package.json       # Admin dependencies
├── docs/                   # Centralized documentation
├── validation/             # Project validation utilities
├── package.json           # Root package.json with scripts
└── README.md              # Quick start guide
```

## 🛠️ Development Workflow

### Starting Development

1. **Start all services**
   ```bash
   npm run dev
   ```
   This starts:
   - Backend API on http://localhost:5000
   - Frontend on http://localhost:5173
   - Admin panel on http://localhost:5174

2. **Start individual services**
   ```bash
   npm run dev:frontend    # Frontend only
   npm run dev:backend     # Backend only
   npm run dev:admin       # Admin only
   ```

### Making Changes

1. **Frontend Development**
   - Components are in `frontend/src/components/`
   - Pages are in `frontend/src/pages/`
   - Global state in `frontend/src/context/ShopContext.jsx`
   - Styling uses TailwindCSS with custom CSS variables

2. **Backend Development**
   - API routes in `backend/routes/`
   - Controllers in `backend/controllers/`
   - Database models in `backend/models/`
   - Middleware in `backend/middleware/`

3. **Admin Development**
   - Admin components in `admin/src/components/`
   - Admin pages in `admin/src/pages/`
   - Shares styling approach with frontend

### Code Standards

#### React Components
```javascript
// Use functional components with hooks
import React, { useState, useEffect } from 'react';

const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return (
    <div className="tailwind-classes">
      {/* Component JSX */}
    </div>
  );
};

export default MyComponent;
```

#### API Controllers
```javascript
// Use async/await with proper error handling
const controllerFunction = async (req, res) => {
  try {
    // Controller logic
    const result = await SomeModel.find();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
```

#### Styling Guidelines
```css
/* Use CSS variables for colors */
.my-component {
  background-color: var(--royal-saffron);
  color: var(--ivory-white);
}

/* Use TailwindCSS classes for layout */
<div className="flex items-center justify-between p-4 bg-ivory-white">
```

## 🎨 Styling System

### Color Palette
The project uses a custom color palette defined in CSS variables:

```css
:root {
  --royal-saffron: #FFA000;
  --indian-coral-red: #E53935;
  --dark-fern-green: #2E7D32;
  --clay-brown: #B66E41;
  --ivory-white: #FAF7F0;
  --brick-maroon: #7B2C2C;
  --heritage-indigo: #3F51B5;
}
```

### TailwindCSS Configuration
- Custom colors are configured in `tailwind.config.js`
- Use utility classes for responsive design
- Custom components for complex styling

### Component Styling
1. **Use CSS variables** for consistent colors
2. **TailwindCSS classes** for layout and spacing
3. **Custom CSS** only when necessary
4. **Responsive design** with mobile-first approach

## 🗄️ Database Schema

### Product Model
```javascript
{
  name: String,
  description: String,
  price: Number,
  image: [String],
  category: String,
  subCategory: String,
  measurementType: {
    type: String,
    enum: ['weight', 'size', 'volume', 'quantity', 'length']
  },
  measurements: [{
    value: String,      // e.g., "250g", "M", "500ml"
    label: String,      // Display label
    price: Number       // Individual price for this measurement
  }],
  bestseller: Boolean,
  date: { type: Date, default: Date.now }
}
```

### User Model
```javascript
{
  name: String,
  email: String,
  password: String,
  cartData: Object,
  date: { type: Date, default: Date.now }
}
```

### Order Model
```javascript
{
  userId: String,
  items: Array,
  amount: Number,
  address: Object,
  status: String,
  paymentMethod: String,
  payment: Boolean,
  date: { type: Date, default: Date.now }
}
```

## 🧪 Testing

### Manual Testing Checklist

#### Frontend Testing
- [ ] Homepage loads with products
- [ ] Product pages display measurements correctly
- [ ] Cart functionality works
- [ ] Search works across all pages
- [ ] Responsive design on mobile
- [ ] Color scheme is consistent

#### Admin Testing
- [ ] Product creation with measurements
- [ ] Custom measurement types work
- [ ] Category management functions
- [ ] Product list displays correctly
- [ ] Order management works

#### Backend Testing
- [ ] API endpoints respond correctly
- [ ] Database operations work
- [ ] Authentication functions
- [ ] Error handling works
- [ ] File uploads work

### Test Data
The project includes comprehensive dummy data for testing:
- 6 different product types with various measurements
- Sample categories and subcategories
- Test user accounts
- Sample orders

## 🚀 Deployment

### Production Build

1. **Build frontend and admin**
   ```bash
   npm run build
   ```

2. **Environment variables**
   - Set production environment variables
   - Update API URLs for production
   - Configure database connections

3. **Backend deployment**
   ```bash
   cd backend
   npm start
   ```

### Environment Configuration

#### Backend (.env)
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

#### Frontend (.env)
```env
VITE_BACKEND_URL=http://localhost:5000
```

#### Admin (.env)
```env
VITE_BACKEND_URL=http://localhost:5000
```

## 🔧 Troubleshooting

### Common Issues

#### Slow Loading
- **Symptom**: Pages take long to load
- **Cause**: Server connection issues
- **Solution**: Dummy data loads instantly, check network tab for failed requests

#### Search Not Working
- **Symptom**: Search doesn't filter products
- **Cause**: State synchronization issues
- **Solution**: Check console for errors, verify search state in React DevTools

#### Measurement Display Issues
- **Symptom**: Measurements not showing correctly
- **Cause**: Missing measurement constants
- **Solution**: Check `constants/measurements.js` files

#### Admin Panel Issues
- **Symptom**: Can't add products or measurements
- **Cause**: Category/measurement mapping issues
- **Solution**: Verify constants files and console for validation errors

### Debug Tools

#### Frontend Debugging
```javascript
// Add to components for debugging
console.log('Component state:', state);
console.log('Props:', props);
```

#### Backend Debugging
```javascript
// Add to controllers for debugging (remove before production)
// console.log('Request body:', req.body);
// console.log('Database result:', result);
```

#### Network Debugging
- Use browser DevTools Network tab
- Check for failed API requests
- Verify request/response data

## 📚 Key Features Implementation

### Dynamic Measurements System
- **Location**: `constants/measurements.js`
- **Usage**: Import measurement constants and helper functions
- **Customization**: Add new measurement types or options

### Search Functionality
- **Location**: `context/ShopContext.jsx`
- **Implementation**: Global search state with real-time filtering
- **Customization**: Modify search fields in filter function

### Admin Dashboard
- **Location**: `admin/src/pages/Add.jsx`
- **Features**: Visual measurement selector, custom categories
- **Customization**: Modify measurement constants and UI components

### Performance Optimizations
- **Strategy**: Instant dummy data loading with background sync
- **Implementation**: Context providers with timeout handling
- **Monitoring**: Check loading times in DevTools

## 🔄 Data Migration

### Measurement System Migration
If upgrading from legacy product structure:

```bash
cd backend
node migrate-measurements.js run
```

This script:
- Converts legacy `sizes` to `measurements` array
- Determines measurement type based on category
- Preserves existing data while adding new structure

## 📖 Additional Resources

### Documentation
- [Project Guide](../project/PROJECT_GUIDE.md) - Complete feature documentation
- [Testing Guide](./TESTING.md) - Testing procedures and guidelines
- [Maintenance Guide](./MAINTENANCE_GUIDE.md) - Maintenance procedures
- [Change Log](../reports/CHANGELOG.md) - Version history and changes

### External Dependencies
- **React**: Frontend framework
- **Express**: Backend framework
- **MongoDB**: Database
- **TailwindCSS**: Styling framework
- **Vite**: Build tool
- **Cloudinary**: Image management
- **Razorpay**: Payment processing

### Community and Support
- Check GitHub issues for common problems
- Review code comments for implementation details
- Use browser DevTools for debugging
- Test thoroughly before deploying changes

---

## 🎯 Development Best Practices

1. **Code Organization**: Keep components small and focused
2. **State Management**: Use Context API for global state
3. **Error Handling**: Implement proper try-catch blocks
4. **Performance**: Optimize images and API calls
5. **Testing**: Test all features before committing
6. **Documentation**: Comment complex logic
7. **Version Control**: Use meaningful commit messages
8. **Security**: Never commit sensitive data

Happy coding! 🚀