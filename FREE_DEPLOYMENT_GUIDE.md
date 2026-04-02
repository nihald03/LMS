# Free Deployment Guide - Complete Step-by-Step

**Status**: 100% Free Using  
**Stack**: MERN (React + Node.js + MongoDB)  
**Estimated Setup Time**: 30-45 minutes  
**Monthly Cost**: $0 ✅

---

## 🎯 Free Deployment Architecture

```
Frontend                Backend API             Database
(Vercel Free)          (Render Free)          (MongoDB Atlas Free)
   ↓                       ↓                       ↓
React App           Node.js/Express         MongoDB M0
Unlimited            Cold Starts OK          512MB Free
Bandwidth            (15 min sleep)          Forever Free
```

---

## 📋 Summary - What We'll Set Up

| Component | Free Service | Tier | Cost |
|-----------|--------------|------|------|
| **Frontend** | Vercel | Hobby | $0 |
| **Backend** | Render | Free | $0 |
| **Database** | MongoDB Atlas | M0 | $0 |
| **Storage** | MongoDB Atlas | Included | $0 |
| **Domain** | freenom | Free | $0 |
| **Total** | | | **$0/month** |

> **Note**: Free tiers have limitations. Backend will sleep after 15 minutes of inactivity (cold start ~10 seconds first request).

---

# 🚀 STEP-BY-STEP DEPLOYMENT PLAN

---

## PHASE 1: Prepare Your Code (15 minutes)

### Step 1.1: Check Your Code is Ready
```bash
# Make sure you're on main branch
git checkout main

# Verify no uncommitted changes
git status
# Should show: "nothing to commit, working tree clean"
```

### Step 1.2: Ensure .env.example Files Exist
These files should already exist in your project:

**File: Backend/.env.example**
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=production
CORS_ORIGIN=your_frontend_url
```

**File: Frontend/.env.example**
```env
VITE_API_BASE_URL=your_backend_api_url
VITE_APP_NAME=LMS
```

✅ Both should exist in your repository.

---

## PHASE 2: Create MongoDB Atlas Account (10 minutes)

### Step 2.1: Go to MongoDB Atlas
**URL**: 👉 https://www.mongodb.com/cloud/atlas

### Step 2.2: Sign Up (Click "Sign Up")
- Click **"Try Free"** at the top
- Choose **"Sign up with Email"** (or Google)
- Enter:
  - Email: your@email.com
  - Password: strong_password_here
  - First Name: Your Name
  - Last Name: Your Surname
- Check privacy boxes
- Click **"Create Your Atlas Account"**

### Step 2.3: Verify Email
- Check your email and click verification link
- Complete email verification

### Step 2.4: Create Free Cluster (M0)
After verification:
1. Click **"Build a Database"** button
2. Choose **"M0 FREE"** (should be preselected)
3. Click **"Create Cluster"**
4. For **Cloud Provider**: Select **"AWS"**
5. For **Region**: Choose closest to you (or us-east-1)
6. Click **"Create Deployment"**

⏳ Wait 2-3 minutes for cluster to deploy...

### Step 2.5: Create Database User (Credentials)
1. Go to **"Database Access"** from left menu
2. Click **"+ Add New Database User"**
3. Fill in:
   - **Username**: `lms_user` (or any name)
   - **Password**: Generate secure password (copy it!)
   - **Built-in Role**: Select **"Editor"**
4. Click **"Add User"**

**⚠️ SAVE THIS INFORMATION**:
```
USERNAME: lms_user
PASSWORD: [your_generated_password]
```

### Step 2.6: Whitelist Your IP (Allow Connections)
1. Go to **"Network Access"** from left menu
2. Click **"+ Add IP Address"**
3. Click **"Add Current IP Address"** (OR)
4. For development, select **"Allow access from anywhere"** and enter `0.0.0.0/0`
5. Click **"Confirm"**

### Step 2.7: Get Connection String
1. Go back to **"Databases"** (left menu)
2. Click **"Connect"** button on your cluster
3. Choose **"Drivers"**
4. Select **"Node.js"** and version **"4.x or later"**
5. Copy the connection string

**Connection String looks like**:
```
mongodb+srv://lms_user:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

6. Replace:
   - `lms_user` with your username
   - `PASSWORD` with your actual password
   - `myFirstDatabase` with `lms` (or `myFirstDatabase`)

**Final Connection String**:
```
mongodb+srv://lms_user:your_password@cluster0.xxxxx.mongodb.net/lms?retryWrites=true&w=majority
```

