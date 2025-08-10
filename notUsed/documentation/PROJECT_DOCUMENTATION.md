# HabitFlow - Full-Stack Project Documentation

## Project Overview

HabitFlow is a comprehensive habit tracking application with AI-powered personalization and machine learning prediction capabilities. The system combines React frontend, Node.js/Express backend, PostgreSQL database, and OpenAI integration to deliver intelligent habit formation guidance.

## Technical Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI + shadcn/ui components
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES2022 modules)
- **Database ORM**: Drizzle ORM
- **Authentication**: Replit OAuth + Session management
- **Session Store**: PostgreSQL-backed sessions

### Database
- **Primary Database**: PostgreSQL
- **Schema Management**: Drizzle migrations
- **Connection Pooling**: Neon serverless adapter

### AI & ML Integration
- **Primary AI**: OpenAI GPT-4 API
- **Secondary AI**: Anthropic Claude (fallback)
- **ML Framework**: scikit-learn (Python)
- **ML Model**: Linear Regression for habit success prediction

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │───▶│  Express API    │───▶│   PostgreSQL    │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │  Python ML      │              │
         └──────────────┤  Linear Regress │──────────────┘
                        │  (Predictions)  │
                        └─────────────────┘
                                 │
                     ┌─────────────────┐
                     │   OpenAI API    │
                     │  (AI Features)  │
                     └─────────────────┘
```

## Database Schema

### Core Tables
1. **users** - User profiles and authentication
2. **habits** - Habit definitions and settings
3. **habit_completions** - Daily completion tracking
4. **streaks** - Streak calculations and milestones
5. **ai_insights** - AI-generated personalized insights
6. **coaching_messages** - Contextual coaching guidance
7. **sessions** - Authentication session storage
8. **ml_habit_features** - ML training data and features

### Key Relationships
- Users have many habits (1:N)
- Habits have many completions (1:N)
- Users receive AI insights and coaching (1:N)
- ML features derive from user behavior patterns

## API Endpoints

### Authentication
- `GET /api/login` - OAuth login initiation
- `GET /api/callback` - OAuth callback handler
- `GET /api/logout` - User logout
- `GET /api/auth/user` - Current user profile

### Habit Management
- `GET /api/habits` - User's habits list
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit

### Completion Tracking
- `GET /api/completions` - Get completions with date filter
- `POST /api/completions` - Record habit completion
- `DELETE /api/completions` - Remove completion

### AI Features
- `GET /api/insights` - AI insights for user
- `POST /api/insights/generate` - Generate new insights
- `GET /api/coaching/messages` - Coaching messages
- `POST /api/coach/ask` - Ask AI coach questions
- `POST /api/ai/questionnaire` - Process user questionnaire

### Machine Learning
- `POST /api/ml/train` - Train prediction model
- `POST /api/ml/predict` - Predict habit success
- `GET /api/ml/status` - Model training status
- `GET /api/ml/evaluate` - Evaluate user's success probability

## Machine Learning Implementation

### Model Purpose
Predicts habit completion success probability based on:
- User level and experience points
- Number of existing habits
- Habit difficulty and characteristics
- Reminder settings and frequency
- Historical completion patterns

### Training Data
- 200 synthetic samples with realistic patterns
- Features: user_level, user_xp, target_value, reminder_set, etc.
- Target: completion_rate (0.0 to 1.0)

### Model Performance
- Algorithm: Linear Regression with StandardScaler
- Expected R² Score: 0.75-0.85
- Feature importance ranking available
- Confidence levels: high (>70%), medium (40-70%), low (<40%)

### Prediction Flow
1. User profile extraction from database
2. Feature encoding (categorical → numerical)
3. Input scaling using trained scaler
4. Model prediction with confidence assessment
5. Interpretation and recommendation generation

## Setup Instructions

### 1. Environment Variables
```bash
# Core Configuration
DATABASE_URL="postgresql://username:password@host:port/database"
SESSION_SECRET="64-character-hex-string"
NODE_ENV="development"
PORT="5000"

# Authentication (Production)
REPL_ID="your-repl-id"
REPLIT_DOMAINS="localhost:5000,your-domain.replit.dev"
ISSUER_URL="https://replit.com/oidc"

# AI Services (Optional)
OPENAI_API_KEY="sk-your-openai-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"

