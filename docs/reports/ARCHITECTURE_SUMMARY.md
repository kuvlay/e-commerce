# Forever E-commerce Platform - Architecture Summary

> **Document Version**: 1.0  
> **Last Updated**: 2025-01-13  
> **Purpose**: Authoritative reference for coding conventions, folder structure, and architectural guidelines

## 📋 Overview

This document consolidates all architectural guidelines, coding conventions, and structural requirements for the Forever E-commerce Platform. It serves as the single source of truth for compliance checking and development standards across all three modules: Frontend (React/Vite), Backend (Node.js/Express), and Admin Panel (React/Vite).

---

## 🏗️ Domain-Driven Architecture

### Core Principles
- **Domain-Driven Design**: Features organized by business domains, not technical layers
- **Module Boundaries**: Clear separation between frontend, backend, and admin concerns
- **Shared Components**: Reusable components with proper abstraction levels
- **API-First Design**: Backend APIs designed to serve both frontend and admin needs

### Business Domains
1. **Authentication** - User login, registration, profile management
2. **Products** - Product catalog, search, filtering, measurements
3. **Cart-Checkout** - Shopping cart, checkout process, payment integration
4. **Orders** - Order management, tracking, status updates
5. **Profile** - User profiles, addresses, preferences
6. **Wishlist** - Product wishlist functionality
7. **Contact** - Customer support, messaging
8. **Shared** - Common components, utilities, services

---

## 📁 Folder Structure Standards

### Frontend Structure (`frontend/src/`)
```
frontend/src/
├── features/                    # Domain-driven feature organization
│   ├── authentication/         # Auth domain
│   │   ├── components/         # Auth-specific components
│   │   ├── pages/             # Auth pages (Login, Register, Profile)
│   │   ├── hooks/             # Auth-specific hooks
│   │   ├── services/          # Auth API services
│   │   └── index.js           # Barrel export file
│   ├── products/              # Products domain
│   │   ├── components/        # Product components (ProductCard, ProductGrid)
│   │   ├── pages/             # Product pages (Collection, Product detail)
│   │   ├── hooks/             # Product-specific hooks
│   │   ├── services/          # Product API services
│   │   └── index.js           # Barrel export file
│   ├── cart-checkout/         # Cart and checkout domain
│   │   ├── components/        # Cart components (CartDrawer, CartTotal)
│   │   ├── pages/             # Checkout pages
│   │   ├── hooks/             # Cart-specific hooks
│   │   ├── services/          # Cart/checkout API services
│   │   └── index.js           # Barrel export file
│   ├── orders/                # Orders domain
│   │   ├── components/        # Order components
│   │   ├── pages/             # Order pages (TrackOrders, Verify)
│   │   ├── hooks/             # Order-specific hooks
│   │   ├── services/          # Order API services
│   │   └── index.js           # Barrel export file
│   ├── profile/               # Profile domain
│   │   ├── components/        # Profile components (AddressManager, ProfileCompletion)
│   │   ├── pages/             # Profile pages
│   │   ├── hooks/             # Profile-specific hooks
│   │   ├── services/          # Profile API services
│   │   └── index.js           # Barrel export file
│   ├── wishlist/              # Wishlist domain
│   │   ├── components/        # Wishlist components
│   │   ├── pages/             # Wishlist pages
│   │   ├── hooks/             # Wishlist-specific hooks
│   │   ├── services/          # Wishlist API services
│   │   └── index.js           # Barrel export file
│   ├── contact/               # Contact domain
│   │   ├── components/        # Contact components
│   │   ├── pages/             # Contact pages
│   │   ├── hooks/             # Contact-specific hooks
│   │   ├── services/          # Contact API services
│   │   └── index.js           # Barrel export file
│   └── shared/                # Shared components and utilities
│       ├── components/        # Shared components
│       │   ├── layout/        # Layout components (Navbar, Footer)
│       │   ├── ui/            # UI components (Title, SkeletonLoader)
│       │   ├── media/         # Media components (ImageGallery)
│       │   └── business/      # Business components (SearchBar)
│       ├── hooks/             # Shared hooks
│       ├── utils/             # Utility functions
│       ├── services/          # Shared services
│       └── index.js           # Barrel export file
├── context/                   # React Context providers
│   ├── ShopContext.jsx        # Main shop context
│   ├── UserContext.jsx        # User authentication context
│   └── WishlistContext.jsx    # Wishlist context
├── constants/                 # Application constants
│   ├── measurements.js        # Measurement system constants
│   ├── categories.js          # Product categories
│   └── api.js                 # API endpoints
├── styles/                    # Global styles
│   ├── colors.css             # Color variables and palette
│   ├── globals.css            # Global CSS styles
│   └── components.css         # Component-specific styles
├── assets/                    # Static assets
│   ├── images/                # Image assets
│   └── icons/                 # Icon assets
├── App.jsx                    # Main application component
└── main.jsx                   # Application entry point
```

