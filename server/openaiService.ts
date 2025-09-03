import type { Questionnaire } from "../shared/schema";
import { generatePersonalizedHabits } from "./syntheticDatabase";
import { env } from './env';
// isOpenAIEnabled 
// import OpenAI from 'openai';

// Fix: openai typed as an instance of the OpenAI class
// let openai: InstanceType<typeof OpenAI> | null = null;

// async function getOpenAI() {
//   if (!openai) {
//     try {
//       openai = new OpenAI({
//         apiKey: env.openaiApiKey || "sk-placeholder-key-for-development",
//       });
//       console.log("✅ OpenAI client initialized successfully");
//     } catch (error) {
//       console.error("Failed to initialize OpenAI:", error);
//       throw new Error("OpenAI client initialization failed");
//     }
//   }
//   return openai;
// }

// Define openaiClient as the instance of the imported class
import OpenAI from "openai";

let openaiClient: any = null;

async function getOpenAI() {
  if (!openaiClient) {
    try {
      openaiClient = new OpenAI({
        apiKey: env.OPENAI_API_KEY || "sk-placeholder-key-for-development",
      });
      console.log("✅ OpenAI client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize OpenAI:", error);
      throw new Error("OpenAI client initialization failed");
    }
  }
  return openaiClient;
}

export interface HabitRecommendation {
  title: string;
  description: string;
  category: string;
  targetValue: number;
  unit: string;
  reminderTime: string;
  frequency: string;
  color: string;
  icon: string;
}

export async function generateHabitRecommendations(
  questionnaire: Questionnaire,
  userContext?: { level: number; xp: number; existingHabitsCount: number; completionRate: number } | null
): Promise<HabitRecommendation[]> {
  try {
    console.log("Generating recommendations for questionnaire:", JSON.stringify(questionnaire, null, 2));
    
    const syntheticHabits = generatePersonalizedHabits(questionnaire);
    console.log("Generated synthetic habits:", syntheticHabits.length);
    
    if (syntheticHabits.length === 0) {
      console.log("No synthetic habits generated, using fallback habits");
      // Return some default habits if none are generated
      const fallbackHabits = [
        {
          title: "Daily Walk",
          description: "Take a 30-minute walk for physical and mental health",
          category: "Health & Fitness",
          targetValue: 30,
          unit: "minutes",
          reminderTime: "09:00",
          frequency: "daily",
          color: "#10B981",
          icon: "🚶"
        },
        {
          title: "Read a Book",
          description: "Read for 20 minutes to expand knowledge and reduce stress",
          category: "Learning",
          targetValue: 20,
          unit: "minutes",
          reminderTime: "20:00",
          frequency: "daily",
          color: "#3B82F6",
          icon: "📚"
        },
        {
          title: "Practice Gratitude",
          description: "Write down 3 things you're grateful for each day",
          category: "Mindfulness",
          targetValue: 3,
          unit: "items",
          reminderTime: "19:00",
          frequency: "daily",
          color: "#8B5CF6",
          icon: "🙏"
        }
      ];
      return fallbackHabits;
    }
    
    const recommendations: HabitRecommendation[] = syntheticHabits.map(habit => ({
      title: habit.title,
      description: habit.description,
      category: habit.category,
      targetValue: habit.targetValue,
      unit: habit.unit,
      reminderTime: habit.reminderTime,
      frequency: habit.frequency,
      color: habit.color,
      icon: habit.icon
    }));

    const hasValidOpenAIKey = env.OPENAI_API_KEY && 
      env.OPENAI_API_KEY !== "sk-placeholder-key-for-development" && 
      env.OPENAI_API_KEY.startsWith("sk-");
      
    if (hasValidOpenAIKey) {
      try {
        const enhancedRecommendations = await enhanceRecommendationsWithAI(questionnaire, recommendations, userContext);
        return enhancedRecommendations;
      } catch (error: any) {
        console.log("OpenAI enhancement failed, using synthetic recommendations:", error.message);
      }
    }
    
    return recommendations;
  } catch (error) {
    console.error("Error in generateHabitRecommendations:", error);
    // Return fallback recommendations
    return [
      {
        title: "Daily Walk",
        description: "Take a 30-minute walk for physical and mental health",
        category: "Health & Fitness",
        targetValue: 30,
        unit: "minutes",
        reminderTime: "09:00",
        frequency: "daily",
        color: "#10B981",
        icon: "🚶"
      },
      {
        title: "Read a Book",
        description: "Read for 20 minutes to expand knowledge and reduce stress",
        category: "Learning",
        targetValue: 20,
        unit: "minutes",
        reminderTime: "20:00",
        frequency: "daily",
        color: "#3B82F6",
        icon: "📚"
      },
      {
        title: "Practice Gratitude",
        description: "Write down 3 things you're grateful for each day",
        category: "Mindfulness",
        targetValue: 3,
        unit: "items",
        reminderTime: "19:00",
        frequency: "daily",
        color: "#8B5CF6",
        icon: "🙏"
      }
    ];
  }
}

