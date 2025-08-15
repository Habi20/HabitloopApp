// server/routes/aiRoutes.ts
import { Router, Request, Response } from "express";
import {
  generateHabitRecommendations,
  generatePersonalizedInsight,
  generateAIRecommendations
} from "../openaiService";
import { questionnaireSchema } from "../../shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { storage } from "../storage";
import { requireAuth } from "./middlewareRoutes";
// import {env} from "../env"; // Unused import

export function aiRoutes() {
  const router = Router();

  // Get user ID - handles both authenticated and unauthenticated requests
  const getUserId = (req: Request) => {
    if (req.user?.id && !req.user?.isGuest) {
      return req.user.id; // Authenticated user
    }
    // For unauthenticated requests, return guest user
    return 'guest-demo-user'; // Fallback to guest
  };

  // Public questionnaire endpoint
  router.post('/questionnaire', async (req: Request, res: Response) => {
    try {
      console.log("Received questionnaire data:", JSON.stringify(req.body, null, 2));
      
      const questionnaire = questionnaireSchema.parse(req.body);
      console.log("Parsed questionnaire:", JSON.stringify(questionnaire, null, 2));
      
      const recommendations = await generateHabitRecommendations(questionnaire);
      console.log("Generated recommendations:", recommendations.length);
      
      res.json({ recommendations });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ 
          message: fromZodError(error).toString(),
          errors: error.errors 
        });
      }
      console.error("Error processing questionnaire:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Test endpoint for debugging
  router.get('/questionnaire/test', async (_req: Request, res: Response) => {
    try {
      const testQuestionnaire = {
        focusAreas: ["Health & Fitness", "Learning"],
        motivationTime: "morning",
        consistencyRating: 3
      };
      
      const recommendations = await generateHabitRecommendations(testQuestionnaire);
      res.json({ 
        success: true, 
        recommendations,
        testQuestionnaire 
      });
    } catch (error) {
      console.error("Test endpoint error:", error);
      res.status(500).json({ message: "Test failed" });
    }
  });

  // Get AI insights (no auth required)
  router.get('/', async (req: Request, res: Response) => {
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
  router.post('/generate', requireAuth, async (req: Request, res: Response) => {
    // Ensure we have a valid response object
    if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
      console.error('Invalid response object in AI insights route:', res);
      return;
    }
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Ensure user is not a guest
      if (req.user?.isGuest) {
        return res.status(403).json({ message: "Guest users cannot generate insights" });
      }
      
      console.log(`Generating insight for user: ${userId}`);
      
      const habits = await storage.getUserHabits(userId);
      const completions = await storage.getHabitCompletions(userId);
      
      console.log(`Found ${habits.length} habits and ${completions.length} completions`);
      
      const insight = await generatePersonalizedInsight(habits, completions);
      console.log("Generated insight:", insight);

      const createdInsight = await storage.createAIInsight(
        userId,
        insight.type,
        insight.title,
        insight.content
      );

      console.log("Created insight in database:", createdInsight.id);
      
      // Ensure we're using the correct response object
      if (res && typeof res.json === 'function') {
        return res.json({
          insight: insight.content,
          title: insight.title,
          type: insight.type,
          id: createdInsight.id
        });
      } else {
        console.error("Invalid response object:", res);
        throw new Error("Invalid response object");
      }
    } catch (error) {
      console.error("Error generating insight:", error);
      
      // Ensure we have a valid response object
      if (res && typeof res.status === 'function' && typeof res.json === 'function') {
        if (error instanceof Error) {
          return res.status(500).json({ 
            message: "Failed to generate insight", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          });
        } else {
          return res.status(500).json({ message: "Failed to generate insight" });
        }
      } else {
        console.error("Invalid response object in error handler:", res);
        // Fallback error handling
        if (res && typeof res.end === 'function') {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: "Failed to generate insight" }));
        }
      }
    }
  });

  // Mark insight as read (no auth required)
  router.put('/:id/read', async (req: Request, res: Response) => {
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
  router.get('/recommendations', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { recommendationEngine } = await import('../recommendationEngine');
      const recommendations = await recommendationEngine.generatePersonalizedRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Ask AI coach a question (requires authentication)
  router.post('/ask', requireAuth, async (req: Request, res: Response) => {
    // Ensure we have a valid response object
    if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
      console.error('Invalid response object in AI coach ask route:', res);
      return;
    }
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Ensure user is not a guest
      if (req.user?.isGuest) {
        return res.status(403).json({ message: "Guest users cannot ask coach questions" });
      }
      
      const { question, context } = req.body;
      
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ message: "Question is required" });
      }
      
      console.log(`AI Coach question from user ${userId}: ${question}`);
      
      const habits = await storage.getUserHabits(userId);
      const completions = await storage.getHabitCompletions(userId);
      
      console.log(`Context: ${habits.length} habits, ${completions.length} completions`);
      
      // Generate personalized response using OpenAI
      const response = await generatePersonalizedInsight(habits, completions);
      console.log("Generated coach response:", response);

      // Ensure we're using the correct response object
      if (res && typeof res.json === 'function') {
        return res.json({
          response: response.content || "I'm here to help with your habit journey!",
          type: "coach_response",
          timestamp: new Date().toISOString()
        });
      } else {
        console.error("Invalid response object:", res);
        throw new Error("Invalid response object");
      }
    } catch (error) {
      console.error("Error asking coach question:", error);
      
      // Ensure we have a valid response object
      if (res && typeof res.status === 'function' && typeof res.json === 'function') {
        if (error instanceof Error) {
          return res.status(500).json({ 
            message: "Failed to get coach response", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          });
        } else {
          return res.status(500).json({ message: "Failed to get coach response" });
        }
      } else {
        console.error("Invalid response object in error handler:", res);
        // Fallback error handling
        if (res && typeof res.end === 'function') {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: "Failed to get coach response" }));
        }
      }
    }
  });

  // Generate AI recommendations (no auth required)
  router.post('/recommendations', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { questionnaireData } = req.body;

      if (!questionnaireData) {
        return res.status(400).json({ error: 'Questionnaire data required' });
      }

      const recommendations = await generateAIRecommendations(questionnaireData);
      res.json({
        success: true,
        recommendations,
        user_id: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  return router;
}
