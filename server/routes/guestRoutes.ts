
import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertHabitSchema, insertHabitCompletionSchema } from "../../shared/schema";
import { fromZodError } from "zod-validation-error";

export function guestRoutes() {
  const router = Router();

  // Get guest habits
  router.get('/habits/:guestId', async (req, res) => {
    try {
      const guestId = req.params.guestId;
      const habits = await storage.getUserHabits(guestId);
      res.json(habits);
    } catch (error) {
      console.error("Error fetching guest habits:", error);
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  // Create guest habit
  router.post('/habits/:guestId', async (req, res) => {
    try {
      const guestId = req.params.guestId;
      const habitData = insertHabitSchema.parse({ ...req.body, userId: guestId });
      const habit = await storage.createHabit(habitData);
      res.json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      console.error("Error creating guest habit:", error);
      res.status(500).json({ message: "Failed to create habit" });
    }
  });

  // Create guest completion
  router.post('/completions/:guestId', async (req, res) => {
    try {
      const guestId = req.params.guestId;
      const completionData = insertHabitCompletionSchema.parse({ ...req.body, userId: guestId });
      const completion = await storage.createHabitCompletion(completionData);
      res.json(completion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      console.error("Error creating guest completion:", error);
      res.status(500).json({ message: "Failed to create completion" });
    }
  });

  return router;
}