export async function generateAIRecommendations(
  questionnaire: Questionnaire
): Promise<HabitRecommendation[]> {
  return generateHabitRecommendations(questionnaire);
}

async function enhanceRecommendationsWithAI(
  questionnaire: Questionnaire,
  baseRecommendations: HabitRecommendation[],
  userContext?: { level: number; xp: number; existingHabitsCount: number; completionRate: number } | null
): Promise<HabitRecommendation[]> {
  
  // Get user context for better personalization
  let userLevel = userContext?.level || 1;
  let userXP = userContext?.xp || 0;
  let existingHabitsCount = userContext?.existingHabitsCount || 0;
  let completionRate = userContext?.completionRate || 75;

  // If no user context provided, estimate from questionnaire data
  if (!userContext) {
    try {
      // Estimate user level based on consistency rating
      const consistencyRating = questionnaire.consistencyRating || 3;
      if (consistencyRating >= 4) {
        userLevel = 3; // Intermediate
      } else if (consistencyRating >= 2) {
        userLevel = 2; // Beginner+
      } else {
        userLevel = 1; // Beginner
      }

      // Estimate XP based on consistency and focus areas
      userXP = consistencyRating * 50 + (questionnaire.focusAreas?.length || 1) * 25;

      // Estimate completion rate based on consistency rating
      completionRate = Math.max(45, Math.min(95, consistencyRating * 15 + 30));

    } catch (error) {
      console.log("Could not estimate user context from questionnaire:", error);
    }
  }

  const prompt = `You are HabitCoach AI, an expert behavioral psychologist and habit formation specialist. Create HIGHLY PERSONALIZED habit recommendations.

CRITICAL CONTEXT:
User Level: ${userLevel} (Beginner: 1-3, Intermediate: 4-7, Advanced: 8+)
Total XP: ${userXP} 
Existing Habits: ${existingHabitsCount}
Historical Success Rate: ${completionRate}%

USER PSYCHOLOGICAL PROFILE:
- Focus Areas: ${questionnaire.focusAreas?.join(", ") || "General wellness"}
- Peak Motivation Time: ${questionnaire.motivationTime || "Morning"}
- Current Mood State: ${questionnaire.mood || "Balanced"}
- Motivation Driver: ${questionnaire.motivationStyle || "Self-improvement"}
- Self-Rated Consistency: ${questionnaire.consistencyRating || 3}/5
- Primary Challenge: ${questionnaire.mainDistraction || "Time management"}

ADVANCED PERSONALIZATION RULES:
1. **Difficulty Calibration**: 
   - Beginner (L1-3): 70% easy, 25% medium, 5% hard
   - Intermediate (L4-7): 40% easy, 50% medium, 10% hard  
   - Advanced (L8+): 20% easy, 60% medium, 20% hard

2. **Success Rate Prediction** (based on user profile):
   - High motivation + low existing habits = 80-95%
   - Medium motivation + medium existing habits = 65-80%
   - Low consistency + high existing habits = 45-65%

3. **Timing Optimization**:
   - Morning people: 6:00-10:00 recommendations
   - Evening people: 18:00-22:00 recommendations
   - Varies: Spread across optimal habit stacking times

4. **Category Balancing**: Ensure variety across focus areas
5. **Habit Stacking**: Suggest habits that complement existing routines

PSYCHOLOGICAL TRIGGERS TO INCORPORATE:
- Use language matching their motivation style
- Address their specific distractions in descriptions
- Include micro-habit versions for low-consistency users
- Add social elements for socially-motivated users

OUTPUT REQUIREMENTS:
Return JSON with EXACTLY 10 unique habits. Each habit must have:
- title: Compelling, action-oriented (not generic)
- description: Personalized 2-sentence explanation addressing their profile
- difficulty: Calculated using rules above
- successRate: Realistic prediction (45-95%) based on user profile
- reminderTime: Optimized for their peak motivation time
- category: Balanced across their focus areas
- aiReasoning: 1-2 sentences explaining WHY this specific habit fits them
- benefits: 3 personalized benefits (not generic)
- tips: 2 specific success tips for their profile type

PERSONALIZATION EXAMPLES:
- Low consistency user: "Start with just 2 minutes daily"
- High existing habits: "This builds on your existing morning routine"
- Social motivation: "Share progress with friends for accountability"
- Evening motivation: "Perfect wind-down activity after work"

Base Recommendations to Enhance: ${JSON.stringify(baseRecommendations, null, 2)}

Create habits that feel CUSTOM-MADE for this specific user, not generic suggestions.`;

  try {
    const openaiClient = await getOpenAI();
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system",
          content: "You are an expert habit coach. Enhance habit recommendations with personalized insights while maintaining the JSON structure.",
        },
        { 
          role: "user",
          content: prompt,
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.habits || baseRecommendations;
  } catch (error) {
    console.error("OpenAI API call failed:", error);
    return baseRecommendations;
  }
}

