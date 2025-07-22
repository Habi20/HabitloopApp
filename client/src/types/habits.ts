import type { Habit as SchemaHabit, HabitCompletion } from "../../../shared";

export interface Habit extends Omit<SchemaHabit, "description"> {
  description?: string | null; // Accept undefined or null explicitly
  completions?: HabitCompletion[];
  streak?: {
    currentStreak: number;
    longestStreak: number;
  };
}

// HabitRecommendation and export as before
export interface HabitRecommendation {
  id?: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  unit: string;
  reminderTime: string;
  color: string;
  icon: string;
  frequency?: string;
  difficulty?: "easy" | "medium" | "hard";
  successRate?: number;
  aiReasoning?: string;
  benefits?: string[];
  tips?: string[];
}

export type { HabitCompletion };
