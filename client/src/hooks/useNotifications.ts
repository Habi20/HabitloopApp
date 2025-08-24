// Enhanced Notification Hooks
// Date: 2025-08-22
// Purpose: React Query hooks for notification management with pagination and real-time updates

import React from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  Notification, 
  NotificationPreferences, 
  NotificationFilters,
  NotificationBulkAction,
  UseNotificationsReturn,
  UseNotificationPreferencesReturn,
  UseNotificationActionsReturn
} from '../types/notifications';

// API base URL
const API_BASE = '/api';

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('verified_token') || localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

/**
 * Hook for fetching notifications with pagination and filtering
 */
export function useNotifications(options: NotificationFilters = {}): UseNotificationsReturn {
  const {
    page = 1,
    limit = 20,
    include_read = true,
    type_id,
    priority,
    date_from,
    date_to
  } = options;

  const queryKey = ['notifications', { page, limit, include_read, type_id, priority, date_from, date_to }];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (page) params.set('page', page.toString());
      if (limit) params.set('limit', limit.toString());
      if (!include_read) params.set('include_read', 'false');
      if (type_id) params.set('type_id', type_id.toString());
      if (priority) params.set('priority', priority.toString());
      if (date_from) params.set('date_from', date_from);
      if (date_to) params.set('date_to', date_to);

      const response = await apiRequest(`/notifications?${params.toString()}`);
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    notifications: query.data?.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    hasNextPage: query.data?.pagination?.has_next || false,
    fetchNextPage: () => {}, // Not used for single page queries
    isFetchingNextPage: false
  };
}

/**
 * Hook for infinite scrolling notifications
 */
export function useInfiniteNotifications(options: Omit<NotificationFilters, 'page'> = {}) {
  const {
    limit = 20,
    include_read = true,
    type_id,
    priority,
    date_from,
    date_to
  } = options;

  return useInfiniteQuery({
    queryKey: ['notifications', 'infinite', { limit, include_read, type_id, priority, date_from, date_to }],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const params = new URLSearchParams();
      params.set('page', pageParam.toString());
      params.set('limit', limit.toString());
      if (!include_read) params.set('include_read', 'false');
      if (type_id) params.set('type_id', type_id.toString());
      if (priority) params.set('priority', priority.toString());
      if (date_from) params.set('date_from', date_from);
      if (date_to) params.set('date_to', date_to);

      const response = await apiRequest(`/notifications?${params.toString()}`);
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      return lastPage.pagination?.has_next ? lastPage.pagination.page + 1 : undefined;
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for unread notifications count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await apiRequest('/notifications/unread');
      return response.data.unread_count;
    },
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook for notification preferences
 */
export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await apiRequest('/notification-preferences');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      const response = await apiRequest('/notification-preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-preferences'], data);
    },
  });

  const resetToDefaultsMutation = useMutation({
    mutationFn: async () => {
      const defaultPreferences: Partial<NotificationPreferences> = {
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
        digest_frequency: 'daily',
        muted_types: [],
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      };
      
      const response = await apiRequest('/notification-preferences', {
        method: 'PUT',
        body: JSON.stringify(defaultPreferences),
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-preferences'], data);
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    resetToDefaults: resetToDefaultsMutation.mutateAsync,
  };
}

/**
 * Hook for notification actions (mark as read, delete, etc.)
 */
export function useNotificationActions(): UseNotificationActionsReturn {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/notifications/read-all', {
        method: 'PATCH',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest(`/notifications/${notificationId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async (action: NotificationBulkAction) => {
      const response = await apiRequest('/notifications/bulk', {
        method: 'POST',
        body: JSON.stringify(action),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  return {
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
    bulkAction: bulkActionMutation.mutateAsync,
    isLoading: markAsReadMutation.isPending || markAllAsReadMutation.isPending || 
               deleteNotificationMutation.isPending || bulkActionMutation.isPending,
    error: markAsReadMutation.error || markAllAsReadMutation.error || 
           deleteNotificationMutation.error || bulkActionMutation.error,
  };
}

/**
 * Hook for notification statistics
 */
export function useNotificationStats() {
  return useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const response = await apiRequest('/notification-stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for notification types
 */
export function useNotificationTypes() {
  return useQuery({
    queryKey: ['notification-types'],
    queryFn: async () => {
      const response = await apiRequest('/notification-types');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (types don't change often)
  });
}

/**
 * Hook for creating test notifications
 */
export function useTestNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: string) => {
      const response = await apiRequest('/notifications/test', {
        method: 'POST',
        body: JSON.stringify({ type }),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

/**
 * Hook for creating custom notifications
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await apiRequest('/notifications', {
        method: 'POST',
        body: JSON.stringify(notification),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

/**
 * Hook for real-time notification updates (WebSocket/SSE)
 */
export function useRealTimeNotifications() {
  const queryClient = useQueryClient();

  // This would be implemented with WebSocket or Server-Sent Events
  // For now, we'll use polling with a shorter interval
  const realtimeQuery = useQuery({
    queryKey: ['notifications', 'realtime'],
    queryFn: async () => {
      const response = await apiRequest('/notifications?limit=5');
      return response.data;
    },
    refetchInterval: 10000, // 10 seconds
    refetchIntervalInBackground: true,
  });

  // Update cache when data changes
  React.useEffect(() => {
    if (realtimeQuery.data) {
      queryClient.setQueryData(['notifications'], realtimeQuery.data);
    }
  }, [realtimeQuery.data, queryClient]);
}

/**
 * Hook for notification cleanup (admin only)
 */
export function useNotificationCleanup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/notifications/cleanup', {
        method: 'POST',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });
}

/**
 * Utility hook for notification filters
 */
export function useNotificationFilters() {
  const [filters, setFilters] = React.useState<NotificationFilters>({
    page: 1,
    limit: 20,
    include_read: true,
  });

  const updateFilters = React.useCallback((newFilters: Partial<NotificationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 when filters change
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilters({
      page: 1,
      limit: 20,
      include_read: true,
    });
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}

// Default export
export default useNotifications;