export async function generatePersonalizedInsight(
  habits: any[],
  completions: any[]
): Promise<{ title: string; content: string; type: string }> {
  // Check if OpenAI is properly configured
  const hasValidOpenAIKey = env.OPENAI_API_KEY && 
    env.OPENAI_API_KEY !== "sk-placeholder-key-for-development" && 
    env.OPENAI_API_KEY.startsWith("sk-");
    
  if (!hasValidOpenAIKey) {
    console.log("OpenAI not configured, returning fallback insight");
    return {
      title: "Keep Going!",
      content: "You're building great habits. Consistency is key to success!",
      type: "motivation"
    };
  }

  try {
    const habitSummary = habits.map(h => `${h.title} (${h.category})`).join(", ");
    const recentCompletions = completions.slice(-7);

    const prompt = `Based on the user's habit data, generate a personalized insight or suggestion:

User's Habits: ${habitSummary}
Recent Completions: ${recentCompletions.length} in the last 7 days

Provide a JSON response with:
- title: Brief title for the insight
- content: Helpful, encouraging message with actionable advice (2-3 sentences)
- type: One of "suggestion", "motivation", "tip"

Focus on patterns, improvements, or encouragement based on their progress.`;

    const openaiClient = await getOpenAI();
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a supportive habit coach. Provide encouraging, actionable insights.",
        },
        {
          role: "user",
          content: prompt,
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      title: result.title || "Keep Going!",
      content: result.content || "You're building great habits. Consistency is key to success!",
      type: result.type || "motivation"
    };
  } catch (error) {
    console.error("Failed to generate AI insight:", error);
    return {
      title: "Keep Going!",
      content: "You're building great habits. Consistency is key to success!",
      type: "motivation"
    };
  }
}

