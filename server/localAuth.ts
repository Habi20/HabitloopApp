import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import bcrypt from "bcryptjs";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use memory store for local development if no DATABASE_URL
  if (!process.env.DATABASE_URL) {
    const MemoryStore = require('memorystore')(session);
    return session({
      secret: process.env.SESSION_SECRET || 'local-dev-secret-key-change-in-production',
      store: new MemoryStore({
        checkPeriod: sessionTtl
      }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // Set to false for local development
        maxAge: sessionTtl,
      },
    });
  }

  // Use PostgreSQL store if DATABASE_URL is available
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'local-dev-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for local development
      maxAge: sessionTtl,
    },
  });
}

export async function setupLocalAuth(app: Express) {
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for development
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        // For local development, create a simple authentication
        // In production, you'd want proper password hashing
        if (email === 'demo@example.com' && password === 'demo123') {
          const user = await storage.upsertUser({
            id: 'local-demo-user',
            email: 'demo@example.com',
            firstName: 'Demo',
            lastName: 'User',
            profileImageUrl: null,
          });
          return done(null, user);
        }
        return done(null, false, { message: 'Invalid credentials' });
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Login route
  app.post('/api/login', passport.authenticate('local'), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  // Logout route
  app.post('/api/logout', (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  // Guest login for development
  app.post('/api/guest-login', async (req, res) => {
    try {
      const guestUser = await storage.createGuestUser();
      req.login(guestUser, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to login guest user' });
        }
        res.json({ success: true, user: guestUser });
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create guest user' });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};