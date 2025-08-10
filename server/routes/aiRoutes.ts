// server/routes/aiRoutes.ts
import { Router, Request, Response } from "express";
import {
  generateHabitRecommendations,
  generatePersonalizedInsight,
  generateAIRecommendations
} from "../openai";
import { questionnaireSchema } from "../../shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { storage } from "../storage";
import {env} from "../env";

export function aiRoutes() {
  const router = Router();

  // Use a default user ID for development/testing
  const getUserId = (req: Request) => req.user?.id || 'default-user-id';

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
  router.get('/questionnaire/test', async (req: Request, res: Response) => {
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
  router.get('/insights', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const insights = await storage.getAIInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  // Generate AI insights (no auth required)
  router.post('/insights/generate', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getUserHabits(userId);
      const completions = await storage.getHabitCompletions(userId);
      const insight = await generatePersonalizedInsight(habits, completions);

      const createdInsight = await storage.createAIInsight(
        userId,
        insight.type,
        insight.title,
        insight.content
      );

      res.json(createdInsight);
    } catch (error) {
      console.error("Error generating insight:", error);
      res.status(500).json({ message: "Failed to generate insight" });
    }
  });

  // Mark insight as read (no auth required)
  router.put('/insights/:id/read', async (req: Request, res: Response) => {
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
