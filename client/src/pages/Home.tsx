import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUISettings } from "@/hooks/useUISettings";
import { useScreenSize } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getCurrentDateString, getTimezoneWarning } from "@/lib/timezone";

// Time-based greeting function
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return { greeting: "Good morning", icon: "🌅" };
  } else if (hour < 17) {
    return { greeting: "Good afternoon", icon: "☀️" };
  } else {
    return { greeting: "Good evening", icon: "🌙" };
  }
};
// import { Sidebar } from "@/components/Sidebar";
import { Layout } from "@/components/Layout";
import { HabitCard } from "@/components/HabitCard";
import { AddHabitModal } from "@/components/AddHabitModal";
import { AIQuestionnaireModal } from "@/components/AIQuestionnaireModal";
import { WelcomeTourModal } from "@/components/WelcomeTourModal";
import { MLPredictionCard } from "@/components/MLPredictionCard";
// import { CoachingMessages } from "@/components/CoachingMessages";
import { AIInsightCard } from "@/components/AIInsightCard";
// import NotificationPanel from "@/components/NotificationPanel";
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
  const { isMobile } = useScreenSize();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  
  // Coaching insight generation mutation - commented out for VIVA
  // const generateInsightMutation = useMutation({
  //   mutationFn: async () => {
  //     const response = await apiRequest("coaching/generate-insight", "POST");
  //     return response.json();
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["/api/coaching/messages"] });
  //     toast({
  //       title: "New Insight Generated",
  //       description: "Your AI coach has provided new personalized guidance.",
  //     });
  //   },
  //   onError: () => {
  //     toast({
  //       title: "Error",
  //       description: "Failed to generate coaching insight. Please try again.",
  //       variant: "destructive",
  //     });
  //   },
  // });
  
