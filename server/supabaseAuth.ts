import { createClient } from "@supabase/supabase-js";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { env } from "./env";
import type { AuthenticatedUser } from "./types/user";
import { storage } from "./storage";
import jwt from "jsonwebtoken";

// Create Supabase client only if environment variables are set
export const supabase = env.SUPABASE_URL && env.SUPABASE_ANON_KEY 
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  : null;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  const pgStore = connectPg(session);

  const sessionStore = new pgStore({
    conString: env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: env.SESSION_SECRET || env.JWT_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Helper function to check if Supabase is configured
function isSupabaseConfigured() {
  return supabase !== null;
}

export async function setupAuth(app: Express) {
  app.use(getSession());

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      if (!isSupabaseConfigured()) {
        return res.status(503).json({ error: "Supabase authentication is not configured" });
      }

      const { email, password, firstName, lastName } = req.body;
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (data.user) {
        // Create corresponding user in public.users table
        await storage.createUser({
          id: data.user.id,
          email: data.user.email || null,
          firstName: data.user.user_metadata?.first_name || null,
          lastName: data.user.user_metadata?.last_name || null,
          role: 'user',
          level: 1,
          xp: 0,
          isGuest: false,
          difficulty: 'medium',
          profileImageUrl: null,
          passwordHash: null,
          questionnaire: null,
          emailSettings: null,
          supabaseAuthId: data.user.id, // ← Add Supabase Auth ID
        });

        (req.session as any).user = data.user;
      }
      if (data.session) {
        (req.session as any).access_token = data.session.access_token;
        (req.session as any).refresh_token = data.session.refresh_token;
      }

      res.json({ user: data.user, session: data.session });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      if (!isSupabaseConfigured()) {
        return res.status(503).json({ error: "Supabase authentication is not configured" });
      }

      const { email, password } = req.body;
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (data.user) {
        // Ensure user exists in public.users table
        const existingUser = await storage.getUser(data.user.id);
        if (!existingUser) {
          await storage.createUser({
            id: data.user.id,
            email: data.user.email || null,
            firstName: data.user.user_metadata?.first_name || null,
            lastName: data.user.user_metadata?.last_name || null,
            role: 'user',
            level: 1,
            xp: 0,
            isGuest: false,
            difficulty: 'medium',
            profileImageUrl: null,
            passwordHash: null,
            questionnaire: null,
            emailSettings: null,
            supabaseAuthId: data.user.id, // ← Add Supabase Auth ID
          });
        }

        (req.session as any).user = data.user;
      }
      if (data.session) {
        (req.session as any).access_token = data.session.access_token;
        (req.session as any).refresh_token = data.session.refresh_token;
      }

      res.json({ user: data.user, session: data.session });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  });

  // ... other auth routes remain the same ...

  app.get("/api/auth/user", async (req, res) => {
    try {
      const sessionUser = (req.session as any).user;
      const accessToken = (req.session as any).access_token;
      
      // Debug: Log session info
      console.log('🔍 /api/auth/user debug:', {
        sessionId: req.sessionID,
        hasSessionUser: !!sessionUser,
        sessionUserIsGuest: sessionUser?.isGuest,
        hasAccessToken: !!accessToken,
        sessionKeys: Object.keys(req.session || {})
      });
      
      // Check authorization header as well
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      const token = bearerToken || accessToken;
      
      // First, check if we have a guest session
      if (sessionUser && sessionUser.isGuest) {
        console.log('✅ Returning guest session user:', sessionUser.id);
        return res.json(sessionUser);
      }

      // Check for JWT token (guest authentication)
      if (token && !token.includes('.')) {
        // This is likely a Supabase token, continue with Supabase auth
      } else if (token) {
        try {
          const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback-secret';
          const decoded = jwt.verify(token, jwtSecret) as any;
          
          if (decoded.isGuest) {
            // This is a guest JWT token
            const guestUser = await storage.getUser(decoded.userId);
            if (guestUser) {
              console.log('✅ Returning guest JWT user:', guestUser.id);
              return res.json({
                id: guestUser.id,
                email: guestUser.email,
                firstName: guestUser.firstName,
                lastName: guestUser.lastName,
                level: guestUser.level,
                xp: guestUser.xp,
                role: guestUser.role,
                isGuest: true,
                difficulty: guestUser.difficulty
              });
            }
          }
        } catch (jwtError) {
          console.log('❌ JWT verification failed:', jwtError);
        }
      }
      
      if (!sessionUser && !token) {
        return res.status(401).json({ error: "No active session" });
      }

      if (token) {
        if (!isSupabaseConfigured()) {
          return res.status(503).json({ error: "Supabase authentication is not configured" });
        }
        const { data: { user }, error } = await supabase!.auth.getUser(token);
        if (error || !user) {
          return res.status(401).json({ error: "Invalid session" });
        }

        // Get user data from public.users table
        const dbUser = await storage.getUser(user.id);
        if (dbUser) {
          // Return combined data with frontend-expected structure
          return res.json({
            id: user.id,
            email: user.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            level: dbUser.level,
            xp: dbUser.xp,
            role: dbUser.role,
            isGuest: dbUser.isGuest,
            difficulty: dbUser.difficulty,
            questionnaire: dbUser.questionnaire,
            emailSettings: dbUser.emailSettings,
            profileImageUrl: dbUser.profileImageUrl,
            // Include some Supabase metadata
            created_at: user.created_at,
            email_confirmed_at: user.email_confirmed_at,
            last_sign_in_at: user.last_sign_in_at,
          });
        } else {
          // If no db user found, create one (shouldn't happen but safety)
          const newDbUser = await storage.createUser({
            id: user.id,
            email: user.email || null,
            firstName: user.user_metadata?.first_name || null,
            lastName: user.user_metadata?.last_name || null,
            role: 'user',
            level: 1,
            xp: 0,
            isGuest: false,
            difficulty: 'medium',
            profileImageUrl: null,
            passwordHash: null,
            questionnaire: null,
            emailSettings: null,
            supabaseAuthId: user.id,
          });
          
          return res.json({
            id: user.id,
            email: user.email,
            firstName: newDbUser.firstName,
            lastName: newDbUser.lastName,
            level: newDbUser.level,
            xp: newDbUser.xp,
            role: newDbUser.role,
            isGuest: newDbUser.isGuest,
            difficulty: newDbUser.difficulty,
            questionnaire: newDbUser.questionnaire,
            emailSettings: newDbUser.emailSettings,
            profileImageUrl: newDbUser.profileImageUrl,
            created_at: user.created_at,
            email_confirmed_at: user.email_confirmed_at,
            last_sign_in_at: user.last_sign_in_at,
          });
        }
      }

      // Fallback: return stored user if token not available
      return res.json(sessionUser);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({ error: errorMessage });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    // First, check for guest session
    const sessionUser = (req.session as any).user;
    if (sessionUser && sessionUser.isGuest) {
      req.user = sessionUser as AuthenticatedUser;
      return next();
    }

    const accessToken = req.headers.authorization?.replace('Bearer ', '') || (req.session as any).access_token;
    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check for JWT token (guest authentication)
    if (accessToken && accessToken.includes('.')) {
      try {
        const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback-secret';
        const decoded = jwt.verify(accessToken, jwtSecret) as any;
        
        if (decoded.isGuest) {
          // This is a guest JWT token
          const guestUser = await storage.getUser(decoded.userId);
          if (guestUser) {
            req.user = {
              id: guestUser.id,
              email: guestUser.email,
              role: guestUser.role,
              level: guestUser.level,
              xp: guestUser.xp,
              firstName: guestUser.firstName,
              lastName: guestUser.lastName,
              isGuest: guestUser.isGuest,
              difficulty: guestUser.difficulty,
              questionnaire: guestUser.questionnaire,
              emailSettings: guestUser.emailSettings,
              profileImageUrl: guestUser.profileImageUrl,
            } as AuthenticatedUser;
            return next();
          }
        }
      } catch (jwtError) {
        console.log('❌ JWT verification failed:', jwtError);
      }
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: "Supabase authentication is not configured" });
    }
    const { data: { user }, error } = await supabase!.auth.getUser(accessToken);
    if (error || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user data from public.users table
    let dbUser = await storage.getUser(user.id);
    
    // If user doesn't exist in public.users, create them
    if (!dbUser) {
      dbUser = await storage.createUser({
        id: user.id,
        email: user.email || null,
        firstName: user.user_metadata?.first_name || null,
        lastName: user.user_metadata?.last_name || null,
        role: 'user',
        level: 1,
        xp: 0,
        isGuest: false,
        difficulty: 'medium',
        profileImageUrl: null,
        passwordHash: null,
        questionnaire: null,
        emailSettings: null,
        supabaseAuthId: user.id, // ← Add Supabase Auth ID
      });
    }

    // Set complete user information
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      level: dbUser.level,
      xp: dbUser.xp,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      isGuest: dbUser.isGuest,
      difficulty: dbUser.difficulty,
      questionnaire: dbUser.questionnaire,
      emailSettings: dbUser.emailSettings,
      profileImageUrl: dbUser.profileImageUrl,
    } as AuthenticatedUser;

    next();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Authentication failed";
    res.status(401).json({ message: errorMessage });
  }
};