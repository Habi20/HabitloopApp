import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users, habits, habitCompletions, streaks } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { typedEnv } from '../env';
import { requireAuth } from './middlewareRoutes';
import { sessionManager } from '../services/sessionManager';
import { adminLog } from '../utils/adminLogger';

const router = express.Router();

// HabitLoop user signin (supports both userId and email)
router.post('/habitloop/signin', async (req, res) => {
  try {
    const { userId, email, password } = req.body;
      
    if (!userId && !email) {
      return res.status(400).json({
        success: false, 
        error: 'Missing credentials',
        message: 'userId or email is required'
      });
    }

    // Get user from database by userId or email
    let userResult;
    if (email) {
      // Login by email
      userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    } else {
      // Login by userId (legacy)
      userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
    }

    if (userResult.length === 0) {
        return res.status(401).json({ 
          success: false, 
        error: 'Invalid credentials',
        message: 'Invalid email/password or user not found'
      });
    }

    const user = userResult[0];

    // Check password if provided
    if (password && user.passwordHash) {
      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.default.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false, 
          error: 'Invalid credentials',
          message: 'Invalid userId or password'
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        isGuest: user.isGuest || false
      },
      typedEnv.jwtSecret,
      { expiresIn: '24h' }
    );

    // Create session with device info
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';
    
    await sessionManager.createSession(
      user.id,
      token,
      deviceInfo,
      ipAddress,
      req.headers['user-agent']
    );

    // Update last login
    await db
      .update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, user.id));

    adminLog.log(`User ${user.id} signed in successfully`);

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
          isGuest: user.isGuest || false,
          profileImageUrl: user.profileImageUrl,
          difficulty: user.difficulty,
          userSettings: user.userSettings
        },
        token,
        message: 'Signed in successfully'
      });
    } catch (error) {
    adminLog.error('HabitLoop signin error:', error);
      res.status(500).json({ 
        success: false, 
      error: 'Signin failed',
      message: 'An error occurred during signin'
      });
    }
  });

