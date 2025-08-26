import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { buildApiUrl } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import SimpleXPDisplay from "@/components/SimpleXPDisplay";
import MLAnalyticsCard from "@/components/MLAnalyticsCard";

export default function Profile() {
  const {
    user,
    isLoading: authLoading,
    getUserDisplayName,
    getUserEmail,
    getUserInitials,
    logout,
  } = useAuth();
  const { toast } = useToast();
  const [, setHabits] = useState([]);
  const [, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage 
                        src={user.profileImageUrl && user.profileImageUrl !== "👤" ? user.profileImageUrl : ""} 
                        alt={`${getUserDisplayName(user)}'s profile`}
                      />
                      <AvatarFallback className="text-lg font-semibold bg-primary text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {getUserDisplayName(user)}
                      </h2>
                                              <p className="text-gray-600">{getUserEmail(user)}</p>
                      <Button variant="outline" className="mt-2">
                        <i className="fas fa-camera mr-2"></i>
                        Change Photo
                      </Button>
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
                  </div>

                  <Button className="w-full md:w-auto">
                    <i className="fas fa-edit mr-2"></i>
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-6">

              {/* XP Breakdown Card */}
              {!loading && (
                <SimpleXPDisplay user={user} />
              )}

              {/* ML Analytics Card */}
              {!loading && (
                <MLAnalyticsCard user={user} />
              )}

              {/* Quick Challenge Claims */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center flex items-center justify-center">
                    <i className="fas fa-trophy mr-2 text-yellow-500"></i>
                    Quick Challenge Claims
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 text-center mb-4">
                      Claim your completed challenge rewards here
                    </p>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      onClick={() => window.location.href = '/challenges'}
                    >
                      <i className="fas fa-gift mr-2"></i>
                      View All Challenges
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <i className="fas fa-trophy text-yellow-500"></i>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          First Habit
                        </div>
                        <div className="text-xs text-gray-600">
                          Created your first habit
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <i className="fas fa-fire text-green-500"></i>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          Streak Master
                        </div>
                        <div className="text-xs text-gray-600">
                          7 day streak achieved
                        </div>
                      </div>
                    </div>

                    <div className="text-center py-4">
                      <i className="fas fa-medal text-4xl text-gray-300 mb-2"></i>
                      <p className="text-sm text-gray-500">
                        Keep building habits to unlock more achievements!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={logout}
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Sign Out
                  </Button>

                  {user.isGuest && (
                    <Button className="w-full">
                      <i className="fas fa-user-plus mr-2"></i>
                      Create Account
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
