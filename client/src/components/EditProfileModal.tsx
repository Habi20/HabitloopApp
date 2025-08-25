import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/config/api';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  difficulty: 'easy' | 'medium' | 'hard';
  profileImageUrl: string;
  emailSettings: {
    dailyReminders: boolean;
    weeklyReports: boolean;
    achievementNotifications: boolean;
  };
}

export function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const { user, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    difficulty: 'medium',
    profileImageUrl: '',
    emailSettings: {
      dailyReminders: true,
      weeklyReports: true,
      achievementNotifications: true,
    },
  });

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
                 difficulty: (user.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        profileImageUrl: user.profileImageUrl || '',
        emailSettings: {
          dailyReminders: true,
          weeklyReports: true,
          achievementNotifications: true,
          ...user.emailSettings,
        },
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailSettingChange = (setting: keyof ProfileFormData['emailSettings'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      emailSettings: { ...prev.emailSettings, [setting]: value }
    }));
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
             const response = await fetch(buildApiUrl(`user/${user?.id}`), {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${localStorage.getItem('token')}`,
         },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          difficulty: formData.difficulty,
          profileImageUrl: formData.profileImageUrl,
          emailSettings: formData.emailSettings,
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Edit Profile
            {userType !== 'unknown' && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({userType.charAt(0).toUpperCase() + userType.slice(1)} User)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

            <div>
              <Label htmlFor="profileImageUrl">Profile Image URL</Label>
              <Input
                id="profileImageUrl"
                value={formData.profileImageUrl}
                onChange={(e) => handleInputChange('profileImageUrl', e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="difficulty">Preferred Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                  handleInputChange('difficulty', value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy - Beginner friendly</SelectItem>
                  <SelectItem value="medium">Medium - Balanced challenge</SelectItem>
                  <SelectItem value="hard">Hard - Advanced user</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Email Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Email Preferences
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Daily Reminders</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive daily habit reminders
                  </p>
                </div>
                <Button
                  type="button"
                  variant={formData.emailSettings.dailyReminders ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleEmailSettingChange('dailyReminders', !formData.emailSettings.dailyReminders)}
                >
                  {formData.emailSettings.dailyReminders ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Weekly Reports</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get weekly progress summaries
                  </p>
                </div>
                <Button
                  type="button"
                  variant={formData.emailSettings.weeklyReports ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleEmailSettingChange('weeklyReports', !formData.emailSettings.weeklyReports)}
                >
                  {formData.emailSettings.weeklyReports ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Achievement Notifications</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Celebrate your milestones
                  </p>
                </div>
                <Button
                  type="button"
                  variant={formData.emailSettings.achievementNotifications ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleEmailSettingChange('achievementNotifications', !formData.emailSettings.achievementNotifications)}
                >
                  {formData.emailSettings.achievementNotifications ? 'On' : 'Off'}
                </Button>
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
