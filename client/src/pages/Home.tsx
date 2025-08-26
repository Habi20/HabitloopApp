import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUISettings } from "@/hooks/useUISettings";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getCurrentDateString, getTimezoneWarning } from "@/lib/timezone";
import { Sidebar } from "@/components/Sidebar";
import { HabitCard } from "@/components/HabitCard";
import { AddHabitModal } from "@/components/AddHabitModal";
import { AIQuestionnaireModal } from "@/components/AIQuestionnaireModal";
import { HabitRecommendationCarousel } from "@/components/HabitRecommendationCarousel";
import { MLPredictionCard } from "@/components/MLPredictionCard";
import { CoachingDashboard } from "@/components/CoachingDashboard";
import { AIInsightCard } from "@/components/AIInsightCard";
import NotificationPanel from "@/components/NotificationPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Extend Window interface for request tracking
declare global {
  interface Window {
    activeRequests?: Set<string>;
  }
}

export default function Home() {
  const { user, refreshUserData, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { settings: uiSettings, isLoaded: uiSettingsLoaded } = useUISettings();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);

  // Check if questionnaire is completed
  useEffect(() => {
    const completed = localStorage.getItem("questionnaireCompleted") === "true";
    setQuestionnaireCompleted(completed);
  }, []);
  const [debugSectionMinimized, setDebugSectionMinimized] = useState(false);

  // Get current date in Sri Lanka timezone
  const today = getCurrentDateString();

  // Check for timezone warning
  const timezoneWarning = getTimezoneWarning();

  // Add timezone warning display
  const showTimezoneWarning = timezoneWarning && (
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center">
        <i className="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
        <span className="text-sm text-yellow-800">{timezoneWarning}</span>
      </div>
    </div>
  );

  // Show loading state while auth is loading
  useEffect(() => {
    if (authLoading) {
      return;
    }
  }, [user, authLoading, toast]);

  // Query for habits data
  const { data: habitsResponse, isLoading: habitsLoading } = useQuery<any>({
    queryKey: ["/api/habits"],
    enabled: !!user,
  });

  // Query for completions data with proper cache key
  const { data: completionsResponse, isLoading: completionsLoading } = useQuery<any>({
    queryKey: ["/api/completions", today],
    queryFn: async () => {
      const response = await apiRequest(`completions?date=${today}`, 'GET');
      return await response.json();
    },
    enabled: !!user,
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Query for insights
  const { data: insights } = useQuery<any>({
    queryKey: ["/api/insights"],
    enabled: !!user,
  });

  // Query for streaks data
  const { data: streaksData } = useQuery<any>({
    queryKey: ["/api/analytics/streaks"],
    enabled: !!user,
  });

  // Query for ML evaluation data
  const { data: mlEvaluation } = useQuery<any>({
    queryKey: ["/api/ml/evaluate"],
    queryFn: async () => {
      const response = await apiRequest("ml/evaluate", 'GET');
      return await response.json();
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });

  // Habit completion mutation with improved optimistic updates
  const toggleHabitCompletion = useMutation({
    mutationFn: async ({ habitId, isCompleted }: { habitId: number; isCompleted: boolean }) => {
      // Add request deduplication
      const requestKey = `habit-${habitId}-${isCompleted}`;
      if (window.activeRequests?.has(requestKey)) {
        throw new Error("Request already in progress");
      }
      
      // Track active request
      if (!window.activeRequests) window.activeRequests = new Set();
      window.activeRequests.add(requestKey);
      
      try {
                 if (!isCompleted) {
           const response = await apiRequest("completions/complete", "POST", {
             habitId,
             value: 1,
           });
          const result = await response.json();
          
          if (result.success && result.data.xpEarned > 0) {
            toast({
              title: "Habit Completed! 🎉",
              description: `+${result.data.xpEarned} XP earned!`,
            });
          }
          return result;
                 } else {
           const response = await apiRequest("completions/uncomplete", "POST", {
             habitId,
           });
          const result = await response.json();
          
          if (result.success && result.data.xpLost > 0) {
            toast({
              title: "Habit Uncompleted",
              description: `-${result.data.xpLost} XP lost`,
              variant: "destructive",
            });
          }
          return result;
        }
      } finally {
        // Remove request tracking
        window.activeRequests?.delete(requestKey);
      }
    },
    onMutate: async ({ habitId, isCompleted }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/completions", today] });
      
      // Snapshot the previous value
      const previousCompletions = queryClient.getQueryData(["/api/completions", today]);
      
      // Optimistically update the completions cache with proper date format
      queryClient.setQueryData(["/api/completions", today], (old: any) => {
        if (!old) return old;
        
        // FIXED: isCompleted means "is currently completed", so we want to add when !isCompleted
        if (!isCompleted) {
          // Adding completion - use exact same format as backend
          const newCompletion = {
            id: Date.now(), // Temporary ID
            habitId,
            userId: user?.id,
            completedAt: today, // Use exact same date format as backend
            value: 1,
            createdAt: new Date().toISOString(),
          };
          
          return {
            ...old,
            completions: [...(old.completions || []), newCompletion],
            count: (old.count || 0) + 1,
          };
        } else {
          // Removing completion
          return {
            ...old,
            completions: (old.completions || []).filter((c: any) => c.habitId !== habitId),
            count: Math.max(0, (old.count || 0) - 1),
          };
        }
      });
      
      // Return context for rollback
      return { previousCompletions };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousCompletions) {
        queryClient.setQueryData(["/api/completions", today], context.previousCompletions);
      }
      
      if (error.message === "Request already in progress") {
        toast({
          title: "Please wait",
          description: "Processing your previous request...",
          variant: "default",
        });
        return;
      }
      
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
        description: "Failed to update habit completion",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Force refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ["/api/completions", today] });
      
      // Invalidate related queries with proper timing
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/streaks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/xp-calculation"] });
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
        // Invalidate ML predictions to ensure they update with new user data
        queryClient.invalidateQueries({ queryKey: ["/api/ml/evaluate"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ml/predictions"] });
        
        // Refresh user data after a delay to ensure XP/level updates
        setTimeout(() => {
          refreshUserData();
        }, 500);
      }, 100);
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

  const habits = habitsResponse?.habits || [];
  const completions = completionsResponse?.completions || [];

  // Improved date comparison logic - handle exact string matching
  const completedToday = completions.filter((c: any) => {
    // Ensure both dates are in the same format for comparison
    const completionDate = typeof c.completedAt === 'string' ? c.completedAt : c.completedAt?.toISOString?.()?.split('T')[0];
    return completionDate === today;
  }) || [];
  
  // Create Set of completed habit IDs for efficient lookup
  const completedHabitIds = new Set(completedToday.map((c: any) => c.habitId));



  const currentStreak = streaksData?.data?.summary?.totalCurrentStreak || 0;
  const longestStreak = streaksData?.data?.summary?.totalLongestStreak || 0;

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
            <NotificationPanel />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary to-purple-600 text-white p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">
            <div className="max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2">
                    Good morning, {user.firstName || "there"}! 🌅
                  </h2>
                  <p className="text-indigo-100 text-sm sm:text-base md:text-lg lg:text-xl">
                    You're doing great! Keep up the momentum.
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{currentStreak}</div>
                  <div className="text-xs sm:text-sm md:text-base text-indigo-100">Day Streak</div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">
            {showTimezoneWarning}
            
            {/* Stats Cards - Moved to top */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-6 sm:mb-8 md:mb-10 lg:mb-12">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
                  <i className="fas fa-list text-muted-foreground"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{habits?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Active habits
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
                  <i className="fas fa-chart-line text-muted-foreground"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedToday.length}/{habits?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {habits?.length ? Math.round((completedToday.length / habits.length) * 100) : 0}% completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <i className="fas fa-fire text-muted-foreground"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentStreak}</div>
                  <p className="text-xs text-muted-foreground">
                    Longest: {longestStreak} days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Level & XP</CardTitle>
                  <i className="fas fa-star text-muted-foreground"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Level {user?.level || 1}</div>
                  <p className="text-xs text-muted-foreground">
                    {user?.xp || 0} XP • {100 - ((user?.xp || 0) % 100)} more XP
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Debug Section - Data Consistency Check */}
            {mlEvaluation && uiSettingsLoaded && uiSettings.showDataConsistencyCheck && (
              <Card className="mb-6 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-sm text-orange-800 flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle"></i>
                    Data Consistency Check
                    <div className="ml-auto flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setDebugSectionMinimized(!debugSectionMinimized)}
                      >
                        <i className={`fas ${debugSectionMinimized ? 'fa-expand' : 'fa-compress'} mr-2`}></i>
                        {debugSectionMinimized ? 'Show' : 'Minimize'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async () => {
                          try {
                                                         const response = await apiRequest("analytics/audit-xp", 'POST');
                            const result = await response.json();
                            if (result.success) {
                              toast({
                                title: "XP Audit Complete",
                                description: result.message,
                              });
                              // Refresh user data after audit
                              setTimeout(() => refreshUserData(), 1000);
                            } else {
                              toast({
                                title: "XP Audit Failed",
                                description: result.error || "Unknown error",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            console.error('XP Audit error:', error);
                            toast({
                              title: "XP Audit Failed",
                              description: "Failed to audit XP data",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <i className="fas fa-search mr-2"></i>
                        Audit XP
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={refreshUserData}
                      >
                        <i className="fas fa-sync-alt mr-2"></i>
                        Refresh User Data
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.location.reload()}
                      >
                        <i className="fas fa-redo mr-2"></i>
                        Force Refresh
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                {!debugSectionMinimized && (
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-orange-800 mb-2">Frontend Data (Cached)</h4>
                        <p>Level: {user?.level || 'N/A'}</p>
                        <p>XP: {user?.xp || 'N/A'}</p>
                        <p>Habits: {habits?.length || 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-800 mb-2">ML Data (Fresh from DB)</h4>
                        <p>Level: {mlEvaluation?.user_profile?.level || 'N/A'}</p>
                        <p>XP: {mlEvaluation?.user_profile?.xp || 'N/A'}</p>
                        <p>Habits: {mlEvaluation?.user_profile?.existing_habits_count || 'N/A'}</p>
                        <p>Success Rate: {mlEvaluation?.prediction?.successProbability ? `${Math.round(mlEvaluation.prediction.successProbability * 100)}%` : 'N/A'}</p>
                      </div>
                    </div>
                    {(user?.level !== mlEvaluation?.user_profile?.level || 
                      user?.xp !== mlEvaluation?.user_profile?.xp) && (
                      <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-xs">
                        ⚠️ Data mismatch detected! Frontend is using stale data. Click "Refresh User Data" to sync.
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Today's Habits - Moved up after stats */}
            <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                  Today's Habits
                </h3>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {!questionnaireCompleted && uiSettings.showAIQuestionnaire && (
                    <Button
                      onClick={() => setShowQuestionnaire(true)}
                      variant="outline"
                      className="flex items-center justify-center space-x-2 w-full sm:w-auto text-sm sm:text-base"
                    >
                      <i className="fas fa-brain"></i>
                      <span className="hidden sm:inline">AI Setup</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowAddHabit(true)}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto text-sm sm:text-base"
                  >
                    <i className="fas fa-plus"></i>
                    <span className="hidden sm:inline">Add Habit</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {habits.map((habit: any) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    completed={completedHabitIds.has(habit.id)}
                    onToggle={(_completed) => {
                      toggleHabitCompletion.mutate({
                        habitId: habit.id,
                        isCompleted: completedHabitIds.has(habit.id), // Pass current completion status, not desired status
                      });
                    }}
                    loading={toggleHabitCompletion.isPending}
                  />
                ))}

                {habits.length === 0 && (
                  <Card>
                    <CardContent className="p-6 sm:p-8 text-center text-gray-500">
                      <i className="fas fa-plus-circle text-3xl sm:text-4xl mb-4 text-gray-300"></i>
                      <h4 className="text-lg font-medium mb-2">
                        No habits yet
                      </h4>
                      <p className="mb-4 text-sm sm:text-base">
                        Start building better habits today!
                      </p>
                      <Button onClick={() => setShowAddHabit(true)} className="w-full sm:w-auto">
                        Add Your First Habit
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* AI Habit Recommendations - Moved after Today's Habits */}
            <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
              <HabitRecommendationCarousel />
            </div>

            {/* Notifications and User Insights - Renamed from AI Coach */}
            <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-3 sm:mb-4 md:mb-6">
                Notifications and User Insights
              </h2>
              <CoachingDashboard />
            </div>

            {/* AI Insight Card */}
            {insights && insights.length > 0 && (
              <AIInsightCard insight={insights[0]} className="mb-6 sm:mb-8 md:mb-10 lg:mb-12" />
            )}

            {/* ML Prediction Section */}
            {uiSettingsLoaded && uiSettings.showMLSuccessPredictor && (
              <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6">
                  AI Success Predictor
                </h3>
                <MLPredictionCard />
              </div>
            )}
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
