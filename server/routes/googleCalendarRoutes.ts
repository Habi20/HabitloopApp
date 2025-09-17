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
      
      if (!code || !state) {
        return res.status(400).json({ error: 'Missing authorization code or state' });
      }

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Store tokens in user settings using state as userId
      const userId = state;
      const userSettings = await storage.getUserSettings(userId);
      const updatedSettings = {
        ...userSettings,
        googleCalendar: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
          scope: tokens.scope
        }
      };

      await storage.saveUserSettings(userId, updatedSettings);

      // Redirect to frontend with success message
      res.redirect(`${typedEnv.frontendUrl}/settings?calendar=connected`);
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.status(500).json({ error: 'Failed to connect calendar' });
    }
  });

  // Check connection status
  router.get('/status', requireAuth, async (req: any, res) => {
    try {
      const userSettings = await storage.getUserSettings(req.user.id);
      const calendarSettings = userSettings?.googleCalendar;

      if (!calendarSettings?.accessToken) {
        return res.json({ connected: false });
      }

      // Verify token is still valid
      oauth2Client.setCredentials({
        access_token: calendarSettings.accessToken,
        refresh_token: calendarSettings.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      await calendar.calendarList.list();

      res.json({ 
        connected: true,
        settings: userSettings?.calendarSettings || {}
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

      await storage.saveUserSettings(req.user.id, updatedSettings);

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving calendar settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // Sync habits with calendar
  router.post('/sync-habits', requireAuth, async (req: any, res) => {
    try {
      const userSettings = await storage.getUserSettings(req.user.id);
      const calendarSettings = userSettings?.calendarSettings;
      const googleCalendar = userSettings?.googleCalendar;

      if (!calendarSettings?.enabled || !googleCalendar?.accessToken) {
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
      
      oauth2Client.setCredentials({
        access_token: googleCalendar.accessToken,
        refresh_token: googleCalendar.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      let syncedCount = 0;
      let skippedCount = 0;

      // Get existing events to check for duplicates and updates
      let existingEvents: any[] = [];
      try {
        const eventsResponse = await calendar.events.list({
          calendarId: calendarSettings.calendarId,
          timeMin: new Date().toISOString(),
          maxResults: 100,
          singleEvents: false,
          orderBy: 'startTime'
        });
        existingEvents = eventsResponse.data.items || [];
        console.log(`🔍 Found ${existingEvents.length} existing events in calendar`);
      } catch (error) {
        console.log('⚠️ Could not fetch existing events, will create new ones');
      }

      // Create/update calendar events for each habit
      for (const habit of habits) {
        // Use habit's reminder time, or fall back to default reminder time
        const reminderTime = habit.reminderTime || calendarSettings.reminderTime;
        
        console.log(`🔍 Habit ${habit.id} (${habit.title}):`, {
          habitReminderTime: habit.reminderTime,
          defaultReminderTime: calendarSettings.reminderTime,
          finalReminderTime: reminderTime,
          willSkip: !reminderTime
        });
        
        if (!reminderTime) {
          skippedCount++;
          continue;
        }

        // Calculate proper start and end times
        const startDateTime = new Date().toISOString().split('T')[0] + `T${reminderTime}:00`;
        const startDate = new Date(startDateTime);
        const endDate = new Date(startDate.getTime() + (calendarSettings.eventDuration * 60000));
        
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
          recurrence: ['RRULE:FREQ=DAILY'],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 10 },
              { method: 'email', minutes: 30 }
            ]
          }
        };

        // Check if habit event already exists
        const existingEvent = existingEvents.find(existing => 
          existing.summary === event.summary && 
          existing.description === event.description
        );

        try {
          if (existingEvent) {
            // Check if the event needs to be updated (different time)
            const existingStartTime = existingEvent.start?.dateTime;
            const needsUpdate = existingStartTime !== event.start.dateTime;
            
            if (needsUpdate) {
              console.log(`🔄 Updating existing event for habit ${habit.id}:`, {
                oldTime: existingStartTime,
                newTime: event.start.dateTime,
                eventId: existingEvent.id
              });
              
              await calendar.events.update({
                calendarId: calendarSettings.calendarId,
                eventId: existingEvent.id,
                requestBody: event
              });
              syncedCount++;
              console.log(`✅ Successfully updated event for habit ${habit.id}`);
            } else {
              console.log(`⏭️ Event for habit ${habit.id} already exists with correct time, skipping`);
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
                
                // Retry creating/updating the event
                if (existingEvent) {
                  await calendar.events.update({
                    calendarId: habitLoopCalendar.id || 'primary',
                    eventId: existingEvent.id,
                    requestBody: event
                  });
                  console.log(`✅ Successfully updated event for habit ${habit.id} in existing calendar`);
                } else {
                  await calendar.events.insert({
                    calendarId: habitLoopCalendar.id || 'primary',
                    requestBody: event
                  });
                  console.log(`✅ Successfully created event for habit ${habit.id} in existing calendar`);
                }
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
                
                // Retry creating/updating the event
                if (existingEvent) {
                  await calendar.events.update({
                    calendarId: calendarResponse.data.id || 'primary',
                    eventId: existingEvent.id,
                    requestBody: event
                  });
                  console.log(`✅ Successfully updated event for habit ${habit.id} in new calendar`);
                } else {
                  await calendar.events.insert({
                    calendarId: calendarResponse.data.id || 'primary',
                    requestBody: event
                  });
                  console.log(`✅ Successfully created event for habit ${habit.id} in new calendar`);
                }
                syncedCount++;
              }
            } catch (createError: any) {
              console.error(`❌ Failed to create/find calendar, falling back to primary:`, createError.message);
              // Fallback to primary calendar
              try {
                if (existingEvent) {
                  await calendar.events.update({
                    calendarId: 'primary',
                    eventId: existingEvent.id,
                    requestBody: event
                  });
                  console.log(`✅ Successfully updated event for habit ${habit.id} in primary calendar`);
                } else {
                  await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: event
                  });
                  console.log(`✅ Successfully created event for habit ${habit.id} in primary calendar`);
                }
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