### Backend Structure (`backend/`)
```
backend/
├── features/                  # Domain-driven feature organization
│   ├── authentication/       # Auth domain
│   │   ├── controllers/       # Auth controllers
│   │   ├── models/           # Auth models (User)
│   │   ├── routes/           # Auth routes
│   │   ├── middleware/       # Auth middleware
│   │   └── index.js          # Barrel export file
│   ├── products/             # Products domain
│   │   ├── controllers/      # Product controllers
│   │   ├── models/           # Product models
│   │   ├── routes/           # Product routes
│   │   ├── middleware/       # Product middleware
│   │   └── index.js          # Barrel export file
│   ├── cart-checkout/        # Cart and checkout domain
│   │   ├── controllers/      # Cart controllers
│   │   ├── models/           # Cart models
│   │   ├── routes/           # Cart routes
│   │   ├── middleware/       # Cart middleware
│   │   └── index.js          # Barrel export file
│   ├── orders/               # Orders domain
│   │   ├── controllers/      # Order controllers
│   │   ├── models/           # Order models
│   │   ├── routes/           # Order routes
│   │   ├── middleware/       # Order middleware
│   │   └── index.js          # Barrel export file
│   ├── payments/             # Payments domain
│   │   ├── controllers/      # Payment controllers
│   │   ├── models/           # Payment models
│   │   ├── routes/           # Payment routes
│   │   ├── middleware/       # Payment middleware
│   │   └── index.js          # Barrel export file
│   ├── profile/              # Profile domain
│   │   ├── controllers/      # Profile controllers
│   │   ├── models/           # Profile models (Address)
│   │   ├── routes/           # Profile routes
│   │   ├── middleware/       # Profile middleware
│   │   └── index.js          # Barrel export file
│   ├── wishlist/             # Wishlist domain
│   │   ├── controllers/      # Wishlist controllers
│   │   ├── models/           # Wishlist models
│   │   ├── routes/           # Wishlist routes
│   │   ├── middleware/       # Wishlist middleware
│   │   └── index.js          # Barrel export file
│   └── contact/              # Contact domain
│       ├── controllers/      # Contact controllers
│       ├── models/           # Contact models
│       ├── routes/           # Contact routes
│       ├── middleware/       # Contact middleware
│       └── index.js          # Barrel export file
├── config/                   # Configuration files
│   ├── database.js           # Database configuration
│   ├── cloudinary.js         # Cloudinary configuration
│   └── razorpay.js           # Payment configuration
├── middleware/               # Shared middleware
│   ├── auth.js               # Authentication middleware
│   ├── multer.js             # File upload middleware
│   └── cors.js               # CORS configuration
├── scripts/                  # Utility scripts
│   └── migrate-measurements.js # Data migration scripts
├── server.js                 # Main server file
└── package.json              # Dependencies and scripts
```

