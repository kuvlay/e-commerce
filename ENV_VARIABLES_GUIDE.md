# 🔐 Environment Variables Setup Guide

## ✅ Project Cleaned Up!

All documentation and scripts moved to organized folders:
- 📁 `docs-archive/` - All .md files and reports
- 📁 `scripts/` - All test and utility scripts
- 📄 `README.md` - Clean project documentation

Changes pushed to GitHub! ✅

---

## 📊 How to View Environment Variables

### For Vercel (Frontend & Admin)

**Step 1: Go to Vercel Dashboard**
```
https://vercel.com/dashboard
```

**Step 2: Select Your Project**
- Click on your frontend project (e-commerce-v8m7)
- Or your admin project

**Step 3: View Environment Variables**
1. Click **"Settings"** tab (top navigation)
2. Click **"Environment Variables"** in left sidebar
3. You'll see all your environment variables listed here

**To Add/Edit:**
- Scroll down and click **"Add New"**
- Or click **"Edit"** next to existing variable
- Choose which environments: Production, Preview, Development

**Important Variables for Frontend:**
```
VITE_BACKEND_URL
VITE_GOOGLE_CLIENT_ID
```

---

### For Render (Backend)

**Step 1: Go to Render Dashboard**
```
https://dashboard.render.com
```

**Step 2: Select Your Backend Service**
- Click on your backend service from the list

**Step 3: View Environment Variables**
1. Click **"Environment"** tab (left sidebar)
2. You'll see all your environment variables listed here

**To Add/Edit:**
- Scroll down to "Environment Variables" section
- Click **"Add Environment Variable"**
- Or click existing variable to edit

**Important Variables for Backend:**
```
NODE_ENV
EMAIL_USER
EMAIL_PASSWORD
SKIP_EMAIL_VERIFICATION
AWAIT_EMAIL_SENDING
MONGODB_URI
JWT_SECRET
FRONTEND_URL
PORT
```

---

## 🎯 Required Environment Variables

### Backend (Render) - **CRITICAL**

```env
# Email Configuration (MUST HAVE)
EMAIL_USER=a.aarish312@gmail.com
EMAIL_PASSWORD=YOUR_EMAIL_APP_PASSWORD

# Email Settings (MUST HAVE)
SKIP_EMAIL_VERIFICATION=false
AWAIT_EMAIL_SENDING=false

# Environment (MUST HAVE)
NODE_ENV=production

# Database (MUST HAVE)
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER/YOUR_DATABASE

# Security (MUST HAVE)
JWT_SECRET=YOUR_RANDOM_JWT_SECRET

# URLs (MUST HAVE)
FRONTEND_URL=https://kharido.vercel.app
ADMIN_URL=https://kharido-admin.vercel.app

# Server (MUST HAVE)
PORT=5000

# Optional but Recommended
ADMIN_EMAIL=admin@kharido.com
ADMIN_PASSWORD=admin123
ADMIN_EMAILS=admin@kharido.com
ENABLE_SECURITY_LOGS=true
ENABLE_PERF_LOGS=false

# Payment (if using Razorpay)
RAZORPAY_KEY_ID=rzp_test_your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret

# Image Upload (if using Cloudinary)
CLOUDINARY_CLOUD_NAME=dgx65rxtl
CLOUDINARY_API_KEY=475863179722289
CLOUDINARY_API_SECRET=eSBNbnaLgz8cEiVzXfmmjhr7gg4

# OAuth (if using Google login)
GOOGLE_CLIENT_ID=331201534270-e85irnnh81pipkat5r576g4qut4q72gm.apps.googleusercontent.com
```

---

### Frontend (Vercel) - **CRITICAL**

```env
# Backend URL (MUST HAVE - Most Important!)
VITE_BACKEND_URL=https://kharido-backend.onrender.com

# OAuth (if using Google login)
VITE_GOOGLE_CLIENT_ID=331201534270-e85irnnh81pipkat5r576g4qut4q72gm.apps.googleusercontent.com
```

**⚠️ IMPORTANT:** Replace `kharido-backend` with your actual Render backend service name!

To find your Render backend URL:
1. Go to Render Dashboard
2. Click your backend service
3. Copy the URL at the top (e.g., `https://kharido-backend-abc123.onrender.com`)

---

## 📸 What to Share With Me

Please take screenshots and share:

### From Render (Backend):
1. Go to your backend service
2. Click "Environment" tab
3. Take screenshot of the environment variables list
4. **Note:** Values will be hidden (***), which is good for security

### From Vercel (Frontend):
1. Go to your frontend project
2. Settings → Environment Variables
3. Take screenshot of the variables list
4. **Note:** Values will be hidden, which is good for security

**Share the screenshots and I'll tell you:**
- ✅ Which variables are correct
- ❌ Which variables are missing
- 🔧 Which variables need to be updated
- 🗑️ Which variables can be removed

---

## 🚨 Most Critical Variables for Email Verification

**Backend (Render):**
```env
EMAIL_USER=a.aarish312@gmail.com       # ✅ MUST MATCH your Gmail
EMAIL_PASSWORD=YOUR_EMAIL_APP_PASSWORD        # ✅ MUST BE App Password
SKIP_EMAIL_VERIFICATION=false          # ✅ MUST BE false
AWAIT_EMAIL_SENDING=false              # ✅ MUST BE false (like localhost)
NODE_ENV=production                    # ✅ MUST BE production
```

**Frontend (Vercel):**
```env
VITE_BACKEND_URL=https://kharido-backend.onrender.com   # ✅ MUST BE exact Render URL
```

---

## 🔧 Common Issues

### Issue 1: Can't see environment variables in Vercel

**Solution:**
1. Make sure you're logged into the correct Vercel account
2. Make sure you're in the correct project
3. Click Settings → Environment Variables
4. Variables should be listed there

### Issue 2: Variables are hidden (showing ***)

**This is normal!** 
- Vercel and Render hide values for security
- You can click "Edit" to see/change the value
- Or delete and re-add the variable

### Issue 3: Changed variables but not working

**Solution:**
1. After changing variables, you MUST redeploy
2. Vercel: Deployments tab → Click ⋮ → Redeploy
3. Render: Automatically redeploys when you save variables
4. Wait 2-5 minutes for deployment to complete

---

## 📋 Checklist Before Sharing Screenshots

- [ ] Render Dashboard → Backend Service → Environment tab
- [ ] Take screenshot of environment variables
- [ ] Vercel Dashboard → Frontend Project → Settings → Environment Variables
- [ ] Take screenshot of environment variables
- [ ] Share both screenshots with me
- [ ] I'll review and tell you what to keep/remove/update

---

## 🎯 What I'll Check

When you share screenshots, I'll verify:

**For Backend:**
- ✅ EMAIL_USER and EMAIL_PASSWORD are set
- ✅ AWAIT_EMAIL_SENDING=false (critical!)
- ✅ MONGODB_URI is set
- ✅ JWT_SECRET is set
- ✅ NODE_ENV=production
- ✅ FRONTEND_URL is correct
- 🗑️ Any unused variables that can be removed

**For Frontend:**
- ✅ VITE_BACKEND_URL points to correct Render URL
- ✅ No trailing slash in URL
- 🗑️ Any unused variables that can be removed

---

## 🚀 Next Steps

1. **Go to Render Dashboard** and take screenshot of backend environment variables
2. **Go to Vercel Dashboard** and take screenshot of frontend environment variables
3. **Share both screenshots** with me
4. **I'll review** and tell you exactly what to do

Then we'll make sure production works exactly like your localhost! 🎉