// HabitLoop user signup
router.post('/habitloop/signup', async (req, res) => {
    try {
    console.log('Signup request body:', JSON.stringify(req.body, null, 2));
    const { userId, firstName, lastName, email, difficulty, questionnaireData, aiRecommendations } = req.body;

    if (!userId || !firstName || !lastName || !email) {
        return res.status(400).json({
          success: false,
        error: 'Missing required fields',
        message: 'userId, firstName, lastName, and email are required'
      });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
          success: false,
        error: 'User already exists',
        message: 'A user with this ID already exists'
      });
    }

                    // Hash password if provided
                let passwordHash = null;
                if (req.body.password) {
                  const bcrypt = await import('bcryptjs');
                  passwordHash = await bcrypt.default.hash(req.body.password, 10);
                }

                // Ensure questionnaire data is properly formatted for JSONB
                let formattedQuestionnaire = null;
                if (questionnaireData) {
                  try {
                    // If it's already an object, use it directly
                    if (typeof questionnaireData === 'object') {
                      formattedQuestionnaire = questionnaireData;
                    } else if (typeof questionnaireData === 'string') {
                      // If it's a string, try to parse it
                      formattedQuestionnaire = JSON.parse(questionnaireData);
                    }
                  } catch (parseError) {
                    console.error('Error parsing questionnaire data:', parseError);
                    formattedQuestionnaire = { rawData: questionnaireData };
                  }
                }

                console.log('About to create user with data:', {
                  id: userId,
                  email: email,
                  firstName: firstName,
                  lastName: lastName,
                  difficulty: difficulty || 'medium',
                  level: 1,
                  xp: 0,
                  role: 'user',
                  isGuest: false,
                  profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                  questionnaire: formattedQuestionnaire,
                  passwordHash: passwordHash ? '[HASHED]' : null,
                  createdAt: new Date(),
                  updatedAt: new Date()
                });

                // Create new user with only essential fields
                const userData: any = {
                  id: userId,
                  email: email,
                  firstName: firstName,
                  lastName: lastName,
                  difficulty: difficulty || 'medium',
                  level: 1,
                  xp: 0,
                  role: 'user',
                  isGuest: false,
                  profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                  createdAt: new Date(),
                  updatedAt: new Date()
                };

                // Add optional fields only if they exist
                if (questionnaireData) {
                  (userData as any).questionnaire = questionnaireData;
                }
                if (aiRecommendations) {
                  (userData as any).aiRecommendations = aiRecommendations;
                }
                if (passwordHash) {
                  (userData as any).passwordHash = passwordHash;
                }

                console.log('Final user data for insert:', {
                  ...userData,
                  aiRecommendations: userData.aiRecommendations ? `[${userData.aiRecommendations.length} recommendations]` : null,
                  questionnaire: userData.questionnaire ? '[QUESTIONNAIRE_DATA]' : null,
                  passwordHash: userData.passwordHash ? '[HASHED]' : null
                });

                const [newUser] = await db
                  .insert(users)
                  .values(userData)
                  .returning();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        isGuest: newUser.isGuest || false
      },
      typedEnv.jwtSecret,
      { expiresIn: '24h' }
    );

    // Create session with device info
    try {
      const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';
      
      await sessionManager.createSession(
        newUser.id,
        token,
        deviceInfo,
        ipAddress,
        req.headers['user-agent']
      );
    } catch (sessionError) {
      adminLog.error('Session creation error:', sessionError);
      // Continue without session if it fails
    }

        adminLog.log(`New user ${newUser.id} signed up successfully${newUser.aiRecommendations ? ` with ${Array.isArray(newUser.aiRecommendations) ? newUser.aiRecommendations.length : 'AI recommendations'}` : ''}`);

    res.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        level: newUser.level,
        xp: newUser.xp,
        role: newUser.role,
        isGuest: newUser.isGuest || false,
        profileImageUrl: newUser.profileImageUrl,
        difficulty: newUser.difficulty
      },
      token,
      message: 'Account created successfully'
    });
  } catch (error) {
    adminLog.error('HabitLoop signup error:', error);
    console.error('Detailed signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Signup failed',
      message: 'An error occurred during signup',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Guest authentication is now handled by guestRoutes.ts
// This route has been moved to /api/guest/auth in guestRoutes.ts

// Get current user
router.get('/user', requireAuth, async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
          success: false,
        error: 'User not found',
        message: 'User information not available'
      });
    }

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({
          success: false,
        error: 'User not found',
        message: 'User account not found'
      });
    }

    const user = userResult[0];

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
        isGuest: user.isGuest || false,
        profileImageUrl: user.profileImageUrl,
        difficulty: user.difficulty,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    adminLog.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      message: 'An error occurred while fetching user information'
    });
  }
});

// Logout
router.post('/logout', requireAuth, async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
          success: false,
        error: 'User not found',
        message: 'User information not available'
      });
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Deactivate session
      const sessionValidation = await sessionManager.validateSession(token);
      if (sessionValidation.session) {
        await sessionManager.deactivateSession(sessionValidation.session.userId);
      }
    }

    adminLog.log(`User ${req.user.id} logged out successfully`);

      res.json({
        success: true,
      message: 'Logged out successfully'
      });
  } catch (error) {
    adminLog.error('Logout error:', error);
      res.status(500).json({
        success: false,
      error: 'Logout failed',
      message: 'An error occurred during logout'
      });
    }
  });

// Update user profile
router.put('/users/:userId', requireAuth, async (req: any, res) => {
    try {
    const { userId } = req.params;
    const { firstName, lastName, profileImageUrl } = req.body;
      
    if (!req.user || req.user.id !== userId) {
      return res.status(403).json({
          success: false,
        error: 'Unauthorized',
        message: 'You can only update your own profile'
      });
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
    updateData.updatedAt = new Date();

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    adminLog.log(`User ${userId} profile updated`);

      res.json({
      success: true,
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageUrl: updatedUser.profileImageUrl,
        updatedAt: updatedUser.updatedAt
      },
      message: 'Profile updated successfully'
    });
    } catch (error) {
    adminLog.error('Update user error:', error);
      res.status(500).json({
        success: false,
      error: 'Update failed',
      message: 'An error occurred while updating profile'
      });
    }
  });

