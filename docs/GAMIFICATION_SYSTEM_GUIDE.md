# Gamification System Guide

## Overview

The HabitMaster gamification system is designed to motivate users through XP (Experience Points), levels, streaks, challenges, and achievements. This system transforms habit tracking into an engaging game-like experience.

## Core Components

### 1. XP (Experience Points) System

#### XP Calculation Formula
```
Base XP = 10 points per completion
Streak Bonus = min(streak * 2, 20) points
Total XP = Base XP + Streak Bonus
```

#### Level System
```
Level = floor(sqrt(totalXP / 100)) + 1
XP to Next Level = (level + 1)² * 100 - totalXP
```

#### Fair XP Calculation
- XP is calculated per completion, not per habit
- Each completion awards XP based on the streak at that moment
- Prevents inflated XP from applying max streak to all completions

### 2. Streak System

#### Streak Rules
- **Current Streak**: Consecutive days with at least one habit completion
- **Longest Streak**: Highest streak achieved historically
- **Streak Reset**: Occurs when a day is missed
- **Same Day Completions**: Multiple completions on the same day don't affect streak

#### Streak Calculation
```typescript
// From storage.ts - updateStreakOnCompletion
if (daysDiff === 1) {
  newCurrentStreak = (streak.currentStreak || 0) + 1;
} else if (daysDiff === 0) {
  // Same day completion, don't change streak
  return;
} else if (daysDiff > 1) {
  newCurrentStreak = 1; // Reset streak if gap
}
```

### 3. Challenge System

#### Challenge Types

##### Daily Challenges
- **Complete Today's Goals**: Complete all active habits today
- **Reward**: 25 XP
- **Expiration**: End of current day

##### Weekly Challenges
- **7-Day Streak Master**: Complete all habits for 7 consecutive days
- **Early Bird**: Complete morning habits before 9 AM for 5 days
- **Rewards**: 25-50 XP
- **Expiration**: End of current week

##### Monthly Challenges
- **Habit Explorer**: Create 3 new habits this month
- **Consistency Champion**: Achieve 90% completion rate this month
- **Rewards**: 100-200 XP
- **Expiration**: End of current month

#### Challenge Progress Tracking
- Real-time progress calculation using `challenge_progress` table
- Automatic completion detection
- XP rewards upon completion
- Challenge completion tracking using `challenge_completions` table
- Reset logic for daily/weekly/monthly challenges
- AI insights generated for completed challenges

### 4. Habit Completion Management

#### Daily Reset Logic
- Habits reset to "not complete" each day
- Previous day's completions don't carry over
- Users must actively complete habits daily

#### Uncompletion Feature
- Users can uncomplete habits within 24 hours
- XP is deducted when uncompleting
- Streaks are recalculated accordingly

#### Completion Status
```typescript
interface HabitCompletionStatus {
  habitId: number;
  isCompletedToday: boolean;
  isCompletedYesterday: boolean;
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: string | null;
  completionDate: string | null;
  canUncomplete: boolean;
  xpEarned: number;
}
```

## Database Schema Integration

### Key Tables

#### users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### habits
```sql
CREATE TABLE habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  reminder_time TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### habit_completions
```sql
CREATE TABLE habit_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER REFERENCES habits(id),
  user_id TEXT REFERENCES users(id),
  completed_at TEXT NOT NULL,
  value INTEGER DEFAULT 1
);
```

#### streaks
```sql
CREATE TABLE streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER REFERENCES habits(id),
  user_id TEXT REFERENCES users(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_at TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### ai_insights
```sql
CREATE TABLE ai_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### challenge_completions
```sql
CREATE TABLE challenge_completions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  challenge_id VARCHAR(255) NOT NULL,
  xp_awarded INTEGER NOT NULL,
  completed_at DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  reset_at DATE
);
```

#### challenge_progress
```sql
CREATE TABLE challenge_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  challenge_id VARCHAR(255) NOT NULL,
  progress_value INTEGER DEFAULT 0,
  last_updated DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### ml_predictions
