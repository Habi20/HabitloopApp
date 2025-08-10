import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Challenges() {
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
        window.location.href = "/";
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

  const challenges = [
    {
      id: 1,
      title: "7-Day Streak Master",
      description: "Complete all your habits for 7 consecutive days",
      type: "weekly",
      progress: 4,
      target: 7,
      reward: "50 XP",
      icon: "fas fa-fire",
      color: "text-orange-500",
    },
    {
      id: 2,
      title: "Early Bird",
      description: "Complete morning habits before 9 AM for 5 days",
      type: "weekly",
      progress: 2,
      target: 5,
      reward: "25 XP",
      icon: "fas fa-sun",
      color: "text-yellow-500",
    },
    {
      id: 3,
      title: "Habit Explorer",
      description: "Create 3 new habits this month",
      type: "monthly",
      progress: 1,
      target: 3,
      reward: "100 XP",
      icon: "fas fa-compass",
      color: "text-blue-500",
    },
    {
      id: 4,
      title: "Consistency Champion",
      description: "Achieve 90% completion rate this month",
      type: "monthly",
      progress: 78,
      target: 90,
      reward: "200 XP",
      icon: "fas fa-trophy",
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Challenges</h1>

          {/* Challenge Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6 text-center">
                <i className="fas fa-calendar-day text-3xl text-blue-500 mb-3"></i>
                <h3 className="font-semibold text-gray-900 mb-1">Daily</h3>
                <p className="text-sm text-gray-600">Complete today's goals</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <i className="fas fa-calendar-week text-3xl text-green-500 mb-3"></i>
                <h3 className="font-semibold text-gray-900 mb-1">Weekly</h3>
                <p className="text-sm text-gray-600">7-day challenges</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-6 text-center">
                <i className="fas fa-calendar-alt text-3xl text-purple-500 mb-3"></i>
                <h3 className="font-semibold text-gray-900 mb-1">Monthly</h3>
                <p className="text-sm text-gray-600">Long-term goals</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Challenges */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Active Challenges
            </h2>

            {challenges.map((challenge) => (
              <Card
                key={challenge.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <i
                        className={`${challenge.icon} text-xl ${challenge.color}`}
                      ></i>
                      <div>
                        <CardTitle className="text-lg">
                          {challenge.title}
                        </CardTitle>
                        <p className="text-gray-600 text-sm">
                          {challenge.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          challenge.type === "monthly" ? "default" : "secondary"
                        }
                      >
                        {challenge.type}
                      </Badge>
                      <div className="text-sm text-gray-600 mt-1">
                        {challenge.reward}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        {challenge.progress}/{challenge.target}
                      </span>
                    </div>
                    <Progress
                      value={(challenge.progress / challenge.target) * 100}
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Completed Challenges Section */}
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Completed This Month
              </h2>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <i className="fas fa-trophy text-4xl text-green-500 mb-4"></i>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    First Week Champion
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Completed all habits for your first week
                  </p>
                  <Badge className="bg-green-500">+75 XP Earned</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
