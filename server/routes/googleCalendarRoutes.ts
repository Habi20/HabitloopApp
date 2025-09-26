import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth } from "./middlewareRoutes";
import { typedEnv } from "../env";
import { google } from "googleapis";

export function googleCalendarRoutes() {
  const router = Router();

  // Google Calendar OAuth2 configuration
  // Use development redirect URI for localhost, production for deployed
  const redirectUri = process.env.NODE_ENV === 'production' 
    ? (typedEnv.GOOGLE_REDIRECT_URI_PROD || "https://techversehublk.site/callback")
    : (typedEnv.GOOGLE_REDIRECT_URI || "http://localhost:5173/auth/google/callback");
  
  // Debug: Log environment variables
  console.log('🔍 Google Calendar Config Debug:');
  console.log('GOOGLE_CLIENT_ID:', typedEnv.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING');
  console.log('GOOGLE_CLIENT_SECRET:', typedEnv.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING');
  console.log('Redirect URI:', redirectUri);
  
  const oauth2Client = new google.auth.OAuth2(
    typedEnv.GOOGLE_CLIENT_ID,
    typedEnv.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  // Test endpoint to check configuration (no auth required for debugging)
  router.get('/test-config', async (_req: any, res) => {
    res.json({
      clientId: typedEnv.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
      clientSecret: typedEnv.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
      redirectUri: redirectUri,
      hasClientId: !!typedEnv.GOOGLE_CLIENT_ID,
      hasClientSecret: !!typedEnv.GOOGLE_CLIENT_SECRET
    });
  });

  // Generate OAuth2 URL
  router.get('/auth-url', requireAuth, async (req: any, res) => {
    try {
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ];

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // Force consent screen to get refresh token
        scope: scopes,
        state: req.user.id // Include user ID in state
      });

      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating auth URL:', error);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  });

  // Handle OAuth2 callback
  router.get('/callback', async (req: any, res) => {
    try {
      const { code, state } = req.query;
      
      console.log('🔍 OAuth callback received:', { code: !!code, state, query: req.query });
      
      if (!code || !state) {
        console.error('❌ Missing authorization code or state:', { code: !!code, state });
        return res.status(400).json({ error: 'Missing authorization code or state' });
      }

      console.log('🔄 Exchanging code for tokens...');
      const { tokens } = await oauth2Client.getToken(code);
      console.log('✅ Tokens received:', { 
        hasAccessToken: !!tokens.access_token, 
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date 
      });
      
      oauth2Client.setCredentials(tokens);

      // Store tokens in user settings using state as userId
      const userId = state;
      console.log('💾 Saving tokens for user:', userId);
      
      const userSettings = await storage.getUserSettings(userId);
      console.log('🔍 Current user settings:', { 
        hasUserSettings: !!userSettings,
        hasGoogleCalendar: !!userSettings?.googleCalendar,
        userSettingsKeys: userSettings ? Object.keys(userSettings) : 'null',
        fullUserSettings: userSettings
      });
      
      // Preserve existing refresh token if new one is not provided
      const existingRefreshToken = userSettings?.googleCalendar?.refreshToken;
      const refreshToken = tokens.refresh_token || existingRefreshToken;
      
      if (!tokens.refresh_token && !existingRefreshToken) {
        console.warn('⚠️ No refresh token provided - calendar will disconnect when access token expires');
      }
      
      const updatedSettings = {
        ...userSettings,
        googleCalendar: {
          accessToken: tokens.access_token,
          refreshToken: refreshToken,
          expiryDate: tokens.expiry_date,
          scope: tokens.scope
        }
      };

      console.log('🔍 OAuth callback - saving settings:', {
        hasExistingSettings: !!userSettings,
        existingKeys: userSettings ? Object.keys(userSettings) : 'null',
        newGoogleCalendar: !!updatedSettings.googleCalendar,
        updatedSettingsKeys: Object.keys(updatedSettings)
      });

      console.log('💾 Saving updated settings...');
      await storage.saveUserSettings(userId, updatedSettings);
      console.log('✅ Settings saved successfully');

      // Redirect to frontend with success message
      console.log('🔄 Redirecting to frontend...');
      res.redirect(`${typedEnv.frontendUrl}/settings?calendar=connected`);
    } catch (error) {
      console.error('❌ Error handling OAuth callback:', error);
      res.status(500).json({ error: 'Failed to connect calendar' });
    }
  });

  // Helper function to refresh access token
  const refreshAccessToken = async (refreshToken: string) => {
    try {
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      
      const { credentials } = await oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  };

  // Helper function to get valid calendar client with auto-refresh
  const getValidCalendarClient = async (userId: string) => {
    const userSettings = await storage.getUserSettings(userId);
    const googleCalendar = userSettings?.googleCalendar;

    if (!googleCalendar?.accessToken) {
      throw new Error('No valid Google Calendar credentials found');
    }

    // Set credentials - use refresh token if available
    const credentials: any = {
      access_token: googleCalendar.accessToken
    };
    
    if (googleCalendar.refreshToken) {
      credentials.refresh_token = googleCalendar.refreshToken;
    }
    
    oauth2Client.setCredentials(credentials);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      // Test the token by making a simple API call
      await calendar.calendarList.list();
      return { calendar, credentials: googleCalendar };
    } catch (error: any) {
      // If token is invalid/expired, try to refresh it (only if refresh token exists)
      if ((error.status === 401 || error.code === 401) && googleCalendar.refreshToken) {
        console.log('🔄 Access token expired, attempting to refresh...');
        
        try {
          const newCredentials = await refreshAccessToken(googleCalendar.refreshToken);
          
          // Update stored credentials
          const updatedCalendarSettings = {
            ...googleCalendar,
            accessToken: newCredentials.access_token,
            expiryDate: newCredentials.expiry_date
          };
          
          const updatedUserSettings = {
            ...userSettings,
            googleCalendar: updatedCalendarSettings
          };
          
          await storage.saveUserSettings(userId, updatedUserSettings);
          
          // Set new credentials and return updated client
          oauth2Client.setCredentials(newCredentials);
          const refreshedCalendar = google.calendar({ version: 'v3', auth: oauth2Client });
          
          return { calendar: refreshedCalendar, credentials: updatedCalendarSettings };
        } catch (refreshError) {
          console.error('❌ Failed to refresh access token:', refreshError);
          throw new Error('Access token expired and refresh failed. Please reconnect your calendar.');
        }
      } else if (error.status === 401 || error.code === 401) {
        console.error('❌ Access token expired and no refresh token available');
        throw new Error('Access token expired. Please reconnect your calendar.');
      } else {
        throw error;
      }
    }
  };

  // Get available calendars
  router.get('/calendars', requireAuth, async (req: any, res) => {
    try {
      const { calendar } = await getValidCalendarClient(req.user.id);
      
      // Get list of calendars
      const calendarList = await calendar.calendarList.list();
      const calendars = calendarList.data.items?.map(cal => ({
        id: cal.id,
        name: cal.summary || cal.id,
        primary: cal.primary || false
      })) || [];
      
      res.json({ calendars });
    } catch (error) {
      console.error('Error getting calendars:', error);
      res.status(500).json({ error: 'Failed to get calendars' });
    }
  });

  // Create HabitLoop Calendar
  router.post('/create-habitloop-calendar', requireAuth, async (req: any, res) => {
    try {
      const { calendar } = await getValidCalendarClient(req.user.id);
      
      // Check if HabitLoop Calendar already exists
      const calendarList = await calendar.calendarList.list();
      const existingHabitLoopCalendar = calendarList.data.items?.find(cal => 
        cal.summary?.includes('HabitLoop') || cal.summary?.includes('Habit Loop')
      );
      
      if (existingHabitLoopCalendar) {
        console.log(`✅ Found existing HabitLoop Calendar: ${existingHabitLoopCalendar.id}`);
        return res.json({ 
          calendarId: existingHabitLoopCalendar.id,
          message: 'HabitLoop Calendar already exists'
        });
      }
      
      // Create new HabitLoop Calendar
      const newCalendar = await calendar.calendars.insert({
        requestBody: {
          summary: 'HabitLoop Calendar',
          description: 'Dedicated calendar for your habit tracking and reminders',
          timeZone: 'UTC'
        }
      });
      
      // Update user settings with the new calendar ID
      const userSettings = await storage.getUserSettings(req.user.id);
      const updatedSettings = {
        ...userSettings,
        calendarSettings: {
          ...userSettings?.calendarSettings,
          calendarId: newCalendar.data.id
        }
      };
      
      await storage.saveUserSettings(req.user.id, updatedSettings);
      
      res.json({ 
        calendarId: newCalendar.data.id,
        message: 'HabitLoop Calendar created successfully'
      });
    } catch (error) {
      console.error('Error creating HabitLoop Calendar:', error);
      res.status(500).json({ error: 'Failed to create HabitLoop Calendar' });
    }
  });

  // Validate calendar sync consistency
  router.get('/validate-sync', requireAuth, async (req: any, res) => {
    try {
      const userSettings = await storage.getUserSettings(req.user.id);
      const calendarSettings = userSettings?.calendarSettings;
      
      // Check if user has Google Calendar connected
      if (!userSettings?.googleCalendar?.accessToken) {
        return res.status(400).json({ 
          error: 'Google Calendar not connected',
          needsReconnect: true 
        });
      }
      
      const { calendar } = await getValidCalendarClient(req.user.id);
      const habits = await storage.getUserHabits(req.user.id);
      
      console.log('🔍 Validate-sync debug:', {
        userId: req.user.id,
        hasUserSettings: !!userSettings,
        hasCalendarSettings: !!calendarSettings,
        calendarId: calendarSettings?.calendarId,
        userSettingsKeys: userSettings ? Object.keys(userSettings) : 'null',
        fullUserSettings: userSettings
      });
      
      // Get existing calendar events
      const calendarId = calendarSettings?.calendarId || 'primary';
      console.log('🔍 Using calendarId:', calendarId);
      
      const eventsResponse = await calendar.events.list({
        calendarId: calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 100,
        singleEvents: false
        // Removed orderBy: 'startTime' as it's not compatible with singleEvents: false
      });
      const existingEvents = eventsResponse.data.items || [];
      
      // Validate each habit against its calendar event
      const validationResults = habits.map(habit => {
        const expectedSummary = `Habit: ${habit.title}`;
        const habitEvent = existingEvents.find(event => event.summary === expectedSummary);
        
        console.log(`🔍 Validating habit ${habit.id} (${habit.title}):`, {
          expectedSummary,
          foundEvent: !!habitEvent,
          eventId: habitEvent?.id,
          eventSummary: habitEvent?.summary
        });
        
        if (!habitEvent) {
          return {
            habitId: habit.id,
            title: habit.title,
            status: 'missing',
            message: 'No calendar event found'
          };
        }
        
        // Validate time (more flexible comparison)
        const expectedTime = habit.reminderTime || calendarSettings?.reminderTime;
        const actualTime = habitEvent.start?.dateTime?.split('T')[1]?.substring(0, 5);
        
        // More flexible time matching - allow for timezone differences
        const timeMatches = actualTime === expectedTime || 
          (expectedTime && actualTime && Math.abs(
            new Date(`2000-01-01T${actualTime}:00`).getTime() - 
            new Date(`2000-01-01T${expectedTime}:00`).getTime()
          ) < 60000); // Allow 1 minute difference
        
        // Validate recurrence pattern (more flexible)
        const expectedRecurrence = generateRecurrenceRule(habit);
        const actualRecurrence = habitEvent.recurrence?.[0];
        
        // For daily habits, both should be daily or no recurrence
        const recurrenceMatches = (() => {
          if (!habit.recurrencePattern || habit.recurrencePattern === 'daily') {
            return !actualRecurrence || actualRecurrence.includes('FREQ=DAILY');
          }
          return actualRecurrence === expectedRecurrence;
        })();
        
        const isValid = timeMatches && recurrenceMatches;
        
        console.log(`📊 Validation result for habit ${habit.id}:`, {
          timeMatch: timeMatches,
          recurrenceMatch: recurrenceMatches,
          expectedTime,
          actualTime,
          expectedRecurrence,
          actualRecurrence,
          isValid
        });
        
        return {
          habitId: habit.id,
          title: habit.title,
          status: isValid ? 'valid' : 'inconsistent',
          message: isValid ? 'Calendar event matches habit' : 'Calendar event needs update',
          details: {
            timeMatch: timeMatches,
            recurrenceMatch: recurrenceMatches,
            expectedTime,
            actualTime,
            expectedRecurrence,
            actualRecurrence
          }
        };
      });
      
      const validCount = validationResults.filter(r => r.status === 'valid').length;
      const inconsistentCount = validationResults.filter(r => r.status === 'inconsistent').length;
      const missingCount = validationResults.filter(r => r.status === 'missing').length;
      
      res.json({
        validationResults,
        summary: {
          total: habits.length,
          valid: validCount,
          inconsistent: inconsistentCount,
          missing: missingCount
        },
        needsSync: inconsistentCount > 0 || missingCount > 0
      });
    } catch (error: any) {
      console.error('Error validating calendar sync:', error);
      
      // Handle specific error types
      if (error.message?.includes('not connected') || error.message?.includes('expired')) {
        return res.status(400).json({ 
          error: error.message,
          needsReconnect: true 
        });
      }
      
      // Handle Google API errors
      if (error.status === 401 || error.code === 401) {
        return res.status(400).json({ 
          error: 'Google Calendar access expired. Please reconnect.',
          needsReconnect: true 
        });
      }
      
      res.status(500).json({ error: 'Failed to validate calendar sync' });
    }
  });

  // Debug endpoint to check calendar events
  router.get('/debug-events', requireAuth, async (req: any, res) => {
    try {
      const { calendar } = await getValidCalendarClient(req.user.id);
      const userSettings = await storage.getUserSettings(req.user.id);
      const calendarSettings = userSettings?.calendarSettings;
      
      // Get events from the past week to future month
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      
      const eventsResponse = await calendar.events.list({
        calendarId: calendarSettings?.calendarId,
        timeMin: oneWeekAgo.toISOString(),
        timeMax: oneMonthFromNow.toISOString(),
        maxResults: 50,
        singleEvents: true, // Expand recurring events
        orderBy: 'startTime'
      });
      
      const events = eventsResponse.data.items || [];
      const habitEvents = events.filter(event => event.summary?.startsWith('Habit:'));
      
      res.json({
        calendarId: calendarSettings?.calendarId,
        totalEvents: events.length,
        habitEvents: habitEvents.length,
        events: habitEvents.map(event => ({
          id: event.id,
          summary: event.summary,
          start: event.start,
          end: event.end,
          recurrence: event.recurrence,
          created: event.created,
          updated: event.updated
        })),
        allEvents: events.map(event => ({
          summary: event.summary,
          start: event.start?.dateTime || event.start?.date,
          isHabit: event.summary?.startsWith('Habit:')
        }))
      });
    } catch (error) {
      console.error('Error debugging calendar events:', error);
      res.status(500).json({ error: 'Failed to debug calendar events' });
    }
  });

  // Test endpoint to debug habit sync issues
  router.get('/debug-habits', requireAuth, async (req: any, res) => {
    try {
      const habits = await storage.getUserHabits(req.user.id);
      const userSettings = await storage.getUserSettings(req.user.id);
      const calendarSettings = userSettings?.calendarSettings;
      
      const debugInfo = habits.map(habit => ({
        id: habit.id,
        title: habit.title,
        reminderTime: habit.reminderTime,
        recurrencePattern: habit.recurrencePattern,
        selectedDays: habit.selectedDays,
        defaultReminderTime: calendarSettings?.reminderTime,
        finalReminderTime: habit.reminderTime || calendarSettings?.reminderTime,
        isValidTime: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(habit.reminderTime || calendarSettings?.reminderTime || ''),
        willSkip: !(habit.reminderTime || calendarSettings?.reminderTime) || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(habit.reminderTime || calendarSettings?.reminderTime || '')
      }));
      
      res.json({
        habits: debugInfo,
        calendarSettings: calendarSettings,
        totalHabits: habits.length,
        willSync: debugInfo.filter(h => !h.willSkip).length,
        willSkip: debugInfo.filter(h => h.willSkip).length
      });
    } catch (error) {
      console.error('Error debugging habits:', error);
      res.status(500).json({ error: 'Failed to debug habits' });
    }
  });

  // Debug endpoint to check user settings
  router.get('/debug-settings', requireAuth, async (req: any, res) => {
    try {
      const userSettings = await storage.getUserSettings(req.user.id);
      console.log('🔍 Debug - User settings for', req.user.id, ':', JSON.stringify(userSettings, null, 2));
      
      res.json({
        userId: req.user.id,
        hasUserSettings: !!userSettings,
        hasGoogleCalendar: !!userSettings?.googleCalendar,
        hasAccessToken: !!userSettings?.googleCalendar?.accessToken,
        hasRefreshToken: !!userSettings?.googleCalendar?.refreshToken,
        userSettings: userSettings
      });
    } catch (error) {
      console.error('Error getting debug settings:', error);
      res.status(500).json({ error: 'Failed to get debug settings' });
    }
  });

  // Check connection status with automatic token refresh
  router.get('/status', requireAuth, async (req: any, res) => {
    try {
      const userSettings = await storage.getUserSettings(req.user.id);
      const googleCalendar = userSettings?.googleCalendar;

      // Check if credentials exist
      if (!googleCalendar?.accessToken || !googleCalendar?.refreshToken) {
        console.log('No Google Calendar credentials found for user:', req.user.id);
        return res.json({ connected: false });
      }

      // Check if token is expired
      const now = Date.now();
      const expiryDate = googleCalendar.expiryDate || 0;
      
      if (now >= expiryDate) {
        console.log('Google Calendar token expired for user:', req.user.id);
        // Try to refresh token
        try {
          await refreshAccessToken(googleCalendar.refreshToken);
          console.log('✅ Token refreshed successfully');
        } catch (refreshError) {
          console.error('❌ Failed to refresh token:', refreshError);
          return res.json({ connected: false });
        }
      }

      // Try to get valid calendar client (but don't fail if it doesn't work)
      try {
        await getValidCalendarClient(req.user.id);
      } catch (clientError) {
        console.log('Calendar client validation failed (non-critical):', clientError);
        // Still return connected: true if we have valid credentials
      }
      
      res.json({ 
        connected: true,
        settings: userSettings?.calendarSettings || {},
        calendarId: userSettings?.calendarSettings?.calendarId || 'habits'
      });
    } catch (error) {
      console.error('Error checking calendar status:', error);
      res.json({ connected: false });
    }
  });

  // Save calendar settings
  router.post('/settings', requireAuth, async (req: any, res) => {
    try {
      const settingsSchema = z.object({
        enabled: z.boolean(),
        calendarId: z.string(),
        reminderTime: z.string(),
        eventDuration: z.number(),
        createEvents: z.boolean(),
        syncCompletions: z.boolean()
      });

      const settings = settingsSchema.parse(req.body);
      
      const userSettings = await storage.getUserSettings(req.user.id);
      const updatedSettings = {
        ...userSettings,
        calendarSettings: settings
      };

      console.log('🔍 Saving calendar settings:', {
        userId: req.user.id,
        hasExistingSettings: !!userSettings,
        hasGoogleCalendar: !!userSettings?.googleCalendar,
        newCalendarSettings: settings,
        updatedSettingsKeys: Object.keys(updatedSettings)
      });

      await storage.saveUserSettings(req.user.id, updatedSettings);

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving calendar settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // Helper function to calculate start date/time based on recurrence pattern
  const calculateStartDateTime = (habit: any, reminderTime: string): string => {
    const today = new Date();
    const timeString = `${today.toISOString().split('T')[0]}T${reminderTime}:00`;
    
    // For daily habits, use today
    if (!habit.recurrencePattern || habit.recurrencePattern === 'daily') {
      return timeString;
    }
    
    // For weekly habits, find next occurrence
    if (habit.recurrencePattern === 'weekly' && habit.selectedDays && habit.selectedDays.length > 0) {
      const googleDays = habit.selectedDays.map((day: number) => day === 7 ? 0 : day); // Convert 1-7 (Mon-Sun) to 0-6 (Sun-Sat)
      
      // Find next occurrence
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const checkDayOfWeek = checkDate.getDay();
        
        if (googleDays.includes(checkDayOfWeek)) {
          return `${checkDate.toISOString().split('T')[0]}T${reminderTime}:00`;
        }
      }
    }
    
    // For monthly habits, find next occurrence
    if (habit.recurrencePattern === 'monthly' && habit.selectedDays && habit.selectedDays.length > 0) {
      const dayOfMonth = today.getDate();
      const sortedDays = [...habit.selectedDays].sort((a, b) => a - b);
      
      // Find next occurrence this month
      for (const day of sortedDays) {
        if (day >= dayOfMonth) {
          const nextDate = new Date(today);
          nextDate.setDate(day);
          return `${nextDate.toISOString().split('T')[0]}T${reminderTime}:00`;
        }
      }
      
      // If no more days this month, use first day next month
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      nextMonth.setDate(sortedDays[0]);
      return `${nextMonth.toISOString().split('T')[0]}T${reminderTime}:00`;
    }
    
    // Fallback to today
    return timeString;
  };

  // Helper function to detect what type of change occurred
  const detectChangeType = (existingEvent: any, newEvent: any, newRecurrenceRule: string | null): string => {
    const existingStartTime = existingEvent.start?.dateTime;
    const existingRecurrence = existingEvent.recurrence?.[0];
    const newStartTime = newEvent.start.dateTime;
    
    const timeChanged = existingStartTime !== newStartTime;
    const recurrenceChanged = existingRecurrence !== newRecurrenceRule;
    
    if (timeChanged && recurrenceChanged) {
      return 'Time + Pattern Change';
    } else if (timeChanged) {
      return 'Time Change';
    } else if (recurrenceChanged) {
      return 'Pattern Change';
    }
    return 'Unknown Change';
  };

  // Helper function to generate recurrence rule based on habit pattern
  const generateRecurrenceRule = (habit: any): string | null => {
    if (!habit.recurrencePattern || habit.recurrencePattern === 'daily') {
      return 'RRULE:FREQ=DAILY';
    }
    
    if (habit.recurrencePattern === 'weekly' && habit.selectedDays && habit.selectedDays.length > 0) {
      // Convert 1-7 (Mon-Sun) to Google Calendar day names (MO, TU, WE, etc.)
      const dayNames = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
      const googleDays = habit.selectedDays.map((day: number) => {
        const index = day === 7 ? 0 : day - 1; // Convert 1-7 to 0-6, with 7 (Sunday) = 0
        return dayNames[index];
      });
      const dayList = googleDays.join(',');
      return `RRULE:FREQ=WEEKLY;BYDAY=${dayList}`;
    }
    
    if (habit.recurrencePattern === 'monthly' && habit.selectedDays && habit.selectedDays.length > 0) {
      const dayList = habit.selectedDays.join(',');
      return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${dayList}`;
    }
    
    // Fallback to daily
    return 'RRULE:FREQ=DAILY';
  };

  // Sync habits with calendar
  router.post('/sync-habits', requireAuth, async (req: any, res) => {
    try {
      const userSettings = await storage.getUserSettings(req.user.id);
      const calendarSettings = userSettings?.calendarSettings;

      if (!calendarSettings?.enabled) {
        return res.status(400).json({ error: 'Calendar integration not enabled' });
      }

      // Get user's habits
      const habits = await storage.getUserHabits(req.user.id);
      
      // Check if user has any habits
      if (!habits || habits.length === 0) {
        return res.json({ 
          success: true, 
          message: 'No habits found to sync with calendar',
          habitsCount: 0
        });
      }
      
      // Get valid calendar client with auto-refresh
      const { calendar } = await getValidCalendarClient(req.user.id);

      let syncedCount = 0;
      let skippedCount = 0;

      // Get existing events to check for duplicates and updates
      let existingEvents: any[] = [];
      try {
        const eventsResponse = await calendar.events.list({
          calendarId: calendarSettings.calendarId,
          timeMin: new Date().toISOString(),
          maxResults: 100,
          singleEvents: false
          // Removed orderBy: 'startTime' as it's not compatible with singleEvents: false
        });
        existingEvents = eventsResponse.data.items || [];
        console.log(`🔍 Found ${existingEvents.length} existing events in calendar`);
      } catch (error) {
        console.log('⚠️ Could not fetch existing events, will create new ones');
      }

      // Clean up orphaned events (events without corresponding habits)
      const habitTitles = habits.map(habit => `Habit: ${habit.title}`);
      const orphanedEvents = existingEvents.filter(event => 
        event.summary?.startsWith('Habit:') && !habitTitles.includes(event.summary)
      );
      
      for (const orphanedEvent of orphanedEvents) {
        try {
          await calendar.events.delete({
            calendarId: calendarSettings.calendarId,
            eventId: orphanedEvent.id
          });
          console.log(`🗑️ Cleaned up orphaned event: ${orphanedEvent.summary}`);
        } catch (deleteError) {
          console.error(`❌ Failed to delete orphaned event ${orphanedEvent.id}:`, deleteError);
        }
      }

      // Create/update calendar events for each habit
      for (const habit of habits) {
        // Use habit's reminder time, or fall back to default reminder time
        const reminderTime = habit.reminderTime || calendarSettings.reminderTime;
        
        // Additional validation - ensure we have a valid time format
        const isValidTime = reminderTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime);
        
        console.log(`🔍 Habit ${habit.id} (${habit.title}):`, {
          habitReminderTime: habit.reminderTime,
          defaultReminderTime: calendarSettings.reminderTime,
          finalReminderTime: reminderTime,
          isValidTime: isValidTime,
          willSkip: !reminderTime || !isValidTime,
          recurrencePattern: habit.recurrencePattern,
          selectedDays: habit.selectedDays
        });
        
        if (!reminderTime || !isValidTime) {
          console.log(`⏭️ Skipping habit ${habit.id} (${habit.title}): ${!reminderTime ? 'No reminder time' : 'Invalid time format'}`);
          skippedCount++;
          continue;
        }

        // Calculate proper start and end times based on recurrence pattern
        const startDateTime = calculateStartDateTime(habit, reminderTime);
        const startDate = new Date(startDateTime);
        const endDate = new Date(startDate.getTime() + (calendarSettings.eventDuration * 60000));
        
        // Generate recurrence rule based on habit pattern
        const recurrenceRule = generateRecurrenceRule(habit);
        
        const event = {
          summary: `Habit: ${habit.title}`,
          description: habit.description || `Complete your habit: ${habit.title}`,
          start: {
            dateTime: startDateTime,
            timeZone: 'Asia/Colombo'
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: 'Asia/Colombo'
          },
          recurrence: recurrenceRule ? [recurrenceRule] : undefined,
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 10 },
              { method: 'email', minutes: 30 }
            ]
          }
        };

        // Smart event management - find all existing events for this habit
        const habitEvents = existingEvents.filter(existing => 
          existing.summary === event.summary
        );

        try {
          if (habitEvents.length > 0) {
            // Check if any existing event needs updating
            const eventToUpdate = habitEvents.find(existing => {
              const existingStartTime = existing.start?.dateTime;
              const existingRecurrence = existing.recurrence?.[0];
              const needsTimeUpdate = existingStartTime !== event.start.dateTime;
              const needsRecurrenceUpdate = existingRecurrence !== recurrenceRule;
              return needsTimeUpdate || needsRecurrenceUpdate;
            });

            if (eventToUpdate) {
              const changeType = detectChangeType(eventToUpdate, event, recurrenceRule);
              console.log(`🔄 Updating existing event for habit ${habit.id} (${changeType}):`, {
                oldTime: eventToUpdate.start?.dateTime,
                newTime: event.start.dateTime,
                oldRecurrence: eventToUpdate.recurrence?.[0],
                newRecurrence: recurrenceRule,
                eventId: eventToUpdate.id
              });
              
              await calendar.events.update({
                calendarId: calendarSettings.calendarId,
                eventId: eventToUpdate.id,
                requestBody: event
              });
              syncedCount++;
              console.log(`✅ Successfully updated event for habit ${habit.id}`);

              // Clean up any duplicate events for this habit
              const duplicateEvents = habitEvents.filter(existing => existing.id !== eventToUpdate.id);
              for (const duplicate of duplicateEvents) {
                try {
                  await calendar.events.delete({
                    calendarId: calendarSettings.calendarId,
                    eventId: duplicate.id
                  });
                  console.log(`🗑️ Cleaned up duplicate event for habit ${habit.id}: ${duplicate.id}`);
                } catch (deleteError) {
                  console.error(`❌ Failed to delete duplicate event ${duplicate.id}:`, deleteError);
                }
              }
            } else {
              console.log(`⏭️ Event for habit ${habit.id} already exists with correct time and pattern, skipping`);
              syncedCount++;
            }
          } else {
            // Create new event
            console.log(`🔍 Creating new calendar event for habit ${habit.id}:`, {
              summary: event.summary,
              start: event.start,
              end: event.end,
              calendarId: calendarSettings.calendarId
            });
            
            await calendar.events.insert({
              calendarId: calendarSettings.calendarId,
              requestBody: event
            });
            syncedCount++;
            console.log(`✅ Successfully created event for habit ${habit.id}`);
          }
        } catch (error: any) {
          // If calendar doesn't exist (404), try to find existing HabitLoop calendar or create one
          if (error.status === 404 && calendarSettings.calendarId === 'habits') {
            console.log(`🔄 Calendar 'habits' not found, looking for existing HabitLoop calendar...`);
            try {
              // First, try to find existing HabitLoop calendar
              const calendarList = await calendar.calendarList.list();
              const habitLoopCalendar = calendarList.data.items?.find(cal => 
                cal.summary === 'HabitLoop Calendar' || cal.summary?.includes('HabitLoop')
              );
              
              if (habitLoopCalendar) {
                console.log(`✅ Found existing HabitLoop calendar: ${habitLoopCalendar.id}`);
                
                // Update settings to use the existing calendar ID
                try {
                  const userSettings = await storage.getUserSettings(req.user.id);
                  const updatedSettings = {
                    ...userSettings,
                    calendarSettings: {
                      ...calendarSettings,
                      calendarId: habitLoopCalendar.id || 'primary'
                    }
                  };
                  await storage.saveUserSettings(req.user.id, updatedSettings);
                  console.log(`✅ Updated user settings with existing calendar ID`);
                } catch (settingsError: any) {
                  console.error(`⚠️ Failed to update settings, but continuing with calendar operation:`, settingsError.message);
                }
                
                // Retry creating the event in the existing calendar
                await calendar.events.insert({
                  calendarId: habitLoopCalendar.id || 'primary',
                  requestBody: event
                });
                console.log(`✅ Successfully created event for habit ${habit.id} in existing calendar`);
                syncedCount++;
              } else {
                // Create new HabitLoop calendar only if none exists
                console.log(`🔄 No existing HabitLoop calendar found, creating new one...`);
                const calendarResponse = await calendar.calendars.insert({
                  requestBody: {
                    summary: 'HabitLoop Calendar',
                    description: 'Calendar for HabitLoop habit reminders',
                    timeZone: 'Asia/Colombo'
                  }
                });
                
                console.log(`✅ Created new HabitLoop calendar: ${calendarResponse.data.id}`);
                
                // Update settings to use the new calendar ID
                try {
                  const userSettings = await storage.getUserSettings(req.user.id);
                  const updatedSettings = {
                    ...userSettings,
                    calendarSettings: {
                      ...calendarSettings,
                      calendarId: calendarResponse.data.id || 'primary'
                    }
                  };
                  await storage.saveUserSettings(req.user.id, updatedSettings);
                  console.log(`✅ Updated user settings with new calendar ID`);
                } catch (settingsError: any) {
                  console.error(`⚠️ Failed to update settings, but continuing with calendar operation:`, settingsError.message);
                }
                
                // Retry creating the event in the new calendar
                await calendar.events.insert({
                  calendarId: calendarResponse.data.id || 'primary',
                  requestBody: event
                });
                console.log(`✅ Successfully created event for habit ${habit.id} in new calendar`);
                syncedCount++;
              }
            } catch (createError: any) {
              console.error(`❌ Failed to create/find calendar, falling back to primary:`, createError.message);
              // Fallback to primary calendar
              try {
                await calendar.events.insert({
                  calendarId: 'primary',
                  requestBody: event
                });
                console.log(`✅ Successfully created event for habit ${habit.id} in primary calendar`);
                syncedCount++;
              } catch (fallbackError: any) {
                console.error(`❌ Failed to create/update event in primary calendar:`, fallbackError.message);
                skippedCount++;
              }
            }
          } else {
            console.error(`❌ Failed to create event for habit ${habit.id}:`, {
              error: error.message,
              status: error.status,
              errors: error.errors,
              eventData: event
            });
            skippedCount++;
          }
        }
      }

      res.json({ 
        success: true, 
        message: `Habits synced with calendar: ${syncedCount} synced, ${skippedCount} skipped`,
        habitsCount: habits.length,
        syncedCount,
        skippedCount
      });
    } catch (error) {
      console.error('Error syncing habits:', error);
      res.status(500).json({ error: 'Failed to sync habits' });
    }
  });

  // Create event for specific habit
  router.post('/create-event', requireAuth, async (req: any, res) => {
    try {
      const { habitId, date, time } = req.body;
      
      const habits = await storage.getUserHabits(req.user.id);
      const habit = habits.find(h => h.id === habitId);
      if (!habit) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      const userSettings = await storage.getUserSettings(req.user.id);
      const calendarSettings = userSettings?.calendarSettings;
      const googleCalendar = userSettings?.googleCalendar;

      if (!calendarSettings?.enabled || !googleCalendar?.accessToken) {
        return res.status(400).json({ error: 'Calendar integration not enabled' });
      }

      oauth2Client.setCredentials({
        access_token: googleCalendar.accessToken,
        refresh_token: googleCalendar.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const event = {
        summary: `Habit: ${habit.title}`,
        description: habit.description || `Complete your habit: ${habit.title}`,
        start: {
          dateTime: `${date}T${time}:00`,
          timeZone: 'Asia/Colombo'
        },
        end: {
          dateTime: new Date(new Date(`${date}T${time}:00`).getTime() + (calendarSettings.eventDuration * 60000)).toISOString(),
          timeZone: 'Asia/Colombo'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 },
            { method: 'email', minutes: 30 }
          ]
        }
      };

      const result = await calendar.events.insert({
        calendarId: calendarSettings.calendarId,
        requestBody: event
      });

      res.json({ success: true, eventId: result.data?.id });
    } catch (error) {
      console.error('Error creating calendar event:', error);
      res.status(500).json({ error: 'Failed to create calendar event' });
    }
  });

  // Sync today's completions to calendar
  router.post('/sync-completions', requireAuth, async (req: any, res) => {
    try {
      const { syncAllTodayCompletions } = await import('../utils/calendarCompletionSync');
      await syncAllTodayCompletions(req.user.id);

      res.json({ 
        success: true, 
        message: 'Today\'s completions synced to calendar successfully' 
      });
    } catch (error) {
      console.error('Error syncing completions to calendar:', error);
      res.status(500).json({ error: 'Failed to sync completions to calendar' });
    }
  });

  // Disconnect calendar
  router.post('/disconnect', requireAuth, async (req: any, res) => {
    try {
      const userSettings = await storage.getUserSettings(req.user.id);
      const updatedSettings = {
        ...userSettings,
        googleCalendar: null,
        calendarSettings: { enabled: false }
      };

      await storage.saveUserSettings(req.user.id, updatedSettings);

      res.json({ success: true });
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      res.status(500).json({ error: 'Failed to disconnect calendar' });
    }
  });

  // Delete habit from calendar
  router.delete('/delete-habit/:habitId', requireAuth, async (req: any, res) => {
    try {
      const { habitId } = req.params;
      const userSettings = await storage.getUserSettings(req.user.id);
      const calendarSettings = userSettings.calendarSettings;

      if (!calendarSettings?.enabled) {
        return res.status(400).json({ error: 'Calendar integration not enabled' });
      }

      // Get OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        typedEnv.GOOGLE_CLIENT_ID,
        typedEnv.GOOGLE_CLIENT_SECRET,
        redirectUri
      );

      oauth2Client.setCredentials({
        access_token: calendarSettings.accessToken,
        refresh_token: calendarSettings.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Get the habit to find the event
      const habits = await storage.getUserHabits(req.user.id);
      const habit = habits.find(h => h.id === parseInt(habitId));

      if (!habit) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      // Find existing events for this habit
      const eventsResponse = await calendar.events.list({
        calendarId: calendarSettings.calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 100,
        singleEvents: false,
        orderBy: 'startTime'
      });

      const existingEvents = eventsResponse.data.items || [];
      const habitEvent = existingEvents.find(event => 
        event.summary === `Habit: ${habit.title}` && 
        event.description === (habit.description || `Complete your habit: ${habit.title}`)
      );

      if (habitEvent && habitEvent.id) {
        await calendar.events.delete({
          calendarId: calendarSettings.calendarId,
          eventId: habitEvent.id
        });
        console.log(`✅ Deleted calendar event for habit ${habitId}`);
      }

      res.json({ 
        success: true, 
        message: 'Habit removed from calendar',
        deleted: !!habitEvent
      });
    } catch (error) {
      console.error('Failed to delete habit from calendar:', error);
      res.status(500).json({ error: 'Failed to delete habit from calendar' });
    }
  });

  return router;
}