```sql
CREATE TABLE ml_predictions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  habit_id INTEGER REFERENCES habits(id),
  prediction_percentage DECIMAL(5,2) NOT NULL,
  confidence_level VARCHAR(20) DEFAULT 'low',
  prediction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Timezone Handling

### Configuration
- **Default Timezone**: Asia/Colombo (UTC+5:30)
- **Environment Variable**: `TIMEZONE=Asia/Colombo`
- **Consistent Date Operations**: All date/time operations use timezone utilities

### Timezone Utilities
```typescript
// From utils/timezone.ts
export class TimezoneUtils {
  static getCurrentDateString(): string; // YYYY-MM-DD
  static getDaysDifference(date1: string, date2: string): number;
  static isSameDay(date1: string, date2: string): boolean;
  static getWeekNumber(date: Date): number;
  static getMonthNumber(date: Date): number;
}
```

## API Endpoints

### XP and Analytics
- `GET /api/analytics/xp-calculation` - Fair XP calculation with breakdown
- `GET /api/analytics/streaks` - Detailed streak information
- `GET /api/analytics/dashboard` - Comprehensive user analytics

### Habit Completion
- `GET /api/completions/daily-status` - Today's habit status
- `POST /api/completions/complete` - Complete a habit
- `POST /api/completions/uncomplete` - Uncomplete a habit

### Challenges
- `GET /api/challenges` - Get all user challenges with progress tracking
- `POST /api/challenges/:challengeId/claim` - Claim challenge reward (with database persistence)

## Frontend Integration

### Key Components
- `ChallengesSystem.tsx` - Main challenges display
- `XPBreakdownCard.tsx` - XP calculation and display
- `HabitCard.tsx` - Individual habit with completion status
- `Home.tsx` - Dashboard with real-time data

### Data Flow
1. Frontend fetches data via React Query
2. Backend calculates XP, streaks, and challenges
3. Real-time updates via query invalidation
4. Toast notifications for XP changes

## User Experience Features

### Visual Feedback
- Progress bars for challenges
- XP gain/loss notifications
- Streak counters with fire icons
- Color-coded challenge categories

### Gamification Elements
- Level progression with clear next-level targets
- Achievement badges for milestones
- Challenge completion celebrations
- Streak maintenance encouragement

### Accessibility
- Clear progress indicators
- Intuitive completion/uncompletion
- Helpful tooltips and explanations
- Responsive design for all devices

## Best Practices

### For Users
1. **Complete habits daily** to maintain streaks
2. **Claim challenge rewards** immediately when completed
3. **Check challenges regularly** for new opportunities
4. **Use the uncompletion feature** within 24 hours if needed

### For Developers
1. **Always use timezone utilities** for date operations
2. **Invalidate relevant queries** after data changes
3. **Provide clear error messages** for failed operations
4. **Test edge cases** like timezone changes and leap years

## Future Enhancements

### Planned Features
- **Achievement System**: Badges for milestones
- **Social Features**: Leaderboards and sharing
- **Advanced Challenges**: Team challenges and competitions
- **Custom Rewards**: User-defined goals and rewards
- **Analytics Dashboard**: Detailed progress visualization

### Technical Improvements
- **Caching Strategy**: Optimize query performance
- **Real-time Updates**: WebSocket integration
- **Offline Support**: Local storage for offline tracking
- **Mobile App**: Native mobile application

## Troubleshooting

### Common Issues
1. **XP not updating**: Check query invalidation
2. **Streaks not calculating**: Verify timezone settings
3. **Challenges not appearing**: Ensure user has active habits
4. **Completion status wrong**: Check daily reset logic

### Debug Tools
- `/api/analytics/xp-calculation` - Detailed XP breakdown
- `/api/analytics/streaks` - Streak calculation details
- Browser console logs for frontend debugging
- Server logs for backend debugging

## Conclusion

The gamification system provides a comprehensive framework for engaging users in habit formation. By combining XP, streaks, challenges, and achievements, it creates a motivating environment that encourages consistent habit completion while maintaining data integrity and user experience quality.
