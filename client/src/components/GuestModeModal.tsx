import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { buildApiUrl } from "@/config/api";

interface GuestModeModalProps {
  open: boolean;
  onClose: () => void;
  onStartQuestionnaire: () => void;
}

export function GuestModeModal({ open, onClose, onStartQuestionnaire }: GuestModeModalProps) {
  const { loginAsGuest } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuickGuest = async () => {
    try {
      setLoading(true);
      await loginAsGuest();
      onClose();
      onStartQuestionnaire();
    } catch (error) {
      console.error("Quick guest auth failed:", error);
      setError("Failed to create guest session");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // Send identifier if provided, otherwise auto-generate
      const requestBody: any = {};
      if (identifier.trim()) {
        requestBody.identifier = identifier.trim();
      }
      if (password.trim()) {
        requestBody.password = password.trim();
      }

      const response = await fetch(buildApiUrl('guest/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        await loginAsGuest(data);
        onClose();
        onStartQuestionnaire();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error("Guest login failed:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  const resetForm = () => {
    setShowForm(false);
    setIdentifier('');
    setPassword('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); resetForm(); }}>
              <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-rocket text-white text-2xl"></i>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
              Welcome to HabitLoop!
            </DialogTitle>
            <DialogDescription className="text-gray-600 mb-6">
              {showForm 
                ? "Login with existing account or leave empty for auto-generation"
                : "Choose how to start tracking your habits"
              }
            </DialogDescription>
          </div>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {!showForm ? (
          <div className="space-y-3">
            <Button 
              variant="outline" 
              onClick={handleQuickGuest}
              disabled={loading}
              className="w-full"
            >
              <i className="fas fa-eye mr-2"></i>
              Quick Guest Mode
            </Button>
            
            <Button 
              variant="default" 
              onClick={() => setShowForm(true)}
              className="w-full"
            >
              <i className="fas fa-user mr-2"></i>
              Login with Guest Account
            </Button>
            
            <div className="text-xs text-gray-500 text-center mt-3">
              <p><strong>Quick Mode:</strong> Auto-generates guest account instantly</p>
              <p><strong>Login Mode:</strong> Use existing accounts (user-001, guest-001) or leave empty for auto-generation</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="identifier">Username or Email (Optional)</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="e.g., user-001 or leave empty for auto-generation"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password (Optional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password if account has one"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={resetForm}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleGuestLogin}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                ) : (
                  <i className="fas fa-sign-in-alt mr-2"></i>
                )}
                Login
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
