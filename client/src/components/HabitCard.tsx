import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

interface Habit {
  id: number;
  title: string;
  description?: string;
  category: string;
  targetValue: number;
  unit: string;
  reminderTime?: string;
  recurrencePattern?: string;
  selectedDays?: number[];
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

// Helper function to format recurrence pattern display
const formatRecurrencePattern = (habit: Habit): string => {
  if (!habit.recurrencePattern || habit.recurrencePattern === 'daily') {
    return 'Daily';
  }
  
  if (habit.recurrencePattern === 'weekly' && habit.selectedDays) {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const selectedDayNames = habit.selectedDays
      .map(day => dayNames[day - 1]) // Convert 1-7 to 0-6 for array index
      .filter(Boolean);
    
    if (selectedDayNames.length === 0) return 'Weekly';
    if (selectedDayNames.length === 1) return `Weekly (${selectedDayNames[0]})`;
    if (selectedDayNames.length <= 3) return `Weekly (${selectedDayNames.join(', ')})`;
    return `Weekly (${selectedDayNames.length} days)`;
  }
  
  if (habit.recurrencePattern === 'monthly' && habit.selectedDays) {
    const sortedDays = [...habit.selectedDays].sort((a, b) => a - b);
    if (sortedDays.length === 0) return 'Monthly';
    if (sortedDays.length === 1) return `Monthly (${sortedDays[0]}${getOrdinalSuffix(sortedDays[0])})`;
    if (sortedDays.length <= 3) return `Monthly (${sortedDays.map(d => d + getOrdinalSuffix(d)).join(', ')})`;
    return `Monthly (${sortedDays.length} days)`;
  }
  
  return 'Daily'; // Fallback
};

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

export function HabitCard({ habit, completed, onToggle, loading }: HabitCardProps) {
  const { user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [performanceScore, setPerformanceScore] = useState<HabitPerformanceScore | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);

  // Fetch habit performance score
  useEffect(() => {
    const fetchPerformanceScore = async () => {
      // Skip if habit ID is invalid or user is not authenticated
      if (!habit.id || !user) {
        return;
      }

      try {
        setLoadingScore(true);
        const response = await apiRequest(`ml/habit-scores/${habit.id}`, 'GET');
        const data = await response.json();
        if (data.success) {
          setPerformanceScore(data);
        }
      } catch (error) {
        // Only log error if it's not a 404 (habit not found), 401 (unauthorized), or network error
        if (error instanceof Error && 
            !error.message.includes('404') && 
            !error.message.includes('401') && 
            !error.message.includes('Failed to fetch') &&
            !error.message.includes('NetworkError')) {
          console.error('Failed to fetch habit performance score:', error);
        }
      } finally {
        setLoadingScore(false);
      }
    };

    fetchPerformanceScore();
  }, [habit.id, user]);

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
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start space-x-3 sm:space-x-4 md:space-x-5 lg:space-x-6">
          <div className="flex flex-col items-center space-y-1">
            <div className="relative">
              {/* Progress ring for in-progress habits */}
              {progressPercentage > 0 && progressPercentage < 100 && !completed && (
                <div className="absolute inset-0 rounded-full">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-primary"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${progressPercentage}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
              )}
              
              <button 
                onClick={handleToggle}
                disabled={loading}
                className={cn(
                  buttonClasses, 
                  "flex-shrink-0 w-14 h-14 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18",
                  "relative overflow-hidden transition-all duration-300",
                  "hover:scale-105 active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  completed ? "shadow-lg shadow-green-200" : "shadow-md hover:shadow-lg"
                )}
              >
              {completed ? (
                <div className="flex items-center justify-center w-full h-full">
                  <i className="fas fa-check text-sm sm:text-base md:text-lg lg:text-xl"></i>
                </div>
              ) : progressPercentage > 0 && progressPercentage < 100 ? (
                <div className="flex items-center justify-center w-full h-full">
                  <i className="fas fa-play text-sm sm:text-base md:text-lg lg:text-xl"></i>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <i className="fas fa-circle text-sm sm:text-base md:text-lg lg:text-xl"></i>
                </div>
              )}
              
                {/* Completion animation overlay */}
                {isAnimating && (
                  <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                    <i className="fas fa-check text-green-500 text-lg animate-bounce"></i>
                  </div>
                )}
              </button>
            </div>
            
            {/* Clear completion status text */}
            <span className={cn(
              "text-xs font-medium transition-colors duration-200",
              completed ? "text-green-600" : "text-gray-500"
            )}>
              {completed ? "Done!" : "Tap to complete"}
            </span>
          </div>
          
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
            
            {/* Recurrence Pattern Display */}
            <div className="mb-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-medium",
                  habit.recurrencePattern === 'daily' && "bg-blue-50 text-blue-700 border-blue-200",
                  habit.recurrencePattern === 'weekly' && "bg-green-50 text-green-700 border-green-200",
                  habit.recurrencePattern === 'monthly' && "bg-purple-50 text-purple-700 border-purple-200"
                )}
              >
                <i className={cn(
                  "fas mr-1",
                  habit.recurrencePattern === 'daily' && "fa-calendar-day",
                  habit.recurrencePattern === 'weekly' && "fa-calendar-week",
                  habit.recurrencePattern === 'monthly' && "fa-calendar-alt"
                )}></i>
                {formatRecurrencePattern(habit)}
              </Badge>
            </div>
            
            <div className="flex flex-col space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm md:text-base lg:text-lg text-gray-500">
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
              
            </div>
            
            {/* Consistency Score */}
            {performanceScore && (
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 text-xs">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-chart-line text-blue-600"></i>
                  <span className="text-gray-600">Consistency:</span>
                  <span className={cn(
                    "font-semibold",
                    performanceScore.performance_score >= 80 ? "text-green-600" :
                    performanceScore.performance_score >= 50 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {performanceScore.performance_score}%
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-gray-500">
                  <i className="fas fa-fire text-orange-500"></i>
                  <span>
                    {performanceScore.metrics.current_streak > 0 ? 
                      `${performanceScore.metrics.current_streak}d streak` : 
                      'No streak'
                    }
                  </span>
                </div>
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
