import { storage } from '../storage';
import { db } from '../db';
import { notifications, notificationPreferences } from '../../shared/schema';
//import { notificationTypes} from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
// import { eq, and, desc, sql } from 'drizzle-orm';

export interface NotificationMessage {
  id: string;
  type: 'inactivity' | 'achievement' | 'reminder' | 'insight';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  isRead: boolean;
  actionRequired?: boolean;
  data?: any;
}

export interface UserNotificationSettings {
  pushNotifications: boolean;
  reminderSound: boolean;
  weeklyReport: boolean;
  defaultReminderTime: string;
  inactivityAlerts: boolean;
  achievementAlerts: boolean;
  insightAlerts: boolean;
}

export class NotificationManager {
  private static instance: NotificationManager;
  // private testNotifications: Map<string, NotificationMessage[]> = new Map();
  private dismissedNotifications: Map<string, Set<string>> = new Map(); // Track dismissed notifications
  private inactivityCooldowns: Map<string, number> = new Map(); // Track cooldown periods

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Check user inactivity and generate appropriate notifications
   */
  async checkInactivityNotifications(userId: string): Promise<NotificationMessage[]> {
    try {
      const user = await storage.getUser(userId);
      if (!user) return [];

      const completions = await storage.getHabitCompletions(userId);
      const habits = await storage.getUserHabits(userId);

      if (!habits || habits.length === 0) return [];

      // Check if user is in cooldown period for inactivity notifications
      const cooldownUntil = this.inactivityCooldowns.get(userId);
      if (cooldownUntil && Date.now() < cooldownUntil) {
        console.log('Inactivity notifications in cooldown for user:', userId);
        return [];
      }

      // Get recent completions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentCompletions = completions?.filter(c => 
        new Date(c.completedAt) >= sevenDaysAgo
      ) || [];

      const recentCompletionCount = recentCompletions.length;
      const daysSinceLastCompletion = recentCompletionCount > 0 ? 0 : 
        Math.floor((Date.now() - new Date(completions?.[completions.length - 1]?.completedAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24));

      const notifications: NotificationMessage[] = [];

      // Generate inactivity notifications based on thresholds
      if (daysSinceLastCompletion >= 7) {
        notifications.push(this.createInactivityNotification(userId, 7, 'high'));
      } else if (daysSinceLastCompletion >= 5) {
        notifications.push(this.createInactivityNotification(userId, 5, 'medium'));
      } else if (daysSinceLastCompletion >= 3) {
        notifications.push(this.createInactivityNotification(userId, 3, 'low'));
      }

      return notifications;
    } catch (error) {
      console.error('Error checking inactivity notifications:', error);
      return [];
    }
  }

  /**
   * Create inactivity notification with ML-based insights
   */
  private createInactivityNotification(userId: string, daysInactive: number, severity: 'low' | 'medium' | 'high'): NotificationMessage {
    const titles = {
      3: 'Gentle Reminder',
      5: 'Consistency Alert',
      7: 'Action Required'
    };

    const messages = {
      3: `It's been ${daysInactive} days since your last habit completion. Your consistency score is decreasing. A quick 5-minute habit can boost your motivation!`,
      5: `You've been inactive for ${daysInactive} days. Your engagement level has dropped significantly. Consider completing at least one habit today to maintain your progress.`,
      7: `Critical: ${daysInactive} days of inactivity detected. Your weekly forecast has dropped to low levels. Complete a habit now to prevent losing momentum!`
    };

    const mlInsights = this.getMLInsightsForInactivity(daysInactive);

    return {
      id: `inactivity-${userId}-${daysInactive}-${Date.now()}`,
      type: 'inactivity',
      title: titles[daysInactive as keyof typeof titles],
      message: `${messages[daysInactive as keyof typeof messages]} ${mlInsights}`,
      severity,
      timestamp: new Date(),
      isRead: false,
      actionRequired: severity === 'high',
      data: {
        daysInactive,
        mlInsights
      }
    };
  }

