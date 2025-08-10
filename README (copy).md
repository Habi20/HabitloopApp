# Habit Tracker - Local Development Setup

A comprehensive AI-powered habit tracking application with personalized coaching, email notifications, and advanced analytics.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (or Docker for containerized setup)
- Git

## Quick Start

```bash
# Clone and install
git clone <your-repo-url>
cd habit-tracker
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:push

# Start development server
npm run dev
```

## Detailed Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb habit_tracker_dev

# Set DATABASE_URL in .env
DATABASE_URL="postgresql://username:password@localhost:5432/habit_tracker_dev"
```

#### Option B: Docker PostgreSQL
```bash
# Start PostgreSQL container
docker run --name habit-tracker-db \
  -e POSTGRES_DB=habit_tracker_dev \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:14

# Set DATABASE_URL in .env
DATABASE_URL="postgresql://admin:password@localhost:5432/habit_tracker_dev"
```

#### Option C: Neon (Cloud PostgreSQL)
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to DATABASE_URL

### 3. Environment Configuration

Create `.env` file in project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/habit_tracker_dev"

# Authentication (Replit Auth)
REPL_ID="your-repl-id"
REPLIT_DOMAINS="localhost:5000"
SESSION_SECRET="your-super-secret-session-key-minimum-32-characters"
ISSUER_URL="https://replit.com/oidc"

# OpenAI (Optional - for enhanced AI features)
OPENAI_API_KEY="sk-your-openai-api-key"

# Gmail Integration (Optional)
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Anthropic (Optional - for alternative AI provider)
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"
```

### 4. Initialize Database

The database schema is defined in `shared/schema.ts` using Drizzle ORM. This creates 7 PostgreSQL tables:

```bash
# Push schema to database (creates all tables)
npm run db:push
```

**Tables Created:**
- `sessions` - User session storage (required for auth)
- `users` - User accounts and profiles  
- `habits` - Personal habits created by users
- `habit_completions` - Daily completion tracking
- `streaks` - Habit streak calculations
- `ai_insights` - AI-generated insights
- `coaching_messages` - Personalized coaching content

**Note:** The synthetic habit database in `server/syntheticDatabase.ts` is NOT stored in PostgreSQL. It's a static collection of 100+ habit templates used for generating personalized recommendations during the onboarding questionnaire.

### 5. Start Development Server

```bash
# Start both frontend and backend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5000
- Backend API: http://localhost:5000/api

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Start login flow
- `GET /api/logout` - Logout user
- `GET /api/callback` - OAuth callback

### Habits
- `GET /api/habits` - Get user's habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit

### Habit Completions
- `GET /api/completions` - Get habit completions
- `POST /api/completions` - Mark habit as complete
- `DELETE /api/completions/:habitId/:date` - Remove completion

### AI Coaching
- `GET /api/coaching/messages` - Get coaching messages
- `POST /api/coaching/generate-insight` - Generate new insight
- `PUT /api/coaching/messages/:id/read` - Mark message as read
- `POST /api/coach/ask` - Ask coach a question

### AI Insights
- `GET /api/insights` - Get AI insights
- `POST /api/insights/generate` - Generate insight
- `PUT /api/insights/:id/read` - Mark insight as read

### Email Integration
- `GET /api/email/status` - Check email connection status
- `POST /api/email/connect` - Start Gmail OAuth flow
- `GET /api/email/callback` - Gmail OAuth callback
- `GET /api/email/settings` - Get email preferences
- `PUT /api/email/settings` - Update email preferences
- `POST /api/email/test` - Send test email

## Database Schema

### Core Tables
- `users` - User accounts and profiles
- `habits` - User's habits with settings
- `habit_completions` - Daily habit completion records
- `streaks` - Habit streak tracking
- `ai_insights` - Generated AI insights
- `coaching_messages` - AI coaching messages
- `sessions` - User session storage

## External Service Setup

### Gmail Integration
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/email/callback`
6. Copy Client ID and Client Secret to `.env`

### OpenAI Integration
1. Create account at [openai.com](https://openai.com)
2. Generate API key
3. Add to `.env` as `OPENAI_API_KEY`

### Anthropic Integration
1. Create account at [anthropic.com](https://anthropic.com)
2. Generate API key
3. Add to `.env` as `ANTHROPIC_API_KEY`

## Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run check        # Type check TypeScript

# Database
npm run db:push      # Push schema changes to database

# Production
npm run build        # Build for production
npm run start        # Start production server
```

## Project Structure

```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
├── server/          # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   ├── replitAuth.ts    # Authentication middleware
│   ├── coachingEngine.ts # AI coaching logic
│   ├── emailService.ts  # Email integration
│   └── openai.ts        # OpenAI integration
├── shared/          # Shared types and schemas
│   └── schema.ts        # Database schema and types
└── migrations/      # Database migrations
```

## Key Features

- **Habit Tracking**: Create, manage, and track daily habits
- **AI Coaching**: Personalized guidance and insights
- **Streak Tracking**: Monitor habit consistency
- **Email Notifications**: Gmail integration for reminders
- **Progress Analytics**: Detailed habit statistics
- **Responsive Design**: Mobile-friendly interface

## Troubleshooting

### Local Development Issues

#### TypeScript Module Resolution Errors
If you encounter `Cannot find package '@shared/schema'` errors:

```bash
# Use the local development configuration
npm run dev:local

# Or run with explicit TypeScript config
tsx --project tsconfig.local.json server/index.ts
```

#### Node.js ESM Extension Errors
For `Unknown file extension ".ts"` errors with ts-node:

```bash
# Use tsx instead of ts-node
npx tsx server/db.ts

# Or use the local config
npx tsx --project tsconfig.local.json server/db.ts
```

### Database Connection Issues
```bash
# Check PostgreSQL status
brew services list | grep postgresql
# or
docker ps | grep postgres

# Reset database
npm run db:push
```

### Authentication Issues
- Local development uses automatic demo user login
- Replit environment requires proper `SESSION_SECRET` configuration
- Check `REPL_ID` and `REPLIT_DOMAINS` for production deployment

### Gmail OAuth Errors
- Verify redirect URI matches exactly: `http://localhost:5000/api/email/callback`
- Ensure OAuth consent screen is configured
- Add test users if app is in testing mode

### AI Features Not Working
- Verify API keys are correctly set in `.env`
- Check API quota limits
- Ensure proper scopes and permissions

### Common Local Setup Problems

1. **Path Resolution Issues**: Use `tsconfig.local.json` for local development
2. **Authentication Errors**: Application auto-creates demo user for local testing
3. **Database Errors**: Ensure PostgreSQL is running or use Docker setup
4. **Module Import Errors**: Check Node.js version (requires 18+)

## Production Deployment

For production deployment, ensure:
1. Use secure `SESSION_SECRET`
2. Set `NODE_ENV=production`
3. Configure proper database connection
4. Set up proper domain for OAuth redirects
5. Enable HTTPS for security