import type { User, Habit, HabitCompletion, InsertCoachingMessage } from "@shared/schema";
import { storage } from "./storage";

export interface CoachingTrigger {
  type: 'streak_milestone' | 'missed_habit' | 'comeback' | 'daily_check' | 'achievement' | 'struggle_pattern';
  habitId?: number;
  streakCount?: number;
  missedDays?: number;
  data?: any;
}

export interface CoachingResponse {
  title: string;
  content: string;
  messageType: string;
  priority: 'high' | 'normal' | 'low';
  actionable: boolean;
  triggerData?: any;
}

export class AICoachingEngine {
  // Analyze user behavior and generate coaching messages
  async generateCoachingMessage(userId: string, trigger: CoachingTrigger): Promise<CoachingResponse | null> {
    const user = await storage.getUser(userId);
    if (!user) return null;

    const habits = await storage.getUserHabits(userId);
    const completions = await storage.getHabitCompletions(userId);

    switch (trigger.type) {
      case 'streak_milestone':
        return this.generateStreakCelebration(trigger, habits);
      case 'missed_habit':
        return this.generateEncouragement(trigger, user);
      case 'comeback':
        return this.generateComebackMessage(trigger, user);
      case 'daily_check':
        return this.generateDailyMotivation(user, habits, completions);
      case 'achievement':
        return this.generateAchievementMessage(trigger, user);
      case 'struggle_pattern':
        return this.generateStruggleSupport(trigger, user);
      default:
        return null;
    }
  }

  private generateStreakCelebration(trigger: CoachingTrigger, habits: Habit[]): CoachingResponse {
    const habit = habits.find(h => h.id === trigger.habitId);
    const streakCount = trigger.streakCount || 0;

    const celebrations = {
      3: {
        title: "🔥 3-Day Streak!",
        content: `Amazing! You've completed "${habit?.title}" for 3 days straight. You're building momentum!`,
        encouragement: "The first few days are the hardest - you're doing great!"
      },
      7: {
        title: "🎉 One Week Strong!",
        content: `Incredible! A full week of "${habit?.title}". You're proving to yourself that you can do this!`,
        encouragement: "One week down means you're forming a real habit. Keep it going!"
      },
      14: {
        title: "💪 Two Weeks of Excellence!",
        content: `Outstanding! 14 days of consistent "${habit?.title}". You're transforming your life!`,
        encouragement: "Two weeks is a major milestone. You're showing real dedication!"
      },
      30: {
        title: "🏆 30-Day Champion!",
        content: `Phenomenal! A full month of "${habit?.title}". You've officially built a lasting habit!`,
        encouragement: "30 days! This is no longer just a goal - it's who you are now."
      },
      100: {
        title: "🌟 100-Day Legend!",
        content: `Absolutely extraordinary! 100 days of "${habit?.title}". You're an inspiration!`,
        encouragement: "100 days of consistency. You've mastered this habit completely!"
      }
    };

    const milestone = Object.keys(celebrations)
      .map(Number)
      .reverse()
      .find(days => streakCount >= days);

    if (milestone && celebrations[milestone as keyof typeof celebrations]) {
      const celebration = celebrations[milestone as keyof typeof celebrations];
      return {
        title: celebration.title,
        content: `${celebration.content}\n\n${celebration.encouragement}`,
        messageType: 'streak_celebration',
        priority: streakCount >= 30 ? 'high' : 'normal',
        actionable: false,
        triggerData: { streakCount, habitId: trigger.habitId }
      };
    }

    return {
      title: `${streakCount}-Day Streak! 🔥`,
      content: `You're on fire! ${streakCount} consecutive days of "${habit?.title}". Every day you choose to continue, you're becoming stronger!`,
      messageType: 'streak_celebration',
      priority: 'normal',
      actionable: false,
      triggerData: { streakCount, habitId: trigger.habitId }
    };
  }

