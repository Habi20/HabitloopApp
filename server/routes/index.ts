import express from "express";
import { createServer } from "http";
import { setupSession, requireAuth } from "./middlewareRoutes";
import { authRoutes } from "./authRoutes";
import { habitRoutes } from "./habitRoutes";
import { aiRoutes } from "./aiRoutes";
import { mlPredictionRoutes } from "./mlPredictionRoutes";
import { adminRoutes } from "./adminRoutes";
import { analyticsRoutes } from "./analyticsRoutes";
import { challengeRoutes } from "./challengeRoutes";
import { guestRoutes } from "./guestRoutes";
import { healthRoutes } from "./healthRoutes";
import emailRoutes from "./emailRoutes";
import { storage } from "../storage";
import { env, isOpenAIEnabled } from "../env";

export async function registerRoutes(app: express.Application) {
  setupSession(app);

  // Mount all route modules
  app.use("/api", authRoutes());
  app.use("/api/habits", habitRoutes());
  app.use("/api/ai", aiRoutes());
  app.use("/api/ml", mlPredictionRoutes());
  app.use("/api/email", emailRoutes);
  app.use("/api/guest", guestRoutes());
  app.use("/api/admin", adminRoutes());
  app.use("/api/analytics", analyticsRoutes());
  app.use("/api/challenges", challengeRoutes());
  app.use("/api/health", healthRoutes());

  // Add missing routes for frontend compatibility
  app.use("/api/completions", completionsRoutes());
  app.use("/api/coaching", coachingRoutes());
  
  // Mount AI insights routes under /api/insights for frontend compatibility
  app.use("/api/insights", aiRoutes());
  
  // Mount AI coach routes under /api/coach for frontend compatibility
  app.use("/api/coach", aiRoutes());

  // Catch-all route for undefined paths (moved from index.ts)
  app.get("*", (_req, res) => {
    res.status(404).json({
      error: "Route not found",
      message: "Backend API running - Frontend disabled for testing",
      available_routes: [
        "/",
        "/api/ml/*",
        "/api/auth/*",
        "/api/habits/*",
        "/api/admin/*",
        "/api/completions/*",
        "/api/insights/*",
        "/api/coaching/*",
        "/api/ai/*",
        "/api/email/*",
        "/api/guest/*",
        "/api/analytics/*",
        "/api/challenges/*",
      ],
    });
  });

  // Global error handler - fix unused parameters
  app.use((err: any, _req: any, res: any) => {
    console.error("API Error:", err);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        details: env.NODE_ENV === "development" ? err.message : undefined,
      },
    });
  });

  return createServer(app);
}

