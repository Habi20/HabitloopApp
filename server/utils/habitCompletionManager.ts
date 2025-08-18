// server/utils/habitCompletionManager.ts
import { getCurrentDateString, isSameDay } from "./timezone.js";
import { storage } from "../storage.js";

export interface HabitCompletionStatus {
  habitId: number;
  isCompletedToday: boolean;
  isCompletedYesterday: boolean;
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: string | null;
  completionDate: string | null;
  canUncomplete: boolean;
  xpEarned: number;
}

export interface DailyHabitStatus {
  habitId: number;
  habitTitle: string;
  category: string;
  isCompleted: boolean;
  completionTime: string | null;
  streak: number;
  xpEarned: number;
  canUncomplete: boolean;
  isOverdue: boolean;
  reminderTime?: string;
}

/**
 * Habit Completion Manager
 * 
 * Handles all habit completion logic including:
 * - Daily reset functionality with proper Sri Lanka timezone
 * - Streak calculations
 * - XP awarding
 * - Completion status tracking
 * - Gamification features
 */
export class HabitCompletionManager {
  private static readonly BASE_XP = 10;
  private static readonly STREAK_BONUS_PER_DAY = 2;
  private static readonly MAX_STREAK_BONUS = 20;
  private static readonly UNCOMPLETE_WINDOW_HOURS = 24; // Can uncomplete within 24 hours

  /**
   * Get completion status for a specific habit
   */
  static async getHabitCompletionStatus(
    habitId: number, 
    userId: string
  ): Promise<HabitCompletionStatus> {
    const today = getCurrentDateString(); // Uses Sri Lanka timezone
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get all completions for this habit
    const allCompletions = await storage.getHabitCompletions(userId);
    const habitCompletions = allCompletions.filter(c => c.habitId === habitId);
    
    // Get today's completion using Sri Lanka timezone
    const todayCompletion = habitCompletions.find(c => 
      isSameDay(c.completedAt, today)
    );
    
    // Get yesterday's completion using Sri Lanka timezone
    const yesterdayCompletion = habitCompletions.find(c => 
      isSameDay(c.completedAt, yesterdayStr)
    );

    // Get streak data
    const streak = await storage.getStreak(habitId, userId);
    
    // Calculate if can uncomplete (within 24 hours)
    const canUncomplete = todayCompletion ? 
      this.canUncompleteCompletion(todayCompletion.completedAt) : false;

    // Calculate XP earned for today's completion
    const xpEarned = todayCompletion ? 
      this.calculateXPForCompletion(streak?.currentStreak || 1) : 0;

    return {
      habitId,
      isCompletedToday: !!todayCompletion,
      isCompletedYesterday: !!yesterdayCompletion,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      lastCompletedAt: streak?.lastCompletedAt || null,
      completionDate: todayCompletion?.completedAt || null,
      canUncomplete,
      xpEarned,
    };
  }

  /**
   * Get daily status for all user habits
   */
  static async getDailyHabitStatus(userId: string): Promise<DailyHabitStatus[]> {
    const habits = await storage.getUserHabits(userId);
    const allCompletions = await storage.getHabitCompletions(userId);
    const today = getCurrentDateString(); // Uses Sri Lanka timezone

    const dailyStatus: DailyHabitStatus[] = [];

    for (const habit of habits) {
      const habitCompletions = allCompletions.filter(c => c.habitId === habit.id);
      const todayCompletion = habitCompletions.find(c => 
        isSameDay(c.completedAt, today)
      );
      
      const streak = await storage.getStreak(habit.id, userId);
      const canUncomplete = todayCompletion ? 
        this.canUncompleteCompletion(todayCompletion.completedAt) : false;

      dailyStatus.push({
        habitId: habit.id,
        habitTitle: habit.title,
        category: habit.category,
        isCompleted: !!todayCompletion,
        completionTime: todayCompletion?.completedAt || null,
        streak: streak?.currentStreak || 0,
        xpEarned: todayCompletion ? 
          this.calculateXPForCompletion(streak?.currentStreak || 1) : 0,
        canUncomplete,
        isOverdue: false, // TODO: Implement overdue logic
        reminderTime: habit.reminderTime || undefined,
      });
    }

    return dailyStatus;
  }

  /**
   * Complete a habit with proper timezone handling
   */
  static async completeHabit(
    habitId: number, 
    userId: string, 
    value: number = 1
  ): Promise<{
    success: boolean;
    message: string;
    xpEarned: number;
    newStreak: number;
  }> {
    try {
      const today = getCurrentDateString(); // Uses Sri Lanka timezone
      
      // Check if already completed today
      const existingCompletion = await storage.getHabitCompletions(userId);
      const todayCompletion = existingCompletion.find(c => 
        c.habitId === habitId && isSameDay(c.completedAt, today)
      );

      if (todayCompletion) {
        return {
          success: false,
          message: "Habit already completed today",
          xpEarned: 0,
          newStreak: 0,
        };
      }

      // Create completion with proper timezone
      const completionData = {
        habitId,
        userId,
        completedAt: today, // Uses Sri Lanka timezone
        value,
      };

      await storage.createHabitCompletion(completionData);

      // Update streak
      const streak = await this.updateStreak(habitId, userId, today);
      
      // Calculate XP
      const xpEarned = this.calculateXPForCompletion(streak.currentStreak);

      return {
        success: true,
        message: `Habit completed! +${xpEarned} XP earned`,
        xpEarned,
        newStreak: streak.currentStreak,
      };
    } catch (error) {
      console.error("Error completing habit:", error);
      throw new Error("Failed to complete habit");
    }
  }

