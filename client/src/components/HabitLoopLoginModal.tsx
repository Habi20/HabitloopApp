import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { buildApiUrl } from "@/config/api";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { ResetPasswordModal } from "./ResetPasswordModal";

interface HabitLoopLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenSignup: () => void;
}

export function HabitLoopLoginModal({ 
  open, 
  onClose, 
  onSuccess, 
  onOpenSignup
}: HabitLoopLoginModalProps) {
  const { toast } = useToast();
  const { loginAsHabitLoopUser } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    level: number;
    xp: number;
    difficulty: string;
  } | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setUserProfile(null);
    }
  }, [open]);

  // Fetch user profile when email changes (only for complete, valid emails)
  const fetchUserProfile = async (email: string) => {
    // Only fetch for complete, valid email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setUserProfile(null);
      setCheckingProfile(false);
      return;
    }

    setCheckingProfile(true);
    try {
      const response = await fetch(buildApiUrl(`habitloop/user-profile-email/${encodeURIComponent(email)}`), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUserProfile({
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            profileImageUrl: data.user.profileImageUrl,
            level: data.user.level,
            xp: data.user.xp,
            difficulty: data.user.difficulty
          });
        } else {
          setUserProfile(null);
        }
      } else if (response.status === 404) {
        // User not found - this is expected for new users
        setUserProfile(null);
      } else {
        // Other errors - silently handle
        setUserProfile(null);
      }
    } catch (error) {
      // Network failure - silently handle to avoid console spam
      setUserProfile(null);
    } finally {
      setCheckingProfile(false);
    }
  };

  // Debounced user profile fetch (only for complete emails)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUserProfile(email);
    }, 1000); // Increased delay to reduce API calls

    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Pass the correct data structure to loginAsHabitLoopUser
      await loginAsHabitLoopUser({ email, password });
      
      toast({
        title: "Welcome to HabitLoop! 🎉",
        description: `Logged in successfully`,
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] mx-2 sm:mx-0 p-4 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to HabitLoop!
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose how to start tracking your habits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Standard Login Form */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pr-10"
                      required
                      autoComplete="email"
                    />
                    {checkingProfile && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pr-10"
                      required
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

                {/* User Profile Preview */}
                {userProfile && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        {userProfile.profileImageUrl ? (
                          <img 
                            src={userProfile.profileImageUrl} 
                            alt="Profile" 
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <span className="text-xl">
                            {userProfile.firstName.charAt(0)}{userProfile.lastName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {userProfile.firstName} {userProfile.lastName}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Level {userProfile.level}</span>
                          <span>•</span>
                          <span>{userProfile.xp} XP</span>
                          <span>•</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(userProfile.difficulty)}`}>
                            {userProfile.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Check Status */}
                {email && !userProfile && !checkingProfile && email.includes('@') && (
                  <div className="mt-2 text-xs text-gray-500">
                    <i className="fas fa-info-circle mr-1"></i>
                    User not found - you can still login if you have an account
                  </div>
                )}

                <Button 
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim()}
                  className="w-full"
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>

              {/* Forgot Password Link */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Create New Account */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Don't have an account?
            </p>
            <Button 
              variant="outline" 
              onClick={onOpenSignup}
              className="w-full"
            >
              Create New User Account
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetPassword}
        onClose={() => setShowResetPassword(false)}
        onSuccess={() => {
          setShowResetPassword(false);
          onSuccess();
        }}
      />
    </Dialog>
  );
}
