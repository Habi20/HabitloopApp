-- Migration: add_missing_rbac_columns
-- Created: 2025-07-30T21:15:06.661Z
-- Description: add_missing_rbac_columns

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user';

-- Add any other missing columns that should be in your schema
-- (Check your 001_initial_schema.sql vs your actual Supabase schema)

-- For example, if missing:
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS difficulty VARCHAR DEFAULT 'medium';

-- Add RBAC permissions tables if they don't exist
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by VARCHAR REFERENCES users(id),
  UNIQUE(user_id, permission)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR NOT NULL,
  permission VARCHAR NOT NULL,
  UNIQUE(role, permission)
);

-- Insert default role permissions
INSERT INTO role_permissions (role, permission) VALUES
('user', 'habits:create'),
('user', 'habits:read_own'),
('user', 'analytics:basic'),
('premium', 'habits:create'),
('premium', 'habits:read_own'),
('premium', 'analytics:basic'),
('premium', 'analytics:advanced'),
('premium', 'ml:predictions'),
('premium', 'export:own_data'),
('coach', 'habits:create'),
('coach', 'habits:read_own'),
('coach', 'habits:read_others'),
('coach', 'analytics:basic'),
('coach', 'analytics:advanced'),
('coach', 'ml:predictions'),
('admin', 'habits:create'),
('admin', 'habits:read_own'),
('admin', 'habits:read_others'),
('admin', 'analytics:basic'),
('admin', 'analytics:advanced'),
('admin', 'ml:predictions'),
('admin', 'export:own_data'),
('admin', 'admin:users'),
('admin', 'admin:system')
ON CONFLICT (role, permission) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);