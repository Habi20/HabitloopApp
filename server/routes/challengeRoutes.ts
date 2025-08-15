// server/routes/challengeRoutes.ts
import { Router, Request, Response } from "express";
import { requireAuth } from "./middlewareRoutes";
import { storage } from "../storage";
import { getCurrentDateString, getWeekNumber, getMonthNumber } from "../utils/timezone.js";
import { getDailyHabitStatus } from "../utils/habitCompletionManager.js";

export function challengeRoutes() {
  const router = Router();

  // Get all challenges for user
  router.get("/", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const challenges = await generateUserChallenges(userId);
      const categories = categorizeChallenges(challenges);

      res.json({
        success: true,
        data: {
          challenges,
          categories,
        },
      });
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ error: "Failed to fetch challenges" });
    }
  });

  // Claim challenge reward
  router.post("/:challengeId/claim", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const challengeId = req.params.challengeId;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const result = await claimChallengeReward(userId, challengeId);
      
      res.json({
        success: result.success,
        xpEarned: result.xpEarned,
        message: result.message,
      });
    } catch (error) {
      console.error("Error claiming challenge reward:", error);
      res.status(500).json({ error: "Failed to claim reward" });
    }
  });

  return router;
}

// Challenge definitions
const CHALLENGE_DEFINITIONS = {
  // Daily Challenges
  daily_complete_all: {
    id: "daily_complete_all",
    title: "Complete Today's Goals",
    description: "Complete all your active habits today",
    type: "daily",
    xpReward: 25,
    checkCompletion: async (userId: string) => {
      const dailyStatus = await getDailyHabitStatus(userId);
      const totalHabits = dailyStatus.length;
      const completedHabits = dailyStatus.filter(h => h.isCompleted).length;
      return {
        progress: completedHabits,
        target: totalHabits,
        isCompleted: totalHabits > 0 && completedHabits === totalHabits,
      };
    },
  },

  // Weekly Challenges
  weekly_streak_master: {
    id: "weekly_streak_master",
    title: "7-Day Streak Master",
    description: "Complete all your habits for 7 consecutive days",
    type: "weekly",
    xpReward: 50,
    checkCompletion: async (userId: string) => {
      const habits = await storage.getUserHabits(userId);
      const allCompletions = await storage.getHabitCompletions(userId);
      const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const activeHabits = habits.filter(h => h.isActive);
      const completedDays = last7Days.filter(date => {
        const dayCompletions = allCompletions.filter(c => c.completedAt === date);
        return dayCompletions.length >= activeHabits.length;
      });

      return {
        progress: completedDays.length,
        target: 7,
        isCompleted: completedDays.length >= 7,
      };
    },
  },

  weekly_early_bird: {
    id: "weekly_early_bird",
    title: "Early Bird",
    description: "Complete morning habits before 9 AM for 5 days",
    type: "weekly",
    xpReward: 25,
    checkCompletion: async (userId: string) => {
      const habits = await storage.getUserHabits(userId);
      const allCompletions = await storage.getHabitCompletions(userId);
      
      // Get morning habits (with reminder times before 9 AM)
      const morningHabits = habits.filter(h => {
        if (!h.reminderTime) return false;
        const [hours] = h.reminderTime.split(':').map(Number);
        return hours < 9;
      });

      if (morningHabits.length === 0) {
        return { progress: 0, target: 5, isCompleted: false };
      }

      // Check last 7 days for early completions
      const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      });

      const earlyBirdDays = last7Days.filter(date => {
        const dayCompletions = allCompletions.filter(c => c.completedAt === date);
        return dayCompletions.length >= morningHabits.length;
      });

      return {
        progress: Math.min(earlyBirdDays.length, 5),
        target: 5,
        isCompleted: earlyBirdDays.length >= 5,
      };
    },
  },

  // Monthly Challenges
  monthly_habit_explorer: {
    id: "monthly_habit_explorer",
    title: "Habit Explorer",
    description: "Create 3 new habits this month",
    type: "monthly",
    xpReward: 100,
    checkCompletion: async (userId: string) => {
      const habits = await storage.getUserHabits(userId);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const habitsThisMonth = habits.filter(habit => {
        const habitDate = new Date(habit.createdAt);
        return habitDate.getMonth() === currentMonth && 
               habitDate.getFullYear() === currentYear;
      });

      return {
        progress: habitsThisMonth.length,
        target: 3,
        isCompleted: habitsThisMonth.length >= 3,
      };
    },
  },

  monthly_consistency_champion: {
    id: "monthly_consistency_champion",
    title: "Consistency Champion",
    description: "Achieve 90% completion rate this month",
    type: "monthly",
    xpReward: 200,
    checkCompletion: async (userId: string) => {
      const habits = await storage.getUserHabits(userId);
      const allCompletions = await storage.getHabitCompletions(userId);
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      const activeHabits = habits.filter(h => h.isActive);
      const totalPossibleCompletions = activeHabits.length * daysInMonth;
      
      const completionsThisMonth = allCompletions.filter(completion => {
        const completionDate = new Date(completion.completedAt);
        return completionDate.getMonth() === currentMonth && 
               completionDate.getFullYear() === currentYear;
      });

      const completionRate = totalPossibleCompletions > 0 ? 
        (completionsThisMonth.length / totalPossibleCompletions) * 100 : 0;

      return {
        progress: Math.round(completionRate),
        target: 90,
        isCompleted: completionRate >= 90,
      };
    },
  },
};

