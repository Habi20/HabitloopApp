import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, Settings, CheckCircle, AlertCircle, Info } from "lucide-react";

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

export function GoogleCalendarIntegration({ className }: GoogleCalendarIntegrationProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    habitsCount: number;
    syncedCount: number;
    skippedCount: number;
    message: string;
  } | null>(null);
  const [habitsPreview, setHabitsPreview] = useState<{
    withReminders: Array<{id: number; title: string; reminderTime: string; source: string}>;
    withoutReminders: Array<{id: number; title: string; reminderTime: string; source: string}>;
  } | null>(null);
  const [settings, setSettings] = useState<CalendarSettings>({
    enabled: false,
    calendarId: 'primary',
    reminderTime: '09:00',
    eventDuration: 30,
    createEvents: true,
    syncCompletions: true
  });

  // Check connection status
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Load habits preview when connected
  useEffect(() => {
    if (isConnected) {
      loadHabitsPreview();
    }
  }, [isConnected]);

  // Auto-save settings when they change
  useEffect(() => {
    if (isConnected && settings.enabled) {
      const timeoutId = setTimeout(() => {
        handleSaveSettings();
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [settings]);

  const checkConnectionStatus = async () => {
    try {
      const response = await apiRequest('google-calendar/status', 'GET');
      const data = await response.json();
      setIsConnected(data.connected);
      if (data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (error) {
      console.error('Failed to check calendar connection:', error);
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
        source: 'habit'
      }));
      
      const withoutReminders = habits.filter((habit: any) => !habit.reminderTime).map((habit: any) => ({
        id: habit.id,
        title: habit.title,
        reminderTime: settings.reminderTime,
        source: 'default'
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

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('google-calendar/auth-url', 'GET');
      const data = await response.json();
      
      if (data.authUrl) {
        // Use direct redirect instead of popup to avoid CORS issues
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate calendar connection:', error);
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
      await apiRequest('google-calendar/disconnect', 'POST');
      setIsConnected(false);
      setSettings(prev => ({ ...prev, enabled: false }));
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Google Calendar."
      });
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect from Google Calendar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('google-calendar/settings', 'POST', settings);
      
      if (response.ok) {
        console.log('✅ Calendar settings saved successfully');
        toast({
          title: "Settings Saved",
          description: "Google Calendar settings updated successfully."
        });
      } else {
        console.error('Settings save failed:', response.status, response.statusText);
        toast({
          title: "Save Failed",
          description: "Failed to save calendar settings. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to save calendar settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save calendar settings. Please try again.",
        variant: "destructive"
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
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Google Calendar Integration</span>
        </CardTitle>
      </CardHeader>
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
            disabled={isLoading}
            variant={isConnected ? "outline" : "default"}
          >
            {isLoading ? "Loading..." : isConnected ? "Disconnect" : "Connect"}
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
            <div className="space-y-2">
              <Label htmlFor="calendar-id">Calendar</Label>
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
                  <SelectItem value="primary">Primary Calendar</SelectItem>
                  <SelectItem value="habits">HabitLoop Calendar</SelectItem>
                </SelectContent>
              </Select>
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
                <h4 className="font-medium flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>Habits Preview</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {habitsPreview.withReminders.length + habitsPreview.withoutReminders.length} total
                  </span>
                </h4>
                
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
                        <div key={habit.id} className="flex items-center justify-between text-sm bg-white/60 p-2 rounded-lg">
                          <span className="text-green-700 font-medium truncate flex-1">{habit.title}</span>
                          <span className="text-green-600 font-mono text-xs bg-green-100 px-2 py-1 rounded">
                            {habit.reminderTime}
                          </span>
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
                        <div key={habit.id} className="flex items-center justify-between text-sm bg-white/60 p-2 rounded-lg">
                          <span className="text-blue-700 font-medium truncate flex-1">{habit.title}</span>
                          <span className="text-blue-600 font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                            {habit.reminderTime}
                          </span>
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
    </Card>
  );
}
