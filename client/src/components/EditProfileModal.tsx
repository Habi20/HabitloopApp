import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getMobileModalHeader, getMobileModalBody, getMobileButtonClasses } from '@/lib/utils';
import { useScreenSize } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/config/api';

// Avatar styles from HabitLoopSignupModal
const AVATAR_STYLES = [
  { value: 'adventurer', label: 'Adventurer', description: 'Fantasy-style characters' },
  { value: 'avataaars', label: 'Avataaars', description: 'Cartoon-style people' },
  { value: 'bottts', label: 'Bottts', description: 'Robot characters' },
  { value: 'fun-emoji', label: 'Fun Emoji', description: 'Expressive emoji faces' },
  { value: 'lorelei', label: 'Lorelei', description: 'Abstract geometric patterns' },
  { value: 'personas', label: 'Personas', description: 'Professional avatars' },
  { value: 'notionists', label: 'Notionists', description: 'Minimalist designs' },
];

// DiceBear avatar URL generator
const generateAvatarUrl = (style: string, seed: string, size = 128) =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl: string;
  avatarStyle: string;
  avatarSeed: string;
  difficulty: string;
}

export function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const { user, refreshUserData } = useAuth();
  const { toast } = useToast();
  const { isMobile } = useScreenSize();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    profileImageUrl: '',
    avatarStyle: 'avataaars',
    avatarSeed: 'HabitLoop',
    difficulty: 'easy',
  });

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        profileImageUrl: user.profileImageUrl || '',
        avatarStyle: 'avataaars',
        avatarSeed: (user.firstName || 'HabitLoop') + (user.lastName ? ' ' + user.lastName : ''),
        difficulty: user.difficulty || 'easy',
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  const getUserType = () => {
    if (!user) return 'unknown';
    if (user.isGuest) return 'guest';
    if (user.email && user.email.includes('@')) return 'supabase';
    return 'habitloop';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

                       try {
               const response = await fetch(buildApiUrl(`users/${user?.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('verified_token') || localStorage.getItem('guest_token')}`,
          },
                  body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            profileImageUrl: generateAvatarUrl(formData.avatarStyle, formData.avatarSeed),
            difficulty: formData.difficulty,
          }),
        });

      if (response.ok) {
        await refreshUserData();
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
        onClose();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const userType = getUserType();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="overflow-hidden"
        mobileVariant="bottom-sheet"
      >
        {/* Header - Mobile optimized */}
        <DialogHeader className={getMobileModalHeader(isMobile)}>
          <DialogTitle className={`${isMobile ? "text-lg" : "text-xl"} font-semibold text-gray-900 dark:text-gray-100`}>
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Update your personal information and avatar
          </DialogDescription>
        </DialogHeader>

        {/* Content - Scrollable body */}
        <div className={getMobileModalBody(isMobile)}>
          <form onSubmit={handleSubmit} className={isMobile ? "space-y-5" : "space-y-6"}>
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Email field - different behavior based on user type */}
            {userType === 'supabase' && (
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Email can be updated for Supabase users
                </p>
              </div>
            )}

            {/* Difficulty Level */}
            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => handleInputChange('difficulty', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      <span>Easy</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                      <span>Medium</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hard">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      <span>Hard</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Choose your preferred difficulty level for habit recommendations
              </p>
            </div>

            {userType === 'habitloop' && (
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="mt-1 bg-gray-50 dark:bg-gray-800"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Email cannot be changed for HabitLoop users
                </p>
              </div>
            )}

            {userType === 'guest' && (
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email to upgrade account"
                  className="mt-1"
                />
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Add email to upgrade from guest account
                </p>
              </div>
            )}

            {/* Avatar Generator */}
            <div className="space-y-4">
              <Label>Update Your Avatar</Label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {/* Avatar Preview */}
                <div className="flex-shrink-0">
                  <img
                    src={generateAvatarUrl(formData.avatarStyle, formData.avatarSeed)}
                    alt="Avatar Preview"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-gray-700 shadow-lg"
                  />
                </div>
                {/* Avatar Controls */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="avatarStyle" className="text-xs font-medium">Style</Label>
                      <Select 
                        value={formData.avatarStyle} 
                        onValueChange={(value) => handleInputChange('avatarStyle', value)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVATAR_STYLES.map(style => (
                            <SelectItem key={style.value} value={style.value}>
                              <div className="font-medium">{style.label}</div>
                              <div className="text-xs text-gray-500">{style.description}</div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatarSeed" className="text-xs">Seed (Name/Text)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="avatarSeed"
                          value={formData.avatarSeed}
                          onChange={(e) => handleInputChange('avatarSeed', e.target.value)}
                          placeholder="Enter your name"
                          className="h-9 text-xs flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const randomSeed = Math.random().toString(36).substring(7);
                            handleInputChange('avatarSeed', randomSeed);
                          }}
                          className="h-9 px-3 text-xs"
                          title="Generate random avatar"
                        >
                          🎲
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Avatar URL (auto-generated)
                    </Label>
                    <Input
                      value={generateAvatarUrl(formData.avatarStyle, formData.avatarSeed)}
                      readOnly
                      className="h-8 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Tip:</strong> Change the seed text or click dice to generate different avatars.
                  The same seed always creates the same avatar.
                </p>
              </div>
            </div>


          </div>

          

          {/* User Type Specific Information */}
          {userType === 'guest' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Guest Account
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Add an email address to upgrade to a full account and save your progress permanently.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={getMobileButtonClasses('primary', isMobile)}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
