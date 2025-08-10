import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { storage } from '../storage';
import { requireAuth } from './middlewareRoutes';
import { supabase } from '../supabaseAuth';

// Declare module augmentation for express-session
declare module 'express-session' {
  interface SessionData {
    token?: string;
    user?: any;
  }
}

export function authRoutes() {
  const router = Router();

  router.get('/login', (_req, res) => {
    res.redirect('/login');
  });

  // ✅ NEW: Add the missing /auth/signin endpoint that your Postman test expects
  router.post('/auth/signin', async (req: any, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { message: 'Email and password required' }
        });
      }

      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return res.status(400).json({
          success: false,
          error: { message: error?.message || 'Invalid login credentials' }
        });
      }

      // Store session data
      req.session.token = data.session?.access_token;
      req.session.user = data.user;

      res.json({
        success: true,
        user: data.user,
        session: data.session
      });

    } catch (error: any) {
      console.error("Signin error:", error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error' }
      });
    }
  });

  // ✅ NEW: Add signup endpoint to match your Postman tests
  router.post('/auth/signup', async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { message: 'Email and password required' }
        });
      }

      // Use Supabase authentication
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            email_verified: false
          }
        }
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: { message: error.message }
        });
      }

      if (data.user) {
        req.session.user = data.user;
        if (data.session?.access_token) {
          req.session.token = data.session.access_token;
        }
      }

      res.json({
        success: true,
        user: data.user,
        session: data.session
      });

    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error' }
      });
    }
  });

  // ✅ ENHANCED: Update the /auth/user endpoint to return Supabase user data
  router.get('/auth/user', requireAuth, async (req: any, res) => {
    try {
      // Get user from Supabase using the token
      const token = req.headers.authorization?.replace('Bearer ', '') || req.session?.token;
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: { message: 'No token provided' }
        });
      }

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid session' }
        });
      }

      // Return the Supabase user data that your Postman tests expect
      res.json({
        id: user.id,
        email: user.email,
        aud: user.aud,
        role: user.role,
        email_confirmed_at: user.email_confirmed_at,
        user_metadata: user.user_metadata,
        identities: user.identities,
        created_at: user.created_at,
        updated_at: user.updated_at
      });

    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch user" }
      });
    }
  });

  // Keep your existing endpoints
  router.post('/auth/register', async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName) {
        return res.status(400).json({
          success: false,
          error: { message: 'Email, password, and first name required' }
        });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { message: 'Email already registered' }
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await storage.upsertUser({
        id: crypto.randomUUID(),
        email,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        level: 1,
        xp: 0,
        isGuest: false
      });

      const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT secret key not configured');
      }

      const token = jwt.sign(
        { userId: newUser.id },
        jwtSecret as Secret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
      );

      req.session.token = token;
      req.session.user = newUser;

      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          level: newUser.level,
          xp: newUser.xp
        },
        token
      });

    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        error: { message: 'Registration failed', details: error.message }
      });
    }
  });

  router.post('/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { message: 'Logout failed' }
        });
      }
      res.json({ success: true });
    });
  });

  router.post('/auth/guest', async (req, res) => {
    try {
      const guestUser = await storage.upsertUser({
        id: crypto.randomUUID(),
        email: `guest-${Date.now()}@example.com`,
        firstName: 'Guest',
        lastName: 'User',
        level: 1,
        xp: 0,
        isGuest: true
      });

      const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT secret key not configured');
      }

      const token = jwt.sign(
        { userId: guestUser.id },
        jwtSecret as Secret,
        { expiresIn: '24h' } as SignOptions
      );

      req.session.token = token;
      req.session.user = guestUser;

      res.json({
        success: true,
        user: guestUser,
        token
      });

    } catch (error) {
      console.error("Error creating guest user:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to create guest user" }
      });
    }
  });

  return router;
}