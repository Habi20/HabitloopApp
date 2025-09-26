import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useLogoutProtection = () => {
  const { user, logout: originalLogout } = useAuth();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);

  const checkForUnsyncedChanges = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsChecking(true);
    let hasUnsyncedChanges = false;

    try {
      // Check if user has Google Calendar connected
      const userSettings = JSON.parse(localStorage.getItem('habitloop_ui_settings') || '{}');
      const calendarSettings = userSettings?.calendarSettings;
      
      if (calendarSettings?.enabled && calendarSettings?.calendarId) {
        // Check if there are recent habit changes that might not be synced
        const lastSyncTime = localStorage.getItem('habitloop_last_sync');
        const lastHabitChange = localStorage.getItem('habitloop_last_habit_change');
        
        if (lastHabitChange && lastSyncTime) {
          const lastChange = parseInt(lastHabitChange);
          const lastSync = parseInt(lastSyncTime);
          
          // If there were habit changes after the last sync, there might be unsynced changes
          if (lastChange > lastSync) {
            hasUnsyncedChanges = true;
          }
        }
      }
    } catch (error) {
      console.error('Error checking for unsynced changes:', error);
    } finally {
      setIsChecking(false);
    }

    return hasUnsyncedChanges;
  }, [user]);

  const protectedLogout = useCallback(async () => {
    if (!user) {
      originalLogout();
      return;
    }

    const hasUnsyncedChanges = await checkForUnsyncedChanges();
    
    if (hasUnsyncedChanges) {
      // Show confirmation dialog
      const shouldLogout = window.confirm(
        'You have unsynced habit changes. These changes will be synced automatically in the background. Do you want to continue logging out?'
      );
      
      if (!shouldLogout) {
        return;
      }
      
      // Show toast about background sync
      toast({
        title: "Background Sync",
        description: "Your habit changes will be synced in the background.",
        className: "bg-blue-50 border-blue-200 text-blue-800",
      });
    }

    // Proceed with logout
    originalLogout();
  }, [user, checkForUnsyncedChanges, originalLogout, toast]);

  const forceLogout = useCallback(() => {
    originalLogout();
  }, [originalLogout]);

  return {
    logout: protectedLogout,
    forceLogout,
    isChecking,
    checkForUnsyncedChanges,
  };
};
