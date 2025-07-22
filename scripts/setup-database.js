
import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

async function setupDatabase() {
  try {
    console.log("Setting up database schema...");
    
    // Create users table
    await db.execute(sql`
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
      )
    `);

    // Create habits table with all columns from schema
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        title VARCHAR NOT NULL,
        description TEXT,
        category VARCHAR NOT NULL,
        target_value INTEGER DEFAULT 1,
        unit VARCHAR DEFAULT 'times',
        reminder_time VARCHAR,
        frequency VARCHAR DEFAULT 'daily',
        is_active BOOLEAN DEFAULT true,
        color VARCHAR DEFAULT '#6366F1',
        icon VARCHAR DEFAULT 'fas fa-check',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create habit_completions table with created_at and date columns
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS habit_completions (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER NOT NULL REFERENCES habits(id),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        completed_at DATE NOT NULL,
        value INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(habit_id, user_id, completed_at)
      )
    `);

    // Create streaks table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS streaks (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER NOT NULL REFERENCES habits(id),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_completed_at DATE,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(habit_id, user_id)
      )
    `);

    // Create ai_insights table with all columns from schema
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_insights (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        type VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        priority VARCHAR DEFAULT 'normal',
        actionable BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create coaching_messages table
    await db.execute(sql`
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
      )
    `);

    // Create sessions table for session storage
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire)
    `);

    console.log("✅ Database schema created successfully!");
    
    // Create a demo user
    await db.execute(sql`
      INSERT INTO users (id, email, first_name, last_name, level, xp, is_guest)
      VALUES ('demo-user', 'demo@example.com', 'Demo', 'User', 1, 0, false)
      ON CONFLICT (id) DO NOTHING
    `);
    
    console.log("✅ Demo user created!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    process.exit(1);
  }
}

setupDatabase();
