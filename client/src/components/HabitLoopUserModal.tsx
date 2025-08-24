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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface HabitLoopUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface HabitLoopUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  difficulty: string;
  avatar: string;
  description: string;
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
  avatarStyle: string;
  avatarSeed: string;
  bio: string;
  goals: string[];
}

const HABITLOOP_USERS: HabitLoopUser[] = [
  {
    id: "user-001",
    username: "user-001",
    firstName: "Alex",
    lastName: "Chen",
    difficulty: "medium",
    avatar: "👨‍💻",
    description: "Productivity enthusiast with 15-day streak"
  },
  {
    id: "user-002",
    username: "user-002",
    firstName: "Sarah",
    lastName: "Johnson",
    difficulty: "easy",
    avatar: "👩‍🎨",
    description: "Creative habits builder, 8-day streak"
  },
  {
    id: "user-003",
    username: "user-003",
    firstName: "Marcus",
    lastName: "Rodriguez",
    difficulty: "medium",
    avatar: "🏃‍♂️",
    description: "Fitness champion, 30-day streak"
  },
  {
    id: "user-004",
    username: "user-004",
    firstName: "Emma",
    lastName: "Thompson",
    difficulty: "medium",
    avatar: "🧘‍♀️",
    description: "Mindfulness advocate, 12-day streak"
  },
  {
    id: "user-005",
    username: "user-005",
    firstName: "David",
    lastName: "Kim",
    difficulty: "medium",
    avatar: "📚",
    description: "Learning machine, 25-day streak"
  },
  {
    id: "user-006",
    username: "user-006",
    firstName: "Lisa",
    lastName: "Wang",
    difficulty: "easy",
    avatar: "🌱",
    description: "New habit builder, 6-day streak"
  },
  {
    id: "user-007",
    username: "user-007",
    firstName: "New",
    lastName: "User",
    difficulty: "easy",
    avatar: "🆕",
    description: "Fresh start, no habits yet"
  },
  {
    id: "user-008",
    username: "user-008",
    firstName: "Fresh",
    lastName: "Start",
    difficulty: "easy",
    avatar: "🌟",
    description: "Beginner with zero experience"
  },
  {
    id: "user-009",
    username: "user-009",
    firstName: "Beginner",
    lastName: "Tester",
    difficulty: "easy",
    avatar: "🎯",
    description: "Testing from ground zero"
  }
];

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

const AVATAR_STYLES = [
  { value: 'adventurer', label: 'Adventurer', description: 'Fantasy-style characters' },
  { value: 'avataaars', label: 'Avataaars', description: 'Cartoon-style people' },
  { value: 'bottts', label: 'Bottts', description: 'Robot characters' },
  { value: 'fun-emoji', label: 'Fun Emoji', description: 'Expressive emoji faces' },
  { value: 'lorelei', label: 'Lorelei', description: 'Abstract geometric patterns' },
  { value: 'personas', label: 'Personas', description: 'Professional avatars' },
  { value: 'notionists', label: 'Notionists', description: 'Minimalist designs' },
];

const generateAvatarUrl = (style: string, seed: string, size: number = 128) => {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
};

