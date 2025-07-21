import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface CoachingMessage {
  id: number;
  userId: string;
  habitId?: number;
  messageType: string;
  title: string;
  content: string;
  triggerData?: any;
  isRead: boolean;
  createdAt: string;
}

export function CoachingDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coachingMessages, isLoading } = useQuery({
    queryKey: ["/api/coaching/messages"],
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest(`/api/coaching/messages/${messageId}/read`, "PUT");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/messages"] });
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

  const getMessageIcon = (messageType: string) => {
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

  const getMessagePriority = (messageType: string) => {
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

      {(!coachingMessages || coachingMessages.length === 0) ? (
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
          {coachingMessages.map((message: CoachingMessage) => {
            const priority = getMessagePriority(message.messageType);
            const icon = getMessageIcon(message.messageType);
            
            return (
              <Card 
                key={message.id} 
                className={`transition-all duration-200 hover:shadow-lg ${
                  !message.isRead ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full ${getPriorityColor(priority)} flex items-center justify-center text-white text-lg`}>
                        {icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {message.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {message.messageType.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {!message.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(message.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {message.content}
                    </p>
                  </div>
                  
                  {message.triggerData && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-medium text-gray-600 mb-1">Context</div>
                      {message.triggerData.streakCount && (
                        <div className="text-sm text-gray-700">
                          Streak: {message.triggerData.streakCount} days
                        </div>
                      )}
                      {message.triggerData.completionRate !== undefined && (
                        <div className="text-sm text-gray-700">
                          Today's completion: {Math.round(message.triggerData.completionRate)}%
                        </div>
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