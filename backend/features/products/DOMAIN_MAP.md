# Products Domain Map

## 📋 Domain Overview
- **Purpose**: Product catalog management, search, and product operations
- **Responsibility**: Handle all product-related API operations
- **Frontend Consumers**: products domain, home page, shared components
- **Admin Consumers**: admin products domain, admin dashboard

## 📁 Components in this Domain

### **Controllers**
| Controller | File | Lines of Code | Purpose | Endpoints |
|------------|------|---------------|---------|-----------|
| productController | `controllers/productController.js` | ~350 LOC | Product CRUD operations | `/api/product/list`, `/api/product/add`, `/api/product/remove`, `/api/product/featured`, `/api/product/toggle-featured` |

### **Routes**
| Route | File | Lines of Code | Purpose | Methods |
|-------|------|---------------|---------|---------|
| productRoute | `routes/productRoute.js` | ~80 LOC | Product API routes | GET /list, POST /add, POST /remove, GET /featured, POST /toggle-featured |

### **Models**
| Model | File | Lines of Code | Purpose | Collections |
|-------|------|---------------|---------|-------------|
| productModel | `models/productModel.js` | ~150 LOC | Product data structure with measurements | products |

## 🔗 API Endpoints

### **Product Catalog**
- `GET /api/product/list` - Get all products
- `GET /api/product/featured` - Get featured products
- `GET /api/product/single/:id` - Get single product details
- `GET /api/product/search` - Search products
- `GET /api/product/category/:category` - Get products by category

### **Product Management (Admin)**
- `POST /api/product/add` - Add new product
- `POST /api/product/remove` - Remove product
- `POST /api/product/update` - Update product
- `POST /api/product/toggle-featured` - Toggle featured status

## 🔄 Frontend Consumers

### **Primary Consumers**
- **products domain**: Collection.jsx, Product.jsx, ProductCard.jsx, ProductGrid.jsx
- **home page**: Home.jsx (for featured products)
- **shared components**: Search functionality, product displays

### **API Usage Patterns**
- **Product Catalog**: Frontend → `/api/product/list` → Product display
- **Featured Products**: Home page → `/api/product/featured` → Hero sections
- **Product Details**: Product page → `/api/product/single/:id` → Detailed view
- **Search**: Search component → `/api/product/search` → Filtered results

## 🔄 Admin Consumers

### **Admin Panel Usage**
- **admin/products**: Add.jsx, List.jsx use product management endpoints
- **admin/dashboard**: Dashboard.jsx uses `/api/product/list` for statistics

## 📊 Complexity Metrics

### **High Complexity Components** (>200 LOC)
1. **productController.js** - 350 LOC (comprehensive product management)

### **API Integration Points**
- **Product Display**: Multiple frontend components consume product data
- **Admin Management**: Full CRUD operations for product management
- **Search Integration**: Real-time product search functionality
- **Featured Products**: Dynamic featured product management

## 🎯 Domain Responsibilities

### **Core Functions**
1. **Product Catalog**: Manage product listings and display
2. **Product Search**: Provide search and filtering capabilities
3. **Featured Products**: Manage featured product selections
4. **Product CRUD**: Complete product management for admin
5. **Category Management**: Handle product categories and subcategories
6. **Measurement System**: Support dynamic product measurements

### **Business Rules**
- Products must have at least one measurement option
- Featured products are limited to a specific number
- Product images are managed through Cloudinary
- Categories and subcategories must be valid
- Measurements include individual pricing
- Product availability affects search results

## 🔧 Technical Implementation

### **Product Data Flow**
```
Frontend Request → Route → Controller → Model → Database → Response
```

### **Search Implementation**
```
Search Query → Validation → Database Query → Filter → Sort → Response
```

### **Featured Products Logic**
```
Toggle Request → Validation → Update Database → Reorder Featured → Response
```

## 📈 Performance Considerations

### **Optimization Opportunities**
1. **Product Caching**: Cache frequently accessed products
2. **Search Optimization**: Implement search indexing
3. **Image Optimization**: Optimize product image loading
4. **Pagination**: Implement pagination for large product lists

### **Current Performance**
- **Bundle Impact**: ~580 LOC total
- **Database Queries**: Optimized product queries
- **Image Handling**: Cloudinary integration for image management

## 🔒 Security Considerations

### **Security Measures**
- **Admin Authentication**: Product management requires admin authentication
- **Input Validation**: All product data is validated
- **Image Upload Security**: Secure image upload through Cloudinary
- **SQL Injection Prevention**: Mongoose ODM prevents injection attacks

### **Access Control**
- **Public Endpoints**: Product listing and details are public
- **Admin Endpoints**: Product management requires admin authentication
- **Image Upload**: Secure file upload with validation

---

*This domain handles all product-related functionality with focus on performance and comprehensive product management.*