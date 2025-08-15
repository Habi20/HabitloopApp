
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';

interface XPBreakdownProps {
  user: any;
  habits: any[];
  completions: any[];
}

export default function XPBreakdownCard({ user, habits, completions }: XPBreakdownProps) {
  // Get fair XP calculation from API
  const { data: xpCalculation } = useQuery<{
    data: {
      calculation: {
        breakdown: Array<{
          habitTitle: string;
          completions: number;
          totalHabitXP: number;
          maxStreak: number;
        }>;
      };
      summary: {
        totalXP: number;
      };
    };
  }>({
    queryKey: ["/api/analytics/xp-calculation"],
    enabled: !!user,
  });

  // Calculate XP breakdown using fair calculation
  const calculateXPBreakdown = () => {
    if (!xpCalculation?.data?.calculation?.breakdown) {
      return {};
    }

    const breakdown: { [key: string]: { completions: number; xp: number; streak: number } } = {};
    
    xpCalculation.data.calculation.breakdown.forEach((habit: any) => {
      breakdown[habit.habitTitle] = {
        completions: habit.completions,
        xp: habit.totalHabitXP,
        streak: habit.maxStreak
      };
    });
    
    return breakdown;
  };

  const xpBreakdown = calculateXPBreakdown();
  const totalCalculatedXP = xpCalculation?.data?.summary?.totalXP || Object.values(xpBreakdown).reduce((sum, item) => sum + item.xp, 0);
  const currentXP = user?.xp || 0;
  const currentLevel = user?.level || 1;
  const xpToNextLevel = 100 - (currentXP % 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <i className="fas fa-star text-yellow-500"></i>
          XP Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Level Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Level {currentLevel}</span>
            <span>{currentXP} / {currentLevel * 100} XP</span>
          </div>
          <Progress value={(currentXP % 100)} className="h-2" />
          <p className="text-xs text-gray-500 text-center">
            {xpToNextLevel} XP to Level {currentLevel + 1}
          </p>
        </div>

        {/* XP Breakdown by Habit */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">XP by Habit</h4>
          {Object.entries(xpBreakdown).map(([habitTitle, data]) => (
            <div key={habitTitle} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <p className="text-sm font-medium">{habitTitle}</p>
                <p className="text-xs text-gray-500">
                  {data.completions} completions • Avg streak: {data.streak} days
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">{data.xp} XP</p>
                <p className="text-xs text-gray-500">
                  ~{Math.round(data.xp / data.completions)} XP/completion
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Calculated XP:</span>
            <span className="font-bold text-green-600">{totalCalculatedXP} XP</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Current XP:</span>
            <span>{currentXP} XP</span>
          </div>
          {totalCalculatedXP !== currentXP && (
            <p className="text-xs text-orange-600 mt-1">
              Note: XP difference may be due to streak variations or bonus activities
            </p>
          )}
        </div>

        {/* XP Earning Tips */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h5 className="font-medium text-sm text-blue-800 mb-2">💡 XP Earning Tips</h5>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Complete habits daily for streak bonuses</li>
            <li>• Each completion gives 10 base XP + streak bonus</li>
            <li>• Streak bonus: 2 XP per day, up to 20 XP max</li>
            <li>• Maintain streaks to maximize XP gains</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