// Advanced Email Report Generation using GPT-4o-mini for cost efficiency
export async function generateEmailReport(
  userData: {
    name: string;
    level: number;
    xp: number;
    totalHabits: number;
    totalCompletions: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    recentHabits: Array<{ title: string; category: string; completed: boolean }>;
    difficulty?: string;
    role?: string;
    emailSettings?: any;
  },
  reportType: 'daily' | 'weekly' | 'monthly' | 'milestone'
): Promise<{
  subject: string;
  content: string;
  insights: string[];
  recommendations: string[];
}> {
  try {
    const openai = await getOpenAI();
    
    // Check if user is new (level ≤ 3) - use basic prompt for cost efficiency
    const isNewUser = userData.level <= 3;
    
    console.log(`📧 Email Report: ${isNewUser ? 'BASIC' : 'ADVANCED'} prompt for ${userData.name} (Level ${userData.level})`);
    
    if (isNewUser) {
      // BASIC PROMPT for new users (LOWER TOKEN USAGE)
             // Sanitize data for basic prompt too
       const sanitizeString = (str: any) => {
         if (typeof str !== 'string') return String(str || '');
         return str.replace(/"/g, '\\"').replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
       };

       const basicPrompt = `You are HabitLoop AI coach. Generate a simple ${reportType} email for a new user.

USER: ${sanitizeString(userData.name)} (Level ${userData.level}, ${userData.xp} XP)
STATS: ${userData.totalHabits} habits, ${userData.totalCompletions} completions, ${userData.currentStreak} day streak

REQUIREMENTS:
- Keep it simple and encouraging for new users
- Use basic HTML formatting
- Include 1-2 simple tips
- Tell them they'll get advanced reports at Level 4+
- Max 200 words
- Use emojis sparingly
- IMPORTANT: Ensure all quotes in the JSON response are properly escaped
- IMPORTANT: Do not include any unescaped quotes or special characters that could break JSON parsing

Generate JSON:
{
  "subject": "Simple subject line",
  "content": "Basic HTML content",
  "insights": ["1-2 simple insights"],
  "recommendations": ["1-2 basic tips"]
}`;

      const basicResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a supportive habit coach for new users. Keep responses simple and encouraging."
          },
          {
            role: "user",
            content: basicPrompt
          }
        ],
        max_tokens: 400, // Much lower token usage for new users
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

             let basicResult;
       try {
         basicResult = JSON.parse(basicResponse.choices[0].message.content || "{}");
       } catch (parseError: any) {
         console.error('❌ JSON parsing failed for basic AI response:', parseError);
         console.error('🔍 Raw basic AI response:', basicResponse.choices[0].message.content);
         throw new Error(`Basic JSON parsing failed: ${parseError.message}`);
       }
      
      // Add level-up motivation for new users
      const levelUpMessage = userData.level < 3 ? 
        `<p style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #F59E0B;">
          <strong>🚀 Level Up Bonus:</strong> At Level 4, you'll unlock advanced AI-powered reports with personalized insights and detailed analytics. Keep building those habits!
        </p>` : '';

      return {
        subject: basicResult.subject || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Habit Update`,
        content: basicResult.content + levelUpMessage,
        insights: basicResult.insights || ["You're getting started with great habits!"],
        recommendations: basicResult.recommendations || ["Keep it simple and consistent!"]
      };
    }
    
    // ADVANCED PROMPT for experienced users (level > 3)
    // Determine user performance level
    let performanceLevel = 'beginner';
    if (userData.level >= 15) performanceLevel = 'advanced';
    else if (userData.level >= 8) performanceLevel = 'intermediate';
    
    // Determine streak status
    let streakStatus = 'building';
    if (userData.currentStreak >= 30) streakStatus = 'excellent';
    else if (userData.currentStreak >= 7) streakStatus = 'good';
    else if (userData.currentStreak === 0) streakStatus = 'needs_motivation';
    
         // Sanitize data to prevent JSON parsing issues
     const sanitizeString = (str: any) => {
       if (typeof str !== 'string') return String(str || '');
       return str.replace(/"/g, '\\"').replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
     };

     const sanitizedHabits = userData.recentHabits.map(h => 
       `${sanitizeString(h.title)} (${sanitizeString(h.category)}) - ${h.completed ? '✅' : '❌'}`
     ).join(', ');

     const advancedPrompt = `You are an AI coach for HabitLoop, a habit tracking app. Generate a personalized ${reportType} email report for the user.

USER PROFILE:
- Name: ${sanitizeString(userData.name)}
- Level: ${userData.level} (XP: ${userData.xp}) - ${performanceLevel} user
- Difficulty Setting: ${sanitizeString(userData.difficulty || 'medium')}
- User Type: ${sanitizeString(userData.role || 'habitloop_user')}
- Total Habits: ${userData.totalHabits}
- Completions This Period: ${userData.totalCompletions}
- Current Streak: ${userData.currentStreak} days (${streakStatus})
- Longest Streak: ${userData.longestStreak} days
- Completion Rate: ${userData.completionRate}%
- Recent Habits: ${sanitizedHabits}

EMAIL PREFERENCES:
- Daily Reminders: ${userData.emailSettings?.dailyReminders ? '✅' : '❌'}
- Weekly Progress: ${userData.emailSettings?.weeklyProgress ? '✅' : '❌'}
- AI Insights: ${userData.emailSettings?.aiInsights ? '✅' : '❌'}
- Streak Milestones: ${userData.emailSettings?.streakMilestones ? '✅' : '❌'}
- Motivational Messages: ${userData.emailSettings?.motivationalMessages ? '✅' : '❌'}

PERSONALIZATION RULES:
1. Performance Level: ${performanceLevel} users need ${performanceLevel === 'beginner' ? 'encouragement and simple tips' : performanceLevel === 'intermediate' ? 'challenge and growth opportunities' : 'advanced strategies and optimization'}
2. Streak Status: ${streakStatus === 'needs_motivation' ? 'Focus on getting started and building momentum' : streakStatus === 'building' ? 'Encourage consistency and celebrate small wins' : 'Celebrate achievements and suggest next-level goals'}
3. Completion Rate: ${userData.completionRate < 50 ? 'Focus on consistency and habit formation' : userData.completionRate < 80 ? 'Encourage improvement and optimization' : 'Celebrate excellence and suggest advanced challenges'}
4. Email Type: ${reportType === 'milestone' ? 'Celebratory and welcoming tone' : reportType === 'weekly' ? 'Analytical and progress-focused' : 'Motivational and action-oriented'}

REQUIREMENTS:
1. Use GPT-4o-mini for cost efficiency
2. Generate highly personalized content based on user profile
3. Include specific insights about their habits and performance
4. Provide actionable recommendations tailored to their level
5. Keep content engaging but concise (max 400 words)
6. Use emojis and HTML formatting for visual appeal
7. Reference their specific habits and achievements
8. Match tone to their performance level and preferences
9. IMPORTANT: Ensure all quotes in the JSON response are properly escaped
10. IMPORTANT: Do not include any unescaped quotes or special characters that could break JSON parsing

Generate a JSON response with:
{
  "subject": "Engaging email subject line with emoji",
  "content": "Main email content with HTML formatting, personalized for ${sanitizeString(userData.name)}",
  "insights": ["3-4 specific insights about their ${userData.totalHabits} habits and ${userData.completionRate}% completion rate"],
  "recommendations": ["3-4 actionable recommendations for a ${performanceLevel} user with ${sanitizeString(userData.difficulty)} difficulty"]
}

Make it feel like it was written specifically for ${sanitizeString(userData.name)} based on their actual data.`;

    const advancedResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert habit coach who creates personalized, motivating email reports. Be encouraging, data-driven, and actionable."
        },
        {
          role: "user",
          content: advancedPrompt
        }
      ],
      max_tokens: 800, // Higher token usage for advanced users
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

         let advancedResult;
     try {
       advancedResult = JSON.parse(advancedResponse.choices[0].message.content || "{}");
     } catch (parseError: any) {
       console.error('❌ JSON parsing failed for AI response:', parseError);
       console.error('🔍 Raw AI response:', advancedResponse.choices[0].message.content);
       throw new Error(`JSON parsing failed: ${parseError.message}`);
     }
     
     return {
       subject: advancedResult.subject || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Habit Report`,
       content: advancedResult.content || "Keep up the great work with your habits!",
       insights: advancedResult.insights || ["You're making progress!"],
       recommendations: advancedResult.recommendations || ["Stay consistent!"]
     };


  } catch (error) {
    console.error("Failed to generate email report:", error);
    
    // Fallback content
    return {
      subject: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Habit Report`,
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366F1;">Your ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h2>
          <p>Hi ${userData.name}!</p>
          <p>You're doing great with your habits! Keep up the consistency and you'll see amazing results.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Quick Stats:</h3>
            <p>Level: ${userData.level} | Streak: ${userData.currentStreak} days | Completion Rate: ${userData.completionRate}%</p>
          </div>
          <p>Keep building those amazing habits! 💪</p>
        </div>
      `,
      insights: ["You're making consistent progress", "Your streak shows dedication", "Every completion counts"],
      recommendations: ["Stay consistent with your routine", "Celebrate small wins", "Keep tracking your progress"]
    };
  }
}

