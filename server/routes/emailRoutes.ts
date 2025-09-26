// server/routes/emailRoutes.ts
import express from 'express';
import { EmailService } from '../services/emailService';
import { requireAuth } from './middlewareRoutes';
import { storage } from '../storage';

const router = express.Router();

// Connect email (for SendGrid integration)
router.post('/connect', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    // For SendGrid integration, we just need to confirm the user's email is available
    const user = await storage.getUser(userId);
    if (!user?.email) {
      return res.status(400).json({ 
        success: false, 
        error: 'User email not found' 
      });
    }

    // Standard email connection for all users
    res.json({ 
      success: true, 
      message: 'Email connected successfully',
      email: user.email,
      provider: 'sendgrid',
                    note: 'All emails will be sent from habitloop-report@em6056.techversehublk.site (domain authenticated)'
    });
  } catch (error) {
    console.error('Email connect error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Send habit reminder
router.post('/send-reminder', requireAuth, async (req, res) => {
  try {
    const { email, habitName } = req.body;
    
    if (!email || !habitName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and habit name are required' 
      });
    }

    const result = await EmailService.sendHabitReminder(email, habitName);
    
    if (result.success) {
      res.json({ success: true, message: 'Reminder sent successfully' });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send reminder' 
      });
    }
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Send weekly report
router.post('/send-report', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    // Get user stats for the report
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const habits = await storage.getUserHabits(userId);
    const completions = await storage.getHabitCompletions(userId);
    const user = await storage.getUser(userId);

    // Calculate current streak from streaks table
    const streaks = await storage.getUserStreaks(userId);
    const currentStreak = streaks.length > 0 ? Math.max(...streaks.map((s: any) => s.currentStreak || 0)) : 0;
    
    const stats = {
      totalHabits: habits.length,
      totalCompletions: completions.length,
      currentStreak: currentStreak,
      level: user?.level || 1,
      xp: user?.xp || 0,
      longestStreak: 0, // Will be calculated by AI service if needed
      recentHabits: habits.slice(-5).map(h => ({
        title: h.title,
        category: h.category,
        completed: completions.some(c => c.habitId === h.id && c.completedAt)
      })),
      // Add user-specific data for better personalization
      difficulty: user?.difficulty || 'medium',
      role: user?.role || 'habitloop_user',
      emailSettings: user?.emailSettings || {}
    };

    const result = await EmailService.sendWeeklyReport(email, stats, user);
    
    if (result.success) {
      res.json({ success: true, message: 'Weekly report sent successfully' });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send weekly report' 
      });
    }
  } catch (error) {
    console.error('Send report error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Send test email
router.post('/test', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    // Get user's email from their profile
    const user = await storage.getUser(userId);
    if (!user?.email) {
      return res.status(400).json({ 
        success: false, 
        error: 'User email not found in profile' 
      });
    }

    // Allow override from request body if provided
    const email = req.body.email || user.email;

    // Fetch real user statistics for the test email with error handling
    let habits: any[] = [];
    let completions: any[] = [];
    let streaks: any[] = [];
    
    try {
      habits = await storage.getUserHabits(userId) || [];
      completions = await storage.getHabitCompletions(userId) || [];
      streaks = await storage.getUserStreaks(userId) || [];
    } catch (error) {
      console.log('⚠️ Error fetching user statistics for email, using defaults:', (error as Error).message);
      // Continue with empty arrays if there's an error
    }
    
    // Calculate real statistics
    const totalHabits = habits.length;
    const totalCompletions = completions.length;
    const currentStreak = streaks.length > 0 ? Math.max(...streaks.map(s => s.currentStreak)) : 0;
    const longestStreak = streaks.length > 0 ? Math.max(...streaks.map(s => s.longestStreak)) : 0;
    const completionRate = totalHabits > 0 ? Math.round((totalCompletions / (totalHabits * 7)) * 100) : 0; // Rough weekly estimate
    
    // Create enhanced user data with real statistics
    const enhancedUserData = {
      ...user,
      totalHabits,
      totalCompletions,
      currentStreak,
      longestStreak,
      completionRate,
      recentHabits: habits.slice(0, 3).map(h => h.title) // Last 3 habits
    };

    const result = await EmailService.sendTestEmail(email, enhancedUserData);
    
    if (result.success) {
      res.json({ success: true, message: 'Test email sent successfully' });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send test email' 
      });
    }
  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Send motivational message
router.post('/motivation', requireAuth, async (req, res) => {
  try {
    const { email, message } = req.body;
    
    if (!email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and message are required' 
      });
    }

    const result = await EmailService.sendMotivationalMessage(email, message);
    
    if (result.success) {
      res.json({ success: true, message: 'Motivational message sent successfully' });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send motivational message' 
      });
    }
  } catch (error) {
    console.error('Send motivation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get email status (for frontend to check if email is connected)
router.get('/status', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // For now, return a simple status
    // In a real implementation, you might check if the user has connected their email
    res.json({
      connected: !!user?.email,
      email: user?.email || null,
      provider: 'sendgrid'
    });
  } catch (error) {
    console.error('Get email status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get email settings
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // Return user's email settings
    res.json({
      dailyReminders: true,
      weeklyProgress: true,
      aiInsights: true,
      streakMilestones: true,
      motivationalMessages: true,
      ...user?.emailSettings
    });
  } catch (error) {
    console.error('Get email settings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update email settings
router.put('/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const settings = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    // Update user's email settings
    await storage.updateEmailSettings(userId, settings);
    
    res.json({ success: true, message: 'Email settings updated successfully' });
  } catch (error) {
    console.error('Update email settings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