// sidebarOpen
  // Check if questionnaire is completed
  useEffect(() => {
    const completed = localStorage.getItem("questionnaireCompleted") === "true";
    setQuestionnaireCompleted(completed);
  }, []);

  // Show welcome tour for new users (first time visiting home after signup)
  useEffect(() => {
    const hasSeenWelcomeTour = localStorage.getItem("hasSeenWelcomeTour");
    const isNewUser = localStorage.getItem("isNewUser") === "true";
    
    if (isNewUser && !hasSeenWelcomeTour) {
      setShowWelcomeTour(true);
      // Mark as seen and remove new user flag
      localStorage.setItem("hasSeenWelcomeTour", "true");
      localStorage.removeItem("isNewUser");
    }
  }, []);

  // Sidebar state management
  useEffect(() => {
    // Auto-close sidebar on mobile when route changes
    const handleRouteChange = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleRouteChange);
    return () => window.removeEventListener('resize', handleRouteChange);
  }, [setSidebarOpen]);

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
    queryKey: ["/api/habits", user?.id],
    queryFn: async () => {
      const response = await apiRequest("habits", 'GET');
      return await response.json();
    },
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
    queryFn: async () => {
      const response = await apiRequest("insights", 'GET');
      return await response.json();
    },
    enabled: !!user,
  });

  // Query for streaks data
  const { data: streaksData } = useQuery<any>({
    queryKey: ["/api/analytics/streaks"],
    queryFn: async () => {
      const response = await apiRequest("analytics/streaks", 'GET');
      return await response.json();
    },
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
          // Habit is not completed, so complete it
          const response = await apiRequest("completions/complete", "POST", {
            habitId,
            value: 1,
          });
          const result = await response.json();
          
          if (result.success && result.data.xpEarned > 0) {
            toast({
              title: "Habit Completed! 🎉",
              description: `+${result.data.xpEarned} XP earned!`,
              className: "bg-green-50 border-green-200 text-green-800",
            });
          }
          return result;
        } else {
          // Habit is completed, so uncomplete it
          const response = await apiRequest("completions/uncomplete", "POST", {
            habitId,
          });
          const result = await response.json();
          
          if (result.success && result.data.xpLost > 0) {
            toast({
              title: "Habit Uncompleted",
              description: `-${result.data.xpLost} XP lost`,
              className: "bg-amber-50 border-amber-200 text-amber-800",
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
      // Track habit change for logout protection
      localStorage.setItem('habitloop_last_habit_change', Date.now().toString());
      
      // Force refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ["/api/completions", today] });
      queryClient.invalidateQueries({ queryKey: ["/api/completions"] }); // Invalidate general completions query
      queryClient.invalidateQueries({ queryKey: ["/api/habits", user?.id] }); // Invalidate habits query for stats
      
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
    <>
      <Layout 
        showSidebar={true}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={setSidebarOpen}
        onSidebarOpen={() => setSidebarOpen(true)}
        pageTitle="Today"
      >
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary to-purple-600 text-white p-3 sm:p-6 md:p-8 lg:p-10 xl:p-12">
            <div className="max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-1 sm:mb-2">
                    {(() => {
                      const { greeting, icon } = getTimeBasedGreeting();
                      return `${greeting}, ${user.firstName || "there"}! ${icon}`;
                    })()}
                  </h2>
                  <p className="text-indigo-100 text-xs sm:text-base md:text-lg lg:text-xl">
                    You're doing great! Keep up the momentum.
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 bg-white/20 backdrop-blur-sm rounded-xl p-2 sm:p-4 md:p-5 lg:p-6 text-center">
                  <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold">{currentStreak}</div>
                  <div className="text-xs sm:text-sm md:text-base text-indigo-100">Day Streak</div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-1 sm:px-6 md:px-8 lg:px-10 xl:px-12 w-full overflow-x-hidden">
            {showTimezoneWarning}
            
            {/* Stats Cards - Compact on mobile, grid on desktop */}
            <div className="mt-3 sm:mt-8 mb-3 sm:mb-6">
              {isMobile ? (
              <div className="grid grid-cols-2 gap-1 mb-3">
                <Card className="h-16">
                  <CardContent className="p-2 flex flex-col justify-center">
                    <div className="text-base font-bold">{habits?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Habits</div>
                  </CardContent>
                </Card>
                
                <Card className="h-16">
                  <CardContent className="p-2 flex flex-col justify-center">
                    <div className="text-base font-bold">{completedToday.length}/{habits?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">
                      {habits?.length ? Math.round((completedToday.length / habits.length) * 100) : 0}% done
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="h-16">
                  <CardContent className="p-2 flex flex-col justify-center">
                    <div className="text-base font-bold">{currentStreak}</div>
                    <div className="text-xs text-muted-foreground">
                      {longestStreak} max
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="h-16">
                  <CardContent className="p-2 flex flex-col justify-center">
                    <div className="text-base font-bold">L{user?.level || 1}</div>
                    <div className="text-xs text-muted-foreground">
                      {user?.xp || 0} XP
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Habits</CardTitle>
                    <i className="fas fa-list text-gray-400 text-sm"></i>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-gray-900">{habits?.length || 0}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Active
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Today's Progress</CardTitle>
                    <i className="fas fa-chart-line text-gray-400 text-sm"></i>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-gray-900">{completedToday.length}/{habits?.length || 0}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      {habits?.length ? Math.round((completedToday.length / habits.length) * 100) : 0}% done
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Current Streak</CardTitle>
                    <i className="fas fa-fire text-gray-400 text-sm"></i>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-gray-900">{currentStreak}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Best: {longestStreak}d
                    </p>
                  </CardContent>
                </Card>

                        <Card className="hover:shadow-lg transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Level & XP</CardTitle>
                                <i className="fas fa-star text-gray-400 text-sm"></i>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-2xl font-bold text-gray-900">L{user?.level || 1}</div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {user?.xp || 0} XP • +{100 - ((user?.xp || 0) % 100)} to LevelUp
                                </p>
                            </CardContent>
                        </Card>
              </div>
            )}
            </div>

            {/* Debug Section - Data Consistency Check */}
            {mlEvaluation && uiSettingsLoaded && uiSettings.showDataConsistencyCheck && (
              <Card className="mb-6 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-xs sm:text-sm text-orange-800 flex items-center gap-1 sm:gap-2">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span className="hidden xs:inline">Data Consistency Check</span>
                    <span className="xs:hidden">Debug</span>
                    <div className="ml-auto flex gap-1 sm:gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setDebugSectionMinimized(!debugSectionMinimized)}
                        className="text-xs px-2"
                      >
                        <i className={`fas ${debugSectionMinimized ? 'fa-expand' : 'fa-compress'} mr-1`}></i>
                        <span className="hidden sm:inline">{debugSectionMinimized ? 'Show' : 'Minimize'}</span>
                        <span className="sm:hidden">{debugSectionMinimized ? 'Show' : 'Hide'}</span>
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
                        className="text-xs px-2"
                      >
                        <i className="fas fa-search mr-1"></i>
                        <span className="hidden sm:inline">Audit XP</span>
                        <span className="sm:hidden">Audit</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={refreshUserData}
                        className="text-xs px-2"
                      >
                        <i className="fas fa-sync-alt mr-1"></i>
                        <span className="hidden sm:inline">Refresh User Data</span>
                        <span className="sm:hidden">Refresh</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.location.reload()}
                        className="text-xs px-2"
                      >
                        <i className="fas fa-redo mr-1"></i>
                        <span className="hidden sm:inline">Force Refresh</span>
                        <span className="sm:hidden">Reload</span>
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                {!debugSectionMinimized && (
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm">
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
            <div className="mb-3 sm:mb-8 md:mb-10 lg:mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-6 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex-shrink-0">
                  Today's Habits
                </h3>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto min-w-0">
                  {!questionnaireCompleted && uiSettings.showAIQuestionnaire && (
                    <Button
                      onClick={() => setShowQuestionnaire(true)}
                      variant="outline"
                      className="flex items-center justify-center space-x-1 w-full sm:w-auto text-xs px-3 py-2"
                    >
                      <i className="fas fa-brain text-xs"></i>
                      <span className="text-xs">AI Setup</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowAddHabit(true)}
                    className="flex items-center justify-center space-x-1 w-full sm:w-auto text-xs px-3 py-2"
                  >
                    <i className="fas fa-plus text-xs"></i>
                    <span className="text-xs">Add Habit</span>
                  </Button>
                </div>
              </div>

              {/* Instructions for habit completion */}
              {habits.length > 0 && (
                <div className="mb-2 sm:mb-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <i className="fas fa-info-circle text-blue-500 mt-0.5 text-xs sm:text-sm"></i>
                    <div className="text-xs sm:text-sm text-blue-700">
                      <p className="font-medium mb-1">How to complete habits:</p>
                      <p className="text-xs">
                        • Click the circular button on the left of each habit
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className={`space-y-4 ${uiSettings.allNotifications ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
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


            {/* AI Coach Section - Hidden for VIVA presentation */}
            {/* 
            {uiSettings.allNotifications && (
              <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1">
                    <div className="sticky top-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Personalized Habit Insights
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        AI-powered insights and recommendations for your habit journey
                      </p>
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                        <div className="text-center">
                          <i className="fas fa-lightbulb text-2xl text-blue-600 mb-2"></i>
                          <p className="text-sm text-gray-700 mb-3">
                            Ready to help you succeed!
                          </p>
                          <button 
                            onClick={() => generateInsightMutation.mutate()}
                            disabled={generateInsightMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {generateInsightMutation.isPending ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Generating...
                              </>
                            ) : (
                              'Get Insight'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Recent Insights
                    </h3>
                    <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                      <CoachingMessages />
                    </div>
                  </div>
                </div>
              </div>
            )}
            */}

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
      </div>

      {/* Floating Action Button */}
        <button
          onClick={() => setShowAddHabit(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors lg:hidden flex items-center justify-center z-50"
          aria-label="Add new habit"
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

        <WelcomeTourModal
          open={showWelcomeTour}
          onClose={() => setShowWelcomeTour(false)}
        />
      </Layout>
    </>
  );
}