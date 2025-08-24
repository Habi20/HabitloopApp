import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface HabitLoopSignupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SignupFormData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  difficulty: 'easy' | 'medium' | 'hard';
  profileImageUrl: string;
  bio: string;
  goals: string[];
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy - Beginner friendly', description: 'Perfect for starting your habit journey' },
  { value: 'medium', label: 'Medium - Balanced challenge', description: 'Great for consistent habit builders' },
  { value: 'hard', label: 'Hard - Advanced user', description: 'For experienced habit masters' },
];

const GOAL_OPTIONS = [
  'Improve productivity',
  'Build healthy habits',
  'Learn new skills',
  'Exercise regularly',
  'Read more books',
  'Practice mindfulness',
  'Save money',
  'Social connections',
  'Career development',
  'Personal growth',
];

export function HabitLoopSignupModal({ open, onClose, onSuccess }: HabitLoopSignupModalProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SignupFormData>({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    difficulty: 'medium',
    profileImageUrl: '',
    bio: '',
    goals: [],
  });

  const handleInputChange = (field: keyof SignupFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const validateStep1 = () => {
    if (!formData.userId.trim()) {
      toast({
        title: "User ID Required",
        description: "Please enter a unique user ID.",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your first and last name.",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({
        title: "Valid Email Required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/habitloop/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: formData.userId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          difficulty: formData.difficulty,
          profileImageUrl: formData.profileImageUrl,
          bio: formData.bio,
          goals: formData.goals,
        }),
      });

      if (response.ok) {
        toast({
          title: "Account Created",
          description: "Your HabitLoop account has been successfully created!",
        });
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Basic Information";
      case 2: return "Security Setup";
      case 3: return "Personalization";
      default: return "Sign Up";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "Tell us about yourself";
      case 2: return "Create a secure password";
      case 3: return "Customize your experience";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`
        sm:max-w-[600px] max-h-[90vh] overflow-y-auto
        ${isMobile ? 'w-[95vw] max-w-[95vw] mx-2' : 'w-full'}
        p-4 sm:p-6
      `}>
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center sm:text-left">
            {getStepTitle()}
          </DialogTitle>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center sm:text-left">
            {getStepDescription()}
          </p>
        </DialogHeader>

        {/* Progress Indicator - Responsive */}
        <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-4 sm:mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`
                  w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center 
                  text-xs sm:text-sm font-medium transition-all duration-200
                  ${step <= currentStep
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }
                `}
              >
                {step < currentStep ? '✓' : step}
              </div>
              {step < 3 && (
                <div
                  className={`
                    w-8 sm:w-12 h-1 mx-1 sm:mx-2 transition-all duration-200
                    ${step < currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                  `}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* User ID and Difficulty - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userId" className="text-sm font-medium">
                    User ID *
                  </Label>
                  <Input
                    id="userId"
                    value={formData.userId}
                    onChange={(e) => handleInputChange('userId', e.target.value)}
                    placeholder="Choose a unique ID"
                    className="h-10 sm:h-11 text-sm"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This will be your unique identifier
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-sm font-medium">
                    Difficulty Level
                  </Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                      handleInputChange('difficulty', value)
                    }
                  >
                    <SelectTrigger className="h-10 sm:h-11 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="py-1">
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Name Fields - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                    className="h-10 sm:h-11 text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter last name"
                    className="h-10 sm:h-11 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className="h-10 sm:h-11 text-sm"
                  required
                />
              </div>

              {/* Profile Image URL */}
              <div className="space-y-2">
                <Label htmlFor="profileImageUrl" className="text-sm font-medium">
                  Profile Image URL
                </Label>
                <Input
                  id="profileImageUrl"
                  value={formData.profileImageUrl}
                  onChange={(e) => handleInputChange('profileImageUrl', e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="h-10 sm:h-11 text-sm"
                />
              </div>
            </div>
          )}

          {/* Step 2: Security Setup */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a strong password"
                  className="h-10 sm:h-11 text-sm"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 6 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className="h-10 sm:h-11 text-sm"
                  required
                />
              </div>

              {/* Security Note - Responsive */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  🔒 Security Note
                </h4>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  Your password will be securely hashed and stored. We recommend using a strong, unique password.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Personalization */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  className="min-h-[80px] sm:min-h-[100px] text-sm resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Goals (Select all that apply)
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map(goal => (
                    <Button
                      key={goal}
                      type="button"
                      variant={formData.goals.includes(goal) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleGoalToggle(goal)}
                      className="justify-start text-left h-auto py-2 px-3 text-xs sm:text-sm transition-all duration-200"
                    >
                      {goal}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Success Note - Responsive */}
              <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  🎉 Almost Done!
                </h4>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                  Review your information and click "Create Account" to complete your signup.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons - Responsive */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 sm:pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? onClose : handleBack}
              disabled={isLoading}
              className="w-full sm:w-auto h-10 sm:h-11 text-sm"
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto h-10 sm:h-11 text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto h-10 sm:h-11 text-sm bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
