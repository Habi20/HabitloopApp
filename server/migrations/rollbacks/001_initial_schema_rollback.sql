-- Rollback for: 001_initial_schema.sql
-- Created: 2025-01-30

-- Drop tables in reverse order (respecting foreign key constraints)
DROP TABLE IF EXISTS coaching_messages;
DROP TABLE IF EXISTS ai_insights;
DROP TABLE IF EXISTS streaks;
DROP TABLE IF EXISTS habit_completions;
DROP TABLE IF EXISTS habits;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS sessions;

-- Drop indexes (they'll be dropped with tables, but explicit for clarity)
-- No additional cleanup needed for indexes

-- Drop extensions (optional - usually kept for other uses)
-- DROP EXTENSION IF EXISTS "uuid-ossp";