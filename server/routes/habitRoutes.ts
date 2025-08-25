// server/routes/habitRoutes.ts - Enhanced version
import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertHabitSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { validateHabitInput, requireAuth } from "./middlewareRoutes";
import { TimezoneUtils } from "../utils/timezone.js";

export function habitRoutes() {
  const router = Router();

  // Get authenticated user ID
  const getUserId = (req: any) => {
    return req.user?.id || "default-user-id";
  };

  // Get all habits for user (requires auth)
  router.get("/", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);

      const habits = await storage.getUserHabits(userId);

      res.json({
        success: true,
        habits,
        count: habits.length,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch habits";
      console.error("Error fetching habits:", errorMessage, {
        error: error,
      });

      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch habits",
          details:
            process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
      });
    }
  });

  // Create new habit (requires auth)
  router.post("/", requireAuth, validateHabitInput, async (req: any, res) => {
    try {
      const userId = getUserId(req);

      console.log("Creating habit for user:", userId, "with data:", req.body);

      const habitData = insertHabitSchema.parse({ ...req.body, userId });
      const habit = await storage.createHabit(habitData);

      res.status(201).json({
        success: true,
        habit,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { message: fromZodError(error).toString() },
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : "Failed to create habit";
      console.error("Error creating habit:", errorMessage, {
        requestBody: req.body,
        error: error,
      });

      res.status(500).json({
        success: false,
        error: {
          message: "Failed to create habit",
          details:
            process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
      });
    }
  });

  // Rest of your routes remain the same...
  router.put("/:id", async (req: any, res) => {
    try {
      const habitId = parseInt(req.params.id);
      const updates = insertHabitSchema.partial().parse(req.body);
      const habit = await storage.updateHabit(habitId, updates);

      res.json({
        success: true,
        habit,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { message: fromZodError(error).toString() },
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : "Failed to update habit";
      console.error("Error updating habit:", errorMessage);
      res.status(500).json({
        success: false,
        error: { message: "Failed to update habit" },
      });
    }
  });

  router.delete("/:id", async (req: any, res) => {
    try {
      const habitId = parseInt(req.params.id);
      await storage.deleteHabit(habitId);

      res.json({
        success: true,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete habit";
      console.error("Error deleting habit:", errorMessage);
      res.status(500).json({
        success: false,
        error: { message: "Failed to delete habit" },
      });
    }
  });

  router.post("/:id/complete", async (req: any, res) => {
    try {
      const habitId = parseInt(req.params.id);
      const { value = 1, date } = req.body;

      if (isNaN(habitId)) {
        return res.status(400).json({
          success: false,
          error: { message: "Invalid habit ID" },
        });
      }

      const userId = await getUserId(req);
      const completion = await storage.createHabitCompletion({
        habitId,
        userId,
        value,
        completedAt: date || TimezoneUtils.getCurrentDateString(),
      });

      const currentStreak = await storage.getStreak(habitId, userId);
      await storage.updateStreak(
        habitId,
        userId,
        (currentStreak?.currentStreak || 0) + 1,
        Math.max(
          currentStreak?.longestStreak || 0,
          (currentStreak?.currentStreak || 0) + 1
        ),
        date || TimezoneUtils.getCurrentDateString()
      );

      // Check and award challenge XP after habit completion
      try {
        await storage.checkAndAwardChallenges(userId);
      } catch (error) {
        console.warn('Failed to check challenges:', error);
        // Don't fail the completion if challenge check fails
      }

      res.json({
        success: true,
        completion,
        streak: {
          current: (currentStreak?.currentStreak || 0) + 1,
          longest: Math.max(
            currentStreak?.longestStreak || 0,
            (currentStreak?.currentStreak || 0) + 1
          ),
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to complete habit";
      console.error("Error completing habit:", errorMessage);
      res.status(500).json({
        success: false,
        error: { message: "Failed to complete habit" },
      });
    }
  });

  return router;
}