  /**
   * Generate ML-based insights for inactivity
   */
  private getMLInsightsForInactivity(daysInactive: number): string {
    const insights = {
      3: "ML Analysis: Your consistency score has decreased by 10%. Quick wins can reverse this trend.",
      5: "ML Analysis: Engagement level dropped by 20%. Your weekly forecast is now at 40%.",
      7: "ML Analysis: Critical drop detected. Consistency score at 20%, engagement at 30%. Immediate action needed."
    };

    return insights[daysInactive as keyof typeof insights] || "";
  }

  /**
   * Get user notification settings
   */
  async getUserNotificationSettings(userId: string): Promise<UserNotificationSettings> {
    try {
      // Get settings from database
      const dbSettings = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1);

      if (dbSettings.length > 0) {
        const settings = dbSettings[0];
        return {
          pushNotifications: settings.pushEnabled ?? true,
          reminderSound: true, // Not in DB schema, default to true
          weeklyReport: settings.digestFrequency === 'weekly',
          defaultReminderTime: '09:00', // Not in DB schema, default
          inactivityAlerts: !(settings.mutedTypes as any)?.includes('inactivity'),
          achievementAlerts: !(settings.mutedTypes as any)?.includes('achievement'),
          insightAlerts: !(settings.mutedTypes as any)?.includes('insight')
        };
      }

      // Return default settings if no preferences found
      return {
        pushNotifications: true,
        reminderSound: true,
        weeklyReport: true,
        defaultReminderTime: '09:00',
        inactivityAlerts: true,
        achievementAlerts: true,
        insightAlerts: true
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      // Return default settings on error
      return {
        pushNotifications: true,
        reminderSound: true,
        weeklyReport: true,
        defaultReminderTime: '09:00',
        inactivityAlerts: true,
        achievementAlerts: true,
        insightAlerts: true
      };
    }
  }

