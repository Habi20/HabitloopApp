import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AIQuestionnaireModal } from "@/components/AIQuestionnaireModal";
import { GuestModeModal } from "@/components/GuestModeModal";
import { LoginModal } from "@/components/LoginModal";
import { HabitLoopUserModal } from "@/components/HabitLoopUserModal";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showHabitLoopUserModal, setShowHabitLoopUserModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to home page if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/home');
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 md:py-12 lg:py-16 xl:py-20">
        <div className="text-center text-white mb-6 sm:mb-8 md:mb-16">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6">
            <i className="fas fa-chart-line text-lg sm:text-xl md:text-2xl"></i>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6">HabitLoop</h1>
          <p className="text-sm sm:text-lg md:text-xl text-indigo-100 mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto px-2 sm:px-4">
            Transform your life with AI-powered habit tracking. Build lasting habits, 
            track your progress, and achieve your goals with personalized insights.
          </p>
        </div>

        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-6 sm:mb-8 md:mb-12 lg:mb-16 xl:mb-20">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="fas fa-brain text-white text-sm sm:text-base"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-indigo-100 text-sm sm:text-base">Get personalized recommendations and insights to optimize your habits</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="fas fa-fire text-white text-sm sm:text-base"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Streak Tracking</h3>
              <p className="text-indigo-100 text-sm sm:text-base">Build momentum with visual streak counters and gamified progress</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="fas fa-trophy text-white text-sm sm:text-base"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Gamified Progress</h3>
              <p className="text-indigo-100 text-sm sm:text-base">Level up with XP, unlock achievements, and compete with yourself</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4 px-2 sm:px-4 md:px-6 lg:px-8">
          <Button 
            size="lg" 
            className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg lg:text-xl w-full sm:w-auto md:w-auto lg:w-auto"
            onClick={() => setShowHabitLoopUserModal(true)}
          >
            <i className="fas fa-rocket mr-2"></i>
            Get Started
          </Button>
          
          <div className="text-white/80 space-y-2 text-xs sm:text-sm md:text-base lg:text-lg">
            <div>
              <span>or </span>
              <button 
                className="underline hover:text-white transition-colors"
                onClick={() => setShowGuestModal(true)}
              >
                try as guest
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 md:mt-12 lg:mt-16 text-center text-white/60 px-2 sm:px-4 md:px-6 lg:px-8">
          <p className="text-xs sm:text-sm md:text-base lg:text-lg">Join thousands of users building better habits every day</p>
        </div>
      </div>

      <AIQuestionnaireModal 
        open={showQuestionnaire} 
        onClose={() => setShowQuestionnaire(false)}
      />
      
      <GuestModeModal 
        open={showGuestModal} 
        onClose={() => setShowGuestModal(false)}
        onStartQuestionnaire={() => {
          setShowGuestModal(false);
          setShowQuestionnaire(true);
        }}
      />
      
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          // Redirect will be handled by useEffect when isAuthenticated changes
        }}
      />

      <HabitLoopUserModal
        open={showHabitLoopUserModal}
        onClose={() => setShowHabitLoopUserModal(false)}
        onSuccess={() => {
          setShowHabitLoopUserModal(false);
          // Redirect will be handled by useEffect when isAuthenticated changes
        }}
      />
    </div>
  );
}