const openaiService = {
  generateHabitRecommendations,
  generateAIRecommendations,
  generatePersonalizedInsight,
  generateEmailReport
};

export { openaiService };
export default openaiService;

















// import type { Questionnaire } from "../shared/schema";
// import { generatePersonalizedHabits } from "./syntheticDatabase";
// import { env, isOpenAIEnabled } from './env';
// import OpenAI from 'openai';

// // Initialize OpenAI client
// let openai: OpenAI | null = null;

// async function getOpenAI() {
//   if (!openai) {
//     try {
//       openai = new OpenAI({
//         apiKey: env.openaiApiKey || "sk-placeholder-key-for-development"
//       });
      
//       console.log("✅ OpenAI client initialized successfully");
//     } catch (error) {
//       console.error("Failed to initialize OpenAI:", error);
//       throw new Error("OpenAI client initialization failed");
//     }
//   }
//   return openai;
// }

// export interface HabitRecommendation {
//   title: string;
//   description: string;
//   category: string;
//   targetValue: number;
//   unit: string;
//   reminderTime: string;
//   frequency: string;
//   color: string;
//   icon: string;
// }

// export async function generateHabitRecommendations(
//   questionnaire: Questionnaire
// ): Promise<HabitRecommendation[]> {
//   try {
//     console.log("Generating recommendations for questionnaire:", JSON.stringify(questionnaire, null, 2));
    