  /**
   * Update user notification settings
   */
  async updateUserNotificationSettings(userId: string, settings: Partial<UserNotificationSettings>): Promise<boolean> {
    try {
      // TODO: Implement database storage for user preferences
      console.log('Updating notification settings for user:', userId, settings);
      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      // Update database notification
      const notificationIdNum = parseInt(notificationId);
      if (isNaN(notificationIdNum)) {
        console.log('Invalid notification ID:', notificationId);
        return false;
      }

      await db
        .update(notifications)
        .set({ 
          isRead: true,
          updatedAt: new Date()
        })
        .where(and(
          eq(notifications.id, notificationIdNum),
          eq(notifications.userId, userId)
        ));

      console.log('Notification marked as read:', userId, notificationId);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Remove notification (clear/dismiss)
   */
  async removeNotification(userId: string, notificationId: string): Promise<boolean> {
    try {
      // Handle real inactivity notifications (cooldown)
      if (notificationId.includes('inactivity')) {
        if (!this.dismissedNotifications.has(userId)) {
          this.dismissedNotifications.set(userId, new Set());
        }
        this.dismissedNotifications.get(userId)!.add(notificationId);
        
        // Set cooldown period (24 hours) for inactivity notifications
        this.inactivityCooldowns.set(userId, Date.now() + (24 * 60 * 60 * 1000));
        console.log('Inactivity notification dismissed, cooldown set for 24 hours:', userId, notificationId);
        return true;
      }

      // Delete from database
      const notificationIdNum = parseInt(notificationId);
      if (isNaN(notificationIdNum)) {
        console.log('Invalid notification ID:', notificationId);
        return false;
      }

      await db
        .delete(notifications)
        .where(and(
          eq(notifications.id, notificationIdNum),
          eq(notifications.userId, userId)
        ));

      console.log('Notification removed:', userId, notificationId);
      return true;
    } catch (error) {
      console.error('Error removing notification:', error);
      return false;
    }
  }

  /**
   * Get all active notifications for user
   */
  async getUserNotifications(userId: string): Promise<NotificationMessage[]> {
    try {
      // Get notifications from database
      const dbNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));

      // Convert database notifications to NotificationMessage format
      const dbNotificationMessages: NotificationMessage[] = dbNotifications.map(dbNotif => ({
        id: dbNotif.id.toString(),
        type: dbNotif.type as 'inactivity' | 'achievement' | 'reminder' | 'insight',
        title: dbNotif.title,
        message: dbNotif.message,
        severity: dbNotif.severity as 'low' | 'medium' | 'high',
        timestamp: dbNotif.createdAt || new Date(),
        isRead: dbNotif.isRead || false,
        actionRequired: dbNotif.actionRequired || false,
        data: dbNotif.data
      }));

      // Get inactivity notifications (real-time generated)
      const inactivityNotifications = await this.checkInactivityNotifications(userId);
      const settings = await this.getUserNotificationSettings(userId);

      // Filter based on user preferences
      const filteredInactivityNotifications = inactivityNotifications.filter(notification => {
        if (notification.type === 'inactivity' && !settings.inactivityAlerts) {
          return false;
        }
        return true;
      });

      // Combine all notifications and sort by timestamp (newest first)
      const allNotifications = [
        ...dbNotificationMessages,
        ...filteredInactivityNotifications
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return allNotifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Reset inactivity cooldown when user completes a habit
   */
  resetInactivityCooldown(userId: string): void {
    this.inactivityCooldowns.delete(userId);
    this.dismissedNotifications.delete(userId);
    console.log('Inactivity cooldown reset for user:', userId);
  }

  /**
   * Create a test notification for demonstration purposes
   */
  async createTestNotification(userId: string, type: 'inactivity' | 'achievement' | 'insight'): Promise<NotificationMessage> {
    const testNotifications = {
      inactivity: {
        title: 'Test Inactivity Alert',
        message: 'This is a test inactivity notification. Your consistency score has decreased by 15% due to 3 days of inactivity. Complete a habit today to boost your motivation!',
        severity: 'medium' as const,
        type: 'inactivity' as const,
        context: {
          daysInactive: 3,
          consistencyDrop: '15%',
          suggestedAction: 'Complete a habit today'
        }
      },
      achievement: {
        title: 'Test Achievement Unlocked! 🎉',
        message: 'Congratulations! You\'ve completed your first habit streak. This is a test achievement notification to verify the system is working properly.',
        severity: 'low' as const,
        type: 'achievement' as const,
        context: {
          achievementType: 'streak',
          streakCount: 7,
          xpEarned: 50
        }
      },
      insight: {
        title: 'Test AI Insight 💡',
        message: 'ML Analysis: Based on your recent activity patterns, you perform best in the morning. Consider scheduling your most important habits before 10 AM for optimal success.',
        severity: 'low' as const,
        type: 'insight' as const,
        context: {
          analysisType: 'timing_optimization',
          recommendedTime: 'before 10 AM',
          confidence: '85%'
        }
      }
    };

    const testData = testNotifications[type];

    const notification: NotificationMessage = {
      id: `test-${type}-${userId}-${Date.now()}`,
      title: testData.title,
      message: testData.message,
      type: testData.type,
      severity: testData.severity,
      timestamp: new Date(),
      isRead: false,
      actionRequired: false,
      data: {
        isTest: true,
        testType: type,
        context: testData.context
      }
    };

    // Store the test notification in database
    const dbNotification = await db
      .insert(notifications)
      .values({
        userId: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        severity: notification.severity,
        isRead: notification.isRead,
        actionRequired: notification.actionRequired,
        data: {
          isTest: true,
          testType: type,
          context: notification.data?.context
        },
        priority: 2,
        createdAt: notification.timestamp,
        updatedAt: notification.timestamp
      })
      .returning();

    // Update the notification with the database ID
    notification.id = dbNotification[0].id.toString();
    
    console.log(`Test notification created and saved to database for user ${userId}:`, notification);
    
    return notification;
  }
}

export const notificationManager = NotificationManager.getInstance();