### Admin Structure (`admin/src/`)
```
admin/src/
├── features/                 # Domain-driven feature organization
│   ├── authentication/      # Admin auth
│   │   ├── components/       # Auth components
│   │   ├── pages/           # Auth pages (Login)
│   │   └── index.js         # Barrel export file
│   ├── products/            # Product management
│   │   ├── components/      # Product components (CustomCategoryModal)
│   │   ├── pages/           # Product pages (Add, List)
│   │   └── index.js         # Barrel export file
│   ├── orders/              # Order management
│   │   ├── components/      # Order components
│   │   ├── pages/           # Order pages
│   │   └── index.js         # Barrel export file
│   ├── customers/           # Customer management
│   │   ├── components/      # Customer components
│   │   ├── pages/           # Customer pages
│   │   └── index.js         # Barrel export file
│   ├── messages/            # Message management
│   │   ├── components/      # Message components
│   │   ├── pages/           # Message pages
│   │   └── index.js         # Barrel export file
│   ├── dashboard/           # Dashboard
│   │   ├── components/      # Dashboard components
│   │   ├── pages/           # Dashboard pages
│   │   └── index.js         # Barrel export file
│   └── shared/              # Shared admin components
│       ├── components/      # Shared components (Navbar, Sidebar)
│       ├── utils/           # Admin utilities
│       └── index.js         # Barrel export file
├── constants/               # Admin constants
│   ├── measurements.js      # Measurement system constants
│   └── categories.js        # Category constants
├── styles/                  # Admin styles
│   └── globals.css          # Global admin styles
├── assets/                  # Admin assets
├── App.jsx                  # Main admin component
└── main.jsx                 # Admin entry point
```

---

## ⚛️ Component Conventions

### React Component Standards
```javascript
// Use functional components with hooks
import React, { useState, useEffect } from 'react';

const ComponentName = ({ prop1, prop2 }) => {
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

export default ComponentName;
```

### Component Organization Rules
1. **Functional Components Only**: No class components
2. **Hooks Usage**: useState, useEffect, useContext, custom hooks
3. **Props Destructuring**: Destructure props in function parameters
4. **Default Exports**: Each component file exports one default component
5. **Named Exports**: Use named exports for utilities and constants

### Barrel Export Pattern
```javascript
// features/authentication/index.js
export { default as Login } from './pages/Login';
export { default as Register } from './pages/Register';
export { default as Profile } from './pages/Profile';
export { default as AuthGuard } from './components/AuthGuard';
export * from './hooks';
export * from './services';
```

### Component File Structure
```javascript
// Component imports
import React, { useState, useEffect } from 'react';
import { useContext } from 'react';

// External library imports
import axios from 'axios';

// Internal imports (relative paths)
import { ShopContext } from '../../context/ShopContext';
import { Title } from '../shared';

// Component definition
const ComponentName = ({ props }) => {
  // Component logic
};

export default ComponentName;
```

---

## 🎨 CSS Architecture

### Global Styles Structure
```css
/* frontend/src/styles/colors.css */
:root {
  /* Primary Colors */
  --royal-saffron: #FFA000;
  --indian-coral-red: #E53935;
  --dark-fern-green: #2E7D32;
  --clay-brown: #B66E41;
  --ivory-white: #FAF7F0;
  --brick-maroon: #7B2C2C;
  --heritage-indigo: #3F51B5;
  
  /* Semantic Colors */
  --primary: var(--royal-saffron);
  --secondary: var(--dark-fern-green);
  --accent: var(--indian-coral-red);
  --background: var(--ivory-white);
  --text-primary: var(--brick-maroon);
  --text-secondary: var(--clay-brown);
}
```

### CSS Usage Hierarchy
1. **CSS Variables**: For colors, spacing, and theme values
2. **TailwindCSS Classes**: For layout, spacing, and responsive design
3. **Component CSS**: Only when TailwindCSS is insufficient
4. **Inline Styles**: Avoid except for dynamic values

### TailwindCSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'royal-saffron': '#FFA000',
        'indian-coral-red': '#E53935',
        'dark-fern-green': '#2E7D32',
        'clay-brown': '#B66E41',
        'ivory-white': '#FAF7F0',
        'brick-maroon': '#7B2C2C',
        'heritage-indigo': '#3F51B5',
      }
    }
  }
}
```

### Component Styling Pattern
```javascript
// Preferred: TailwindCSS classes
<div className="flex items-center justify-between p-4 bg-ivory-white">
  <h1 className="text-2xl font-bold text-brick-maroon">Title</h1>
  <button className="px-4 py-2 bg-royal-saffron text-white rounded hover:bg-opacity-90">
    Action
  </button>
</div>

// When necessary: CSS variables
<div style={{ backgroundColor: 'var(--primary)' }}>
  Custom styling
