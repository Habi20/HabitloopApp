// server/routes/aiRoutes.ts
import express from 'express';
import { generateAdvancedServiceInsight, getAvailableServices } from '../services/aiCoachService';
import { requireAuth } from './middlewareRoutes';
import { Habit } from '@shared/schema';
import { questionnaireSchema } from '@shared/schema';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { storage } from '../storage';
import { generateHabitRecommendations, generateAIRecommendations } from '../openaiService';

// Format coach response to ensure proper 4-line structure and convert markdown to HTML
function formatCoachResponse(response: string): string {
  const lines = response.trim().split('\n').filter(line => line.trim());
  
  // Convert markdown formatting to HTML
  const convertMarkdownToHtml = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold** to <strong>
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic* to <em>
      // Keep \n as line breaks for frontend processing
      .replace(/\n/g, '\n'); // Keep line breaks as \n
  };
  
  if (lines.length === 4) {
    return convertMarkdownToHtml(response);
  }
  
  // Fallback: wrap response in 4-section template
  const firstLine = lines[0] || 'Great progress on your habits!';
  const fallbackResponse = [
    `🏆 Win: ${firstLine}`,
    `🧠 Insight: Keep stacking progress - every small action builds momentum.`,
    `➡️ Challenge: Stay consistent tomorrow with your most important habit.`,
    `💡 Identity: You're proving who you are becoming through daily action.`
  ].join('\n');
  
  return convertMarkdownToHtml(fallbackResponse);
}

const router = express.Router();

// Get user ID - handles both authenticated and unauthenticated requests
const getUserId = (req: express.Request) => {
  if (req.user?.id && !req.user?.isGuest) {
    return req.user.id; // Authenticated user
  }
  // For unauthenticated requests, return guest user
  return 'guest-demo-user'; // Fallback to guest
};

// Questionnaire endpoint - public for new users during signup
router.post('/questionnaire', async (req, res) => {
  try {
    console.log("Received questionnaire data:", JSON.stringify(req.body, null, 2));
    
    const questionnaire = questionnaireSchema.parse(req.body);
    console.log("Parsed questionnaire:", JSON.stringify(questionnaire, null, 2));
    
    // Get user ID if available (for authenticated users)
    const userId = req.user?.id || null;
    
    // Save questionnaire data to database if user is authenticated
    if (userId && req.user && !req.user?.isGuest) {
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
    let customCategories: any[] = [];
    if (userId && req.user && !req.user?.isGuest) {
      
      try {
        const user = await storage.getUser(userId);
        userContext = {
          level: user?.level || 1,
          xp: user?.xp || 0,
          existingHabitsCount: (await storage.getUserHabits(userId)).length,
          completionRate: 75 // Could be calculated from historical data
        };
        
        // Fetch custom categories for this user
        customCategories = await storage.getCustomCategories(userId);
        console.log("Fetched custom categories for AI recommendations:", customCategories.length);
      } catch (error) {
        console.log("Could not get user context for AI enhancement:", error);
      }
    }

    const recommendations = await generateHabitRecommendations(questionnaire, userContext, customCategories);
    console.log("Generated recommendations:", recommendations.length);
    
    // Save recommendations to database if user is authenticated
    if (userId && req.user && !req.user?.isGuest) {
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
      userId: userId || null
    });
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
router.get('/questionnaire/test', async (_req, res) => {
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
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const insights = await storage.getAIInsights(userId);
    res.json(insights);
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ message: "Failed to fetch insights" });
  }
});

// OLD ROUTE REMOVED - Using /insights/generate instead with sophisticated prompts

