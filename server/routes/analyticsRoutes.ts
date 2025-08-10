
import { Router } from "express";
import { requireAuth } from "./middlewareRoutes";
import { storage } from "../storage";

export function analyticsRoutes() {
  const router = Router();

  const getUserId = (req: any) => req.user.id;

  // Get user analytics
  router.get('/dashboard', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getUserHabits(userId);
      const completions = await storage.getHabitCompletions(userId);

      // Calculate analytics
      const totalHabits = habits.length;
      const today = new Date().toISOString().split('T')[0];
      const completedToday = completions.filter(c => 
        c.completedAt?.startsWith(today)
      ).length;

      res.json({
        success: true,
        analytics: {
          totalHabits,
          completedToday,
          completionRate: totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0,
          habits,
          recentCompletions: completions.slice(-7)
        }
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch analytics' }
      });
    }
  });

  return router;
}
