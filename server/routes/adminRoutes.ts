import express from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import { typedEnv } from '../env';
import { setLogStatus, getLogStatus } from '../utils/adminLogger';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      admin?: {
        adminId: string;
        adminName: string;
        isAdmin: boolean;
        issuedAt: number;
      };
    }
  }
}

// Extend global interface
declare global {
  var logsEnabled: boolean;
  var logLevel: string;
  var io: any;
}

// Initialize global log settings
if (typeof global.logsEnabled === 'undefined') {
  global.logsEnabled = true;
}
if (typeof global.logLevel === 'undefined') {
  global.logLevel = 'info';
}

const router = express.Router();

// Admin authentication middleware
const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: { message: 'Admin token required' } });
    }

    const decoded = jwt.verify(token, typedEnv.jwtSecret) as any;
    
    if (!decoded.isAdmin) {
      return res.status(403).json({ success: false, error: { message: 'Admin privileges required' } });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { message: 'Invalid admin token' } });
  }
};

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { adminId, password } = req.body;

    // Validate admin credentials (hardcoded for security)
    const validAdmins = [
      { id: 'super-admin', password: 'admin123!@#', name: 'Super Admin' },
      { id: 'system-admin', password: 'system456!@#', name: 'System Admin' }
    ];

    const admin = validAdmins.find(a => a.id === adminId && a.password === password);

    if (!admin) {
      return res.status(401).json({ 
          success: false,
        error: { message: 'Invalid admin credentials' } 
      });
    }

    // Generate admin JWT token
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        adminName: admin.name, 
        isAdmin: true,
        issuedAt: Date.now()
      },
      typedEnv.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          name: admin.name
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { message: 'Admin login failed' } 
    });
  }
});

// Get system status
router.get('/status', requireAdmin, async (_req, res) => {
  try {
    const stats = await storage.getSystemStats();
    const connectionPool = await storage.getConnectionPoolStatus();
    const lastQuery = await storage.getLastQueryTime();
    
    res.json({
      success: true,
      data: {
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
          platform: process.platform
        },
        database: {
          connectionPool,
          lastQuery
        },
        users: {
          total: stats.totalUsers,
          active: stats.activeUsers,
          guests: stats.guestUsers,
          verified: stats.verifiedUsers
        },
        habits: {
          total: stats.totalHabits,
          active: stats.activeHabits,
          completions: stats.totalCompletions
        },
        logs: getLogStatus()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { message: 'Failed to get system status' } 
    });
  }
});

// Toggle global logs
router.post('/logs/toggle', requireAdmin, async (req, res) => {
  try {
    const { enabled, level } = req.body;
    
    // Use the proper logging utility for backend
    setLogStatus(enabled, level || 'info');
    
    // Note: Frontend log settings will be set by the frontend admin panel
    // The frontend will call setFrontendLogStatus() which saves to localStorage
    const frontendSettings = { enabled, level: level || 'info' };
    
    // Broadcast to all connected clients
    global.io?.emit('admin:logsToggled', { enabled, level });
    
    res.json({
      success: true,
      data: {
        backend: getLogStatus(),
        frontend: frontendSettings,
        message: `Logs ${enabled ? 'enabled' : 'disabled'} for both backend and frontend`
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { message: 'Failed to toggle logs' } 
    });
  }
});

// Get all users (admin view)
router.get('/users', requireAdmin, async (_req, res) => {
  try {
    const users = await storage.getAllUsers();
    
      res.json({
        success: true,
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        level: user.level,
        xp: user.xp,
        role: user.role,
        isGuest: user.isGuest,
        createdAt: user.createdAt,
        lastActive: user.updatedAt
      }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
      error: { message: 'Failed to get users' } 
      });
    }
  });

