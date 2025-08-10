import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface GuestModeModalProps {
  open: boolean;
  onClose: () => void;
  onStartQuestionnaire: () => void;
}

export function GuestModeModal({ open, onClose, onStartQuestionnaire }: GuestModeModalProps) {
  const { loginAsGuest } = useAuth();

  const createGuestUser = async () => {
    try {
      // Option 1: Client-side guest auth (current implementation)
      const guestUser = await loginAsGuest();
      
      // Option 2: Backend API (commented for reference/testing)
      /*
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const guestUser = await response.json();
      localStorage.setItem("guestUser", JSON.stringify(guestUser));
      */
      
      if (guestUser) onStartQuestionnaire();
    } catch (error) {
      console.error("Guest auth failed:", error);
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
              Start tracking your habits right away as a guest
            </p>
          </div>
        </DialogHeader>
        
        <div className="space-y-3">
          <Button 
            variant="outline" 
            onClick={createGuestUser}
            className="w-full"
          >
            <i className="fas fa-eye mr-2"></i>
            Continue as Guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
