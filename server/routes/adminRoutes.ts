// server/routes/adminRoutes.ts
import { Router } from "express";
import type { Response } from 'express';
import { requireAuth } from "./middlewareRoutes";
import { storage } from "../storage";

export function adminRoutes() {
  const router = Router();

  const getUserId = (req: any) => req.user.id;

  // Admin user management
  router.get('/users', requireAuth, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(getUserId(req));

      // Fix: Handle null role properly with fallback to 'user'
      const userRole = user?.role || 'user';
      
      if (!user || !['admin', 'super_user'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: { message: 'Admin access required' }
        });
      }

      // Implement user management logic
      res.json({
        success: true,
        users: [], // Placeholder - implement user listing
        totalUsers: 0,
        activeUsers: 0
      });
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch users' }
      });
    }
  });

  // Additional admin routes can be added here
  router.get('/stats', requireAuth, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(getUserId(req));
      const userRole = user?.role || 'user';

      if (!user || !['admin', 'super_user'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: { message: 'Admin access required' }
        });
      }

      // Return admin statistics
      res.json({
        success: true,
        stats: {
          totalUsers: 0, // Implement actual stats
          activeHabits: 0,
          completionsToday: 0,
          systemHealth: 'good'
        }
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch stats' }
      });
    }
  });

  return router;
}