// Mark insight as read (no auth required)
router.put('/:id/read', async (req, res) => {
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
router.get('/recommendations', async (req, res) => {
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
router.post('/recommendations', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { questionnaireData } = req.body;

    if (!questionnaireData) {
      return res.status(400).json({ error: 'Questionnaire data required' });
    }

    // Fetch custom categories if user is authenticated
    let customCategories: any[] = [];
    if (userId && req.user && !req.user?.isGuest) {
      try {
        customCategories = await storage.getCustomCategories(userId);
        console.log("Fetched custom categories for recommendations:", customCategories.length);
      } catch (error) {
        console.log("Could not fetch custom categories:", error);
      }
    }

    const recommendations = await generateAIRecommendations(questionnaireData, customCategories);
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

// Clear AI recommendations for fresh generation
router.post('/clear-recommendations', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    // Clear AI recommendations from user profile
    await storage.clearUserRecommendations(userId);
    
    console.log(`🧹 Cleared AI recommendations for user: ${userId}`);
    
    res.json({
      success: true,
      message: "AI recommendations cleared successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error clearing AI recommendations:", error);
    res.status(500).json({ message: "Failed to clear recommendations" });
  }
});

// Get available AI Coach services
router.get('/coach/services', requireAuth, async (_req, res) => {
  try {
    const services = getAvailableServices();
    res.json({ services });
  } catch (error) {
    console.error('Error fetching coach services:', error);
    res.status(500).json({ error: 'Failed to fetch coach services' });
  }
});

// Generate AI Coach insight with context
router.post('/coach/insight', requireAuth, async (req, res) => {
  try {
    const { serviceId, context } = req.body;
    
    if (!serviceId) {
      return res.status(400).json({ error: 'Service ID is required' });
    }

    if (!context || !context.habits || !context.completions) {
      return res.status(400).json({ error: 'Context with habits and completions is required' });
    }

    const insight = await generateAdvancedServiceInsight(serviceId, {
      habits: context.habits,
      completions: context.completions,
      questionnaire: context.questionnaire || {},
      userLevel: context.userLevel || 1,
      totalXP: context.totalXP || 0
    });

    res.json({ insight });
  } catch (error) {
    console.error('Error generating AI insight:', error);
    res.status(500).json({ error: 'Failed to generate AI insight' });
  }
});

// Ask AI coach a question (requires authentication)
router.post('/ask', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    // Ensure user is not a guest
    if (req.user?.isGuest) {
      return res.status(403).json({ message: "Guest users cannot ask coach questions" });
    }
    
    const { question } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ message: "Question is required" });
    }
    
    console.log(`AI Coach question from user ${userId}: ${question}`);
    
    const habits = await storage.getUserHabits(userId);
    const completions = await storage.getHabitCompletions(userId);
    
    console.log(`Context: ${habits.length} habits, ${completions.length} completions`);
    
    // Generate personalized response using the same sophisticated prompt
    const { default: OpenAI } = await import('openai');
    const { env } = await import('../env');
    
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY || "sk-placeholder-key-for-development",
    });

    const userLevel = req.user?.level || 1;
    const totalXP = (req.user as any)?.totalXP || 0;

    // Calculate real performance data
    console.log('🔍 DEBUG: Ask Coach Data Received:');
    console.log('- Habits count:', habits.length);
    console.log('- Completions count:', completions.length);
    console.log('- User Level:', userLevel, 'Total XP:', totalXP);
    
    const habitPerformance = habits.map((habit: any) => {
      const habitCompletions = completions.filter((c: any) => c.habitId === habit.id);
      const last7Days = habitCompletions.filter((c: any) => {
        const completionDate = new Date(c.completedAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return completionDate >= sevenDaysAgo;
      });
      const completionRate = Math.round((last7Days.length / 7) * 100);
      console.log(`- ${habit.title}: ${completionRate}% (${last7Days.length}/7 days)`);
      return `${habit.title}: ${completionRate}% (${last7Days.length}/7 days)`;
    });
    
    console.log('🔍 DEBUG: Final performance data:', habitPerformance.join(', '));

    const prompt = `You are a professional Habit Coach with over 20 years of experience in behavioral psychology, fitness, productivity, and personal growth. You speak like a trusted mentor who has guided thousands of people toward sustainable transformation.

🎯 USER DATA:
- Level: ${userLevel} (${totalXP} XP)
- Active habits: ${habits.length}
- Habits: ${habits.map((h: Habit) => `• ${h.title} [${h.category}] - Target: ${h.targetValue} ${h.unit}, Frequency: ${h.frequency}, Reminder: ${h.reminderTime || "none"}`).join('\n')}
- Total completions: ${completions.length}
- REAL PERFORMANCE (Last 7 Days): ${habitPerformance.join(', ')}

USER'S SPECIFIC QUESTION: "${question}"

🧠 COACHING PRINCIPLES:
1. **Celebrate Wins** → Recognize specific completions, reinforcing momentum
2. **Explain Why It Matters** → Share a quick insight grounded in psychology or habit science
3. **Set a Next Step** → Suggest a tiny, achievable challenge scaled to their situation
4. **Reinforce Identity** → Frame progress as proof of who they are becoming
5. **Be Human** → Sound like a seasoned coach, not a robot

📌 RESPONSE STYLE:
- Deliver in **4 crisp lines**, point-form style
- Start each line with a **meaningful emoji + keyword**:
  - 🏆 Win - 🧠 Insight - ➡️ Challenge - 💡 Identity
- Use **context-relevant emojis** based on their habits and question
- Keep tone **authentic, wise, and motivating**
- Address their specific question directly
- Be practical and empathetic

🚀 OUTPUT TEMPLATE:
🏆 Win: [Acknowledge their progress or situation]
🧠 Insight: [Address their specific question with wisdom]
➡️ Challenge: [Practical next step related to their question]
💡 Identity: [Reinforce who they are becoming]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an elite AI habit coach with expertise in behavioral psychology, neuroscience, and personal development. You provide evidence-based, personalized coaching insights that are actionable and transformative. Create inspiring, engaging responses that boost motivation and provide clear next steps."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.8
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Format the coach response to ensure proper structure
    const formattedResponse = formatCoachResponse(content);

    return res.json({
      response: formattedResponse,
      type: "coach_response",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error asking coach question:", error);
    
    if (error instanceof Error) {
      return res.status(500).json({ 
        message: "Failed to get coach response", 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } else {
      return res.status(500).json({ message: "Failed to get coach response" });
    }
  }
});

// Generate general insights
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { habits, completions, userLevel, totalXP, serviceType } = req.body;
    
    if (!habits || !completions) {
      return res.status(400).json({ error: 'Habits and completions data required' });
    }

    // Import OpenAI dynamically to avoid circular dependencies
    const { default: OpenAI } = await import('openai');
    const { env } = await import('../env');
    
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY || "sk-placeholder-key-for-development",
    });
    
    // Calculate real performance data
    console.log('🔍 DEBUG: AI Coach Data Received:');
    console.log('- Habits count:', habits.length);
    console.log('- Completions count:', completions.length);
    console.log('- User Level:', userLevel, 'Total XP:', totalXP);
    console.log('- Service Type:', serviceType);
    
    const habitPerformance = habits.map((habit: any) => {
      const habitCompletions = completions.filter((c: any) => c.habitId === habit.id);
      const last7Days = habitCompletions.filter((c: any) => {
        const completionDate = new Date(c.completedAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return completionDate >= sevenDaysAgo;
      });
      const completionRate = Math.round((last7Days.length / 7) * 100);
      console.log(`- ${habit.title}: ${completionRate}% (${last7Days.length}/7 days)`);
      return `${habit.title}: ${completionRate}% (${last7Days.length}/7 days)`;
    });
    
    console.log('🔍 DEBUG: Final performance data:', habitPerformance.join(', '));

    // Create section-specific prompts using the sophisticated coaching template
    const getSectionPrompt = (serviceType: string) => {
      const formatInstructions: Record<string, string> = {
        progress_analysis: '🏆 Win, 🧠 Insight, ➡️ Challenge, 💡 Identity',
        motivation_boost: '🎯 Energy, 💪 Momentum, 🌟 Identity',
        habit_optimization: '🔍 Analysis, ⚙️ Optimization, 🎯 Action, 📈 Results',
        weekly_planning: '📅 Plan, 🎯 Goals, ⚡ Energy, 🏆 Success',
        obstacle_solving: '🚧 Problem, 💡 Solution, 🛠️ Action, 🎯 Prevention'
      };

      const coachingModes: Record<string, string> = {
        progress_analysis: `
📊 PROGRESS ANALYSIS MODE:
- Analyze their actual performance data (completion rates, streaks, patterns)
- Highlight specific metrics and trends from their habit data
- Provide data-driven insights about what's working and what needs attention`,
        
        motivation_boost: `
🔥 MOTIVATION BOOST MODE:
- Focus on energy, momentum, and identity reinforcement
- Use high-energy, inspiring language that gets them excited
- Emphasize their progress and potential`,

        habit_optimization: `
⚙️ HABIT OPTIMIZATION MODE:
- Focus on timing, bundling, environment, and triggers
- Provide specific, actionable habit modifications
- Suggest concrete improvements to their routine`,

        weekly_planning: `
📅 WEEKLY PLANNING MODE:
- Focus on weekly structure, priorities, and energy management
- Provide clear weekly strategy with specific targets
- Help them plan their upcoming week effectively`,

        obstacle_solving: `
🚧 OBSTACLE SOLVING MODE:
- Focus on fatigue, procrastination, time clashes, motivation dips
- Provide practical solutions for specific obstacles
- Help them overcome barriers to habit success`
      };

      const baseData = `
🎯 USER DATA:
- Level: ${userLevel || 1} (${totalXP || 0} XP)
- Active habits: ${habits.length}
- Habits: ${habits.map((h: Habit) => `• ${h.title} [${h.category}] - Target: ${h.targetValue} ${h.unit}, Frequency: ${h.frequency}, Reminder: ${h.reminderTime || "none"}`).join('\n')}
- Total completions: ${completions.length}
- REAL PERFORMANCE (Last 7 Days): ${habitPerformance.join(', ')}
`;

      const basePrompt = `
You are a professional Habit Coach with over 20 years of experience in behavioral psychology, fitness, productivity, and personal growth. You speak like a trusted mentor who has guided thousands of people toward sustainable transformation. Your communication is:
- Practical - Empathetic - Encouraging - Rooted in long-term wisdom

${baseData}

🧠 COACHING PRINCIPLES:
1. **Celebrate Wins** → Recognize specific completions, reinforcing momentum
2. **Explain Why It Matters** → Share a quick insight grounded in psychology or habit science
3. **Set a Next Step** → Suggest a tiny, achievable challenge scaled to the habit's frequency & category
4. **Reinforce Identity** → Frame progress as proof of who they are becoming, not just what they did
5. **Be Human** → Sound like a seasoned coach, not a robot or generic AI

📌 RESPONSE STYLE:
- Use **context-relevant emojis** mapped to habit categories (Health, Learning, Productivity, Mindfulness)
- Keep tone **authentic, wise, and motivating**, like a veteran coach texting a client
- Avoid sparkles ✨, robots 🤖, or "AI-sounding" fluff
- Output should be plain text (no JSON)
- Adapt your response format based on the service type requested
`;

      if (coachingModes[serviceType]) {
        return `${basePrompt}

${coachingModes[serviceType]}
- Use the format: ${formatInstructions[serviceType]}`;
      }

      return `${basePrompt}

🧠 GENERAL COACHING MODE:
- Reflect on overall habit journey
- Highlight progress, identity, and next steps
- Use a balanced, motivational tone
`;
    };

    const prompt = getSectionPrompt(serviceType || 'general');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an elite AI habit coach with expertise in behavioral psychology, neuroscience, and personal development. You provide evidence-based, personalized coaching insights that are actionable and transformative. Create inspiring, engaging responses that boost motivation and provide clear next steps."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.8
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Format the coach response to ensure proper structure
    const formattedResponse = formatCoachResponse(content);

    // Return the content directly as a string response
    res.json({ 
      response: formattedResponse,
      type: "coach_response",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ 
      error: 'Failed to generate insights',
      fallback: "Focus on consistency over perfection. Small daily actions compound into significant results."
    });
  }
});

export default router;
