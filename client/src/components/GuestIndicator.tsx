import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, UserPlus, Crown } from "lucide-react";
import { useState, useEffect } from "react";

interface GuestIndicatorProps {
  onUpgrade?: () => void;
}

export function GuestIndicator({ onUpgrade }: GuestIndicatorProps) {
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Calculate time remaining for guest session
  useEffect(() => {
    if (!user?.isGuest) return;

    const updateTimeRemaining = () => {
      const guestToken = localStorage.getItem('guest_token');
      if (!guestToken) return;

      try {
        // Decode JWT token to get expiration
        const payload = JSON.parse(atob(guestToken.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeLeft = expirationTime - now;

        if (timeLeft <= 0) {
          setTimeRemaining("Session expired");
          return;
        }

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m remaining`);
        } else {
          setTimeRemaining(`${minutes}m remaining`);
        }

        // Show upgrade prompt when less than 2 hours remaining
        if (timeLeft < 2 * 60 * 60 * 1000) {
          setShowUpgradePrompt(true);
        }
      } catch (error) {
        console.error('Error parsing guest token:', error);
        setTimeRemaining("Session active");
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user?.isGuest]);

  if (!user?.isGuest) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-orange-600" />
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                Guest Mode
              </Badge>
            </div>
            
            {timeRemaining && (
              <div className="flex items-center space-x-1 text-sm text-orange-600">
                <Clock className="h-3 w-3" />
                <span>{timeRemaining}</span>
              </div>
            )}
          </div>

          {onUpgrade && (
            <Button
              size="sm"
              variant="outline"
              onClick={onUpgrade}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          )}
        </div>

        {showUpgradePrompt && (
          <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800 mb-2">
              <strong>Session ending soon!</strong> Create a permanent account to keep your progress and access all features.
            </p>
            {onUpgrade && (
              <Button
                size="sm"
                onClick={onUpgrade}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Create Account Now
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

