// server/storage.ts
import {
  users,
  habits,
  habitCompletions,
  streaks,
  aiInsights,
  coachingMessages,
  rolePermissions,
  userPermissions,
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
} from "../shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(userData: UpsertUser): Promise<User>;

  // RBAC operations
  getUserPermissions(userId: string): Promise<string[]>;
  hasPermission(userId: string, permission: string): Promise<boolean>;
  grantPermission(userId: string, permission: string, grantedBy?: string): Promise<void>;
  revokePermission(userId: string, permission: string): Promise<void>;
  getRolePermissions(role: string): Promise<string[]>;

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
  convertGuestToUser(guestId: string, userData: Partial<User>): Promise<User>;

  // XP and leveling operations
  updateUserXP(userId: string, xpGained: number): Promise<User>;
  calculateLevel(xp: number): number;

  // Email settings operations
  updateEmailSettings(userId: string, settings: any): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  private db = db;

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await this.db.select().from(users).where(eq(users.id, id));
      if (!user) return undefined;

      return {
        ...user,
        role: user.role || 'user',
        difficulty: user.difficulty || 'medium',
        passwordHash: user.passwordHash || null,
      };
    } catch (error) {
      console.error('Error getting user:', error);
      // ✅ Enhanced error handling for connection issues
      if (error instanceof Error && error.message?.includes('Connection terminated')) {
        console.warn('⚠️ Database connection issue - retrying...');
        // Return undefined to allow fallback behavior
        return undefined;
      }
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await this.db.select().from(users).where(eq(users.email, email));
      if (!user) return undefined;
      
      return {
        ...user,
        role: user.role || 'user',
        difficulty: user.difficulty || 'medium',
        passwordHash: user.passwordHash || null,
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await this.db
        .insert(users)
        .values({
          ...userData,
          role: userData.role || 'user',
          difficulty: userData.difficulty || 'medium',
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.error('Error upserting user:', error);
      // ✅ Enhanced error handling for connection issues
      if (error instanceof Error && error.message?.includes('Connection terminated')) {
        console.warn('⚠️ Database connection issue during user upsert - retrying...');
        throw new Error('Database connection issue - please try again');
      }
      throw error;
    }
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({
        ...userData,
        role: userData.role || 'user',
        difficulty: userData.difficulty || 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  // RBAC operations
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await this.getUser(userId);
      if (!user) return [];

      // Get direct user permissions
      const directPermissions = await this.db
        .select({ permission: userPermissions.permission })
        .from(userPermissions)
        .where(eq(userPermissions.userId, userId));

      // Get role-based permissions
      const roleBasedPermissions = await this.db
        .select({ permission: rolePermissions.permission })
        .from(rolePermissions)
        .where(eq(rolePermissions.role, user.role || 'user'));

      // Combine and deduplicate permissions
      const allPermissions = [
        ...directPermissions.map(p => p.permission),
        ...roleBasedPermissions.map(p => p.permission),
      ];

      return [...new Set(allPermissions)];
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  async grantPermission(userId: string, permission: string, grantedBy?: string): Promise<void> {
    await this.db
      .insert(userPermissions)
      .values({
        userId,
        permission,
        grantedBy,
      })
      .onConflictDoNothing();
  }

  async revokePermission(userId: string, permission: string): Promise<void> {
    await this.db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permission, permission)
        )
      );
  }

  async getRolePermissions(role: string): Promise<string[]> {
    const permissions = await this.db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.role, role));
    return permissions.map(p => p.permission);
  }

  // Habit operations
  async getUserHabits(userId: string): Promise<Habit[]> {
    try {
      return await this.db
        .select()
        .from(habits)
        .where(and(eq(habits.userId, userId), eq(habits.isActive, true)))
        .orderBy(desc(habits.createdAt));
    } catch (error) {
      console.error('Error getting user habits:', error);
      // ✅ Enhanced error handling for connection issues
      if (error instanceof Error && error.message?.includes('Connection terminated')) {
        console.warn('⚠️ Database connection issue during habit fetch - returning empty array');
        return [];
      }
      throw error;
    }
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await this.db.insert(habits).values(habit).returning();
    
    // Initialize streak for new habit
    await this.db.insert(streaks).values({
      habitId: newHabit.id,
      userId: habit.userId,
      currentStreak: 0,
      longestStreak: 0,
    });

    return newHabit;
  }

  async updateHabit(id: number, updates: Partial<InsertHabit>): Promise<Habit> {
    const [updatedHabit] = await this.db
      .update(habits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(habits.id, id))
      .returning();
    return updatedHabit;
  }

  async deleteHabit(id: number): Promise<void> {
    await this.db.update(habits).set({ isActive: false }).where(eq(habits.id, id));
  }

  // Habit completion operations
  async getHabitCompletions(userId: string, date?: string): Promise<HabitCompletion[]> {
    if (date) {
      return await this.db
        .select()
        .from(habitCompletions)
        .where(and(
          eq(habitCompletions.userId, userId),
          eq(habitCompletions.completedAt, date)
        ))
        .orderBy(desc(habitCompletions.createdAt));
    }

    return await this.db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.userId, userId))
      .orderBy(desc(habitCompletions.createdAt));
  }

  async createHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion> {
    const [newCompletion] = await this.db
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

    return newCompletion;
  }

  async deleteHabitCompletion(habitId: number, userId: string, date: string): Promise<void> {
    await this.db
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
    const [streak] = await this.db
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
    await this.db
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
    return await this.db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.userId, userId))
      .orderBy(desc(aiInsights.createdAt))
      .limit(limit);
  }

  async createAIInsight(userId: string, type: string, title: string, content: string): Promise<AIInsight> {
    const [insight] = await this.db
      .insert(aiInsights)
      .values({ userId, type, title, content })
      .returning();
    return insight;
  }

  async markInsightAsRead(id: number): Promise<void> {
    await this.db.update(aiInsights).set({ isRead: true }).where(eq(aiInsights.id, id));
  }

  // Coaching messages operations
  async getCoachingMessages(userId: string, limit: number = 10): Promise<CoachingMessage[]> {
    return await this.db
      .select()
      .from(coachingMessages)
      .where(eq(coachingMessages.userId, userId))
      .orderBy(desc(coachingMessages.createdAt))
      .limit(limit);
  }

  async createCoachingMessage(message: InsertCoachingMessage): Promise<CoachingMessage> {
    const [newMessage] = await this.db
      .insert(coachingMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async markCoachingMessageAsRead(id: number): Promise<void> {
    await this.db
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
      role: 'user',
      difficulty: 'medium',
    });
  }

  async convertGuestToUser(guestId: string, userData: Partial<User>): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({
        ...userData,
        isGuest: false,
        role: userData.role || 'user',
        difficulty: userData.difficulty || 'medium',
        updatedAt: new Date(),
      })
      .where(eq(users.id, guestId))
      .returning();
    return user;
  }

  // async updateUserId(oldId: string, newId: string): Promise<void> {
  //   try {
  //     // Begin transaction to ensure consistency
  //     await this.db.transaction(async (tx) => {
  //       // Update users table
  //       await tx.update(users).set({ id: newId }).where(eq(users.id, oldId));
        
  //       // Update related tables
  //       await tx.update(habits).set({ userId: newId }).where(eq(habits.userId, oldId));
  //       await tx.update(habitCompletions).set({ userId: newId }).where(eq(habitCompletions.userId, oldId));
  //       await tx.update(streaks).set({ userId: newId }).where(eq(streaks.userId, oldId));
  //       await tx.update(aiInsights).set({ userId: newId }).where(eq(aiInsights.userId, oldId));
  //       await tx.update(coachingMessages).set({ userId: newId }).where(eq(coachingMessages.userId, oldId));
  //       await tx.update(userPermissions).set({ userId: newId }).where(eq(userPermissions.userId, oldId));
  //     });
      
  //     console.log(`✅ Updated user ID from ${oldId} to ${newId} across all tables`);
  //   } catch (error) {
  //     console.error('Failed to update user ID:', error);
  //     throw error;
  //   }
  // }
  async updateUserId(oldId: string, newId: string): Promise<void> {
    try {
      // ✅ SIMPLIFIED: Only update tables that definitely exist
      await this.db.transaction(async (tx) => {
        // Update users table
        await tx.update(users).set({ id: newId }).where(eq(users.id, oldId));
        
        // Update core habit-related tables
        await tx.update(habits).set({ userId: newId }).where(eq(habits.userId, oldId));
        await tx.update(habitCompletions).set({ userId: newId }).where(eq(habitCompletions.userId, oldId));
        await tx.update(streaks).set({ userId: newId }).where(eq(streaks.userId, oldId));
        
        // Update AI/coaching tables
        await tx.update(aiInsights).set({ userId: newId }).where(eq(aiInsights.userId, oldId));
        await tx.update(coachingMessages).set({ userId: newId }).where(eq(coachingMessages.userId, oldId));
      });
      
      console.log(`✅ Updated user ID from ${oldId} to ${newId} across core tables`);
    } catch (error) {
      console.error('Failed to update user ID:', error);
      throw error;
    }
  }
  // XP and leveling operations
  async updateUserXP(userId: string, xpGained: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const newXP = (user.xp || 0) + xpGained;
    const newLevel = this.calculateLevel(newXP);

    const [updatedUser] = await this.db
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
    return Math.floor(Math.sqrt(xp / 50)) + 1;
  }

  async updateEmailSettings(userId: string, settings: any): Promise<User> {
    const [user] = await this.db
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

export {
  users,
  habits,
  habitCompletions,
  streaks,
  aiInsights,
  coachingMessages,
  rolePermissions,
  userPermissions,
  User,
  UpsertUser,
  Habit,
  InsertHabit,
  HabitCompletion,
  InsertHabitCompletion,
  Streak,
  AIInsight,
  CoachingMessage,
  InsertCoachingMessage,
  Questionnaire
};
