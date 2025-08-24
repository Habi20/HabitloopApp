# 🎯 HabitLoop - AI-Powered Habit Tracking & Gamification Platform

A comprehensive habit tracking application with AI-powered recommendations, gamification features, personalized coaching, and machine learning insights.

## 🆕 Latest Updates (August 2025)

### ✅ Recent Fixes & Improvements
- **Fixed XP/Level Calculation**: Corrected database inconsistencies and API caching issues
- **Enhanced ML Integration**: Fixed JWT authentication for ML endpoints
- **Dynamic User Data**: Implemented real-time data fetching from database
- **Improved Authentication**: Fixed localStorage duplication and session management
- **Performance Optimization**: Enhanced API response times and data consistency

### 🔧 Technical Improvements
- **Database Consistency**: Automated XP/level calculation and validation
- **API Caching**: Implemented smart caching with fresh data for critical endpoints
- **ML Endpoint Authentication**: Fixed JWT verification for habit performance scores
- **User Data Synchronization**: Real-time sync between frontend and backend
- **Error Handling**: Enhanced error handling and logging throughout the application

## ✨ Features

### 🧠 AI-Powered Recommendations & ML Insights
- **Personalized Questionnaire**: 10-step AI questionnaire for custom habit suggestions
- **Smart Recommendations**: OpenAI-powered habit generation based on user preferences
- **Interactive Carousel**: Beautiful recommendation display with Font Awesome icons
- **One-Click Addition**: Add AI recommendations directly to your habit list
- **ML Performance Scores**: Machine learning-based habit performance analysis
- **AI Coach Assistant**: Context-aware coaching with personalized insights
- **Predictive Analytics**: Success rate predictions and optimization suggestions

### 🎮 Gamification System
- **XP & Leveling**: Earn experience points and level up with accurate calculation
- **Streak Tracking**: Maintain consecutive day streaks with bonuses
- **Challenges**: Daily, weekly, and monthly challenges with rewards
- **Achievements**: Unlock badges and milestones
- **Fair XP Calculation**: Prevents inflated XP from streak bonuses
- **Real-time Updates**: Live XP/level synchronization across all components
- **Data Consistency**: Automated validation and correction of user progress

### 📊 Analytics & Insights
- **Real-time Dashboard**: Live habit completion tracking
- **AI Insights**: Personalized recommendations and insights
- **Progress Visualization**: Charts and progress indicators
- **Performance Metrics**: Success rates and improvement tracking
- **ML Performance Analysis**: Machine learning-based habit scoring
- **Predictive Insights**: AI-powered success predictions
- **Context-Aware Coaching**: Personalized recommendations based on user data

### 🔄 Habit Management
- **Flexible Habits**: Customizable target values, units, and frequencies
- **Reminder System**: Time-based notifications
- **Category Organization**: Organize habits by categories
- **Completion Tracking**: Mark habits as complete/incomplete
- **Edit & Delete**: Full CRUD operations

### 🏆 Challenge System
- **Daily Challenges**: Complete Today's Goals (25 XP)
- **Weekly Challenges**: 7-Day Streak Master (50 XP), Early Bird (25 XP)
- **Monthly Challenges**: Habit Explorer (100 XP), Consistency Champion (200 XP)
- **Progress Tracking**: Real-time challenge completion status

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- OpenAI API Key
- JWT Secret (for authentication)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd HabitMaster
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. **Environment Setup**
```bash
# Create .env file in server directory
cp .env.example .env

# Add your configuration
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
TIMEZONE=Asia/Colombo
```

4. **Database Setup**
```bash
cd server
npm run migrate
```

5. **Start the application**
```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm run dev
```

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query for server state
- **Routing**: Wouter for navigation
- **Icons**: Font Awesome 6.4.0

### Backend (Node.js + Express)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based auth system with session management
- **AI Integration**: OpenAI API for recommendations and coaching
- **ML Services**: Machine learning models for performance analysis
- **Validation**: Zod schema validation
- **Caching**: Smart caching with fresh data for critical endpoints