✅ **SAVE THIS** - You'll need it in a few steps!

---

## PHASE 3: Deploy Backend to Render (10 minutes)

### Step 3.1: Create Render Account
**URL**: 👉 https://render.com

1. Click **"Get Started"** (top right)
2. Choose **"Sign up with GitHub"**
3. Authorize Render to access your GitHub account
4. Complete profile setup

### Step 3.2: Connect GitHub Repository
1. After signing in, click **"New +"** (top right)
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select **`nihald03/LMS`** repository
5. Click **"Connect"**

### Step 3.3: Configure Backend Deployment
Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `lms-api` |
| **Environment** | `Node` |
| **Region** | `Oregon (US West)` |
| **Branch** | `main` |
| **Build Command** | `cd Backend && npm install` |
| **Start Command** | `cd Backend && npm start` |

### Step 3.4: Set Environment Variables
Scroll down to **"Environment"** section:

1. Click **"Add Environment Variables"**
2. Add these variables:

```
MONGODB_URI = mongodb+srv://lms_user:password@cluster0.xxxxx.mongodb.net/lms?retryWrites=true&w=majority
JWT_SECRET = your_super_secret_key_minimum_32_characters_long
NODE_ENV = production
PORT = 5000
CORS_ORIGIN = https://your-frontend-url-here.vercel.app
```

