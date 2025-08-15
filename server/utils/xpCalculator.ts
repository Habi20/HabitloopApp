// server/utils/xpCalculator.ts
import { getDaysDifference, toDateString } from "./timezone.js";

export interface CompletionData {
  id: number;
  habitId: number;
  userId: string;
  completedAt: string;
  value: number;
  createdAt: string;
}

export interface StreakData {
  id: number;
  habitId: number;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: string | null;
  updatedAt: string;
}

export interface XPCalculationResult {
  totalXP: number;
  breakdown: {
    habitId: number;
    habitTitle: string;
    completions: number;
    maxStreak: number;
    xpPerCompletion: number;
    totalHabitXP: number;
    completionDetails: Array<{
      completionId: number;
      completedAt: string;
      streakAtCompletion: number;
      xpEarned: number;
    }>;
  }[];
}

/**
 * Fair XP Calculation System
 * 
 * This system calculates XP based on the actual streak at the time of each completion,
 * rather than applying the maximum streak to all completions retroactively.
 */
export class XPCalculator {
  private static readonly BASE_XP = 10;
  private static readonly STREAK_BONUS_PER_DAY = 2;
  private static readonly MAX_STREAK_BONUS = 20; // Cap at 10 days (10 * 2 = 20)

  /**
   * Calculate XP for a single completion based on its streak at the time
   */
  static calculateXPForCompletion(streakAtCompletion: number): number {
    const streakBonus = Math.min(streakAtCompletion * this.STREAK_BONUS_PER_DAY, this.MAX_STREAK_BONUS);
    return this.BASE_XP + streakBonus;
  }

  /**
   * Calculate the streak at the time of each completion
   */
  static calculateStreakAtCompletion(completions: CompletionData[]): Array<{
    completion: CompletionData;
    streakAtCompletion: number;
  }> {
    if (completions.length === 0) return [];

    // Sort completions by date (oldest first)
    const sortedCompletions = [...completions].sort((a, b) => 
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

    const results: Array<{
      completion: CompletionData;
      streakAtCompletion: number;
    }> = [];

    let currentStreak = 0;
    let previousDate: string | null = null;

    for (const completion of sortedCompletions) {
      const completionDate = toDateString(completion.completedAt);

      if (previousDate === null) {
        // First completion
        currentStreak = 1;
      } else {
        const daysDiff = getDaysDifference(previousDate, completionDate);
        
        if (daysDiff === 1) {
          // Consecutive day
          currentStreak++;
        } else if (daysDiff === 0) {
          // Same day completion, don't change streak
        } else {
          // Gap in days, reset streak
          currentStreak = 1;
        }
      }

      results.push({
        completion,
        streakAtCompletion: currentStreak,
      });

      previousDate = completionDate;
    }

    return results;
  }

  /**
   * Calculate total XP for all completions of a habit
   */
  static calculateHabitXP(completions: CompletionData[], habitTitle: string): {
    habitId: number;
    habitTitle: string;
    completions: number;
    maxStreak: number;
    xpPerCompletion: number;
    totalHabitXP: number;
    completionDetails: Array<{
      completionId: number;
      completedAt: string;
      streakAtCompletion: number;
      xpEarned: number;
    }>;
  } {
    if (completions.length === 0) {
      return {
        habitId: 0,
        habitTitle,
        completions: 0,
        maxStreak: 0,
        xpPerCompletion: 0,
        totalHabitXP: 0,
        completionDetails: [],
      };
    }

    const streakCalculations = this.calculateStreakAtCompletion(completions);
    const completionDetails = streakCalculations.map(({ completion, streakAtCompletion }) => {
      const xpEarned = this.calculateXPForCompletion(streakAtCompletion);
      return {
        completionId: completion.id,
        completedAt: completion.completedAt,
        streakAtCompletion,
        xpEarned,
      };
    });

    const totalHabitXP = completionDetails.reduce((sum, detail) => sum + detail.xpEarned, 0);
    const maxStreak = Math.max(...streakCalculations.map(s => s.streakAtCompletion));
    const avgXPPerCompletion = totalHabitXP / completions.length;

    return {
      habitId: completions[0].habitId,
      habitTitle,
      completions: completions.length,
      maxStreak,
      xpPerCompletion: Math.round(avgXPPerCompletion),
      totalHabitXP,
      completionDetails,
    };
  }

  /**
   * Calculate total XP for all user habits
   */
  static calculateTotalXP(habitsData: Array<{
    habitId: number;
    habitTitle: string;
    completions: CompletionData[];
  }>): XPCalculationResult {
    const breakdown = habitsData.map(({ habitId, habitTitle, completions }) =>
      this.calculateHabitXP(completions, habitTitle)
    );

    const totalXP = breakdown.reduce((sum, habit) => sum + habit.totalHabitXP, 0);

    return {
      totalXP,
      breakdown,
    };
  }

  /**
   * Get XP summary for display
   */
  static getXPSummary(calculation: XPCalculationResult): {
    totalXP: number;
    totalCompletions: number;
    averageXPPerCompletion: number;
    maxStreak: number;
    habitCount: number;
  } {
    const totalCompletions = calculation.breakdown.reduce((sum, habit) => sum + habit.completions, 0);
    const maxStreak = Math.max(...calculation.breakdown.map(h => h.maxStreak));
    const averageXPPerCompletion = totalCompletions > 0 ? calculation.totalXP / totalCompletions : 0;

    return {
      totalXP: calculation.totalXP,
      totalCompletions,
      averageXPPerCompletion: Math.round(averageXPPerCompletion),
      maxStreak,
      habitCount: calculation.breakdown.length,
    };
  }
}

// Export convenience functions
export const calculateXPForCompletion = (streakAtCompletion: number) => 
  XPCalculator.calculateXPForCompletion(streakAtCompletion);

export const calculateHabitXP = (completions: CompletionData[], habitTitle: string) => 
  XPCalculator.calculateHabitXP(completions, habitTitle);

export const calculateTotalXP = (habitsData: Array<{
  habitId: number;
  habitTitle: string;
  completions: CompletionData[];
}>) => XPCalculator.calculateTotalXP(habitsData);

export const getXPSummary = (calculation: XPCalculationResult) => 
  XPCalculator.getXPSummary(calculation);
