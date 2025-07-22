import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sidebar } from "@/components/Sidebar";
import { HabitCard } from "@/components/HabitCard";
import { AIInsightCard } from "@/components/AIInsightCard";
import { AddHabitModal } from "@/components/AddHabitModal";
import { AIQuestionnaireModal } from "@/components/AIQuestionnaireModal";
import { CoachingDashboard } from "@/components/CoachingDashboard";
import { MLPredictionCard } from "@/components/MLPredictionCard";
import { HabitRecommendationCarousel } from "@/components/HabitRecommendationCarousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Habit } from "@/types/habits";
import { User } from "@/types/user";  

export default function Home() {
  const { user, isLoading: authLoading } = useAuth<User>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: habits, isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
    enabled: !!user,
  });

  const { data: completions, isLoading: completionsLoading } = useQuery<any[]>({
    queryKey: ["/api/completions", today],
    enabled: !!user,
  });

  const { data: insights } = useQuery<any[]>({
    queryKey: ["/api/insights"],
    enabled: !!user,
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: async ({
      habitId,
      completed,
    }: {
      habitId: number;
      completed: boolean;
    }) => {
      if (completed) {
        await apiRequest("/api/completions", "POST", {
          habitId,
          completedAt: today,
          value: 1,
        });
      } else {
        await apiRequest(`/api/completions/${habitId}/${today}`, "DELETE");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/completions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streaks"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update habit completion",
        variant: "destructive",
      });
    },
  });

  if (authLoading || habitsLoading || completionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const completedToday = Array.isArray(completions)
    ? completions.filter((c: any) => c.completedAt === today)
    : [];
  const completedHabitIds = new Set(completedToday.map((c) => c.habitId));

  const todayStats = {
    completed: completedToday.length,
    total: Array.isArray(habits) ? habits.length : 0,
    completionRate:
      Array.isArray(habits) && habits.length
        ? Math.round((completedToday.length / habits.length) * 100)
        : 0,
  };

  const currentStreak = Math.max(
    ...(Array.isArray(habits) ? habits.map((h: any) => 7) : [0]),
  ); // TODO: Get from streaks table
  const longestStreak = Math.max(
    ...(Array.isArray(habits) ? habits.map((h: any) => 12) : [0]),
  ); // TODO: Get from streaks table

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Today</h1>
            <button className="text-gray-600 hover:text-gray-900">
              <i className="fas fa-bell text-xl"></i>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary to-purple-600 text-white p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                    Good morning, {(user as any)?.firstName || "there"}! 🌅
                  </h2>
                  <p className="text-indigo-100 text-lg">
                    You're doing great! Keep up the momentum.
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{currentStreak}</div>
                  <div className="text-sm text-indigo-100">Day Streak</div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto p-6 lg:p-8">
            {/* AI Coaching Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                AI Coach
              </h2>
              <CoachingDashboard />
            </div>

            {/* AI Insight Card */}
            {insights && insights.length > 0 && (
              <AIInsightCard insight={insights[0]} className="mb-8" />
            )}

            {/* Today's Progress Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Completed</span>
                    <i className="fas fa-check-circle text-success"></i>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {todayStats.completed}
                  </div>
                  <div className="text-xs text-gray-500">
                    out of {todayStats.total} habits
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Streak</span>
                    <i className="fas fa-fire text-warning"></i>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {longestStreak}
                  </div>
                  <div className="text-xs text-gray-500">days longest</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">This Week</span>
                    <i className="fas fa-calendar-week text-primary"></i>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {todayStats.completionRate}%
                  </div>
                  <div className="text-xs text-gray-500">completion rate</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Level</span>
                    <i className="fas fa-star text-warning"></i>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {user.level || 1}
                  </div>
                  <div className="text-xs text-gray-500">
                    {180 - (user.xp || 0)} more XP
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Habit Recommendations */}
            <div className="mb-8">
              <HabitRecommendationCarousel />
            </div>

            {/* ML Prediction Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                AI Success Predictor
              </h3>
              <MLPredictionCard />
            </div>

            {/* Today's Habits */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900">HabitLoop</h1>
                <p className="text-gray-600">
                  Track your daily habits and progress
                </p>
              </div>

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Today's Habits
                </h3>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowQuestionnaire(true)}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <i className="fas fa-brain"></i>
                    <span className="hidden sm:inline">AI Setup</span>
                  </Button>
                  <Button
                    onClick={() => setShowAddHabit(true)}
                    className="flex items-center space-x-2"
                  >
                    <i className="fas fa-plus"></i>
                    <span className="hidden sm:inline">Add Habit</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {habits?.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    completed={completedHabitIds.has(habit.id)}
                    onToggle={(completed) =>
                      toggleCompletionMutation.mutate({
                        habitId: habit.id,
                        completed,
                      })
                    }
                    loading={toggleCompletionMutation.isPending}
                  />
                ))}

                {(!habits || habits.length === 0) && (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <i className="fas fa-plus-circle text-4xl mb-4 text-gray-300"></i>
                      <h4 className="text-lg font-medium mb-2">
                        No habits yet
                      </h4>
                      <p className="mb-4">
                        Start building better habits today!
                      </p>
                      <Button onClick={() => setShowAddHabit(true)}>
                        Add Your First Habit
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddHabit(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors lg:hidden flex items-center justify-center"
      >
        <i className="fas fa-plus text-xl"></i>
      </button>

      <AddHabitModal
        open={showAddHabit}
        onClose={() => setShowAddHabit(false)}
      />

      <AIQuestionnaireModal
        open={showQuestionnaire}
        onClose={() => setShowQuestionnaire(false)}
      />
    </div>
  );
}
