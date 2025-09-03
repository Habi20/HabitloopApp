
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

  // Guest authentication endpoint (POST - for login) - SIMPLIFIED VERSION
  router.post('/auth', async (req, res) => {
    try {
      const { identifier, password } = req.body;

      // If no identifier provided, auto-generate a guest user
      if (!identifier) {
        const guestId = `guest-${Date.now()}`;
        const guestUser = await storage.createUser({
          id: guestId,
          email: `${guestId}@guest.local`,
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

        // Generate JWT token
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
            isGuest: true,
            difficulty: guestUser.difficulty
          },
          token: token,
          message: "Auto-generated guest account created"
        });
      }

      // If identifier provided, try to find existing user
      let guestUser = await storage.getUser(identifier);
      if (!guestUser) {
        guestUser = await storage.getUserByEmail(identifier);
      }

      if (!guestUser) {
        return res.status(404).json({ error: "Guest account not found. Try: user-001, guest-001, or leave empty for auto-generation" });
      }

      // Determine if this is actually a guest user
      const isActuallyGuest = guestUser.isGuest || 
                             guestUser.role === 'guest' || 
                             identifier.startsWith('guest-') ||
                             guestUser.email?.includes('@guest.local');

      // Simple password logic - if no password set, allow login
      if (!guestUser.passwordHash) {
        // No password set - allow login
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
          message: "Login successful (no password required)"
        });
      } else {
        // Password exists - verify it (optional for now)
        if (password) {
          const passwordMatch = await bcrypt.compare(password, guestUser.passwordHash);
          if (!passwordMatch) {
            return res.status(401).json({ error: "Incorrect password" });
          }
        }

        // Generate JWT token
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

  // Create new temporary guest user (for quick mode) - MUST BE BEFORE PARAMETERIZED ROUTES
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