  private generateEncouragement(trigger: CoachingTrigger, _user: User): CoachingResponse {
    const encouragements = [
      {
        title: "Don't Let Yesterday Define Today",
        content: "Missing a day doesn't erase your progress. Every habit master has faced setbacks. What matters is getting back on track today.",
        action: "Choose one small action you can take right now to restart your momentum."
      },
      {
        title: "Resilience is Your Superpower",
        content: "The strongest people aren't those who never fall - they're those who get back up. You have the strength to continue your journey.",
        action: "Remember why you started this habit. That reason still matters today."
      },
      {
        title: "Progress, Not Perfection",
        content: "Your goal isn't to be perfect - it's to be consistent over time. One missed day in a month of success is still 97% achievement!",
        action: "Focus on your next opportunity to succeed rather than dwelling on the miss."
      },
      {
        title: "Tomorrow is a Fresh Start",
        content: "Every sunrise brings a new chance to make choices aligned with who you want to become. Your future self is counting on you.",
        action: "Set up your environment tonight to make tomorrow's success easier."
      }
    ];

    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    return {
      title: encouragement.title,
      content: `${encouragement.content}\n\n💡 ${encouragement.action}`,
      messageType: 'encouragement',
      priority: 'normal',
      actionable: true,
      triggerData: { missedDays: trigger.missedDays }
    };
  }

  private generateComebackMessage(_trigger: CoachingTrigger, _user: User): CoachingResponse {
    return {
      title: "Welcome Back, Champion! 🎯",
      content: `You're back! That takes courage and commitment. Every expert was once a beginner who never gave up. Today marks your fresh start - let's make it count!`,
      messageType: 'comeback',
      priority: 'high',
      actionable: true,
      triggerData: { returnDate: new Date().toISOString() }
    };
  }

  private generateDailyMotivation(_user: User, habits: Habit[], completions: HabitCompletion[]): CoachingResponse {
    const today = new Date().toISOString().split('T')[0];
    const todayCompletions = completions.filter(c => c.completedAt === today);
    const completionRate = habits.length > 0 ? (todayCompletions.length / habits.length) * 100 : 0;

    const motivations = {
      high: [
        {
          title: "You're Crushing It Today! 🚀",
          content: "Your consistency is paying off! You're building the habits that will transform your life.",
        },
        {
          title: "Momentum Master! ⚡",
          content: "Look at you go! Your dedication today is creating the foundation for long-term success.",
        }
      ],
      medium: [
        {
          title: "You're Making Progress! 📈",
          content: "Every small step counts. You're closer to your goals than you were yesterday.",
        },
        {
          title: "Keep the Momentum Going! 🎯",
          content: "You're on the right track. Each habit completed builds your confidence and capabilities.",
        }
      ],
      low: [
        {
          title: "New Day, New Opportunities! 🌅",
          content: "Today is full of possibilities. Every small action you take moves you forward.",
        },
        {
          title: "Your Journey Continues! 🛤️",
          content: "Progress isn't always linear, but persistence always pays off. What will you accomplish today?",
        }
      ]
    };

    let category: 'high' | 'medium' | 'low';
    if (completionRate >= 80) category = 'high';
    else if (completionRate >= 40) category = 'medium';
    else category = 'low';

    const selectedMotivation = motivations[category][Math.floor(Math.random() * motivations[category].length)];

    return {
      title: selectedMotivation.title,
      content: selectedMotivation.content,
      messageType: 'daily_motivation',
      priority: 'normal',
      actionable: false,
      triggerData: { completionRate, totalHabits: habits.length }
    };
  }

  private generateAchievementMessage(trigger: CoachingTrigger, _user: User): CoachingResponse {
    return {
      title: "Achievement Unlocked! 🏆",
      content: `You've reached a significant milestone! Your dedication and consistency are truly paying off. Celebrate this win - you've earned it!`,
      messageType: 'achievement',
      priority: 'high',
      actionable: false,
      triggerData: trigger.data
    };
  }

