-- Baseline migration created manually on 2025-01-30
-- Source: Production schema from supabase_production_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
) WITH (OIDS=FALSE);
ALTER TABLE sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Users table with RBAC
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY NOT NULL,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  role VARCHAR DEFAULT 'user', -- RBAC implementation
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  is_guest BOOLEAN DEFAULT false,
  questionnaire JSONB,
  email_settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR DEFAULT 'general',
  target_value INTEGER DEFAULT 1,
  unit VARCHAR DEFAULT 'times',
  frequency VARCHAR DEFAULT 'daily',
  reminder_time VARCHAR,
  color VARCHAR DEFAULT '#3B82F6',
  icon VARCHAR DEFAULT '⭐',
  difficulty VARCHAR DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habit completions table
CREATE TABLE IF NOT EXISTS habit_completions (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value INTEGER DEFAULT 1,
  completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(habit_id, completed_at)
);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completion_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(habit_id, user_id)
);

-- AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR DEFAULT 'suggestion',
  category VARCHAR DEFAULT 'general',
  confidence_score DECIMAL(3,2) DEFAULT 0.75,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Coaching messages table
CREATE TABLE IF NOT EXISTS coaching_messages (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type VARCHAR DEFAULT 'encouragement',
  trigger_event VARCHAR,
  scheduled_for TIMESTAMP,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_active ON habits(is_active);
CREATE INDEX IF NOT EXISTS idx_completions_user_date ON habit_completions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON habit_completions(habit_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_unread ON ai_insights(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_coaching_unsent ON coaching_messages(user_id, is_sent);

-- Insert default admin user (for development)
INSERT INTO users (id, email, first_name, role, level) 
VALUES ('admin-user-id', 'admin@habitloop.com', 'Admin', 'admin', 10)
ON CONFLICT (id) DO NOTHING;