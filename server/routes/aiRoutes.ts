// server/routes/aiRoutes.ts
import express from "express";
import {
  generateServiceInsight,
  getAvailableServices,
} from "../services/aiCoachService";
import { requireAuth } from "./middlewareRoutes";
import { Habit } from "@shared/schema";
import { questionnaireSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { storage } from "../storage";
import {
  generateHabitRecommendations,
  generatePersonalizedInsight,
  generateAIRecommendations,
} from "../openaiService";

const router = express.Router();

// Get user ID - handles both authenticated and unauthenticated requests
const getUserId = (req: express.Request) => {
  if (req.user?.id && !req.user?.isGuest) {
    return req.user.id; // Authenticated user
  }
  // For unauthenticated requests, return guest user
  return "guest-demo-user"; // Fallback to guest
};

// Questionnaire endpoint - requires authentication
router.post("/questionnaire", requireAuth, async (req, res) => {
  try {
    console.log(
      "Received questionnaire data:",
      JSON.stringify(req.body, null, 2)
    );

    const questionnaire = questionnaireSchema.parse(req.body);
    console.log(
      "Parsed questionnaire:",
      JSON.stringify(questionnaire, null, 2)
    );

    // Get user ID if available (for authenticated users)
    const userId = req.user?.id || null;

    // Save questionnaire data to database if user is authenticated
    if (userId && !req.user?.isGuest) {
      try {
        await storage.saveQuestionnaire(userId, questionnaire);
        console.log(`Questionnaire saved for user: ${userId}`);
      } catch (dbError) {
        console.error("Error saving questionnaire to database:", dbError);
        // Continue with recommendations even if saving fails
      }
    }

    // Get user context for better AI personalization
    let userContext = null;
    if (userId && !req.user?.isGuest) {
      try {
        const user = await storage.getUser(userId);
        userContext = {
          level: user?.level || 1,
          xp: user?.xp || 0,
          existingHabitsCount: (await storage.getUserHabits(userId)).length,
          completionRate: 75, // Could be calculated from historical data
        };
      } catch (error) {
        console.log("Could not get user context for AI enhancement:", error);
      }
    }

    const recommendations = await generateHabitRecommendations(
      questionnaire,
      userContext
    );
    console.log("Generated recommendations:", recommendations.length);

    // Save recommendations to database if user is authenticated
    if (userId && !req.user?.isGuest) {
      try {
        await storage.saveRecommendations(userId, recommendations);
        console.log(`Recommendations saved for user: ${userId}`);
      } catch (dbError) {
        console.error("Error saving recommendations to database:", dbError);
        // Continue even if saving fails
      }
    }

    res.json({
      recommendations,
      saved: userId ? true : false,
      userId: userId || null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return res.status(400).json({
        message: fromZodError(error).toString(),
        errors: error.errors,
      });
    }
    console.error("Error processing questionnaire:", error);
    res.status(500).json({ message: "Failed to generate recommendations" });
  }
});

// Test endpoint for debugging
router.get("/questionnaire/test", async (_req, res) => {
  try {
    const testQuestionnaire = {
      focusAreas: ["Health & Fitness", "Learning"],
      motivationTime: "morning",
      consistencyRating: 3,
    };

    const recommendations = await generateHabitRecommendations(
      testQuestionnaire
    );
    res.json({
      success: true,
      recommendations,
      testQuestionnaire,
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({ message: "Test failed" });
  }
});

// Get AI insights (no auth required)
router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    const insights = await storage.getAIInsights(userId);
    res.json(insights);
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ message: "Failed to fetch insights" });
  }
});

// Generate AI insights (requires authentication)
router.post("/generate", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure user is not a guest
    if (req.user?.isGuest) {
      return res
        .status(403)
        .json({ message: "Guest users cannot generate insights" });
    }

    console.log(`Generating insight for user: ${userId}`);

    const habits = await storage.getUserHabits(userId);
    const completions = await storage.getHabitCompletions(userId);

    console.log(
      `Found ${habits.length} habits and ${completions.length} completions`
    );

    const insight = await generatePersonalizedInsight(habits, completions);
    console.log("Generated insight:", insight);

    const createdInsight = await storage.createAIInsight(
      userId,
      insight.type,
      insight.title,
      insight.content
    );

    console.log("Created insight in database:", createdInsight.id);

    return res.json({
      insight: insight.content,
      title: insight.title,
      type: insight.type,
      id: createdInsight.id,
    });
  } catch (error) {
    console.error("Error generating insight:", error);

    if (error instanceof Error) {
      return res.status(500).json({
        message: "Failed to generate insight",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } else {
      return res.status(500).json({ message: "Failed to generate insight" });
    }
  }
});

