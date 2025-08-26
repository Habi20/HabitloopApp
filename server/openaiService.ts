import type { Questionnaire } from "../shared/schema";
import { generatePersonalizedHabits } from "./syntheticDatabase";
import { env } from "./env";
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
  userContext?: {
    level: number;
    xp: number;
    existingHabitsCount: number;
    completionRate: number;
  } | null
): Promise<HabitRecommendation[]> {
  try {
    console.log(
      "Generating recommendations for questionnaire:",
      JSON.stringify(questionnaire, null, 2)
    );

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
          icon: "🚶",
        },
        {
          title: "Read a Book",
          description:
            "Read for 20 minutes to expand knowledge and reduce stress",
          category: "Learning",
          targetValue: 20,
          unit: "minutes",
          reminderTime: "20:00",
          frequency: "daily",
          color: "#3B82F6",
          icon: "📚",
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
          icon: "🙏",
        },
      ];
      return fallbackHabits;
    }

    const recommendations: HabitRecommendation[] = syntheticHabits.map(
      (habit) => ({
        title: habit.title,
        description: habit.description,
        category: habit.category,
        targetValue: habit.targetValue,
        unit: habit.unit,
        reminderTime: habit.reminderTime,
        frequency: habit.frequency,
        color: habit.color,
        icon: habit.icon,
      })
    );

    const hasValidOpenAIKey =
      env.OPENAI_API_KEY &&
      env.OPENAI_API_KEY !== "sk-placeholder-key-for-development" &&
      env.OPENAI_API_KEY.startsWith("sk-");

    if (hasValidOpenAIKey) {
      try {
        const enhancedRecommendations = await enhanceRecommendationsWithAI(
          questionnaire,
          recommendations,
          userContext
        );
        return enhancedRecommendations;
      } catch (error: any) {
        console.log(
          "OpenAI enhancement failed, using synthetic recommendations:",
          error.message
        );
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
        icon: "🚶",
      },
      {
        title: "Read a Book",
        description:
          "Read for 20 minutes to expand knowledge and reduce stress",
        category: "Learning",
        targetValue: 20,
        unit: "minutes",
        reminderTime: "20:00",
        frequency: "daily",
        color: "#3B82F6",
        icon: "📚",
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
        icon: "🙏",
      },
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
  userContext?: {
    level: number;
    xp: number;
    existingHabitsCount: number;
    completionRate: number;
  } | null
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
      userXP =
        consistencyRating * 50 + (questionnaire.focusAreas?.length || 1) * 25;

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
          content:
            "You are an expert habit coach. Enhance habit recommendations with personalized insights while maintaining the JSON structure.",
        },
        {
          role: "user",
          content: prompt,
        },
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
  const hasValidOpenAIKey =
    env.OPENAI_API_KEY &&
    env.OPENAI_API_KEY !== "sk-placeholder-key-for-development" &&
    env.OPENAI_API_KEY.startsWith("sk-");

  if (!hasValidOpenAIKey) {
    console.log("OpenAI not configured, returning fallback insight");
    return {
      title: "Keep Going!",
      content: "You're building great habits. Consistency is key to success!",
      type: "motivation",
    };
  }

  try {
    const habitSummary = habits
      .map((h) => `${h.title} (${h.category})`)
      .join(", ");
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
          content:
            "You are a supportive habit coach. Provide encouraging, actionable insights.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      title: result.title || "Keep Going!",
      content:
        result.content ||
        "You're building great habits. Consistency is key to success!",
      type: result.type || "motivation",
    };
  } catch (error) {
    console.error("Failed to generate AI insight:", error);
    return {
      title: "Keep Going!",
      content: "You're building great habits. Consistency is key to success!",
      type: "motivation",
    };
  }
}

const openaiService = {
  generateHabitRecommendations,
  generateAIRecommendations,
  generatePersonalizedInsight,
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