> **Replace**: 
> - MongoDB URI with your connection string from Step 2.7
> - JWT_SECRET with a strong random string
> - CORS_ORIGIN will be your Vercel URL (we'll get it in next step)

### Step 3.5: Deploy
1. Click **"Create Web Service"** button
2. Wait for deployment (2-3 minutes)
3. You'll see a URL like: `https://lms-api.render.com`

✅ **SAVE THIS URL** - You'll need it for frontend!

### Step 3.6: Verify Backend is Running
After deployment completes:
1. Copy your backend URL: `https://lms-api.render.com`
2. Open in browser: `https://lms-api.render.com/api/health`
3. You should see JSON response: `{"status":"ok","timestamp":"...","uptime":...}`

✅ Backend is running!

---

## PHASE 4: Deploy Frontend to Vercel (10 minutes)

### Step 4.1: Create Vercel Account
**URL**: 👉 https://vercel.com

1. Click **"Sign Up"** (top right)
2. Choose **"Continue with GitHub"**
3. Authorize Vercel
4. Complete setup

### Step 4.2: Import Your Project
1. After signing in, click **"Add New..."** (top left)
2. Select **"Project"**
3. Click **"Import Git Repository"**
4. Paste your GitHub URL: `https://github.com/nihald03/LMS`
5. Click **"Import"**

### Step 4.3: Configure Deployment
1. **Project Name**: Keep as `LMS`
2. **Framework Preset**: Choose **"Vite"**
3. **Root Directory**: Click **"Edit"** and select `Frontend`
4. **Build Command**: Should be `npm run build`
5. **Output Directory**: Should be `dist`
6. **Install Command**: `npm install`

### Step 4.4: Add Environment Variables
In the form, find **"Environment Variables"** section:

1. Click **"Add"**
2. Add this variable:

```
VITE_API_BASE_URL = https://lms-api.render.com/api
```

> Replace with your Render backend URL from Step 3.5

### Step 4.5: Deploy
1. Click **"Deploy"** button
2. Wait for deployment (3-5 minutes)
3. You'll see a success message with URL like: `https://lms-frontend.vercel.app`

✅ **COPY THIS URL** - Frontend is deployed!

### Step 4.6: Update Backend CORS
Now that you have frontend URL, update backend environment variables:

1. Go back to **Render.com** in another tab
2. Open your `lms-api` service
3. Go to **"Environment"** tab
4. Edit **`CORS_ORIGIN`** variable
5. Change to: `https://lms-frontend.vercel.app` (your actual URL)
6. Click **"Save"** (or "Update")

Render will redeploy automatically.

### Step 4.7: Verify Frontend
1. Open your Vercel URL: `https://lms-frontend.vercel.app`
2. You should see your LMS home page loading
3. Try to:
   - Register a new account
   - Login
   - Browse courses

✅ Frontend is running!

---

## PHASE 5: Configure Custom Domain (Free) [OPTIONAL]

If you want a free domain instead of `vercel.app`:

### Step 5.1: Get Free Domain from Freenom
**URL**: 👉 https://www.freenom.com

1. Go to Freenom homepage
2. Click **"Find a new Free Domain"** (top)
3. Search for domain (e.g., `mylms.tk` or `mylms.ml`)
4. Click **"Checkout"**
5. Set period to 12 months (free)
6. Complete registration (create Freenom account if needed)

### Step 5.2: Connect Domain to Vercel (Frontend)
1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your **`LMS`** project
3. Go to **"Settings"** tab
4. Click **"Domains"**
5. Enter your domain (e.g., `mylms.tk`)
6. Click **"Add"**
7. Vercel will show nameservers to add

### Step 5.3: Update Freenom Nameservers
1. Go back to **Freenom**: https://www.freenom.com/en/clientarea.html
2. Go to **"My Domains"**
3. Select your domain
4. Click **"Management Tools"** → **"Nameservers"**
5. Change to custom nameservers:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
6. Click **"Save"**

⏳ Wait 15-30 minutes for DNS propagation

### Step 5.4: Update Backend CORS & Frontend API URL
**In Render Backend**:
- Update `CORS_ORIGIN` to: `https://mylms.tk`

**In Vercel Frontend**:
- Update `VITE_API_BASE_URL` to: `https://api.mylms.tk/api`

Then set up subdomain routing (advanced - see Phase 6)

---

## PHASE 6: Setup API Subdomain [OPTIONAL - ADVANCED]

To have `api.mylms.tk` pointing to your backend:

### Step 6.1: Create Render Custom Domain
1. Go to **Render.com** → Your **`lms-api`** service
2. Click **"Settings"** tab
3. Scroll to **"Custom Domain"**
4. Click **"Add Custom Domain"**
5. Enter: `api.mylms.tk`
6. Click **"Save"**
7. Note the CNAME record shown

### Step 6.2: Add CNAME to Freenom
1. Go to **Freenom Management**: https://www.freenom.com/en/clientarea.html
2. Click your domain → **"Manage Domain"**
3. Go to **"Manage Freenom DNS"**
4. Add DNS Records:
   - **Type**: CNAME
   - **Name**: `api`
   - **Target**: (value from Render CNAME)
5. Click **"Save Changes"**

⏳ Wait 15-30 minutes for DNS update

---

## PHASE 7: Test Everything (5 minutes)

### Step 7.1: Frontend Tests
- [ ] Open your frontend URL
- [ ] Register new account
- [ ] Login with account
- [ ] Browse courses section
- [ ] Check console for errors (F12)

### Step 7.2: Backend Tests
- [ ] Open API health: `https://lms-api.render.com/api/health`
- [ ] Should return JSON with `status: "ok"`
- [ ] Check Render logs for errors

### Step 7.3: Integration Tests
- [ ] Frontend should connect to backend
- [ ] Can create courses (teacher)
- [ ] Can enroll in courses (student)
- [ ] Can view uploaded content

---

## 📊 Deployment Summary Table

| Component | Service | URL | Status |
|-----------|---------|-----|--------|
| **Frontend** | Vercel | https://lms-frontend.vercel.app | ✅ Live |
| **Backend** | Render | https://lms-api.render.com | ✅ Live |
| **Database** | MongoDB Atlas | Connected via URI | ✅ Live |
| **Domain** | Freenom | mylms.tk (optional) | ⏳ Optional |

---

## ⚠️ Free Tier Limitations & Solutions

### Backend (Render) - Cold Starts
**Problem**: Service sleeps after 15 minutes, slow first request (~10 seconds)

**Solution**:
- First request takes ~10 seconds
- Subsequent requests are instant
- To keep "warm": Ping health endpoint every 10 minutes using:
  ```javascript
  // Add to your monitoring
  setInterval(() => {
    fetch('https://lms-api.render.com/api/health')
  }, 600000) // Every 10 minutes
  ```

### Database (MongoDB Atlas M0)
**Limit**: 512MB storage

**What you get**:
- 512MB for data
- Perfect for small-medium deployments
- ~10,000+ course records typically
- Shared cluster (slower, but free)

**Upgrade path**: If you exceed, upgrade to M2 ($57/month)

### Frontend (Vercel)
**No practical limits**:
- Unlimited bandwidth
- Fast builds
- Global CDN included
- True serverless function calls

---

## 🔐 Important: Keep Secrets Secure

### DO NOT share these:
- ❌ MongoDB password
- ❌ JWT secret
- ❌ API keys
- ❌ Connection strings (with credentials)

### Set them ONLY in:
- ✅ Render Environment Variables (hidden)
- ✅ Vercel Environment Variables (hidden)
- ✅ `.env` local file (git-ignored)

### Never commit to GitHub:
- `.env` file
- Database credentials
- API keys

---

## 📱 Accessing Your Deployment

### Once Live:

**Student Access**:
```
URL: https://lms-frontend.vercel.app
1. Click "Sign Up"
2. Enter email, password
3. Choose "Student" role
4. Enroll in courses
5. Submit assignments
```

**Teacher Access**:
```
URL: https://lms-frontend.vercel.app
1. Click "Sign Up"
2. Enter email, password
3. Choose "Teacher" role
4. Create courses
5. Upload lectures
6. Create assignments & quizzes
```

**Admin Access**:
```
First admin account must be created manually:
1. Connect to MongoDB Atlas
2. Add user with ROLE: "admin"
3. Or modify in MongoDB dashboard
```

---

## 🔄 Continuous Updates

### To Update Your Deployment:

**After code changes**:
```bash
# 1. Commit changes locally
git add .
git commit -m "Your message"

# 2. Push to GitHub
git push origin main

# 3. Automatic deployment:
#    - Vercel: Auto-deploys frontend
#    - Render: Auto-deploys backend (if connected)
```

Both services watch for `main` branch changes and redeploy automatically! ✨

---

## 🆘 Troubleshooting

### "Frontend can't connect to backend"
- [ ] Check Render backend URL is correct
- [ ] Verify CORS_ORIGIN matches frontend URL
- [ ] Check browser console (F12) for exact error
- [ ] Verify from render.com that backend is running

### "Database connection error"
- [ ] Verify MongoDB URI in Render environment variables
- [ ] Check IP is whitelisted in MongoDB Atlas (Network Access)
- [ ] Verify username/password is correct
- [ ] Wait 30 seconds and retry (Atlas clusters need time)

### "Slow performance"
- [ ] First backend request after 15 mins will be slow (cold start)
- [ ] Database is shared tier (normal)
- [ ] Consider upgrading when users grow

### "Domain not resolving"
- [ ] Wait 30-60 minutes for DNS propagation
- [ ] Clear browser cache (Ctrl+Shift+R)
- [ ] Check nameservers are correctly set
- [ ] Use https://dnschecker.org to verify

---

## ✅ Final Checklist

- [ ] MongoDB Atlas account created
- [ ] MongoDB M0 cluster deployed
- [ ] Database user created
- [ ] Connection string obtained
- [ ] Render account created
- [ ] Backend deployed to Render
- [ ] Backend environment variables set
- [ ] Vercel account created
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] CORS updated with correct URLs
- [ ] Frontend loads successfully
- [ ] Backend health check works
- [ ] User registration works
- [ ] Login works
- [ ] Courses display
- [ ] All tests pass

