# HabitLoop Deployment Structure Guide

## Overview
This guide documents the deployment strategy for HabitLoop using a three-branch approach to separate frontend and backend deployments while maintaining a development environment.

## Branch Structure

### 1. `habitloop-dev` (Main Development Branch)
**Purpose:** Local development with full-stack setup
**Location:** Local development environment
**Configuration:** 
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API calls: Relative URLs (`/api/*`) handled by Vite proxy

**Key Files:**
- `client/src/config/api.ts` - Environment-based API configuration
- `vite.config.ts` - Proxy configuration for local development
- Complete codebase (client + server + shared)

### 2. `habitloop-fe` (Frontend Deployment Branch)
**Purpose:** Frontend-only deployment to Hostinger
**Location:** `https://techversehublk.site/`
**Configuration:**
- API calls: Always point to Railway backend
- No backend code included
- Optimized for production

**Key Files:**
- `client/src/config/api.ts` - Always uses Railway URL
- `client/` directory only
- Production build configuration

### 3. `habitloop-be` (Backend Deployment Branch)
**Purpose:** Backend-only deployment to Railway
**Location:** `https://habitloopapp-development.up.railway.app/`
**Configuration:**
- No frontend code included
- Database connections
- API endpoints only

**Key Files:**
- `server/` directory only
- `shared/` directory (if needed)
- `railway.json` - Railway deployment configuration

## Security Considerations

### ✅ Security Fixes Applied
1. **Password Hint Removal:** Removed default password hint (`test123`) from HabitLoop login modal
2. **Generic Placeholders:** Changed password placeholders to generic text
3. **No Hardcoded Credentials:** No sensitive information exposed in UI

### 🔒 Security Best Practices
- **Environment Variables:** All sensitive data stored in environment variables
- **JWT Tokens:** Secure token-based authentication
- **HTTPS Only:** All production deployments use HTTPS
- **Input Validation:** Server-side validation for all inputs
- **Rate Limiting:** API rate limiting implemented

## API Configuration Strategy

### Development Environment (`habitloop-dev`)
```typescript
// client/src/config/api.ts
const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return '/api'; // Vite proxy handles this
  }
  return 'https://habitloopapp-development.up.railway.app/api';
};
```

### Frontend Deployment (`habitloop-fe`)
```typescript
// client/src/config/api.ts
export const API_BASE_URL = 'https://habitloopapp-development.up.railway.app';
export const buildApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/api/${cleanEndpoint}`;
};
```

## Deployment Workflow

### 1. Development Workflow
```bash
# Start in habitloop-dev branch
git checkout habitloop-dev

# Local development
cd client && npm run dev
cd server && npm run dev

# API calls work via Vite proxy
fetch('/api/habitloop/signin', ...) // → localhost:5000/api/habitloop/signin
```

### 2. Frontend Deployment
```bash
# Switch to frontend branch
git checkout habitloop-fe

# Build for production
cd client && npm run build

# Upload dist/ folder to Hostinger
# Site: https://techversehublk.site/
```

### 3. Backend Deployment
```bash
# Switch to backend branch
git checkout habitloop-be

# Railway automatically deploys from this branch
# Site: https://habitloopapp-development.up.railway.app/
```

## Migration Between Branches

### From Development to Production
1. **Frontend Changes:**
   - Copy `client/src/config/api.ts` changes to `habitloop-fe`
   - Ensure all API calls use `buildApiUrl()`
   - Test build process

2. **Backend Changes:**
   - Copy `server/` changes to `habitloop-be`
   - Update Railway environment variables if needed
   - Test API endpoints

### From Production to Development
1. **Frontend Changes:**
   - Copy `client/src/config/api.ts` changes to `habitloop-dev`
   - Ensure Vite proxy configuration is correct
   - Test local development

2. **Backend Changes:**
   - Copy `server/` changes to `habitloop-dev`
   - Update local environment variables
   - Test local API endpoints

## TODO List

### 🔧 Security Fixes Needed
- [x] **Remove password hint from `habitloop-fe` branch** ✅ COMPLETED
  - File: `client/src/components/HabitLoopLoginModal.tsx`
  - Removed: `Default password: test123` hint
  - Updated placeholder text to generic "Enter your password"
- [ ] **Remove password hint from `habitloop-dev` branch** 🔄 TODO
  - File: `client/src/components/HabitLoopLoginModal.tsx`
  - Remove: `Default password: test123` hint
  - Update placeholder text to generic "Enter your password"
- [ ] **Remove password hint from `habitloop-be` branch** 🔄 TODO
  - Same changes as above
  - Ensure all branches are secure

### 🔄 Branch Synchronization
- [ ] **Sync API configuration changes across all branches**
- [ ] **Ensure consistent security practices across environments**
- [ ] **Update documentation for each branch**

### 🧪 Testing Checklist
- [ ] **Local Development (`habitloop-dev`)**
  - [ ] Frontend connects to local backend
  - [ ] API calls work via Vite proxy
  - [ ] No hardcoded URLs
  - [ ] Security fixes applied

- [ ] **Frontend Deployment (`habitloop-fe`)**
  - [ ] Builds successfully
  - [ ] Connects to Railway backend
  - [ ] All API calls work
  - [ ] No password hints visible

- [ ] **Backend Deployment (`habitloop-be`)**
  - [ ] Railway deployment successful
  - [ ] Health check endpoint working
  - [ ] All API endpoints responding
  - [ ] Database connections stable

## Environment Variables

### Railway Backend Environment
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
# Add other required environment variables
```

### Local Development Environment
```env
# .env file in root
NODE_ENV=development
PORT=5000
DATABASE_URL=your_local_database_url
JWT_SECRET=your_jwt_secret
# Add other required environment variables
```

## Troubleshooting

### Common Issues
1. **404 Errors on API Calls**
   - Check if using correct branch
   - Verify API configuration in `client/src/config/api.ts`
   - Ensure Railway backend is running

2. **CORS Errors**
   - Backend should allow requests from frontend domain
   - Check Railway CORS configuration

3. **Build Failures**
   - Ensure all dependencies are installed
   - Check for TypeScript errors
   - Verify import paths

### Health Checks
- **Frontend:** `https://techversehublk.site/` (should load HabitLoop app)
- **Backend:** `https://habitloopapp-development.up.railway.app/api/health` (should return healthy status)

## Maintenance

### Regular Tasks
1. **Security Updates:** Regularly review and update security measures
2. **Dependency Updates:** Keep all packages updated
3. **Backup Verification:** Ensure database backups are working
4. **Performance Monitoring:** Monitor Railway and Hostinger performance

### Emergency Procedures
1. **Rollback Plan:** Keep previous working versions ready
2. **Database Backup:** Regular automated backups
3. **Monitoring:** Set up alerts for downtime

---

**Last Updated:** 2025-08-25
**Version:** 1.0.0
**Maintainer:** Development Team
