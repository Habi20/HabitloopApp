import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { buildApiUrl } from "@/config/api";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ open, onClose, onSuccess }: LoginModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (showMagicLink) {
        // Send magic link
        const response = await fetch(buildApiUrl('auth/magic-link'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to send magic link");
        }

        toast({
          title: "Magic link sent!",
          description: "Check your email for a login link.",
        });

        setShowMagicLink(false);
        return;
      }

      if (isSignUp) {
        // Handle signup
        const response = await fetch(buildApiUrl('auth/signup'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, firstName, lastName }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Signup failed");
        }

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        // Handle login using AuthContext
        await login(email, password);
        
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Authentication failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-user text-white text-2xl"></i>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
              {isSignUp ? "Create Account" : "Sign In"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mb-6">
              {isSignUp
                ? "Join HabitLoop and start building better habits today"
                : "Welcome back! Sign in to continue your habit journey"}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={isSignUp}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!showMagicLink && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {showMagicLink
                  ? "Sending Magic Link..."
                  : isSignUp
                  ? "Creating Account..."
                  : "Signing In..."}
              </div>
            ) : showMagicLink ? (
              "Send Magic Link"
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="text-center mt-4 space-y-2">
          {!isSignUp && !showMagicLink && (
            <button
              type="button"
              onClick={() => setShowMagicLink(true)}
              className="text-sm text-gray-600 hover:text-gray-900 underline block"
            >
              Sign in with magic link
            </button>
          )}

          {showMagicLink && (
            <button
              type="button"
              onClick={() => setShowMagicLink(false)}
              className="text-sm text-gray-600 hover:text-gray-900 underline block"
            >
              Sign in with password
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setShowMagicLink(false);
            }}
            className="text-sm text-gray-600 hover:text-gray-900 underline block"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}