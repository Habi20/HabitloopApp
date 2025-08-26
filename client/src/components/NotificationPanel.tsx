import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, X, AlertTriangle, Info, CheckCircle, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface NotificationMessage {
  id: string;
  type: 'inactivity' | 'achievement' | 'reminder' | 'insight' | 'coaching' | 'tip';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string | Date;
  isRead: boolean;
  actionRequired?: boolean;
  data?: any;
}

export default function NotificationPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch notifications with proper endpoint
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiRequest('notifications?limit=50', 'GET');
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Sort notifications by timestamp (newest first) and handle test notifications
  const notifications: NotificationMessage[] = React.useMemo(() => {
    // Handle different data structures from the API
    let allNotifications: NotificationMessage[] = [];
    
    if (notificationsData?.data) {
      // If data.data exists (nested structure), use that
      if (Array.isArray(notificationsData.data.data)) {
        allNotifications = notificationsData.data.data;
      } else if (Array.isArray(notificationsData.data)) {
        // If data is directly an array, use that
        allNotifications = notificationsData.data;
      }
    }
    
    // Sort by timestamp (newest first)
    const sorted = allNotifications.sort((a: NotificationMessage, b: NotificationMessage) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    // Separate test and regular notifications
    const regularNotifications = sorted.filter((n: NotificationMessage) => 
      !n.data?.isTest && !n.title.includes('Test')
    );
    const testNotifications = sorted.filter((n: NotificationMessage) => 
      n.data?.isTest || n.title.includes('Test')
    );

    // Return regular notifications first, then test notifications
    return [...regularNotifications, ...testNotifications];
  }, [notificationsData]);

  // Calculate unread count from the correct data structure
  const unreadCount = React.useMemo(() => {
    if (notificationsData?.data?.unread_count !== undefined) {
      return notificationsData.data.unread_count;
    }
    return notifications.filter(n => !n.isRead).length;
  }, [notificationsData, notifications]);

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest(`notifications/${notificationId}/read`, 'PATCH');
      return response.json();
    },
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(['notifications']);

      // Optimistically update to the new value
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old?.data) return old;
        
        // Mark the notification as read
        const updatedData = Array.isArray(old.data) 
          ? old.data.map((n: any) => n.id === notificationId ? { ...n, isRead: true } : n)
          : old.data.map((n: any) => n.id === notificationId ? { ...n, isRead: true } : n);
        
        return {
          ...old,
          data: updatedData
        };
      });

      // Return a context object with the snapshotted value
      return { previousNotifications };
    },
    onError: (_err, _notificationId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Clear notification mutation (DELETE method)
  const clearNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest(`notifications/${notificationId}`, 'DELETE');
      return response.json();
    },
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(['notifications']);

      // Optimistically update to the new value
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old?.data) return old;
        
        // Remove the notification from the data
        const updatedData = Array.isArray(old.data) 
          ? old.data.filter((n: any) => n.id !== notificationId)
          : old.data.filter((n: any) => n.id !== notificationId);
        
        return {
          ...old,
          data: updatedData
        };
      });

      // Return a context object with the snapshotted value
      return { previousNotifications };
    },
    onError: (_err, _notificationId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleClearNotification = (notificationId: string) => {
    clearNotificationMutation.mutate(notificationId);
  };

  const getSeverityIcon = (severity: string, type: string) => {
    // Use type-specific icons when available
    switch (type) {
      case 'achievement':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactivity':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'insight':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'coaching':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      case 'tip':
        return <Info className="w-4 h-4 text-orange-500" />;
      default:
        // Fallback to severity-based icons
        switch (severity) {
          case 'high':
            return <AlertTriangle className="w-4 h-4 text-red-500" />;
          case 'medium':
            return <Info className="w-4 h-4 text-yellow-500" />;
          case 'low':
            return <CheckCircle className="w-4 h-4 text-green-500" />;
          default:
            return <Info className="w-4 h-4 text-blue-500" />;
        }
    }
  };

  const getSeverityColor = (severity: string, type: string) => {
    // Use type-specific colors when available
    switch (type) {
      case 'achievement':
        return 'border-green-200 bg-green-50';
      case 'inactivity':
        return 'border-red-200 bg-red-50';
      case 'insight':
        return 'border-blue-200 bg-blue-50';
      case 'coaching':
        return 'border-purple-200 bg-purple-50';
      case 'tip':
        return 'border-orange-200 bg-orange-50';
      default:
        // Fallback to severity-based colors
        switch (severity) {
          case 'high':
            return 'border-red-200 bg-red-50';
          case 'medium':
            return 'border-yellow-200 bg-yellow-50';
          case 'low':
            return 'border-green-200 bg-green-50';
          default:
            return 'border-blue-200 bg-blue-50';
        }
    }
  };

  const formatTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const isTestNotification = (notification: NotificationMessage) => {
    return notification.data?.isTest || notification.title.includes('Test');
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isExpanded && (
        <Card className="absolute right-0 top-12 w-80 sm:w-96 lg:w-[450px] z-50 shadow-lg border-2 max-h-[80vh] overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
                <p className="text-xs text-gray-400">You're all caught up!</p>
              </div>
            ) : (
              <ScrollArea className="h-60 sm:h-80 lg:h-96">
                <div className="space-y-2 p-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${getSeverityColor(notification.severity, notification.type)} ${
                        !notification.isRead ? 'ring-2 ring-blue-200' : ''
                      } transition-all duration-200 hover:shadow-md ${
                        isTestNotification(notification) 
                          ? 'opacity-75 border-dashed' 
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          {getSeverityIcon(notification.severity, notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1 flex-wrap">
                              <h4 className="text-sm font-semibold text-gray-900 break-words">
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  New
                                </Badge>
                              )}
                              {isTestNotification(notification) && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  Test
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-2 leading-relaxed break-words">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                              {notification.actionRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  Action Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markAsReadMutation.isPending}
                              title="Mark as read"
                            >
                              {markAsReadMutation.isPending ? (
                                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto"
                            onClick={() => handleClearNotification(notification.id)}
                            disabled={clearNotificationMutation.isPending}
                            title="Clear notification"
                          >
                            {clearNotificationMutation.isPending ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
