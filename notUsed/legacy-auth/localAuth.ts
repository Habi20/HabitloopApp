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
import type { Express } from "express";
import session from "express-session";
import { storage } from "./storage";

export async function setupAuth(app: Express) {
  // Simple session setup for local development
  app.use(session({
    secret: process.env.SESSION_SECRET || 'local-dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Allow non-HTTPS for local development
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Create or get demo user for local development
  const createDemoUser = async () => {
    try {
      let demoUser = await storage.getUser('demo-user-local');
      if (!demoUser) {
        demoUser = await storage.upsertUser({
          id: 'demo-user-local',
          email: 'demo@local.dev',
          firstName: 'Demo',
          lastName: 'User',
          level: 1,
          xp: 0,
          isGuest: false,
        });
      }
      return demoUser;
    } catch (error) {
      console.error('Error creating demo user:', error);
      return null;
    }
  };

  // Auto-login for local development
  app.use(async (req: any, res, next) => {
    if (!req.session.user) {
      const demoUser = await createDemoUser();
      if (demoUser) {
        req.session.user = demoUser;
        req.user = demoUser;
      }
    } else {
      req.user = req.session.user;
    }
    next();
  });

  // Local auth endpoints
  app.get('/api/login', (req: any, res) => {
    res.redirect('/');
  });

  app.get('/api/callback', (req: any, res) => {
    res.redirect('/');
  });

  app.get('/api/logout', (req: any, res) => {
    req.session.destroy(() => {
      res.redirect('/');
    });
  });

  console.log('Local authentication setup complete - using demo user');
}