//     const syntheticHabits = generatePersonalizedHabits(questionnaire);
//     console.log("Generated synthetic habits:", syntheticHabits.length);
    
//     if (syntheticHabits.length === 0) {
//       console.log("No synthetic habits generated, using fallback habits");
//       // Return some default habits if none are generated
//       const fallbackHabits = [
//         {
//           title: "Daily Walk",
//           description: "Take a 30-minute walk for physical and mental health",
//           category: "Health & Fitness",
//           targetValue: 30,
//           unit: "minutes",
//           reminderTime: "09:00",
//           frequency: "daily",
//           color: "#10B981",
//           icon: "🚶"
//         },
//         {
//           title: "Read a Book",
//           description: "Read for 20 minutes to expand knowledge and reduce stress",
//           category: "Learning",
//           targetValue: 20,
//           unit: "minutes",
//           reminderTime: "20:00",
//           frequency: "daily",
//           color: "#3B82F6",
//           icon: "📚"
//         },
//         {
//           title: "Practice Gratitude",
//           description: "Write down 3 things you're grateful for each day",
//           category: "Mindfulness",
//           targetValue: 3,
//           unit: "items",
//           reminderTime: "19:00",
//           frequency: "daily",
//           color: "#8B5CF6",
//           icon: "🙏"
//         }
//       ];
//       return fallbackHabits;
//     }
    
//     const recommendations: HabitRecommendation[] = syntheticHabits.map(habit => ({
//       title: habit.title,
//       description: habit.description,
//       category: habit.category,
//       targetValue: habit.targetValue,
//       unit: habit.unit,
//       reminderTime: habit.reminderTime,
//       frequency: habit.frequency,
//       color: habit.color,
//       icon: habit.icon
//     }));

//     if (isOpenAIEnabled && env.openaiApiKey && env.openaiApiKey !== "sk-placeholder-key-for-development") {
//       try {
//         const enhancedRecommendations = await enhanceRecommendationsWithAI(questionnaire, recommendations);
//         return enhancedRecommendations;
//       } catch (error: any) {
//         console.log("OpenAI enhancement failed, using synthetic recommendations:", error.message);
//       }
//     }
    
//     return recommendations;
//   } catch (error) {
//     console.error("Error in generateHabitRecommendations:", error);
//     // Return fallback recommendations
//     return [
//       {
//         title: "Daily Walk",
//         description: "Take a 30-minute walk for physical and mental health",
//         category: "Health & Fitness",
//         targetValue: 30,
//         unit: "minutes",
//         reminderTime: "09:00",
//         frequency: "daily",
//         color: "#10B981",
//         icon: "🚶"
//       },
//       {
//         title: "Read a Book",
//         description: "Read for 20 minutes to expand knowledge and reduce stress",
//         category: "Learning",
//         targetValue: 20,
//         unit: "minutes",
//         reminderTime: "20:00",
//         frequency: "daily",
//         color: "#3B82F6",
//         icon: "📚"
//       },
//       {
//         title: "Practice Gratitude",
//         description: "Write down 3 things you're grateful for each day",
//         category: "Mindfulness",
//         targetValue: 3,
//         unit: "items",
//         reminderTime: "19:00",
//         frequency: "daily",
//         color: "#8B5CF6",
//         icon: "🙏"
//       }
//     ];
//   }
// }

