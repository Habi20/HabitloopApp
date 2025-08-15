
import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertHabitSchema, insertHabitCompletionSchema } from "../../shared/schema";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { typedEnv } from "../env";

export function guestRoutes() {
  const router = Router();

  // Guest token verification endpoint
  router.get('/verify', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const jwtSecret = typedEnv.jwtSecret;

      try {
        const decoded = jwt.verify(token, jwtSecret) as any;
        const user = await storage.getUser(decoded.userId);

        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        // Determine if this is actually a guest user
        const isActuallyGuest = user.isGuest || 
                               user.role === 'guest' || 
                               user.email?.includes('@guest.local');

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
            isGuest: isActuallyGuest,
            difficulty: user.difficulty
          }
        });
      } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } catch (error) {
      console.error('Guest verify error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  });

  // Guest authentication endpoint (GET - for token verification)
  router.get('/auth', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const jwtSecret = typedEnv.jwtSecret;

      try {
        const decoded = jwt.verify(token, jwtSecret) as any;
        const user = await storage.getUser(decoded.userId);

        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        // Determine if this is actually a guest user
        const isActuallyGuest = user.isGuest || 
                               user.role === 'guest' || 
                               user.email?.includes('@guest.local');

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
            isGuest: isActuallyGuest,
            difficulty: user.difficulty
          }
        });
      } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } catch (error) {
      console.error('Guest auth GET error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Guest authentication endpoint (POST - for login)
  router.post('/auth', async (req, res) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier) {
        return res.status(400).json({ error: "Username or email is required" });
      }

      // Find guest user by ID or email
      let guestUser = await storage.getUser(identifier);
      if (!guestUser) {
        guestUser = await storage.getUserByEmail(identifier);
      }

      if (!guestUser) {
        return res.status(404).json({ error: "Guest account not found. Try: user-001, guest-001, or john.doe@example.com" });
      }

      // Determine if this is actually a guest user or an authenticated user
      const isActuallyGuest = guestUser.isGuest || 
                             guestUser.role === 'guest' || 
                             identifier.startsWith('guest-') ||
                             guestUser.email?.includes('@guest.local');
      
      // Allow all users to login through this endpoint, but treat them differently
      // Guest users: isGuest = true, use guest_token
      // Authenticated users: isGuest = false, use verified_token

      // Handle password logic
      if (!guestUser.passwordHash) {
        // No password set - first time login
        if (!password) {
          return res.json({ 
            needsPassword: true, 
            message: "Please set a password for future logins" 
          });
        }

        if (password.length < 6) {
          return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        // Set new password
        const hashedPassword = await bcrypt.hash(password, 10);
        await storage.updateUser(guestUser.id, { passwordHash: hashedPassword });
        guestUser.passwordHash = hashedPassword;

        // Generate JWT token based on user type
        const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback-secret';
        const token = jwt.sign(
          {
            userId: guestUser.id,
            email: guestUser.email,
            isGuest: isActuallyGuest,
            role: guestUser.role
          },
          jwtSecret,
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          user: {
            id: guestUser.id,
            email: guestUser.email,
            firstName: guestUser.firstName,
            lastName: guestUser.lastName,
            level: guestUser.level,
            xp: guestUser.xp,
            role: guestUser.role,
            isGuest: isActuallyGuest,
            difficulty: guestUser.difficulty
          },
          token: token,
          message: "Password set successfully"
        });
      } else {
        // Password exists - verify it
        if (!password) {
          return res.status(400).json({ error: "Password is required" });
        }

        const passwordMatch = await bcrypt.compare(password, guestUser.passwordHash);
        if (!passwordMatch) {
          return res.status(401).json({ error: "Incorrect password" });
        }

        // Generate JWT token based on user type
        const jwtSecret = typedEnv.jwtSecret;
        const token = jwt.sign(
          {
            userId: guestUser.id,
            email: guestUser.email,
            isGuest: isActuallyGuest,
            role: guestUser.role
          },
          jwtSecret,
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          user: {
            id: guestUser.id,
            email: guestUser.email,
            firstName: guestUser.firstName,
            lastName: guestUser.lastName,
            level: guestUser.level,
            xp: guestUser.xp,
            role: guestUser.role,
            isGuest: isActuallyGuest,
            difficulty: guestUser.difficulty
          },
          token: token,
          message: "Login successful"
        });
      }
    } catch (error) {
      console.error("Guest auth error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create new temporary guest user (for quick mode)
  router.post('/create', async (_req, res) => {
    try {
      const guestUser = await storage.createUser({
        id: `temp-guest-${Date.now()}`,
        email: `temp-guest-${Date.now()}@guest.local`,
        firstName: 'Guest',
        lastName: 'User',
        level: 1,
        xp: 0,
        isGuest: true,
        role: 'guest',
        difficulty: 'medium',
        profileImageUrl: null,
        passwordHash: null,
        questionnaire: null,
        emailSettings: null,
        supabaseAuthId: null,
      });

      // Generate JWT token for quick guest user
      const jwtSecret = typedEnv.jwtSecret;
      const token = jwt.sign(
        {
          userId: guestUser.id,
          email: guestUser.email,
          isGuest: true,
          role: guestUser.role
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        user: {
          id: guestUser.id,
          email: guestUser.email,
          firstName: guestUser.firstName,
          lastName: guestUser.lastName,
          level: guestUser.level,
          xp: guestUser.xp,
          role: guestUser.role,
          isGuest: true,
          difficulty: guestUser.difficulty
        },
        token: token
      });
    } catch (error) {
      console.error("Error creating guest user:", error);
      res.status(500).json({ error: "Failed to create guest user" });
    }
  });

  // Get guest habits
  router.get('/habits/:guestId', async (req, res) => {
    try {
      const guestId = req.params.guestId;
      const habits = await storage.getUserHabits(guestId);
      res.json(habits);
    } catch (error) {
      console.error("Error fetching guest habits:", error);
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  // Create guest habit
  router.post('/habits/:guestId', async (req, res) => {
    try {
      const guestId = req.params.guestId;
      const habitData = insertHabitSchema.parse({ ...req.body, userId: guestId });
      const habit = await storage.createHabit(habitData);
      res.json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      console.error("Error creating guest habit:", error);
      res.status(500).json({ message: "Failed to create habit" });
    }
  });

  // Create guest completion
  router.post('/completions/:guestId', async (req, res) => {
    try {
      const guestId = req.params.guestId;
      const completionData = insertHabitCompletionSchema.parse({ ...req.body, userId: guestId });
      const completion = await storage.createHabitCompletion(completionData);
      res.json(completion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      console.error("Error creating guest completion:", error);
      res.status(500).json({ message: "Failed to create completion" });
    }
  });

  return router;
}
