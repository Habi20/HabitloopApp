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
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { buildApiUrl } from "@/config/api";
import { Eye, EyeOff, User, Lock, UserPlus } from "lucide-react";

interface GuestModeModalProps {
  open: boolean;
  onClose: () => void;
  onStartQuestionnaire: () => void;
  onOpenSignup: () => void;
}

export function GuestModeModal({ open, onClose, onStartQuestionnaire, onOpenSignup }: GuestModeModalProps) {
  const { loginAsGuest } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to HabitLoop!
          </DialogTitle>
          <DialogDescription className="text-center">
            {showForm 
              ? "Login with existing account or leave empty for auto-generation"
              : "Choose how to start tracking your habits"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {!showForm ? (
            <div className="space-y-4">
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
              
              <div className="text-xs text-gray-500 text-center space-y-1 pt-2">
                <p><strong>Quick Mode:</strong> Auto-generates guest account instantly</p>
                <p><strong>Login Mode:</strong> Use existing accounts (user-001, guest-001) or leave empty for auto-generation</p>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={(e) => { e.preventDefault(); handleGuestLogin(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username or Email (Optional)
                    </Label>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="e.g., user-001 or leave empty for auto-generation"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={loading}
                      className="w-full"
                      autoComplete="username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password (Optional)
                    </Label>
                    <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password if account has one"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pr-10"
                      autoComplete="current-password"
                    />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={resetForm}
                      disabled={loading}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit"
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
                </form>
              </CardContent>
            </Card>
          )}

          {/* Registration Option */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Want to create a permanent account?
            </p>
            <Button 
              variant="outline" 
              onClick={onOpenSignup}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create New User Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
