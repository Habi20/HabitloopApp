-- Rollback for: 002_add_rbac_roles.sql
-- Created: 2025-01-30

-- Drop RBAC tables
DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS role_permissions;

-- Remove role column from users (if it was added by this migration)
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Drop enum type
DROP TYPE IF EXISTS user_role;