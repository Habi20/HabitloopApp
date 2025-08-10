# Local Development Setup Guide

## Quick Fix for Your Current Issues

### 1. TypeScript Configuration for Local Development

Your current errors are caused by Node.js module resolution conflicts. Use this configuration:

```bash
# For Windows local development
npx tsx --loader tsx/esm server/index.ts

# Alternative method
node --loader tsx/esm server/index.ts
```

### 2. Environment Setup for Local Development

Create `.env.local` file:
```env
# Database (use one of these options)
DATABASE_URL="postgresql://admin:password@localhost:5432/habit_tracker_dev"

# Session (for local development)
SESSION_SECRET="local-dev-secret-key-minimum-32-characters-long"

# Optional AI Services
OPENAI_API_KEY="your-openai-key-here"
ANTHROPIC_API_KEY="your-anthropic-key-here"

# Gmail Integration (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Database Setup Options

#### Option A: Docker (Recommended for Windows)
```bash
# Start PostgreSQL with Docker
docker run --name habit-tracker-db ^
  -e POSTGRES_DB=habit_tracker_dev ^
  -e POSTGRES_USER=admin ^
  -e POSTGRES_PASSWORD=password ^
  -p 5432:5432 ^
  -d postgres:14

# Initialize database
npm run db:push
```

#### Option B: Local PostgreSQL Installation
```bash
# Install PostgreSQL on Windows
# Download from: https://www.postgresql.org/download/windows/

# Create database
createdb -U postgres habit_tracker_dev

# Set environment variable
set DATABASE_URL=postgresql://postgres:your_password@localhost:5432/habit_tracker_dev
```

#### Option C: Cloud Database (Neon/Supabase)
1. Create account at neon.tech or supabase.com
2. Create new project
3. Copy connection string to `.env.local`

### 4. Package.json Scripts for Local Development

Add these scripts to package.json:
```json
{
  "scripts": {
    "dev:local": "tsx --loader tsx/esm server/index.ts",
    "dev:win": "tsx --project tsconfig.local.json server/index.ts",
    "db:test": "tsx server/db.ts"
  }
}
```

### 5. Fixing Common Windows Development Issues

#### Path Resolution
Create `tsconfig.local.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "target": "ES2022",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  },
  "ts-node": {
    "esm": false
  }
}
```

#### Import Resolution
For `@shared/schema` import errors, use relative imports in local development:
```typescript
// Instead of: import { schema } from "@shared/schema"
// Use: import { schema } from "../shared/schema"
```

### 6. Authentication Setup for Local Development

The application now uses simplified authentication for local development:
- Automatically creates demo user: `demo@example.com`
- No authentication required for testing
- All API endpoints work with demo user session

### 7. Running the Application Locally

```bash
# Step 1: Install dependencies
npm install

# Step 2: Setup environment
copy .env.example .env.local
# Edit .env.local with your configuration

# Step 3: Start database (Docker recommended)
docker-compose up -d

# Step 4: Initialize database
npm run db:push

# Step 5: Start development server
npm run dev
# or for Windows-specific issues:
npm run dev:local
```

### 8. Verifying Setup

Check these endpoints once server is running:
- http://localhost:5000 - Frontend application
- http://localhost:5000/api/auth/user - User authentication
- http://localhost:5000/api/habits - Habit management
- http://localhost:5000/api/completions - Habit tracking

### 9. Development Tools

#### Database Management
```bash
# View database in browser
# Start Adminer: http://localhost:8080
# Server: postgres, User: admin, Password: password, Database: habit_tracker_dev

# Or use pgAdmin, DBeaver, or similar tools
```

#### API Testing
```bash
# Test API endpoints with curl
curl http://localhost:5000/api/auth/user
curl http://localhost:5000/api/habits
```

### 10. Common Solutions

#### "Cannot find package" errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Use explicit paths
tsx --project tsconfig.local.json server/index.ts
```

#### "Unknown file extension" errors
```bash
# Use tsx instead of ts-node
npx tsx server/db.ts

# Or use Node.js with loader
node --loader tsx/esm server/db.ts
```

#### Authentication errors (500 status)
- All authentication errors have been fixed
- Application uses demo user for local development
- No manual authentication setup required

#### Database connection errors
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database
docker-compose down && docker-compose up -d

# Reset database schema
npm run db:push
```

This setup provides a complete local development environment that works on Windows with proper TypeScript configuration and authentication handling.