</div>
```

---

## 🔌 API Conventions

### RESTful Endpoint Structure
```
/api/{domain}/{action}
```

### API Endpoint Standards
| Method | Pattern | Purpose | Example |
|--------|---------|---------|---------|
| GET | `/api/{domain}/list` | Get all items | `/api/product/list` |
| GET | `/api/{domain}/{id}` | Get single item | `/api/product/123` |
| POST | `/api/{domain}/add` | Create new item | `/api/product/add` |
| POST | `/api/{domain}/update` | Update item | `/api/product/update` |
| POST | `/api/{domain}/delete` | Delete item | `/api/product/delete` |
| GET | `/api/{domain}/featured` | Get featured items | `/api/product/featured` |

### Controller Pattern
```javascript
// controllers/productController.js
const addProduct = async (req, res) => {
  try {
    // Validation
    const { name, description, price } = req.body;
    if (!name || !description || !price) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // Business logic
    const product = new Product(req.body);
    await product.save();

    // Response
    res.json({ 
      success: true, 
      message: "Product added successfully",
      data: product 
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
```

### Error Handling Standards
```javascript
// Consistent error response format
{
  success: false,
  message: "Error description",
  error: "Technical error details" // Only in development
}

// Success response format
{
  success: true,
  message: "Operation successful",
  data: { /* response data */ }
}
```

### Authentication Middleware
```javascript
// middleware/auth.js
const authUser = async (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Not Authorized. Login Again" 
      });
    }
    
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = token_decode.id;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: error.message 
    });
  }
};
```

---

## 📝 File Naming Conventions

### Component Files
- **Format**: PascalCase with descriptive names
- **Examples**: `ProductCard.jsx`, `AddressManager.jsx`, `ProfileCompletion.jsx`
- **Pages**: `Login.jsx`, `Collection.jsx`, `TrackOrders.jsx`

### Utility Files
- **Format**: camelCase with descriptive names
- **Examples**: `userService.js`, `apiHelpers.js`, `formatUtils.js`

### Constant Files
- **Format**: camelCase with plural nouns
- **Examples**: `measurements.js`, `categories.js`, `apiEndpoints.js`

### Hook Files
- **Format**: camelCase starting with "use"
- **Examples**: `useAuth.js`, `useCart.js`, `useProducts.js`

### Model Files (Backend)
- **Format**: camelCase with "Model" suffix
- **Examples**: `userModel.js`, `productModel.js`, `orderModel.js`

### Controller Files (Backend)
- **Format**: camelCase with "Controller" suffix
- **Examples**: `userController.js`, `productController.js`, `orderController.js`

### Route Files (Backend)
- **Format**: camelCase with "Route" suffix
- **Examples**: `userRoute.js`, `productRoute.js`, `orderRoute.js`

---

## 📦 Import/Export Standards

### Import Order
```javascript
// 1. React and React-related imports
import React, { useState, useEffect } from 'react';
import { useContext } from 'react';

// 2. External library imports
import axios from 'axios';
import { toast } from 'react-toastify';

// 3. Internal imports (absolute paths for shared)
import { ShopContext } from '../../context/ShopContext';

// 4. Relative imports (same domain)
import { ProductCard } from '../components';
import { useProducts } from '../hooks';

// 5. Asset imports
import './Component.css';
```

### Barrel Export Usage
```javascript
// Import from barrel files
import { Login, Register, Profile } from '../features/authentication';
import { ProductCard, ProductGrid } from '../features/products';
import { Title, SkeletonLoader } from '../features/shared';

// Avoid deep imports
// ❌ Don't do this
import Login from '../features/authentication/pages/Login';

// ✅ Do this instead
import { Login } from '../features/authentication';
```

### Relative Path Conventions
```javascript
// Within same domain
import { ProductCard } from '../components';
import { useProducts } from '../hooks';

// Cross-domain imports (use barrel exports)
import { Title } from '../../shared';
import { UserContext } from '../../../context/UserContext';

