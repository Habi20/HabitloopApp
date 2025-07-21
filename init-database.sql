-- Habit Tracker Database Initialization
-- This file shows the PostgreSQL tables that will be created by Drizzle ORM

-- Session storage (required for authentication)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
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
    user_id VARCHAR NOT NULL REFERENCES users(id),
    title VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR NOT NULL,
    target_value INTEGER NOT NULL,
    unit VARCHAR NOT NULL,
    reminder_time VARCHAR,
    color VARCHAR NOT NULL,
    icon VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Habit completions table
CREATE TABLE IF NOT EXISTS habit_completions (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL REFERENCES habits(id),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    completed_at TIMESTAMP DEFAULT NOW(),
    date DATE NOT NULL,
    value INTEGER DEFAULT 1,
    UNIQUE(habit_id, user_id, date)
);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL REFERENCES habits(id),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_at DATE,
    UNIQUE(habit_id, user_id)
);

-- AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Coaching messages table
CREATE TABLE IF NOT EXISTS coaching_messages (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    habit_id INTEGER REFERENCES habits(id),
    message_type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    trigger_data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);