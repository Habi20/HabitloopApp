import { storage } from '../storage';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * Sync habit completion status to Google Calendar events
 */
export async function syncCompletionToCalendar(
  userId: string, 
  habitId: number, 
  isCompleted: boolean
): Promise<void> {
  try {
    // Get user settings
    const userSettings = await storage.getUserSettings(userId);
    const calendarSettings = userSettings?.calendarSettings;
    const googleCalendar = userSettings?.googleCalendar;

    // Debug: Log what we're getting
    console.log(`🔍 Calendar sync debug for user ${userId}:`, {
      hasUserSettings: !!userSettings,
      hasCalendarSettings: !!calendarSettings,
      hasGoogleCalendar: !!googleCalendar,
      calendarEnabled: calendarSettings?.enabled,
      syncCompletions: calendarSettings?.syncCompletions,
      hasAccessToken: !!googleCalendar?.accessToken,
      userSettingsKeys: userSettings ? Object.keys(userSettings) : 'null',
      fullUserSettings: userSettings
    });

    // Check if calendar integration is enabled and syncCompletions is true
    if (!calendarSettings?.enabled || !calendarSettings?.syncCompletions || !googleCalendar?.accessToken) {
      console.log(`📅 Calendar sync disabled for user ${userId} - calendarEnabled: ${calendarSettings?.enabled}, syncCompletions: ${calendarSettings?.syncCompletions}, hasAccessToken: ${!!googleCalendar?.accessToken}`);
      return;
    }

    // Get the habit details
    const habits = await storage.getUserHabits(userId);
    const habit = habits.find(h => h.id === habitId);
    if (!habit) {
      console.log(`❌ Habit ${habitId} not found for user ${userId}`);
      return;
    }

    // Set up OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: googleCalendar.accessToken,
      refresh_token: googleCalendar.refreshToken
    });

    // Check if token is expired and refresh if needed
    const now = Date.now();
    const expiryDate = googleCalendar.expiryDate || 0;
    
    if (now >= expiryDate) {
      console.log('🔄 Token expired, refreshing for calendar sync...');
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log('✅ Token refreshed successfully for calendar sync');
        
        // Update stored credentials
        await storage.saveUserSettings(userId, {
          googleCalendar: {
            ...googleCalendar,
            accessToken: credentials.access_token!,
            expiryDate: credentials.expiry_date || (Date.now() + 3600000) // 1 hour from now
          }
        });
        
        // Update the client with new token
        oauth2Client.setCredentials(credentials);
      } catch (refreshError) {
        console.error('❌ Failed to refresh token for calendar sync:', refreshError);
        return; // Don't throw, just skip sync
      }
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Find the corresponding calendar event
    const eventSummary = `Habit: ${habit.title}`;
    const completedEventSummary = `✅ Habit: ${habit.title}`;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    console.log(`🔍 Looking for calendar event: "${eventSummary}" or "${completedEventSummary}" for user ${userId}`);

    // Search for events today
    const eventsResponse = await calendar.events.list({
      calendarId: calendarSettings.calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      maxResults: 100,
      singleEvents: true
    });

    const events = eventsResponse.data.items || [];
    // Look for both completed and uncompleted versions
    const habitEvent = events.find(event => 
      event.summary === eventSummary || event.summary === completedEventSummary
    );

    if (!habitEvent) {
      console.log(`❌ No calendar event found for habit "${habit.title}" today`);
      return;
    }

    console.log(`✅ Found calendar event: ${habitEvent.id} for habit "${habit.title}"`);

    // Update the event to mark as completed or not
    const updatedEvent = {
      ...habitEvent,
      summary: isCompleted ? `✅ ${eventSummary}` : eventSummary,
      description: isCompleted 
        ? `${habit.description || `Complete your habit: ${habit.title}`}\n\n✅ Completed at ${new Date().toLocaleTimeString()}`
        : habit.description || `Complete your habit: ${habit.title}`,
      colorId: isCompleted ? '10' : undefined, // Green color for completed
    };

    await calendar.events.update({
      calendarId: calendarSettings.calendarId,
      eventId: habitEvent.id!,
      requestBody: updatedEvent
    });

    console.log(`✅ Successfully ${isCompleted ? 'marked as completed' : 'unmarked'} calendar event for habit "${habit.title}"`);

  } catch (error) {
    console.error('❌ Error syncing completion to calendar:', error);
    // Don't throw the error - just log it and continue
    // This prevents calendar sync failures from affecting habit completion
  }
}

/**
 * Sync all today's completions to calendar (useful for bulk sync)
 */
export async function syncAllTodayCompletions(userId: string): Promise<void> {
  try {
    const userSettings = await storage.getUserSettings(userId);
    const calendarSettings = userSettings?.calendarSettings;

    if (!calendarSettings?.enabled || !calendarSettings?.syncCompletions) {
      console.log(`📅 Calendar sync disabled for user ${userId}`);
      return;
    }

    // Get today's completions
    const today = new Date().toISOString().split('T')[0];
    const completions = await storage.getHabitCompletions(userId, today);
    
    console.log(`🔄 Syncing ${completions.length} completions to calendar for user ${userId}`);

    // Sync each completion
    for (const completion of completions) {
      await syncCompletionToCalendar(userId, completion.habitId, true);
    }

    console.log(`✅ Completed syncing all today's completions to calendar`);

  } catch (error) {
    console.error('❌ Error syncing all completions to calendar:', error);
    throw error;
  }
}
