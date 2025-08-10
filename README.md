# HabitMaster

A modern habit tracking application with AI-powered insights and coaching.

## Authentication System

The application uses a dual-table authentication system:

1. **Supabase Auth (`auth.users`)**: Handles core authentication
   - User credentials
   - OAuth providers
   - Session management
   - Email verification

2. **Application Users (`public.users`)**: Stores application-specific data
   - XP and Level
   - Role and Permissions
   - User preferences
   - Application state

This separation allows us to leverage Supabase's secure authentication while maintaining full control over application-specific user data.

### Authentication Flow

1. **User Registration**:
   ```typescript
   POST /api/auth/signup
   {
     email: string;
     password: string;
     firstName?: string;
     lastName?: string;
   }
   ```
   - Creates Supabase auth user
   - Creates corresponding entry in `public.users`
   - Returns session tokens

2. **User Login**:
   ```typescript
   POST /api/auth/signin
   {
     email: string;
     password: string;
   }
   ```
   - Validates credentials via Supabase
   - Syncs with `public.users` if needed
   - Returns session tokens

3. **Session Management**:
   - Session tokens stored in:
     - Browser: LocalStorage (`sb-[project-id]-auth-token`)
     - Server: Express session
   - Tokens automatically included in API requests
   - Server validates tokens via Supabase

4. **Protected Routes**:
   - All API routes under `/api/*` require authentication
   - Frontend routes check auth state via React Query
   - Unauthorized access redirects to login

### User Data Sync

The system automatically syncs between Supabase auth and application users:

1. **On Signup**: Creates both auth and application user
2. **On Login**: Verifies auth user exists in application DB
3. **On API Calls**: Merges auth and application user data

## Features

- Habit Tracking
- Progress Analytics
- AI Coaching
- Social Features
- Email Integration

## Development

1. **Setup Environment**:
   ```bash
   cp .env.example .env
   # Fill in required values:
   # SUPABASE_URL=your_supabase_url
   # SUPABASE_KEY=your_supabase_key
   # DATABASE_URL=your_database_url
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Testing**:
   ```bash
   npm test
   ```

## API Routes

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login existing user
- `POST /api/auth/magic-link` - Send magic link
- `GET /api/auth/user` - Get current user
- `POST /api/auth/signout` - Logout

### Habits
- `GET /api/habits` - List user's habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit

### Completions
- `GET /api/completions` - List habit completions
- `POST /api/completions` - Record completion
- `DELETE /api/completions/:id` - Remove completion

### AI Features
- `GET /api/insights` - Get AI insights
- `GET /api/coaching/messages` - Get coaching messages

## Database Schema

### public.users
```sql
CREATE TABLE public.users (
  id character varying NOT NULL,
  email character varying UNIQUE,
  first_name character varying,
  last_name character varying,
  profile_image_url character varying,
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  is_guest boolean DEFAULT false,
  questionnaire jsonb,
  email_settings jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  password_hash character varying,
  role character varying DEFAULT 'user'::character varying,
  difficulty character varying DEFAULT 'medium'::character varying,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.