import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { buildApiUrl } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import SimpleXPDisplay from "@/components/SimpleXPDisplay";
import MLAnalyticsCard from "@/components/MLAnalyticsCard";
import { EditProfileModal } from "@/components/EditProfileModal";

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
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);

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
          setLoading(false);
        }
      };
      
      fetchUserData();
    }
  }, [user, authLoading, toast]);

  // Force re-render when user data changes (for profile picture updates)
  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user?.profileImageUrl, user?.firstName, user?.lastName, user?.email]);

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-8rem)]">
          
          {/* Left Column - Personal Info & Bottom Cards */}
          <div className="lg:col-span-5 space-y-6">
            {/* Profile Info */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <Avatar className="h-20 w-20 mx-auto sm:mx-0" key={user.profileImageUrl}>
                    <AvatarImage 
                      src={user.profileImageUrl && user.profileImageUrl !== "👤" ? user.profileImageUrl : ""} 
                      alt={`${getUserDisplayName(user)}'s profile`}
                    />
                    <AvatarFallback className="text-lg font-semibold bg-primary text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center sm:text-left w-full">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {getUserDisplayName(user)}
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base break-all sm:break-normal">
                      {getUserEmail(user)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      {user.firstName || "Not set"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      {user.lastName || "Not set"}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      {getUserEmail(user) || "Not set"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty Level
                    </label>
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(user.difficulty || 'medium')}`}>
                        {user.difficulty || 'medium'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full md:w-auto"
                  onClick={() => setShowEditProfile(true)}
                >
                  <i className="fas fa-edit mr-2"></i>
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

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

          {/* Center Column - XP Display (Desktop only, stacked on mobile) */}
          <div className="lg:col-span-3 lg:block hidden">
            {!loading && (
              <div className="sticky top-4">
                <SimpleXPDisplay user={user} />
              </div>
            )}
          </div>

          {/* Right Column - ML Analytics */}
          <div className="lg:col-span-4">
            {!loading && (
              <div className="sticky top-4">
                <MLAnalyticsCard user={user} />
              </div>
            )}
          </div>

          {/* Mobile: XP Display below personal info */}
          <div className="lg:hidden col-span-1">
            {!loading && (
              <SimpleXPDisplay user={user} />
            )}
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
