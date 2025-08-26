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
  const [isNewPassword, setIsNewPassword] = useState(false);
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
    if (!identifier.trim()) {
      setError("Please enter a username or email");
      return;
    }

    // If no password provided, try to check if password is needed
    if (!password.trim()) {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(buildApiUrl('guest/auth'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            identifier: identifier.trim()
          })
        });

        const data = await response.json();

        if (response.ok && data.needsPassword) {
          setIsNewPassword(true);
          setError('');
          return;
        } else if (response.status === 400 && data.error === "Password is required") {
          // Password is required, but don't show error - just return to let user enter password
          setError('');
          return;
        } else if (response.ok) {
                  // Login successful (no password needed)
        await loginAsGuest(data);
        onClose();
        onStartQuestionnaire();
          return;
        } else {
          setError(data.error || 'Login failed');
          return;
        }
      } catch (error) {
        console.error("Guest login failed:", error);
        setError("Network error. Please try again.");
        return;
      } finally {
        setLoading(false);
      }
    }

    // Password provided - attempt login
    try {
      setLoading(true);
      setError('');

      const response = await fetch(buildApiUrl('guest/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: identifier.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.needsPassword) {
          setIsNewPassword(true);
          setError('');
          return;
        }

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

  const handleSetPassword = async () => {
    if (!password.trim() || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(buildApiUrl('guest/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: identifier.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        await loginAsGuest(data);
        onClose();
        onStartQuestionnaire();
      } else {
        setError(data.error || 'Failed to set password');
      }
    } catch (error) {
      console.error("Set password failed:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIdentifier('');
    setPassword('');
    setIsNewPassword(false);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); resetForm(); }}>
      <DialogContent className="max-w-md">
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
                ? isNewPassword 
                  ? "Set a password for future logins" 
                  : "Login with existing guest account"
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
              <p><strong>Guest Accounts:</strong> user-001, guest-001, john.doe@example.com</p>
              <p><strong>Quick Mode:</strong> Temporary session, data not saved</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="identifier">Username or Email</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="e.g., user-001 or john.doe@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading || isNewPassword}
              />
            </div>

            {(isNewPassword || identifier.trim()) && (
              <div>
                <Label htmlFor="password">
                  {isNewPassword ? "Set New Password" : "Password"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isNewPassword ? "Enter new password (min 6 chars)" : "Enter password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

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
                onClick={isNewPassword ? handleSetPassword : handleGuestLogin}
                disabled={loading || !identifier.trim() || (!isNewPassword && !password.trim())}
                className="flex-1"
              >
                {loading ? (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                ) : (
                  <i className={`fas ${isNewPassword ? 'fa-save' : 'fa-sign-in-alt'} mr-2`}></i>
                )}
                {isNewPassword ? 'Set Password' : 'Login'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