// Shared utilities and services
import { apiCall } from '../../../shared/services';
```

### Module Boundaries
- **Domain Components**: Only import from same domain or shared
- **Shared Components**: Can be imported by any domain
- **Context**: Available globally
- **Constants**: Available globally
- **Services**: Domain-specific or shared

---

## 🧪 Testing Requirements

### Testing Framework
- **Primary**: Vitest for unit and integration tests
- **Location**: Tests co-located with components
- **Naming**: `ComponentName.test.jsx`

### Test Organization
```
frontend/src/
├── features/
│   ├── authentication/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   └── Login.test.jsx
│   │   └── __tests__/
│   │       └── integration/
└── __tests__/
    ├── setup.js
    └── helpers/
```

### Test Categories
1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Feature workflow testing
3. **Smoke Tests**: Basic functionality verification
4. **API Tests**: Backend endpoint testing

### Test Patterns
```javascript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Login } from '../Login';

describe('Login Component', () => {
  it('renders login form', () => {
    render(<Login />);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const mockSubmit = vi.fn();
    render(<Login onSubmit={mockSubmit} />);
    
    fireEvent.click(screen.getByText('Submit'));
    expect(mockSubmit).toHaveBeenCalled();
  });
});
```

### Smoke Test Requirements
```javascript
// Basic functionality tests
describe('Smoke Tests', () => {
  it('app renders without crashing', () => {
    render(<App />);
  });

  it('navigation works', () => {
    // Test basic navigation
  });

  it('api endpoints respond', async () => {
    // Test critical API endpoints
  });
});
```

---

## 📏 Measurement System Standards

### Measurement Types
```javascript
// constants/measurements.js
export const MEASUREMENT_TYPES = {
  WEIGHT: 'weight',
  SIZE: 'size', 
  VOLUME: 'volume',
  QUANTITY: 'quantity',
  LENGTH: 'length'
};

