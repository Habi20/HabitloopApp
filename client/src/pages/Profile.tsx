import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

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

  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';

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
                      <AvatarImage src={user.profileImageUrl || ""} />
                      <AvatarFallback className="text-lg font-semibold bg-primary text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {user.firstName || user.lastName 
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : 'User'
                        }
                      </h2>
                      <p className="text-gray-600">{user.email}</p>
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
                        {user.firstName || 'Not set'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        {user.lastName || 'Not set'}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        {user.email || 'Not set'}
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Level & XP</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">{user.level || 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Level {user.level || 1}
                  </h3>
                  <p className="text-gray-600 mb-4">{user.xp || 0} XP earned</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((user.xp || 0) % 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {100 - ((user.xp || 0) % 100)} XP to next level
                  </p>
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
                        <div className="font-medium text-gray-900">First Habit</div>
                        <div className="text-xs text-gray-600">Created your first habit</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <i className="fas fa-fire text-green-500"></i>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Streak Master</div>
                        <div className="text-xs text-gray-600">7 day streak achieved</div>
                      </div>
                    </div>

                    <div className="text-center py-4">
                      <i className="fas fa-medal text-4xl text-gray-300 mb-2"></i>
                      <p className="text-sm text-gray-500">Keep building habits to unlock more achievements!</p>
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
                    onClick={() => window.location.href = "/api/logout"}
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