### Database Schema
```sql
-- Core tables
users (id, email, xp, level, role, isGuest, difficulty, profileImageUrl, questionnaire, emailSettings)
habits (id, user_id, title, category, target_value, unit, reminder_time, frequency, is_active, color, icon)
habit_completions (id, habit_id, user_id, completed_at, value)
streaks (id, habit_id, user_id, current_streak, longest_streak, last_completed_at)

-- Gamification tables
challenges (id, user_id, type, title, description, xp_reward, progress, is_completed)
ai_insights (id, user_id, insight_type, content, created_at)

-- ML & Analytics tables
ml_predictions (id, user_id, habit_id, prediction_score, confidence, created_at)
user_performance (id, user_id, habit_id, performance_score, metrics, updated_at)
```

## 🎯 Gamification System

### XP Calculation (Updated)
```typescript
// Base XP per completion
const baseXP = 10;

// Streak bonus (capped at 20)
const streakBonus = Math.min(currentStreak * 2, 20);

// Total XP = baseXP + streakBonus
const totalXP = baseXP + streakBonus;

// Level calculation (simplified)
const level = Math.floor(totalXP / 100) + 1;
```

### Data Consistency
- **Automated Validation**: Regular XP/level consistency checks
- **Real-time Updates**: Live synchronization across all components
- **Database Integrity**: Prevents data inconsistencies
- **Audit System**: Comprehensive testing framework for data validation

### Challenge Types
- **Daily**: Complete Today's Goals (25 XP)
- **Weekly**: 7-Day Streak Master (50 XP), Early Bird (25 XP)
- **Monthly**: Habit Explorer (100 XP), Consistency Champion (200 XP)

## 🤖 AI & ML Integration

### Recommendation Generation
1. **User Questionnaire**: 10 personalized questions
2. **AI Processing**: OpenAI analyzes responses
3. **Habit Generation**: Creates 3-5 custom habits
4. **Storage**: Saves to localStorage and database
5. **Display**: Interactive carousel with full details

### AI Features
- **Personalized Suggestions**: Based on user preferences
- **Difficulty Assessment**: Easy/Medium/Hard classification
- **Success Rate Prediction**: AI-estimated completion probability
- **Benefit Analysis**: Key benefits and success tips
- **Reasoning Explanation**: Why AI recommends each habit

### ML Performance Analysis
- **Habit Performance Scores**: Machine learning-based scoring (0-100)
- **Confidence Levels**: High/Medium/Low confidence predictions
- **Performance Metrics**: Completion rates, streaks, and trends
- **Personalized Recommendations**: Context-aware suggestions
- **Predictive Analytics**: Success rate predictions and optimization

### AI Coach Assistant
- **Context-Aware Coaching**: Personalized insights based on user data
- **Progress Analysis**: Detailed habit completion analysis
- **Motivation Boost**: AI-powered motivational content
- **Habit Optimization**: Suggestions for improving habit performance
- **Weekly Planning**: AI-assisted habit planning and scheduling

## 📱 User Interface

### Key Components
- **HabitRecommendationCarousel**: AI recommendations display
- **ChallengesSystem**: Gamification challenges
- **XPBreakdownCard**: XP and level tracking
- **HabitCard**: Individual habit management
- **AIInsightCard**: AI-powered insights
- **CoachingDashboard**: Personalized coaching

### Design Features
- **Responsive Design**: Mobile-first approach
- **Dark/Light Mode**: Theme support
- **Accessibility**: WCAG compliant
- **Animations**: Smooth transitions and feedback
- **Haptic Feedback**: Mobile vibration support

## 🔧 Development

### Available Scripts
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run tests
npm run test:watch   # Watch mode testing

# Database
npm run migrate      # Run database migrations
npm run db:check     # Check database connection

