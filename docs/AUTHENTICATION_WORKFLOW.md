# Authentication Workflow Documentation

## Overview
HabitLoop supports three distinct authentication systems, each with different token types and workflows.

## 1. Supabase Users (Email/Password Signup)

### Authentication Flow
- **Signup**: `/api/auth/signup` (creates Supabase user)
- **Signin**: `/api/auth/signin` (Supabase email/password)
- **Token Type**: Session-based (cookies)
- **Token Storage**: `auth_token` in localStorage
- **User Data**: `authUser` in localStorage

### Request Headers
```javascript
// No Authorization header needed - uses session cookies
// Cookies are automatically sent with requests
```

### Example Flow
```javascript
// 1. Signup
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

// 2. Signin
POST /api/auth/signin
{
  "email": "user@example.com", 
  "password": "password123"
}

// 3. API calls (automatic cookie handling)
GET /api/habits  // Uses session cookies
```

### Database Storage
- `users.supabase_auth_id`: UUID from Supabase
- `users.role`: "user"
- Session stored in `sessions` table

---

## 2. HabitLoop Authenticated Users (Pre-configured)

### Authentication Flow
- **Signin**: `/api/auth/habitloop/signin` (JWT-based)
- **Token Type**: JWT (Bearer token)
- **Token Storage**: `verified_token` in localStorage
- **User Data**: `verifiedUser` in localStorage

### Request Headers
```javascript
Authorization: Bearer <jwt_token>
```

### Example Flow
```javascript
// 1. Signin with pre-configured user
POST /api/auth/habitloop/signin
{
  "userId": "user-005",
  "password": "test123"
}

// Response:
{
  "success": true,
  "user": {
    "id": "user-005",
    "email": "user-005@habitloop.local",
    "firstName": "David",
    "lastName": "Kim",
    "level": 11,
    "xp": 1020,
    "role": "habitloop_user",
    "isGuest": false,
    "difficulty": "medium",
    "profileImageUrl": "📚"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "HabitLoop user authenticated successfully"
}

// 2. API calls with JWT
GET /api/habits
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Database Storage
- `users.id`: String (e.g., "user-005")
- `users.role`: "habitloop_user"
- `users.password_hash`: bcrypt hash for password verification
- No session storage (JWT only)

### Pre-configured Users
```javascript
const habitLoopUsers = {
  'user-001': { /* Alex Chen */ password: 'test123' },
  'user-002': { /* Sarah Johnson */ password: 'test123' },
  'user-003': { /* Marcus Rodriguez */ password: 'test123' },
  'user-004': { /* Emma Thompson */ password: 'test123' },
  'user-005': { /* David Kim */ password: 'test123' },
  'user-006': { /* Lisa Wang */ password: 'test123' },
  'user-007': { /* New User */ password: 'test123' },
  'user-008': { /* Fresh Start */ password: 'test123' },
  'user-009': { /* Zero Level */ password: 'test123' }
};
```

---

## 3. Guest Users (Anonymous)

### Authentication Flow
- **Creation**: Automatic when no authenticated user exists
- **Token Type**: JWT (Bearer token)
- **Token Storage**: `guest_token` in localStorage
- **User Data**: `guestUser` in localStorage

### Request Headers
```javascript
Authorization: Bearer <jwt_token>
```

### Example Flow
```javascript
// 1. Guest user created automatically
// 2. API calls with JWT
GET /api/guest/habits
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Database Storage
- `users.id`: Auto-generated string (e.g., "guest-1234567890")
- `users.role`: "guest"
- `users.is_guest`: true
- No password hash

---

## 4. New HabitLoop User Signup

### Authentication Flow
- **Signup**: `/api/auth/habitloop/signup` (creates new HabitLoop user)
- **Token Type**: JWT (Bearer token)
- **Token Storage**: `verified_token` in localStorage
- **User Data**: `verifiedUser` in localStorage

### Example Flow
```javascript
// 1. Signup new HabitLoop user
POST /api/auth/habitloop/signup
{
  "email": "newuser@example.com",
  "firstName": "New",
  "lastName": "User",
  "password": "password123",
  "difficulty": "medium"
}

// Response:
{
  "success": true,
  "user": {
    "id": "user-1234567890",
    "email": "newuser@example.com",
    "firstName": "New",
    "lastName": "User",
    "level": 1,
    "xp": 0,
    "role": "habitloop_user",
    "isGuest": false,
    "difficulty": "medium",
    "profileImageUrl": "👤"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "HabitLoop user created successfully"
}

// 2. API calls with JWT
GET /api/habits
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Frontend State Management

### localStorage Keys
```javascript
// Supabase Users
auth_token: "supabase_session_token"
authUser: { /* user data */ }

// HabitLoop Users (Pre-configured + New)
verified_token: "jwt_token"
verifiedUser: { /* user data */ }