export const MEASUREMENT_OPTIONS = {
  weight: [
    { value: '100g', label: '100g', icon: '⚖️' },
    { value: '250g', label: '250g', icon: '⚖️' },
    { value: '500g', label: '500g', icon: '⚖️' },
    { value: '1kg', label: '1kg', icon: '⚖️' }
  ],
  size: [
    { value: 'S', label: 'Small', icon: '👕' },
    { value: 'M', label: 'Medium', icon: '👕' },
    { value: 'L', label: 'Large', icon: '👕' },
    { value: 'XL', label: 'Extra Large', icon: '👕' }
  ],
  volume: [
    { value: '200ml', label: '200ml', icon: '🥤' },
    { value: '350ml', label: '350ml', icon: '🥤' },
    { value: '500ml', label: '500ml', icon: '🥤' },
    { value: '1L', label: '1 Liter', icon: '🥤' }
  ],
  quantity: [
    { value: '6', label: '6 pieces', icon: '📦' },
    { value: '12', label: '1 dozen', icon: '📦' },
    { value: '24', label: '2 dozen', icon: '📦' }
  ],
  length: [
    { value: '1m', label: '1 meter', icon: '📏' },
    { value: '2m', label: '2 meters', icon: '📏' },
    { value: '5m', label: '5 meters', icon: '📏' },
    { value: '10m', label: '10 meters', icon: '📏' }
  ]
};
```

### Category-Measurement Mapping
```javascript
// constants/categories.js
export const CATEGORY_MEASUREMENTS = {
  'Food': ['weight', 'quantity'],
  'Clothing': ['size'],
  'Beverages': ['volume'],
  'Sweets': ['quantity', 'weight'],
  'Textiles': ['length', 'size'],
  'Spices': ['weight'],
  'Electronics': ['quantity'],
  'Books': ['quantity'],
  'Jewelry': ['quantity', 'size']
};
```

### Product Schema Standards
```javascript
// Backend product model
{
  name: String,
  description: String,
  price: Number, // Base price
  image: [String],
  category: String,
  subCategory: String,
  measurementType: {
    type: String,
    enum: ['weight', 'size', 'volume', 'quantity', 'length'],
    required: true
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

### Measurement Display Standards
```javascript
// Frontend measurement display
const MeasurementSelector = ({ measurements, onSelect }) => {
  return (
    <div className="measurement-selector">
      {measurements.map((measurement) => (
        <button
          key={measurement.value}
          className="measurement-option"
          onClick={() => onSelect(measurement)}
        >
          <span className="measurement-icon">{measurement.icon}</span>
          <span className="measurement-label">{measurement.label}</span>
          <span className="measurement-price">Rs {measurement.price}</span>
        </button>
      ))}
    </div>
  );
};
```

---

## 🔒 Security Standards

### Authentication Requirements
- **JWT Tokens**: For user authentication
- **Middleware Protection**: All protected routes use auth middleware
- **Token Validation**: Proper token verification and error handling
- **Password Security**: Bcrypt for password hashing

### Data Validation
- **Input Validation**: Both client-side and server-side
- **Sanitization**: Prevent XSS and injection attacks
- **Type Checking**: Proper data type validation
- **Required Fields**: Validate required fields

### Environment Variables
```bash
# Backend .env requirements
MONGODB_URI=mongodb_connection_string
JWT_SECRET=jwt_secret_key
CLOUDINARY_NAME=cloudinary_name
CLOUDINARY_API_KEY=cloudinary_api_key
CLOUDINARY_SECRET_KEY=cloudinary_secret_key
RAZORPAY_KEY_ID=razorpay_key_id
RAZORPAY_KEY_SECRET=razorpay_key_secret
```

---

## 📊 Performance Standards

### Loading Performance
- **Target Load Time**: <1 second for initial page load
- **Bundle Size**: Optimized with code splitting
- **Image Optimization**: Fast placeholder images, lazy loading
- **API Timeouts**: 2-second timeout protection

### Code Splitting
```javascript
// Lazy loading for routes
const Login = lazy(() => import('../features/authentication/pages/Login'));
const Products = lazy(() => import('../features/products/pages/Collection'));

// Suspense wrapper
<Suspense fallback={<SkeletonLoader />}>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/collection" element={<Products />} />
  </Routes>
</Suspense>
```

### State Management
- **Context API**: For global state management
- **Local State**: useState for component-specific state
- **Memoization**: useMemo and useCallback for optimization
- **Effect Dependencies**: Proper dependency arrays

---

## 🚀 Deployment Standards

### Build Configuration
```json
// package.json scripts
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\" \"npm run dev:admin\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run server",
    "dev:admin": "cd admin && npm run dev",
    "build": "npm run build:frontend && npm run build:admin",
    "build:frontend": "cd frontend && npm run build",
    "build:admin": "cd admin && npm run build",
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install && cd ../admin && npm install"
  }
}
```

### Environment Configuration
- **Development**: Local development with hot reload
- **Production**: Optimized builds with environment variables
- **Staging**: Pre-production testing environment

---

## 📋 Compliance Checklist

### Folder Structure Compliance
- [ ] Features organized by business domains
- [ ] Barrel export files (`index.js`) in each domain
- [ ] Shared components in dedicated shared folder
- [ ] Context providers in context folder
- [ ] Constants in dedicated constants folder

### Component Compliance
- [ ] Functional components with hooks
- [ ] Proper import order (React, external, internal, relative)
- [ ] TailwindCSS for styling
- [ ] CSS variables for colors
- [ ] Default exports for components

### API Compliance
- [ ] RESTful endpoint naming
- [ ] Consistent error handling
- [ ] Authentication middleware on protected routes
- [ ] Proper HTTP status codes
- [ ] Standardized response format

### Testing Compliance
- [ ] Vitest framework setup
- [ ] Tests co-located with components
- [ ] Smoke tests for critical functionality
- [ ] Integration tests for workflows

### Measurement System Compliance
- [ ] Standardized measurement types
- [ ] Category-measurement mapping
- [ ] Individual pricing per measurement
- [ ] Consistent measurement display

---

## 📚 References

- **Project Guide**: `/docs/project/PROJECT_GUIDE.md`
- **Development Guide**: `/docs/development/DEVELOPMENT.md`
- **Dependency Map**: `/docs/architecture/DEPENDENCY_MAP.md`
- **Integration Guide**: `/docs/features/FRONTEND_BACKEND_INTEGRATION.md`

---

*This document serves as the authoritative reference for all architectural decisions and coding standards. Any deviations from these standards should be documented and approved through the proper review process.*