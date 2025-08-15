import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
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

  // Get current user data
  router.get('/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'User not authenticated' 
        });
      }

      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          level: user.level,
          xp: user.xp,
          role: user.role,
          isGuest: user.isGuest,
          difficulty: user.difficulty
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get user data' 
      });
    }
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
      if (!supabase) {
        return res.status(500).json({
          success: false,
          error: { message: 'Supabase not configured' }
        });
      }

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

      // Get user data from public.users table
      const publicUser = await storage.getUserByEmail(data.user.email || '');
      
      const userData = {
        id: publicUser?.id || data.user.id,
        email: data.user.email,
        firstName: publicUser?.firstName || data.user.user_metadata?.first_name,
        lastName: publicUser?.lastName || data.user.user_metadata?.last_name,
        level: publicUser?.level || 1,
        xp: publicUser?.xp || 0,
        role: publicUser?.role || 'user',
        isGuest: false,
        difficulty: publicUser?.difficulty || 'medium',
        profileImageUrl: publicUser?.profileImageUrl
      };

      res.json({
        success: true,
        user: userData,
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
      if (!supabase) {
        return res.status(500).json({
          success: false,
          error: { message: 'Supabase not configured' }
        });
      }

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

      if (!data.user) {
        return res.status(400).json({
          success: false,
          error: { message: 'User creation failed' }
        });
      }

      req.session.user = data.user;
      if (data.session?.access_token) {
        req.session.token = data.session.access_token;
      }

      // Get user data from public.users table
      const publicUser = await storage.getUserByEmail(data.user.email || '');
      
      const userData = {
        id: publicUser?.id || data.user.id,
        email: data.user.email,
        firstName: publicUser?.firstName || data.user.user_metadata?.first_name,
        lastName: publicUser?.lastName || data.user.user_metadata?.last_name,
        level: publicUser?.level || 1,
        xp: publicUser?.xp || 0,
        role: publicUser?.role || 'user',
        isGuest: false,
        difficulty: publicUser?.difficulty || 'medium',
        profileImageUrl: publicUser?.profileImageUrl
      };

      res.json({
        success: true,
        user: userData,
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

      if (!supabase) {
        return res.status(500).json({
          success: false,
          error: { message: 'Supabase not configured' }
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
        id: randomUUID(),
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

  // Add GET logout endpoint for frontend compatibility
  router.get('/logout', (req: any, res) => {
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

  // Add signout endpoint for frontend compatibility
  router.post('/auth/signout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { message: 'Signout failed' }
        });
      }
      res.json({ success: true });
    });
  });

  router.post('/auth/guest', async (req, res) => {
    try {
      const guestUser = await storage.upsertUser({
        id: randomUUID(),
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

  // HabitLoop user authentication endpoint
  router.post('/auth/habitloop-user', async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { message: 'User ID required' }
        });
      }

      // Define HabitLoop users with their data
      const habitLoopUsers = {
        'user-001': {
          id: 'user-001',
          email: 'user-001@habitloop.local',
          firstName: 'Alex',
          lastName: 'Chen',
          level: 15,
          xp: 2840,
          role: 'habitloop_user',
          isGuest: false,
          difficulty: 'medium',
          profileImageUrl: '👨‍💻'
        },
        'user-002': {
          id: 'user-002',
          email: 'user-002@habitloop.local',
          firstName: 'Sarah',
          lastName: 'Johnson',
          level: 8,
          xp: 1240,
          role: 'habitloop_user',
          isGuest: false,
          difficulty: 'easy',
          profileImageUrl: '👩‍🎨'
        },
        'user-003': {
          id: 'user-003',
          email: 'user-003@habitloop.local',
          firstName: 'Marcus',
          lastName: 'Rodriguez',
          level: 22,
          xp: 4560,
          role: 'habitloop_user',
          isGuest: false,
          difficulty: 'hard',
          profileImageUrl: '🏃‍♂️'
        },
        'user-004': {
          id: 'user-004',
          email: 'user-004@habitloop.local',
          firstName: 'Emma',
          lastName: 'Thompson',
          level: 12,
          xp: 1980,
          role: 'habitloop_user',
          isGuest: false,
          difficulty: 'medium',
          profileImageUrl: '🧘‍♀️'
        },
        'user-005': {
          id: 'user-005',
          email: 'user-005@habitloop.local',
          firstName: 'David',
          lastName: 'Kim',
          level: 18,
          xp: 3420,
          role: 'habitloop_user',
          isGuest: false,
          difficulty: 'hard',
          profileImageUrl: '📚'
        },
        'user-006': {
          id: 'user-006',
          email: 'user-006@habitloop.local',
          firstName: 'Lisa',
          lastName: 'Wang',
          level: 6,
          xp: 890,
          role: 'habitloop_user',
          isGuest: false,
          difficulty: 'easy',
          profileImageUrl: '🌱'
        },
        'user-007': {
          id: 'user-007',
          email: 'user-007@habitloop.local',
          firstName: 'New',
          lastName: 'User',
          level: 1,
          xp: 0,
          role: 'habitloop_user',
          isGuest: false,
          difficulty: 'easy',
          profileImageUrl: '🆕'
        },
        'user-008': {
          id: 'user-008',
          email: 'user-008@habitloop.local',
          firstName: 'Fresh',
          lastName: 'Start',
          level: 1,
          xp: 0,
          role: 'habitloop_user',
          isGuest: false,
          difficulty: 'easy',
          profileImageUrl: '🌟'
        },
        'user-009': {
          id: 'user-009',
          email: 'user-009@habitloop.local',
          firstName: 'Beginner',
          lastName: 'Tester',
          level: 1,
          xp: 0,
          role: 'habitloop_user',
          isGuest: false,
          difficulty: 'easy',
          profileImageUrl: '🎯'
        }
      };

      const userData = habitLoopUsers[userId as keyof typeof habitLoopUsers] || null;
      
      if (!userData) {
        return res.status(404).json({
          success: false,
          error: { message: 'HabitLoop user not found' }
        });
      }

      // Upsert user in database
      const habitLoopUser = await storage.upsertUser({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        level: userData.level,
        xp: userData.xp,
        role: userData.role,
        isGuest: false
      });

      const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT secret key not configured');
      }

      const token = jwt.sign(
        { userId: habitLoopUser.id },
        jwtSecret as Secret,
        { expiresIn: '7d' } as SignOptions
      );

      req.session.token = token;
      req.session.user = habitLoopUser;

      res.json({
        success: true,
        user: {
          ...habitLoopUser,
          difficulty: userData.difficulty,
          profileImageUrl: userData.profileImageUrl
        },
        token
      });

    } catch (error) {
      console.error("Error creating HabitLoop user:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to create HabitLoop user" }
      });
    }
  });

  return router;
}