# HabitFlow - AI-Powered Habit Tracking Application

## 🚀 Project Overview

HabitFlow is a modern, AI-powered habit tracking application built with React, TypeScript, and Node.js. It features personalized habit recommendations, ML-powered success predictions, and comprehensive analytics to help users build lasting habits.

## ✨ Key Features

### 🔐 Authentication System

- **Supabase Integration**: Secure email/password authentication
- **Magic Link Support**: Passwordless login via email
- **Session Management**: Persistent login state with proper token handling
- **Guest Mode**: Try the app without creating an account

### 🧠 AI-Powered Features

- **Personalized Recommendations**: ML-based habit suggestions based on user preferences
- **Success Predictor**: AI models predict habit completion probability
- **Smart Insights**: Automated analysis of habit patterns and progress
- **AI Coach Assistant**: Personalized guidance and motivation

### 📊 Analytics & Tracking

- **Real-time Progress**: Live habit completion tracking
- **Streak Monitoring**: Visual streak counters and milestone tracking
- **Detailed Statistics**: Comprehensive analytics dashboard
- **Performance Metrics**: Completion rates, consistency scores, and trends

### 🎯 Core Functionality

- **Habit Management**: Create, edit, delete, and categorize habits
- **Completion Tracking**: Mark habits as complete with timestamps
- **Reminder System**: Customizable notification settings
- **Category Organization**: Health, Productivity, Learning, Mindfulness, Social, Creative

### 🔧 Technical Features

- **Responsive Design**: Mobile-first approach with modern UI
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Local storage for guest mode
- **API Integration**: RESTful backend with comprehensive endpoints

## 🏗️ Architecture

### Frontend (React + TypeScript)

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (shadcn/ui)
│   │   ├── AddHabitModal.tsx
│   │   ├── AICoachAssistant.tsx
│   │   ├── LoginModal.tsx
│   │   └── ...
│   ├── pages/              # Main application pages
│   │   ├── Home.tsx        # Dashboard
│   │   ├── Habits.tsx      # Habit management
│   │   ├── Stats.tsx       # Analytics
│   │   ├── Profile.tsx     # User profile
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication state
│   │   └── useToast.ts     # Notification system
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   └── lib/                # Utility functions
```

### Backend (Node.js + Express)

```
server/
├── routes/                 # API route handlers
│   ├── authRoutes.ts       # Authentication endpoints
│   ├── habitRoutes.ts      # Habit management
│   ├── aiRoutes.ts         # AI/ML endpoints
│   └── ...
├── ml/                     # Machine learning models
│   ├── models/             # Trained ML models
│   ├── services/           # ML inference services
│   └── pipelines/          # Feature engineering
├── migrations/             # Database migrations
└── scripts/                # Utility scripts
```

### Database Schema

- **Users**: Authentication and profile data
- **Habits**: Habit definitions and metadata
- **Completions**: Daily habit completion records
- **Streaks**: Habit streak tracking
- **Insights**: AI-generated insights and recommendations

## 🛠️ Technology Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Query** for state management
- **React Router** for navigation

### Backend

- **Node.js** with Express
- **TypeScript** for type safety
- **Supabase** for authentication and database
- **Drizzle ORM** for database operations
- **Jest** for testing

### AI/ML

- **Python** for ML models
- **scikit-learn** for machine learning
- **TensorFlow** for deep learning (optional)
- **OpenAI API** for AI insights

### Infrastructure

- **PostgreSQL** database
- **Redis** for caching (optional)
- **Docker** for containerization

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Python 3.8+ (for ML features)
- PostgreSQL database
- Supabase account

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd HabitFlow
```

2. **Install dependencies**

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

3. **Environment Setup**

```bash
# Create .env file in root directory
cp .env.example .env

# Configure environment variables
DATABASE_URL=your_postgresql_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=your_session_secret
```

4. **Database Setup**

```bash
# Run database migrations
cd server
npm run migrate

# Verify database connection
npm run db:verify
```

5. **Start Development Servers**

```bash
# Start both client and server
npm run dev

# Or start individually
npm run dev:client  # Frontend on http://localhost:5173
npm run dev:server  # Backend on http://localhost:5000
```

## 📱 Usage Guide

