import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';

interface UISettings {
  pushNotifications: boolean;
  reminderSound: boolean;
  weeklyReport: boolean;
  defaultReminderTime: string;
  inactivityAlerts: boolean;
  achievementAlerts: boolean;
  insightAlerts: boolean;
  theme: string;
  showDataConsistencyCheck: boolean;
  showMLSuccessPredictor: boolean;
  showAIQuestionnaire: boolean;
  advancedFeatures: boolean;
  showHabitCarousel: boolean;
  allNotifications: boolean;
  dailyEmailReports: boolean;
  weeklyEmailReports: boolean;
  monthlyEmailReports: boolean;
}

const defaultSettings: UISettings = {
  pushNotifications: true,
  reminderSound: true,
  weeklyReport: true,
  defaultReminderTime: "09:00",
  inactivityAlerts: true,
  achievementAlerts: true,
  insightAlerts: true,
  theme: "light",
  showDataConsistencyCheck: false,
  showMLSuccessPredictor: false,
  showAIQuestionnaire: true,
  advancedFeatures: false,
  showHabitCarousel: true,
  allNotifications: true,
  dailyEmailReports: false,
  weeklyEmailReports: false,
  monthlyEmailReports: false,
};

export function useUISettings() {
  const [settings, setSettings] = useState<UISettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  // Load settings from localStorage and user data on mount
  useEffect(() => {
    let loadedSettings = { ...defaultSettings };
    
    // First, try to load from user data (database settings)
    if (user?.userSettings?.settings) {
      try {
        const userSettings = user.userSettings.settings;
        loadedSettings = { ...loadedSettings, ...userSettings };
        console.log('✅ Loaded settings from user data:', userSettings);
      } catch (error) {
        console.error('Error loading settings from user data:', error);
      }
    }
    
    // Then, try to load from localStorage (local overrides)
    const savedSettings = localStorage.getItem('habitloop_ui_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        loadedSettings = { ...loadedSettings, ...parsedSettings };
        console.log('✅ Loaded settings from localStorage:', parsedSettings);
      } catch (error) {
        console.error('Error loading UI settings from localStorage:', error);
      }
    }
    
    setSettings(loadedSettings);
    setIsLoaded(true);
  }, [user]);

  // Sync settings to database when user is authenticated
  const syncSettingsToDatabase = async (newSettings: UISettings) => {
    if (!user?.id) {
      console.log('No user logged in, skipping database sync');
      return;
    }

    try {
      await apiRequest('user/settings', 'PUT', { settings: newSettings });
      console.log('Settings synced to database');
    } catch (error) {
      console.error('Error syncing settings to database:', error);
    }
  };

  // Update a specific setting
  const updateSetting = async (key: keyof UISettings, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('habitloop_ui_settings', JSON.stringify(newSettings));
    
    // Sync to database if user is authenticated
    await syncSettingsToDatabase(newSettings);
  };

  return {
    settings,
    updateSetting,
    isLoaded,
  };
}