// export async function generateAIRecommendations(
//   questionnaire: Questionnaire
// ): Promise<HabitRecommendation[]> {
//   return generateHabitRecommendations(questionnaire);
// }

// async function enhanceRecommendationsWithAI(
//   questionnaire: Questionnaire,
//   baseRecommendations: HabitRecommendation[]
// ): Promise<HabitRecommendation[]> {
//   const prompt = `Based on the following user profile and base recommendations, enhance and personalize these habit suggestions:

// User Profile:
// - Focus Areas: ${questionnaire.focusAreas?.join(", ") || "Not specified"}
// - Motivation Time: ${questionnaire.motivationTime || "Not specified"}
// - Mood: ${questionnaire.mood || "Not specified"}
// - Motivation Style: ${questionnaire.motivationStyle || "Not specified"}
// - Consistency Rating: ${questionnaire.consistencyRating || "Not specified"}/5
// - Main Distractions: ${questionnaire.mainDistraction || "Not specified"}

// Base Recommendations: ${JSON.stringify(baseRecommendations, null, 2)}

// Please return an enhanced JSON array of exactly 10 habits with personalized descriptions and optimized reminder times based on their profile. Maintain the same structure but improve descriptions and timing.`;

//   try {
//     const openaiClient = await getOpenAI();
//     const response = await openaiClient.chat.completions.create({
//       model: "gpt-4o",
//       messages: [
//         { 
//           role: "system",
//           content: "You are an expert habit coach. Enhance habit recommendations with personalized insights while maintaining the JSON structure.",
//         },
//         { 
//           role: "user",
//           content: prompt,
//         }
//       ],
//       response_format: { type: "json_object" },
//     });

//     const result = JSON.parse(response.choices[0].message.content || "{}");
//     return result.habits || baseRecommendations;
//   } catch (error) {
//     console.error("OpenAI API call failed:", error);
//     return baseRecommendations;
//   }
// }

// export async function generatePersonalizedInsight(
//   habits: any[],
//   completions: any[]
// ): Promise<{ title: string; content: string; type: string }> {
//   // Always return fallback if OpenAI is not properly configured
//   if (!isOpenAIEnabled || !env.openaiApiKey || env.openaiApiKey === "sk-placeholder-key-for-development") {
//     return {
//       title: "Keep Going!",
//       content: "You're building great habits. Consistency is key to success!",
//       type: "motivation"
//     };
//   }

//   try {
//     const habitSummary = habits.map(h => `${h.title} (${h.category})`).join(", ");
//     const recentCompletions = completions.slice(-7);

//     const prompt = `Based on the user's habit data, generate a personalized insight or suggestion:

// User's Habits: ${habitSummary}
// Recent Completions: ${recentCompletions.length} in the last 7 days

// Provide a JSON response with:
// - title: Brief title for the insight
// - content: Helpful, encouraging message with actionable advice (2-3 sentences)
// - type: One of "suggestion", "motivation", "tip"

// Focus on patterns, improvements, or encouragement based on their progress.`;

//     const openaiClient = await getOpenAI();
//     const response = await openaiClient.chat.completions.create({
//       model: "gpt-4o",
//       messages: [
//         {
//           role: "system",
//           content: "You are a supportive habit coach. Provide encouraging, actionable insights.",
//         },
//         {
//           role: "user",
//           content: prompt,
//         }
//       ],
//       response_format: { type: "json_object" },
//     });

//     const result = JSON.parse(response.choices[0].message.content || "{}");
//     return {
//       title: result.title || "Keep Going!",
//       content: result.content || "You're building great habits. Consistency is key to success!",
//       type: result.type || "motivation"
//     };
//   } catch (error) {
//     console.error("Failed to generate AI insight:", error);
//     return {
//       title: "Keep Going!",
//       content: "You're building great habits. Consistency is key to success!",
//       type: "motivation"
//     };
//   }
// }

// const openaiService = {
//   generateHabitRecommendations,
//   generateAIRecommendations,
//   generatePersonalizedInsight
// };

// export default openaiService;