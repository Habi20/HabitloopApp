import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useScreenSize } from "@/hooks/use-mobile";
import { formatRecurrencePattern } from "@/utils/habitFiltering";
import { Calendar, Clock, Settings, CheckCircle, AlertCircle, Info, RefreshCw } from "lucide-react";

interface GoogleCalendarIntegrationProps {
  className?: string;
}

interface CalendarSettings {
  enabled: boolean;
  calendarId: string;
  reminderTime: string;
  eventDuration: number;
  createEvents: boolean;
  syncCompletions: boolean;
}

// Helper functions moved to utils/habitFiltering.ts

export function GoogleCalendarIntegration({ className }: GoogleCalendarIntegrationProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isMobile } = useScreenSize();
  const isSuperAdmin = user?.id === 'admin-001' || user?.role === 'super_admin';
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [syncStatus, setSyncStatus] = useState<{
    habitsCount: number;
    syncedCount: number;
    skippedCount: number;
    message: string;
  } | null>(null);
  const [habitsPreview, setHabitsPreview] = useState<{
    withReminders: Array<{id: number; title: string; reminderTime: string; source: string; recurrencePattern?: string; selectedDays?: number[]}>;
    withoutReminders: Array<{id: number; title: string; reminderTime: string; source: string; recurrencePattern?: string; selectedDays?: number[]}>;
  } | null>(null);
  const [availableCalendars, setAvailableCalendars] = useState<Array<{id: string; name: string; primary?: boolean}>>([]);
  const [showPersonalCalendars, setShowPersonalCalendars] = useState(false);
  const [showTechnicalOptions, setShowTechnicalOptions] = useState(false);
  const [settings, setSettings] = useState<CalendarSettings>({
    enabled: false,
    calendarId: 'primary',
    reminderTime: '09:00',
    eventDuration: 30,
    createEvents: true,
    syncCompletions: true
  });

  // Load settings from user data and localStorage on mount
  useEffect(() => {
    let loadedSettings = {
      enabled: false,
      calendarId: 'primary',
      reminderTime: '09:00',
      eventDuration: 30,
      createEvents: true,
      syncCompletions: true
    };

    // First, try to load from user data (database settings)
    if (user?.userSettings?.calendarSettings) {
      try {
        const userCalendarSettings = user.userSettings.calendarSettings;
        loadedSettings = { ...loadedSettings, ...userCalendarSettings };
        console.log('✅ Loaded calendar settings from user data:', userCalendarSettings);
      } catch (error) {
        console.error('Error loading calendar settings from user data:', error);
      }
    }

    // Then, try to load from localStorage (local overrides)
    const savedSettings = localStorage.getItem('habitloop_calendar_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        loadedSettings = { ...loadedSettings, ...parsed };
        console.log('📱 Loaded calendar settings from localStorage:', parsed);
      } catch (error) {
        console.error('Failed to parse saved calendar settings:', error);
      }
    }

    // Validate calendar ID - if it's 'habits' or invalid, reset to 'primary'
    if (loadedSettings.calendarId === 'habits' || !loadedSettings.calendarId) {
      loadedSettings.calendarId = 'primary';
      console.log('🔧 Fixed invalid calendar ID, reset to primary');
    }

    setSettings(loadedSettings);
  }, [user]);

  // Smart calendar initialization when connected
  useEffect(() => {
    if (isConnected && availableCalendars.length === 0) {
      initializeSmartCalendar();
    }
  }, [isConnected]);

  // Periodic calendar validation to detect deleted calendars
  useEffect(() => {
    if (!isConnected || !settings.calendarId || settings.calendarId === 'primary') {
      return;
    }

    const validateInterval = setInterval(async () => {
      try {
        // Only validate if we haven't synced recently (avoid spam)
        const lastSyncTime = localStorage.getItem('habitloop_last_sync');
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        
        if (lastSyncTime && parseInt(lastSyncTime) > fiveMinutesAgo) {
          return; // Skip validation if we synced recently
        }

        const response = await apiRequest('google-calendar/validate-sync', 'GET');
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.error?.includes('Not Found') || errorData.error?.includes('not found')) {
            console.log('🗑️ Calendar was deleted during usage, recreating...');
            toast({
              title: "Calendar Deleted",
              description: "Your HabitLoop calendar was deleted. Creating a new one...",
              variant: "destructive",
            });
            
            // Create a new HabitLoop calendar
            await handleCreateHabitLoopCalendar();
          }
        }
      } catch (error) {
        console.log('Error during periodic calendar validation:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(validateInterval);
  }, [isConnected, settings.calendarId]);

  // Close technical options dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTechnicalOptions) {
        const target = event.target as Element;
        if (!target.closest('.technical-options-dropdown')) {
          setShowTechnicalOptions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTechnicalOptions]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    // Only save if calendar ID is valid (not 'habits' or empty)
    if (settings.calendarId && settings.calendarId !== 'primary' && settings.calendarId !== 'habits') {
      localStorage.setItem('habitloop_calendar_settings', JSON.stringify(settings));
      console.log('💾 Saved calendar settings to localStorage:', settings);
    }
  }, [settings]);

  // Check connection status
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Load habits preview and calendars when connected
  useEffect(() => {
    if (isConnected) {
      loadHabitsPreview();
      loadDefaultCalendars();
    }
  }, [isConnected]);

  // Load personal calendars when permission is given
  useEffect(() => {
    if (isConnected && showPersonalCalendars) {
      loadPersonalCalendars();
    }
  }, [isConnected, showPersonalCalendars]);

  // Auto-save settings when they change (with longer debounce)
  useEffect(() => {
    if (isConnected && settings.enabled) {
      const timeoutId = setTimeout(() => {
        handleSaveSettingsSilently();
      }, 3000); // Debounce for 3 seconds
      
      return () => clearTimeout(timeoutId);
    }
  }, [settings]);

  const checkConnectionStatus = async () => {
    try {
      setIsRefreshingToken(true);
      console.log('🔍 Checking Google Calendar connection status...');
      
      const response = await apiRequest('google-calendar/status', 'GET');
      console.log('📡 Calendar status response:', response.status, response.statusText);
      
      if (!response.ok) {
        console.warn('⚠️ Calendar status API returned error:', response.status);
        // Check localStorage as fallback
        const savedConnection = localStorage.getItem('habitloop_calendar_connected');
        if (savedConnection === 'true') {
          console.log('🔄 Using localStorage fallback for connection status');
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
        return;
      }
      
      const data = await response.json();
      console.log('📊 Calendar status data:', data);
      
      setIsConnected(data.connected);
      
      // Save connection status to localStorage as backup
      localStorage.setItem('habitloop_calendar_connected', data.connected ? 'true' : 'false');
      
      if (data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
      if (data.calendarId) {
        setSettings(prev => ({ ...prev, calendarId: data.calendarId }));
      }
      
      if (data.connected) {
        console.log('✅ Google Calendar is connected');
        toast({
          title: "Calendar Connected",
          description: "Google Calendar integration is active and ready to sync!",
        });
        
        // Sync habits and existing completions when calendar is connected
        try {
          console.log('🔄 Syncing habits to calendar first...');
          const habitsResponse = await apiRequest('google-calendar/sync-habits', 'POST');
          if (habitsResponse.ok) {
            console.log('✅ Habits synced to calendar');
            
            // Now sync existing completions
            console.log('🔄 Syncing existing completions to calendar...');
            const syncResponse = await apiRequest('google-calendar/sync-completions', 'POST');
            if (syncResponse.ok) {
              console.log('✅ Existing completions synced to calendar');
            } else {
              console.log('⚠️ Failed to sync existing completions, but calendar is connected');
            }
          } else {
            console.log('⚠️ Failed to sync habits to calendar');
          }
        } catch (syncError) {
          console.log('⚠️ Error syncing habits/completions:', syncError);
        }
        
        // Add delay to prevent UI crash
        console.log('⏳ Adding 5-second delay to prevent UI crash...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('✅ Delay completed, UI should be stable now');
      } else {
        console.log('❌ Google Calendar is not connected');
      }
    } catch (error) {
      console.error('❌ Failed to check calendar connection:', error);
      
      // Check localStorage as fallback
      const savedConnection = localStorage.getItem('habitloop_calendar_connected');
      if (savedConnection === 'true') {
        console.log('🔄 Using localStorage fallback for connection status');
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const loadHabitsPreview = async () => {
    try {
      const response = await apiRequest('habits', 'GET');
      
      if (!response.ok) {
        console.error('Habits API returned error:', response.status, response.statusText);
        // Don't clear the preview on API errors, keep existing data
        return;
      }
      
      const data = await response.json();
      
      console.log('🔍 Habits API response:', data);
      
      // Handle different response formats - habits API returns {success: true, habits: [...], count: 5}
      const habits = Array.isArray(data) ? data : (data.habits || data.data || []);
      
      console.log('🔍 Extracted habits:', habits);
      
      if (!Array.isArray(habits)) {
        console.error('Habits data is not an array:', data);
        // Don't clear the preview on data format errors, keep existing data
        return;
      }
      
      const withReminders = habits.filter((habit: any) => habit.reminderTime).map((habit: any) => ({
        id: habit.id,
        title: habit.title,
        reminderTime: habit.reminderTime,
        source: 'habit',
        recurrencePattern: habit.recurrencePattern || 'daily',
        selectedDays: habit.selectedDays || []
      }));
      
      const withoutReminders = habits.filter((habit: any) => !habit.reminderTime).map((habit: any) => ({
        id: habit.id,
        title: habit.title,
        reminderTime: settings.reminderTime,
        source: 'default',
        recurrencePattern: habit.recurrencePattern || 'daily',
        selectedDays: habit.selectedDays || []
      }));
      
      setHabitsPreview({
        withReminders,
        withoutReminders
      });
    } catch (error) {
      console.error('Failed to load habits preview:', error);
      // Don't clear the preview on network errors, keep existing data
    }
  };

  const loadDefaultCalendars = async () => {
    // Always show default calendars
    const defaultCalendars = [
      { id: 'primary', name: 'Primary Calendar', primary: true },
      { id: 'habits', name: 'HabitLoop Calendar' }
    ];
    
    // Check if HabitLoop Calendar exists
    try {
      const response = await apiRequest('google-calendar/calendars', 'GET');
      if (response.ok) {
        const data = await response.json();
        const habitLoopCalendar = data.calendars?.find((cal: any) => cal.name?.includes('HabitLoop'));
        
        if (habitLoopCalendar) {
          // Replace the default 'habits' with actual HabitLoop Calendar
          const calendars = defaultCalendars.map(cal => 
            cal.id === 'habits' ? { ...habitLoopCalendar, name: 'HabitLoop Calendar (Recommended)' } : cal
          );
          setAvailableCalendars(calendars);
        } else {
          setAvailableCalendars(defaultCalendars);
        }
      } else {
        setAvailableCalendars(defaultCalendars);
      }
    } catch (error) {
      console.error('Error loading default calendars:', error);
      setAvailableCalendars(defaultCalendars);
    }
  };

  const loadPersonalCalendars = async () => {
    try {
      const response = await apiRequest('google-calendar/calendars', 'GET');
      if (response.ok) {
        const data = await response.json();
        const personalCalendars = data.calendars?.filter((cal: any) => 
          !cal.name?.includes('HabitLoop') && !cal.primary
        ) || [];
        
        setAvailableCalendars(prev => [...prev, ...personalCalendars]);
      } else {
        console.error('Failed to load personal calendars');
      }
    } catch (error) {
      console.error('Error loading personal calendars:', error);
    }
  };

  const handleCreateHabitLoopCalendar = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('google-calendar/create-habitloop-calendar', 'POST');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ HabitLoop Calendar created:', data.calendarId);
        
        // Set the new calendar as selected
        if (data.calendarId) {
          setSettings(prev => ({ ...prev, calendarId: data.calendarId }));
        }
        
        // Reload calendars to show the new one
        await loadDefaultCalendars();
        
        // Automatically sync habits to the new calendar
        console.log('🔄 Auto-syncing habits to new HabitLoop Calendar...');
        setIsSyncing(true); // Show sync loading state
        try {
          await handleSyncHabits();
        } catch (syncError) {
          console.error('Auto-sync failed:', syncError);
          // Don't show error toast here as it's automatic
        } finally {
          setIsSyncing(false); // Hide sync loading state
        }
        
        toast({
          title: "HabitLoop Calendar Ready",
          description: "Calendar created and habits synced automatically! Check your Google Calendar to see your habits.",
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        console.error('Failed to create HabitLoop Calendar:', errorData);
        
        // Fallback to primary calendar
        setSettings(prev => ({ ...prev, calendarId: 'primary' }));
        toast({
          title: "Calendar Creation Failed",
          description: "Using Primary Calendar instead. " + (errorData.error || "Could not create HabitLoop Calendar"),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to create HabitLoop Calendar:', error);
      
      // Fallback to primary calendar
      setSettings(prev => ({ ...prev, calendarId: 'primary' }));
      toast({
        title: "Calendar Creation Error",
        description: "Using Primary Calendar as fallback",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      console.log('🔗 Initiating Google Calendar connection...');
      
      const response = await apiRequest('google-calendar/auth-url', 'GET');
      const data = await response.json();
      
      if (data.authUrl) {
        console.log('🔗 Redirecting to Google Calendar auth:', data.authUrl);
        // Use direct redirect instead of popup to avoid CORS issues
        window.location.href = data.authUrl;
      } else {
        console.error('❌ No auth URL received from server');
        toast({
          title: "Connection Failed",
          description: "No authentication URL received. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Failed to initiate calendar connection:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Calendar. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      console.log('🔌 Disconnecting from Google Calendar...');
      
      await apiRequest('google-calendar/disconnect', 'POST');
      setIsConnected(false);
      setSettings(prev => ({ ...prev, enabled: false }));
      
      // Clear localStorage
      localStorage.removeItem('habitloop_calendar_connected');
      localStorage.removeItem('habitloop_calendar_settings');
      
      console.log('✅ Successfully disconnected from Google Calendar');
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Google Calendar."
      });
    } catch (error) {
      console.error('❌ Failed to disconnect calendar:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect from Google Calendar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Removed unused handleSaveSettings function - using handleSaveSettingsSilently instead

  const handleSaveSettingsSilently = async () => {
    try {
      const response = await apiRequest('google-calendar/settings', 'POST', settings);
      if (response.ok) {
        console.log('✅ Calendar settings auto-saved silently');
      } else {
        console.error('Failed to auto-save calendar settings:', response.status);
      }
    } catch (error) {
      console.error('Failed to auto-save calendar settings:', error);
    }
  };

  const validateCalendarSync = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Validating calendar sync for:', settings.calendarId);
      
      // Check if we recently synced (within last 5 minutes)
      const lastSyncTime = localStorage.getItem('habitloop_last_sync');
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      if (lastSyncTime && parseInt(lastSyncTime) > fiveMinutesAgo) {
        console.log('✅ Recent sync detected, skipping validation');
        toast({
          title: "Sync Status",
          description: "Habits were recently synced and should be up to date!",
          variant: "default",
        });
        return;
      }
      
      const response = await apiRequest('google-calendar/validate-sync', 'GET');
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Validation failed:', errorData);
        
        // Handle different error scenarios
        if (errorData.needsReconnect) {
          console.log('🔌 Google Calendar needs reconnection');
          toast({
            title: "Reconnection Required",
            description: errorData.error || "Please reconnect your Google Calendar",
            className: "bg-amber-50 border-amber-200 text-amber-800",
          });
          setIsConnected(false);
          return;
        } else if (errorData.error?.includes('Not Found') || errorData.error?.includes('not found')) {
          console.log('🗑️ Calendar was deleted, will create a new one');
          toast({
            title: "Calendar Deleted",
            description: "Your HabitLoop calendar was deleted. Creating a new one...",
            className: "bg-amber-50 border-amber-200 text-amber-800",
          });
          
          // Create a new HabitLoop calendar
          await handleCreateHabitLoopCalendar();
        } else {
          toast({
            title: "Validation Failed",
            description: errorData.error || "Failed to validate calendar sync",
            className: "bg-amber-50 border-amber-200 text-amber-800",
          });
        }
        return;
      }
      
      const data = await response.json();
      const { summary, needsSync, validationResults } = data;
      
      console.log('📊 Validation results:', data);
      
      if (needsSync) {
        const inconsistentHabits = validationResults.filter((r: any) => r.status === 'inconsistent');
        const missingHabits = validationResults.filter((r: any) => r.status === 'missing');
        
        let message = '';
        if (inconsistentHabits.length > 0) {
          message += `${inconsistentHabits.length} habits need updates. `;
        }
        if (missingHabits.length > 0) {
          message += `${missingHabits.length} habits missing from calendar. `;
        }
        message += 'Consider running a sync.';
        
        toast({
          title: "Sync Validation",
          description: message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sync Validation",
          description: `All ${summary.valid} habits are properly synced with ${settings.calendarId === 'primary' ? 'Primary' : 'HabitLoop'} Calendar!`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error validating calendar sync:', error);
      toast({
        title: "Validation Error",
        description: "Failed to validate calendar sync",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const debugCalendarEvents = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('google-calendar/debug-events', 'GET');
      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "Debug Failed",
          description: errorData.error || "Failed to debug calendar events",
          variant: "destructive",
        });
        return;
      }
      
      const data = await response.json();
      console.log('🔍 Calendar Debug Data:', data);
      
      toast({
        title: "Debug Complete",
        description: `Found ${data.habitEvents} habit events in calendar. Check console for details.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error debugging calendar events:', error);
      toast({
        title: "Debug Error",
        description: "Failed to debug calendar events",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetCalendarSettings = () => {
    // Clear localStorage and reset to primary calendar
    localStorage.removeItem('habitloop_calendar_settings');
    setSettings({
      enabled: false,
      calendarId: 'primary',
      reminderTime: '09:00',
      eventDuration: 30,
      createEvents: true,
      syncCompletions: true
    });
    toast({
      title: "Settings Reset",
      description: "Calendar settings reset to primary calendar",
      variant: "default",
    });
  };

  const initializeSmartCalendar = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Initializing smart calendar selection...');

      // Step 1: Always validate the current calendar first
      const existingCalendarId = settings.calendarId;
      if (existingCalendarId && existingCalendarId !== 'primary') {
        console.log('🔍 Validating existing calendar ID:', existingCalendarId);
        
        try {
          // Test if the calendar still exists by trying to access it
          const validationResponse = await apiRequest('google-calendar/validate-sync', 'GET');
          if (validationResponse.ok) {
            console.log('✅ Existing calendar is still valid');
            
            // Set up available calendars with the existing calendar
            const defaultCalendars = [
              { id: 'primary', name: 'Primary Calendar', primary: true },
              { id: existingCalendarId, name: 'HabitLoop Calendar (Recommended)' }
            ];
            setAvailableCalendars(defaultCalendars);
            
            // Skip further validation since we confirmed the calendar exists
            return;
          } else {
            console.log('❌ Existing calendar is no longer valid, will recreate');
            // Fall through to create a new calendar
          }
        } catch (error) {
          console.log('❌ Error validating existing calendar, will recreate:', error);
          // Fall through to create a new calendar
        }
      }

      // Step 2: Load available calendars and check for HabitLoop Calendar
      const response = await apiRequest('google-calendar/calendars', 'GET');
      if (response.ok) {
        const data = await response.json();
        const habitLoopCalendar = data.calendars?.find((cal: any) => 
          cal.name?.includes('HabitLoop') || cal.name?.includes('Habit Loop')
        );

        if (habitLoopCalendar) {
          // HabitLoop Calendar exists - use it as default
          console.log('✅ Found existing HabitLoop Calendar:', habitLoopCalendar.id);
          setSettings(prev => ({ ...prev, calendarId: habitLoopCalendar.id }));
          
          // Update available calendars with the found calendar
          const defaultCalendars = [
            { id: 'primary', name: 'Primary Calendar', primary: true },
            { ...habitLoopCalendar, name: 'HabitLoop Calendar (Recommended)' }
          ];
          setAvailableCalendars(defaultCalendars);
          
          toast({
            title: "HabitLoop Calendar Found",
            description: "Using your existing HabitLoop Calendar for habit tracking",
            variant: "default",
          });
        } else {
          // HabitLoop Calendar doesn't exist - create it
          console.log('🔨 HabitLoop Calendar not found, creating new one...');
          await handleCreateHabitLoopCalendar();
        }
      } else {
        // API failed, fallback to creating calendar
        console.log('🔨 API failed, creating new HabitLoop Calendar...');
        await handleCreateHabitLoopCalendar();
      }

      // Step 3: Validate current calendar sync status
      await validateCalendarSync();

    } catch (error) {
      console.error('Error initializing smart calendar:', error);
      // Fallback to primary calendar
      setSettings(prev => ({ ...prev, calendarId: 'primary' }));
      toast({
        title: "Calendar Initialization",
        description: "Using Primary Calendar as fallback",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncHabits = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus(null);
      
      // Check if calendar integration is enabled before syncing
      if (!settings.enabled) {
        toast({
          title: "Calendar Integration Disabled",
          description: "Please enable 'Enable Calendar Integration' toggle first.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('🔍 Sending sync request to backend...');
      const response = await apiRequest('google-calendar/sync-habits', 'POST');
      const data = await response.json();
      console.log('🔍 Sync response from backend:', data);
      
      setSyncStatus({
        habitsCount: data.habitsCount || 0,
        syncedCount: data.syncedCount || 0,
        skippedCount: data.skippedCount || 0,
        message: data.message || 'Sync completed'
      });
      
      // Record sync time to prevent unnecessary validation
      localStorage.setItem('habitloop_last_sync', Date.now().toString());
      console.log('✅ Sync completed, recorded timestamp');
      
      // Refresh habits preview
      await loadHabitsPreview();
      
      toast({
        title: "Sync Complete",
        description: data.message || "Habits have been synced with Google Calendar."
      });
    } catch (error: any) {
      console.error('Failed to sync habits:', error);
      
      let errorMessage = "Failed to sync habits with Google Calendar. Please try again.";
      
      // Check for specific error messages
      if (error.message?.includes('Calendar integration not enabled')) {
        errorMessage = "Please enable 'Enable Calendar Integration' toggle first.";
      } else if (error.message?.includes('Calendar integration not enabled')) {
        errorMessage = "Please connect to Google Calendar first.";
      }
      
      toast({
        title: "Sync Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <div className="flex items-center space-x-2">
            <span>Google Calendar Integration</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 h-8 w-8"
          >
            {isCollapsed ? (
              <Settings className="h-4 w-4" />
            ) : (
              <Settings className="h-4 w-4 rotate-180" />
            )}
          </Button>
        </CardTitle>
        
        {/* Status hint when collapsed */}
        {isCollapsed && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {isConnected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">Connected</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-500">Sync enabled</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-600 font-medium">Not connected</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-500">Click to setup</span>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {isMobile ? 'Tap to expand' : 'Click to expand'}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {isConnected 
                ? (isMobile ? 'Manage sync settings and preferences' : 'Manage sync settings, calendar selection, and event preferences')
                : (isMobile ? 'Connect Google Calendar to sync habits' : 'Connect your Google Calendar to sync habits and track progress')
              }
            </div>
          </div>
        )}
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            )}
        <div>
              <p className="font-medium">
                {isConnected ? "Connected to Google Calendar" : "Not Connected"}
              </p>
              <p className="text-sm text-gray-600">
                {isConnected 
                  ? "Your habits will sync with your calendar" 
                  : "Connect to sync habits with Google Calendar"
                }
              </p>
            </div>
          </div>
          <Button
            onClick={isConnected ? handleDisconnect : handleConnect}
            disabled={isLoading || isRefreshingToken}
            variant={isConnected ? "outline" : "default"}
          >
            {isLoading ? "Loading..." : 
             isRefreshingToken ? "Refreshing..." : 
             isConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>

        {/* Settings */}
        {isConnected && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Calendar Settings</span>
            </h3>

            {/* Enable Integration */}
                <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-calendar">Enable Calendar Integration</Label>
                <p className="text-sm text-gray-600">
                  Sync your habits with Google Calendar
                </p>
              </div>
              <Switch
                id="enable-calendar"
                checked={settings.enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            {/* Calendar Selection */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="calendar-id">Choose Your Calendar</Label>
                <p className="text-sm text-gray-600">
                  HabitLoop automatically selects the best calendar for your habits. We recommend the dedicated HabitLoop Calendar for optimal organization.
                </p>
                
                {/* Smart Calendar Status */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-800">Smart Calendar Selection</span>
                </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {availableCalendars.find(cal => cal.name?.includes('HabitLoop')) 
                      ? "✅ Using HabitLoop Calendar" 
                      : "🔨 Will create HabitLoop Calendar if needed"
                    }
                  </p>
                </div>
          </div>
          
              <Select
                value={settings.calendarId}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, calendarId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select calendar" />
                </SelectTrigger>
                <SelectContent>
                  {/* HabitLoop Calendar (Recommended) */}
                  {availableCalendars.find(cal => cal.name?.includes('HabitLoop')) && (
                    <SelectItem value={availableCalendars.find(cal => cal.name?.includes('HabitLoop'))?.id || 'habits'}>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-calendar-check text-blue-600"></i>
                        <span className="font-medium">HabitLoop Calendar (Recommended)</span>
            </div>
                    </SelectItem>
                  )}
                  
                  {/* Primary Calendar */}
                  <SelectItem value="primary">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-star text-yellow-500"></i>
                      <span>Primary Calendar</span>
                    </div>
                  </SelectItem>
                  
                  {/* Personal Calendars (only if permission given) */}
                  {showPersonalCalendars && availableCalendars
                    .filter(cal => !cal.name?.includes('HabitLoop') && !cal.primary)
                    .map((calendar) => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-calendar text-gray-500"></i>
                          <span>{calendar.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              {/* Personal Calendars Permission */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="show-personal-calendars" 
                    checked={showPersonalCalendars} 
                    onChange={(e) => setShowPersonalCalendars(e.target.checked)} 
                    className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-purple-300 rounded" 
                  />
                  <div className="flex-1">
                    <label htmlFor="show-personal-calendars" className="text-sm font-medium text-purple-900 cursor-pointer flex items-center gap-2">
                      <i className="fas fa-shield-alt text-purple-600"></i>
                      Show my personal calendars
                    </label>
                    <p className="text-xs text-purple-700 mt-1">
                      <strong>Privacy-First Approach:</strong> HabitLoop only reads calendar names for selection.
                      <br />
                      <span className="font-medium">We never access your events, data, or personal information.</span>
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-purple-600">
                      <i className="fas fa-lock"></i>
                      <span>Your data stays private and secure</span>
                    </div>
                  </div>
                </div>
                    </div>
                    
              {/* Create HabitLoop Calendar Button */}
              {!availableCalendars.find(cal => cal.name?.includes('HabitLoop')) && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-plus-circle text-green-600"></i>
                    <div>
                      <p className="text-sm font-medium text-green-900">Create HabitLoop Calendar</p>
                      <p className="text-xs text-green-700">Get a dedicated calendar for your habits</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCreateHabitLoopCalendar}
                    disabled={isLoading}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    {isLoading ? "Creating..." : "Create"}
                  </Button>
                </div>
              )}

              {/* Privacy Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <i className="fas fa-shield-alt text-blue-600 mt-0.5"></i>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Privacy & Data Protection</p>
                    <p className="text-blue-700 mt-1">
                      <strong>Maximum Privacy:</strong> By default, we only show HabitLoop Calendar and Primary Calendar. 
                      Personal calendars are only loaded if you explicitly give permission. We never access, read, or modify your existing calendar data. 
                      All habit events are clearly marked and can be easily identified or removed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reminder Time */}
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Default Reminder Time</Label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <Input
                  id="reminder-time"
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, reminderTime: e.target.value }))
                  }
                  className="w-32"
                />
              </div>
            </div>
            
            {/* Event Duration */}
            <div className="space-y-2">
              <Label htmlFor="event-duration">Event Duration (minutes)</Label>
              <Input
                id="event-duration"
                type="number"
                min="5"
                max="240"
                value={settings.eventDuration}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, eventDuration: parseInt(e.target.value) || 30 }))
                }
                className="w-32"
              />
            </div>

            {/* Create Events */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="create-events">Create Calendar Events</Label>
                <p className="text-sm text-gray-600">
                  Automatically create events for habit reminders
                </p>
              </div>
              <Switch
                id="create-events"
                checked={settings.createEvents}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, createEvents: checked }))
                }
              />
            </div>
            
            {/* Sync Completions */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sync-completions">Sync Completions</Label>
                <p className="text-sm text-gray-600">
                  Mark calendar events as completed when habits are done
                </p>
              </div>
              <Switch
                id="sync-completions"
                checked={settings.syncCompletions}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, syncCompletions: checked }))
                }
              />
            </div>
            
            {/* Habits Preview */}
            {habitsPreview && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center space-x-2">
                    <Info className="h-4 w-4" />
                    <span>Habits Preview</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {habitsPreview.withReminders.length + habitsPreview.withoutReminders.length} total
                    </span>
                  </h4>
                  <div className="flex space-x-2">
                    {/* Primary Action - Always visible */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={loadHabitsPreview}
                      disabled={isLoading}
                      className="h-8 px-3 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh Preview
                    </Button>
                    
                    {/* More Options Dropdown - Technical tools - Only for super admin */}
                    {isSuperAdmin && (
                    <div className="relative technical-options-dropdown">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        className="h-8 px-3 text-xs"
                        onClick={() => setShowTechnicalOptions(!showTechnicalOptions)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        More Options
                        <i className={`fas fa-chevron-${showTechnicalOptions ? 'up' : 'down'} ml-1 text-xs`}></i>
                      </Button>
                      
                      {/* Technical Options Dropdown */}
                      {showTechnicalOptions && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                validateCalendarSync();
                                setShowTechnicalOptions(false);
                              }}
                              disabled={isLoading}
                              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Check Sync Status
                            </button>
                            <button
                              onClick={() => {
                                debugCalendarEvents();
                                setShowTechnicalOptions(false);
                              }}
                              disabled={isLoading}
                              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Settings className="h-3 w-3" />
                              Debug Events
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => {
                                resetCalendarSettings();
                                setShowTechnicalOptions(false);
                              }}
                              disabled={isLoading}
                              className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Reset Settings
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                </div>
                
                {/* Habits with reminders */}
                {habitsPreview.withReminders.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-green-800">
                          {habitsPreview.withReminders.length} habits will be synced
                        </span>
                        <p className="text-xs text-green-600">Using individual reminder times</p>
                      </div>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-green-100">
                      {habitsPreview.withReminders.map((habit) => (
                        <div key={habit.id} className="bg-white/60 p-3 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-green-700 font-medium truncate flex-1">{habit.title}</span>
                            <span className="text-green-600 font-mono text-xs bg-green-100 px-2 py-1 rounded">
                              {habit.reminderTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full font-medium",
                              habit.recurrencePattern === 'daily' && "bg-blue-100 text-blue-700",
                              habit.recurrencePattern === 'weekly' && "bg-green-100 text-green-700",
                              habit.recurrencePattern === 'monthly' && "bg-purple-100 text-purple-700"
                            )}>
                              <i className={cn(
                                "fas mr-1",
                                habit.recurrencePattern === 'daily' && "fa-calendar-day",
                                habit.recurrencePattern === 'weekly' && "fa-calendar-week",
                                habit.recurrencePattern === 'monthly' && "fa-calendar-alt"
                              )}></i>
                              {formatRecurrencePattern(habit)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {habit.source === 'habit' ? 'Individual time' : 'Default time'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Habits without individual reminders (using default) */}
                {habitsPreview.withoutReminders.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Info className="h-5 w-5 text-white" />
                      </div>
              <div>
                        <span className="text-sm font-semibold text-blue-800">
                          {habitsPreview.withoutReminders.length} habits will use default time
                        </span>
                        <p className="text-xs text-blue-600">Using calendar default reminder time</p>
                      </div>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
                      {habitsPreview.withoutReminders.map((habit) => (
                        <div key={habit.id} className="bg-white/60 p-3 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700 font-medium truncate flex-1">{habit.title}</span>
                            <span className="text-blue-600 font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                              {habit.reminderTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full font-medium",
                              habit.recurrencePattern === 'daily' && "bg-blue-100 text-blue-700",
                              habit.recurrencePattern === 'weekly' && "bg-green-100 text-green-700",
                              habit.recurrencePattern === 'monthly' && "bg-purple-100 text-purple-700"
                            )}>
                              <i className={cn(
                                "fas mr-1",
                                habit.recurrencePattern === 'daily' && "fa-calendar-day",
                                habit.recurrencePattern === 'weekly' && "fa-calendar-week",
                                habit.recurrencePattern === 'monthly' && "fa-calendar-alt"
                              )}></i>
                              {formatRecurrencePattern(habit)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {habit.source === 'habit' ? 'Individual time' : 'Default time'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-blue-700 bg-blue-100/50 p-2 rounded-lg">
                      💡 <strong>Pro Tip:</strong> Set individual reminder times for better habit scheduling! 
                      <button 
                        onClick={() => window.location.href = '/habits'}
                        className="ml-1 text-blue-800 underline hover:text-blue-900 font-medium"
                      >
                        Edit habits →
                      </button>
                    </div>
                  </div>
                )}
                
                {/* No habits */}
                {habitsPreview.withReminders.length === 0 && habitsPreview.withoutReminders.length === 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200 text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="h-6 w-6 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">No habits found. Create some habits to sync with your calendar.</p>
                    <button 
                      onClick={() => window.location.href = '/habits'}
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Create your first habit
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sync Status */}
            {syncStatus && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Sync Results</span>
                </div>
                <p className="text-sm text-blue-700">{syncStatus.message}</p>
                <div className="mt-2 text-xs text-blue-600">
                  Total: {syncStatus.habitsCount} | Synced: {syncStatus.syncedCount} | Skipped: {syncStatus.skippedCount}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={handleSyncHabits} 
                variant="outline" 
                disabled={isLoading || isSyncing || !settings.enabled}
              >
                {isSyncing ? "Syncing..." : "Sync Habits Now"}
              </Button>
              {!settings.enabled && (
                <div className="flex items-center text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Enable Calendar Integration first
                </div>
              )}
            </div>
          </div>
        )}

        {/* Features Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Calendar Integration Features</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Create calendar events for habit reminders</li>
            <li>• Block time for habit activities</li>
            <li>• Sync habit completions with calendar</li>
            <li>• Get notifications through your calendar app</li>
            <li>• View habit schedule alongside other events</li>
          </ul>
        </div>
        </CardContent>
      )}
    </Card>
  );
}

