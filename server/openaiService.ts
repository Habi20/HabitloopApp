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
  questionnaire: Questionnaire
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
        const enhancedRecommendations = await enhanceRecommendationsWithAI(questionnaire, recommendations);
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
  baseRecommendations: HabitRecommendation[]
): Promise<HabitRecommendation[]> {
  const prompt = `Based on the following user profile and base recommendations, enhance and personalize these habit suggestions:

User Profile:
- Focus Areas: ${questionnaire.focusAreas?.join(", ") || "Not specified"}
- Motivation Time: ${questionnaire.motivationTime || "Not specified"}
- Mood: ${questionnaire.mood || "Not specified"}
- Motivation Style: ${questionnaire.motivationStyle || "Not specified"}
- Consistency Rating: ${questionnaire.consistencyRating || "Not specified"}/5
- Main Distractions: ${questionnaire.mainDistraction || "Not specified"}

Base Recommendations: ${JSON.stringify(baseRecommendations, null, 2)}

Please return an enhanced JSON array of exactly 10 habits with personalized descriptions and optimized reminder times based on their profile. Maintain the same structure but improve descriptions and timing.`;

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

const openaiService = {
  generateHabitRecommendations,
  generateAIRecommendations,
  generatePersonalizedInsight
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