// Guest Users
guest_token: "jwt_token"
guestUser: { /* user data */ }
```

### AuthContext Priority
```javascript
// Priority order for user state:
1. verifiedUser (HabitLoop users)
2. authUser (Supabase users)
3. guestUser (anonymous users)
```

### Token Usage in API Calls
```javascript
// React Query setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      headers: () => {
        const verifiedToken = localStorage.getItem('verified_token');
        const authToken = localStorage.getItem('auth_token');
        const guestToken = localStorage.getItem('guest_token');
        
        if (verifiedToken) {
          return { Authorization: `Bearer ${verifiedToken}` };
        } else if (authToken) {
          // Supabase users use cookies automatically
          return {};
        } else if (guestToken) {
          return { Authorization: `Bearer ${guestToken}` };
        }
        return {};
      }
    }
  }
});
```

---

## Backend Middleware

### requireAuth Middleware
```javascript
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Check JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, typedEnv.jwtSecret);
      req.user = { id: decoded.userId };
      return next();
    }
    
    // 2. Check session token (Supabase users)
    if (req.session?.token) {
      const { data: { user }, error } = await supabase.auth.getUser(req.session.token);
      if (user && !error) {
        req.user = { id: user.id };
        return next();
      }
    }
    
    // 3. Authentication failed
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token' }
    });
  }
}
```

---

## API Endpoint Access

### HabitLoop Users (JWT)
- All `/api/*` endpoints (except `/api/auth/*`)
- Uses `Authorization: Bearer <jwt>` header

### Supabase Users (Session)
- All `/api/*` endpoints (except `/api/auth/*`)
- Uses session cookies automatically

### Guest Users (JWT)
- Limited to `/api/guest/*` endpoints
- Uses `Authorization: Bearer <jwt>` header

---

## Security Considerations

### JWT Tokens
- **Secret**: `typedEnv.jwtSecret`
- **Expiration**: 7 days
- **Payload**: `{ userId: string }`
- **Storage**: localStorage (client-side)

### Session Tokens
- **Secret**: `typedEnv.sessionSecret`
- **Expiration**: 7 days
- **Storage**: HTTP-only cookies (server-side)
- **Database**: `sessions` table

### Password Security
- **Hashing**: bcrypt with salt rounds 10
- **Storage**: `users.password_hash` field
- **Never returned**: Passwords are stripped from API responses

---

## Testing Authentication

### Test HabitLoop User
```bash
# Signin
curl -X POST http://localhost:5000/api/habitloop/signin \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-005", "password": "test123"}'

# Use returned token
curl http://localhost:5000/api/habits \
  -H "Authorization: Bearer <token_from_signin>"
```

### Test Supabase User
```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "firstName": "Test", "lastName": "User"}'

# Signin (cookies handled automatically)
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# API calls (cookies sent automatically)
curl http://localhost:5000/api/habits
```

---

## Migration Notes

### From Guest to Authenticated
```javascript
// When user signs up/signs in
localStorage.removeItem('guest_token');
localStorage.removeItem('guestUser');
localStorage.setItem('verified_token', newJWT);
localStorage.setItem('verifiedUser', userData);
```

### From Supabase to HabitLoop
```javascript
// Clear Supabase session
localStorage.removeItem('auth_token');
localStorage.removeItem('authUser');
// Set HabitLoop credentials
localStorage.setItem('verified_token', newJWT);
localStorage.setItem('verifiedUser', userData);
```

---

## Error Handling

### 401 Unauthorized
- Invalid/missing token
- Expired token
- Wrong token type for endpoint

### 403 Forbidden
- Guest user accessing authenticated-only endpoint
- Insufficient permissions

### 404 Not Found
- Invalid route path
- User not found in database

---

## Database Schema Summary

```sql
-- Users table supports all three types
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,           -- String for all user types
  email VARCHAR UNIQUE,             -- Required for Supabase/HabitLoop
  first_name VARCHAR,
  last_name VARCHAR,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  is_guest BOOLEAN DEFAULT false,   -- true for guest users
  password_hash VARCHAR,            -- bcrypt hash for HabitLoop users
  role VARCHAR DEFAULT 'user',      -- 'user', 'habitloop_user', 'guest'
  difficulty VARCHAR DEFAULT 'medium',
  supabase_auth_id UUID,           -- NULL for HabitLoop/guest users
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Sessions table for Supabase users
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
```

---

## Summary

| User Type | Token Type | Storage | Endpoints | Database Role |
|-----------|------------|---------|-----------|---------------|
| Supabase | Session | Cookies | `/api/*` | `user` |
| HabitLoop | JWT | localStorage | `/api/*` | `habitloop_user` |
| Guest | JWT | localStorage | `/api/guest/*` | `guest` |

**Key Points:**
- Supabase users use session cookies (automatic)
- HabitLoop users use JWT Bearer tokens (manual header)
- Guest users use JWT Bearer tokens (limited access)
- All JWT tokens use same secret and 7-day expiration
- Passwords are never returned in API responses
- Frontend prioritizes verifiedUser > authUser > guestUser