  private generateStruggleSupport(trigger: CoachingTrigger, _user: User): CoachingResponse {
    const supportMessages = [
      {
        title: "Struggles Make You Stronger 💪",
        content: "I notice you've been having some challenges lately. That's completely normal - even the most successful people face obstacles. What matters is how you respond to them.",
        tip: "Try breaking your habit into smaller, more manageable steps."
      },
      {
        title: "You're Not Alone in This 🤝",
        content: "Everyone faces difficult periods in their habit journey. The fact that you're here shows your commitment to growth.",
        tip: "Consider adjusting your habit timing or environment to make success easier."
      },
      {
        title: "Small Steps, Big Impact 🌱",
        content: "Sometimes the best strategy is to scale back and focus on consistency over intensity. A small daily action is better than sporadic big efforts.",
        tip: "What's the smallest version of this habit you could do every day?"
      }
    ];

    const support = supportMessages[Math.floor(Math.random() * supportMessages.length)];

    return {
      title: support.title,
      content: `${support.content}\n\n💡 Tip: ${support.tip}`,
      messageType: 'struggle_support',
      priority: 'high',
      actionable: true,
      triggerData: trigger.data
    };
  }

  // Generate weekly coaching insights
  async generateWeeklyInsights(userId: string): Promise<CoachingResponse[]> {
    const user = await storage.getUser(userId);
    if (!user) return [];

    const habits = await storage.getUserHabits(userId);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const completions = await storage.getHabitCompletions(userId);
    const weeklyCompletions = completions.filter(c =>
      new Date(c.completedAt) >= oneWeekAgo
    );

    const insights: CoachingResponse[] = [];

    // Analyze patterns and generate insights
    if (weeklyCompletions.length === 0) {
      insights.push({
        title: "Let's Get Back on Track 🎯",
        content: "I noticed you haven't completed any habits this week. That's okay - what matters is starting again. Small actions lead to big transformations.",
        messageType: 'weekly_insight',
        priority: 'high',
        actionable: true
      });
    } else {
      const completionRate = (weeklyCompletions.length / (habits.length * 7)) * 100;

      if (completionRate >= 80) {
        insights.push({
          title: "Outstanding Week! 🌟",
          content: `You completed ${Math.round(completionRate)}% of your habits this week. Your consistency is remarkable and will lead to lasting transformation.`,
          messageType: 'weekly_insight',
          priority: 'normal',
          actionable: false
        });
      } else if (completionRate >= 50) {
        insights.push({
          title: "Solid Progress This Week 📈",
          content: `You completed ${Math.round(completionRate)}% of your habits this week. You're building momentum - keep it up!`,
          messageType: 'weekly_insight',
          priority: 'normal',
          actionable: false
        });
      } else {
        insights.push({
          title: "Room for Growth 🌱",
          content: `This week you completed ${Math.round(completionRate)}% of your habits. Every week is a chance to improve. What can you adjust for next week?`,
          messageType: 'weekly_insight',
          priority: 'normal',
          actionable: true
        });
      }
    }

    return insights;
  }

  // Trigger coaching based on user actions
  async processHabitCompletion(userId: string, habitId: number): Promise<void> {
    const streak = await storage.getStreak(habitId, userId);

    // Check for streak milestones
    if (streak && streak.currentStreak && [3, 7, 14, 30, 50, 100].includes(streak.currentStreak)) {
      const message = await this.generateCoachingMessage(userId, {
        type: 'streak_milestone',
        habitId,
        streakCount: streak.currentStreak
      });

      if (message) {
        await this.saveCoachingMessage(userId, habitId, message);
      }
    }
  }

  async processMissedHabit(userId: string, habitId: number, missedDays: number): Promise<void> {
    const message = await this.generateCoachingMessage(userId, {
      type: 'missed_habit',
      habitId,
      missedDays
    });

    if (message) {
      await this.saveCoachingMessage(userId, habitId, message);
    }
  }

  private async saveCoachingMessage(userId: string, habitId: number | undefined, message: CoachingResponse): Promise<void> {
    const coachingMessage: InsertCoachingMessage = {
      userId,
      habitId: habitId || null,
      messageType: message.messageType,
      title: message.title,
      content: message.content,
      triggerData: message.triggerData || null,
      isRead: false
    };

    await storage.createCoachingMessage(coachingMessage);
  }
}

export const coachingEngine = new AICoachingEngine();
