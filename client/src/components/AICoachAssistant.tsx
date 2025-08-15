import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Habit, Completion } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const [selectedService, setSelectedService] = useState<string>("");
  const [userQuestion, setUserQuestion] = useState("");
  const [coachResponse, setCoachResponse] = useState("");

  const { data: habitsResponse } = useQuery({
    queryKey: ["/api/habits"],
    enabled: open,
  });

  const { data: completionsResponse } = useQuery({
    queryKey: ["/api/completions"],
    enabled: open,
  });

  // Extract data from the response structure with proper typing
  const habits: Habit[] = (habitsResponse as any)?.habits || [];
  const completions: Completion[] = (completionsResponse as any)?.completions || [];

  const generateInsightMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await apiRequest("/api/insights/generate", "POST", {
        type,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setCoachResponse(data.insight || data.message || "Response received");
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
      const response = await apiRequest("/api/coach/ask", "POST", {
        question,
        context: {
          habits: habits || [],
          recentCompletions: completions || [],
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
    generateInsightMutation.mutate(serviceId);
  };

  const handleAskQuestion = () => {
    if (!userQuestion.trim()) return;
    askCoachMutation.mutate(userQuestion);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-purple-600" />
            AI Coach Assistant
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Get personalized guidance, insights, and support for your habit
            journey
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Quick Assistance
            </h3>
            <div className="space-y-3">
              {coachServices.map((service) => {
                const IconComponent = service.icon;
                return (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                      selectedService === service.id
                        ? "border-purple-300 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleServiceSelect(service.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`${service.color} p-2 rounded-lg`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {service.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Ask Custom Question */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Ask Your Coach
              </h3>
              <div className="space-y-3">
                <Textarea
                  placeholder="Ask me anything about your habits, motivation, or challenges..."
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button
                  onClick={handleAskQuestion}
                  disabled={!userQuestion.trim() || askCoachMutation.isPending}
                  className="w-full"
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Coach Response
            </h3>

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
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="bg-purple-600 p-2 rounded-full">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Your AI Coach Says:
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        Personalized for you
                      </Badge>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <div
                      className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: coachResponse
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\*(.*?)\*/g, "<em>$1</em>")
                          .replace(/•/g, "•")
                          .replace(
                            /🎯|🔄|📈|🤝|🔥|💪|⚡|💡|📅|🛠️|🚧|🌟|🏆/g,
                            '<span class="text-lg">$&</span>'
                          ),
                      }}
                    />
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

            {/* Habit Summary */}
            {habits && Array.isArray(habits) && habits.length > 0 && (
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
      </DialogContent>
    </Dialog>
  );
}
