# HabitMaster API Testing Guide

## 🚀 Complete API Documentation & Testing Framework

### Table of Contents
1. [Quick Start](#quick-start)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Core API Endpoints](#core-api-endpoints)
4. [cURL Test Commands](#curl-test-commands)
5. [Postman Configuration](#postman-configuration)
6. [Test Cases & Edge Cases](#test-cases--edge-cases)
7. [Error Handling](#error-handling)
8. [Environment Setup](#environment-setup)

---

## Quick Start

### Server Status Check
```bash
curl -X GET http://localhost:5000/
```

**Expected Response:**
```json
{
  "message": "🚀 HabitLoop Backend API",
  "status": "operational",
  "services": {
    "ml_system": "✅ Ready for testing",
    "rbac_system": "✅ Active", 
    "database": "✅ Connected",
    "python_models": "📊 Fallback mode"
  }
}
```

---

## Authentication Endpoints

### 1. User Registration
**Endpoint:** `POST /api/auth/signup`

**Issue Fix:** Use a more realistic email format for Supabase validation:

```bash
# ✅ WORKING VERSION - Use realistic email
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe.test@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Alternative Test Emails (Supabase-friendly):**
```bash
# Option 1: Use your actual email domain
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your.email+test@gmail.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Option 2: Use example.com domain
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. User Login
```bash
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe.test@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/user \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### 4. Logout
```bash
curl -X POST http://localhost:5000/api/auth/signout \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### 5. Google OAuth (Browser-based)
```bash
# Redirect to Google OAuth
curl -X GET http://localhost:5000/api/auth/google
```

---

## Core API Endpoints

### Habits Management

#### 1. Get User Habits
```bash
curl -X GET http://localhost:5000/api/habits \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

#### 2. Create New Habit
```bash
curl -X POST http://localhost:5000/api/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Morning Meditation",
    "description": "10 minutes of mindfulness",
    "category": "Mindfulness",
    "targetValue": 10,
    "unit": "minutes",
    "frequency": "daily",
    "reminderTime": "07:00",
    "color": "#8B5CF6",
    "icon": "fas fa-om"
  }'
```

#### 3. Update Habit
```bash
curl -X PUT http://localhost:5000/api/habits/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Extended Morning Meditation",
    "targetValue": 15
  }'
```

#### 4. Delete Habit
```bash
curl -X DELETE http://localhost:5000/api/habits/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Complete Habit
```bash
curl -X POST http://localhost:5000/api/habits/1/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "value": 10,
    "notes": "Felt very relaxed today"
  }'
```

### AI & ML Endpoints

#### 1. Generate Habit Recommendations
```bash
curl -X POST http://localhost:5000/api/ai/questionnaire \
  -H "Content-Type: application/json" \
  -d '{
    "focusAreas": ["health", "productivity"],
    "motivationTime": "morning",
    "mood": "motivated",
    "motivationStyle": "achievement",
    "consistencyRating": 4,
    "mainDistraction": "social_media"
  }'
```

#### 2. ML Prediction
```bash
curl -X POST http://localhost:5000/api/ml/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "habitId": 1,
    "features": {
      "dayOfWeek": 1,
      "timeOfDay": "morning",
      "mood": "good",
      "streakLength": 5
    }
  }'
```

#### 3. Train ML Model
```bash
curl -X POST http://localhost:5000/api/ml/train \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "modelType": "habit_completion",
    "userId": "user123"
  }'
```

### Admin Endpoints

#### 1. Get All Users (Admin Only)
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### 2. Get Admin Stats
```bash
curl -X GET http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

## Postman Configuration

### Environment Variables Setup

Create a new Postman environment with these variables:

```json
{
  "base_url": "http://localhost:5000",
  "auth_token": "",
  "session_cookie": "",
  "user_id": "",
  "habit_id": ""
}
```

### Pre-request Scripts

#### Auto-extract JWT Token
```javascript
// Add to login request's Tests tab
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.session && response.session.access_token) {
        pm.environment.set("auth_token", response.session.access_token);
    }
}
```

#### Auto-extract Session Cookie
```javascript
// Add to any authenticated request's Tests tab
const cookies = pm.cookies.all();
const sessionCookie = cookies.find(cookie => cookie.name === 'connect.sid');
if (sessionCookie) {
    pm.environment.set("session_cookie", `connect.sid=${sessionCookie.value}`);
}
```

### Postman Collection Structure

```
HabitMaster API Tests/
├── 🔐 Authentication/
│   ├── Register User
│   ├── Login User
│   ├── Get Current User
│   ├── Google OAuth
│   └── Logout
├── 🎯 Habits/
│   ├── Get Habits
│   ├── Create Habit
│   ├── Update Habit
│   ├── Delete Habit
│   └── Complete Habit
├── 🤖 AI & ML/
│   ├── Generate Recommendations
│   ├── ML Prediction
│   ├── Train Model
│   └── AI Insights
├── 👑 Admin/
│   ├── Get Users
│   └── Get Stats
└── 🔧 Utilities/
    ├── Health Check
    └── Database Status
```

---

## Test Cases & Edge Cases

### Authentication Test Cases

#### ✅ Valid Test Cases
```bash
# 1. Successful registration
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "valid.user@example.com",
    "password": "StrongPass123!",
    "firstName": "Valid",
    "lastName": "User"
  }'

# 2. Successful login
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "valid.user@example.com",
    "password": "StrongPass123!"
  }'
```

#### ❌ Edge Cases & Error Scenarios

```bash
# 1. Invalid email format
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
# Expected: 400 Bad Request

# 2. Weak password
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123",
    "firstName": "Test",
    "lastName": "User"
  }'
# Expected: 400 Bad Request

# 3. Missing required fields
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
# Expected: 400 Bad Request