### Authentication

1. Visit `http://localhost:5173`
2. Click "Get Started Free" to open login modal
3. Choose between:
   - **Email/Password**: Traditional login
   - **Magic Link**: Passwordless authentication
   - **Guest Mode**: Try without account

### Creating Habits

1. Navigate to "All Habits" page
2. Click "Add Habit" button
3. Fill in habit details:
   - Title and description
   - Category (Health, Productivity, etc.)
   - Target value and frequency
   - Reminder time (optional)
4. Save to start tracking

### Tracking Progress

1. **Daily Completion**: Mark habits as complete on the home dashboard
2. **View Statistics**: Check progress on the Stats page
3. **AI Insights**: Get personalized recommendations and insights
4. **Streak Tracking**: Monitor consistency and streaks

### AI Features

1. **AI Coach**: Access personalized guidance and motivation
2. **Success Predictor**: View ML-powered completion predictions
3. **Smart Recommendations**: Get habit suggestions based on your profile
4. **Progress Analysis**: AI-generated insights about your patterns

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/magic-link` - Send magic link
- `GET /api/auth/user` - Get current user
- `POST /api/auth/signout` - User logout

### Habits

- `GET /api/habits` - Get user habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/complete` - Mark habit complete

### Analytics

- `GET /api/completions` - Get completion data
- `GET /api/insights` - Get AI insights
- `GET /api/coaching/messages` - Get coaching messages
- `POST /api/coaching/generate-insight` - Generate new insight

### AI/ML

- `GET /api/ml/status` - Check ML model status
- `POST /api/ml/train` - Train ML models
- `POST /api/ml/predict` - Get predictions
- `POST /api/ai/questionnaire` - Process questionnaire
- `GET /api/ai/recommendations` - Get habit recommendations

## 🧪 Testing

### Frontend Tests

```bash
cd client
npm test
```

### Backend Tests

```bash
cd server
npm test
```

### API Testing

```bash
# Test authentication
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test habits endpoint (requires auth)
curl -X GET http://localhost:5000/api/habits \
  -H "Cookie: connect.sid=your_session_cookie"
```

## 🚀 Deployment

### Frontend Deployment

```bash
cd client
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend Deployment

```bash
cd server
npm run build
npm start
```

### Environment Variables for Production

```bash
NODE_ENV=production
DATABASE_URL=your_production_db_url
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_key
SESSION_SECRET=your_secure_session_secret
FRONTEND_URL=https://your-domain.com
```

## 🔒 Security Features

- **Session Management**: Secure session handling with Redis/PostgreSQL
- **Authentication**: Supabase-powered secure authentication
- **Input Validation**: Zod schema validation for all inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Configuration**: Proper CORS setup for security
- **Environment Variables**: Secure configuration management

## 📊 Performance Optimizations

- **React Query**: Efficient data fetching and caching
- **Code Splitting**: Lazy loading for better performance
- **Image Optimization**: Optimized images and icons
- **Database Indexing**: Proper database indexing for queries
- **Caching**: Redis caching for frequently accessed data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the API testing guide in `docs/HABITMASTER_API_TESTING_GUIDE.md`

## 🔄 Recent Updates (October 8, 2024)

### ✅ Completed Features

- **Authentication System**: Complete Supabase integration with session management
- **User State Management**: Proper handling of authenticated vs guest users
- **Protected Routes**: All API endpoints now require authentication
- **Login Modal**: Replaced Google OAuth with proper email/password login
- **Magic Link Support**: Passwordless authentication option
- **Profile Management**: User profile display with proper data handling
- **Habit Management**: Full CRUD operations with user-specific data
- **Analytics Dashboard**: Comprehensive statistics and progress tracking

### 🐛 Bug Fixes

- Fixed authentication state persistence
- Resolved user data type mismatches
- Fixed redirect loops after logout
- Corrected API endpoint authentication requirements
- Fixed user profile data display issues

### 🔧 Technical Improvements

- Updated all pages to use proper authentication
- Implemented helper functions for user data handling
- Added comprehensive error handling
- Improved code formatting and consistency
- Enhanced type safety throughout the application

---

**HabitFlow** - Transform your life with AI-powered habit tracking! 🚀