  /**
   * Uncomplete a habit (delete today's completion)
   */
  static async uncompleteHabit(
    habitId: number, 
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
    xpLost: number;
  }> {
    try {
      const today = getCurrentDateString(); // Uses Sri Lanka timezone
      
      // Get current status
      const status = await this.getHabitCompletionStatus(habitId, userId);
      
      // Check if can uncomplete
      if (!status.canUncomplete) {
        return {
          success: false,
          message: "Cannot uncomplete after 24 hours",
          xpLost: 0
        };
      }

      // Delete today's completion
      const completions = await storage.getHabitCompletions(userId);
      const todayCompletion = completions.find(c => 
        c.habitId === habitId && isSameDay(c.completedAt, today)
      );

      if (!todayCompletion) {
        return {
          success: false,
          message: "No completion found for today",
          xpLost: 0
        };
      }

      // Calculate XP lost before deleting completion
      const xpLost = status.xpEarned;

      // Delete the completion
      await storage.deleteHabitCompletion(habitId, userId, today);
      
      // Recalculate streak
      await this.recalculateStreak(habitId, userId);
      
      // Actually deduct XP from user's total
      if (xpLost > 0) {
        await storage.updateUserXP(userId, -xpLost);
      }

      return {
        success: true,
        message: `Habit uncompleted. -${xpLost} XP lost`,
        xpLost
      };
    } catch (error) {
      console.error("Error uncompleting habit:", error);
      throw new Error("Failed to uncomplete habit");
    }
  }

  /**
   * Check if a completion can be uncompleted (within time window)
   */
  private static canUncompleteCompletion(completionDate: string): boolean {
    const completionTime = new Date(completionDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - completionTime.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff <= this.UNCOMPLETE_WINDOW_HOURS;
  }

  /**
   * Calculate XP for a completion based on streak
   */
  private static calculateXPForCompletion(streak: number): number {
    const streakBonus = Math.min(streak * this.STREAK_BONUS_PER_DAY, this.MAX_STREAK_BONUS);
    return this.BASE_XP + streakBonus;
  }

  /**
   * Update streak for a habit
   */
  private static async updateStreak(habitId: number, userId: string, completionDate: string): Promise<{
    currentStreak: number;
    longestStreak: number;
  }> {
    const streak = await storage.getStreak(habitId, userId);
    const allCompletions = await storage.getHabitCompletions(userId);
    const habitCompletions = allCompletions.filter(c => c.habitId === habitId);
    
    // Sort completions by date
    habitCompletions.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    
    let currentStreak = 1;
    let longestStreak = streak?.longestStreak || 0;
    
    // Calculate current streak
    for (let i = 1; i < habitCompletions.length; i++) {
      const prevDate = new Date(habitCompletions[i - 1].completedAt);
      const currDate = new Date(habitCompletions[i].completedAt);
      const daysDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Update longest streak
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
    
    // Save streak
    await storage.updateStreak(habitId, userId, currentStreak, longestStreak, completionDate);
    
    return { currentStreak, longestStreak };
  }

  /**
   * Recalculate streak after uncompleting
   */
  private static async recalculateStreak(habitId: number, userId: string): Promise<void> {
    const allCompletions = await storage.getHabitCompletions(userId);
    const habitCompletions = allCompletions.filter(c => c.habitId === habitId);
    
    if (habitCompletions.length === 0) {
      // No completions left - reset streak to 0 and set last_completed_at to null
      await storage.updateStreak(habitId, userId, 0, 0, null);
      return;
    }
    
    // Sort completions by date
    habitCompletions.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    
    let currentStreak = 1;
    let longestStreak = 1;
    
    // Calculate streak
    for (let i = 1; i < habitCompletions.length; i++) {
      const prevDate = new Date(habitCompletions[i - 1].completedAt);
      const currDate = new Date(habitCompletions[i].completedAt);
      const daysDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    // Use the most recent completion date, or null if no completions
    const lastCompletedAt = habitCompletions.length > 0 ? habitCompletions[0].completedAt : null;
    await storage.updateStreak(habitId, userId, currentStreak, longestStreak, lastCompletedAt);
  }
}

// Export functions for use in routes
export const getHabitCompletionStatus = (habitId: number, userId: string) =>
  HabitCompletionManager.getHabitCompletionStatus(habitId, userId);

export const getDailyHabitStatus = (userId: string) =>
  HabitCompletionManager.getDailyHabitStatus(userId);

export const completeHabit = (habitId: number, userId: string, value: number = 1) =>
  HabitCompletionManager.completeHabit(habitId, userId, value);

export const uncompleteHabit = (habitId: number, userId: string) =>
  HabitCompletionManager.uncompleteHabit(habitId, userId);
