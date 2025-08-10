# HabitFlow - Complete System Design Documentation

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ HABITS : creates
    USERS ||--o{ HABIT_COMPLETIONS : records
    USERS ||--o{ STREAKS : maintains
    USERS ||--o{ AI_INSIGHTS : receives
    USERS ||--o{ COACHING_MESSAGES : gets
    HABITS ||--o{ HABIT_COMPLETIONS : tracked_by
    HABITS ||--o{ STREAKS : has
    HABITS ||--o{ COACHING_MESSAGES : triggers
    
    USERS {
        varchar id PK "Primary Key"
        varchar email UK "Unique Key"
        varchar first_name
        varchar last_name
        varchar profile_image_url
        integer level "Default: 1"
        integer xp "Default: 0"
        boolean is_guest "Default: false"
        jsonb questionnaire
        jsonb email_settings
        timestamp created_at
        timestamp updated_at
    }
    
    HABITS {
        serial id PK "Primary Key"
        varchar user_id FK "Foreign Key"
        varchar title "Not Null"
        text description
        varchar category "Not Null"
        integer target_value "Default: 1"
        varchar unit "Default: times"
        varchar reminder_time
        varchar frequency "Default: daily"
        boolean is_active "Default: true"
        varchar color "Default: #6366F1"
        varchar icon "Default: fas fa-check"
        timestamp created_at
        timestamp updated_at
    }
    
    HABIT_COMPLETIONS {
        serial id PK "Primary Key"
        integer habit_id FK "Foreign Key"
        varchar user_id FK "Foreign Key"
        date completed_at "Not Null"
        integer value "Default: 1"
        timestamp created_at
    }
    
    STREAKS {
        serial id PK "Primary Key"
        integer habit_id FK "Foreign Key"
        varchar user_id FK "Foreign Key"
        integer current_streak "Default: 0"
        integer longest_streak "Default: 0"
        date last_completed_at
        timestamp updated_at
    }
    
    AI_INSIGHTS {
        serial id PK "Primary Key"
        varchar user_id FK "Foreign Key"
        varchar type "suggestion|motivation|tip|coaching|celebration"
        varchar title "Not Null"
        text content "Not Null"
        boolean is_read "Default: false"
        varchar priority "Default: normal"
        boolean actionable "Default: false"
        jsonb metadata
        timestamp created_at
    }
    
    COACHING_MESSAGES {
        serial id PK "Primary Key"
        varchar user_id FK "Foreign Key"
        integer habit_id FK "Foreign Key (Optional)"
        varchar message_type "encouragement|streak_celebration|comeback|tip|milestone"
        varchar title "Not Null"
        text content "Not Null"
        jsonb trigger_data
        boolean is_read "Default: false"
        timestamp created_at
    }
    
    SESSIONS {
        varchar sid PK "Primary Key"
        jsonb sess "Not Null"
        timestamp expire "Not Null"
    }
```

## 2. Use Case Diagram

```mermaid
graph TB
    User((User))
    Guest((Guest User))
    AI_System((OpenAI API))
    Email_System((Email Service))
    
    subgraph "HabitFlow System"
        UC1[Register/Login]
        UC2[Create Habits]
        UC3[Track Completions]
        UC4[View Progress]
        UC5[Get AI Insights]
        UC6[Receive Coaching]
        UC7[Manage Profile]
        UC8[Configure Email Settings]
        UC9[Take Questionnaire]
        UC10[Get Recommendations]
        UC11[View Statistics]
        UC12[Maintain Streaks]
    end
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC11
    User --> UC12
    
    Guest --> UC9
    Guest --> UC10
    Guest --> UC1
    
    AI_System --> UC5
    AI_System --> UC6
    AI_System --> UC10
    
    Email_System --> UC8
    Email_System --> UC6
```

## 3. Sequence Diagrams

### 3.1 User Authentication Flow

```mermaid
sequenceDiagram
    participant Client as React Frontend
    participant Server as Express Backend
    participant Auth as Replit Auth
    participant DB as PostgreSQL
    
    Client->>Server: GET /api/login
    Server->>Auth: Redirect to Replit OAuth
    Auth->>Client: OAuth consent page
    Client->>Auth: User grants permission
    Auth->>Server: POST /api/callback (auth code)
    Server->>Auth: Exchange code for tokens
    Auth->>Server: Return user claims & tokens
    Server->>DB: UPSERT user data
    DB->>Server: User record created/updated
    Server->>Client: Set session cookie & redirect
    Client->>Server: GET /api/auth/user
    Server->>DB: Query user by session
    DB->>Server: Return user data
    Server->>Client: JSON user profile
```

### 3.2 Habit Completion Flow with AI Coaching

```mermaid
sequenceDiagram
    participant Client as React Frontend
    participant Server as Express Backend
    participant DB as PostgreSQL
    participant AI as OpenAI API
    participant Coach as Coaching Engine
    
    Client->>Server: POST /api/completions {habitId, date}
    Server->>DB: INSERT habit_completion
    DB->>Server: Completion recorded
    Server->>DB: UPDATE/INSERT streak data
    DB->>Server: Streak updated
    Server->>Coach: processHabitCompletion(userId, habitId)
    Coach->>DB: Query user habits and history
    DB->>Coach: Return completion patterns
    
    alt Milestone reached
        Coach->>AI: generateCoachingMessage(trigger)
        AI->>Coach: Return personalized message
        Coach->>DB: INSERT coaching_message
        DB->>Coach: Message saved
    end
    
    Server->>Client: 200 OK - Completion saved
    Client->>Server: GET /api/coaching/messages
    Server->>DB: Query latest coaching messages
    DB->>Server: Return messages
    Server->>Client: JSON coaching messages
```

## 4. Backend Database Schema

### 4.1 Complete Table Structure

```sql
-- Users table (Authentication & Profile)
CREATE TABLE users (
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

-- Habits table (Core habit definitions)
CREATE TABLE habits (
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
);

-- Habit completions (Daily tracking data)
CREATE TABLE habit_completions (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL REFERENCES habits(id),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    completed_at DATE NOT NULL,
    value INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(habit_id, user_id, completed_at)
);

-- Streaks (Calculated motivation metrics)
CREATE TABLE streaks (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL REFERENCES habits(id),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_at DATE,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(habit_id, user_id)
);

-- AI insights (Personalized recommendations)
CREATE TABLE ai_insights (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    type VARCHAR NOT NULL, -- suggestion, motivation, tip, coaching, celebration
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR DEFAULT 'normal', -- high, normal, low
    actionable BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Coaching messages (AI-driven guidance)
CREATE TABLE coaching_messages (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    habit_id INTEGER REFERENCES habits(id),
    message_type VARCHAR NOT NULL, -- encouragement, streak_celebration, comeback, tip, milestone
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    trigger_data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions (Authentication state)
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX idx_habit_completions_date ON habit_completions(completed_at);
CREATE INDEX idx_streaks_user_id ON streaks(user_id);
CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX idx_coaching_messages_user_id ON coaching_messages(user_id);
CREATE INDEX idx_sessions_expire ON sessions(expire);
```

### 4.2 Relationship Constraints

```sql
-- Foreign Key Relationships
ALTER TABLE habits ADD CONSTRAINT fk_habits_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE habit_completions ADD CONSTRAINT fk_completions_habit 
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE;

ALTER TABLE habit_completions ADD CONSTRAINT fk_completions_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE streaks ADD CONSTRAINT fk_streaks_habit 
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE;

ALTER TABLE streaks ADD CONSTRAINT fk_streaks_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ai_insights ADD CONSTRAINT fk_insights_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE coaching_messages ADD CONSTRAINT fk_coaching_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE coaching_messages ADD CONSTRAINT fk_coaching_habit 
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE SET NULL;
```

## 5. System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        React[React Frontend<br/>TypeScript + Vite]
        Components[UI Components<br/>Radix UI + Tailwind]
        State[State Management<br/>TanStack Query]
    end
    
    subgraph "API Gateway"
        Express[Express.js Server<br/>TypeScript + ESM]
        Auth[Authentication<br/>Replit OAuth]
        Routes[REST API Routes<br/>JSON responses]
    end
    
    subgraph "Business Logic"
        Storage[Database Storage<br/>Drizzle ORM]
        Coach[AI Coaching Engine<br/>Rule-based + AI]
        Email[Email Service<br/>Gmail Integration]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Relational Database)]
        Sessions[(Session Store<br/>PostgreSQL)]
    end
    
    subgraph "External Services"
        OpenAI[OpenAI API<br/>GPT-4 + Embeddings]
        Gmail[Gmail API<br/>OAuth2 + SMTP]
        Replit[Replit Auth<br/>OpenID Connect]
    end
    
    React --> Express
    Components --> State
    State --> Routes
    Express --> Auth
    Routes --> Storage
    Storage --> Coach
    Coach --> Email
    Storage --> PG
    Auth --> Sessions
    Coach --> OpenAI
    Email --> Gmail
    Auth --> Replit
    
    classDef frontend fill:#e1f5fe
    classDef backend fill:#f3e5f5
    classDef database fill:#e8f5e8
    classDef external fill:#fff3e0
    
    class React,Components,State frontend
    class Express,Auth,Routes,Storage,Coach,Email backend
    class PG,Sessions database
    class OpenAI,Gmail,Replit external
```

## 6. API Endpoint Documentation

### 6.1 Authentication Endpoints
```
GET /api/login           - Initiate OAuth login
GET /api/callback        - OAuth callback handler
GET /api/logout          - User logout
GET /api/auth/user       - Get current user profile
```

### 6.2 Habit Management
```
GET /api/habits          - Get user's habits
POST /api/habits         - Create new habit
PUT /api/habits/:id      - Update habit
DELETE /api/habits/:id   - Delete habit
```

### 6.3 Completion Tracking
```
GET /api/completions     - Get completions (with date filter)
POST /api/completions    - Record habit completion
DELETE /api/completions  - Remove completion
```

### 6.4 AI Features
```
GET /api/insights        - Get AI insights for user
POST /api/insights/generate - Generate new insights
GET /api/coaching/messages - Get coaching messages
POST /api/coach/ask      - Ask AI coach a question
```

### 6.5 User Management
```
PUT /api/users/profile   - Update user profile
PUT /api/users/email-settings - Configure email preferences
POST /api/users/guest    - Create guest user
```

## 7. Data Flow Architecture

### 7.1 Frontend → Backend → Database Flow

```
User Action (React) 
    ↓
Component Event Handler 
    ↓
TanStack Query Mutation 
    ↓
HTTP Request (JSON) 
    ↓
Express Route Handler 
    ↓
Request Validation (Zod) 
    ↓
Storage Interface Method 
    ↓
Drizzle ORM Query 
    ↓
PostgreSQL Database 
    ↓
Response Data 
    ↓
JSON Response 
    ↓
React State Update 
    ↓
UI Re-render
```

### 7.2 AI Integration Flow

```
User Trigger Event 
    ↓
Coaching Engine Activation 
    ↓
Context Data Collection 
    ↓
OpenAI API Request 
    ↓
AI Response Processing 
    ↓
Database Storage 
    ↓
Real-time UI Update
```

This documentation provides complete system design coverage for academic presentation and viva preparation.