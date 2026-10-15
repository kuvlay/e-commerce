# 🔗 Forever E-commerce - Global Dependency Map

> **Auto-generated on**: 2025-01-13  
> **Total Files**: 138 JS/JSX files  
> **Last Updated**: Phase 1 - Documentation Restructure ✅

## 📊 **Project Overview**

| Component | Files | Lines of Code | Backend APIs Used | Admin Integration |
|-----------|-------|---------------|-------------------|-------------------|
| **Frontend** | 85 files | ~12,000 LOC | 15 API endpoints | N/A |
| **Backend** | 35 files | ~8,000 LOC | N/A | Serves Admin |
| **Admin** | 18 files | ~4,000 LOC | 12 API endpoints | Uses Backend |

---

## 🎯 **Domain-to-Domain Connections**

### **Frontend → Backend API Mapping**

| Frontend Domain | Components | Backend Domain | API Endpoints | Lines of Code |
|----------------|------------|----------------|---------------|---------------|
| **Authentication** | Login.jsx, Profile.jsx, Account.jsx, UserContext.jsx | authentication | `/api/user/admin`, `/api/profile/completion` | ~800 LOC |
| **Products** | ProductCard.jsx, ProductGrid.jsx, ProductItem.jsx, ShopContext.jsx | products | `/api/product/list`, `/api/product/featured` | ~1,200 LOC |
| **Cart-Checkout** | CartDrawer.jsx, CartTotal.jsx, PaymentForm.jsx | orders, payments | `/api/cart/add`, `/api/cart/update`, `/api/cart/get`, `/api/payment/create-order`, `/api/payment/verify-payment` | ~900 LOC |
| **Orders** | TrackOrders.jsx, Verify.jsx | orders | `/api/order/userorders` | ~400 LOC |
| **Profile** | AddressManager.jsx, ProfileCompletion.jsx, Settings.jsx | profile | `/api/address/list`, `/api/address/delete`, `/api/address/set-default`, `/api/profile/completion` | ~600 LOC |
| **Wishlist** | WishlistContext.jsx | wishlist | `/api/wishlist/get`, `/api/wishlist/add`, `/api/wishlist/remove` | ~200 LOC |
| **Contact** | Contact.jsx | contact | `/api/contact/submit` | ~300 LOC |

### **Admin → Backend API Mapping**

| Admin Domain | Components | Backend Domain | API Endpoints | Lines of Code |
|-------------|------------|----------------|---------------|---------------|
| **Products** | Add.jsx, List.jsx, CustomCategoryModal.jsx | products | `/api/product/add`, `/api/product/list`, `/api/product/remove`, `/api/product/toggle-featured` | ~800 LOC |
| **Orders** | Order.jsx | orders | `/api/order/list`, `/api/order/status` | ~400 LOC |
| **Customers** | Customers.jsx | orders | `/api/order/list` (for customer data) | ~200 LOC |
| **Messages** | Messages.jsx | contact | `/api/contact/messages`, `/api/contact/stats`, `/api/contact/update-status`, `/api/contact/delete` | ~500 LOC |
| **Dashboard** | Dashboard.jsx | products, orders | `/api/product/list`, `/api/order/list` | ~300 LOC |
| **Auth** | Login.jsx | authentication | `/api/user/admin` | ~150 LOC |

---

## 🔄 **Cross-Domain Dependencies**

### **Shared Components Usage**

| Shared Component | Used by Frontend | Used by Admin | Lines of Code |
|------------------|------------------|---------------|---------------|
| **Navbar** | All pages | Admin layout | ~150 LOC |
| **Footer** | All pages | N/A | ~100 LOC |
| **Title** | Multiple pages | Multiple pages | ~50 LOC |
| **SkeletonLoader** | Product pages | List pages | ~80 LOC |

### **Context Dependencies**

| Context | Components Using It | Backend APIs | Lines of Code |
|---------|-------------------|--------------|---------------|
| **ShopContext** | ProductCard, ProductGrid, CartDrawer, Home | `/api/product/*`, `/api/cart/*` | ~400 LOC |
| **UserContext** | Navbar, Profile, Account | `/api/user/*` | ~200 LOC |
| **WishlistContext** | ProductCard, Wishlist pages | `/api/wishlist/*` | ~150 LOC |

---

## 🚀 **API Endpoint Registry**

### **Backend Endpoints by Domain**

