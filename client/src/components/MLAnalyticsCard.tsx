import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '@/config/api';

interface MLAnalyticsCardProps {
  user: any;
}

export default function MLAnalyticsCard({ user }: MLAnalyticsCardProps) {
  // Fetch ML predictions data
  // const { data: mlData } = useQuery({
  //   queryKey: ["/api/ml/predictions"],
  //   enabled: !!user,
  // });

  // Fetch real ML analytics data from backend
  const { data: mlAnalyticsData, isLoading: mlLoading, error: mlError } = useQuery({
    queryKey: ["/api/ml/analytics", user?.id],
    queryFn: async () => {
      console.log('🔍 Fetching ML analytics for user:', user?.id);
      const response = await fetch(buildApiUrl(`ml/analytics?userId=${user?.id}`));
      if (!response.ok) {
        throw new Error('Failed to fetch ML analytics');
      }
      const data = await response.json();
      console.log('🔍 ML analytics response:', data);
      return data;
    },
    enabled: !!user?.id,
    staleTime: 0, // No cache - always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Use real data if available, fallback to 0 values for new users
  const mlAnalytics = mlAnalyticsData?.data || {
    consistencyScore: 0,
    motivationLevel: "Low",
    engagementLevel: 0,
    optimalTimes: [],
    weeklyForecast: 0,
    performanceCategories: [],
    confidenceLevel: "Low"
  };

  // Debug logging
  console.log('🔍 ML Analytics Debug:', {
    user: user?.id,
    mlAnalyticsData,
    mlAnalytics,
    mlError,
    isLoading: mlLoading
  });

  const getMotivationColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConsistencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (mlLoading) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <i className="fas fa-brain text-purple-600"></i>
            AI-Powered Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex items-center justify-center">
            <i className="fas fa-spinner fa-spin text-purple-600 text-2xl mr-3"></i>
            <span className="text-purple-700">Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mlError) {
    return (
      <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <i className="fas fa-exclamation-triangle text-red-600"></i>
            Analytics Error
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex items-center justify-center">
            <i className="fas fa-exclamation-circle text-red-600 text-2xl mr-3"></i>
            <span className="text-red-700">Failed to load analytics</span>
          </div>
          <p className="text-xs text-red-600 mt-2">Using fallback values</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-900 text-sm">
          <i className="fas fa-brain text-purple-600"></i>
          AI-Powered Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Consistency Score */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">Consistency Score</span>
            <span className={`text-sm font-bold ${getConsistencyColor(mlAnalytics.consistencyScore)}`}>
              {mlAnalytics.consistencyScore}%
            </span>
          </div>
          <Progress 
            value={mlAnalytics.consistencyScore} 
            className="h-1.5 bg-gray-200"
          />
        </div>

        {/* Motivation Level */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">Motivation Level</span>
            <Badge className={`${getMotivationColor(mlAnalytics.motivationLevel)} text-xs px-2 py-0.5`}>
              <i className="fas fa-fire mr-1"></i>
              {mlAnalytics.motivationLevel}
            </Badge>
          </div>
        </div>

        {/* Engagement Level */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">Current Engagement</span>
            <span className="text-sm font-bold text-blue-600">
              {mlAnalytics.engagementLevel}%
            </span>
          </div>
          <Progress 
            value={mlAnalytics.engagementLevel} 
            className="h-1.5 bg-gray-200"
          />
        </div>

        {/* Optimal Times */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">Optimal Times</span>
            {mlAnalytics.optimalTimes.length > 0 ? (
              <div className="flex gap-1">
                {mlAnalytics.optimalTimes.slice(0, 2).map((time: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                    <i className="fas fa-clock mr-1"></i>
                    {time}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-500">No data</span>
            )}
          </div>
        </div>

        {/* Performance Categories */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">You Excel At</span>
            {mlAnalytics.performanceCategories.length > 0 ? (
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs px-2 py-0.5">
                <i className="fas fa-star mr-1"></i>
                {mlAnalytics.performanceCategories[0]}
              </Badge>
            ) : (
              <span className="text-xs text-gray-500">No data</span>
            )}
          </div>
        </div>

        {/* Weekly Forecast */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">Weekly Forecast</span>
            <span className="text-sm font-bold text-purple-600">
              {mlAnalytics.weeklyForecast}%
            </span>
          </div>
          <Progress 
            value={mlAnalytics.weeklyForecast} 
            className="h-1.5 bg-gray-200"
          />
        </div>

        {/* ML Confidence */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">ML Confidence</span>
            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-0.5">
              <i className="fas fa-check-circle mr-1"></i>
              {mlAnalytics.confidenceLevel}
            </Badge>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
