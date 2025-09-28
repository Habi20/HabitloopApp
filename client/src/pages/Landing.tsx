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
      // Add a small delay to ensure PWA is fully loaded
      setTimeout(() => {
        setLocation('/home');
      }, 100);
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-12 md:py-16">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center text-white mb-8 sm:mb-12 md:mb-16">
            {/* Enhanced Logo Container - Option 3 */}
            <div 
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 relative overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.4)'
              }}
            >
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent rounded-2xl"></div>
              <img 
                src="/icons/icon-192x192.png" 
                alt="HabitLoop Logo" 
                className="w-full h-full object-contain relative z-10"
                style={{
                  filter: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.4)) drop-shadow(0 6px 24px rgba(0, 0, 0, 0.2))'
                }}
              />
            </div>
            
            {/* Value Proposition - No Brand Name Text */}
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-indigo-100 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed font-light">
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

          <div className="text-center space-y-6">
            <Button 
              size="lg" 
              className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-10 py-5 text-xl w-full sm:w-auto shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              onClick={() => setShowHabitLoopUserModal(true)}
            >
              <i className="fas fa-rocket mr-3"></i>
              Get Started
            </Button>
            
            <div className="text-white/80 text-lg">
              <span>or </span>
              <button 
                className="underline hover:text-white transition-colors font-medium"
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