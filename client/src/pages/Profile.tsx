import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { buildApiUrl } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EditProfileModal } from "@/components/EditProfileModal";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";

export default function Profile() {
  const {
    user,
    isLoading: authLoading,
    getUserDisplayName,
    getUserEmail,
    getUserInitials,
  } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setHabits] = useState([]);
  const [, setCompletions] = useState([]);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Fetch ML analytics data
  const { data: mlData, isLoading: mlLoading } = useQuery({
    queryKey: ["/api/ml/analytics"],
    queryFn: async () => {
      const response = await apiRequest("ml/analytics", "GET");
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch actual completions and streaks data (same as Today.tsx)
  const { data: completionsResponse } = useQuery({
    queryKey: ["/api/completions"],
    queryFn: async () => {
      const response = await apiRequest("completions", 'GET');
      return await response.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const { data: streaksResponse } = useQuery({
    queryKey: ["/api/analytics/streaks"],
    queryFn: async () => {
      const response = await apiRequest("analytics/streaks", 'GET');
      return await response.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Helper function for motivation level colors
  const getMotivationColors = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return {
          bg: 'from-green-50 to-emerald-100',
          border: 'border-green-200',
          text: 'text-green-600'
        };
      case 'medium':
        return {
          bg: 'from-yellow-50 to-amber-100',
          border: 'border-yellow-200',
          text: 'text-yellow-600'
        };
      case 'low':
        return {
          bg: 'from-red-50 to-rose-100',
          border: 'border-red-200',
          text: 'text-red-600'
        };
      default:
        return {
          bg: 'from-gray-50 to-slate-100',
          border: 'border-gray-200',
          text: 'text-gray-600'
        };
    }
  };

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

    // Fetch user data for XP breakdown
    if (user) {
      const fetchUserData = async () => {
        try {
          // Get JWT tokens for authentication (guest or verified)
          const guestToken = localStorage.getItem('guest_token');
          const verifiedToken = localStorage.getItem('verified_token');
          const headers: Record<string, string> = {};
          
          if (guestToken) {
            headers['Authorization'] = `Bearer ${guestToken}`;
          } else if (verifiedToken) {
            headers['Authorization'] = `Bearer ${verifiedToken}`;
          }

          const [habitsRes, completionsRes] = await Promise.all([
            fetch(buildApiUrl('habits'), { headers }),
            fetch(buildApiUrl('completions'), { headers })
          ]);
          
          if (habitsRes.ok) {
            const habitsData = await habitsRes.json();
            setHabits(habitsData.habits || []);
          }
          
          if (completionsRes.ok) {
            const completionsData = await completionsRes.json();
            setCompletions(completionsData.completions || []);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
        }
      };
      
      fetchUserData();
    }
  }, [user, authLoading, toast]);


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

  const userInitials = getUserInitials(user);

  // Calculate today's completions and current streak (same logic as Today.tsx)
  const completions = completionsResponse?.completions || [];
  const today = new Date().toISOString().split('T')[0];
  
  const completedToday = completions.filter((c: any) => {
    const completionDate = typeof c.completedAt === 'string' ? c.completedAt : c.completedAt?.toISOString?.()?.split('T')[0];
    return completionDate === today;
  }) || [];

  const currentStreak = streaksResponse?.data?.summary?.totalCurrentStreak || 0;

  // Difficulty color coding
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Layout 
      showSidebar={true}
      sidebarOpen={sidebarOpen}
      onSidebarToggle={setSidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      pageTitle="Profile"
    >
      <div className="max-w-7xl mx-auto p-4">

        {/* Desktop Optimized Grid Layout */}
        <div className="grid grid-cols-1 gap-6 min-h-[calc(100vh-8rem)]">
          
          {/* Main Content - Personal Info & Stats */}
          <div className="space-y-6">
            {/* Profile Info - Simplified and Clean */}
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-center sm:text-left">Personal Information</CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                  <Avatar className="h-20 w-20" key={user.profileImageUrl}>
                    <AvatarImage 
                      src={user.profileImageUrl && user.profileImageUrl !== "👤" ? user.profileImageUrl : ""} 
                      alt={`${getUserDisplayName(user)}'s profile`}
                    />
                      <AvatarFallback className="text-lg font-semibold bg-primary text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {getUserDisplayName(user)}
                    </h3>
                    <p className="text-gray-600 text-sm break-all sm:break-normal mb-3">
                      {getUserEmail(user)}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start space-x-4">
                      <div className="text-center sm:text-left">
                        <div className="text-xs text-gray-500 mb-1">Difficulty Level</div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(user.difficulty || 'medium')}`}>
                          {user.difficulty || 'medium'}
                        </span>
                      </div>
                    </div>
                    </div>
                  </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full"
                    onClick={() => setShowEditProfile(true)}
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Edit Profile
                  </Button>
                  
                  {/* Unified Progress & Share Section - Clean, Focused Design */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                      {/* Achievement Message - Left Side */}
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                          <span className="text-green-600 text-xl">🌟</span>
                          <span className="text-green-800 font-semibold text-lg">
                            {user?.level >= 5 ? 'Habit Master!' : 
                             user?.level >= 3 ? 'Leveling Up!' : 
                             'Getting Started!'}
                          </span>
                        </div>
                        <p className="text-green-700 font-medium text-sm">
                          {user?.level >= 5 ? 'Share your expertise and inspire others!' : 
                           user?.level >= 3 ? 'Keep the momentum going!' : 
                           'Share your journey and stay motivated!'}
                        </p>
                        <p className="text-green-600 text-xs mt-1">
                          {completedToday.length} habits completed today • {currentStreak} day streak
                        </p>
                      </div>
                      
                      {/* WhatsApp Share Button - Right Side */}
                      <WhatsAppShareButton
                        userLevel={user?.level || 1}
                        totalXP={user?.xp || 0}
                        currentStreak={mlData?.data?.currentStreak || 0}
                        longestStreak={mlData?.data?.longestStreak || 0}
                        completedHabits={mlData?.data?.todayCompletions || 0}
                        totalHabits={mlData?.data?.totalHabits || 0}
                        userName={getUserDisplayName(user)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm hover:shadow-md"
                      />
                    </div>
                      </div>
                    </div>
              </CardContent>
            </Card>

            {/* Mobile & Desktop: Enhanced Compact Stats */}
            <div className="space-y-4">
              {/* Level & XP Progress Row */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">Level {user?.level || 1}</div>
                        <div className="text-sm text-gray-600">{user?.xp || 0} XP</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                          <span>Progress to Level {(user?.level || 1) + 1}</span>
                          <span className="font-medium ml-2">{((user?.xp || 0) % 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((user?.xp || 0) % 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <i className="fas fa-trophy text-yellow-500"></i>
                            <span>Active Learner</span>
                      </div>
                    </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Grid - 3x2 for mobile, responsive for desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Consistency Score */}
                <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700">Consistency Score</div>
                      <div className="text-lg font-bold text-purple-600">
                        {mlLoading ? "..." : (mlData?.data?.consistencyScore ?? 0)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Motivation Level - Dynamic colors */}
                <Card className={`bg-gradient-to-br ${getMotivationColors(mlData?.data?.motivationLevel ?? 'Low').bg} ${getMotivationColors(mlData?.data?.motivationLevel ?? 'Low').border}`}>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700">Motivation Level</div>
                      <div className={`text-sm font-bold ${getMotivationColors(mlData?.data?.motivationLevel ?? 'Low').text}`}>
                        {mlData?.data?.motivationLevel ?? 'Low'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Engagement */}
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700">Current Engagement</div>
                      <div className="text-lg font-bold text-blue-600">
                        {mlData?.data?.engagementLevel ?? 0}%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Optimal Times - with clock icon */}
                <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <i className="fas fa-clock text-orange-500"></i>
                        Optimal Times
                      </div>
                      <div className="space-y-1">
                        {mlData?.data?.optimalTimes?.length > 0 ? (
                          mlData.data.optimalTimes.slice(0, 3).map((time: string, index: number) => (
                            <div key={index} className="text-sm font-bold text-orange-600">
                              {time}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            Add habits to see optimal times
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* You Excel At */}
                <Card className="bg-gradient-to-br from-indigo-50 to-violet-100 border-indigo-200">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700">You Excel At</div>
                      <div className="text-sm font-bold text-indigo-600">
                        {mlData?.data?.performanceCategories?.[0] ?? (
                          <span className="text-gray-500 italic">Complete habits to see strengths</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Forecast */}
                <Card className="bg-gradient-to-br from-pink-50 to-rose-100 border-pink-200">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700">Weekly Forecast</div>
                      <div className="text-lg font-bold text-pink-600">
                        {mlData?.data?.weeklyForecast ?? 0}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {mlData?.data?.weeklyForecast === 0 ? 'Start habits to get predictions' : 'Success rate'}
                      </div>
                    </div>
                </CardContent>
              </Card>
            </div>

            </div>

            {/* Quick Challenge Claims - Desktop: Beside Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center flex items-center justify-center text-sm">
                    <i className="fas fa-trophy mr-2 text-yellow-500"></i>
                    Quick Challenge Claims
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-xs text-gray-600 text-center mb-3">
                      Claim your completed challenge rewards here
                    </p>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm"
                      onClick={() => window.location.href = '/challenges'}
                    >
                      <i className="fas fa-gift mr-2"></i>
                      View All Challenges
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements - Aligned horizontally with ML Analytics */}
              <Card className="lg:h-fit">
                <CardHeader>
                  <CardTitle className="text-center text-sm">Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg">
                      <i className="fas fa-trophy text-yellow-500 text-sm"></i>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-xs">
                          First Habit
                        </div>
                        <div className="text-xs text-gray-600">
                          Created your first habit
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                      <i className="fas fa-fire text-green-500 text-sm"></i>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-xs">
                          Streak Master
                        </div>
                        <div className="text-xs text-gray-600">
                          7 day streak achieved
                        </div>
                      </div>
                    </div>

                    <div className="text-center py-2">
                      <i className="fas fa-medal text-2xl text-gray-300 mb-1"></i>
                      <p className="text-xs text-gray-500">
                        Keep building habits to unlock more achievements!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
    </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </Layout>
  );
}
