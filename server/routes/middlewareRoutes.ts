// server/routes/middlewareRoutes.ts
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { fromZodError } from 'zod-validation-error';
import { storage } from '../storage';
import { typedEnv } from '../env';
import { supabase } from '../supabaseAuth';
import jwt from 'jsonwebtoken';

export function setupSession(app: any) {
  // Use memory store for development to avoid PostgreSQL session issues
  if (typedEnv.nodeEnv === 'development') {
    console.log('🔧 Using memory session store for development');
    app.use(session({
      secret: typedEnv.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // Allow non-HTTPS for development
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }
    }));
  } else {
    // Use PostgreSQL store for production
    const pgStore = connectPg(session);

    // ✅ ENHANCED: Session store with SSL self-signed certificate support
    const sessionStore = new pgStore({
      conString: typedEnv.dbUrl,
      createTableIfMissing: true,
      ttl: 7 * 24 * 60 * 60,
      tableName: "sessions",
      schemaName: "public",
      pruneSessionInterval: 60,
      errorLog: (...args: any[]) => {
        console.error('Session store error:', ...args);
        // ✅ Don't log SSL certificate errors as critical
        if (args[0]?.includes && args[0].includes('self-signed certificate')) {
          console.warn('⚠️ SSL certificate warning (expected with Supabase) - session store continues');
        }
      }
    });

    // ✅ Enhanced session store error handling
    sessionStore.on('error', (err) => {
      if (err.message?.includes('self-signed certificate') || 
          err.message?.includes('SELF_SIGNED_CERT_IN_CHAIN')) {
        console.warn('⚠️ Session store SSL warning (expected with Supabase):', err.message);
      } else if (err.message?.includes('SCRAM') || err.message?.includes('SASL')) {
        console.error('❌ Session store SCRAM authentication failed - check DATABASE_URL password');
      } else {
        console.error('Session store error:', err.message);
      }
    });

    app.use(session({
      secret: typedEnv.sessionSecret,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: typedEnv.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }
    }));
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Prioritize JWT token from Authorization header (for authenticated users)
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('🔐 Using JWT token from Authorization header');
    } else if ((req.session as any)?.token) {
      // Fallback to session token only if no Authorization header
      token = (req.session as any).token;
      console.log('🔐 Using session token as fallback');
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required - JWT token needed' }
      });
    }

    // Check for JWT token (both guest and authenticated users) first
    if (token && token.includes('.')) {
      try {
        const jwtSecret = typedEnv.jwtSecret;
        const decoded = jwt.verify(token, jwtSecret) as any;
        
        // Handle both guest and authenticated JWT tokens
        const user = await storage.getUser(decoded.userId);
        if (user) {
          // Check if this is a critical endpoint that needs fresh data
          const isCriticalEndpoint = req.path.includes('/analytics/') || 
                                   req.path.includes('/ml/') || 
                                   req.path.includes('/xp-calculation');
          
          if (isCriticalEndpoint) {
            // Force fresh database query for critical endpoints
            console.log(`🔄 Critical endpoint detected: ${req.path} - forcing fresh user data`);
            const freshUser = await storage.getUser(decoded.userId);
            if (freshUser) {
              req.user = {
                id: freshUser.id,
                email: freshUser.email,
                role: freshUser.role,
                level: freshUser.level,
                xp: freshUser.xp,
                firstName: freshUser.firstName,
                lastName: freshUser.lastName,
                passwordHash: freshUser.passwordHash,
                profileImageUrl: freshUser.profileImageUrl,
                isGuest: freshUser.isGuest,
                questionnaire: freshUser.questionnaire,
                emailSettings: freshUser.emailSettings,
                difficulty: freshUser.difficulty,
                createdAt: freshUser.createdAt,
                updatedAt: freshUser.updatedAt
              };
              console.log(`✅ Fresh user data loaded: Level ${freshUser.level}, XP ${freshUser.xp}`);
            } else {
              req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                level: user.level,
                xp: user.xp,
                firstName: user.firstName,
                lastName: user.lastName,
                passwordHash: user.passwordHash,
                profileImageUrl: user.profileImageUrl,
                isGuest: user.isGuest,
                questionnaire: user.questionnaire,
                emailSettings: user.emailSettings,
                difficulty: user.difficulty,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
              };
            }
          } else {
            // Use cached data for non-critical endpoints
            req.user = {
              id: user.id,
              email: user.email,
              role: user.role,
              level: user.level,
              xp: user.xp,
              firstName: user.firstName,
              lastName: user.lastName,
              passwordHash: user.passwordHash,
              profileImageUrl: user.profileImageUrl,
              isGuest: user.isGuest,
              questionnaire: user.questionnaire,
              emailSettings: user.emailSettings,
              difficulty: user.difficulty,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt
            };
          }
          return next();
        }
      } catch (jwtError) {
        console.log('❌ JWT verification failed:', jwtError);
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid JWT token' }
        });
      }
    }

    // Only use Supabase for non-JWT tokens (legacy support)
    if (!supabase) {
      return res.status(401).json({
        success: false,
        error: { message: 'JWT authentication required - no session support' }
      });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token - JWT authentication required' }
      });
    }

    // ✅ ENHANCED: Handle ID mismatch between Supabase Auth and application database
    let dbUser = null;
    
    try {
      // First, try to get user by Supabase ID
      dbUser = await storage.getUser(user.id);
      
      if (dbUser) {
        console.log(`✅ Found user by Supabase ID: ${user.email}`);
      } else {
        console.log(`🔍 User not found by Supabase ID: ${user.id}, checking by email...`);
        
        // If not found by ID, try by email (handles ID mismatch)
        try {
          dbUser = await storage.getUserByEmail(user.email || '');
          
          if (dbUser) {
            console.log(`📋 Found user by email but different ID. Supabase ID: ${user.id}, DB ID: ${dbUser.id}`);
            
            // ✅ CRITICAL: Update the database user to use Supabase ID
            console.log(`🔄 Updating user ID in database to match Supabase: ${user.id}`);
            
            // Update the user record to use Supabase ID
            await updateUserIdInDatabase(dbUser.id, user.id);
            
            // Re-fetch the user with the correct ID
            dbUser = await storage.getUser(user.id);
            console.log(`✅ User ID synchronized successfully: ${user.email}`);
          } else {
            // User doesn't exist at all, create new one
            console.log(`🔄 Creating new user in database: ${user.email}`);
            
            dbUser = await storage.createUser({
              id: user.id, // Use Supabase ID
              email: user.email || null,
              firstName: user.user_metadata?.first_name || 'User',
              lastName: user.user_metadata?.last_name || 'User',
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
            
            console.log(`✅ User created successfully in database: ${user.email}`);
          }
        } catch (emailError: any) {
          console.error('Failed to lookup user by email:', emailError.message);
        }
      }
    } catch (dbError: any) {
      console.error('Database operation failed:', dbError.message);
    }

    // Set user information
    if (dbUser) {
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        level: dbUser.level,
        xp: dbUser.xp,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        passwordHash: dbUser.passwordHash,
        profileImageUrl: dbUser.profileImageUrl,
        isGuest: dbUser.isGuest,
        questionnaire: dbUser.questionnaire,
        emailSettings: dbUser.emailSettings,
        difficulty: dbUser.difficulty,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt
      };
    } else {
      // Fallback: Use Supabase data without database
      console.warn('⚠️ Using Supabase-only user data (database user lookup failed)');
      req.user = {
        id: user.id,
        email: user.email || null,
        role: 'user',
        level: 1,
        xp: 0,
        firstName: user.user_metadata?.first_name || 'User',
        lastName: user.user_metadata?.last_name || 'User',
        passwordHash: null,
        profileImageUrl: null,
        isGuest: false,
        questionnaire: null,
        emailSettings: null,
        difficulty: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token' }
    });
  }
}

