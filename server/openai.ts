import OpenAI from "openai";
import type { Questionnaire } from "@shared/schema";
import { generatePersonalizedHabits, filterHabitsByProfile, type SyntheticHabit } from "./syntheticDatabase";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "default_key"
});

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
  // Primary strategy: Use synthetic database for fast, reliable recommendations
  const syntheticHabits = generatePersonalizedHabits(questionnaire);
  
  // Convert synthetic habits to the expected format
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

  // Optional: Enhance with OpenAI if API key is available and working
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "default_key") {
    try {
      const enhancedRecommendations = await enhanceRecommendationsWithAI(questionnaire, recommendations);
      return enhancedRecommendations;
    } catch (error: any) {
      console.log("OpenAI enhancement failed, using synthetic recommendations:", error.message);
    }
  }

  return recommendations;
}

async function enhanceRecommendationsWithAI(
  questionnaire: Questionnaire, 
  baseRecommendations: HabitRecommendation[]
): Promise<HabitRecommendation[]> {
  const prompt = `Based on the following user profile and base recommendations, enhance and personalize these habit suggestions:

User Profile:
- Focus Areas: ${questionnaire.focusAreas.join(", ")}
- Motivation Time: ${questionnaire.motivationTime}
- Mood: ${questionnaire.mood || "Not specified"}
- Motivation Style: ${questionnaire.motivationStyle || "Not specified"}
- Consistency Rating: ${questionnaire.consistencyRating || "Not specified"}/5
- Main Distractions: ${questionnaire.mainDistraction || "Not specified"}

Base Recommendations: ${JSON.stringify(baseRecommendations, null, 2)}

Please return an enhanced JSON array of exactly 10 habits with personalized descriptions and optimized reminder times based on their profile. Maintain the same structure but improve descriptions and timing.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "You are an expert habit coach. Enhance habit recommendations with personalized insights while maintaining the JSON structure.",
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
}

export async function generatePersonalizedInsight(
  userId: string,
  habits: any[],
  completions: any[]
): Promise<{ title: string; content: string; type: string }> {
  try {
    const habitSummary = habits.map(h => `${h.title} (${h.category})`).join(", ");
    const recentCompletions = completions.slice(-7); // Last 7 days
    
    const prompt = `Based on the user's habit data, generate a personalized insight or suggestion:

User's Habits: ${habitSummary}
Recent Completions: ${recentCompletions.length} in the last 7 days

Provide a JSON response with:
- title: Brief title for the insight
- content: Helpful, encouraging message with actionable advice (2-3 sentences)
- type: One of "suggestion", "motivation", "tip"

Focus on patterns, improvements, or encouragement based on their progress.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a supportive habit coach. Provide encouraging, actionable insights.",
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
