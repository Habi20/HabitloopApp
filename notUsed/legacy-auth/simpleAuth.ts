import session from "express-session";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

export function setupSimpleAuth(app: Express) {
  // Simple session setup for local development
  app.use(session({
    secret: process.env.SESSION_SECRET || 'local-dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for local development
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }));

  // Auto-login demo user for local development
  app.use(async (req: any, res, next) => {
    if (!req.session.user) {
      // Create or get demo user
      try {
        let user = await storage.getUser('demo-user');
        if (!user) {
          user = await storage.upsertUser({
            id: 'demo-user',
            email: 'demo@example.com',
            firstName: 'Demo',
            lastName: 'User',
            profileImageUrl: null,
          });
        }
        req.session.user = user;
      } catch (error) {
        console.error('Failed to create demo user:', error);
      }
    }
    req.user = req.session.user;
    next();
  });

  // Login route (just for API compatibility)
  app.get('/api/login', (req, res) => {
    res.redirect('/');
  });

  // Logout route
  app.get('/api/logout', (req: any, res) => {
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};