| Domain | Endpoint | Method | Used by Frontend | Used by Admin | Controller |
|--------|----------|--------|------------------|---------------|------------|
| **Authentication** | `/api/user/admin` | POST | Login.jsx | Login.jsx | userController.js |
| **Products** | `/api/product/list` | GET | ShopContext.jsx | List.jsx, Dashboard.jsx | productController.js |
| **Products** | `/api/product/featured` | GET | ShopContext.jsx | N/A | productController.js |
| **Products** | `/api/product/add` | POST | N/A | Add.jsx | productController.js |
| **Products** | `/api/product/remove` | POST | N/A | List.jsx | productController.js |
| **Products** | `/api/product/toggle-featured` | POST | N/A | List.jsx | productController.js |
| **Cart** | `/api/cart/add` | POST | ShopContext.jsx | N/A | cartController.js |
| **Cart** | `/api/cart/update` | POST | ShopContext.jsx | N/A | cartController.js |
| **Cart** | `/api/cart/get` | POST | ShopContext.jsx | N/A | cartController.js |
| **Orders** | `/api/order/userorders` | POST | TrackOrders.jsx | N/A | orderController.js |
| **Orders** | `/api/order/list` | POST | N/A | Order.jsx, Dashboard.jsx, Customers.jsx | orderController.js |
| **Orders** | `/api/order/status` | POST | N/A | Order.jsx | orderController.js |
| **Payments** | `/api/payment/create-order` | POST | PaymentForm.jsx | N/A | payment.js |
| **Payments** | `/api/payment/verify-payment` | POST | PaymentForm.jsx | N/A | payment.js |
| **Profile** | `/api/profile/completion` | GET | ProfileCompletion.jsx | N/A | profileController.js |
| **Address** | `/api/address/list` | GET | AddressManager.jsx | N/A | addressController.js |
| **Address** | `/api/address/delete` | POST | AddressManager.jsx | N/A | addressController.js |
| **Address** | `/api/address/set-default` | POST | AddressManager.jsx | N/A | addressController.js |
| **Wishlist** | `/api/wishlist/get` | GET | WishlistContext.jsx | N/A | wishlistController.js |
| **Wishlist** | `/api/wishlist/add` | POST | WishlistContext.jsx | N/A | wishlistController.js |
| **Wishlist** | `/api/wishlist/remove` | POST | WishlistContext.jsx | N/A | wishlistController.js |
| **Contact** | `/api/contact/submit` | POST | Contact.jsx | N/A | contactController.js |
| **Contact** | `/api/contact/messages` | GET | N/A | Messages.jsx | contactController.js |
| **Contact** | `/api/contact/stats` | GET | N/A | Messages.jsx | contactController.js |
| **Contact** | `/api/contact/update-status` | POST | N/A | Messages.jsx | contactController.js |
| **Contact** | `/api/contact/delete` | POST | N/A | Messages.jsx | contactController.js |

---

## 📈 **Complexity Metrics**

### **High-Complexity Components** (>200 LOC)
1. **ShopContext.jsx** - 400+ LOC (manages products, cart, user state)
2. **Add.jsx** - 300+ LOC (product creation form)
3. **Order.jsx** - 350+ LOC (order management)
4. **Contact.jsx** - 250+ LOC (contact form with validation)
5. **Messages.jsx** - 300+ LOC (admin message management)

### **API-Heavy Components** (>3 endpoints)
1. **Messages.jsx** - 4 endpoints
2. **AddressManager.jsx** - 3 endpoints  
3. **ShopContext.jsx** - 5 endpoints
4. **List.jsx** - 3 endpoints

---

## 🔧 **Restructure Impact Analysis**

### **Phase 1: Documentation** ✅ COMPLETED
- **Files moved**: 15 MD files organized into 6 categories
- **Impact**: Zero code changes, improved navigation
- **Benefit**: Centralized documentation with clear structure
- **Structure Created**: 
  - `/docs/architecture/` - System architecture and dependencies
  - `/docs/project/` - Project guides and implementation plans
  - `/docs/development/` - Development, testing, and maintenance
  - `/docs/features/` - Feature-specific documentation
  - `/docs/deployment/` - Deployment guides and configurations
  - `/docs/security/` - Security audits and reports
  - `/docs/reports/` - Analysis reports and change logs

### **Phase 2: Frontend Domains** ✅ COMPLETED
- **Files moved**: 85+ files organized into 8 domains
- **Import changes**: ~200 import statements (Phase 2.1 needed)
- **Benefit**: Clear feature boundaries with domain-driven design
- **Structure Created**:
  - **8 Business Domains**: authentication, products, cart-checkout, orders, reviews, profile, contact, shared
  - **Domain Maps**: Each domain has DOMAIN_MAP.md with API connections
  - **Shared Components**: 4 categories (layout, ui, media, business)
  - **Core Infrastructure**: Centralized hooks, context, utils, services

### **Phase 3: Backend Domains** ✅ COMPLETED
- **Files moved**: 35+ files organized into 7 domains
- **Route changes**: 25 route definitions updated in server.js
- **Benefit**: Matching frontend structure with domain-driven API design
- **Structure Created**:
  - **7 Business Domains**: authentication, products, cart-checkout, payments, profile, wishlist, contact
  - **Domain Maps**: Each domain has DOMAIN_MAP.md with frontend/admin consumers
  - **Core Infrastructure**: Shared config, middleware, and scripts
  - **Server Integration**: Updated server.js with new domain imports

### **Phase 4: Admin Domains** 🔄
- **Files to move**: 18 files
- **Import changes**: ~50 import statements
- **Benefit**: Consistent structure

---

## 🎯 **Next Steps**

1. **Create domain-specific DOMAIN_MAP.md files**
2. **Build automated dependency analyzer**
3. **Implement domain-based folder structure**
4. **Update all import paths**
5. **Validate all connections work**

---

*This file is auto-updated during each restructure phase*