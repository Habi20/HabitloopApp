# 🚀 HabitLoop Deployment Structure Guide

## 📁 **Local Project Structure (Root Directory)**

```
C:\Users\ASUS\Videos\itVideo\git\HabitMaster2907251711PM-2 - HLRUN 10.08.25 - Copy\
├── .env                          # Root environment variables
├── package.json                   # Root package.json with workspaces
├── tsconfig.json                 # Root TypeScript config
├── client/                       # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── ...
│   ├── dist/                     # Built React app (for deployment)
│   ├── package.json
│   ├── vite.config.ts
│   └── node_modules/
├── server/                       # Backend Node.js application
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── habitRoutes.ts
│   │   ├── mlPredictionRoutes.ts
│   │   └── ...
│   ├── services/
│   │   ├── NotificationService.ts
│   │   ├── emailService.ts
│   │   └── ...
│   ├── utils/
│   │   ├── habitCompletionManager.ts
│   │   ├── timezone.js
│   │   └── ...
│   ├── database/
│   ├── ml/
│   ├── deployment/               # Deployment-specific files
│   │   └── vite.ts
│   ├── index.ts                  # Main server entry point
│   ├── env.ts                    # Environment configuration
│   ├── db.ts                     # Database connection
│   ├── storage.ts                # Data layer
│   ├── supabaseAuth.ts           # Authentication
│   ├── package.json
│   ├── tsconfig.json
│   ├── Procfile                  # For Heroku deployment
│   ├── railway.json              # For Railway deployment
│   └── node_modules/
├── shared/                       # Shared code between client and server
│   ├── schema.ts                 # Database schema
│   ├── types.ts                  # Shared TypeScript types
│   └── ...
├── docs/                         # Documentation
│   ├── HABITLOOP COMPREHENSIVE_DOC.md
│   ├── AUTHENTICATION_WORKFLOW.md
│   └── ...
├── test/                         # Test files
└── node_modules/                 # Root dependencies
```

---

## 🌐 **Recommended Hosting Folder Structure**

```
/home/techvers/
├── .env                          # Root environment variables (if needed)
├── client/                       # Frontend package
│   ├── dist/                     # Built React app
│   │   ├── index.html
│   │   ├── assets/
│   │   └── ...
│   ├── package.json
│   └── node_modules/
├── server/                       # Backend package (Node.js application)
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── habitRoutes.ts
│   │   ├── mlPredictionRoutes.ts
│   │   ├── index.ts
│   │   └── ...
│   ├── services/
│   │   ├── NotificationService.ts
│   │   ├── emailService.ts
│   │   └── ...
│   ├── utils/
│   │   ├── habitCompletionManager.ts
│   │   ├── timezone.js
│   │   └── ...
│   ├── database/
│   ├── ml/
│   ├── index.ts                  # Main server entry point
│   ├── env.ts                    # Environment configuration
│   ├── db.ts                     # Database connection
│   ├── storage.ts                # Data layer
│   ├── supabaseAuth.ts           # Authentication
│   ├── package.json
│   ├── tsconfig.json
│   ├── Procfile
│   ├── railway.json
│   └── node_modules/
├── shared/                       # Shared schema and types
│   ├── schema.ts                 # Database schema
│   ├── types.ts                  # Shared TypeScript types
│   └── ...
├── public_html/                  # Web root (HostGator's web directory)
│   ├── index.html                # Copy from client/dist/
│   ├── assets/                   # Copy from client/dist/
│   └── ...                       # All files from client/dist/
└── node_modules/                 # Root dependencies (if needed)
```

---

## 📋 **Deployment Instructions**

### **1. Upload Files to Hosting**

#### **Server Directory:**
```
Upload from local: C:\Users\ASUS\Videos\itVideo\git\HabitMaster2907251711PM-2 - HLRUN 10.08.25 - Copy\server\
Upload to hosting: /home/techvers/server/
```

#### **Shared Directory:**
```
Upload from local: C:\Users\ASUS\Videos\itVideo\git\HabitMaster2907251711PM-2 - HLRUN 10.08.25 - Copy\shared\
Upload to hosting: /home/techvers/shared/
```

#### **Client Build:**
```
Upload from local: C:\Users\ASUS\Videos\itVideo\git\HabitMaster2907251711PM-2 - HLRUN 10.08.25 - Copy\client\dist\
Upload to hosting: /home/techvers/public_html/
```

### **2. Hosting Configuration**

#### **Node.js Application:**
- **Application Root**: `/home/techvers/server/`
- **Application Startup File**: `index.ts`
- **Application Mode**: `development` (or `production`)

#### **Environment Variables:**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres.hkkvlenrqxoaavofwiuc:Getintosup_123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=https://techversehublk.site/
OPENAI_API_KEY=your_openai_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
TIMEZONE=Asia/Colombo
TZ=Asia/Colombo
```

### **3. File Upload Checklist**

#### **Essential Server Files:**
- ✅ `index.ts` (main entry point)
- ✅ `package.json` (dependencies)
- ✅ `tsconfig.json` (TypeScript config)
- ✅ `env.ts` (environment config)
- ✅ `db.ts` (database connection)
- ✅ `storage.ts` (data layer)
- ✅ `supabaseAuth.ts` (authentication)
- ✅ `routes/` directory (all route files)
- ✅ `services/` directory (all service files)
- ✅ `utils/` directory (all utility files)
- ✅ `database/` directory
- ✅ `ml/` directory
- ✅ `Procfile`
- ✅ `railway.json`

#### **Essential Shared Files:**
- ✅ `shared/schema.ts` (database schema)
- ✅ `shared/types.ts` (shared types)

#### **Essential Client Files:**
- ✅ `client/dist/` → `public_html/` (all built frontend files)

---

## 🔧 **Post-Deployment Steps**

### **1. Install Dependencies**
```bash
cd /home/techvers/server
npm install
```

### **2. Start the Application**
- Use the hosting panel to run the `start` script
- Or manually run: `npm start`

### **3. Test Endpoints**
```bash
# Test backend
curl https://techversehublk.site/
curl https://techversehublk.site/api/health

# Test frontend
curl https://techversehublk.site/
```

### **4. Verify Database Connection**
- Check application logs for database connection messages
- Look for: "✅ Database pool connection established"

---

## 🚨 **Common Issues & Solutions**

### **Import Path Issues:**
- **Problem**: `Cannot find module '../shared/schema'`
- **Solution**: Ensure `shared/` directory is at the same level as `server/`

### **Environment Variables:**
- **Problem**: Missing environment variables
- **Solution**: Set all required environment variables in hosting panel

### **Port Issues:**
- **Problem**: Port conflicts or wrong port
- **Solution**: Check `PORT` environment variable matches hosting configuration

### **Database Connection:**
- **Problem**: Database connection failures
- **Solution**: Verify `DATABASE_URL` and SSL settings

---

## ✅ **Verification Checklist**

- [ ] All server files uploaded to `/home/techvers/server/`
- [ ] Shared files uploaded to `/home/techvers/shared/`
- [ ] Frontend files uploaded to `/home/techvers/public_html/`
- [ ] Environment variables set in hosting panel
- [ ] Node.js application started successfully
- [ ] Backend API responding (no 503 errors)
- [ ] Frontend loading correctly
- [ ] Database connection established
- [ ] All API endpoints working

---

## 📞 **Support**

If you encounter issues:
1. Check application logs in hosting panel
2. Verify all files are uploaded correctly
3. Confirm environment variables are set
4. Test database connectivity
5. Check import paths and file structure
