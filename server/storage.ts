import {
  users,
  habits,
  habitCompletions,
  streaks,
  aiInsights,
  coachingMessages,
  type User,
  type UpsertUser,
  type Habit,
  type InsertHabit,
  type HabitCompletion,
  type InsertHabitCompletion,
  type Streak,
  type AIInsight,
  type CoachingMessage,
  type InsertCoachingMessage,
  type Questionnaire,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Habit operations
  getUserHabits(userId: string): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: number, updates: Partial<InsertHabit>): Promise<Habit>;
  deleteHabit(id: number): Promise<void>;
  
  // Habit completion operations
  getHabitCompletions(userId: string, date?: string): Promise<HabitCompletion[]>;
  createHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion>;
  deleteHabitCompletion(habitId: number, userId: string, date: string): Promise<void>;
  
  // Streak operations
  getStreak(habitId: number, userId: string): Promise<Streak | undefined>;
  updateStreak(habitId: number, userId: string, currentStreak: number, longestStreak: number, lastCompletedAt: string): Promise<void>;
  
  // AI insights operations
  getAIInsights(userId: string, limit?: number): Promise<AIInsight[]>;
  createAIInsight(userId: string, type: string, title: string, content: string): Promise<AIInsight>;
  markInsightAsRead(id: number): Promise<void>;
  
  // Coaching messages operations
  getCoachingMessages(userId: string, limit?: number): Promise<CoachingMessage[]>;
  createCoachingMessage(message: InsertCoachingMessage): Promise<CoachingMessage>;
  markCoachingMessageAsRead(id: number): Promise<void>;
  
  // Guest user operations
  createGuestUser(): Promise<User>;
  convertGuestToUser(guestId: string, userData: Partial<UpsertUser>): Promise<User>;
  
  // XP and leveling operations
  updateUserXP(userId: string, xpGained: number): Promise<User>;
  calculateLevel(xp: number): number;
  
  // Email settings operations
  updateEmailSettings(userId: string, settings: any): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Habit operations
  async getUserHabits(userId: string): Promise<Habit[]> {
    return await db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, userId), eq(habits.isActive, true)))
      .orderBy(desc(habits.createdAt));
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await db.insert(habits).values(habit).returning();
    
    // Initialize streak for new habit
    await db.insert(streaks).values({
      habitId: newHabit.id,
      userId: habit.userId,
      currentStreak: 0,
      longestStreak: 0,
    });
    
    return newHabit;
  }

  async updateHabit(id: number, updates: Partial<InsertHabit>): Promise<Habit> {
    const [updatedHabit] = await db
      .update(habits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(habits.id, id))
      .returning();
    return updatedHabit;
  }

  async deleteHabit(id: number): Promise<void> {
    await db.update(habits).set({ isActive: false }).where(eq(habits.id, id));
  }

  // Habit completion operations
  async getHabitCompletions(userId: string, date?: string): Promise<HabitCompletion[]> {
    if (date) {
      return await db
        .select()
        .from(habitCompletions)
        .where(and(
          eq(habitCompletions.userId, userId),
          eq(habitCompletions.completedAt, date)
        ))
        .orderBy(desc(habitCompletions.createdAt));
    }

    return await db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.userId, userId))
      .orderBy(desc(habitCompletions.createdAt));
  }

  async createHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion> {
    const [newCompletion] = await db
      .insert(habitCompletions)
      .values(completion)
      .returning();
    
    // Update streak
    await this.updateStreakOnCompletion(completion.habitId, completion.userId, completion.completedAt);
    
    // Award XP for habit completion
    const baseXP = 10; // Base XP for completing any habit
    const streak = await this.getStreak(completion.habitId, completion.userId);
    const streakBonus = Math.min((streak?.currentStreak || 0) * 2, 20); // Up to 20 bonus XP for streaks
    const totalXP = baseXP + streakBonus;
    
    await this.updateUserXP(completion.userId, totalXP);
    
    // Trigger coaching engine for milestone celebrations
    const { coachingEngine } = await import("./coachingEngine");
    await coachingEngine.processHabitCompletion(completion.userId, completion.habitId);
    
    return newCompletion;
  }

  async deleteHabitCompletion(habitId: number, userId: string, date: string): Promise<void> {
    await db
      .delete(habitCompletions)
      .where(
        and(
          eq(habitCompletions.habitId, habitId),
          eq(habitCompletions.userId, userId),
          eq(habitCompletions.completedAt, date)
        )
      );
  }

  // Streak operations
  async getStreak(habitId: number, userId: string): Promise<Streak | undefined> {
    const [streak] = await db
      .select()
      .from(streaks)
      .where(and(eq(streaks.habitId, habitId), eq(streaks.userId, userId)));
    return streak;
  }

  async updateStreak(
    habitId: number, 
    userId: string, 
    currentStreak: number, 
    longestStreak: number, 
    lastCompletedAt: string
  ): Promise<void> {
    await db
      .update(streaks)
      .set({
        currentStreak,
        longestStreak,
        lastCompletedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(streaks.habitId, habitId), eq(streaks.userId, userId)));
  }

  private async updateStreakOnCompletion(habitId: number, userId: string, completedAt: string): Promise<void> {
    const streak = await this.getStreak(habitId, userId);
    if (!streak) return;

    const completedDate = new Date(completedAt);
    const lastCompletedDate = streak.lastCompletedAt ? new Date(streak.lastCompletedAt) : null;
    
    let newCurrentStreak = 1;
    if (lastCompletedDate) {
      const daysDiff = Math.floor((completedDate.getTime() - lastCompletedDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        newCurrentStreak = (streak.currentStreak || 0) + 1;
      } else if (daysDiff > 1) {
        newCurrentStreak = 1; // Reset streak if gap
      }
    }

    const newLongestStreak = Math.max(streak.longestStreak || 0, newCurrentStreak);

    await this.updateStreak(habitId, userId, newCurrentStreak, newLongestStreak, completedAt);
  }

  // AI insights operations
  async getAIInsights(userId: string, limit: number = 5): Promise<AIInsight[]> {
    return await db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.userId, userId))
      .orderBy(desc(aiInsights.createdAt))
      .limit(limit);
  }

  async createAIInsight(userId: string, type: string, title: string, content: string): Promise<AIInsight> {
    const [insight] = await db
      .insert(aiInsights)
      .values({ userId, type, title, content })
      .returning();
    return insight;
  }

  async markInsightAsRead(id: number): Promise<void> {
    await db.update(aiInsights).set({ isRead: true }).where(eq(aiInsights.id, id));
  }

  // Coaching messages operations
  async getCoachingMessages(userId: string, limit: number = 10): Promise<CoachingMessage[]> {
    return await db
      .select()
      .from(coachingMessages)
      .where(eq(coachingMessages.userId, userId))
      .orderBy(desc(coachingMessages.createdAt))
      .limit(limit);
  }

  async createCoachingMessage(message: InsertCoachingMessage): Promise<CoachingMessage> {
    const [newMessage] = await db
      .insert(coachingMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async markCoachingMessageAsRead(id: number): Promise<void> {
    await db
      .update(coachingMessages)
      .set({ isRead: true })
      .where(eq(coachingMessages.id, id));
  }

  // Guest user operations
  async createGuestUser(): Promise<User> {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return await this.upsertUser({
      id: guestId,
      isGuest: true,
      level: 1,
      xp: 0,
    });
  }

  async convertGuestToUser(guestId: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        isGuest: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, guestId))
      .returning();
    return user;
  }

  // XP and leveling operations
  async updateUserXP(userId: string, xpGained: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const newXP = (user.xp || 0) + xpGained;
    const newLevel = this.calculateLevel(newXP);

    const [updatedUser] = await db
      .update(users)
      .set({
        xp: newXP,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  calculateLevel(xp: number): number {
    // Level progression: Level 1 = 0-99 XP, Level 2 = 100-249 XP, Level 3 = 250-449 XP, etc.
    // Formula: Level = floor(sqrt(XP/50)) + 1
    return Math.floor(Math.sqrt(xp / 50)) + 1;
  }

  async updateEmailSettings(userId: string, settings: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        emailSettings: settings,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
