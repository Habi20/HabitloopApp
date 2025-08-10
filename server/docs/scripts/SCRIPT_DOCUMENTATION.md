
# HabitMaster Database Scripts Documentation

## Overview
This document describes all database and migration utility scripts used in the HabitMaster project.

## Script Organization

### Database Scripts (`scripts/database/`)
Scripts for database verification, testing, and schema analysis.

### Migration Scripts (`scripts/migration/`)
Scripts for migration management, tracking, and troubleshooting.

### Utility Scripts (`scripts/utilities/`)
General utility scripts for project maintenance.

---

## Database Scripts Reference

### `verify-current-schema.ts`
**Purpose**: Comprehensive schema verification and table analysis  
**Usage**: `npm run db:verify`  
**Output**: 
- Complete users table column list with types and defaults
- Role permissions count and sample data
- All public table names
- Schema validation status

**When to use**: 
- After schema migrations to verify changes
- Before major releases to confirm database state
- During debugging of schema-related issues

---

### `test-db-connection.ts` 
**Purpose**: Database connectivity testing and basic health check  
**Usage**: `npm run db:test`  
**Output**:
- PostgreSQL version information
- Connection success/failure status
- List of accessible tables
- Network connectivity diagnostics

**When to use**:
- Before running migrations
- When troubleshooting connection issues
- During deployment verification

---

### `verify-schema-state.ts`
**Purpose**: Quick schema state check with focus on recent changes  
**Usage**: `npm run db:state`  
**Output**:
- Users table structure summary
- Role permissions summary
- Recent schema modifications

**When to use**:
- Quick verification after manual changes
- During development to check current state
- Before/after testing procedures

---

## Migration Scripts Reference

### `record-manual-migration.ts`
**Purpose**: Record manually applied schema changes in migration tracking  
**Usage**: `npm run migration:record`  
**Output**: Confirmation of migration record insertion  

**When to use**:
- After applying manual schema changes via Supabase Dashboard
- To synchronize migration tracking with actual database state
- For documentation and audit trail

---

### `check-migration-records.ts`
**Purpose**: Display complete migration history from tracking table  
**Usage**: `npm run migration:history`  
**Output**: 
- Chronological list of executed migrations
- Execution timestamps
- Migration file names and IDs

**When to use**:
- To review migration history
- During troubleshooting of migration issues
- For audit and compliance reporting

---

### `cleanup-failed-migration.ts`
**Purpose**: Clean up failed migration state and remove partial changes  
**Usage**: `npm run migration:cleanup`  
**Output**: Confirmation of cleanup operations  

**When to use**:
- After migration failures that leave database in inconsistent state
- Before retrying failed migrations
- During migration system maintenance

---

## Migration System Reference

### `run-migrations.ts`
**Purpose**: Main migration execution engine  
**Usage**: `npm run migrate`  
**Features**:
- Automatic migration file discovery
- Execution status tracking
- Comprehensive logging
- Error handling and rollback

---

### `migration-status.ts`
**Purpose**: Display current migration system status  
**Usage**: `npm run migrate:status`  
**Output**: Professional migration status report  

---

### `create-migration.ts`
**Purpose**: Generate new migration files with proper naming  
**Usage**: `npm run migrate:create "description"`  
**Output**: New migration file with timestamp and template  

---

### `rollback-migration.ts`
**Purpose**: Rollback migrations with safety checks  
**Usage**: `npm run migrate:rollback`  
**Features**: 
- Last migration rollback
- Rollback to specific migration
- Rollback template generation

---

## Usage Examples

### Development Workflow

Check database connection
npm run db:test

Verify current schema state
npm run db:verify

Check migration status
npm run migrate:status

Run pending migrations
npm run migrate

Verify migration results
npm run db:verify

text

### Troubleshooting Workflow
Check migration history
npm run migration:history

Verify database state
npm run db:state

Test connectivity
npm run db:test

Clean up if needed
npm run migration:cleanup

text

### Production Deployment
Pre-deployment checks
npm run db:test
npm run migrate:status

Apply migrations
npm run migrate

Post-deployment verification
npm run db:verify
npm run migration:history

text

---

## File Locations

server/
├── scripts/
│ ├── database/
│ │ ├── verify-current-schema.ts
│ │ ├── test-db-connection.ts
│ │ └── verify-schema-state.ts
│ ├── migration/
│ │ ├── record-manual-migration.ts
│ │ ├── check-migration-records.ts
│ │ └── cleanup-failed-migration.ts
│ ├── create-migration.ts
│ ├── migration-status.ts
│ └── rollback-migration.ts
├── migrations/
│ ├── run-migrations.ts
│ ├── migration-tracker.ts
│ └── [migration files]
└── docs/
└── scripts/
└── SCRIPT_DOCUMENTATION.md

text

---

## Best Practices

### Script Development
- Use consistent error handling patterns
- Include comprehensive logging
- Follow TypeScript best practices
- Use centralized environment configuration

### Database Operations
- Always verify connection before operations
- Use transactions for multi-step operations
- Include rollback procedures for destructive changes
- Document all manual interventions

### Migration Management
- Test migrations on development environment first
- Create rollback scripts for all migrations
- Document migration purposes and effects
- Maintain migration history integrity

---

## Maintenance

### Regular Tasks
- Review migration history monthly
- Verify schema consistency quarterly
- Update documentation with new scripts
- Clean up deprecated utility scripts

### Monitoring
- Check database connection health
- Monitor migration execution times
- Track schema drift from expected state
- Audit manual interventions

---

## Thesis Project Benefits

This organized script system demonstrates:
- **Professional database management practices**
- **Comprehensive testing and verification procedures**
- **Production-ready migration workflows**
- **Excellent documentation and organization**
- **Industry-standard development practices**

---

*Last updated: 2025-07-31*  
*Project: HabitLoop*  
*Author: Database Management System*

server/
├── scripts/
│   ├── database/           # Database utilities
│   ├── migration/          # Migration management
│   └── utilities/          # General utilities
├── migrations/             # Migration system
├── docs/                   # Documentation
│   └── scripts/           # Script documentation
└── [core application files]
