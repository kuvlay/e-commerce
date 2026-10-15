# Cart-Checkout Domain Map

## 📋 Domain Overview
- **Purpose**: Shopping cart operations and order processing
- **Responsibility**: Handle cart management and order creation
- **Frontend Consumers**: cart-checkout domain, orders domain
- **Admin Consumers**: admin orders domain, admin dashboard

## 📁 Components in this Domain

### **Controllers**
| Controller | File | Lines of Code | Purpose | Endpoints |
|------------|------|---------------|---------|-----------|
| cartController | `controllers/cartController.js` | ~180 LOC | Cart operations | `/api/cart/add`, `/api/cart/update`, `/api/cart/get`, `/api/cart/remove` |
| orderController | `controllers/orderController.js` | ~250 LOC | Order management | `/api/order/place`, `/api/order/list`, `/api/order/userorders`, `/api/order/status` |

### **Routes**
| Route | File | Lines of Code | Purpose | Methods |
|-------|------|---------------|---------|---------|
| cartRoute | `routes/cartRoute.js` | ~60 LOC | Cart API routes | POST /add, POST /update, POST /get, POST /remove |
| orderRoute | `routes/orderRoute.js` | ~70 LOC | Order API routes | POST /place, POST /list, POST /userorders, POST /status |

### **Models**
| Model | File | Lines of Code | Purpose | Collections |
|-------|------|---------------|---------|-------------|
| orderModel | `models/orderModel.js` | ~100 LOC | Order data structure | orders |

## 🔗 API Endpoints

### **Cart Management**
- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/update` - Update cart item quantity
- `POST /api/cart/get` - Get user's cart
- `POST /api/cart/remove` - Remove item from cart

### **Order Processing**
- `POST /api/order/place` - Place new order
- `POST /api/order/userorders` - Get user's orders
- `POST /api/order/verify` - Verify order after payment

### **Order Management (Admin)**
- `POST /api/order/list` - Get all orders (admin)
- `POST /api/order/status` - Update order status (admin)

## 🔄 Frontend Consumers

### **Primary Consumers**
- **cart-checkout domain**: CartDrawer.jsx, CartTotal.jsx, FinalCheckout.jsx, PaymentForm.jsx
- **orders domain**: TrackOrders.jsx, Verify.jsx
- **shared components**: Cart count displays, order status

### **API Usage Patterns**
- **Cart Operations**: Add/update/remove items → Real-time cart updates
- **Checkout Flow**: Cart → Address → Payment → Order creation
- **Order Tracking**: User orders → Status updates → Delivery tracking

## 🔄 Admin Consumers

### **Admin Panel Usage**
- **admin/orders**: Order.jsx uses order management endpoints
- **admin/dashboard**: Dashboard.jsx uses order statistics
- **admin/customers**: Customer order history

## 📊 Complexity Metrics

### **High Complexity Components** (>200 LOC)
1. **orderController.js** - 250 LOC (comprehensive order management)

### **API Integration Points**
- **Cart State Management**: Real-time cart updates across components
- **Order Processing**: Multi-step checkout with validation
- **Admin Order Management**: Full order lifecycle management
- **Payment Integration**: Order creation after payment verification

## 🎯 Domain Responsibilities

### **Core Functions**
1. **Cart Management**: Add, update, remove cart items
2. **Order Creation**: Process checkout and create orders
3. **Order Tracking**: Provide order status and tracking
4. **Order Management**: Admin order processing and status updates
5. **Cart Persistence**: Maintain cart across user sessions
6. **Order Validation**: Validate orders before processing

### **Business Rules**
- Cart requires user authentication for persistence
- Orders must have valid shipping address
- Order status follows defined workflow
- Cart items must be available at checkout
- Order totals must match cart calculations
- Payment verification required before order confirmation

## 🔧 Technical Implementation

### **Cart Flow**
```
Cart Action → Authentication → Validation → Database Update → Response
```

### **Order Flow**
```
Checkout → Validation → Address Check → Payment → Order Creation → Confirmation
```

### **Order Status Flow**
```
Order Created → Processing → Shipped → Delivered → Completed
```

## 📈 Performance Considerations

### **Optimization Opportunities**
1. **Cart Caching**: Cache cart data for faster access
2. **Order Indexing**: Index orders by user and status
3. **Batch Operations**: Optimize bulk cart operations
4. **Status Updates**: Efficient order status tracking

### **Current Performance**
- **Bundle Impact**: ~660 LOC total
- **Database Queries**: Optimized cart and order queries
- **Real-time Updates**: Efficient cart state management

## 🔒 Security Considerations

### **Security Measures**
- **User Authentication**: Cart and orders require authentication
- **Order Validation**: Comprehensive order data validation
- **Payment Security**: Secure payment processing integration
- **Admin Authorization**: Order management requires admin rights

### **Data Protection**
- **User Cart Privacy**: Users can only access their own cart
- **Order Privacy**: Users can only view their own orders
- **Admin Access**: Admins can manage all orders
- **Payment Data**: Secure handling of payment information

---

*This domain handles all cart and order functionality with focus on security and reliable order processing.*