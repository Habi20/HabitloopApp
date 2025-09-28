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
    queryKey: ["/api/habits", user?.id],
    queryFn: async () => {
      const response = await apiRequest("habits", 'GET');
      return await response.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  const { data: completionsResponse } = useQuery({
    queryKey: ["/api/completions"],
    queryFn: async () => {
      const response = await apiRequest("completions", 'GET');
      return await response.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Query for streaks data (same as Home.tsx)
  const { data: streaksData } = useQuery({
    queryKey: ["/api/analytics/streaks"],
    queryFn: async () => {
      const response = await apiRequest("analytics/streaks", 'GET');
      return await response.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
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

  // Get current streak from analytics API (same as Home.tsx)
  const currentStreak = streaksData?.data?.summary?.totalCurrentStreak || 0;

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
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-blue-700 flex items-center">
                  <i className="fas fa-list-check mr-2 text-blue-600"></i>
                  Total Habits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">
                  {habits.length || 0}
                </div>
                <div className="text-sm text-blue-600 mt-1">Active habits</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-green-700 flex items-center">
                  <i className="fas fa-check-circle mr-2 text-green-600"></i>
                  Total Completions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">
                  {completions.length || 0}
                </div>
                <div className="text-sm text-green-600 mt-1">All time</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-purple-700 flex items-center">
                  <i className="fas fa-star mr-2 text-purple-600"></i>
                  Current Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">
                  {user.level || 1}
                </div>
                <div className="text-sm text-purple-600 mt-1">{user.xp || 0} XP</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-orange-700 flex items-center">
                  <i className="fas fa-fire mr-2 text-orange-600"></i>
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">
                  {currentStreak}
                </div>
                <div className="text-sm text-orange-600 mt-1">Days in a row</div>
              </CardContent>
            </Card>
          </div>

          {/* Habit Performance */}
          <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
            <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100 rounded-t-lg">
              <CardTitle className="text-sm sm:text-base lg:text-lg text-slate-800 flex items-center">
                <i className="fas fa-chart-line mr-2 text-slate-600"></i>
                Habit Performance (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {habitStats.map((habit: any) => (
                  <div key={habit.id} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                          {habit.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                            habit.last7DaysRate >= 80 ? 'bg-green-100 text-green-800' :
                            habit.last7DaysRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {habit.last7DaysRate}%
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={habit.last7DaysRate} 
                        className={`h-3 ${
                          habit.last7DaysRate >= 80 ? '[&>div]:bg-green-500' :
                          habit.last7DaysRate >= 50 ? '[&>div]:bg-yellow-500' :
                          '[&>div]:bg-orange-500'
                        }`} 
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{habit.completions} total completions</span>
                        <span>Last 7 days</span>
                      </div>
                    </div>
                  </div>
                ))}

                {habitStats.length === 0 && (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-200">
                    <i className="fas fa-chart-bar text-5xl mb-4 text-gray-300"></i>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Habits Yet</h3>
                    <p className="text-sm">
                      Start tracking some habits to see your performance stats!
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
