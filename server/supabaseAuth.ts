import { createClient } from "@supabase/supabase-js";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { env } from "./env";
import type { AuthenticatedUser } from "./types/user";
import { storage } from "./storage";

export const supabase = createClient(env.supabaseUrl, env.supabaseKey);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  const pgStore = connectPg(session);

  const sessionStore = new pgStore({
    conString: env.dbUrl,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: env.sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.nodeEnv === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.use(getSession());

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      const { data, error } = await supabase.auth.signUp({
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
      const { email, password } = req.body;
      const { data, error } = await supabase.auth.signInWithPassword({
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
      if (!sessionUser && !accessToken) {
        return res.status(401).json({ error: "No active session" });
      }

      if (accessToken) {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        if (error || !user) {
          return res.status(401).json({ error: "Invalid session" });
        }

        // Get user data from public.users table
        const dbUser = await storage.getUser(user.id);
        if (dbUser) {
          // Merge Supabase user data with application user data
          return res.json({
            ...user,
            level: dbUser.level,
            xp: dbUser.xp,
            role: dbUser.role,
            isGuest: dbUser.isGuest,
            difficulty: dbUser.difficulty,
            questionnaire: dbUser.questionnaire,
            emailSettings: dbUser.emailSettings,
          });
        }

        return res.json(user);
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
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || (req.session as any).access_token;
    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
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