// Completions routes
function completionsRoutes() {
  const router = express.Router();

  // Get completions for user
  router.get("/", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "default-user-id";
      const { date } = req.query;

      const completions = await storage.getHabitCompletions(userId, date);

      res.json({
        success: true,
        completions,
        count: completions.length,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch completions";
      console.error("Error fetching completions:", errorMessage);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch completions" },
      });
    }
  });

  // Get daily habit status (new endpoint)
  router.get("/daily-status", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "default-user-id";
      const { getDailyHabitStatus } = await import("../utils/habitCompletionManager.js");
      
      const dailyStatus = await getDailyHabitStatus(userId);

      res.json({
        success: true,
        data: dailyStatus,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch daily status";
      console.error("Error fetching daily status:", errorMessage);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch daily status" },
      });
    }
  });

  // Complete habit (enhanced)
  router.post("/complete", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "default-user-id";
      const { habitId, value = 1 } = req.body;
      const { completeHabit } = await import("../utils/habitCompletionManager.js");

      const result = await completeHabit(habitId, userId, value);

      res.json({
        success: result.success,
        data: result,
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

  // Uncomplete habit (enhanced)
  router.post("/uncomplete", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "default-user-id";
      const { habitId } = req.body;
      const { uncompleteHabit } = await import("../utils/habitCompletionManager.js");

      const result = await uncompleteHabit(habitId, userId);

      // If the operation was successful, return success even if there were minor issues
      if (result.success) {
        res.json({
          success: true,
          data: result,
        });
      } else {
        // Operation failed due to business logic (e.g., can't uncomplete after 24 hours)
        res.status(400).json({
          success: false,
          error: { message: result.message },
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to uncomplete habit";
      console.error("Error uncompleting habit:", errorMessage);
      
      // Check if the completion was actually deleted despite the error
      // This handles the case where the main operation succeeded but there was a minor error
      try {
        const userId = req.user?.id || "default-user-id";
        const { habitId } = req.body;
        const today = new Date().toISOString().split('T')[0]; // Get today's date
        
        // Check if completion still exists
        const completions = await storage.getHabitCompletions(userId, today);
        const completionExists = completions.some((c: any) => c.habitId === habitId);
        
        if (!completionExists) {
          // Completion was successfully deleted, return success
          res.json({
            success: true,
            data: {
              success: true,
              message: "Habit uncompleted successfully",
              xpLost: 0
            },
          });
          return;
        }
      } catch (checkError) {
        // Ignore check errors and proceed with original error
      }
      
      res.status(500).json({
        success: false,
        error: { message: "Failed to uncomplete habit" },
      });
    }
  });

  // Create completion (legacy - for backward compatibility)
  router.post("/", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "default-user-id";
      const completionData = { ...req.body, userId };

      const completion = await storage.createHabitCompletion(completionData);

      res.status(201).json({
        success: true,
        completion,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create completion";
      console.error("Error creating completion:", errorMessage);
      res.status(500).json({
        success: false,
        error: { message: "Failed to create completion" },
      });
    }
  });

  // Delete completion (for uncompleting habits)
  router.delete("/:habitId/:date", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "default-user-id";
      const habitId = parseInt(req.params.habitId);
      const date = req.params.date;

      await storage.deleteHabitCompletion(habitId, userId, date);

      res.json({
        success: true,
        message: "Completion deleted successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete completion";
      console.error("Error deleting completion:", errorMessage);
      res.status(500).json({
        success: false,
        error: { message: "Failed to delete completion" },
      });
    }
  });

  return router;
}

// Insights routes - REMOVED: Using AI routes instead
// function insightsRoutes() {
//   const router = express.Router();
//   // Get insights for user
//   router.get("/", requireAuth, async (req: any, res) => {
//     try {
//       const userId = req.user?.id || "default-user-id";
//       const insights = await storage.getAIInsights(userId);
//       res.json({
//         success: true,
//         insights,
//         count: insights.length,
//       });
//     } catch (error: unknown) {
//       const errorMessage =
//         error instanceof Error ? error.message : "Failed to fetch insights";
//       console.error("Error fetching insights:", errorMessage);
//       res.status(500).json({
//         success: false,
//         error: { message: "Failed to fetch insights" },
//       });
//     }
//   });
//   return router;
// }

// Coaching routes
function coachingRoutes() {
  const router = express.Router();

  // Get coaching messages
  router.get("/messages", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "default-user-id";

      // Get coaching messages from database
      const messages = await storage.getCoachingMessages(userId, 10);

      // If no messages exist, generate some mock messages for demo
      if (messages.length === 0) {
        const mockMessages = [
          {
            id: 1,
            type: "motivation",
            title: "Great Progress!",
            content:
              "You're doing amazing with your habits. Keep up the great work!",
            timestamp: new Date().toISOString(),
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            type: "tip",
            title: "Habit Stacking Tip",
            content:
              "Try stacking your new habit with an existing one for better consistency.",
            timestamp: new Date().toISOString(),
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ];

        res.json({
          success: true,
          messages: mockMessages,
          count: mockMessages.length,
        });
      } else {
        // Map database messages to expected format
        const mappedMessages = messages.map((msg) => ({
          id: msg.id,
          type: msg.messageType,
          title: msg.title,
          content: msg.content,
          timestamp: msg.createdAt?.toISOString(),
          isRead: msg.isRead,
          createdAt: msg.createdAt?.toISOString(),
          triggerData: msg.triggerData,
        }));

        res.json({
          success: true,
          messages: mappedMessages,
          count: mappedMessages.length,
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch coaching messages";
      console.error("Error fetching coaching messages:", errorMessage);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch coaching messages" },
      });
    }
  });

  // Generate new coaching insight
  router.post("/generate-insight", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Ensure user is not a guest
      if (req.user?.isGuest) {
        return res.status(403).json({ message: "Guest users cannot generate coaching insights" });
      }

      // Get user's habits and completions for context
      const habits = await storage.getUserHabits(userId);
      const completions = await storage.getHabitCompletions(userId);

      let insight;

      if (isOpenAIEnabled) {
        try {
          const { generatePersonalizedInsight } = await import("../openaiService");
          insight = await generatePersonalizedInsight(habits, completions);
        } catch (error) {
          console.error("Failed to generate AI coaching insight:", error);
          // Fallback insight
          insight = {
            title: "Great Progress!",
            content:
              "You're doing amazing with your habits. Keep up the great work!",
            type: "motivation",
          };
        }
      } else {
        // Mock insight when OpenAI is not available
        insight = {
          title: "Habit Stacking Tip",
          content:
            "Try stacking your new habit with an existing one for better consistency. This technique can significantly improve your success rate!",
          type: "tip",
        };
      }

      // Create a new coaching message in the database
      const newMessage = await storage.createCoachingMessage({
        userId,
        habitId: null,
        messageType: insight.type || "motivation",
        title: insight.title || "New Insight",
        content:
          insight.content ||
          "Here's some personalized guidance for your habit journey.",
        triggerData: null,
        isRead: false,
      });

      res.json({
        success: true,
        message: {
          id: newMessage.id,
          type: newMessage.messageType,
          title: newMessage.title,
          content: newMessage.content,
          timestamp: newMessage.createdAt?.toISOString(),
          isRead: newMessage.isRead,
          createdAt: newMessage.createdAt?.toISOString(),
        },
        insight: insight,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate coaching insight";
      console.error("Error generating coaching insight:", errorMessage);
      res.status(500).json({
        success: false,
        error: { message: "Failed to generate coaching insight" },
      });
    }
  });

  // Mark coaching message as read
  router.put("/messages/:id/read", async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);
      // const userId = req.user?.id || "default-user-id"; // Not needed for this operation

      // Mark the message as read in the database
      await storage.markCoachingMessageAsRead(messageId);

      res.json({
        success: true,
        message: `Message ${messageId} marked as read`,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to mark message as read";
      console.error("Error marking message as read:", errorMessage);
      res.status(500).json({
        success: false,
        error: { message: "Failed to mark message as read" },
      });
    }
  });

  return router;
}