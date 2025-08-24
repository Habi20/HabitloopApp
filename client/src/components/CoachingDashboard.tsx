
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface CoachingMessage {
  id?: number | string;
  userId?: string;
  habitId?: number;
  messageType?: string;
  title?: string;
  content?: string;
  triggerData?: any;
  isRead?: boolean;
  createdAt?: string;
  source?: 'coaching' | 'notification';
  severity?: 'low' | 'medium' | 'high';
}

export function CoachingDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coachingData, isLoading: coachingLoading } = useQuery<{ messages: any[] }>({
    queryKey: ["/api/coaching/messages"],
    enabled: !!user,
  });

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery<{ data: any[] }>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });

  // Extract messages from the response data and map API fields to expected structure
  const coachingMessages = (coachingData?.messages || []).map((message: any) => ({
    id: message.id,
    userId: message.userId,
    habitId: message.habitId,
    messageType: message.type || message.messageType, // Handle both 'type' and 'messageType' fields
    title: message.title,
    content: message.content,
    triggerData: message.triggerData,
    isRead: message.isRead,
    createdAt: message.createdAt || message.timestamp, // Handle both 'createdAt' and 'timestamp' fields
    source: 'coaching' as const,
  }));

  // Extract notifications and convert them to coaching message format
  const notifications = (notificationsData?.data || []).map((notification: any) => ({
    id: `notification-${notification.id}`,
    userId: notification.userId,
    habitId: undefined,
    messageType: notification.type,
    title: notification.title,
    content: notification.message,
    triggerData: notification.data,
    isRead: notification.isRead,
    createdAt: notification.timestamp,
    source: 'notification' as const,
    severity: notification.severity,
  }));

  // Combine and sort all messages by timestamp (newest first)
  const allMessages = [...coachingMessages, ...notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isLoading = coachingLoading || notificationsLoading;

  const markAsReadMutation = useMutation({
    mutationFn: async ({ messageId, source }: { messageId: string | number, source: 'coaching' | 'notification' }) => {
      if (source === 'notification') {
        // Extract numeric ID from notification ID (remove 'notification-' prefix)
        const numericId = typeof messageId === 'string' && messageId.startsWith('notification-') 
          ? messageId.replace('notification-', '') 
          : messageId;
        
        await apiRequest(`/api/notifications/${numericId}/read`, "POST");
      } else {
        await apiRequest(`/api/coaching/messages/${messageId}/read`, "PUT");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const clearMessageMutation = useMutation({
    mutationFn: async ({ messageId, source }: { messageId: string | number, source: 'coaching' | 'notification' }) => {
      if (source === 'notification') {
        // Extract numeric ID from notification ID (remove 'notification-' prefix)
        const numericId = typeof messageId === 'string' && messageId.startsWith('notification-') 
          ? messageId.replace('notification-', '') 
          : messageId;
        
        // Remove notification via API
        const response = await apiRequest(`/api/notifications/${numericId}`, "DELETE");
        return response.json();
      } else {
        // For coaching messages, we could implement a "dismiss" endpoint
        // For now, just return success
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const generateInsightMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/coaching/generate-insight", "POST");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/messages"] });
      toast({
        title: "New Insight Generated",
        description: "Your AI coach has provided new personalized guidance.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate coaching insight. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getMessageIcon = (messageType?: string, source?: 'coaching' | 'notification') => {
    if (!messageType) return '💡';
    
    // Handle notification types
    if (source === 'notification') {
      switch (messageType) {
        case 'inactivity':
          return '⚠️';
        case 'achievement':
          return '🏆';
        case 'insight':
          return '💡';
        case 'reminder':
          return '🔔';
        default:
          return '📢';
      }
    }
    
    // Handle coaching message types
    switch (messageType) {
      case 'streak_celebration':
        return '🔥';
      case 'encouragement':
        return '💪';
      case 'comeback':
        return '🎯';
      case 'daily_motivation':
        return '☀️';
      case 'achievement':
        return '🏆';
      case 'struggle_support':
        return '🤝';
      case 'weekly_insight':
        return '📊';
      default:
        return '💡';
    }
  };

  const getMessagePriority = (messageType?: string) => {
    if (!messageType) return 'normal';
    
    const highPriority = ['streak_celebration', 'achievement', 'comeback'];
    return highPriority.includes(messageType) ? 'high' : 'normal';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'normal':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Coach</h2>
          <p className="text-gray-600">Personalized guidance for your habit journey</p>
        </div>
        <Button 
          onClick={() => generateInsightMutation.mutate()}
          disabled={generateInsightMutation.isPending}
          className="flex items-center space-x-2"
        >
          <i className="fas fa-brain"></i>
          <span>Get Insight</span>
          {generateInsightMutation.isPending && (
            <i className="fas fa-spinner fa-spin ml-2"></i>
          )}
        </Button>
      </div>

      {(!allMessages || allMessages.length === 0) ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold mb-2">Your AI Coach is Ready!</h3>
            <p className="text-gray-600 mb-4">
              Complete habits to unlock personalized coaching messages, streak celebrations, and motivational insights.
            </p>
            <Button onClick={() => generateInsightMutation.mutate()}>
              Get Your First Insight
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allMessages.map((message: CoachingMessage) => {
            const priority = getMessagePriority(message.messageType || undefined);
            const icon = getMessageIcon(message.messageType || undefined, message.source);
            
            // Different styling for notifications vs coaching messages
            const isNotification = message.source === 'notification';
            const cardClassName = isNotification 
              ? `transition-all duration-200 hover:shadow-lg ${
                  !message.isRead ? 'ring-2 ring-orange-200 bg-orange-50/30' : 'border-orange-200'
                }`
              : `transition-all duration-200 hover:shadow-lg ${
                  !message.isRead ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''
                }`;
            
            return (
              <Card 
                key={message.id || `message-${message.createdAt || Date.now()}`} 
                className={cardClassName}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full ${getPriorityColor(priority)} flex items-center justify-center text-white text-lg`}>
                        {icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {message.title || 'Untitled Message'}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={isNotification ? "destructive" : "secondary"} className="text-xs">
                            {isNotification ? 'Notification' : 'Coaching'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {message.messageType ? message.messageType.replace('_', ' ') : 'Unknown'}
                          </Badge>
                          {message.triggerData?.isTest && (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              Test
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 'Unknown time'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      {!message.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => message.id && message.source && markAsReadMutation.mutate({ 
                            messageId: message.id, 
                            source: message.source 
                          })}
                          disabled={markAsReadMutation.isPending || !message.id}
                          className="text-xs"
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => message.id && message.source && clearMessageMutation.mutate({ 
                          messageId: message.id, 
                          source: message.source 
                        })}
                        disabled={clearMessageMutation.isPending || !message.id}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {message.content || 'No content available.'}
                    </p>
                  </div>
                  
                  {message.triggerData && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-medium text-gray-600 mb-1">Context</div>
                      
                      {/* Coaching message context */}
                      {message.source === 'coaching' && (
                        <>
                          {message.triggerData.streakCount !== undefined && message.triggerData.streakCount !== null && (
                            <div className="text-sm text-gray-700">
                              Streak: {message.triggerData.streakCount} days
                            </div>
                          )}
                          {message.triggerData.completionRate !== undefined && message.triggerData.completionRate !== null && (
                            <div className="text-sm text-gray-700">
                              Today's completion: {Math.round(message.triggerData.completionRate)}%
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Test notification context */}
                      {message.source === 'notification' && message.triggerData?.context && (
                        <>
                          {message.triggerData.context.daysInactive && (
                            <div className="text-sm text-gray-700">
                              Days Inactive: {message.triggerData.context.daysInactive}
                            </div>
                          )}
                          {message.triggerData.context.consistencyDrop && (
                            <div className="text-sm text-gray-700">
                              Consistency Drop: {message.triggerData.context.consistencyDrop}
                            </div>
                          )}
                          {message.triggerData.context.achievementType && (
                            <div className="text-sm text-gray-700">
                              Achievement: {message.triggerData.context.achievementType} ({message.triggerData.context.streakCount} days)
                            </div>
                          )}
                          {message.triggerData.context.analysisType && (
                            <div className="text-sm text-gray-700">
                              Analysis: {message.triggerData.context.analysisType} ({message.triggerData.context.confidence} confidence)
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}