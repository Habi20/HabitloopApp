import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { storage } from "../storage";
import { requireAuth } from "./middlewareRoutes";
import { supabase } from "../supabaseAuth";
import { typedEnv } from "../env";

// Declare module augmentation for express-session
declare module "express-session" {
  interface SessionData {
    token?: string;
    user?: any;
  }
}

export function authRoutes() {
  const router = Router();

  router.get("/login", (_req, res) => {
    res.redirect("/login");
  });

  // Get current user data
  router.get("/user", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
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
          difficulty: user.difficulty,
          questionnaire: user.questionnaire,
          aiRecommendations: user.aiRecommendations,
          emailSettings: user.emailSettings,
          userSettings: user.userSettings,
        },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get user data",
      });
    }
  });

  // Update user settings
  router.put("/user/settings", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const { settings } = req.body;

      if (!settings) {
        return res.status(400).json({
          success: false,
          error: "Settings data required",
        });
      }

      await storage.saveUserSettings(userId, settings);

      res.json({
        success: true,
        message: "User settings updated successfully",
      });
    } catch (error) {
      console.error("Update user settings error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user settings",
      });
    }
  });

  // ✅ NEW: Add the missing /auth/signin endpoint that your Postman test expects
  router.post("/auth/signin", async (req: any, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { message: "Email and password required" },
        });
      }

      // Use Supabase authentication
      if (!supabase) {
        return res.status(500).json({
          success: false,
          error: { message: "Supabase not configured" },
        });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return res.status(400).json({
          success: false,
          error: { message: error?.message || "Invalid login credentials" },
        });
      }

      // Store session data
      req.session.token = data.session?.access_token;
      req.session.user = data.user;

      // Get user data from public.users table
      const publicUser = await storage.getUserByEmail(data.user.email || "");

      const userData = {
        id: publicUser?.id || data.user.id,
        email: data.user.email,
        firstName: publicUser?.firstName || data.user.user_metadata?.first_name,
        lastName: publicUser?.lastName || data.user.user_metadata?.last_name,
        level: publicUser?.level || 1,
        xp: publicUser?.xp || 0,
        role: publicUser?.role || "user",
        isGuest: false,
        difficulty: publicUser?.difficulty || "medium",
        profileImageUrl: publicUser?.profileImageUrl,
      };

      res.json({
        success: true,
        user: userData,
        session: data.session,
      });
    } catch (error: any) {
      console.error("Signin error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Internal server error" },
      });
    }
  });

  // ✅ NEW: Add signup endpoint to match your Postman tests
  router.post("/auth/signup", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { message: "Email and password required" },
        });
      }

      // Use Supabase authentication
      if (!supabase) {
        return res.status(500).json({
          success: false,
          error: { message: "Supabase not configured" },
        });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            email_verified: false,
          },
        },
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: { message: error.message },
        });
      }

      if (!data.user) {
        return res.status(400).json({
          success: false,
          error: { message: "User creation failed" },
        });
      }

      req.session.user = data.user;
      if (data.session?.access_token) {
        req.session.token = data.session.access_token;
      }

      // Get user data from public.users table
      const publicUser = await storage.getUserByEmail(data.user.email || "");

      const userData = {
        id: publicUser?.id || data.user.id,
        email: data.user.email,
        firstName: publicUser?.firstName || data.user.user_metadata?.first_name,
        lastName: publicUser?.lastName || data.user.user_metadata?.last_name,
        level: publicUser?.level || 1,
        xp: publicUser?.xp || 0,
        role: publicUser?.role || "user",
        isGuest: false,
        difficulty: publicUser?.difficulty || "medium",
        profileImageUrl: publicUser?.profileImageUrl,
      };

      res.json({
        success: true,
        user: userData,
        session: data.session,
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Internal server error" },
      });
    }
  });

  // ✅ ENHANCED: Update the /auth/user endpoint to return Supabase user data
  router.get("/auth/user", requireAuth, async (req: any, res) => {
    try {
      // Get user from Supabase using the token
      const token =
        req.headers.authorization?.replace("Bearer ", "") || req.session?.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          error: { message: "No token provided" },
        });
      }

      if (!supabase) {
        return res.status(500).json({
          success: false,
          error: { message: "Supabase not configured" },
        });
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: { message: "Invalid session" },
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
        updated_at: user.updated_at,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch user" },
      });
    }
  });

  // Keep your existing endpoints
  router.post("/auth/register", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName) {
        return res.status(400).json({
          success: false,
          error: { message: "Email, password, and first name required" },
        });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { message: "Email already registered" },
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
        isGuest: false,
      });

      const jwtSecret = typedEnv.jwtSecret;
      if (!jwtSecret) {
        throw new Error("JWT secret key not configured");
      }

      const token = jwt.sign(
        { userId: newUser.id },
        jwtSecret as Secret,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as SignOptions
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
          xp: newUser.xp,
        },
        token,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Registration failed", details: error.message },
      });
    }
  });

  // Add GET logout endpoint for frontend compatibility
  router.get("/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { message: "Logout failed" },
        });
      }
      res.json({ success: true });
    });
  });

  router.post("/auth/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { message: "Logout failed" },
        });
      }
      res.json({ success: true });
    });
  });

  // Add signout endpoint for frontend compatibility
  router.post("/auth/signout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { message: "Signout failed" },
        });
      }
      res.json({ success: true });
    });
  });

  router.post("/auth/guest", async (req, res) => {
    try {
      const guestUser = await storage.upsertUser({
        id: randomUUID(),
        email: `guest-${Date.now()}@example.com`,
        firstName: "Guest",
        lastName: "User",
        level: 1,
        xp: 0,
        isGuest: true,
      });

      const jwtSecret = typedEnv.jwtSecret;
      if (!jwtSecret) {
        throw new Error("JWT secret key not configured");
      }

      const token = jwt.sign(
        { userId: guestUser.id },
        jwtSecret as Secret,
        { expiresIn: "24h" } as SignOptions
      );

      req.session.token = token;
      req.session.user = guestUser;

      res.json({
        success: true,
        user: guestUser,
        token,
      });
    } catch (error) {
      console.error("Error creating guest user:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to create guest user" },
      });
    }
  });

  // HabitLoop user signup (JWT only, no sessions)
  router.post("/habitloop/signup", async (req: any, res) => {
    try {
      const {
        userId,
        email,
        firstName,
        lastName,
        password,
        difficulty = "medium",
        profileImageUrl,
      } = req.body;

      if (!userId || !email || !firstName || !password) {
        return res.status(400).json({
          success: false,
          error: {
            message: "User ID, email, first name, and password required",
          },
        });
      }

      // Check if user already exists by ID
      const existingUserById = await storage.getUser(userId);
      if (existingUserById) {
        console.log("🔐 Signup conflict: User ID already exists:", userId);
        return res.status(409).json({
          success: false,
          error: { message: "User with this ID already exists" },
        });
      }

      // Check if user already exists by email
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        console.log("🔐 Signup conflict: Email already exists:", email);
        return res.status(409).json({
          success: false,
          error: { message: "User with this email already exists" },
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new HabitLoop user
      const newUser = await storage.createUser({
        id: userId,
        email,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        level: 1,
        xp: 0,
        role: "habitloop_user",
        isGuest: false,
        difficulty,
        profileImageUrl: profileImageUrl || "👤",
      });

      // Generate JWT token
      const token = jwt.sign({ userId: newUser.id }, typedEnv.jwtSecret, {
        expiresIn: "7d",
      });

      console.log(
        "🔐 New HabitLoop user created:",
        newUser.id,
        "Level:",
        newUser.level,
        "XP:",
        newUser.xp
      );

      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          level: newUser.level,
          xp: newUser.xp,
          role: newUser.role,
          isGuest: false,
          difficulty: newUser.difficulty,
          profileImageUrl: newUser.profileImageUrl,
        },
        token: token,
        message: "HabitLoop user created successfully",
      });
    } catch (error) {
      console.error("HabitLoop signup error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to create user" },
      });
    }
  });

  // HabitLoop user authentication (JWT only, no sessions)
  router.post("/habitloop/signin", async (req: any, res) => {
    try {
      const { userId, password } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { message: "User ID required" },
        });
      }

      // Define HabitLoop user metadata (no XP/level data)
      const habitLoopUserMetadata = {
        "user-001": {
          id: "user-001",
          email: "user-001@habitloop.local",
          firstName: "Alex",
          lastName: "Chen",
          role: "habitloop_user",
          isGuest: false,
          difficulty: "medium",
          profileImageUrl: "👨‍💻",
          password: "test123",
        },
        "user-002": {
          id: "user-002",
          email: "user-002@habitloop.local",
          firstName: "Sarah",
          lastName: "Johnson",
          role: "habitloop_user",
          isGuest: false,
          difficulty: "easy",
          profileImageUrl: "👩‍🎨",
          password: "test123",
        },
        "user-003": {
          id: "user-003",
          email: "user-003@habitloop.local",
          firstName: "Marcus",
          lastName: "Rodriguez",
          role: "habitloop_user",
          isGuest: false,
          difficulty: "medium",
          profileImageUrl: "🏃‍♂️",
          password: "test123",
        },
        "user-004": {
          id: "user-004",
          email: "user-004@habitloop.local",
          firstName: "Emma",
          lastName: "Thompson",
          role: "habitloop_user",
          isGuest: false,
          difficulty: "medium",
          profileImageUrl: "🧘‍♀️",
          password: "test123",
        },
        "user-005": {
          id: "user-005",
          email: "user-005@habitloop.local",
          firstName: "David",
          lastName: "Kim",
          role: "habitloop_user",
          isGuest: false,
          difficulty: "medium",
          profileImageUrl: "📚",
          password: "test123",
        },
        "user-006": {
          id: "user-006",
          email: "user-006@habitloop.local",
          firstName: "Lisa",
          lastName: "Wang",
          role: "habitloop_user",
          isGuest: false,
          difficulty: "easy",
          profileImageUrl: "🌱",
          password: "test123",
        },
        "user-007": {
          id: "user-007",
          email: "user-007@habitloop.local",
          firstName: "New",
          lastName: "User",
          role: "habitloop_user",
          isGuest: false,
          difficulty: "easy",
          profileImageUrl: "🆕",
          password: "test123",
        },
        "user-008": {
          id: "user-008",
          email: "user-008@habitloop.local",
          firstName: "Fresh",
          lastName: "Start",
          role: "habitloop_user",
          isGuest: false,
          difficulty: "easy",
          profileImageUrl: "🆕",
          password: "test123",
        },
        "user-009": {
          id: "user-009",
          email: "user-009@habitloop.local",
          firstName: "Zero",
          lastName: "Level",
          role: "habitloop_user",
          isGuest: false,
          difficulty: "easy",
          profileImageUrl: "🆕",
          password: "test123",
        },
        "user-010": {
          id: "user-010",
          email: "user-010@habitloop.local",
          firstName: "Anna",
          lastName: "Taylor",
          role: "habitloop_user",
          isGuest: false,
          difficulty: "medium",
          profileImageUrl: "👩‍💼",
          password: "test123",
        },
        "user-011": {
          id: "user-011",
          email: "user-011@habitloop.local",
          firstName: "James",
          lastName: "Bond",
          role: "habitloop_user",
          isGuest: false,
          difficulty: "medium",
          profileImageUrl: "🕵️‍♂️",
          password: "test123",
        },
      };

      // First check hardcoded metadata for pre-configured users
      let userMetadata =
        habitLoopUserMetadata[userId as keyof typeof habitLoopUserMetadata];

      // If not found in hardcoded metadata, check database for newly created users
      if (!userMetadata) {
        const dbUser = await storage.getUser(userId);
        if (
          dbUser &&
          !dbUser.isGuest &&
          (dbUser.role === "habitloop_user" ||
            dbUser.id.startsWith("user-") ||
            !dbUser.supabaseAuthId ||
            dbUser.role === "user")
        ) {
          userMetadata = {
            id: dbUser.id,
            email: dbUser.email || `${dbUser.id}@habitloop.local`,
            firstName: dbUser.firstName || "User",
            lastName: dbUser.lastName || "Name",
            role: dbUser.role || "user",
            isGuest: false,
            difficulty: dbUser.difficulty || "medium",
            profileImageUrl: dbUser.profileImageUrl || "👤",
            password: "test123", // Default password for new users
          };
        }
      }

      if (!userMetadata) {
        return res.status(404).json({
          success: false,
          error: { message: "HabitLoop user not found" },
        });
      }

      // Check password for users
      if (password) {
        // For hardcoded users, check against metadata password
        if (
          habitLoopUserMetadata[userId as keyof typeof habitLoopUserMetadata]
        ) {
          if (userMetadata.password && password !== userMetadata.password) {
            return res.status(401).json({
              success: false,
              error: { message: "Invalid password" },
            });
          }
        } else {
          // For database users, check against hashed password
          const dbUser = await storage.getUser(userId);
          if (dbUser && dbUser.passwordHash) {
            const isValidPassword = await bcrypt.compare(
              password,
              dbUser.passwordHash
            );
            if (!isValidPassword) {
              return res.status(401).json({
                success: false,
                error: { message: "Invalid password" },
              });
            }
          }
        }
      }

      // Get fresh user data from database (or create if needed)
      let freshUserData;
      try {
        const existingUser = await storage.getUser(userMetadata.id);
        if (existingUser) {
          // Use database values - NEVER overwrite with hardcoded values
          freshUserData = {
            ...userMetadata,
            level: existingUser.level || 1,
            xp: existingUser.xp || 0,
            difficulty: existingUser.difficulty || "medium",
          };
        } else {
          // Create new user in database if doesn't exist
          console.log(
            "Creating new HabitLoop user in database:",
            userMetadata.id
          );
          await storage.createUser({
            id: userMetadata.id,
            email: userMetadata.email,
            firstName: userMetadata.firstName,
            lastName: userMetadata.lastName,
            level: 1,
            xp: 0,
            role: userMetadata.role,
            isGuest: false,
            difficulty: userMetadata.difficulty,
            profileImageUrl: userMetadata.profileImageUrl,
          });

          freshUserData = {
            ...userMetadata,
            level: 1,
            xp: 0,
            difficulty: userMetadata.difficulty,
          };
        }
      } catch (error) {
        console.error("Error getting/creating user data:", error);
        return res.status(500).json({
          success: false,
          error: { message: "Failed to get user data" },
        });
      }

      // Generate JWT token (no session cookie for HabitLoop users)
      const token = jwt.sign({ userId: userMetadata.id }, typedEnv.jwtSecret, {
        expiresIn: "7d",
      });

      // HabitLoop user authenticated successfully

      // Return response without setting session cookie
      res.json({
        success: true,
        user: freshUserData,
        token: token,
        message: "HabitLoop user authenticated successfully",
      });
    } catch (error) {
      console.error("HabitLoop signin error:", error);
      try {
        if (
          res &&
          typeof res.status === "function" &&
          typeof res.json === "function"
        ) {
          res.status(500).json({
            success: false,
            error: { message: "Authentication failed" },
          });
        } else {
          console.error("❌ Response object is invalid:", typeof res, res);
        }
      } catch (responseError) {
        console.error("❌ Failed to send error response:", responseError);
      }
    }
  });

  // Get all HabitLoop users
  router.get("/habitloop/users", async (_req: any, res) => {
    try {
      // Get all users from database
      const allUsers = await storage.getAllUsers();

      // Filter to only HabitLoop users (not Supabase users) and exclude guest users
      const habitLoopUsers = allUsers.filter(
        (user) =>
          !user.isGuest && // Exclude guest users
          (user.role === "habitloop_user" ||
            user.id.startsWith("user-") ||
            !user.supabaseAuthId || // HabitLoop users don't have supabaseAuthId
            user.role === "user") // Include users with role 'user' (non-Supabase users)
      );

      // Transform to match frontend interface and sort by ID
      const users = habitLoopUsers
        .map((user) => ({
          id: user.id,
          username: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          difficulty: user.difficulty || "medium",
          avatar: user.profileImageUrl || "👤",
          description: `${user.firstName} ${user.lastName} - ${
            user.difficulty || "medium"
          } difficulty`,
          level: user.level || 1,
          xp: user.xp || 0,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)); // Sort by ID in ascending order

      res.json({
        success: true,
        users,
      });
    } catch (error) {
      console.error("Get HabitLoop users error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch users" },
      });
    }
  });

  return router;
}