// Emergency system shutdown
router.post('/emergency/shutdown', requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    console.log(`🚨 EMERGENCY SHUTDOWN initiated by admin ${req.admin?.adminId}: ${reason}`);
    
    res.json({
      success: true,
      data: { message: 'Emergency shutdown initiated' }
    });
    
    // Graceful shutdown after 5 seconds
    setTimeout(() => {
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    res.status(500).json({ 
          success: false,
      error: { message: 'Failed to initiate shutdown' } 
        });
      }
});

// Get ML system status
router.get('/ml/status', requireAdmin, async (_req, res) => {
  try {
    // Import ML service
    const { mlAdvancedService } = await import('../ml/services/mlAdvancedService');
    const mlService = mlAdvancedService;
    
    // Get real ML status
    const mlStatus = await mlService.getModelStatus();
    
      res.json({
        success: true,
      data: {
        predictions: mlStatus.training_samples || 0,
        accuracy: mlStatus.accuracy || mlStatus.r2_score || 0,
        lastTraining: mlStatus.last_trained || new Date().toISOString(),
        modelVersion: mlStatus.version || '1.0.0',
        fallbackMode: !mlStatus.trained,
        trained: mlStatus.trained,
        modelPath: mlStatus.model_path,
        featuresTrained: mlStatus.features_trained || 13
        }
      });
    } catch (error) {
    console.error('ML status error:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: 'Failed to get ML status' } 
    });
  }
});

// Retrain ML models
router.post('/ml/retrain', requireAdmin, async (_req, res) => {
  try {
    console.log('🔄 ML retraining initiated by admin');
    
    // Import ML service
    const { mlAdvancedService } = await import('../ml/services/mlAdvancedService');
    const mlService = mlAdvancedService;
    
    // Actually retrain models
    const trainingResult = await mlService.trainModelsWithSyntheticData();
    
    if (trainingResult.success) {
      console.log('✅ ML models retrained successfully');
      res.json({
        success: true,
        data: { 
          message: 'ML models retrained successfully',
          details: trainingResult.details
        }
      });
    } else {
      console.error('❌ ML retraining failed:', trainingResult.error);
      res.status(500).json({
        success: false,
        error: { message: trainingResult.error || 'ML retraining failed' }
      });
    }
  } catch (error) {
    console.error('❌ ML retraining error:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: 'Failed to retrain ML models' } 
    });
  }
});

// Helper functions for backup data generation
const generateSystemCSVData = (data: any) => {
  const lines = [];
  
  // System Summary
  lines.push('=== SYSTEM SUMMARY ===');
  lines.push(`Total Users,${data.totalUsers}`);
  lines.push(`Total Habits,${data.totalHabits}`);
  lines.push(`Total Completions,${data.totalCompletions}`);
  lines.push(`Total Streaks,${data.totalStreaks}`);
  lines.push(`Export Date,${data.exportedAt}`);
  lines.push('');
  
  // Users
  lines.push('=== USERS ===');
  lines.push('ID,Email,First Name,Last Name,Level,XP,Role,Created At');
  data.users.forEach((user: any) => {
    lines.push(`${user.id},${user.email},${user.firstName},${user.lastName},${user.level},${user.xp},${user.role},${user.createdAt}`);
  });
  lines.push('');
  
  // Habits
  lines.push('=== HABITS ===');
  lines.push('ID,User ID,Title,Description,Frequency,Difficulty,Created At');
  data.habits.forEach((habit: any) => {
    lines.push(`${habit.id},${habit.userId},${habit.title},${habit.description},${habit.frequency},${habit.difficulty || 'N/A'},${habit.createdAt}`);
  });
  
  return lines.join('\n');
};

const generateSystemExcelData = (data: any) => {
  // For now, return CSV format as Excel is more complex
  return generateSystemCSVData(data);
};

