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
};

export function useUISettings() {
  const [settings, setSettings] = useState<UISettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('habitloop_ui_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } catch (error) {
        console.error('Error loading UI settings from localStorage:', error);
      }
    }
    setIsLoaded(true);
  }, []);

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