# Data Validation
npm run audit-xp     # Audit XP/level consistency
npm run fix-data     # Fix data inconsistencies
```

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/guest` - Guest mode access

### Habits
- `GET /api/habits` - Get user habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit

### Completions
- `GET /api/completions/daily-status` - Today's status
- `POST /api/completions/complete` - Complete habit
- `POST /api/completions/uncomplete` - Uncomplete habit

### Analytics
- `GET /api/analytics/xp-calculation` - XP breakdown
- `GET /api/analytics/streaks` - Streak information
- `GET /api/analytics/dashboard` - Dashboard data

### AI & ML
- `POST /api/ai/questionnaire` - Generate recommendations
- `GET /api/ai/recommendations` - Get recommendations
- `GET /api/coach/services` - Get AI coach services
- `POST /api/coach/insight` - Generate AI coach insights
- `GET /api/ml/habit-scores/:id` - Get ML performance scores
- `POST /api/ml/predict` - Make ML predictions
- `GET /api/ml/evaluate` - Evaluate questionnaire with ML

### Challenges
- `GET /api/challenges` - Get user challenges
- `POST /api/challenges/:id/claim` - Claim challenge reward

## 🎨 UI Components

### shadcn/ui Integration
- **Card**: Content containers
- **Button**: Interactive elements
- **Badge**: Status indicators
- **Dialog**: Modal windows
- **Form**: Input components
- **Toast**: Notifications

### Custom Components
- **HabitRecommendationCarousel**: AI recommendations
- **ChallengesSystem**: Gamification interface
- **XPBreakdownCard**: Progress tracking
- **AIInsightCard**: AI insights display

## 🔒 Security & Data Integrity

### Authentication
- **JWT Tokens**: Secure session management
- **Guest Mode**: Limited access for non-registered users
- **Role-based Access**: User/admin permissions
- **Password Hashing**: Secure password storage
- **Session Management**: Secure session handling with PostgreSQL storage

### Data Integrity
- **XP/Level Validation**: Automated consistency checks
- **Database Constraints**: Referential integrity enforcement
- **Audit Logging**: Comprehensive data change tracking
- **Error Handling**: Graceful error recovery and logging

### Data Protection
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content sanitization
- **CORS Configuration**: Cross-origin security

## 🚀 Deployment

### Production Build
```bash
# Build client
cd client
npm run build

# Build server
cd ../server
npm run build

# Start production server
npm start
```

### Environment Variables
```bash
# Required
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key

# Optional
TIMEZONE=Asia/Colombo
PORT=3001
NODE_ENV=production
```

## 📈 Performance & Monitoring

### Optimization
- **React Query**: Efficient data fetching and caching
- **Code Splitting**: Lazy-loaded components
- **Image Optimization**: Compressed assets
- **Bundle Analysis**: Webpack bundle optimization
- **Smart Caching**: Intelligent caching with fresh data for critical endpoints
- **API Optimization**: Optimized database queries and response times

### Monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time monitoring
- **User Analytics**: Usage pattern tracking
- **Data Consistency**: Automated validation and monitoring
- **ML Model Performance**: Machine learning model accuracy tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

## 🧪 Testing Framework

### Level & Streak Audit System
- **Automated Testing**: Comprehensive testing framework for XP/level consistency
- **Data Validation**: Automated validation of user progress data
- **Audit Scripts**: Database backup, validation, and correction scripts
- **Performance Testing**: ML endpoint and API performance testing
- **Integration Testing**: End-to-end testing of all features

### Test Scripts
```bash
# Data validation and testing
test/Level_Streak_Audit/
├── audit_scripts/
│   ├── backup-full-database.cjs
│   ├── document-user-state.cjs
│   ├── audit-lisa-only.cjs
│   └── audit-all-users.cjs
├── debug-ml-endpoint.cjs
├── test-xp-calculation.cjs
└── force-update-lisa-database.cjs
```

---

**Built with ❤️ using React, TypeScript, AI, and Machine Learning**