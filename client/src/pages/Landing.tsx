import { useState } from "react";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-chart-line text-2xl"></i>
          </div>
          <h1 className="text-5xl font-bold mb-6">HabitLoop</h1>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Transform your life with AI-powered habit tracking. Build lasting habits, 
            track your progress, and achieve your goals with personalized insights.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-brain text-white"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-indigo-100">Get personalized recommendations and insights to optimize your habits</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-warning rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-fire text-white"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Streak Tracking</h3>
              <p className="text-indigo-100">Build momentum with visual streak counters and gamified progress</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-mobile-alt text-white"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Mobile Optimized</h3>
              <p className="text-indigo-100">Track habits anywhere with our responsive, mobile-first design</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <Button 
            size="lg" 
            className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg"
            onClick={() => setShowLoginModal(true)}
          >
            <i className="fas fa-rocket mr-2"></i>
            Get Started Free
          </Button>
          
          <div className="text-white/80 space-y-2">
            <div>
              <span>or </span>
              <button 
                className="underline hover:text-white transition-colors"
                onClick={() => setShowGuestModal(true)}
              >
                try as guest
              </button>
            </div>
            <div>
              <span>or </span>
              <button 
                className="underline hover:text-white transition-colors"
                onClick={() => setShowHabitLoopUserModal(true)}
              >
                try as a habitloop user
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-white/60">
          <p>Join thousands of users building better habits every day</p>
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
          // Auth state will be automatically updated by AuthProvider
          setShowLoginModal(false);
        }}
      />

      <HabitLoopUserModal
        open={showHabitLoopUserModal}
        onClose={() => setShowHabitLoopUserModal(false)}
        onSuccess={() => {
          setShowHabitLoopUserModal(false);
        }}
      />
    </div>
  );
}