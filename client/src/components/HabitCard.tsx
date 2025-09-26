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
    
    // Trigger animation for both completion and uncompletion
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 800);
    
    onToggle(!completed);
  };

  const getProgressPercentage = () => {
    if (completed) return 100;
    // Only show 0% for incomplete habits - no partial progress
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


  const progressPercentage = getProgressPercentage();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start space-x-3 sm:space-x-4 md:space-x-5 lg:space-x-6">
          <div className="flex flex-col items-center space-y-1 min-h-[100px] justify-start">
            <div className="relative">
              {/* Gamified Completion Button */}
              <div className="relative flex-shrink-0">
                <button 
                  onClick={handleToggle}
                  disabled={loading}
                  className={cn(
                    "relative w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full transition-all duration-300",
                    "hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    "flex items-center justify-center overflow-hidden",
                    completed 
                      ? "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 text-white shadow-xl shadow-green-200/50" 
                      : "bg-gradient-to-br from-slate-100 via-gray-200 to-slate-300 text-slate-600 hover:from-slate-200 hover:via-gray-300 hover:to-slate-400 shadow-lg hover:shadow-xl"
                  )}
                >
                  {/* Background Pattern for Incomplete State */}
                  {!completed && (
                    <div className="absolute inset-0 opacity-10">
                      <div className="w-full h-full rounded-full border-2 border-dashed border-slate-400"></div>
                    </div>
                  )}
                  
                  {/* Completion State - Animated Check */}
                  {completed && (
                    <div className="relative">
                      <i className="fas fa-check text-lg sm:text-xl font-bold animate-pulse"></i>
                      {/* Sparkle Effect */}
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
                      <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                  )}
                  
                  {/* Incomplete State - Progress Indicator */}
                  {!completed && (
                    <div className="relative">
                      {loading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-current border-t-transparent"></div>
                      ) : progressPercentage > 0 && progressPercentage < 100 ? (
                        <div className="relative">
                          <i className="fas fa-play text-sm sm:text-base"></i>
                          {/* Progress Ring */}
                          <div className="absolute -inset-2">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-primary/30"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-primary transition-all duration-500"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray={`${progressPercentage}, 100`}
                                strokeLinecap="round"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <i className="fas fa-circle text-sm sm:text-base"></i>
                      )}
                    </div>
                  )}
                  
                  {/* Completion Animation Overlay */}
                  {isAnimating && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <div className="relative">
                        <i className="fas fa-check text-2xl text-emerald-500 animate-bounce"></i>
                        {/* Celebration Particles */}
                        <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                        <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
                        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
                      </div>
                    </div>
                  )}
                </button>
                
                {/* XP Badge - Only show in incomplete state with animation */}
                {!completed && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-bounce">
                    +12
                  </div>
                )}
              </div>
            </div>
            
            {/* Gamified completion status text */}
            <div className="w-[80px] h-[20px] flex items-center justify-center">
              <span className={cn(
                "text-xs font-bold transition-all duration-200 text-center",
                completed 
                  ? "text-emerald-600 animate-pulse" 
                  : "text-slate-500 hover:text-slate-700"
              )}>
                {completed ? "🎉 Done!" : "Tap to complete"}
              </span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-2 mb-1 space-y-1 xs:space-y-0">
              <h4 className="font-semibold text-gray-900 text-xs xs:text-sm sm:text-base md:text-lg truncate">{habit.title}</h4>
              <Badge className={cn(getCategoryColor(habit.category), "text-xs w-fit")}>
                {habit.category}
              </Badge>
            </div>
            
            {habit.description && (
              <p className="text-gray-600 text-xs xs:text-sm sm:text-sm mb-2 line-clamp-2 break-words">{habit.description}</p>
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
            
            {/* Removed reminder time from here - moved to right side stats */}
            
          </div>
          
          {/* Right Side Stats */}
          <div className="text-right space-y-1">
            {/* Reminder Time */}
            {habit.reminderTime && (
              <div className="flex items-center justify-end space-x-1 text-gray-500 text-xs">
                <i className="fas fa-clock text-xs"></i>
                <span className="truncate">{habit.reminderTime}</span>
              </div>
            )}
            
            {/* Performance Stats */}
            {performanceScore && (
              <div className="space-y-0.5 text-xs">
                <div className="flex items-center justify-end space-x-1">
                  <i className="fas fa-chart-line text-blue-600 text-xs"></i>
                  <span className="text-gray-600 text-xs">Hype:</span>
                  <span className={cn(
                    "font-semibold",
                    performanceScore.performance_score >= 80 ? "text-green-600" :
                    performanceScore.performance_score >= 50 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {performanceScore.performance_score}%
                  </span>
                </div>
                <div className="flex items-center justify-end space-x-1 text-gray-500">
                  <i className="fas fa-fire text-orange-500 text-xs"></i>
                  <span className="text-xs">
                    {performanceScore.metrics.current_streak > 0 ? 
                      `${performanceScore.metrics.current_streak}d` : 
                      '0d'
                    }
                  </span>
                </div>
              </div>
            )}
            
            {loadingScore && (
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-end space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span className="text-xs text-gray-500">Calculating...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
