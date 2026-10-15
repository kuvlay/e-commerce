# Authentication Domain Map

## 📋 Domain Overview
- **Purpose**: User authentication, login, registration, and basic user management
- **Responsibility**: Handle all user authentication and basic user operations
- **Frontend Consumers**: authentication domain, shared layout components

## 📁 Components in this Domain

### **Controllers**
| Controller | File | Lines of Code | Purpose | Endpoints |
|------------|------|---------------|---------|-----------|
| userController | `controllers/userController.js` | ~280 LOC | User authentication and management | `/api/user/login`, `/api/user/register`, `/api/user/admin` |

### **Routes**
| Route | File | Lines of Code | Purpose | Methods |
|-------|------|---------------|---------|---------|
| userRoutes | `routes/userRoutes.js` | ~50 LOC | User authentication routes | POST /login, POST /register, POST /admin |

### **Models**
| Model | File | Lines of Code | Purpose | Collections |
|-------|------|---------------|---------|-------------|
| userModel | `models/userModel.js` | ~120 LOC | User data structure | users |

### **Middleware**
| Middleware | File | Lines of Code | Purpose | Used By |
|------------|------|---------------|---------|---------|
| auth | `middleware/auth.js` | ~60 LOC | User authentication middleware | Protected routes |
| adminAuth | `middleware/adminAuth.js` | ~40 LOC | Admin authentication middleware | Admin routes |

## 🔗 API Endpoints

### **User Authentication**
- `POST /api/user/login` - User login
- `POST /api/user/register` - User registration
- `POST /api/user/admin` - Admin login

### **User Management**
- `GET /api/user/profile` - Get user profile (if implemented)
- `PUT /api/user/profile` - Update user profile (if implemented)

## 🔄 Frontend Consumers

### **Primary Consumers**
- **authentication domain**: Login.jsx, Profile.jsx, Account.jsx
- **shared/layout**: Navbar.jsx (for user authentication state)

### **API Usage Patterns**
- **Login Flow**: Frontend login form → `/api/user/login` → JWT token → User state
- **Registration Flow**: Frontend registration → `/api/user/register` → Auto-login
- **Admin Access**: Admin login → `/api/user/admin` → Admin token → Admin panel access

## 🔄 Admin Consumers

### **Admin Panel Usage**
- **admin/authentication**: Login.jsx uses `/api/user/admin`
- **admin/shared**: Admin authentication state management

## 📊 Complexity Metrics

### **High Complexity Components** (>200 LOC)
1. **userController.js** - 280 LOC (comprehensive user management)

### **API Integration Points**
- **Authentication Flow**: Login/register with JWT token generation
- **Password Security**: Bcrypt hashing and validation
- **Admin Access**: Separate admin authentication endpoint

## 🎯 Domain Responsibilities

### **Core Functions**
1. **User Registration**: Create new user accounts
2. **User Login**: Authenticate users and generate JWT tokens
3. **Admin Authentication**: Separate admin login system
4. **Password Management**: Secure password hashing and validation
5. **JWT Token Management**: Generate and validate authentication tokens

### **Business Rules**
- Passwords must be hashed using bcrypt
- JWT tokens expire after configured time
- Admin users have separate authentication flow
- Email addresses must be unique
- User registration requires email and password validation

## 🔧 Technical Implementation

### **Authentication Flow**
```
Login Request → Validation → Password Check → JWT Generation → Response
```

### **Registration Flow**
```
Registration Request → Validation → Password Hash → User Creation → Auto-Login
```

### **Middleware Integration**
- **auth.js**: Validates JWT tokens for protected routes
- **adminAuth.js**: Validates admin JWT tokens for admin routes

## 📈 Performance Considerations

### **Optimization Opportunities**
1. **Password Hashing**: Optimize bcrypt rounds for performance vs security
2. **JWT Validation**: Cache JWT validation for frequently accessed routes
3. **Database Queries**: Optimize user lookup queries
4. **Session Management**: Consider Redis for session storage

### **Current Performance**
- **Bundle Impact**: ~490 LOC total
- **Database Queries**: Optimized user lookups
- **Security**: Bcrypt hashing with appropriate rounds

## 🔒 Security Considerations

### **Security Measures**
- **Password Hashing**: Bcrypt with salt rounds
- **JWT Security**: Secure token generation and validation
- **Input Validation**: Email and password validation
- **Admin Separation**: Separate admin authentication flow

### **Security Best Practices**
- Never store plain text passwords
- Use secure JWT secret keys
- Implement proper token expiration
- Validate all user inputs
- Separate admin and user authentication

---

*This domain handles all user authentication functionality with focus on security and proper token management.*