// Mark insight as read (no auth required)
router.put("/:id/read", async (req, res) => {
  try {
    const insightId = parseInt(req.params.id);
    await storage.markInsightAsRead(insightId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking insight as read:", error);
    res.status(500).json({ message: "Failed to mark insight as read" });
  }
});

// Get AI recommendations (no auth required)
router.get("/recommendations", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { recommendationEngine } = await import("../recommendationEngine");
    const recommendations =
      await recommendationEngine.generatePersonalizedRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    res.status(500).json({ message: "Failed to generate recommendations" });
  }
});

// Generate AI recommendations (no auth required)
router.post("/recommendations", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { questionnaireData } = req.body;

    if (!questionnaireData) {
      return res.status(400).json({ error: "Questionnaire data required" });
    }

    const recommendations = await generateAIRecommendations(questionnaireData);
    res.json({
      success: true,
      recommendations,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    res.status(500).json({ message: "Failed to generate recommendations" });
  }
});

// Get available AI Coach services
router.get("/coach/services", requireAuth, async (_req, res) => {
  try {
    const services = getAvailableServices();
    res.json({ services });
  } catch (error) {
    console.error("Error fetching coach services:", error);
    res.status(500).json({ error: "Failed to fetch coach services" });
  }
});

// Generate AI Coach insight with context
router.post("/coach/insight", requireAuth, async (req, res) => {
  try {
    const { serviceId, context } = req.body;

    if (!serviceId) {
      return res.status(400).json({ error: "Service ID is required" });
    }

    if (!context || !context.habits || !context.completions) {
      return res
        .status(400)
        .json({ error: "Context with habits and completions is required" });
    }

    const insight = await generateServiceInsight(serviceId, {
      habits: context.habits,
      completions: context.completions,
      questionnaire: context.questionnaire || {},
      userLevel: context.userLevel || 1,
      totalXP: context.totalXP || 0,
    });

    res.json({ insight });
  } catch (error) {
    console.error("Error generating AI insight:", error);
    res.status(500).json({ error: "Failed to generate AI insight" });
  }
});

// Ask AI coach a question (requires authentication)
router.post("/ask", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure user is not a guest
    if (req.user?.isGuest) {
      return res
        .status(403)
        .json({ message: "Guest users cannot ask coach questions" });
    }

    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ message: "Question is required" });
    }

    console.log(`AI Coach question from user ${userId}: ${question}`);

    const habits = await storage.getUserHabits(userId);
    const completions = await storage.getHabitCompletions(userId);

    console.log(
      `Context: ${habits.length} habits, ${completions.length} completions`
    );

    // Generate personalized response using OpenAI
    const response = await generatePersonalizedInsight(habits, completions);
    console.log("Generated coach response:", response);

    return res.json({
      response: response.content || "I'm here to help with your habit journey!",
      type: "coach_response",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error asking coach question:", error);

    if (error instanceof Error) {
      return res.status(500).json({
        message: "Failed to get coach response",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } else {
      return res.status(500).json({ message: "Failed to get coach response" });
    }
  }
});

// Generate general insights
router.post("/insights/generate", requireAuth, async (req, res) => {
  try {
    const { habits, completions, userLevel, totalXP } = req.body;

    if (!habits || !completions) {
      return res
        .status(400)
        .json({ error: "Habits and completions data required" });
    }

    // Import OpenAI dynamically to avoid circular dependencies
    const { default: OpenAI } = await import("openai");
    const { env } = await import("../env");

    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY || "sk-placeholder-key-for-development",
    });

    // Create a comprehensive prompt with user data
    const prompt = `
As an AI habit coach, analyze this user's data and provide personalized insights:

HABITS: ${habits.map((h: Habit) => `${h.title} (${h.frequency})`).join(", ")}

COMPLETIONS: ${completions.length} total completions
USER LEVEL: ${userLevel || 1}
TOTAL XP: ${totalXP || 0}

Provide a JSON response with:
1. A brief analysis of their habit patterns
2. One specific suggestion for improvement
3. A motivational message
4. A personalized tip

Respond with JSON:
{
  "analysis": "Brief analysis of patterns",
  "suggestion": "One specific improvement",
  "motivation": "Motivational message",
  "tip": "Personalized tip"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI habit coach. Always respond with valid JSON as requested.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const insights = JSON.parse(content);
    res.json({ insights });
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({
      error: "Failed to generate insights",
      fallback:
        "Focus on consistency over perfection. Small daily actions compound into significant results.",
    });
  }
});

export default router;
