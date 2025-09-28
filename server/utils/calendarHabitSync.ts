import { storage } from '../storage';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * Sync individual habit to Google Calendar (create, update, delete)
 */
export async function syncHabitToCalendar(
  userId: string, 
  habitId: number, 
  action: 'create' | 'update' | 'delete'
): Promise<void> {
  try {
    // Get user settings
    const userSettings = await storage.getUserSettings(userId);
    const calendarSettings = userSettings?.calendarSettings;
    const googleCalendar = userSettings?.googleCalendar;

    // Check if calendar integration is enabled
    if (!calendarSettings?.enabled || !googleCalendar?.accessToken) {
      console.log(`📅 Calendar sync disabled for user ${userId}`);
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
      console.log('🔄 Token expired, refreshing for habit sync...');
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log('✅ Token refreshed successfully for habit sync');
        
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
        console.error('❌ Failed to refresh token for habit sync:', refreshError);
        return; // Don't throw, just skip sync
      }
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Generate recurrence rule based on habit frequency
    const recurrenceRule = generateRecurrenceRule(habit);
    
    // Create event object
    const event = {
      summary: `Habit: ${habit.title}`,
      description: habit.description || `Track your ${habit.title} habit`,
      start: {
        dateTime: getHabitStartTime(habit),
        timeZone: 'UTC'
      },
      end: {
        dateTime: getHabitEndTime(habit),
        timeZone: 'UTC'
      },
      recurrence: [recurrenceRule],
      colorId: getCategoryColorId(habit.category),
      reminders: {
        useDefault: false,
        overrides: habit.reminderTime ? [
          {
            method: 'popup',
            minutes: getReminderMinutes(habit.reminderTime)
          }
        ] : []
      }
    };

    if (action === 'delete') {
      // Find and delete the habit event
      const eventSummary = `Habit: ${habit.title}`;
      const eventsResponse = await calendar.events.list({
        calendarId: calendarSettings.calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 100,
        singleEvents: false
      });
      
      const habitEvents = (eventsResponse.data.items || []).filter(event => 
        event.summary === eventSummary
      );
      
      for (const habitEvent of habitEvents) {
        await calendar.events.delete({
          calendarId: calendarSettings.calendarId,
          eventId: habitEvent.id!
        });
        console.log(`✅ Deleted habit event: ${habitEvent.summary}`);
      }
    } else {
      // Find existing events for this habit
      const eventSummary = `Habit: ${habit.title}`;
      const eventsResponse = await calendar.events.list({
        calendarId: calendarSettings.calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 100,
        singleEvents: false
      });
      
      const habitEvents = (eventsResponse.data.items || []).filter(event => 
        event.summary === eventSummary
      );

      if (habitEvents.length > 0) {
        // Update existing event
        const eventToUpdate = habitEvents[0];
        await calendar.events.update({
          calendarId: calendarSettings.calendarId,
          eventId: eventToUpdate.id!,
          requestBody: event
        });
        console.log(`✅ Updated habit event: ${event.summary}`);
      } else {
        // Create new event
        await calendar.events.insert({
          calendarId: calendarSettings.calendarId,
          requestBody: event
        });
        console.log(`✅ Created habit event: ${event.summary}`);
      }
    }

  } catch (error) {
    console.error('❌ Error syncing habit to calendar:', error);
    throw error;
  }
}

/**
 * Generate recurrence rule based on habit frequency
 */
function generateRecurrenceRule(habit: any): string {
  const { frequency, selectedDays } = habit;
  
  if (frequency === 'daily') {
    return 'RRULE:FREQ=DAILY';
  } else if (frequency === 'weekly') {
    if (selectedDays && selectedDays.length > 0) {
      const days = selectedDays.map((day: number) => {
        const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        return dayNames[day];
      });
      return `RRULE:FREQ=WEEKLY;BYDAY=${days.join(',')}`;
    }
    return 'RRULE:FREQ=WEEKLY';
  } else if (frequency === 'monthly') {
    if (selectedDays && selectedDays.length > 0) {
      const days = selectedDays.join(',');
      return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${days}`;
    }
    return 'RRULE:FREQ=MONTHLY';
  }
  
  // Fallback to daily
  return 'RRULE:FREQ=DAILY';
}

/**
 * Get habit start time based on reminder time or default
 */
function getHabitStartTime(habit: any): string {
  if (habit.reminderTime) {
    const [hours, minutes] = habit.reminderTime.split(':').map(Number);
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    return today.toISOString();
  }
  
  // Default to 9 AM
  const today = new Date();
  today.setHours(9, 0, 0, 0);
  return today.toISOString();
}

/**
 * Get habit end time (1 hour after start)
 */
function getHabitEndTime(habit: any): string {
  const startTime = new Date(getHabitStartTime(habit));
  startTime.setHours(startTime.getHours() + 1);
  return startTime.toISOString();
}

/**
 * Get category color ID for Google Calendar
 */
function getCategoryColorId(category: string): string {
  const colorMap: { [key: string]: string } = {
    'Health': '10', // Green
    'Productivity': '9', // Blue
    'Learning': '11', // Purple
    'Mindfulness': '6', // Orange
    'Social': '3', // Pink
    'Creative': '5', // Yellow
  };
  
  return colorMap[category] || '1'; // Default to blue
}

/**
 * Get reminder minutes from time string
 */
function getReminderMinutes(reminderTime: string): number {
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const now = new Date();
  const reminderDate = new Date();
  reminderDate.setHours(hours, minutes, 0, 0);
  
  const diffMs = reminderDate.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  return Math.max(0, diffMinutes);
}
