import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface GuestModeModalProps {
  open: boolean;
  onClose: () => void;
  onStartQuestionnaire: () => void;
}

export function GuestModeModal({ open, onClose, onStartQuestionnaire }: GuestModeModalProps) {
  const createGuestUser = async () => {
    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        const guestUser = await response.json();
        localStorage.setItem("guestUser", JSON.stringify(guestUser));
        onStartQuestionnaire();
      }
    } catch (error) {
      console.error("Failed to create guest user:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-rocket text-white text-2xl"></i>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
              Welcome to HabitFlow!
            </DialogTitle>
            <p className="text-gray-600 mb-6">
              Start tracking your habits right away as a guest, or create an account 
              to save your progress and unlock AI insights.
            </p>
          </div>
        </DialogHeader>
        
        <div className="space-y-3">
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="w-full"
          >
            <i className="fas fa-user-plus mr-2"></i>
            Create Free Account
          </Button>
          
          <Button 
            variant="outline" 
            onClick={createGuestUser}
            className="w-full"
          >
            <i className="fas fa-eye mr-2"></i>
            Continue as Guest
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}