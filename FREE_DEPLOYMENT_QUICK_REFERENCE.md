# 🆓 Free Deployment Quick Reference

**Status**: Ready to Deploy | **Cost**: $0/month | **Time**: 45 minutes

---

## 📍 What You Need To Do (In Order)

### 1️⃣ Create MongoDB Account (10 min)
```
GO TO: https://www.mongodb.com/cloud/atlas
ACTION:
  ✓ Sign up (email/password)
  ✓ Create M0 FREE cluster (AWS, us-east-1)
  ✓ Create database user (save username/password)
  ✓ Whitelist IP (0.0.0.0/0 for development)
  ✓ Get connection string

SAVE:
  • MongoDB URI: mongodb+srv://user:pass@cluster.mongodb.net/lms
  • Username: lms_user
  • Password: [your_password]
```

---

### 2️⃣ Deploy Backend (10 min)
```
GO TO: https://render.com
ACTION:
  ✓ Sign up with GitHub
  ✓ Create new Web Service
  ✓ Connect nihald03/LMS repository
  ✓ Configure:
    - Name: lms-api
    - Branch: main
    - Build: cd Backend && npm install
    - Start: cd Backend && npm start
  
  ✓ Add Environment Variables:
    MONGODB_URI = [from MongoDB step]
    JWT_SECRET = your_secret_key_here
    NODE_ENV = production
    PORT = 5000
    CORS_ORIGIN = [will update after frontend]

SAVE:
  • Backend URL: https://lms-api.render.com
  • Check health: https://lms-api.render.com/api/health
```

---

### 3️⃣ Deploy Frontend (10 min)
```
GO TO: https://vercel.com
ACTION:
  ✓ Sign up with GitHub
  ✓ Import project: https://github.com/nihald03/LMS
  ✓ Configure:
    - Root directory: Frontend
    - Build command: npm run build
    - Output: dist
  
  ✓ Add Environment Variable:
    VITE_API_BASE_URL = https://lms-api.render.com/api

  ✓ Deploy

SAVE:
  • Frontend URL: https://lms-frontend.vercel.app
  • Open in browser to verify
```

---

### 4️⃣ Update Backend CORS (2 min)
```
GO TO: https://render.com (backend dashboard)
ACTION:
  ✓ Open lms-api service
  ✓ Go to Environment tab
  ✓ Edit CORS_ORIGIN variable
  ✓ Set to: https://lms-frontend.vercel.app
  ✓ Save (auto-redeploy)
```

---

### 5️⃣ Test Everything (3 min)
```
TESTS:
  ✓ Frontend loads: https://lms-frontend.vercel.app
  ✓ Backend healthy: https://lms-api.render.com/api/health
  ✓ Sign up works
  ✓ Login works
  ✓ Browse courses works
```

---

### 6️⃣ (Optional) Get Free Domain
```
GO TO: https://www.freenom.com
ACTION:
  ✓ Search domain (e.g., mylms.tk)
  ✓ Add to cart (12 months, free)
  ✓ Checkout and register
  ✓ Get domain name

THEN:
  1. Add domain to Vercel (Settings → Domains)
  2. Update Freenom nameservers:
     - ns1.vercel-dns.com
     - ns2.vercel-dns.com
  3. Wait 15-30 minutes for DNS propagation
  4. Update CORS_ORIGIN in Render to: https://mydomain.tk
```

---

## 🎯 Final Deployment URLs

Once live:

```
✅ Frontend: https://lms-frontend.vercel.app
✅ Backend: https://lms-api.render.com/api
✅ Health Check: https://lms-api.render.com/api/health
✅ Database: MongoDB Atlas M0 (512MB free)

Optionally:
✅ Custom Domain: https://mylms.tk (free from Freenom)
```

---

## 💡 Free Tier Considerations

| Limitation | Impact | Solution |
|-----------|--------|----------|
| **Render Backend Sleeps** | First request ~10s slow | Normal behavior on free tier |
| **MongoDB 512MB** | ~10k course records max | Upgrade to M2 if full |
| **Shared DB Cluster** | Slower than dedicated | Normal trade-off for free |
| **No Email Service** | Can't send emails | Add later with SendGrid free tier |

---

## 🔐 Environment Variables Needed

### Backend (in Render)
```env
MONGODB_URI = mongodb+srv://lms_user:password@cluster.mongodb.net/lms
JWT_SECRET = very_long_random_string_at_least_32_chars
NODE_ENV = production
PORT = 5000
CORS_ORIGIN = https://lms-frontend.vercel.app
```

### Frontend (in Vercel)
```env
VITE_API_BASE_URL = https://lms-api.render.com/api
```

---

## 📝 Account Checklist

| Service | Account | Purpose | Free Tier |
|---------|---------|---------|-----------|
| MongoDB Atlas | ✅ New | Database | M0 512MB |
| Render | ✅ New | Backend API | US Free |
| Vercel | ✅ New | Frontend | Hobby |
| GitHub | ✅ Already Have | Code Repository | Free |
| Freenom | ✅ New | Custom Domain | Free TK/.ML |

---

## 🚨 Common Mistakes to Avoid

❌ Don't forget to update CORS_ORIGIN in Render after Vercel deployment  
❌ Don't commit .env files with real credentials  
❌ Don't use hardcoded API URLs (use environment variables)  
❌ Don't ignore "Connection Error" warnings (check credentials)  

✅ Always use environment variables for secrets  
✅ Test API health after each deployment  
✅ Save all URLs and credentials somewhere secure  

---

## 📱 Share with Users

Once deployed, share this with your users:

**For Students:**
```
Visit: https://lms-frontend.vercel.app
1. Click "Sign Up"
2. Fill email, password, name
3. Select "Student" role
4. Click "Register"
5. Enroll in courses
```

**For Teachers:**
```
Visit: https://lms-frontend.vercel.app
1. Click "Sign Up"
2. Fill email, password, name
3. Select "Teacher" role
4. Click "Register"
5. Create courses
6. Upload lectures
```

---

## 🔄 Automatic Updates

After deployment, any code changes automatically deploy:

```bash
# 1. Make changes locally
# 2. Commit to GitHub
git add .
git commit -m "fix: update bug"

# 3. Push to main
git push origin main

# 4. Automatic:
#    → Vercel redeploys frontend
#    → Render redeploys backend
```

---

## 📧 Contact & Support

| Issue | Solution |
|-------|----------|
| Backend slow | Cold start (free tier), wait or upgrade |
| Can't login | Check backend health endpoint |
| Frontend blank | Check VITE_API_BASE_URL in Vercel |
| Database full | MongoDB Atlas shows storage usage |
| Domain not working | DNS needs 30min, check nameservers |

See **FREE_DEPLOYMENT_GUIDE.md** for detailed troubleshooting.

---

**Total Setup Time**: 45 minutes  
**Total Cost**: $0/month  
**Status**: Production Ready ✅