---

## 📞 Quick Reference URLs

| Service | Link | Purpose |
|---------|------|---------|
| **MongoDB Atlas** | https://www.mongodb.com/cloud/atlas | Database management |
| **Render** | https://render.com | Backend hosting dashboard |
| **Vercel** | https://vercel.com/dashboard | Frontend hosting dashboard |
| **Freenom** | https://www.freenom.com | Free domain registration |
| **Your Frontend** | https://lms-frontend.vercel.app | Your live LMS |
| **Your Backend** | https://lms-api.render.com/api | Your API endpoint |
| **Your Backend Health** | https://lms-api.render.com/api/health | Check backend status |

---

## 💰 Total Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| MongoDB Atlas | M0 | $0/month |
| Render | Free Tier | $0/month |
| Vercel | Hobby | $0/month |
| Freenom | Free Domain | $0/year |
| **TOTAL** | | **$0/month** ✅ |

---

## 🎓 What You've Accomplished

✅ Deployed full-stack MERN application  
✅ Zero infrastructure costs  
✅ Global CDN for frontend  
✅ Cloud database with backups  
✅ Automatic deployments on code push  
✅ Custom domain (optional)  
✅ Production-ready setup  

---

## 🚀 Next Steps After Deployment

1. **Share with users** - Give them your frontend URL
2. **Monitor** - Check Render/Vercel logs daily
3. **Get feedback** - Ask users for feature requests
4. **Plan updates** - Start working on v1.1
5. **Scale up** - When traffic grows, upgrade tiers

---

**Created**: April 2, 2026  
**Status**: Production Ready  
**Support**: Check troubleshooting section or GitHub Issues
