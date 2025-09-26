import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface WelcomeTourModalProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeTourModal({ open, onClose }: WelcomeTourModalProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps = [
    {
      title: "🎉 Welcome to HabitLoop!",
      content: `Hi ${user?.firstName || 'there'}! Your account has been created successfully. Let's get you started with your personalized habit journey.`,
      action: "Get Started",
      actionType: "primary" as const
    },
    {
      title: "🤖 AI-Powered Personalization",
      content: "Based on your questionnaire, we've generated 10 personalized habits just for you. These are tailored to your goals, preferences, and difficulty level.",
      action: "See My Habits",
      actionType: "primary" as const
    },
    {
      title: "📊 Your Dashboard",
      content: "This is your home dashboard where you can track your daily progress, see your XP and level, and get AI-powered insights about your habits.",
      action: "Explore Dashboard",
      actionType: "secondary" as const
    }
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Last step - go to habits page
      setLocation("/habits");
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleGoToHabits = () => {
    setLocation("/habits");
    onClose();
  };

  const currentStepData = tourSteps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 sm:mx-0 p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {currentStepData.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex justify-center space-x-2">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-500' : 
                  index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center space-y-4">
            <p className="text-gray-600 leading-relaxed">
              {currentStepData.content}
            </p>

            {/* Special content for step 1 (AI habits) */}
            {currentStep === 1 && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      ✨ Personalized
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      🎯 AI-Selected
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your habits are ready to view in the <strong>Habits</strong> tab!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip Tour
            </Button>
            <Button
              onClick={handleNext}
              className={`flex-1 ${
                currentStepData.actionType === 'primary' 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {currentStepData.action}
            </Button>
          </div>

          {/* Quick access to habits */}
          {currentStep === 0 && (
            <div className="text-center">
              <Button
                variant="link"
                onClick={handleGoToHabits}
                className="text-blue-600 hover:text-blue-700"
              >
                🚀 Go directly to my personalized habits
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
