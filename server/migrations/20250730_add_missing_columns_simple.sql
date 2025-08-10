-- Migration: add_missing_columns_simple
-- Created: 2025-07-30T21:39:17.478Z
-- Description: add_missing_columns_simple

-- Add password_hash column if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR;

-- Add role column if missing  
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user';

-- Add difficulty column if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS difficulty VARCHAR DEFAULT 'medium';

-- Recreate role_permissions table to ensure clean state
DROP TABLE IF EXISTS role_permissions CASCADE;

CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR NOT NULL,
    permission VARCHAR NOT NULL,
    UNIQUE(role, permission)
);

-- Create user_permissions table if not exists
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR NOT NULL,
    granted_at TIMESTAMP DEFAULT NOW(),
    granted_by VARCHAR REFERENCES users(id),
    UNIQUE(user_id, permission)
);

-- Insert all role permissions
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
    ('admin', 'admin:system');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- Update existing users to have default role
UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';
