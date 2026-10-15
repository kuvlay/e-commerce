# Profile Domain Map

## 📋 Domain Overview
- **Purpose**: User profile management and address handling
- **Responsibility**: Handle user profile operations and address management
- **Frontend Consumers**: profile domain, authentication domain
- **Admin Consumers**: admin customers domain

## 📁 Components in this Domain

### **Controllers**
| Controller | File | Lines of Code | Purpose | Endpoints |
|------------|------|---------------|---------|-----------|
| profileController | `controllers/profileController.js` | ~200 LOC | Profile management | `/api/profile/completion`, `/api/profile/analytics` |
| addressController | `controllers/addressController.js` | ~180 LOC | Address CRUD operations | `/api/address/list`, `/api/address/add`, `/api/address/update`, `/api/address/delete`, `/api/address/set-default` |

### **Routes**
| Route | File | Lines of Code | Purpose | Methods |
|-------|------|---------------|---------|---------|
| profileRoute | `routes/profileRoute.js` | ~50 LOC | Profile API routes | GET /completion, GET /analytics |
| addressRoute | `routes/addressRoute.js` | ~80 LOC | Address API routes | GET /list, POST /add, POST /update, POST /delete, POST /set-default |

### **Models**
| Model | File | Lines of Code | Purpose | Collections |
|-------|------|---------------|---------|-------------|
| addressModel | `models/addressModel.js` | ~120 LOC | Address data structure | addresses |

## 🔗 API Endpoints

### **Profile Management**
- `GET /api/profile/completion` - Get profile completion status
- `GET /api/profile/analytics` - Get user analytics
- `POST /api/profile/settings` - Update profile settings

### **Address Management**
- `GET /api/address/list` - Get user addresses
- `POST /api/address/add` - Add new address
- `POST /api/address/update` - Update existing address
- `POST /api/address/delete` - Delete address
- `POST /api/address/set-default` - Set default address
- `GET /api/address/default` - Get default address

## 🔄 Frontend Consumers

### **Primary Consumers**
- **profile domain**: Account.jsx, Settings.jsx, AddressManager.jsx
- **authentication domain**: Profile.jsx, ProfileCompletion.jsx
- **cart-checkout domain**: Address selection in checkout

### **API Usage Patterns**
- **Profile Completion**: Profile page → `/api/profile/completion` → Progress display
- **Address Management**: AddressManager → CRUD operations → Real-time updates
- **Checkout Integration**: Checkout → Address selection → Default address

## 🔄 Admin Consumers

### **Admin Panel Usage**
- **admin/customers**: Customer profile information
- **admin/orders**: Customer address information for orders

## 📊 Complexity Metrics

### **High Complexity Components** (>150 LOC)
1. **profileController.js** - 200 LOC (comprehensive profile management)
2. **addressController.js** - 180 LOC (full CRUD address operations)

### **API Integration Points**
- **Profile Analytics**: User activity and completion tracking
- **Address Management**: Full CRUD with validation and defaults
- **Checkout Integration**: Address selection for order processing

## 🎯 Domain Responsibilities

### **Core Functions**
1. **Profile Completion**: Track and calculate profile completion
2. **Address Management**: Full CRUD operations for user addresses
3. **Default Address**: Manage default address selection
4. **Profile Analytics**: User activity and statistics
5. **Settings Management**: User preferences and settings
6. **Address Validation**: Validate address data and formats

### **Business Rules**
- Users can have multiple addresses with one default
- Profile completion affects user experience
- Address validation ensures delivery accuracy
- Default address is used for checkout if not specified
- Profile data is private to the user
- Address types include home, work, and other

## 🔧 Technical Implementation

### **Profile Flow**
```
Profile Request → Authentication → Data Calculation → Response
```

### **Address Management Flow**
```
Address Operation → Authentication → Validation → Database Update → Default Logic → Response
```

### **Default Address Logic**
```
Set Default → Remove Previous Default → Set New Default → Update User → Response
```

## 📈 Performance Considerations

### **Optimization Opportunities**
1. **Profile Caching**: Cache profile completion data
2. **Address Indexing**: Index addresses by user for faster queries
3. **Batch Operations**: Optimize multiple address operations
4. **Analytics Caching**: Cache user analytics data

### **Current Performance**
- **Bundle Impact**: ~630 LOC total
- **Database Queries**: Optimized user and address queries
- **Real-time Updates**: Efficient address state management

## 🔒 Security Considerations

### **Security Measures**
- **User Authentication**: All endpoints require authentication
- **Data Privacy**: Users can only access their own data
- **Address Validation**: Comprehensive address data validation
- **Input Sanitization**: All inputs are sanitized and validated

### **Data Protection**
- **Profile Privacy**: Profile data is private to the user
- **Address Security**: Secure address storage and transmission
- **Admin Access**: Limited admin access to user profiles
- **Data Encryption**: Sensitive data is properly encrypted

---

*This domain handles all profile and address functionality with focus on user privacy and data security.*