// Check session status
router.get('/session/status', requireAuth, async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
          success: false,
        error: 'User not found',
        message: 'User information not available'
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
          success: false,
        error: 'No token provided',
        message: 'Authentication token is required'
      });
    }

    const token = authHeader.substring(7);
    
    // For guest users, do a simpler validation
    if (req.user.isGuest) {
      // Just verify the JWT token is still valid (not expired)
      try {
        const decoded = jwt.verify(token, typedEnv.jwtSecret) as any;
        const now = Math.floor(Date.now() / 1000);
        
        if (decoded.exp && decoded.exp < now) {
          return res.status(401).json({
            success: false,
            error: 'Session expired',
            message: 'Guest session has expired'
          });
        }

        // For guests, return basic session info without database validation
        res.json({
          success: true,
          session: {
            valid: true,
            expiresAt: new Date(decoded.exp * 1000).toISOString(),
            timeoutMinutes: 1440, // 24 hours
            hasOtherDevice: false // Guests don't have multi-device restrictions
          }
        });
        return;
      } catch (jwtError) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Guest session token is invalid'
        });
      }
    }

    // For regular users, do full session validation
    const sessionValidation = await sessionManager.validateSession(token);

    if (!sessionValidation.valid) {
      return res.status(401).json({
        success: false,
        error: 'Session expired',
        message: sessionValidation.message || 'Session has expired'
      });
    }

    // Check if user has active session on another device
    const hasOtherDevice = await sessionManager.hasActiveSessionOnOtherDevice(req.user.id, token);

    res.json({
        success: true,
      session: {
        valid: true,
        expiresAt: sessionValidation.session?.expiresAt,
        timeoutMinutes: sessionManager.getSessionTimeoutMinutes(),
        hasOtherDevice
      }
    });
  } catch (error) {
    adminLog.error('Session status error:', error);
      res.status(500).json({
        success: false,
      error: 'Session check failed',
      message: 'An error occurred while checking session status'
      });
    }
  });

// Get all HabitLoop users (public endpoint for login modal)
router.get('/habitloop/users', async (_req, res) => {
  try {
    // Get all non-guest users from database
    const userResult = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        level: users.level,
        xp: users.xp,
        role: users.role,
        isGuest: users.isGuest,
        difficulty: users.difficulty
      })
      .from(users)
      .where(eq(users.isGuest, false))
      .orderBy(users.id);

    adminLog.log(`Fetched ${userResult.length} HabitLoop users for login modal`);

    res.json({
      success: true,
      users: userResult
    });
  } catch (error) {
    adminLog.error('Fetch users error:', error);
    res.status(500).json({
          success: false,
      error: 'Failed to fetch users',
      message: 'An error occurred while fetching users'
    });
  }
});

// Export user data
router.get('/export-data', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const format = req.query.format || 'json'; // json, csv, or excel
    
    // Fetch all user data
    const [userData, habitsData, completionsData, streaksData] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1),
      db.select().from(habits).where(eq(habits.userId, userId)),
      db.select().from(habitCompletions).where(eq(habitCompletions.userId, userId)),
      db.select().from(streaks).where(eq(streaks.userId, userId))
    ]);

    const exportData = {
      user: userData[0],
      habits: habitsData,
      completions: completionsData,
      streaks: streaksData,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const dateStr = new Date().toISOString().split('T')[0];
    
    if (format === 'csv') {
      // Generate CSV data
      const csvData = generateCSVData(exportData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="habitloop-data-${userId}-${dateStr}.csv"`);
      
      adminLog.log(`User ${userId} exported their data as CSV`);
      res.send(csvData);

    } else {
      // Default JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="habitloop-data-${userId}-${dateStr}.json"`);
      
      adminLog.log(`User ${userId} exported their data as JSON`);
      res.json(exportData);
    }
  } catch (error) {
    adminLog.error('Export data error:', error);
    res.status(500).json({
      success: false,
      error: 'Export failed',
      message: 'An error occurred while exporting data'
    });
  }
});

