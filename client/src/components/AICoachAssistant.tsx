import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Habit, Completion } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
// import { getHabitEmoji } from "@/utils/emojiMapper"; // Removed unused import
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getMobileModalHeader, getMobileModalBody, getMobileModalFooter, getMobileButtonClasses } from "@/lib/utils";
import { useScreenSize } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  MessageCircle,
  Target,
  TrendingUp,
  Lightbulb,
  Calendar,
} from "lucide-react";

interface AICoachAssistantProps {
  open: boolean;
  onClose: () => void;
}

export function AICoachAssistant({ open, onClose }: AICoachAssistantProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isMobile } = useScreenSize();
  const [selectedService, setSelectedService] = useState<string>("");
  const [userQuestion, setUserQuestion] = useState("");
  const [coachResponse, setCoachResponse] = useState("");

  const { data: habitsResponse } = useQuery({
    queryKey: ["/api/habits", user?.id],
    queryFn: async () => {
      const response = await apiRequest("habits", 'GET');
      return await response.json();
    },
    enabled: open && !!user,
  });

  const { data: completionsResponse } = useQuery({
    queryKey: ["/api/completions"],
    queryFn: async () => {
      const response = await apiRequest("completions", 'GET');
      return await response.json();
    },
    enabled: open,
  });

  // Extract data from the response structure with proper typing
  const habits: Habit[] = (habitsResponse as any)?.habits || [];
  const completions: Completion[] = (completionsResponse as any)?.completions || [];

  const generateInsightMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("insights/generate", "POST", {
        habits,
        completions,
        userLevel: user?.level || 1,
        totalXP: (user as any)?.totalXP || 0,
        serviceType: selectedService || 'general',
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setCoachResponse(data.response || data.insight || data.message || "Response received");
      toast({
        title: "AI Coach Response",
        description: "Generated personalized guidance based on your habits",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate insight. Please try again.",
        variant: "destructive",
      });
    },
  });

  const askCoachMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("coach/ask", "POST", {
        question,
        context: {
          habits: habits || [],
          completions: completions || [],
        },
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setCoachResponse(data.response || "Response received");
      setUserQuestion("");
      toast({
        title: "AI Coach Response",
        description: "Generated personalized advice for your question",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to get coach response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const coachServices = [
    {
      id: "progress_analysis",
      title: "Progress Analysis",
      description:
        "Get insights on your habit completion patterns and streak analysis",
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      id: "motivation_boost",
      title: "Motivation Boost",
      description:
        "Receive personalized motivational messages and encouragement",
      icon: Target,
      color: "bg-blue-500",
    },
    {
      id: "habit_optimization",
      title: "Habit Optimization",
      description:
        "Get suggestions to improve your current habits and routines",
      icon: Lightbulb,
      color: "bg-yellow-500",
    },
    {
      id: "weekly_planning",
      title: "Weekly Planning",
      description: "Strategic guidance for planning your upcoming week",
      icon: Calendar,
      color: "bg-purple-500",
    },
    {
      id: "obstacle_solving",
      title: "Obstacle Solving",
      description: "Get help overcoming specific challenges and barriers",
      icon: Brain,
      color: "bg-red-500",
    },
  ];

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setCoachResponse("");
    // Trigger mutation with the selected service
    setTimeout(() => {
      generateInsightMutation.mutate();
    }, 100);
  };

  const handleAskQuestion = () => {
    if (!userQuestion.trim()) return;
    askCoachMutation.mutate(userQuestion);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] overflow-hidden"
        mobileVariant="bottom-sheet"
      >
        {/* Header - Mobile optimized */}
        <DialogHeader className={getMobileModalHeader(isMobile)}>
          <DialogTitle className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-900 flex items-center`}>
            <Brain className="w-6 h-6 mr-2 text-purple-600" />
            AI Coach Assistant
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Get personalized guidance, insights, and support for your habit
            journey
          </DialogDescription>
        </DialogHeader>

        {/* Content - Scrollable body */}
        <div className={getMobileModalBody(isMobile)}>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Services Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Quick Assistance
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {coachServices.map((service) => {
                const IconComponent = service.icon;
                return (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] border-2 ${
                      selectedService === service.id
                        ? "border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg scale-[1.01]"
                        : "border-gray-200 hover:border-indigo-200 bg-white"
                    }`}
                    onClick={() => handleServiceSelect(service.id)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`${service.color} p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-md transform transition-transform duration-200 ${
                          selectedService === service.id ? 'scale-105' : 'hover:scale-105'
                        }`}>
                          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base truncate">
                            {service.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 leading-tight line-clamp-2">
                            {service.description}
                          </p>
                          {selectedService === service.id && (
                            <div className="mt-1 flex items-center text-indigo-600 text-xs font-medium">
                              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5 animate-pulse"></div>
                              Selected
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Ask Custom Question */}
            <div className="border-t pt-3 sm:pt-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                Ask Your Coach
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <Textarea
                  placeholder="Ask me anything about your habits, motivation, or challenges..."
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  className="min-h-[80px] sm:min-h-[100px] resize-none text-sm"
                />
                <Button
                  onClick={handleAskQuestion}
                  disabled={!userQuestion.trim() || askCoachMutation.isPending}
                  className="w-full text-sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {askCoachMutation.isPending
                    ? "Getting Response..."
                    : "Ask Coach"}
                </Button>
              </div>
            </div>
          </div>

          {/* Response Panel */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Coach Response
              </h3>
            </div>

            {generateInsightMutation.isPending || askCoachMutation.isPending ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="text-gray-600">
                      Generating personalized response...
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : coachResponse ? (
              <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  {/* Enhanced Header */}
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 sm:p-3 rounded-xl shadow-lg">
                      <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                          Your AI Coach
                        </h4>
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200 font-medium text-xs">
                        ✨ Personalized for you
                      </Badge>
                    </div>
                  </div>

                  {/* Enhanced Response Content */}
                  <div className="relative">
                    <div className="absolute -top-1 -left-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-300 rounded-full opacity-60"></div>
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-pink-300 rounded-full opacity-60"></div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/50 shadow-inner max-h-96 overflow-y-auto">
                      <div className="space-y-3">
                        {coachResponse.split('\n').map((line, index) => {
                          if (!line.trim()) return null;
                          
                          // Extract emoji and content
                          const emojiMatch = line.match(/^([^\s]+)\s+(.+)$/);
                          if (!emojiMatch) return null;
                          
                          const [, emoji, content] = emojiMatch;
                          const isWin = emoji.includes('🏆');
                          const isInsight = emoji.includes('🧠');
                          const isChallenge = emoji.includes('➡️');
                          const isIdentity = emoji.includes('💡');
                          
                          let bgColor = 'bg-gray-50';
                          let borderColor = 'border-gray-200';
                          let textColor = 'text-gray-800';
                          
                          if (isWin) {
                            bgColor = 'bg-green-50';
                            borderColor = 'border-green-200';
                            textColor = 'text-green-800';
                          } else if (isInsight) {
                            bgColor = 'bg-blue-50';
                            borderColor = 'border-blue-200';
                            textColor = 'text-blue-800';
                          } else if (isChallenge) {
                            bgColor = 'bg-orange-50';
                            borderColor = 'border-orange-200';
                            textColor = 'text-orange-800';
                          } else if (isIdentity) {
                            bgColor = 'bg-purple-50';
                            borderColor = 'border-purple-200';
                            textColor = 'text-purple-800';
                          }
                          
                          return (
                            <div
                              key={index}
                              className={`${bgColor} ${borderColor} border rounded-lg p-3 transition-all duration-200 hover:shadow-sm`}
                            >
                              <div className="flex items-start space-x-3">
                                <span className="text-lg sm:text-xl flex-shrink-0">
                                  {emoji}
                                </span>
                                <span className={`${textColor} text-sm leading-relaxed font-medium`}>
                                  {content}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                    <Button 
                      onClick={() => setCoachResponse("")} 
                      variant="outline" 
                      className="flex-1 bg-white/50 hover:bg-white/80 border-indigo-200 text-indigo-700 text-sm"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Ask Another Question
                    </Button>
                    <Button 
                      onClick={() => generateInsightMutation.mutate()} 
                      className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg text-sm"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Get New Insight
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 text-center">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to Help!
                  </h4>
                  <p className="text-gray-600">
                    Select a service or ask a question to get personalized
                    guidance from your AI coach.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Habit Summary - Only show when no coach response */}
            {!coachResponse && habits && Array.isArray(habits) && habits.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Your Current Habits
                  </h4>
                  <div className="space-y-2">
                    {habits.slice(0, 3).map((habit: Habit) => (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700">{habit.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {habit.category}
                        </Badge>
                      </div>
                    ))}
                    {habits.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{habits.length - 3} more habits
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </div>

        {/* Footer - Mobile optimized */}
        <div className={getMobileModalFooter(isMobile)}>
          <Button
            onClick={onClose}
            className={getMobileButtonClasses('outline', isMobile)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
