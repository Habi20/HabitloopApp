
-- Production Schema Migration for Scalable ML-Driven Habit Tracker
-- Compatible with Supabase and current HabitFlow schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (enhanced from current schema)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    is_guest BOOLEAN DEFAULT false,
    questionnaire JSONB,
    email_settings JSONB,
    role VARCHAR DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Habits table (production-ready)
CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR NOT NULL,
    target_value INTEGER DEFAULT 1,
    unit VARCHAR DEFAULT 'times',
    reminder_time VARCHAR,
    frequency VARCHAR DEFAULT 'daily',
    color VARCHAR DEFAULT '#6366F1',
    icon VARCHAR DEFAULT 'fas fa-check',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Habit completions table
CREATE TABLE IF NOT EXISTS habit_completions (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT NOW(),
    value INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(habit_id, user_id)
);

-- AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Coaching messages table
CREATE TABLE IF NOT EXISTS coaching_messages (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
    message_type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    trigger_data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ML profiles table (for caching user features)
CREATE TABLE IF NOT EXISTS ml_profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    features JSONB NOT NULL,
    last_updated TIMESTAMP DEFAULT NOW(),
    model_version VARCHAR DEFAULT '1.0',
    UNIQUE(user_id)
);

-- Sessions table (for authentication)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_completed_at ON habit_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_messages_user_id ON coaching_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- Sample data for testing (100+ users with habits and completions)
INSERT INTO users (id, email, first_name, last_name, level, xp, questionnaire) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'user1@example.com', 'John', 'Doe', 2, 150, '{"goals": ["fitness", "productivity"], "experience": "beginner"}'),
('550e8400-e29b-41d4-a716-446655440002', 'user2@example.com', 'Jane', 'Smith', 3, 300, '{"goals": ["health", "mindfulness"], "experience": "intermediate"}'),
('550e8400-e29b-41d4-a716-446655440003', 'user3@example.com', 'Mike', 'Johnson', 1, 50, '{"goals": ["learning"], "experience": "beginner"}'),
('550e8400-e29b-41d4-a716-446655440004', 'user4@example.com', 'Sarah', 'Wilson', 4, 500, '{"goals": ["fitness", "nutrition"], "experience": "advanced"}'),
('550e8400-e29b-41d4-a716-446655440005', 'user5@example.com', 'David', 'Brown', 2, 200, '{"goals": ["productivity", "reading"], "experience": "intermediate"}');

-- Continue with additional sample users (abbreviated for space)
-- In production, you would generate 100+ users programmatically

-- Sample habits for testing
INSERT INTO habits (user_id, title, description, category, target_value, unit, color, icon) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Morning Exercise', 'Daily workout routine', 'fitness', 1, 'session', '#10B981', 'fas fa-dumbbell'),
('550e8400-e29b-41d4-a716-446655440001', 'Read Books', 'Read for 30 minutes', 'learning', 30, 'minutes', '#3B82F6', 'fas fa-book'),
('550e8400-e29b-41d4-a716-446655440002', 'Meditation', 'Daily mindfulness practice', 'mindfulness', 15, 'minutes', '#8B5CF6', 'fas fa-leaf'),
('550e8400-e29b-41d4-a716-446655440002', 'Water Intake', 'Drink enough water', 'health', 8, 'glasses', '#06B6D4', 'fas fa-tint'),
('550e8400-e29b-41d4-a716-446655440003', 'Code Practice', 'Daily coding practice', 'learning', 1, 'hour', '#F59E0B', 'fas fa-code');

-- Sample completions for realistic data
INSERT INTO habit_completions (habit_id, user_id, completed_at, value) VALUES
(1, '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 day', 1),
(1, '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '2 days', 1),
(2, '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 day', 30),
(3, '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '1 day', 15),
(4, '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '1 day', 8);

-- Initialize streaks
INSERT INTO streaks (habit_id, user_id, current_streak, longest_streak, last_completed) VALUES
(1, '550e8400-e29b-41d4-a716-446655440001', 2, 5, CURRENT_DATE - 1),
(2, '550e8400-e29b-41d4-a716-446655440001', 1, 10, CURRENT_DATE - 1),
(3, '550e8400-e29b-41d4-a716-446655440002', 1, 3, CURRENT_DATE - 1),
(4, '550e8400-e29b-41d4-a716-446655440002', 1, 7, CURRENT_DATE - 1);

-- Sample AI insights
INSERT INTO ai_insights (user_id, type, title, content) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'progress_analysis', 'Weekly Progress', 'Great work on maintaining your exercise routine! Your consistency is building strong habits.'),
('550e8400-e29b-41d4-a716-446655440002', 'motivation_boost', 'Keep Going!', 'Your meditation practice is showing excellent results. Continue the mindful journey.');

COMMIT;
