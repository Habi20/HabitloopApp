// Enhanced Notification System TypeScript Types
// Date: 2025-08-22

export interface NotificationType {
  id: number;
  name: string;
  description?: string;
  default_priority: number;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type_id?: number;
  type?: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: Record<string, any>;
  expires_at?: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id?: number;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  digest_frequency: 'never' | 'daily' | 'weekly';
  muted_types: number[];
  quiet_hours_start: string; // Format: "HH:MM"
  quiet_hours_end: string; // Format: "HH:MM"
  created_at?: string;
  updated_at?: string;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface NotificationStats {
  user_id: string;
  total_notifications: number;
  unread_count: number;
  recent_count: number;
  last_notification_at?: string;
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

export interface CreateNotificationRequest {
  user_id: string;
  type_id?: number;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  expires_at?: string;
  priority?: number;
}

export interface UpdateNotificationRequest {
  is_read?: boolean;
  metadata?: Record<string, any>;
}

export interface NotificationBulkAction {
  action: 'mark_read' | 'mark_unread' | 'delete';
  notification_ids: string[];
}

export interface NotificationDigest {
  user_id: string;
  period: 'daily' | 'weekly';
  notifications: Notification[];
  summary: {
    total: number;
    unread: number;
    by_type: Record<string, number>;
  };
}

// Notification priority levels
export enum NotificationPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4,
  CRITICAL = 5
}

// Notification type names
export enum NotificationTypeName {
  INACTIVITY = 'inactivity',
  ACHIEVEMENT = 'achievement',
  REMINDER = 'reminder',
  INSIGHT = 'insight',
  CHALLENGE = 'challenge',
  STREAK = 'streak',
  SYSTEM = 'system',
  COACHING = 'coaching'
}

// Notification metadata interfaces
export interface InactivityNotificationMetadata {
  days_inactive: number;
  consistency_score: number;
  ml_insights: string;
  suggested_habits: string[];
}

export interface AchievementNotificationMetadata {
  achievement_type: string;
  xp_earned: number;
  level_up?: boolean;
  new_level?: number;
}

export interface ChallengeNotificationMetadata {
  challenge_id: string;
  challenge_type: string;
  xp_reward: number;
  completion_percentage: number;
}

export interface InsightNotificationMetadata {
  insight_type: string;
  confidence_score: number;
  recommendations: string[];
  data_points: Record<string, any>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Real-time notification types
export interface NotificationEvent {
  type: 'notification_created' | 'notification_updated' | 'notification_deleted';
  notification: Notification;
  user_id: string;
  timestamp: string;
}

export interface NotificationCountUpdate {
  user_id: string;
  unread_count: number;
  total_count: number;
}

// Service Worker types
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface NotificationAction {
  action: string;
  notification_id: string;
  user_id: string;
  timestamp: string;
}

// Offline storage types
export interface OfflineNotification {
  id: string;
  notification: Notification;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
  retry_count: number;
}

// Performance monitoring types
export interface NotificationPerformanceMetrics {
  load_time: number;
  render_time: number;
  memory_usage: number;
  notification_count: number;
  timestamp: string;
}

// Error types
export interface NotificationError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Utility types
export type NotificationSortField = 'created_at' | 'priority' | 'title' | 'type';
export type NotificationSortOrder = 'asc' | 'desc';

export interface NotificationSortOptions {
  field: NotificationSortField;
  order: NotificationSortOrder;
}

// Hook return types
export interface UseNotificationsReturn {
  notifications: Notification[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

export interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: Error | null;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

export interface UseNotificationActionsReturn {
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  bulkAction: (action: NotificationBulkAction) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}