export function HabitLoopUserModal({ open, onClose, onSuccess }: HabitLoopUserModalProps) {
  const { toast } = useToast();
  const { loginAsHabitLoopUser } = useAuth();
  const isMobile = useIsMobile();
  
  // Existing user selection state
  const [selectedUser, setSelectedUser] = useState<HabitLoopUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<Record<string, { level: number; xp: number }>>({});
  const [fetchingData, setFetchingData] = useState<Record<string, boolean>>({});
  
  // New signup state
  const [showSignup, setShowSignup] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [newlyCreatedUser, setNewlyCreatedUser] = useState<string | null>(null);
  const [signupFormData, setSignupFormData] = useState<SignupFormData>({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    difficulty: 'medium',
    profileImageUrl: '',
    avatarStyle: 'avataaars',
    avatarSeed: 'HabitLoop',
    bio: '',
    goals: [],
  });

  // Fetch real user data from backend
  const fetchUserData = async (userId: string) => {
    if (userData[userId] || fetchingData[userId]) return;
    
    setFetchingData(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await fetch('/api/habitloop/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      
      if (data.success && data.user) {
        setUserData(prev => ({
          ...prev,
          [userId]: {
            level: data.user.level,
            xp: data.user.xp
          }
        }));
      }
    } catch (error) {
      console.warn(`Failed to fetch data for ${userId}:`, error);
    } finally {
      setFetchingData(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (open && !showSignup) {
      HABITLOOP_USERS.forEach(user => {
        fetchUserData(user.id);
      });
    }
  }, [open, showSignup]);

  const handleUserSelect = async (user: HabitLoopUser) => {
    setLoading(true);
    try {
      await loginAsHabitLoopUser(user);
      
      toast({
        title: "Welcome to HabitLoop! 🎉",
        description: `Logged in as ${user.firstName} ${user.lastName}`,
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Signup form handlers
  const handleInputChange = (field: keyof SignupFormData, value: string | string[]) => {
    setSignupFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-update avatar seed when first name changes
    if (field === 'firstName' && typeof value === 'string' && value.trim()) {
      setSignupFormData(prev => ({ 
        ...prev, 
        avatarSeed: value.trim() + (prev.lastName ? ' ' + prev.lastName : '')
      }));
    }
  };

  const handleGoalToggle = (goal: string) => {
    setSignupFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  // Avatar generator handlers
  const handleAvatarStyleChange = (style: string) => {
    setSignupFormData(prev => ({ ...prev, avatarStyle: style }));
  };

  const handleAvatarSeedChange = (seed: string) => {
    setSignupFormData(prev => ({ ...prev, avatarSeed: seed }));
  };

  const generateRandomSeed = () => {
    const randomSeed = Math.random().toString(36).substring(2, 15);
    setSignupFormData(prev => ({ ...prev, avatarSeed: randomSeed }));
  };

  const getCurrentAvatarUrl = () => {
    return generateAvatarUrl(signupFormData.avatarStyle, signupFormData.avatarSeed, 128);
  };

  const validateStep1 = () => {
    if (!signupFormData.userId.trim()) {
      toast({
        title: "User ID Required",
        description: "Please enter a unique user ID.",
        variant: "destructive",
      });
      return false;
    }
    if (!signupFormData.firstName.trim() || !signupFormData.lastName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your first and last name.",
        variant: "destructive",
      });
      return false;
    }
    if (!signupFormData.email.trim() || !signupFormData.email.includes('@')) {
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
    if (signupFormData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return false;
    }
    if (signupFormData.password !== signupFormData.confirmPassword) {
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
    // Only proceed to next step, don't submit the form
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
             const response = await fetch('/api/habitloop/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
                 body: JSON.stringify({
           userId: signupFormData.userId,
           firstName: signupFormData.firstName,
           lastName: signupFormData.lastName,
           email: signupFormData.email,
           password: signupFormData.password,
           difficulty: signupFormData.difficulty,
           profileImageUrl: getCurrentAvatarUrl(), // Use generated avatar URL
           bio: signupFormData.bio,
           goals: signupFormData.goals,
         }),
      });

             if (response.ok) {
         const responseData = await response.json();
         
         toast({
           title: "Account Created Successfully! 🎉",
           description: `Welcome ${signupFormData.firstName}! Your account has been created and added to the user list.`,
         });
         
         // Add the new user to the list dynamically
         const newUser: HabitLoopUser = {
           id: signupFormData.userId,
           username: signupFormData.userId,
           firstName: signupFormData.firstName,
           lastName: signupFormData.lastName,
           difficulty: signupFormData.difficulty,
           avatar: '🆕', // New user avatar
           description: `New user - ${signupFormData.difficulty} difficulty`
         };
         
                   // Add to the beginning of the list so it's visible
          HABITLOOP_USERS.unshift(newUser);
          
          // Mark as newly created for visual highlighting
          setNewlyCreatedUser(newUser.id);
          
          // Remove highlighting after 5 seconds
          setTimeout(() => {
            setNewlyCreatedUser(null);
          }, 5000);
          
          // Reset signup form and go back to user selection
          setShowSignup(false);
          setCurrentStep(1);
         setSignupFormData({
           userId: '',
           firstName: '',
           lastName: '',
           email: '',
           password: '',
           confirmPassword: '',
           difficulty: 'medium',
           profileImageUrl: '',
           avatarStyle: 'avataaars',
           avatarSeed: 'HabitLoop',
           bio: '',
           goals: [],
         });
         
         // Optionally, automatically log in the new user
         if (responseData.success && responseData.user) {
           try {
             await loginAsHabitLoopUser(newUser);
             onSuccess();
           } catch (error) {
             console.warn('Auto-login failed, user can manually log in:', error);
           }
         }
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
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Basic Information";
      case 2: return "Security Setup";
      case 3: return "Personalization";
      default: return "Create New User";
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

  // Render signup form
  if (showSignup) {
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

          <form onSubmit={handleSignupSubmit} className="space-y-4 sm:space-y-6">
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
                      value={signupFormData.userId}
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
                      value={signupFormData.difficulty}
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
                      value={signupFormData.firstName}
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
                      value={signupFormData.lastName}
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
                    value={signupFormData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className="h-10 sm:h-11 text-sm"
                    required
                  />
                </div>

                                 {/* Avatar Generator */}
                 <div className="space-y-4">
                   <Label className="text-sm font-medium">
                     Create Your Avatar
                   </Label>
                   
                   {/* Avatar Preview */}
                   <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                     <div className="flex-shrink-0">
                       <img
                         src={getCurrentAvatarUrl()}
                         alt="Avatar Preview"
                         className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-gray-700 shadow-lg"
                       />
                     </div>
                     <div className="flex-1 space-y-3">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {/* Avatar Style Selector */}
                         <div className="space-y-2">
                           <Label htmlFor="avatarStyle" className="text-xs font-medium">
                             Style
                           </Label>
                           <Select
                             value={signupFormData.avatarStyle}
                             onValueChange={handleAvatarStyleChange}
                           >
                             <SelectTrigger className="h-9 text-xs">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               {AVATAR_STYLES.map(style => (
                                 <SelectItem key={style.value} value={style.value}>
                                   <div className="py-1">
                                     <div className="font-medium text-sm">{style.label}</div>
                                     <div className="text-xs text-gray-500">{style.description}</div>
                                   </div>
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                         
                         {/* Avatar Seed Input */}
                         <div className="space-y-2">
                           <Label htmlFor="avatarSeed" className="text-xs font-medium">
                             Seed (Name/Text)
                           </Label>
                           <div className="flex gap-2">
                             <Input
                               id="avatarSeed"
                               value={signupFormData.avatarSeed}
                               onChange={(e) => handleAvatarSeedChange(e.target.value)}
                               placeholder="Enter your name"
                               className="h-9 text-xs flex-1"
                             />
                             <Button
                               type="button"
                               variant="outline"
                               size="sm"
                               onClick={generateRandomSeed}
                               className="h-9 px-3 text-xs"
                               title="Generate random avatar"
                             >
                               🎲
                             </Button>
                           </div>
                         </div>
                       </div>
                       
                       {/* Avatar URL Display */}
                       <div className="space-y-1">
                         <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                           Avatar URL (auto-generated)
                         </Label>
                         <Input
                           value={getCurrentAvatarUrl()}
                           readOnly
                           className="h-8 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                         />
                       </div>
                     </div>
                   </div>
                   
                   {/* Avatar Info */}
                   <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                     <p className="text-xs text-blue-700 dark:text-blue-300">
                       💡 <strong>Tip:</strong> Change the seed text to generate different avatars. 
                       The same seed always creates the same avatar, so you can recreate your avatar anytime!
                     </p>
                   </div>
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
                    value={signupFormData.password}
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
                    value={signupFormData.confirmPassword}
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
                    value={signupFormData.bio}
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
                        variant={signupFormData.goals.includes(goal) ? "default" : "outline"}
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
                onClick={currentStep === 1 ? () => setShowSignup(false) : handleBack}
                disabled={loading}
                className="w-full sm:w-auto h-10 sm:h-11 text-sm"
              >
                {currentStep === 1 ? 'Back to Users' : 'Back'}
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
                    disabled={loading}
                    className="w-full sm:w-auto h-10 sm:h-11 text-sm bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
                  >
                    {loading ? (
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

  // Render existing user selection
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-users text-white text-2xl"></i>
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
              Try as a HabitLoop User
            </DialogTitle>
            <DialogDescription className="text-gray-600 mb-6">
              Experience HabitLoop with pre-configured user profiles or create your own account. 
              Each user has different habits, streaks, and progress to demonstrate the full range of features.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Create New User Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowSignup(true)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 text-lg font-semibold"
          >
            <i className="fas fa-plus mr-2"></i>
            Create New User Account
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HABITLOOP_USERS.map((user) => (
                         <Card 
               key={user.id}
               className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 ${
                 selectedUser?.id === user.id 
                   ? 'border-indigo-500 bg-indigo-50' 
                   : newlyCreatedUser === user.id
                   ? 'border-green-500 bg-green-50 animate-pulse'
                   : 'border-gray-200 hover:border-indigo-300'
               }`}
               onClick={() => setSelectedUser(user)}
             >
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">{user.avatar}</div>
                                     <h3 className="text-lg font-semibold text-gray-900 mb-1">
                     {user.firstName} {user.lastName}
                   </h3>
                   <p className="text-sm text-gray-500 mb-3">{user.username}</p>
                   {newlyCreatedUser === user.id && (
                     <div className="mb-2">
                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                         ✨ New User
                       </span>
                     </div>
                   )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Level:</span>
                      <span className="font-semibold text-indigo-600">
                        {fetchingData[user.id] ? (
                          <span className="text-gray-500">Loading...</span>
                        ) : userData[user.id] ? (
                          userData[user.id].level
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">XP:</span>
                      <span className="font-semibold text-purple-600">
                        {fetchingData[user.id] ? (
                          <span className="text-gray-500">Loading...</span>
                        ) : userData[user.id] ? (
                          userData[user.id].xp.toLocaleString()
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(user.difficulty)}`}>
                        {user.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-4">{user.description}</p>
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserSelect(user);
                    }}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Logging in...
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt mr-2"></i>
                        Login as {user.firstName}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            These are demo accounts with pre-configured data to showcase HabitLoop's features.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
