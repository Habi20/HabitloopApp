// client/src/pages/Challenges.tsx
import { useAuth } from "@/contexts/AuthContext";
import { ChallengesSystem } from "@/components/ChallengesSystem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Challenges() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Challenges
            </h2>
            <p className="text-gray-600">
              Please log in to view your challenges and earn rewards!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="flex items-center space-x-2"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Challenges & Achievements
              </h1>
              <p className="text-gray-600 mt-2">
                Complete challenges to earn XP and unlock achievements
              </p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2">
            <i className="fas fa-trophy mr-2"></i>
            Gamified System
          </Badge>
        </div>
      </div>

      {/* Gamification Info Card */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <i className="fas fa-info-circle mr-2"></i>
            How Challenges Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-sun text-yellow-600"></i>
              </div>
              <h4 className="font-semibold text-gray-900">Daily Challenges</h4>
              <p className="text-sm text-gray-600">Complete daily goals for quick XP rewards</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-calendar-week text-blue-600"></i>
              </div>
              <h4 className="font-semibold text-gray-900">Weekly Challenges</h4>
              <p className="text-sm text-gray-600">Build consistency with weekly milestones</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-calendar-alt text-purple-600"></i>
              </div>
              <h4 className="font-semibold text-gray-900">Monthly Challenges</h4>
              <p className="text-sm text-gray-600">Long-term goals for major XP rewards</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h5 className="font-semibold text-gray-900 mb-2">💡 Pro Tips:</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Complete all daily habits to unlock daily challenges</li>
              <li>• Maintain streaks to earn bonus XP</li>
              <li>• Claim rewards immediately when challenges are completed</li>
              <li>• Check back daily for new challenges</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Challenges System */}
      <ChallengesSystem />
    </div>
  );
}
