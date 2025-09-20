import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SimpleXPDisplayProps {
  user: any;
}

export default function SimpleXPDisplay({ user }: SimpleXPDisplayProps) {
  const currentXP = user?.xp || 0;
  const currentLevel = user?.level || 1;
  const xpToNextLevel = 100 - (currentXP % 100);
  const progressPercentage = (currentXP % 100);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-sm">
      <CardContent className="p-4">
        <div className="text-center space-y-3">
          {/* Level & XP Header */}
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">Level {currentLevel}</div>
            <div className="text-lg font-semibold text-gray-700">
              {currentXP.toLocaleString()} XP
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress to Level {currentLevel + 1}</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2 bg-gray-200"
            />
            <p className="text-xs text-gray-500">
              {xpToNextLevel} XP needed
            </p>
          </div>

          {/* Achievement Badge */}
          <div className="pt-1">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <i className="fas fa-trophy text-yellow-500"></i>
              <span>Active Learner</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