async function generateUserChallenges(userId: string) {
  const challenges = [];
  const now = new Date();

  for (const [key, definition] of Object.entries(CHALLENGE_DEFINITIONS)) {
    const completion = await definition.checkCompletion(userId);
    
    // Calculate expiration date
    let expiresAt = new Date();
    switch (definition.type) {
      case "daily":
        expiresAt.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        expiresAt.setDate(expiresAt.getDate() + (7 - expiresAt.getDay()));
        expiresAt.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        expiresAt = new Date(expiresAt.getFullYear(), expiresAt.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }

    challenges.push({
      id: definition.id,
      title: definition.title,
      description: definition.description,
      type: definition.type,
      xpReward: definition.xpReward,
      progress: completion.progress,
      target: completion.target,
      isCompleted: completion.isCompleted,
      isActive: true,
      expiresAt: expiresAt.toISOString(),
      category: definition.type,
    });
  }

  return challenges;
}

function categorizeChallenges(challenges: any[]) {
  const categories = [
    { title: "Daily", challenges: [], totalXP: 0, completedCount: 0 },
    { title: "Weekly", challenges: [], totalXP: 0, completedCount: 0 },
    { title: "Monthly", challenges: [], totalXP: 0, completedCount: 0 },
  ];

  challenges.forEach(challenge => {
    const category = categories.find(c => c.title.toLowerCase() === challenge.type);
    if (category) {
      category.challenges.push(challenge);
      category.totalXP += challenge.xpReward;
      if (challenge.isCompleted) {
        category.completedCount++;
      }
    }
  });

  return categories;
}

async function claimChallengeReward(userId: string, challengeId: string) {
  const definition = CHALLENGE_DEFINITIONS[challengeId as keyof typeof CHALLENGE_DEFINITIONS];
  if (!definition) {
    return { success: false, xpEarned: 0, message: "Challenge not found" };
  }

  const completion = await definition.checkCompletion(userId);
  if (!completion.isCompleted) {
    return { success: false, xpEarned: 0, message: "Challenge not completed" };
  }

  // Award XP
  const user = await storage.updateUserXP(userId, definition.xpReward);
  
  // Create AI insight for challenge completion
  await storage.createAIInsight(
    userId,
    'challenge_completed',
    `Challenge Completed: ${definition.title}`,
    `Congratulations! You earned ${definition.xpReward} XP for completing the "${definition.title}" challenge.`
  );

  return {
    success: true,
    xpEarned: definition.xpReward,
    message: `Challenge completed! +${definition.xpReward} XP earned`,
  };
}
