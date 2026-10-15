# E-commerce Application Troubleshooting Guide

## Common Issues and Solutions

### 1. Dashboard 404 Errors

#### Symptoms
- Admin dashboard shows continuous 404 errors
- Infinite retry loops when fetching dashboard stats
- Backend endpoint `/api/dashboard/stats` returns 404

#### Debugging Steps

1. **Check Backend URL Configuration**
   ```bash
   # Check admin .env file
   cat admin/.env
   
   # Verify VITE_BACKEND_URL is set correctly
   echo $VITE_BACKEND_URL
   ```

2. **Verify Backend Server is Running**
   ```bash
   # Test backend health
   curl http://localhost:5000/api/test
   curl https://your-backend-url.com/api/test
   ```

3. **Check Route Registration**
   - Verify `dashboardRouter` is properly mounted in `backend/server.js`
   - Check console logs for route mounting messages
   - Look for "Dashboard route accessed" logs

4. **Authentication Issues**
   ```bash
   # Test protected endpoint
   curl -H "token: YOUR_TOKEN" http://localhost:5000/api/dashboard/stats
   ```

#### Solutions

1. **Fix Backend URL Format**
   ```env
   # Correct format (no trailing slash, no /api)
   VITE_BACKEND_URL=https://e-commerce-4m87.onrender.com
   
   # Incorrect formats
   VITE_BACKEND_URL=https://e-commerce-4m87.onrender.com/
   VITE_BACKEND_URL=https://e-commerce-4m87.onrender.com/api
   ```

2. **Enable Debug Logging**
   - Check browser console for detailed request logs
   - Look for backend server logs showing incoming requests
   - Verify authentication middleware is working

3. **Render Deployment Issues**
   ```bash
   # Check Render service logs
   # Verify environment variables are set
   # Ensure backend service is not sleeping
   ```

### 2. Shipping Info Not Persisting

#### Symptoms
- Shipping info disappears after page refresh
- Carrier name and tracking number reset to empty
- Backend saves data but frontend doesn't display it

#### Debugging Steps

1. **Check Backend Response**
   ```bash
   # Verify order data includes shipping info
   curl -H "token: YOUR_TOKEN" http://localhost:5000/api/order/list
   ```

2. **Frontend State Management**
   - Check browser console for shipping info logs
   - Verify `fetchAllOrders` populates shipping data
   - Look for "Order has shipping info" console messages

3. **Database Verification**
   ```javascript
   // Check MongoDB data directly
   db.orders.find({"shippingInfo.carrier": {$exists: true}})
   ```

#### Solutions

1. **Backend Fixes**
   - Ensure `allOrders` controller includes shipping info in response
   - Add logging for shipping info retrieval
   - Verify database schema supports shipping info

2. **Frontend State Management**
   - Don't clear shipping info from local state after successful updates
   - Merge backend data with local state properly
   - Preserve unsaved shipping info during data refresh

### 3. Authentication and Token Issues

#### Symptoms
- "Session expired" messages
- 401 errors on API calls
- Admin unable to access protected routes

#### Debugging Steps

1. **Token Validation**
   ```javascript
   // Check token in browser localStorage
   console.log(localStorage.getItem('token'));
   
   // Verify token format and expiration
   // Check JWT payload
   ```

2. **Backend Auth Logs**
   - Look for authentication middleware logs
   - Check for token format validation messages
   - Verify admin credentials

#### Solutions

1. **Token Refresh**
   - Clear localStorage and re-login
   - Check token expiration times
   - Verify JWT secret consistency

2. **Admin Credentials**
   ```env
   # Verify admin environment variables
   ADMIN_EMAIL=your-admin@email.com
   ADMIN_PASSWORD=your-secure-password
   JWT_SECRET=your-jwt-secret
   ```

### 4. Environment Variable Setup

#### Development Setup
```env
# Backend .env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your-development-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# Frontend .env
VITE_BACKEND_URL=http://localhost:5000

# Admin .env
VITE_BACKEND_URL=http://localhost:5000
```

#### Production Setup (Render)
```env
# Backend environment variables in Render
NODE_ENV=production
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER/YOUR_DATABASE
JWT_SECRET=your-production-secret
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-production-password

# Frontend/Admin build settings
VITE_BACKEND_URL=https://your-backend-service.onrender.com
```

### 5. Common Render Deployment Issues

#### Backend Service Issues
1. **Service Sleeping**
   - Upgrade to paid plan to prevent sleeping
   - Implement health check endpoints
   - Use external monitoring services

2. **Build Failures**
   ```bash
   # Check build logs in Render dashboard
   # Verify package.json scripts
   # Check for missing dependencies
   ```

3. **Database Connection**
   ```javascript
   // Add connection logging
   mongoose.connection.on('connected', () => {
     console.log('MongoDB connected successfully');
   });
   ```

#### Frontend Deployment Issues
1. **Build Configuration**
   ```json
   // package.json
   {
     "scripts": {
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```

2. **Static Site Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables properly set

### 6. Testing and Verification Commands

#### Backend Health Check
```bash
# Test basic connectivity
curl https://your-backend.onrender.com/

# Test API endpoints
curl https://your-backend.onrender.com/api/test

# Test admin authentication
curl -X POST https://your-backend.onrender.com/api/user/admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

#### Frontend Testing
```javascript
// Test backend URL configuration
console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);

// Test API connectivity
fetch(import.meta.env.VITE_BACKEND_URL + '/api/test')
  .then(res => res.json())
  .then(data => console.log('API Test:', data));
```

### 7. Debug Logging in Production

#### Enable Backend Debugging
```javascript
// Add to server.js
if (process.env.NODE_ENV === 'production' && process.env.DEBUG_MODE === 'true') {
  // Enable detailed logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}
```

#### Environment Variable
```env
# Add to production environment
DEBUG_MODE=true
```

### 8. Step-by-Step Debugging Procedure

#### For Dashboard 404 Issues
1. Check browser network tab for actual request URL
2. Verify backend service is running and accessible
3. Test dashboard endpoint directly with curl
4. Check authentication token validity
5. Review backend route mounting logs
6. Verify environment variable configuration

#### For Shipping Info Issues
1. Check backend response includes shipping data
2. Verify frontend state management
3. Test status update API call
4. Check database for actual shipping info storage
5. Review console logs for shipping info handling

## Support and Resources

- **Backend Logs**: Check Render service logs for detailed error information
- **Frontend Console**: Use browser developer tools for client-side debugging
- **Database**: Use MongoDB Compass or CLI to verify data storage
- **Network**: Check browser network tab for API request/response details

## Quick Recovery Steps

1. **Complete Reset**
   ```bash
   # Clear browser storage
   localStorage.clear();
   
   # Restart backend service
   # Rebuild and redeploy frontend
   ```

2. **Environment Verification**
   ```bash
   # Check all environment variables
   # Verify service URLs
   # Test basic connectivity
   ```

3. **Database Check**
   ```bash
   # Verify MongoDB connection
   # Check collection data
   # Validate schema structure
   ```

Remember to always check the most recent logs and error messages for the most accurate troubleshooting information.