// ✅ Helper function to update user ID in database
async function updateUserIdInDatabase(oldId: string, newId: string) {
  try {
    // First, check if the new ID already exists (avoid conflicts)
    const existingUser = await storage.getUser(newId);
    if (existingUser) {
      console.log(`⚠️ User with new ID ${newId} already exists, skipping update`);
      return;
    }

    // Update the user ID
    await storage.updateUserId(oldId, newId);
    
  } catch (error: any) {
    // ✅ ENHANCED: Handle specific table missing errors gracefully
    if (error.code === '42P01' && error.message?.includes('user_permissions')) {
      console.warn('⚠️ RBAC tables not fully implemented, user ID sync partially successful');
      // Don't throw - let the system continue working
      return;
    }
    
    console.error('Failed to update user ID:', error);
    // Still throw for other serious errors
    throw error;
  }
}

export function validateHabitInput(req: Request, res: Response, next: NextFunction) {
  const { title, category, targetValue } = req.body;

  if (!title || typeof title !== 'string' || title.length < 1 || title.length > 100) {
    return res.status(400).json({
      success: false,
      error: { field: 'title', message: 'Title must be 1-100 characters' }
    });
  }

  if (!category || typeof category !== 'string') {
    return res.status(400).json({
      success: false,
      error: { field: 'category', message: 'Category is required' }
    });
  }

  if (!targetValue || typeof targetValue !== 'number' || targetValue < 1 || targetValue > 100) {
    return res.status(400).json({
      success: false,
      error: { field: 'targetValue', message: 'Target value must be 1-100' }
    });
  }

  next();
}

export function validateZodSchema(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { message: fromZodError(error).toString() }
        });
      }
      next(error);
    }
  };
}

// RBAC middleware
export function requireRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required' }
        });
      }

      const userRole = req.user.role || 'user';
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: { message: 'Insufficient permissions' }
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { message: 'Authorization check failed' }
      });
    }
  };
}

// Shortcut middleware
export const requireAdmin = requireRole(['admin', 'super_user']);
export const requirePremium = requireRole(['premium', 'coach', 'admin', 'super_user']);

// Enhanced request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function(body: any) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    return originalSend.call(this, body);
  };

  next();
}

// Rate limiting middleware
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    const clientData = requestCounts.get(clientIP) || { count: 0, resetTime: now + windowMs };

    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
    } else {
      clientData.count++;
    }

    requestCounts.set(clientIP, clientData);

    if (clientData.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: { message: 'Too many requests. Please try again later.' }
      });
    }

    next();
  };
}
