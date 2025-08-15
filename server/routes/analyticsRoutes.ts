
import { Router, Request, Response } from "express";
import { requireAuth } from "./middlewareRoutes";
import { storage } from "../storage";
import { calculateTotalXP, getXPSummary, type CompletionData } from "../utils/xpCalculator.js";

export function analyticsRoutes() {
  const router = Router();

  // Get fair XP calculation for user
  router.get('/xp-calculation', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get user's habits and completions
      const habits = await storage.getUserHabits(userId);
      const allCompletions = await storage.getHabitCompletions(userId);

      // Group completions by habit
      const habitsData = habits.map(habit => {
        const habitCompletions = allCompletions.filter(c => c.habitId === habit.id);
        return {
          habitId: habit.id,
          habitTitle: habit.title,
          completions: habitCompletions.map(c => ({
            id: c.id,
            habitId: c.habitId,
            userId: c.userId,
            completedAt: c.completedAt,
            value: c.value || 1,
            createdAt: c.createdAt?.toISOString() || new Date().toISOString(),
          })) as CompletionData[],
        };
      });

      // Calculate fair XP
      const xpCalculation = calculateTotalXP(habitsData);
      const xpSummary = getXPSummary(xpCalculation);

      // Get current user data for comparison
      const user = await storage.getUser(userId);
      const currentXP = user?.xp || 0;
      const currentLevel = user?.level || 1;

      res.json({
        success: true,
        data: {
          calculation: xpCalculation,
          summary: xpSummary,
          current: {
            xp: currentXP,
            level: currentLevel,
            xpToNextLevel: 100 - (currentXP % 100),
          },
          discrepancy: {
            calculated: xpSummary.totalXP,
            current: currentXP,
            difference: xpSummary.totalXP - currentXP,
            percentage: currentXP > 0 ? Math.round(((xpSummary.totalXP - currentXP) / currentXP) * 100) : 0,
          },
        },
      });
    } catch (error) {
      console.error("Error calculating XP:", error);
      res.status(500).json({ error: "Failed to calculate XP" });
    }
  });

  // Get user streaks summary
  router.get('/streaks', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const habits = await storage.getUserHabits(userId);
      const allCompletions = await storage.getHabitCompletions(userId);
      const userStreaks = await storage.getUserStreaks(userId);

      // Calculate current streak for each habit
      const streaksData = habits.map(habit => {
        const habitCompletions = allCompletions.filter(c => c.habitId === habit.id);
        const streak = userStreaks.find(s => s.habitId === habit.id);
        
        return {
          habitId: habit.id,
          habitTitle: habit.title,
          currentStreak: streak?.currentStreak || 0,
          longestStreak: streak?.longestStreak || 0,
          lastCompletedAt: streak?.lastCompletedAt,
          totalCompletions: habitCompletions.length,
        };
      });

      // Calculate overall stats
      const totalCurrentStreak = Math.max(...streaksData.map(s => s.currentStreak));
      const totalLongestStreak = Math.max(...streaksData.map(s => s.longestStreak));
      const activeHabits = habits.filter(h => h.isActive).length;
      const habitsWithStreaks = streaksData.filter(s => s.currentStreak > 0).length;

      res.json({
        success: true,
        data: {
          habits: streaksData,
          summary: {
            totalCurrentStreak,
            totalLongestStreak,
            activeHabits,
            habitsWithStreaks,
            averageCurrentStreak: Math.round(streaksData.reduce((sum, s) => sum + s.currentStreak, 0) / activeHabits),
            averageLongestStreak: Math.round(streaksData.reduce((sum, s) => sum + s.longestStreak, 0) / activeHabits),
          },
        },
      });
    } catch (error) {
      console.error("Error getting streaks:", error);
      res.status(500).json({ error: "Failed to get streaks" });
    }
  });

  // Audit and fix XP inconsistencies
  router.post('/audit-xp', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          error: 'User not authenticated' 
        });
      }

      console.log(`🔍 Starting XP audit for user: ${userId}`);

      const auditResult = await storage.auditAndFixUserXP(userId);
      
      console.log(`🔍 XP audit completed for user ${userId}:`, auditResult);
      
      res.json({
        success: true,
        auditResult,
        message: auditResult.fixed 
          ? `XP inconsistency fixed: ${auditResult.oldXP} → ${auditResult.newXP} XP, Level ${auditResult.oldLevel} → ${auditResult.newLevel}`
          : 'No XP inconsistencies found'
      });
    } catch (error) {
      console.error('XP audit error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to audit XP',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Audit and fix XP inconsistencies (guest-compatible)
  router.post('/audit-xp-guest', async (req: Request, res: Response) => {
    try {
      // Try to get user ID from various sources
      let userId = req.user?.id;
      
      // If no user in session, try to get from guest token
      if (!userId) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
          try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
            userId = decoded.userId;
          } catch (error) {
            console.warn('Failed to decode JWT token:', error);
          }
        }
      }
      
      // Fallback to user-001 for testing
      if (!userId) {
        userId = 'user-001';
        console.log('🔍 Using fallback user ID for XP audit');
      }

      console.log(`🔍 Starting XP audit for user: ${userId}`);

      const auditResult = await storage.auditAndFixUserXP(userId);
      
      console.log(`🔍 XP audit completed for user ${userId}:`, auditResult);
      
      res.json({
        success: true,
        auditResult,
        message: auditResult.fixed 
          ? `XP inconsistency fixed: ${auditResult.oldXP} → ${auditResult.newXP} XP, Level ${auditResult.oldLevel} → ${auditResult.newLevel}`
          : 'No XP inconsistencies found'
      });
    } catch (error) {
      console.error('XP audit error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to audit XP',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
