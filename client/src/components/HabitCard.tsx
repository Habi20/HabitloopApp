import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface Habit {
  id: number;
  title: string;
  description?: string;
  category: string;
  targetValue: number;
  unit: string;
  reminderTime?: string;
  color: string;
  icon: string;
}

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  onToggle: (completed: boolean) => void;
  loading?: boolean;
}

interface HabitPerformanceScore {
  performance_score: number;
  confidence_level: string;
  metrics: {
    completion_rate: number;
    current_streak: number;
    longest_streak: number;
    total_completions: number;
    total_days: number;
  };
  recommendations: string[];
}

export function HabitCard({ habit, completed, onToggle, loading }: HabitCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [performanceScore, setPerformanceScore] = useState<HabitPerformanceScore | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);

  // Fetch habit performance score
  useEffect(() => {
    const fetchPerformanceScore = async () => {
      try {
        setLoadingScore(true);
        const response = await apiRequest(`/api/ml/habit-scores/${habit.id}`, 'GET');
        const data = await response.json();
        if (data.success) {
          setPerformanceScore(data);
        }
      } catch (error) {
        console.error('Failed to fetch habit performance score:', error);
      } finally {
        setLoadingScore(false);
      }
    };

    fetchPerformanceScore();
  }, [habit.id]);

  const handleToggle = () => {
    if (loading) return;
    
    if (!completed) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    }
    
    onToggle(!completed);
  };

  const getProgressPercentage = () => {
    if (completed) return 100;
    // For demo purposes, showing partial progress for some habits
    if (habit.title.includes("Water")) return 63;
    return 0;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Health: "bg-green-100 text-green-800",
      Productivity: "bg-blue-100 text-blue-800",
      Learning: "bg-purple-100 text-purple-800",
      Mindfulness: "bg-indigo-100 text-indigo-800",
      Social: "bg-pink-100 text-pink-800",
      Creative: "bg-yellow-100 text-yellow-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const buttonClasses = cn(
    "w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200",
    completed 
      ? "bg-success text-white"
      : getProgressPercentage() > 0 && getProgressPercentage() < 100
        ? "bg-warning text-white animate-pulse"
        : "bg-gray-200 text-gray-400 hover:bg-primary hover:text-white",
    isAnimating && "animate-bounce",
    loading && "opacity-50 cursor-not-allowed"
  );

  const progressPercentage = getProgressPercentage();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6">
        <div className="flex items-start space-x-3 sm:space-x-4 md:space-x-5 lg:space-x-6">
          <button 
            onClick={handleToggle}
            disabled={loading}
            className={cn(buttonClasses, "flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16")}
          >
            {completed ? (
              <i className="fas fa-check text-sm sm:text-base md:text-lg lg:text-xl"></i>
            ) : progressPercentage > 0 && progressPercentage < 100 ? (
              <i className="fas fa-play text-sm sm:text-base md:text-lg lg:text-xl"></i>
            ) : (
              <i className="fas fa-circle text-sm sm:text-base md:text-lg lg:text-xl"></i>
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1 space-y-1 sm:space-y-0">
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl truncate">{habit.title}</h4>
              <Badge className={cn(getCategoryColor(habit.category), "text-xs sm:text-sm w-fit")}>
                {habit.category}
              </Badge>
            </div>
            
            {habit.description && (
              <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg mb-2 line-clamp-2">{habit.description}</p>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm md:text-base lg:text-lg text-gray-500">
              <span className="flex items-center space-x-1">
                <i className="fas fa-fire text-warning"></i>
                <span className="streak-display">Loading...</span>
              </span>
              {habit.reminderTime && (
                <span className="flex items-center space-x-1">
                  <i className="fas fa-clock"></i>
                  <span className="truncate">{habit.reminderTime}</span>
                </span>
              )}
              {completed && (
                <span className="flex items-center space-x-1 text-success">
                  <i className="fas fa-check-circle"></i>
                  <span>Completed today</span>
                </span>
              )}
            </div>
            
            {/* ML Performance Score */}
            {performanceScore && (
              <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <i className="fas fa-chart-line text-blue-600"></i>
                    <span className="text-xs font-medium text-gray-700">ML Score:</span>
                    <span className={cn(
                      "text-xs sm:text-sm font-bold",
                      performanceScore.performance_score >= 80 ? "text-green-600" :
                      performanceScore.performance_score >= 50 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {performanceScore.performance_score}%
                    </span>
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      performanceScore.confidence_level === 'high' ? "border-green-300 text-green-700" :
                      performanceScore.confidence_level === 'medium' ? "border-yellow-300 text-yellow-700" : "border-red-300 text-red-700"
                    )}>
                      {performanceScore.confidence_level}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {performanceScore.metrics.current_streak > 0 ? 
                      `${performanceScore.metrics.current_streak} day streak` : 
                      'No streak yet'
                    }
                  </div>
                </div>
                {performanceScore.performance_score < 50 && performanceScore.recommendations.length > 0 && (
                  <div className="mt-1 text-xs text-gray-600">
                    💡 {performanceScore.recommendations[0]}
                  </div>
                )}
              </div>
            )}
            {loadingScore && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span className="text-xs text-gray-500">Calculating performance...</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path 
                  className="text-gray-200" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  fill="none" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path 
                  className={cn(
                    completed ? "text-success" : 
                    progressPercentage > 0 ? "text-warning" : "text-primary"
                  )}
                  stroke="currentColor" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeDasharray={`${progressPercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn(
                  "text-xs font-semibold",
                  completed ? "text-success" : 
                  progressPercentage > 0 ? "text-warning" : "text-gray-400"
                )}>
                  {completed ? "✓" : `${progressPercentage}%`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
