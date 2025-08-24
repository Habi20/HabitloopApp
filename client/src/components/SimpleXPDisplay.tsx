import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface SimpleXPDisplayProps {
  user: any;
}

export default function SimpleXPDisplay({ user }: SimpleXPDisplayProps) {
  const currentXP = user?.xp || 0;
  const currentLevel = user?.level || 1;
  const xpToNextLevel = 100 - (currentXP % 100);
  const progressPercentage = (currentXP % 100);

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Level Badge */}
          <div className="flex justify-center">
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-lg font-bold">
              Level {currentLevel}
            </Badge>
          </div>

          {/* XP Display */}
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">
              {currentXP.toLocaleString()} XP
            </div>
            <div className="text-sm text-gray-600">
              Total Experience Points
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress to Level {currentLevel + 1}</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-gray-200"
            />
            <p className="text-xs text-gray-500">
              {xpToNextLevel} XP needed for next level
            </p>
          </div>

          {/* Achievement Status */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <i className="fas fa-trophy text-yellow-500"></i>
              <span>Active Learner</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