# Email Integration (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 2. Database Setup
```bash
# Push schema to database
npm run db:push

# Verify connection
npm run check
```

### 3. Python Dependencies
```bash
# Install ML dependencies
pip install pandas scikit-learn psycopg2-binary numpy
```

### 4. Development Server
```bash
# Start development server
npm run dev

# Server runs on http://localhost:5000
```

## Usage Guide

### For End Users

#### 1. Account Setup
- Sign in using Replit OAuth or create guest account
- Complete initial questionnaire for personalized recommendations
- Set up email preferences for notifications

#### 2. Habit Management
- Create habits with categories, targets, and reminders
- Track daily completions with simple clicks
- View progress analytics and streak information

#### 3. AI Features
- Receive personalized insights based on behavior patterns
- Get contextual coaching messages for motivation
- Ask the AI coach specific questions about habits

#### 4. ML Predictions
- Train the prediction model using your data
- Get success probability estimates for new habits
- Receive data-driven recommendations for habit optimization

### For Developers

#### 1. Adding New Features
- Define database schema in `shared/schema.ts`
- Implement storage methods in `server/storage.ts`
- Create API routes in `server/routes.ts`
- Build React components in `client/src/components/`

#### 2. AI Integration
- OpenAI functions in `server/openai.ts`
- Coaching engine in `server/coachingEngine.ts`
- Synthetic data fallbacks in `server/syntheticDatabase.ts`

#### 3. ML Model Updates
- Training data in `ml_model.py`
- Model service in `server/mlModel.ts`
- Frontend interface in `client/src/components/MLPredictionCard.tsx`

## Data Flow

### 1. User Interaction Flow
```
User Action → React Component → TanStack Query → 
Express Route → Storage Layer → PostgreSQL → 
Response → UI Update
```

### 2. AI Coaching Flow
```
Habit Completion → Coaching Engine → Pattern Analysis → 
OpenAI API → Personalized Message → Database Storage → 
Real-time Notification
```

### 3. ML Prediction Flow
```
User Profile → Feature Extraction → Python Model → 
Prediction Calculation → Confidence Assessment → 
Recommendation Generation → API Response
```

## Testing Strategy

### 1. API Testing
```bash
# Test authentication
curl http://localhost:5000/api/auth/user

# Test ML endpoints
curl -X POST http://localhost:5000/api/ml/train
curl http://localhost:5000/api/ml/status
```

### 2. ML Model Validation
```bash
# Train and test model
python3 ml_model.py

# Expected output: R² score, feature importance, sample predictions
```

### 3. Frontend Testing
- Component rendering with mock data
- API integration with loading states
- Error handling and user feedback

## Deployment

### 1. Production Environment
- Replit deployment with automatic scaling
- PostgreSQL production database
- SSL certificate management
- Environment variable configuration

### 2. Performance Optimization
- Database query optimization with indexes
- API response caching
- Frontend bundle optimization
- Image and asset optimization

## Security Considerations

### 1. Authentication & Authorization
- OAuth2 with Replit provider
- Session-based authentication
- Route protection middleware
- CSRF protection

### 2. Data Protection
- Input validation with Zod schemas
- SQL injection prevention via ORM
- Secure session storage
- API rate limiting

### 3. AI Safety
- Content filtering for AI responses
- Rate limiting for expensive AI operations
- Fallback systems for AI unavailability
- User control over AI features

## Monitoring & Analytics

### 1. Application Metrics
- API response times
- Database query performance
- User engagement patterns
- Error rates and logging

### 2. ML Model Metrics
- Prediction accuracy over time
- Feature drift detection
- Model retraining frequency
- User feedback on predictions

## Future Enhancements

### 1. Advanced ML Features
- Deep learning models for better predictions
- Natural language processing for habit descriptions
- Collaborative filtering for habit recommendations
- Real-time adaptation based on user feedback

### 2. Enhanced User Experience
- Mobile app development
- Social features and habit sharing
- Gamification elements
- Advanced analytics dashboard

### 3. Integration Capabilities
- Wearable device integration
- Calendar synchronization
- Third-party app connections
- Export/import functionality

This documentation provides comprehensive coverage of the HabitFlow application architecture, implementation details, and operational procedures for both development and production environments.