import { useState, useEffect } from 'react';

interface UISettings {
  showDataConsistencyCheck: boolean;
  showMLSuccessPredictor: boolean;
}

const defaultSettings: UISettings = {
  showDataConsistencyCheck: false,
  showMLSuccessPredictor: false,
};

export function useUISettings() {
  const [settings, setSettings] = useState<UISettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

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

  // Update a specific setting
  const updateSetting = (key: keyof UISettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('habitloop_ui_settings', JSON.stringify(newSettings));
  };

  return {
    settings,
    updateSetting,
    isLoaded,
  };
}
