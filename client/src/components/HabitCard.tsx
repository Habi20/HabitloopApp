import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

export function HabitCard({ habit, completed, onToggle, loading }: HabitCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);

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
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleToggle}
            disabled={loading}
            className={buttonClasses}
          >
            {completed ? (
              <i className="fas fa-check text-lg"></i>
            ) : progressPercentage > 0 && progressPercentage < 100 ? (
              <i className="fas fa-play text-lg"></i>
            ) : (
              <i className="fas fa-circle text-lg"></i>
            )}
          </button>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900">{habit.title}</h4>
              <Badge className={getCategoryColor(habit.category)}>
                {habit.category}
              </Badge>
            </div>
            
            {habit.description && (
              <p className="text-gray-600 text-sm mb-2">{habit.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <i className="fas fa-fire text-warning"></i>
                <span>7 day streak</span>
              </span>
              {habit.reminderTime && (
                <span className="flex items-center space-x-1">
                  <i className="fas fa-clock"></i>
                  <span>{habit.reminderTime}</span>
                </span>
              )}
            </div>
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