# 4. Duplicate email registration
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing@example.com",
    "password": "password123",
    "firstName": "Duplicate",
    "lastName": "User"
  }'
# Expected: 400 Bad Request (if email already exists)

# 5. Wrong credentials
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "valid.user@example.com",
    "password": "WrongPassword"
  }'
# Expected: 400 Bad Request
```

### Habits API Test Cases

#### ✅ Valid Test Cases
```bash
# 1. Create valid habit
curl -X POST http://localhost:5000/api/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Daily Reading",
    "description": "Read for 30 minutes",
    "category": "Learning",
    "targetValue": 30,
    "unit": "minutes",
    "frequency": "daily"
  }'

# 2. Complete habit with valid data
curl -X POST http://localhost:5000/api/habits/1/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "value": 30,
    "notes": "Read a great chapter today"
  }'
```

#### ❌ Edge Cases
```bash
# 1. Create habit without authentication
curl -X POST http://localhost:5000/api/habits \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Unauthorized Habit"
  }'
# Expected: 401 Unauthorized

# 2. Invalid habit data
curl -X POST http://localhost:5000/api/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "",
    "targetValue": -5
  }'
# Expected: 400 Bad Request

# 3. Access non-existent habit
curl -X GET http://localhost:5000/api/habits/99999 \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: 404 Not Found

# 4. Complete habit with invalid value
curl -X POST http://localhost:5000/api/habits/1/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "value": -10
  }'
# Expected: 400 Bad Request
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Example Scenario |
|------|---------|------------------|
| 200 | Success | Successful API call |
| 201 | Created | New resource created |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Validation errors |
| 500 | Internal Server Error | Server-side error |

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Detailed error message",
    "code": "ERROR_CODE",
    "details": "Additional context"
  }
}
```

---

## Environment Setup

### 1. Development Environment
```bash
# Set environment variables
export NODE_ENV=development
export DATABASE_URL="your_supabase_db_url"
export SUPABASE_URL="your_supabase_url"
export SUPABASE_ANON_KEY="your_supabase_key"
export SESSION_SECRET="your_session_secret"
export JWT_SECRET="your_jwt_secret"
export OPENAI_API_KEY="your_openai_key" # Optional

# Start server
npm run dev
```

### 2. Testing Environment Variables
```bash
# For testing with mock data
export NODE_ENV=test
export OPENAI_API_KEY="sk-placeholder-key-for-development"
```

---

## Complete Test Workflow

### 1. Basic Authentication Flow
```bash
# Step 1: Register
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "workflow.test@example.com",
    "password": "TestPass123!",
    "firstName": "Workflow",
    "lastName": "Test"
  }'

# Step 2: Login and capture session
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "workflow.test@example.com",
    "password": "TestPass123!"
  }'

# Step 3: Use session for authenticated requests
curl -X GET http://localhost:5000/api/habits \
  -b cookies.txt
```

### 2. Complete Habit Management Flow
```bash
# 1. Create habit
HABIT_RESPONSE=$(curl -X POST http://localhost:5000/api/habits \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Test Habit",
    "category": "Health",
    "targetValue": 1,
    "unit": "times",
    "frequency": "daily"
  }')

# 2. Extract habit ID (requires jq)
HABIT_ID=$(echo $HABIT_RESPONSE | jq -r '.id')

# 3. Complete the habit
curl -X POST http://localhost:5000/api/habits/$HABIT_ID/complete \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "value": 1,
    "notes": "Completed successfully"
  }'

# 4. Get updated habits list
curl -X GET http://localhost:5000/api/habits \
  -b cookies.txt
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Email Validation Error
**Problem:** `"Email address \"test@gmail.com\" is invalid"`

**Solutions:**
- Use more realistic email formats: `user.name@example.com`
- Use your actual email with `+test` suffix: `your.email+test@gmail.com`
- Check Supabase email validation settings

#### 2. Authentication Issues
**Problem:** 401 Unauthorized errors

**Solutions:**
- Ensure session cookies are included in requests
- Check JWT token expiration
- Verify environment variables are set correctly

#### 3. CORS Issues
**Problem:** Cross-origin request blocked

**Solutions:**
- Ensure CORS is configured in server
- Use same origin for testing (localhost:5000)
- Check browser developer tools for CORS errors

#### 4. Database Connection Issues
**Problem:** Database-related errors

**Solutions:**
- Verify DATABASE_URL is correct
- Check Supabase connection status
- Ensure database tables exist

---

## Performance Testing

### Load Testing with cURL
```bash
# Test concurrent requests
for i in {1..10}; do
  curl -X GET http://localhost:5000/ &
done
wait

# Measure response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/habits
```

### curl-format.txt
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

---

## Security Testing

### 1. SQL Injection Tests
```bash
# Test with malicious input
curl -X POST http://localhost:5000/api/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "'; DROP TABLE habits; --",
    "category": "Security Test"
  }'
```

### 2. XSS Prevention Tests
```bash
# Test with script injection
curl -X POST http://localhost:5000/api/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "<script>alert(\"XSS\")</script>",
    "category": "Security Test"
  }'
```

---

## Monitoring & Logging

### Enable Debug Logging
```bash
# Set debug environment
export DEBUG=habitmaster:*
npm run dev
```

### Health Check Endpoint
```bash
# Monitor server health
curl -X GET http://localhost:5000/api/health
```

---

This comprehensive guide covers all aspects of testing the HabitMaster API. Start with the basic authentication flow and gradually test more complex scenarios. Use the Postman collection for organized testing and the cURL commands for automated testing scripts.

**Next Steps:**
1. Import the Postman collection structure
2. Set up environment variables
3. Run the basic authentication flow
4. Test each endpoint systematically
5. Implement automated testing scripts

Happy testing! 🚀
