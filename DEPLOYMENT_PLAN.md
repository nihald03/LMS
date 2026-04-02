# LMS Deployment Plan v1.0

**Status**: Initial Deployment Plan  
**Created**: April 2, 2026  
**Branch**: `deployment/v1.0`  
**Application**: Full-Stack MERN Learning Management System

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Architecture & Infrastructure](#architecture--infrastructure)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Database Setup](#database-setup)
7. [Environment Configuration](#environment-configuration)
8. [SSL Certificates & Security](#ssl-certificates--security)
9. [Testing & Validation](#testing--validation)
10. [Post-Deployment Monitoring](#post-deployment-monitoring)
11. [Rollback Plan](#rollback-plan)

---

## Overview

### Application Stack
- **Frontend**: React 18+ with Vite (SPA)
- **Backend**: Node.js + Express.js REST API
- **Database**: MongoDB (Atlas recommended)
- **Authentication**: JWT tokens
- **Video Streaming**: Multipart uploads with streaming
- **File Storage**: Local or Cloud Storage (S3/Azure Blob)

### Deployment Targets
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Backend**: Heroku, Railway, DigitalOcean, AWS EC2, or Docker
- **Database**: MongoDB Atlas (managed cloud service)
- **Storage**: AWS S3 or Azure Blob Storage

### Expected Users
- Teachers: Create courses, assignments, quizzes
- Students: Enroll, complete coursework, take quizzes
- Admins: System management and oversight

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All bugs fixed and tested in `main` branch
- [ ] Code review completed by team
- [ ] Unit tests passing (if applicable)
- [ ] Linting and formatting validated
- [ ] No console errors or warnings
- [ ] Security vulnerabilities scanned (npm audit, npm audit fix)

### Documentation
- [ ] README.md updated with production setup
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] Database schema documented
- [ ] Deployment runbook created

### Security
- [ ] .env.example created (no secrets committed)
- [ ] JWT secrets rotated/configured
- [ ] CORS policy configured correctly
- [ ] Sensitive data removed from codebase
- [ ] Git history cleaned (no credentials exposed)

### Performance
- [ ] Frontend optimized (code splitting, lazy loading)
- [ ] Backend API optimized (indexes, caching)
- [ ] Database queries optimized
- [ ] Images compressed for delivery
- [ ] Bundle size analyzed and acceptable

### Infrastructure
- [ ] Hosting accounts created (Vercel, MongoDB Atlas, etc.)
- [ ] Domain registered (if applicable)
- [ ] SSL certificates provisioned
- [ ] CDN configured (optional but recommended)
- [ ] Backup strategy defined

---

## Architecture & Infrastructure

### Recommended Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   CDN (CloudFlare/Akamai)  │
        └────────────────┬───────────┘
                         │
        ┌────────────────┴──────────────────┐
        │                                   │
        ▼                                   ▼
   ┌─────────────┐            ┌─────────────────────┐
   │  Frontend   │            │  API Gateway/       │
   │  (Vercel/   │            │  Load Balancer      │
   │  S3+CF)     │            └──────────┬──────────┘
   │             │                       │
   │  React SPA  │            ┌──────────┴──────────┐
   │  - Auth UI  │            │                     │
   │  - Dashboard│            ▼                     ▼
   │  - Courses  │       ┌────────────┐       ┌────────────┐
   │  - Quizzes  │       │ Backend #1 │       │ Backend #2 │
   │  - Videos   │       │ (Node.js)  │       │ (Node.js)  │
   └─────────────┘       └────┬───────┘       └────┬───────┘
                              │                    │
                              └────────┬───────────┘
                                       │
                        ┌──────────────┴──────────────┐
                        │                             │
                        ▼                             ▼
                   ┌──────────────┐        ┌─────────────────┐
                   │ MongoDB      │        │ File Storage    │
                   │ (Atlas)      │        │ (S3/Blob)       │
                   │              │        │                 │
                   │ Replica Set  │        │ Video/Uploads   │
                   │ High Avail.  │        │ CDN enabled     │
                   └──────────────┘        └─────────────────┘
```

### Deployment Options by Tier

#### Tier 1: Simple (Lowest Cost - $50-100/month)
- **Frontend**: Vercel (free tier)
- **Backend**: Railway or Heroku free tier (limited)
- **Database**: MongoDB Atlas free tier (512MB)
- **Storage**: Local uploads (limited)
- **Best for**: Development, demos, small pilots

#### Tier 2: Standard (Mid-Range - $100-300/month)
- **Frontend**: Vercel Pro or Netlify Pro
- **Backend**: Railway or Render ($7-15/month + compute)
- **Database**: MongoDB Atlas $57/month (2GB)
- **Storage**: AWS S3 ($1-5/month for typical usage)
- **Best for**: Production with small-medium user base

#### Tier 3: Enterprise (Scalable - $300-1000+/month)
- **Frontend**: AWS CloudFront + S3
- **Backend**: AWS EC2 (auto-scaling) or ECS/Fargate
- **Database**: MongoDB Atlas M10 cluster ($57+/month)
- **Storage**: AWS S3 with CloudFront CDN
- **Cache**: Redis for session management
- **Monitoring**: CloudWatch, Datadog, New Relic
- **Best for**: Large production deployments

---

## Backend Deployment

### Option 1: Heroku Deployment (Easiest)

#### Prerequisites
```bash
npm install -g heroku
heroku login
```

#### Steps
1. **Create Heroku App**
   ```bash
   heroku create lms-backend-prod
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/lms
   heroku config:set JWT_SECRET=your_long_secret_key
   heroku config:set NODE_ENV=production
   heroku config:set PORT=5000
   ```

3. **Deploy**
   ```bash
   git push heroku deployment/v1.0:main
   ```

4. **Monitor**
   ```bash
   heroku logs --tail
   heroku ps
   ```

### Option 2: Railway Deployment (Modern Alternative)

#### Prerequisites
- GitHub account (Railway connects to GitHub)
- Railway account

#### Steps
1. Go to [Railway.app](https://railway.app)
2. Connect GitHub account
3. Select LMS repository
4. Click "Deploy Now"
5. Configure environment variables in Railway dashboard
6. Railway automatically deploys on Git push

### Option 3: AWS EC2 (Full Control)

#### Prerequisites
- AWS account
- EC2 instance (t2.micro or larger)
- Security group configured (port 5000 open)

#### Steps
1. **SSH into instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

2. **Install dependencies**
   ```bash
   sudo apt update && sudo apt install nodejs npm git
   ```

3. **Clone repository**
   ```bash
   git clone https://github.com/nihald03/LMS.git
   cd LMS/Backend
   npm install
   ```

4. **Create .env file**
   ```bash
   cp .env.example .env
   # Edit with production values
   nano .env
   ```

5. **Run with PM2 (process manager)**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "lms-api"
   pm2 startup
   pm2 save
   ```

6. **Setup Nginx as Reverse Proxy**
   ```bash
   sudo apt install nginx
   ```

   Create `/etc/nginx/sites-available/lms`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable:
   ```bash
   sudo ln -s /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Frontend Deployment

### Option 1: Vercel Deployment (Recommended - Easiest)

#### Prerequisites
- Vercel account (free)
- GitHub connected

#### Steps
1. Go to [Vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select GitHub and authenticate
4. Choose the LMS repository
5. Configure:
   - **Root Directory**: `Frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variables:
   ```
   VITE_API_BASE_URL=https://lms-api.herokuapp.com/api
   ```
7. Click Deploy
8. Automatic deployments on Git push to `main`

**Production URL**: `https://lms-frontend.vercel.app`

### Option 2: Netlify Deployment

#### Steps
1. Go to [Netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect GitHub and select repository
4. Configure:
   - **Base directory**: `Frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add environment variables
6. Deploy

### Option 3: AWS S3 + CloudFront

#### Steps
1. **Build frontend**
   ```bash
   cd Frontend
   npm run build
   ```

2. **Create S3 bucket**
   ```bash
   aws s3 mb s3://lms-frontend-prod
   aws s3 sync dist/ s3://lms-frontend-prod/ --delete
   ```

3. **Create CloudFront distribution**
   - Origin: S3 bucket
   - CNAME: your-domain.com
   - Enable HTTP/2, compression
   - Default root object: index.html

4. **Configure routing**
   - Error responses (404, 403) → /index.html
   - TTL: 3600 seconds

---

## Database Setup

### MongoDB Atlas (Cloud Database - Recommended)

#### Steps
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create cluster:
   - Cloud Provider: AWS
   - Region: us-east-1 (or closest to users)
   - Tier: M0 free (development) or M2 (production)
4. Create database user
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/lms?retryWrites=true&w=majority
   ```
6. Whitelist IP addresses (or set to 0.0.0.0/0 for development)
7. Configure backups:
   - Continuous backup enabled
   - Snapshot frequency: Daily
   - Retention: 35 days

#### Indexes to Create
```javascript
// Collections requiring indexes for performance
db.courses.createIndex({ "assignedTeacher": 1 })
db.courses.createIndex({ "courseName": "text" })
db.assignments.createIndex({ "courseId": 1, "dueDate": 1 })
db.quizzes.createIndex({ "courseId": 1 })
db.enrollments.createIndex({ "userId": 1, "courseId": 1 })
db.enrollments.createIndex({ "courseId": 1 })
db.grades.createIndex({ "studentId": 1, "courseId": 1 })
db.attendance_records.createIndex({ "courseId": 1, "studentId": 1 })
```

---

## Environment Configuration

### Backend Production .env
```env
# Server
NODE_ENV=production
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/lms

# JWT
JWT_SECRET=your-very-long-random-secret-key-minimum-32-chars
JWT_EXPIRE=7d

# File Upload
MAX_FILE_SIZE=100000000  # 100MB

# CORS
CORS_ORIGIN=https://lms-frontend.vercel.app

# Email (if configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AWS S3 (if using)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=lms-uploads-prod
AWS_REGION=us-east-1

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/lms/api.log
```

### Frontend Production .env
```env
VITE_API_BASE_URL=https://api.lms.com/api
VITE_APP_NAME=LMS
VITE_APP_VERSION=1.0.0
```

---

## SSL Certificates & Security

### SSL Setup
- **Vercel**: Automatic SSL with Let's Encrypt
- **Netlify**: Automatic SSL
- **AWS with Nginx**: Use Certbot
- **Heroku**: Included with domain

### Security Headers
Add to backend (Express):
```javascript
// in middleware
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

### CORS Configuration
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

---

## Testing & Validation

### Pre-Production Testing

#### 1. Backend API Testing
```bash
cd Backend
npm test  # Run all tests
npm start  # Start server locally
```

Test endpoints:
- [ ] POST /api/auth/register - Create account
- [ ] POST /api/auth/login - User login
- [ ] GET /api/courses - List courses
- [ ] POST /api/courses - Create course (teacher)
- [ ] POST /api/lectures - Upload lecture
- [ ] POST /api/quizzes - Create quiz
- [ ] POST /api/assignments - Create assignment
- [ ] POST /api/grades - Submit grades

#### 2. Frontend Testing
```bash
cd Frontend
npm run build  # Verify build succeeds
npm run preview  # Test production build locally
```

Test flows:
- [ ] User registration (all roles)
- [ ] User login (JWT token)
- [ ] Navigate all pages
- [ ] Upload video content
- [ ] Create and submit assignments
- [ ] Take quiz
- [ ] View analytics
- [ ] Responsive design (mobile, tablet, desktop)

#### 3. Load Testing
```bash
npm install -g artillery
artillery quick --count 100 --num 10 https://api-staging.lms.com/api/courses
```

#### 4. Security Testing
- [ ] Run `npm audit` - check for vulnerabilities
- [ ] Check for exposed secrets in code
- [ ] Test SQL injection resistance (MongoDB injection)
- [ ] Test CORS settings
- [ ] Test JWT expiration

---

## Post-Deployment Monitoring

### Application Monitoring

#### 1. Error Tracking (Sentry)
```bash
npm install @sentry/node
```

Configure in backend:
```javascript
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

#### 2. Performance Monitoring
- **Vercel/Netlify**: Built-in analytics
- **Backend**: New Relic, Datadog, or LogRocket
- **Database**: MongoDB Atlas monitoring

#### 3. Uptime Monitoring
- Use UptimeRobot or StatusPage
- Monitor: API health endpoint
- Alerts on downtime > 5 minutes

#### 4. Logs
Centralize logs:
```bash
# Heroku
heroku logs --tail

# AWS
tail -f /var/log/lms/api.log

# Cloud services
Check dashboard for aggregated logs
```

### Health Check Endpoint
Add to backend:
```javascript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});
```

---

## Rollback Plan

### In Case of Issues

#### 1. Immediate Rollback (< 5 minutes)
```bash
# If deployed less than 5 minutes ago
heroku releases
heroku rollback v5  # Rollback to previous version
# OR
git revert HEAD
git push heroku deployment/v1.0:main
```

#### 2. Medium-term Rollback (< 1 hour)
```bash
git checkout previous-stable-tag
git push heroku deployment/v1.0:main
```

#### 3. Database Rollback
```bash
# MongoDB Atlas - Restore from snapshot
# Atlas Dashboard > Backups > Restore from Snapshot
# Choose timestamp before deployment
```

#### 4. DNS Rollback
If frontend broken:
```bash
# Update DNS/CloudFront to point to previous version
# Or use git revert on vercel
```

### Communication Plan
1. Notify stakeholders immediately
2. Document issue in GitHub Issues
3. Post status on StatusPage
4. Provide ETA for fix
5. Post resolution once completed

---

## Deployment Checklist

### Week Before Deployment
- [ ] Staging environment deployed and tested
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks acceptable
- [ ] Team trained on deployment process
- [ ] Runbook reviewed and tested
- [ ] Monitoring tools configured
- [ ] Backups configured

### Day of Deployment
- [ ] All team members available
- [ ] Create deployment branch (`deployment/v1.0`)
- [ ] Final code review completed
- [ ] Staging tests re-run
- [ ] Database backups created
- [ ] SSL certs verified
- [ ] Environment variables double-checked
- [ ] Team on call/Slack monitoring

### Deployment Steps
1. [ ] Deploy backend
2. [ ] Verify backend health checks
3. [ ] Run smoke tests against production API
4. [ ] Deploy frontend
5. [ ] Verify frontend loads
6. [ ] Test critical user flows
7. [ ] Monitor logs/errors for 1 hour
8. [ ] Monitor logs for 24 hours

### Post-Deployment (24 hours)
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Verify all features working
- [ ] Performance metrics within bounds
- [ ] Security logs normal
- [ ] Create post-deployment report

---

## Rollforward Plan (for bug fixes)

If issues found, follow this:
1. Create hotfix branch: `git checkout -b hotfix/issue-description`
2. Fix issue
3. Test thoroughly locally and in staging
4. Deploy to production
5. Monitor closely
6. Merge back to `main` and `deployment/*`

---

## Success Criteria

✅ Deployment is successful when:
- [ ] Frontend loads in < 3 seconds
- [ ] API responds in < 200ms (p95)
- [ ] Zero critical errors in logs
- [ ] All authentication flows working
- [ ] Video uploads/streaming working
- [ ] Quizzes functional
- [ ] Grades calculating correctly
- [ ] User registration working
- [ ] No security alerts
- [ ] Database performing normally

---

## Support & Escalation

### Issue Escalation Path
1. **Level 1** (< 5 min): Check dashboard, logs, health endpoints
2. **Level 2** (5-15 min): Check database connection, API endpoints
3. **Level 3** (15-30 min): Database backups, configuration review
4. **Level 4** (30+ min): Prepare rollback, notify stakeholders

### Contact Escalation
- **Developer**: Nihal Deshmukh
- **Tech Lead**: [TBD]
- **DevOps**: [TBD]
- **On-Call**: [TBD]

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | 2026-04-02 | Draft | Initial deployment plan |
| | | | |

---

**Generated**: April 2, 2026  
**Next Review**: April 9, 2026  
**For Questions**: Contact development team
