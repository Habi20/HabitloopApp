
import { Router, Request, Response } from "express";
import { requireAuth } from "./middlewareRoutes";
import { storage } from "../storage";
import { typedEnv } from "../env";
// Removed XPCalculator import - now using HabitCompletionManager logic directly

export function analyticsRoutes() {
  const router = Router();

  // Get fair XP calculation for user
  router.get('/xp-calculation', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Force fresh database query to bypass any caching
      const freshUser = await storage.getUser(userId);
      if (!freshUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's habits, completions, and streaks
      const habits = await storage.getUserHabits(userId);
      const allCompletions = await storage.getHabitCompletions(userId);
      const userStreaks = await storage.getUserStreaks(userId);

      // Use HabitCompletionManager logic (same as audit script)
      const BASE_XP = 10;
      const STREAK_BONUS_PER_DAY = 2;
      const MAX_STREAK_BONUS = 20;
      
      // Group completions by habit and calculate XP using historical streaks
      const habitsData = habits.map(habit => {
        const habitCompletions = allCompletions.filter(c => c.habitId === habit.id);
        
        // Sort completions by date to calculate historical streaks
        habitCompletions.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
        
        let historicalStreak = 0;
        let totalHabitXP = 0;
        
        // Calculate XP for each completion using historical streak at that time
        const completionDetails = habitCompletions.map((completion, index) => {
          // Calculate streak at the time of this completion
          if (index === 0) {
            historicalStreak = 1; // First completion starts streak
          } else {
            const prevCompletion = habitCompletions[index - 1];
            const daysDiff = Math.floor(
              (new Date(completion.completedAt).getTime() - new Date(prevCompletion.completedAt).getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysDiff === 1) {
              historicalStreak++; // Consecutive day
            } else if (daysDiff === 0) {
              // Same day completion, keep same streak
            } else {
              historicalStreak = 1; // Reset streak
            }
          }
          
          // Calculate XP for this completion using historical streak
          const streakBonus = Math.min(historicalStreak * STREAK_BONUS_PER_DAY, MAX_STREAK_BONUS);
          const xpEarned = BASE_XP + streakBonus;
          totalHabitXP += xpEarned;
          
          return {
            completionId: completion.id,
            completedAt: completion.completedAt,
            streakAtCompletion: historicalStreak,
            xpEarned,
          };
        });
        
        const currentStreak = userStreaks.find(s => s.habitId === habit.id)?.currentStreak || 0;
        
        return {
          habitId: habit.id,
          habitTitle: habit.title,
          completions: habitCompletions.length,
          maxStreak: currentStreak,
          totalHabitXP,
          completionDetails,
        };
      });
      
      // Calculate total XP
      const totalXP = habitsData.reduce((sum, habit) => sum + habit.totalHabitXP, 0);
      
      // Create summary
      const totalCompletions = habitsData.reduce((sum, habit) => sum + habit.completions, 0);
      const maxStreak = Math.max(...habitsData.map(h => h.maxStreak));
      const averageXPPerCompletion = totalCompletions > 0 ? totalXP / totalCompletions : 0;
      
      const xpSummary = {
        totalXP,
        totalCompletions,
        averageXPPerCompletion: Math.round(averageXPPerCompletion),
        maxStreak,
        habitCount: habitsData.length,
      };

      // Use fresh user data (bypassing any caching)
      const currentXP = freshUser.xp || 0;
      const currentLevel = freshUser.level || 1;
      
      // Log for debugging
      console.log('🔍 XP Calculation API - User ID: ' + userId);
      console.log('🔍 XP Calculation API - Fresh Database XP: ' + currentXP + ', Level: ' + currentLevel);
      console.log('🔍 XP Calculation API - Calculated XP: ' + xpSummary.totalXP);

      res.json({
        success: true,
        data: {
          calculation: {
            totalXP,
            breakdown: habitsData,
          },
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
            const decoded = jwt.verify(token, typedEnv.jwtSecret) as any;
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
