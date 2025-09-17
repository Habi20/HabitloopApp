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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-12 md:py-16">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center text-white mb-8 sm:mb-12 md:mb-16">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <i className="fas fa-chart-line text-xl sm:text-2xl md:text-3xl"></i>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">HabitLoop</h1>
            <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-6 sm:mb-8 max-w-3xl mx-auto">
              Transform your life with AI-powered habit tracking. Build lasting habits, 
              track your progress, and achieve your goals with personalized insights.
            </p>
          </div>

          <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
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

          <div className="text-center space-y-4">
            <Button 
              size="lg" 
              className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg w-full sm:w-auto"
              onClick={() => setShowHabitLoopUserModal(true)}
            >
              <i className="fas fa-rocket mr-2"></i>
              Get Started
            </Button>
            
            <div className="text-white/80">
              <span>or </span>
              <button 
                className="underline hover:text-white transition-colors text-lg"
                onClick={() => setShowGuestModal(true)}
              >
                try as guest
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-white/60">
            <p className="text-sm sm:text-base">Join thousands of users building better habits every day</p>
          </div>
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
        onOpenSignup={() => {
          setShowGuestModal(false);
          setShowHabitLoopUserModal(true);
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