// Helper function to generate CSV data
function generateCSVData(data: any): string {
  const csvLines: string[] = [];
  
  // User Profile
  csvLines.push('=== YOUR PROFILE ===');
  csvLines.push('Name,Email,Level,XP,Difficulty');
  if (data.user) {
    const name = `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim();
    csvLines.push(`"${name}","${data.user.email}","${data.user.level}","${data.user.xp}","${data.user.difficulty}"`);
  }
  csvLines.push('');
  
  // Habits
  csvLines.push('=== YOUR HABITS ===');
  csvLines.push('Habit Name,Category,Frequency,Difficulty,Created Date');
  if (data.habits && data.habits.length > 0) {
    data.habits.forEach((habit: any) => {
      csvLines.push(`"${habit.title}","${habit.category}","${habit.frequency}","${habit.difficulty}","${habit.createdAt}"`);
    });
  } else {
    csvLines.push('No habits found');
  }
  csvLines.push('');
  
  // Habit Completions
  csvLines.push('=== HABIT COMPLETIONS ===');
  csvLines.push('Habit Name,Completed Date,Notes');
  if (data.completions && data.completions.length > 0) {
    data.completions.forEach((completion: any) => {
      const habit = data.habits?.find((h: any) => h.id === completion.habitId);
      const habitName = habit ? habit.title : 'Unknown Habit';
      csvLines.push(`"${habitName}","${completion.completedAt}","${completion.notes || ''}"`);
    });
  } else {
    csvLines.push('No completions found');
  }
  csvLines.push('');
  
  // Streaks
  csvLines.push('=== YOUR STREAKS ===');
  csvLines.push('Habit Name,Current Streak,Longest Streak');
  if (data.streaks && data.streaks.length > 0) {
    data.streaks.forEach((streak: any) => {
      const habit = data.habits?.find((h: any) => h.id === streak.habitId);
      const habitName = habit ? habit.title : 'Unknown Habit';
      csvLines.push(`"${habitName}","${streak.currentStreak}","${streak.longestStreak}"`);
    });
  } else {
    csvLines.push('No streaks found');
  }
  
  return csvLines.join('\n');
}



// Delete user account
router.delete('/delete-account', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { confirmation } = req.body;

    if (confirmation !== 'DELETE') {
      return res.status(400).json({
        success: false,
        error: 'Invalid confirmation',
        message: 'Please enter "DELETE" to confirm account deletion'
      });
    }
    
    // First, deactivate the user's session
    await sessionManager.deactivateSession(userId);
    
    // Delete all user data (cascade delete)
    await Promise.all([
      db.delete(habitCompletions).where(eq(habitCompletions.userId, userId)),
      db.delete(streaks).where(eq(streaks.userId, userId)),
      db.delete(habits).where(eq(habits.userId, userId)),
      db.delete(users).where(eq(users.id, userId))
    ]);
    
    adminLog.log(`User ${userId} account deleted permanently`);

      res.json({
        success: true,
      message: 'Account deleted successfully'
      });
    } catch (error) {
    adminLog.error('Delete account error:', error);
      res.status(500).json({
        success: false,
      error: 'Delete failed',
      message: 'An error occurred while deleting account'
      });
    }
  });



// Get user profile for login preview by email (public endpoint)
router.get('/habitloop/user-profile-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Missing email',
        message: 'email is required'
      });
    }

    const userResult = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      level: users.level,
      xp: users.xp,
      difficulty: users.difficulty,
      profileImageUrl: users.profileImageUrl,
      role: users.role
    }).from(users).where(eq(users.email, email)).limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    const user = userResult[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        level: user.level,
        xp: user.xp,
        difficulty: user.difficulty,
        profileImageUrl: user.profileImageUrl,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error fetching user profile by email:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch user profile'
    });
  }
});

// Get user profile for login preview (public endpoint)
router.get('/habitloop/user-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
        error: 'Missing userId',
        message: 'userId is required'
      });
    }

    const userResult = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      level: users.level,
      xp: users.xp,
      difficulty: users.difficulty,
      profileImageUrl: users.profileImageUrl,
      role: users.role
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (userResult.length === 0) {
        return res.status(404).json({
          success: false,
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    const user = userResult[0];
    
    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        level: user.level,
        xp: user.xp,
        difficulty: user.difficulty,
        profileImageUrl: user.profileImageUrl,
        role: user.role
      }
    });
  } catch (error) {
    adminLog.error('User profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Profile fetch failed',
      message: 'An error occurred while fetching user profile'
    });
  }
});

// Create new HabitLoop user account
router.post('/habitloop/signup', async (req, res) => {
  try {
    const { userId, firstName, lastName, email, difficulty, questionnaireData } = req.body;

    if (!userId || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'userId, firstName, and lastName are required'
      });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'A user with this ID already exists'
      });
    }

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        firstName,
        lastName,
        email: email || `${userId}@habitloop.local`,
        role: 'user',
        isGuest: false,
        level: 1,
        xp: 0,
        difficulty: difficulty || 'medium',
        profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        questionnaire: questionnaireData || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Generate JWT token
      const token = jwt.sign(
      { 
        id: newUser.id, 
        role: newUser.role,
        isGuest: false 
      },
      typedEnv.jwtSecret,
      { expiresIn: '24h' }
    );

    adminLog.log(`New HabitLoop user created: ${userId}`);

    res.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        level: newUser.level,
        xp: newUser.xp,
        difficulty: newUser.difficulty,
        profileImageUrl: newUser.profileImageUrl,
        role: newUser.role
      },
      token
    });
  } catch (error) {
    adminLog.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Account creation failed',
      message: 'An error occurred while creating your account'
    });
  }
});

// Get next available user ID for signup
router.get('/habitloop/next-user-id', async (_req, res) => {
  try {
    const allUsers = await db.select({ id: users.id }).from(users);
    
    // Extract all user IDs that start with 'user-'
    const userIds = allUsers
      .map(user => user.id)
      .filter(id => id.startsWith('user-'));

    // Find the highest number
    const numbers = userIds.map(id => {
      const numberPart = id.replace('user-', '');
      const parsed = parseInt(numberPart, 10);
      return isNaN(parsed) ? 0 : parsed;
    });
    
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    // Format as user-XXXXXX (6 digits with leading zeros)
    const nextUserId = `user-${nextNumber.toString().padStart(6, '0')}`;
    
      res.json({
        success: true,
      nextUserId
      });
    } catch (error) {
    adminLog.error('Next user ID generation error:', error);
    res.status(500).json({
      success: false,
      error: 'ID generation failed',
      message: 'An error occurred while generating next user ID'
    });
  }
});

// Update user settings
router.put('/user/settings', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        message: 'User information not available'
      });
    }

    // Update user settings in database
    const [updatedUser] = await db
      .update(users)
      .set({ 
        userSettings: settings,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    adminLog.log(`User ${userId} updated settings`);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedUser.userSettings
    });
  } catch (error) {
    adminLog.error('Update settings error:', error);
      res.status(500).json({
      success: false,
      error: 'Update failed',
      message: 'An error occurred while updating settings'
    });
  }
});

// Update user profile
router.put('/user/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, profileImageUrl } = req.body;
    
    // Verify the user is updating their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only update your own profile'
      });
    }

    // Update user data
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
        profileImageUrl: profileImageUrl || undefined,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User could not be found'
      });
    }

    adminLog.log(`User ${userId} updated profile`);

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        level: updatedUser.level,
        xp: updatedUser.xp,
        role: updatedUser.role,
        isGuest: updatedUser.isGuest,
        difficulty: updatedUser.difficulty,
        profileImageUrl: updatedUser.profileImageUrl
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    adminLog.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Update failed',
      message: 'An error occurred while updating profile'
      });
    }
  });

// Test endpoint to check database structure
router.get('/test-db-structure', async (_req, res) => {
  try {
    // Try to get a single user to see the structure
    const testUser = await db
      .select()
      .from(users)
      .limit(1);
    
    console.log('Database structure test - User fields:', Object.keys(testUser[0] || {}));
    
    res.json({
      success: true,
      userFields: testUser[0] ? Object.keys(testUser[0]) : [],
      hasPasswordHash: testUser[0] ? 'passwordHash' in testUser[0] : false,
      sampleUser: testUser[0] || null
    });
  } catch (error) {
    console.error('Database structure test error:', error);
    res.status(500).json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;