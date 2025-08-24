// Enhanced Notification Service
// Date: 2025-08-22
// Purpose: Comprehensive notification management with database integration

import { db } from '../db';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { 
  notifications,
  notificationTypes,
  notificationPreferences,
  // users,
  type Notification,
  type NotificationType,
  type NotificationPreferences,
  type InsertNotification,
  type InsertNotificationPreferences
} from '../../shared/schema';

// Additional types for API responses
export interface NotificationListResponse {
  data: Notification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  include_read?: boolean;
  type_id?: number;
  priority?: number;
  date_from?: string;
  date_to?: string;
}

export interface NotificationBulkAction {
  action: 'mark_read' | 'mark_unread' | 'delete';
  notification_ids: string[];
}

export interface NotificationStats {
  user_id: string;
  total_notifications: number;
  unread_count: number;
  recent_count: number;
  last_notification_at?: Date;
}

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Get user notifications with pagination and filtering
   */
  async getUserNotifications(
    userId: string, 
    options: NotificationFilters = {}
  ): Promise<NotificationListResponse> {
    try {
      const {
        page = 1,
        limit = 20,
        include_read = true,
        type_id,
        priority,
        // date_from,
        // date_to
      } = options;

      const offset = (page - 1) * limit;

      // Build where conditions
      let whereConditions = [eq(notifications.userId, userId)];

      if (!include_read) {
        whereConditions.push(eq(notifications.isRead, false));
      }

      if (type_id !== undefined) {
        whereConditions.push(eq(notifications.typeId, type_id));
      }

      if (priority !== undefined) {
        whereConditions.push(eq(notifications.priority, priority));
      }

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(...whereConditions));
      
      const total = totalResult[0]?.count || 0;

      // Get notifications with pagination
      const notificationResults = await db
        .select({
          notification: notifications,
          type: notificationTypes
        })
        .from(notifications)
        .leftJoin(notificationTypes, eq(notifications.typeId, notificationTypes.id))
        .where(and(...whereConditions))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      // Get unread count
      const unreadResult = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
      
      const unread_count = unreadResult[0]?.count || 0;

      // Transform results
      const notificationData: Notification[] = notificationResults.map(row => ({
        ...row.notification,
        type: row.type?.name || 'unknown',
        severity: row.notification.severity || 'medium'
      }));

      return {
        data: notificationData,
        total,
        unread_count,
        page,
        limit,
        has_more: total > page * limit
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    try {
      const result = await db
        .update(notifications)
        .set({ 
          isRead: true, 
          updatedAt: new Date() 
        })
        .where(and(
          eq(notifications.id, parseInt(notificationId)),
          eq(notifications.userId, userId)
        ))
        .returning();

      if (result.length === 0) {
        throw new Error('Notification not found or access denied');
      }

      return result[0];
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    try {
      const result = await db
        .update(notifications)
        .set({ 
          isRead: true, 
          updatedAt: new Date() 
        })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ))
        .returning();

      return { count: result.length };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Create new notification
   */
  async createNotification(
    notificationData: InsertNotification
  ): Promise<Notification> {
    try {
      const result = await db
        .insert(notifications)
        .values({
          ...notificationData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(notifications)
        .where(and(
          eq(notifications.id, parseInt(notificationId)),
          eq(notifications.userId, userId)
        ))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Bulk actions on notifications
   */
  async bulkAction(action: NotificationBulkAction, userId: string): Promise<{ count: number }> {
    try {
      const { action: actionType, notification_ids } = action;

      if (notification_ids.length === 0) {
        return { count: 0 };
      }

      const ids = notification_ids.map(id => parseInt(id));
      let result;

      switch (actionType) {
        case 'mark_read':
          result = await db
            .update(notifications)
            .set({ 
              isRead: true, 
              updatedAt: new Date() 
            })
            .where(and(
              sql`${notifications.id} = ANY(${ids})`,
              eq(notifications.userId, userId)
            ))
            .returning();
          break;

        case 'mark_unread':
          result = await db
            .update(notifications)
            .set({ 
              isRead: false, 
              updatedAt: new Date() 
            })
            .where(and(
              sql`${notifications.id} = ANY(${ids})`,
              eq(notifications.userId, userId)
            ))
            .returning();
          break;

        case 'delete':
          result = await db
            .delete(notifications)
            .where(and(
              sql`${notifications.id} = ANY(${ids})`,
              eq(notifications.userId, userId)
            ))
            .returning();
          break;

        default:
          throw new Error('Invalid bulk action');
      }

      return { count: result.length };
    } catch (error) {
      console.error('Error performing bulk action:', error);
      throw new Error('Failed to perform bulk action');
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const result = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<InsertNotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      // Check if preferences exist
      const existing = await this.getNotificationPreferences(userId);
      
      if (existing) {
        // Update existing preferences
        const result = await db
          .update(notificationPreferences)
          .set({
            ...preferences,
            updatedAt: new Date()
          })
          .where(eq(notificationPreferences.userId, userId))
          .returning();

        return result[0];
      } else {
        // Create new preferences
        const result = await db
          .insert(notificationPreferences)
          .values({
            userId,
            emailEnabled: true,
            pushEnabled: true,
            inAppEnabled: true,
            digestFrequency: 'daily',
            mutedTypes: [],
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
            ...preferences,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        return result[0];
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      const [totalResult, unreadResult, recentResult] = await Promise.all([
        // Total notifications
        db.select({ count: count() })
          .from(notifications)
          .where(eq(notifications.userId, userId)),
        
        // Unread count
        db.select({ count: count() })
          .from(notifications)
          .where(and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )),
        
        // Recent notifications (last 7 days)
        db.select({ count: count() })
          .from(notifications)
          .where(and(
            eq(notifications.userId, userId),
            sql`${notifications.createdAt} >= NOW() - INTERVAL '7 days'`
          ))
      ]);

      return {
        user_id: userId,
        total_notifications: totalResult[0]?.count || 0,
        unread_count: unreadResult[0]?.count || 0,
        recent_count: recentResult[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        user_id: userId,
        total_notifications: 0,
        unread_count: 0,
        recent_count: 0
      };
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await db
        .delete(notifications)
        .where(sql`${notifications.expiresAt} < NOW()`)
        .returning();

      return result.length;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      return 0;
    }
  }

  /**
   * Get notification types
   */
  async getNotificationTypes(): Promise<NotificationType[]> {
    try {
      const result = await db
        .select()
        .from(notificationTypes)
        .orderBy(notificationTypes.name);

      return result;
    } catch (error) {
      console.error('Error getting notification types:', error);
      
      // Fallback: return default notification types if database query fails
      return [
        { id: 1, name: 'inactivity', description: 'User inactivity alerts', defaultPriority: 3, icon: 'clock', color: 'orange', createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'achievement', description: 'Achievement notifications', defaultPriority: 2, icon: 'trophy', color: 'gold', createdAt: new Date(), updatedAt: new Date() },
        { id: 3, name: 'reminder', description: 'Habit reminders', defaultPriority: 2, icon: 'bell', color: 'blue', createdAt: new Date(), updatedAt: new Date() },
        { id: 4, name: 'insight', description: 'AI insights', defaultPriority: 2, icon: 'lightbulb', color: 'purple', createdAt: new Date(), updatedAt: new Date() }
      ];
    }
  }

  /**
   * Create test notification
   */
  async createTestNotification(userId: string, type: string = 'insight'): Promise<Notification> {
    try {
      // Note: We use the type string directly, not typeId
      // The typeId lookup is kept for potential future use with foreign keys

      // Create test notification data
      const testNotifications = {
        inactivity: {
          title: 'Test Inactivity Alert',
          message: 'This is a test inactivity notification. Your consistency score has decreased by 15% due to 3 days of inactivity. Complete a habit today to boost your motivation!',
          priority: 3,
          metadata: {
            test: true,
            testType: 'inactivity',
            context: {
              daysInactive: 3,
              consistencyDrop: '15%',
              suggestedAction: 'Complete a habit today'
            }
          }
        },
        achievement: {
          title: 'Test Achievement Unlocked! 🎉',
          message: 'Congratulations! You\'ve completed your first habit streak. This is a test achievement notification to verify the system is working properly.',
          priority: 2,
          metadata: {
            test: true,
            testType: 'achievement',
            context: {
              achievementType: 'streak',
              streakCount: 7,
              xpEarned: 50
            }
          }
        },
        insight: {
          title: 'Test AI Insight 💡',
          message: 'ML Analysis: Based on your recent activity patterns, you perform best in the morning. Consider scheduling your most important habits before 10 AM for optimal success.',
          priority: 2,
          metadata: {
            test: true,
            testType: 'insight',
            context: {
              analysisType: 'timing_optimization',
              recommendedTime: 'before 10 AM',
              confidence: '85%'
            }
          }
        }
      };

      const testData = testNotifications[type as keyof typeof testNotifications] || testNotifications.insight;

      // Create the notification
      const result = await db
        .insert(notifications)
        .values({
          userId,
          type: type,
          title: testData.title,
          message: testData.message,
          priority: testData.priority,
          severity: 'medium',
          metadata: testData.metadata,
          isRead: false,
          actionRequired: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error creating test notification:', error);
      throw new Error('Failed to create test notification');
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();