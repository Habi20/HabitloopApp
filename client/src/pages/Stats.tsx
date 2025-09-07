import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";

export default function Stats() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
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
  }, [user, authLoading, toast]);

  const { data: habitsResponse } = useQuery({
    queryKey: ["/api/habits"],
    queryFn: async () => {
      const response = await apiRequest("habits", 'GET');
      return await response.json();
    },
    enabled: !!user,
  });

  const { data: completionsResponse } = useQuery({
    queryKey: ["/api/completions"],
    queryFn: async () => {
      const response = await apiRequest("completions", 'GET');
      return await response.json();
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const habits = (habitsResponse as any)?.habits || [];
  const completions = (completionsResponse as any)?.completions || [];

  const habitsArray = habits || [];
  const completionsArray = completions || [];

  const habitStats = habitsArray.map((habit: any) => {
    const habitCompletions = completionsArray.filter(
      (c: any) => c.habitId === habit.id
    );
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    });

    const completedLast7Days = last7Days.filter((date) =>
      habitCompletions.some((c: any) => c.completedAt === date)
    ).length;

    return {
      ...habit,
      completions: habitCompletions.length,
      last7DaysRate: Math.round((completedLast7Days / 7) * 100),
    };
  });

  return (
    <Layout 
      showSidebar={true}
      sidebarOpen={sidebarOpen}
      onSidebarToggle={setSidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      pageTitle="Your Stats"
    >
      <div className="max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
        {/* Removed duplicate page title - now shown in header */}

          {/* Overall Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-4 sm:mb-6 md:mb-8 lg:mb-10">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Habits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {habits.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Completions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {completions.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Current Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {user.level || 1}
                </div>
                <div className="text-sm text-gray-600">{user.xp || 0} XP</div>
              </CardContent>
            </Card>
          </div>

          {/* Habit Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Habit Performance (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {habitStats.map((habit: any) => (
                  <div key={habit.id} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {habit.title}
                        </h4>
                        <span className="text-sm text-gray-600">
                          {habit.last7DaysRate}%
                        </span>
                      </div>
                      <Progress value={habit.last7DaysRate} className="h-2" />
                    </div>
                  </div>
                ))}

                {habitStats.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-chart-bar text-4xl mb-4 text-gray-300"></i>
                    <p>
                      No habits to display. Start tracking some habits to see
                      your stats!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
