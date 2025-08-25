# Railway Deployment Changes Documentation

## Overview
This document tracks all changes made for Railway deployment across the three branches:
- `habitloop-dev` (main development branch)
- `habitloop-be` (Railway backend deployment)
- `habitloop-fe` (Railway frontend deployment)

---

## 🔧 Branch Structure

### `habitloop-dev` (Main Development)
- **Purpose**: Local development with both frontend and backend
- **API Configuration**: Environment-based (local `/api` vs Railway URL)
- **Contains**: Full project (client + server + shared)

### `habitloop-be` (Railway Backend)
- **Purpose**: Railway backend deployment only
- **Contains**: server/, shared/, package.json, railway.json
- **Removed**: client/ folder

### `habitloop-fe` (Railway Frontend)
- **Purpose**: Railway frontend deployment only
- **Contains**: client/, package.json
- **Removed**: server/ folder
- **API Configuration**: Always uses Railway backend URL

---

## 📝 Changes Made for Railway Deployment

### 1. API Configuration Changes

#### File: `client/src/config/api.ts`

**Current (habitloop-dev - Environment-based):**
```typescript
// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // In development, use relative URLs (handled by Vite proxy)
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, use the Railway backend URL
  return 'https://habitloopapp-development.up.railway.app/api';
};

export const API_BASE_URL = getApiBaseUrl();
```

**Railway Frontend (habitloop-fe - Always Railway):**
```typescript
// Always use Railway backend URL for frontend deployment
export const API_BASE_URL = 'https://habitloopapp-development.up.railway.app/api';
```

**✅ TO BRING BACK TO MAIN BRANCH**: Keep the environment-based version

---

### 2. Fetch Call Updates Needed

#### Files Requiring API_BASE_URL Import and Usage:

1. **`client/src/components/HabitLoopLoginModal.tsx`**
   - ✅ **DONE**: Added `import { API_BASE_URL } from "@/config/api";`
   - ❌ **NEEDED**: Update fetch calls from `/api/...` to `${API_BASE_URL}/...`

2. **`client/src/contexts/AuthContext.tsx`**
   - ❌ **NEEDED**: Add API_BASE_URL import
   - ❌ **NEEDED**: Update fetch calls

3. **`client/src/components/HabitLoopSignupModal.tsx`**
   - ❌ **NEEDED**: Add API_BASE_URL import
   - ❌ **NEEDED**: Update fetch calls

4. **`client/src/components/HabitLoopUserModal.tsx`**
   - ❌ **NEEDED**: Add API_BASE_URL import
   - ❌ **NEEDED**: Update fetch calls

5. **`client/src/components/GuestModeModal.tsx`**
   - ❌ **NEEDED**: Add API_BASE_URL import
   - ❌ **NEEDED**: Update fetch calls

6. **`client/src/pages/Profile.tsx`**
   - ❌ **NEEDED**: Add API_BASE_URL import
   - ❌ **NEEDED**: Update fetch calls

---

### 3. Specific Fetch Call Changes

#### HabitLoopLoginModal.tsx
**Current (hardcoded):**
```typescript
const response = await fetch('/api/habitloop/users', {
const response = await fetch('/api/habitloop/signin', {
const response = await fetch('/api/habitloop/signup', {
```

**Railway (using API_BASE_URL):**
```typescript
const response = await fetch(`${API_BASE_URL}/habitloop/users`, {
const response = await fetch(`${API_BASE_URL}/habitloop/signin`, {
const response = await fetch(`${API_BASE_URL}/habitloop/signup`, {
```

#### AuthContext.tsx
**Current (hardcoded):**
```typescript
const response = await fetch('/api/guest/verify', {
const response = await fetch('/api/auth/user', {
const response = await fetch('/api/auth/signin', {
const response = await fetch('/api/user', {
const response = await fetch('/api/guest/auth', {
const response = await fetch('/api/auth/signup', {
```

**Railway (using API_BASE_URL):**
```typescript
const response = await fetch(`${API_BASE_URL}/guest/verify`, {
const response = await fetch(`${API_BASE_URL}/auth/user`, {
const response = await fetch(`${API_BASE_URL}/auth/signin`, {
const response = await fetch(`${API_BASE_URL}/user`, {
const response = await fetch(`${API_BASE_URL}/guest/auth`, {
const response = await fetch(`${API_BASE_URL}/auth/signup`, {
```

---

### 4. Railway Configuration Files

#### `railway.json` (Backend)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm install"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "preDeployCommand": "npm run migrate",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**✅ TO BRING BACK TO MAIN BRANCH**: Keep this file

---

## 🔄 Migration Strategy

### When Returning to Main Development (`habitloop-dev`):

1. **Keep Environment-Based API Configuration**
   - ✅ Already correct in main branch
   - ✅ Works for both local and Railway

2. **Update Fetch Calls to Use API_BASE_URL**
   - ❌ Need to update all hardcoded `/api/...` calls
   - ❌ Add `import { API_BASE_URL } from "@/config/api";` to components

3. **Keep Railway Configuration**
   - ✅ Keep `railway.json` for future deployments

### Files to Update in Main Branch:

1. **Add API_BASE_URL import to:**
   - `client/src/components/HabitLoopLoginModal.tsx` ✅ (already done)
   - `client/src/contexts/AuthContext.tsx`
   - `client/src/components/HabitLoopSignupModal.tsx`
   - `client/src/components/HabitLoopUserModal.tsx`
   - `client/src/components/GuestModeModal.tsx`
   - `client/src/pages/Profile.tsx`

2. **Update fetch calls in all above files**

---

## 🚀 Railway Deployment URLs

### Backend
- **URL**: `https://habitloopapp-development.up.railway.app`
- **Health Check**: `https://habitloopapp-development.up.railway.app/api/health`
- **Branch**: `habitloop-be`

### Frontend
- **URL**: `https://techversehublk.site` (your existing frontend hosting)
- **API Calls**: Point to Railway backend
- **Branch**: `habitloop-fe`

---

## 📋 Checklist for Main Branch Updates

### Before Returning to `habitloop-dev`:

- [ ] Update all fetch calls to use `API_BASE_URL`
- [ ] Add `import { API_BASE_URL } from "@/config/api";` to all components
- [ ] Test local development still works
- [ ] Test Railway deployment still works
- [ ] Keep environment-based API configuration

### Files to Update:
- [ ] `client/src/components/HabitLoopLoginModal.tsx` ✅
- [ ] `client/src/contexts/AuthContext.tsx`
- [ ] `client/src/components/HabitLoopSignupModal.tsx`
- [ ] `client/src/components/HabitLoopUserModal.tsx`
- [ ] `client/src/components/GuestModeModal.tsx`
- [ ] `client/src/pages/Profile.tsx`

---

## 🔍 Testing Checklist

### Local Development:
- [ ] Frontend runs on `http://localhost:5173`
- [ ] Backend runs on `http://localhost:5000`
- [ ] API calls work locally
- [ ] Authentication works

### Railway Deployment:
- [ ] Backend health check passes
- [ ] Frontend connects to Railway backend
- [ ] Authentication works
- [ ] All features work as expected

---

## 📝 Notes

- **Environment Variables**: Railway backend needs `NODE_ENV=development`
- **CORS**: Backend CORS configured for both local and Railway frontend
- **Database**: Same database used for both local and Railway
- **JWT**: Same JWT secret for both environments

---

*Last Updated: 2025-08-25*
*Railway Deployment Setup Complete*
