// client/src/components/ChallengesSystem.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  xpReward: number;
  progress: number;
  target: number;
  isCompleted: boolean;
  isActive: boolean;
  expiresAt: string;
  category: string;
}

interface ChallengeCategory {
  title: string;
  challenges: Challenge[];
  totalXP: number;
  completedCount: number;
}

export function ChallengesSystem() {
  const { user, refreshUserData } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch challenges data
  const { data: challengesData, isLoading, error } = useQuery({
    queryKey: ["/api/challenges"],
    queryFn: async () => {
      const response = await apiRequest("challenges", 'GET');
      return await response.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Claim challenge reward mutation
  const claimRewardMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await apiRequest(`challenges/${challengeId}/claim`, "POST");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "🎉 Challenge Completed!",
          description: `+${data.xpEarned} XP earned! Keep up the great work!`,
          duration: 4000,
        });
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/xp-calculation"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        
        // Refresh user data to update XP and level
        refreshUserData();
        
        // Invalidate ALL user-related queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/streaks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ml/evaluate"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ml/predictions"] });
        
        // Force immediate refetch of all invalidated queries
        queryClient.refetchQueries({ queryKey: ["/api/user"] });
        queryClient.refetchQueries({ queryKey: ["/api/analytics/xp-calculation"] });
      } else {
        toast({
          title: "Unable to Claim",
          description: data.message || "Challenge cannot be claimed at this time",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Claim error:", error);
      toast({
        title: "Claim Failed",
        description: "There was an error claiming your reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Challenges</h3>
          <p className="text-gray-600 mb-4">Unable to load your challenges. Please try again.</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/challenges"] })}
            variant="outline"
          >
            <i className="fas fa-refresh mr-2"></i>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const categories = (challengesData as any)?.data?.categories || [];

  const getCategoryIcon = (type: string) => {
    const icons: Record<string, string> = {
      daily: "fas fa-sun",
      weekly: "fas fa-calendar-week",
      monthly: "fas fa-calendar-alt",
    };
    return icons[type] || "fas fa-trophy";
  };

  const getCategoryColor = (type: string) => {
    const colors: Record<string, string> = {
      daily: "bg-yellow-100 text-yellow-800 border-yellow-200",
      weekly: "bg-blue-100 text-blue-800 border-blue-200",
      monthly: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getChallengeStatusColor = (challenge: Challenge) => {
    if (challenge.isCompleted && challenge.isActive) {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (challenge.isCompleted && !challenge.isActive) {
      return "bg-gray-100 text-gray-600 border-gray-200";
    } else {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
  };

  const getChallengeStatusText = (challenge: Challenge) => {
    if (challenge.isCompleted && challenge.isActive) {
      return "Available to Claim";
    } else if (challenge.isCompleted && !challenge.isActive) {
      return "Already Claimed";
    } else {
      return "In Progress";
    }
  };

  const getChallengeStatusIcon = (challenge: Challenge) => {
    if (challenge.isCompleted && challenge.isActive) {
      return "fas fa-gift";
    } else if (challenge.isCompleted && !challenge.isActive) {
      return "fas fa-check-circle";
    } else {
      return "fas fa-clock";
    }
  };

  return (
    <div className="space-y-8">
      {/* Challenge Overview Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Challenges & Achievements
            </h2>
            <p className="text-gray-600">
              Complete challenges to earn XP and unlock achievements
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {categories.reduce((sum: number, cat: any) => 
                sum + (cat.challenges.filter((c: any) => c.isCompleted).reduce((catSum: number, c: any) => 
                  catSum + c.xpReward, 0)), 0
              )}
            </div>
            <div className="text-sm text-gray-600">
              XP Earned
            </div>
          </div>
        </div>

        {/* Gamification Tips */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
            Pro Tips:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Complete all daily habits to unlock daily challenges</li>
            <li>• Maintain streaks to earn bonus XP</li>
            <li>• Claim rewards immediately when challenges are completed</li>
            <li>• Check back daily for new challenges</li>
          </ul>
        </div>
      </div>

      {/* Challenge Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {categories.find((c: any) => c.title === "Daily")?.completedCount || 0}
            </div>
            <div className="text-sm text-yellow-700">Daily Challenges</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {categories.find((c: any) => c.title === "Weekly")?.completedCount || 0}
            </div>
            <div className="text-sm text-blue-700">Weekly Challenges</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {categories.find((c: any) => c.title === "Monthly")?.completedCount || 0}
            </div>
            <div className="text-sm text-purple-700">Monthly Challenges</div>
          </CardContent>
        </Card>
      </div>

      {/* Challenge Categories */}
      {categories.map((category: ChallengeCategory) => (
        <div key={category.title} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <i className={`${getCategoryIcon(category.title.toLowerCase())} mr-2 text-${category.title.toLowerCase() === 'daily' ? 'yellow' : category.title.toLowerCase() === 'weekly' ? 'blue' : 'purple'}-500`}></i>
              {category.title} Challenges
            </h3>
            <div className="flex items-center space-x-2">
              <Badge className={getCategoryColor(category.title.toLowerCase())}>
                {category.totalXP} XP Available
              </Badge>
              <div className="text-sm text-gray-500">
                {category.completedCount}/{category.challenges.length} completed
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.challenges.map((challenge: Challenge) => (
              <Card 
                key={challenge.id} 
                className={`transition-all duration-200 hover:shadow-md ${
                  challenge.isCompleted && challenge.isActive 
                    ? 'ring-2 ring-green-200 bg-green-50' 
                    : challenge.isCompleted && !challenge.isActive
                    ? 'ring-2 ring-gray-200 bg-gray-50'
                    : 'ring-2 ring-orange-200 bg-orange-50'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {challenge.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {challenge.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className={getCategoryColor(challenge.type)}>
                        {challenge.xpReward} XP
                      </Badge>
                      <Badge className={getChallengeStatusColor(challenge)}>
                        <i className={`${getChallengeStatusIcon(challenge)} mr-1`}></i>
                        {getChallengeStatusText(challenge)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">
                        {challenge.progress}/{challenge.target}
                      </span>
                    </div>
                    
                    <Progress 
                      value={(challenge.progress / challenge.target) * 100} 
                      className="h-2"
                    />
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center">
                        {challenge.isCompleted ? (
                          <>
                            <i className="fas fa-check-circle text-green-500 mr-1"></i>
                            Challenge completed!
                          </>
                        ) : (
                          <>
                            <i className="fas fa-clock text-orange-500 mr-1"></i>
                            {Math.round((challenge.progress / challenge.target) * 100)}% complete
                          </>
                        )}
                      </span>
                      <span>
                        Expires: {new Date(challenge.expiresAt).toLocaleDateString()}
                      </span>
                    </div>

                    {challenge.isCompleted && (
                      <Button
                        onClick={() => claimRewardMutation.mutate(challenge.id)}
                        disabled={claimRewardMutation.isPending || !challenge.isActive}
                        className={`w-full transition-all duration-200 ${
                          challenge.isActive 
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transform hover:scale-105' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {claimRewardMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Claiming...
                          </>
                        ) : challenge.isActive ? (
                          <>
                            <i className="fas fa-gift mr-2"></i>
                            Claim {challenge.xpReward} XP
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check-circle mr-2"></i>
                            Already Claimed
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* No Challenges State */}
      {categories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <i className="fas fa-trophy text-4xl mb-4 text-gray-300"></i>
            <h4 className="text-lg font-medium mb-2">No challenges available</h4>
            <p>Complete more habits to unlock new challenges!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
