import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface CoachingMessage {
  id?: string;
  title: string;
  content: string;
  messageType?: string;
  source?: 'coaching' | 'notification';
  isRead?: boolean;
  createdAt?: string;
  triggerData?: {
    isTest?: boolean;
  };
}

export function CoachingMessages() {
  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/coaching/messages"],
    queryFn: async () => {
      const response = await apiRequest("coaching/messages", "GET");
      return response.json();
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

  const allMessages: CoachingMessage[] = messages?.messages || [];

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

  if (!allMessages || allMessages.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-lg font-semibold mb-2">Your AI Coach is Ready!</h3>
          <p className="text-gray-600 mb-4">
            Complete habits to unlock personalized coaching messages, streak celebrations, and motivational insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
                      className="text-xs"
                    >
                      Mark Read
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {message.content}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
