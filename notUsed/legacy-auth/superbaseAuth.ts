import { createClient } from "@supabase/supabase-js";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Initialize Supabase client
const supabaseUrl =
  process.env.SUPABASE_URL || "https://hkkvlenrqxoaavofwiuc.supabase.co";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseAnonKey) {
  throw new Error(
    "SUPABASE_ANON_KEY or SUPABASE_KEY environment variable is required",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for session storage");
  }

  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || "supabase-session-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
        (req.session as any).user = data.user;
      }

      res.json({ user: data.user, session: data.session });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
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
        (req.session as any).user = data.user;
      }

      res.json({ user: data.user, session: data.session });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/signout", async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      req.session.destroy(() => {
        res.json({ success: true });
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      const sessionUser = (req.session as any).user;

      if (!sessionUser) {
        return res.status(401).json({ error: "No active session" });
      }

      // Get fresh user data from Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(sessionUser.access_token);

      if (error || !user) {
        return res.status(401).json({ error: "Invalid session" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Google OAuth routes
  app.get("/api/auth/google", async (req, res) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${req.protocol}://${req.get("host")}/api/auth/callback`,
        },
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.redirect(data.url);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/auth/callback", async (req, res) => {
    try {
      const { code } = req.query;

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          code as string,
        );

        if (error) {
          return res.redirect("/?error=auth_failed");
        }

        if (data.user) {
          (req.session as any).user = data.user;
        }
      }

      res.redirect("/");
    } catch (error) {
      res.redirect("/?error=auth_failed");
    }
  });

  // Legacy routes for compatibility
  app.get("/api/login", (req, res) => {
    res.redirect("/api/auth/google");
  });

  app.get("/api/logout", (req, res) => {
    res.redirect("/api/auth/signout");
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const sessionUser = (req.session as any).user;

    if (!sessionUser || !sessionUser.access_token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(sessionUser.access_token);

    if (error || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};
