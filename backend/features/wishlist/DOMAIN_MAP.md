# Wishlist Domain Map

## 📋 Domain Overview
- **Purpose**: User wishlist functionality
- **Responsibility**: Handle wishlist operations and management
- **Frontend Consumers**: products domain, shared components
- **Admin Consumers**: admin analytics (wishlist statistics)

## 📁 Components in this Domain

### **Controllers**
| Controller | File | Lines of Code | Purpose | Endpoints |
|------------|------|---------------|---------|-----------|
| wishlistController | `controllers/wishlistController.js` | ~150 LOC | Wishlist operations | `/api/wishlist/get`, `/api/wishlist/add`, `/api/wishlist/remove` |

### **Routes**
| Route | File | Lines of Code | Purpose | Methods |
|-------|------|---------------|---------|---------|
| wishlistRoute | `routes/wishlistRoute.js` | ~40 LOC | Wishlist API routes | GET /get, POST /add, POST /remove |

## 🔗 API Endpoints

### **Wishlist Management**
- `GET /api/wishlist/get` - Get user's wishlist
- `POST /api/wishlist/add` - Add product to wishlist
- `POST /api/wishlist/remove` - Remove product from wishlist
- `POST /api/wishlist/clear` - Clear entire wishlist

## 🔄 Frontend Consumers

### **Primary Consumers**
- **products domain**: ProductCard.jsx (wishlist toggle)
- **shared components**: Wishlist count displays
- **core context**: WishlistContext.jsx

### **API Usage Patterns**
- **Wishlist Toggle**: Product cards → Add/remove from wishlist
- **Wishlist Display**: Wishlist page → Get wishlist items
- **Wishlist Count**: Navigation → Real-time wishlist count

## 🔄 Admin Consumers

### **Admin Panel Usage**
- **admin/analytics**: Wishlist statistics and popular items
- **admin/dashboard**: Wishlist metrics

## 📊 Complexity Metrics

### **Medium Complexity Components** (100-200 LOC)
1. **wishlistController.js** - 150 LOC (wishlist management)

### **API Integration Points**
- **Product Integration**: Links with product data
- **User Integration**: User-specific wishlist management
- **Real-time Updates**: Instant wishlist state changes

## 🎯 Domain Responsibilities

### **Core Functions**
1. **Wishlist Management**: Add, remove, and view wishlist items
2. **Wishlist Persistence**: Maintain wishlist across sessions
3. **Wishlist Count**: Provide real-time wishlist count
4. **Wishlist Validation**: Ensure wishlist items are valid
5. **User Association**: Link wishlist to authenticated users

### **Business Rules**
- Wishlist requires user authentication
- Users can only access their own wishlist
- Duplicate items are not allowed in wishlist
- Wishlist persists across user sessions
- Wishlist items must be valid products
- Wishlist has no size limit (configurable)

## 🔧 Technical Implementation

### **Wishlist Flow**
```
Wishlist Action → Authentication → Validation → Database Update → Response
```

### **Add/Remove Flow**
```
Toggle Request → Check Existence → Add/Remove → Update Count → Response
```

## 📈 Performance Considerations

### **Optimization Opportunities**
1. **Wishlist Caching**: Cache wishlist data for faster access
2. **Batch Operations**: Optimize multiple wishlist operations
3. **Count Caching**: Cache wishlist count for quick display
4. **Product Validation**: Efficient product existence checks

### **Current Performance**
- **Bundle Impact**: ~190 LOC total
- **Database Queries**: Optimized wishlist queries
- **Real-time Updates**: Efficient wishlist state management

## 🔒 Security Considerations

### **Security Measures**
- **User Authentication**: All endpoints require authentication
- **Data Privacy**: Users can only access their own wishlist
- **Input Validation**: Product IDs are validated
- **Rate Limiting**: Prevent wishlist spam

### **Data Protection**
- **Wishlist Privacy**: Wishlist data is private to the user
- **Product Validation**: Ensure wishlist items are valid products
- **User Association**: Secure user-wishlist association

---

*This domain handles all wishlist functionality with focus on user experience and data privacy.*