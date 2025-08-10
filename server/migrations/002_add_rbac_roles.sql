-- Add RBAC role system
-- Created: 2025-01-30

-- Add role column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user';

-- Create role enum values
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'premium', 'coach', 'admin');
    END IF;
END $$;

-- Create permissions table for fine-grained access control
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by VARCHAR REFERENCES users(id),
  UNIQUE(user_id, permission)
);

-- Define default role permissions
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