import { Router, Request, Response } from 'express';
import { requireAuth } from './middlewareRoutes';
import { notificationManager, UserNotificationSettings } from '../utils/notificationUtils';

export function notificationRoutes() {
  const router = Router();

  // Get all notifications for user
  router.get('/notifications', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const notifications = await notificationManager.getUserNotifications(userId);
      
      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  });

  // Mark notification as read
  router.post('/notifications/:notificationId/read', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const success = await notificationManager.markNotificationAsRead(userId, notificationId);
      
      if (success) {
        res.json({ success: true, message: 'Notification marked as read' });
      } else {
        res.status(400).json({ error: 'Failed to mark notification as read' });
      }
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // Get user notification settings
  router.get('/notifications/settings', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const settings = await notificationManager.getUserNotificationSettings(userId);
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Get notification settings error:', error);
      res.status(500).json({ error: 'Failed to get notification settings' });
    }
  });

  // Update user notification settings
  router.put('/notifications/settings', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const settings: Partial<UserNotificationSettings> = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const success = await notificationManager.updateUserNotificationSettings(userId, settings);
      
      if (success) {
        res.json({ success: true, message: 'Notification settings updated' });
      } else {
        res.status(400).json({ error: 'Failed to update notification settings' });
      }
    } catch (error) {
      console.error('Update notification settings error:', error);
      res.status(500).json({ error: 'Failed to update notification settings' });
    }
  });

  // Test notification endpoint
  router.post('/notifications/test', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { type } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const testNotification = await notificationManager.createTestNotification(userId, type);
      
      res.json({
        success: true,
        message: 'Test notification created successfully',
        data: testNotification
      });
    } catch (error) {
      console.error('Test notification error:', error);
      res.status(500).json({ error: 'Failed to create test notification' });
    }
  });

  // Remove notification endpoint
  router.delete('/notifications/:notificationId', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const success = await notificationManager.removeNotification(userId, notificationId);
      
      if (success) {
        res.json({ success: true, message: 'Notification removed successfully' });
      } else {
        res.status(400).json({ error: 'Failed to remove notification' });
      }
    } catch (error) {
      console.error('Remove notification error:', error);
      res.status(500).json({ error: 'Failed to remove notification' });
    }
  });

  return router;
}
