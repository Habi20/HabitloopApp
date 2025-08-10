import express from "express";
import { createServer } from "http";
import { setupSession, requireAuth } from "./middlewareRoutes";
import { authRoutes } from "./authRoutes";
import { habitRoutes } from "./habitRoutes";
import { aiRoutes } from "./aiRoutes";
import { mlPredictionRoutes } from "./mlPredictionRoutes";
import { emailRoutes } from "./emailRoutes";
import { adminRoutes } from "./adminRoutes";
import { analyticsRoutes } from "./analyticsRoutes";
import { guestRoutes } from "./guestRoutes";
import { healthRoutes } from "./healthRoutes";
import { storage } from "../storage";
import { env, isOpenAIEnabled } from "../env";

export async function registerRoutes(app: express.Application) {
  setupSession(app);

  // Mount all route modules
  app.use("/api", authRoutes());
  app.use("/api/habits", habitRoutes());
  app.use("/api/ai", aiRoutes());
  app.use("/api/ml", mlPredictionRoutes());
  app.use("/api/email", emailRoutes());
  app.use("/api/guest", guestRoutes());
  app.use("/api/admin", adminRoutes());
  app.use("/api/analytics", analyticsRoutes());
  app.use("/api", healthRoutes());

  // Add missing routes for frontend compatibility
  app.use("/api/completions", completionsRoutes());
  app.use("/api/insights", insightsRoutes());
  app.use("/api/coaching", coachingRoutes());

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
      ],
    });
  });

  // Global error handler - fix unused parameters
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("API Error:", err);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        details: env.nodeEnv === "development" ? err.message : undefined,
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

  // Create completion
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

  return router;
}

// Insights routes
function insightsRoutes() {
  const router = express.Router();

  // Get insights for user
  router.get("/", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "default-user-id";
      const insights = await storage.getAIInsights(userId);

      res.json({
        success: true,
        insights,
        count: insights.length,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch insights";
      console.error("Error fetching insights:", errorMessage);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch insights" },
      });
    }
  });

  return router;
}

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
  router.post("/generate-insight", async (req: any, res) => {
    try {
      const userId = req.user?.id || "default-user-id";

      // Get user's habits and completions for context
      const habits = await storage.getUserHabits(userId);
      const completions = await storage.getHabitCompletions(userId);

      let insight;

      if (isOpenAIEnabled) {
        try {
          const { generatePersonalizedInsight } = await import("../openai");
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
      const userId = req.user?.id || "default-user-id";

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
