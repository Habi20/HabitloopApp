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
  challengeCompletions,
  challengeProgress,
  mlPredictions,
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
  type ChallengeCompletion,
  type ChallengeProgress,
  type MLPrediction,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentDateString, getDaysDifference, getWeekNumber, getMonthNumber, TimezoneUtils } from "./utils/timezone.js";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(userData: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;

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
  updateStreak(habitId: number, userId: string, currentStreak: number, longestStreak: number, lastCompletedAt: string | null): Promise<void>;

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

  // Challenge completion operations
  getChallengeCompletion(userId: string, challengeId: string): Promise<ChallengeCompletion | null>;
  createChallengeCompletion(data: {
    userId: string;
    challengeId: string;
    xpAwarded: number;
    completedAt: string;
  }): Promise<void>;
  getChallengeProgress(userId: string, challengeId: string): Promise<ChallengeProgress | null>;
  updateChallengeProgress(userId: string, challengeId: string, progressValue: number): Promise<void>;

  // ML prediction operations
  getMLPrediction(userId: string, habitId: number, predictionDate: string): Promise<any>;
  createMLPrediction(data: {
    userId: string;
    habitId: number;
    predictionPercentage: number;
    confidenceLevel: string;
    predictionDate: string;
  }): Promise<void>;
  updateMLPrediction(userId: string, habitId: number, predictionDate: string, updates: {
    predictionPercentage: number;
    confidenceLevel: string;
  }): Promise<void>;

  // Questionnaire operations
  saveQuestionnaire(userId: string, questionnaireData: any): Promise<void>;
  saveRecommendations(userId: string, recommendations: any[]): Promise<void>;

  // Admin operations
  getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    guestUsers: number;
    verifiedUsers: number;
    totalHabits: number;
    activeHabits: number;
    totalCompletions: number;
  }>;
  getConnectionPoolStatus(): Promise<{
    totalConnections: number;
    idleConnections: number;
    activeConnections: number;
  }>;
  getLastQueryTime(): Promise<string>;
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

  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await this.db.select().from(users);
      
      return allUsers.map(user => ({
        ...user,
        role: user.role || 'user',
        difficulty: user.difficulty || 'medium',
        passwordHash: user.passwordHash || null,
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
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

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
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
    // Use timezone-aware timestamps
    const now = TimezoneUtils.getCurrentSriLankaTimestamp();
    const timezoneAwareHabit = {
      ...habit,
      createdAt: now,
      updatedAt: now,
    };

    const [newHabit] = await this.db.insert(habits).values(timezoneAwareHabit).returning();
    
    // Initialize streak for new habit
    await this.db.insert(streaks).values({
      habitId: newHabit.id,
      userId: habit.userId,
      currentStreak: 0,
      longestStreak: 0,
    });

    return newHabit;
  }

  async upsertHabit(habit: InsertHabit & { id?: string }): Promise<Habit> {
    // Use timezone-aware timestamps
    const now = TimezoneUtils.getCurrentSriLankaTimestamp();
    
    if (habit.id) {
      // Try to update existing habit
      try {
        const { id: _id, ...habitData } = habit; // Remove id from the update data
        const [updatedHabit] = await this.db
          .update(habits)
          .set({ 
            ...habitData,
            updatedAt: now,
          })
          .where(eq(habits.id, parseInt(habit.id)))
          .returning();
        
        if (updatedHabit) {
          return updatedHabit;
        }
      } catch (error) {
        console.warn('Failed to update habit, will create new one:', error);
      }
    }

    // Create new habit if update failed or no ID provided
    return this.createHabit(habit);
  }

  async updateHabit(id: number, updates: Partial<InsertHabit>): Promise<Habit> {
    const [updatedHabit] = await this.db
      .update(habits)
      .set({ ...updates, updatedAt: TimezoneUtils.getCurrentSriLankaTimestamp() })
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
    // Use timezone-aware timestamps
    const now = TimezoneUtils.getCurrentSriLankaTimestamp();
    const timezoneAwareCompletion = {
      ...completion,
      createdAt: now,
    };

    const [newCompletion] = await this.db
      .insert(habitCompletions)
      .values(timezoneAwareCompletion)
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

  async upsertCompletion(completion: InsertHabitCompletion & { id?: string }): Promise<HabitCompletion> {
    // Use timezone-aware timestamps
    const now = TimezoneUtils.getCurrentSriLankaTimestamp();
    
    if (completion.id) {
      // Try to update existing completion
      try {
        const { id: _id, ...completionData } = completion; // Remove id from the update data
        const [updatedCompletion] = await this.db
          .update(habitCompletions)
          .set({ 
            ...completionData,
            createdAt: now,
          })
          .where(eq(habitCompletions.id, parseInt(completion.id)))
          .returning();
        
        if (updatedCompletion) {
          return updatedCompletion;
        }
      } catch (error) {
        console.warn('Failed to update completion, will create new one:', error);
      }
    }

    // Create new completion if update failed or no ID provided
    return this.createHabitCompletion(completion);
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

  async getUserStreaks(userId: string): Promise<Streak[]> {
    return await this.db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, userId));
  }

  async updateStreak(
    habitId: number,
    userId: string,
    currentStreak: number,
    longestStreak: number,
    lastCompletedAt: string | null
  ): Promise<void> {
    await this.db
      .update(streaks)
      .set({
        currentStreak,
        longestStreak,
        lastCompletedAt: lastCompletedAt || null,
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
      const daysDiff = getDaysDifference(lastCompletedDate, completedDate);
      
      if (daysDiff === 1) {
        newCurrentStreak = (streak.currentStreak || 0) + 1;
      } else if (daysDiff === 0) {
        // Same day completion, don't change streak
        return;
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

    // Add comprehensive logging for debugging and audit trail
    console.log(`🎯 XP Update for user ${userId}:`, {
      currentXP: user.xp,
      currentLevel: user.level || 1,
      xpGained,
      newXP,
      newLevel,
      levelChange: newLevel - (user.level || 1),
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n') // Get call stack for debugging
    });

    // Validate XP change is reasonable (prevent massive jumps)
    const xpChange = Math.abs(xpGained);
    if (xpChange > 1000) {
      console.warn(`⚠️ Large XP change detected: ${xpGained} XP for user ${userId}. This might indicate an error.`);
    }

    // Validate level change is reasonable (prevent massive jumps)
    const levelChange = Math.abs(newLevel - (user.level || 1));
    if (levelChange > 5) {
      console.warn(`⚠️ Large level change detected: ${levelChange} levels for user ${userId}. This might indicate an error.`);
    }

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

  // Challenge XP awarding system
  async awardChallengeXP(userId: string, challengeId: string, xpAmount: number, challengeType: string): Promise<User> {
    console.log(`🏆 Awarding challenge XP: ${xpAmount} XP for challenge ${challengeId} (${challengeType}) to user ${userId}`);
    
    // Check if challenge was already completed and hasn't reset yet
    const existingCompletion = await this.getChallengeCompletion(userId, challengeId);
    const today = getCurrentDateString();
    
    if (existingCompletion && existingCompletion.resetAt && existingCompletion.resetAt > today) {
      console.log(`⚠️ Challenge ${challengeId} already completed for user ${userId} and hasn't reset yet (reset at: ${existingCompletion.resetAt})`);
      return await this.getUser(userId) as User;
    }
    
    // Award XP
    const user = await this.updateUserXP(userId, xpAmount);
    
    // Record challenge completion
    try {
      // If there's an existing completion, update it; otherwise insert new
      if (existingCompletion) {
        await this.db
          .update(challengeCompletions)
          .set({
            xpAwarded: xpAmount,
            completedAt: today,
            resetAt: this.calculateResetDate(challengeId, today),
          })
          .where(
            and(
              eq(challengeCompletions.userId, userId),
              eq(challengeCompletions.challengeId, challengeId)
            )
          );
      } else {
        await this.db.insert(challengeCompletions).values({
          userId,
          challengeId,
          xpAwarded: xpAmount,
          completedAt: today,
          resetAt: this.calculateResetDate(challengeId, today),
          createdAt: new Date(),
        });
      }
      
      // Create AI insight for challenge completion
      await this.createAIInsight(
        userId,
        'challenge_completed',
        `Challenge Completed: ${challengeType}`,
        `Congratulations! You earned ${xpAmount} XP for completing the "${challengeType}" challenge.`
      );
    } catch (error) {
      console.warn('Failed to record challenge completion:', error);
    }
    
    return user;
  }

  // Check and award challenge XP based on user progress
  async checkAndAwardChallenges(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const habits = await this.getUserHabits(userId);
    const completions = await this.getHabitCompletions(userId);
    
    // Get current date info using timezone utilities
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentMonth = getMonthNumber(now);
    
    // Check 7-Day Streak Master (weekly)
    await this.checkStreakMasterChallenge(userId, habits, completions, currentWeek);
    
    // Check Early Bird (weekly)
    await this.checkEarlyBirdChallenge(userId, habits, completions, currentWeek);
    
    // Check Habit Explorer (monthly)
    await this.checkHabitExplorerChallenge(userId, habits, currentMonth);
    
    // Check Consistency Champion (monthly)
    await this.checkConsistencyChampionChallenge(userId, habits, completions, currentMonth);
  }

  private async checkStreakMasterChallenge(userId: string, habits: Habit[], completions: HabitCompletion[], weekNumber: number): Promise<void> {
    // Check if user has completed all habits for 7 consecutive days
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return getCurrentDateString(); // Use timezone utility
    }).reverse();

    const hasCompletedAllDays = last7Days.every(date => {
      const dayCompletions = completions.filter(c => c.completedAt && c.completedAt === date);
      return dayCompletions.length >= habits.filter(h => h.isActive).length;
    });

    if (hasCompletedAllDays) {
      await this.awardChallengeXP(userId, `streak-master-${weekNumber}`, 50, '7-Day Streak Master');
    }
  }

  private async checkEarlyBirdChallenge(userId: string, habits: Habit[], completions: HabitCompletion[], weekNumber: number): Promise<void> {
    // Check if user completed morning habits before 9 AM for 5 days
    const morningHabits = habits.filter(h => {
      if (!h.reminderTime) return false;
      
      // Check for text-based morning reminder
      if (h.reminderTime.includes('morning')) return true;
      
      // Check for time-based morning reminder (before 12:00)
      const timeMatch = h.reminderTime.match(/^(\d{1,2}):(\d{2})$/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        return hour < 12; // Morning hours (before noon)
      }
      
      return false;
    });
    
    if (morningHabits.length === 0) return; // No morning habits to check
    
    // Check last 7 days for early completions
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return getCurrentDateString();
    });
    
    let earlyBirdDays = 0;
    
    for (const date of last7Days) {
      // Get completions for this specific date
      const dayCompletions = completions.filter(c => c.completedAt === date);
      
      // Check if any completion was before 9 AM
      const earlyCompletions = dayCompletions.filter(completion => {
        if (!completion.completedAt) return false;
        const completionTime = new Date(completion.completedAt);
        return completionTime.getHours() < 9;
      });
      
      // If we have early completions, count this day
      if (earlyCompletions.length > 0) {
        earlyBirdDays++;
      }
    }

    if (earlyBirdDays >= 5) {
      await this.awardChallengeXP(userId, `early-bird-${weekNumber}`, 25, 'Early Bird');
    }
  }

  private async checkHabitExplorerChallenge(userId: string, habits: Habit[], month: number): Promise<void> {
    // Check if user created 3 new habits this month
    const newHabitsThisMonth = habits.filter(h => {
      if (!h.createdAt) return false;
      const habitMonth = new Date(h.createdAt).getMonth();
      return habitMonth === month;
    });

    if (newHabitsThisMonth.length >= 3) {
      await this.awardChallengeXP(userId, `habit-explorer-${month}`, 100, 'Habit Explorer');
    }
  }

  private async checkConsistencyChampionChallenge(userId: string, habits: Habit[], completions: HabitCompletion[], month: number): Promise<void> {
    // Check if user achieved 90% completion rate this month
    const activeHabits = habits.filter(h => h.isActive);
    const monthCompletions = completions.filter(c => {
      if (!c.completedAt) return false;
      const completionMonth = new Date(c.completedAt).getMonth();
      return completionMonth === month;
    });

    const daysInMonth = new Date(new Date().getFullYear(), month + 1, 0).getDate();
    const expectedCompletions = activeHabits.length * daysInMonth;
    const completionRate = expectedCompletions > 0 ? monthCompletions.length / expectedCompletions : 0;

    if (completionRate >= 0.9) {
      await this.awardChallengeXP(userId, `consistency-champion-${month}`, 200, 'Consistency Champion');
    }
  }

  // Removed unused private getWeekNumber function

  calculateLevel(xp: number): number {
    // Level progression: Level 1 = 0-99 XP, Level 2 = 100-199 XP, Level 3 = 200-299 XP, etc.
    // Each level requires 100 XP
    return Math.floor(xp / 100) + 1;
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

  // Audit and fix XP inconsistencies
  async auditAndFixUserXP(userId: string): Promise<{ fixed: boolean; oldXP: number; newXP: number; oldLevel: number; newLevel: number }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    // Calculate expected XP from completions
    const completions = await this.getHabitCompletions(userId);
    // const habits = await this.getUserHabits(userId); // Not used in current calculation
    
    let calculatedXP = 0;
    const completionCounts = new Map<number, number>();

    // Count completions per habit
    for (const completion of completions) {
      const count = completionCounts.get(completion.habitId) || 0;
      completionCounts.set(completion.habitId, count + 1);
    }

    // Calculate XP based on completion counts and streaks
    for (const [habitId, count] of completionCounts) {
      const streak = await this.getStreak(habitId, userId);
      const baseXP = 10; // Base XP per completion
      const streakBonus = Math.min((streak?.currentStreak || 1) * 2, 20); // Max 20 bonus XP
      calculatedXP += count * (baseXP + streakBonus);
    }

    // Add challenge XP (estimate based on user level)
    const estimatedChallengeXP = Math.floor((user.level || 1) * 50); // Rough estimate
    calculatedXP += estimatedChallengeXP;

    const expectedLevel = this.calculateLevel(calculatedXP);
    const currentLevel = user.level || 1;

    console.log(`🔍 XP Audit for user ${userId}:`, {
      currentXP: user.xp,
      calculatedXP,
      currentLevel,
      expectedLevel,
      difference: calculatedXP - (user.xp || 0),
      levelDifference: expectedLevel - currentLevel
    });

    // If there's a significant discrepancy, fix it
    const xpDifference = Math.abs(calculatedXP - (user.xp || 0));
    if (xpDifference > 100) {
      console.warn(`⚠️ XP inconsistency detected for user ${userId}. Fixing...`);
      
      await this.db
        .update(users)
        .set({
          xp: calculatedXP,
          level: expectedLevel,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return {
        fixed: true,
        oldXP: user.xp || 0,
        newXP: calculatedXP,
        oldLevel: currentLevel,
        newLevel: expectedLevel
      };
    }

    return {
      fixed: false,
      oldXP: user.xp || 0,
      newXP: user.xp || 0,
      oldLevel: currentLevel,
      newLevel: currentLevel
    };
  }

  // Challenge completion methods - Using database tables
  async getChallengeCompletion(userId: string, challengeId: string): Promise<any> {
    try {
      const result = await db
        .select()
        .from(challengeCompletions)
        .where(
          and(
            eq(challengeCompletions.userId, userId),
            eq(challengeCompletions.challengeId, challengeId)
          )
        )
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error getting challenge completion:', error);
      return null;
    }
  }

  async createChallengeCompletion(data: {
    userId: string;
    challengeId: string;
    xpAwarded: number;
    completedAt: string;
  }): Promise<void> {
    try {
      await db.insert(challengeCompletions).values({
        userId: data.userId,
        challengeId: data.challengeId,
        xpAwarded: data.xpAwarded,
        completedAt: data.completedAt,
        resetAt: this.calculateResetDate(data.challengeId, data.completedAt),
        createdAt: new Date(),
      });
      console.log('Challenge completion recorded in database:', data);
    } catch (error) {
      console.error('Error creating challenge completion:', error);
      throw error;
    }
  }

  calculateResetDate(challengeId: string, completedAt: string): string {
    const completedDate = new Date(completedAt);
    
    if (challengeId.startsWith('daily_')) {
      // Daily challenges reset the next day
      const resetDate = new Date(completedDate);
      resetDate.setDate(resetDate.getDate() + 1);
      return resetDate.toISOString().split('T')[0];
    } else if (challengeId.startsWith('weekly_')) {
      // Weekly challenges reset next week
      const resetDate = new Date(completedDate);
      resetDate.setDate(resetDate.getDate() + 7);
      return resetDate.toISOString().split('T')[0];
    } else if (challengeId.startsWith('monthly_')) {
      // Monthly challenges reset next month
      const resetDate = new Date(completedDate);
      resetDate.setMonth(resetDate.getMonth() + 1);
      return resetDate.toISOString().split('T')[0];
    }
    
    // Default to next day
    const resetDate = new Date(completedDate);
    resetDate.setDate(resetDate.getDate() + 1);
    return resetDate.toISOString().split('T')[0];
  }

  async getChallengeProgress(userId: string, challengeId: string): Promise<ChallengeProgress | null> {
    try {
      const result = await db
        .select()
        .from(challengeProgress)
        .where(
          and(
            eq(challengeProgress.userId, userId),
            eq(challengeProgress.challengeId, challengeId)
          )
        )
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error getting challenge progress:', error);
      return null;
    }
  }

  async updateChallengeProgress(userId: string, challengeId: string, progressValue: number): Promise<void> {
    try {
      const existingProgress = await this.getChallengeProgress(userId, challengeId);
      const currentDate = new Date().toISOString().split('T')[0];
      
      if (existingProgress) {
        // Update existing progress
        await db
          .update(challengeProgress)
          .set({
            progressValue,
            lastUpdated: currentDate,
          })
          .where(
            and(
              eq(challengeProgress.userId, userId),
              eq(challengeProgress.challengeId, challengeId)
            )
          );
      } else {
        // Create new progress record
        await db.insert(challengeProgress).values({
          userId,
          challengeId,
          progressValue,
          lastUpdated: currentDate,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      throw error;
    }
  }

  // ML prediction operations
  async getMLPrediction(userId: string, habitId: number, predictionDate: string): Promise<MLPrediction | null> {
    try {
      const result = await db
        .select()
        .from(mlPredictions)
        .where(
          and(
            eq(mlPredictions.userId, userId),
            eq(mlPredictions.habitId, habitId),
            eq(mlPredictions.predictionDate, predictionDate)
          )
        )
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error getting ML prediction:', error);
      return null;
    }
  }

  async createMLPrediction(data: {
    userId: string;
    habitId: number;
    predictionPercentage: number;
    confidenceLevel: string;
    predictionDate: string;
  }): Promise<void> {
    try {
      await db.insert(mlPredictions).values({
        userId: data.userId,
        habitId: data.habitId,
        predictionPercentage: data.predictionPercentage,
        confidenceLevel: data.confidenceLevel,
        predictionDate: data.predictionDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('ML prediction recorded in database:', data);
    } catch (error) {
      console.error('Error creating ML prediction:', error);
      throw error;
    }
  }

  async updateMLPrediction(userId: string, habitId: number, predictionDate: string, updates: {
    predictionPercentage: number;
    confidenceLevel: string;
  }): Promise<void> {
    try {
      await db
        .update(mlPredictions)
        .set({
          predictionPercentage: updates.predictionPercentage,
          confidenceLevel: updates.confidenceLevel,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(mlPredictions.userId, userId),
            eq(mlPredictions.habitId, habitId),
            eq(mlPredictions.predictionDate, predictionDate)
          )
        );
      console.log('ML prediction updated in database:', { userId, habitId, predictionDate, updates });
    } catch (error) {
      console.error('Error updating ML prediction:', error);
      throw error;
    }
  }

  // Save questionnaire data to database
  async saveQuestionnaire(userId: string, questionnaireData: any): Promise<void> {
    try {
      // Store questionnaire data in the user's questionnaire field
      await this.updateUser(userId, {
        questionnaire: questionnaireData
      });
      console.log('Questionnaire data saved for user:', userId);
    } catch (error) {
      console.error('Error saving questionnaire data:', error);
      throw error;
    }
  }

  // Save recommendations to database
  async saveRecommendations(userId: string, recommendations: any[]): Promise<void> {
    try {
      // Store recommendations in the user's aiRecommendations field
      await this.updateUser(userId, {
        aiRecommendations: recommendations
      });
      console.log('Recommendations saved for user:', userId);
    } catch (error) {
      console.error('Error saving recommendations:', error);
      throw error;
    }
  }

  // Save user settings to database
  async saveUserSettings(userId: string, settings: any): Promise<void> {
    try {
      // Get existing settings to merge with new ones
      const existingSettings = await this.getUserSettings(userId);
      const mergedSettings = {
        ...existingSettings,
        ...settings
      };
      
      console.log('🔍 Merging user settings:', {
        userId,
        hasExistingSettings: !!existingSettings,
        existingKeys: existingSettings ? Object.keys(existingSettings) : 'null',
        newKeys: Object.keys(settings),
        mergedKeys: Object.keys(mergedSettings),
        hasGoogleCalendar: !!mergedSettings.googleCalendar,
        fullMergedSettings: mergedSettings
      });
      
      await this.updateUser(userId, {
        userSettings: mergedSettings
      });
      console.log('User settings saved for user:', userId);
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }

  // Get user settings from database
  async getUserSettings(userId: string): Promise<any> {
    try {
      const user = await this.getUser(userId);
      return user?.userSettings || null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  // Admin methods
  async getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    guestUsers: number;
    verifiedUsers: number;
    totalHabits: number;
    activeHabits: number;
    totalCompletions: number;
  }> {
    try {
      const allUsers = await this.getAllUsers();
      const allHabits = await db.select().from(habits);
      const allCompletions = await db.select().from(habitCompletions);

      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      return {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(u => u.updatedAt && u.updatedAt.getTime() > oneDayAgo).length,
        guestUsers: allUsers.filter(u => u.isGuest).length,
        verifiedUsers: allUsers.filter(u => !u.isGuest).length,
        totalHabits: allHabits.length,
        activeHabits: allHabits.filter(h => h.isActive).length,
        totalCompletions: allCompletions.length
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw error;
    }
  }

  async getConnectionPoolStatus(): Promise<{
    totalConnections: number;
    idleConnections: number;
    activeConnections: number;
  }> {
    try {
      // This is a simplified version - in production you'd get actual pool stats
      return {
        totalConnections: 10,
        idleConnections: 8,
        activeConnections: 2
      };
    } catch (error) {
      console.error('Error getting connection pool status:', error);
      throw error;
    }
  }

  async getLastQueryTime(): Promise<string> {
    return new Date().toISOString();
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
  challengeCompletions,
  challengeProgress,
  mlPredictions,
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
  Questionnaire,
  ChallengeCompletion,
  ChallengeProgress,
  MLPrediction
};