const generateUserCSVData = (data: any) => {
  const lines = [];
  
  // User Summary
  lines.push('=== USER SUMMARY ===');
  lines.push(`User ID,${data.user.id}`);
  lines.push(`Email,${data.user.email}`);
  lines.push(`Name,${data.user.firstName} ${data.user.lastName}`);
  lines.push(`Level,${data.user.level}`);
  lines.push(`XP,${data.user.xp}`);
  lines.push(`Total Habits,${data.totalHabits}`);
  lines.push(`Total Completions,${data.totalCompletions}`);
  lines.push(`Total Streaks,${data.totalStreaks}`);
  lines.push(`Export Date,${data.exportedAt}`);
  lines.push('');
  
  // Habits
  lines.push('=== HABITS ===');
  lines.push('ID,Title,Description,Frequency,Difficulty,Created At');
  data.habits.forEach((habit: any) => {
    lines.push(`${habit.id},${habit.title},${habit.description},${habit.frequency},${habit.difficulty || 'N/A'},${habit.createdAt}`);
  });
  lines.push('');
  
  // Completions
  lines.push('=== COMPLETIONS ===');
  lines.push('ID,Habit ID,Completed At,Value');
  data.completions.forEach((completion: any) => {
    lines.push(`${completion.id},${completion.habitId},${completion.completedAt},${completion.value}`);
  });
  
  return lines.join('\n');
};

const generateUserExcelData = (data: any) => {
  // For now, return CSV format as Excel is more complex
  return generateUserCSVData(data);
};

// Admin backup endpoints
router.get('/backup/system', requireAdmin, async (req: any, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    // Get all system data
    const allUsers = await storage.getAllUsers();
    
    // For now, we'll get user-specific data and aggregate
    const allHabits = [];
    const allCompletions = [];
    const allStreaks = [];
    
    for (const user of allUsers) {
      const userHabits = await storage.getUserHabits(user.id);
      const userCompletions = await storage.getHabitCompletions(user.id);
      const userStreaks = await storage.getUserStreaks(user.id);
      
      allHabits.push(...userHabits);
      allCompletions.push(...userCompletions);
      allStreaks.push(...userStreaks);
    }

    const data = {
      users: allUsers,
      habits: allHabits,
      completions: allCompletions,
      streaks: allStreaks,
      totalUsers: allUsers.length,
      totalHabits: allHabits.length,
      totalCompletions: allCompletions.length,
      totalStreaks: allStreaks.length,
      exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      const csvData = generateSystemCSVData(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="habitloop-system-backup-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvData);
    } else if (format === 'excel') {
      const excelData = generateSystemExcelData(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="habitloop-system-backup-${new Date().toISOString().split('T')[0]}.xlsx"`);
      return res.send(excelData);
    } else {
      res.json({
        success: true,
        data
      });
    }
    } catch (error) {
    console.error('System backup error:', error);
      res.status(500).json({
        success: false,
      error: 'Backup failed',
      message: 'An error occurred while creating system backup'
      });
    }
  });

router.get('/backup/user/:userId', requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { format = 'csv' } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId',
        message: 'userId is required'
      });
    }

    // Get user-specific data
    const userData = await storage.getUser(userId);
    const habitsData = await storage.getUserHabits(userId);
    const completionsData = await storage.getHabitCompletions(userId);
    const streaksData = await storage.getUserStreaks(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    const data = {
      user: userData,
      habits: habitsData,
      completions: completionsData,
      streaks: streaksData,
      totalHabits: habitsData.length,
      totalCompletions: completionsData.length,
      totalStreaks: streaksData.length,
      exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      const csvData = generateUserCSVData(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="habitloop-user-${userId}-backup-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvData);
    } else if (format === 'excel') {
      const excelData = generateUserExcelData(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="habitloop-user-${userId}-backup-${new Date().toISOString().split('T')[0]}.xlsx"`);
      return res.send(excelData);
    } else {
      res.json({
        success: true,
        data
      });
    }
  } catch (error) {
    console.error('User backup error:', error);
    res.status(500).json({
      success: false,
      error: 'Backup failed',
      message: 'An error occurred while creating user backup'
    });
  }
});

export { router as adminRoutes };
