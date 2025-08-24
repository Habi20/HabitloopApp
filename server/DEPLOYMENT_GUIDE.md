# 🚀 HabitLoop Backend Deployment Guide

## 📋 Hosting Configuration

### Node.js Settings
- **Node.js Version**: 18.x or 20.x (LTS)
- **Application Mode**: Production
- **Application Startup File**: `index.ts`
- **Application Root**: Upload all files from `server/` directory

## 🔧 Environment Variables Required

Add these environment variables in your hosting panel:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=https://your-frontend-domain.com
TIMEZONE=Asia/Colombo
TZ=Asia/Colombo
```

## 📁 Files to Upload

Upload ALL files and folders from the `server/` directory:

### Core Files
- `index.ts` (main entry point)
- `package.json` (dependencies)
- `tsconfig.json` (TypeScript config)
- `env.ts` (environment config)
- `db.ts` (database connection)
- `storage.ts` (data layer)
- `supabaseAuth.ts` (authentication)

### Directories
- `routes/` (API endpoints)
- `services/` (business logic)
- `utils/` (utility functions)
- `database/` (database utilities)
- `ml/` (machine learning)

### Shared Directory
- `../shared/` (shared schemas and types) - Copy this to `shared/`

### Configuration
- `drizzle.config.ts` (database ORM config)
- `Procfile` (process management)

## 🗄️ Database Setup

You need a PostgreSQL database. The `DATABASE_URL` should be in this format:
```
postgresql://username:password@host:port/database_name
```

## ✅ Verification

After deployment, test these endpoints:
- `GET /` - Should return API status
- `GET /api/health` - Health check
- `GET /api/habits` - Habits endpoint (requires auth)

## 🔗 Frontend Integration

Update your frontend's API base URL to point to your backend:
```javascript
// In your frontend config
API_BASE_URL=https://your-backend-domain.com
```

## 🚨 Troubleshooting

1. **Port Issues**: Make sure PORT environment variable is set
2. **Database Connection**: Verify DATABASE_URL is correct
3. **Dependencies**: Ensure all npm packages are installed
4. **TypeScript**: The app uses tsx to run TypeScript directly

## 📞 Support

If you encounter issues:
1. Check the application logs
2. Verify all environment variables are set
3. Ensure PostgreSQL database is accessible
4. Confirm Node.js version is 18.x or higher
