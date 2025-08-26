import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUISettings } from "@/hooks/useUISettings";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { GoogleCalendarIntegrationSimple } from "@/components/GoogleCalendarIntegrationSimple";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Trophy, Lightbulb } from "lucide-react";

export default function Settings() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { settings, updateSetting, isLoaded: uiSettingsLoaded } = useUISettings();

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const handleSettingChange = async (key: string, value: boolean | string) => {
    await updateSetting(key as any, value);
    
    // Show immediate feedback
    toast({
      title: "Setting updated",
      description: "Your preference has been saved.",
    });
  };

  const saveSettings = () => {
    // Settings are now automatically saved via the useUISettings hook
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  const sendTestNotification = async (type: 'inactivity' | 'achievement' | 'insight') => {
    try {
      const response = await apiRequest('notifications/test', 'POST', { type });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Test notification sent! 🔔",
          description: `Check the notification bell to see your ${type} notification.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send test notification.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test notification.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || !uiSettingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

          <div className="space-y-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Push Notifications
                    </h4>
                    <p className="text-sm text-gray-600">
                      Receive habit reminders and updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("pushNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Inactivity Alerts
                    </h4>
                    <p className="text-sm text-gray-600">
                      Get notified when you haven't completed habits
                    </p>
                  </div>
                  <Switch
                    checked={settings.inactivityAlerts}
                    onCheckedChange={(checked) =>
                      handleSettingChange("inactivityAlerts", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Achievement Alerts
                    </h4>
                    <p className="text-sm text-gray-600">
                      Celebrate your milestones and achievements
                    </p>
                  </div>
                  <Switch
                    checked={settings.achievementAlerts}
                    onCheckedChange={(checked) =>
                      handleSettingChange("achievementAlerts", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      AI Insights
                    </h4>
                    <p className="text-sm text-gray-600">
                      Receive personalized AI-powered insights
                    </p>
                  </div>
                  <Switch
                    checked={settings.insightAlerts}
                    onCheckedChange={(checked) =>
                      handleSettingChange("insightAlerts", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Reminder Sound
                    </h4>
                    <p className="text-sm text-gray-600">
                      Play sound with notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.reminderSound}
                    onCheckedChange={(checked) =>
                      handleSettingChange("reminderSound", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Weekly Report</h4>
                    <p className="text-sm text-gray-600">
                      Get weekly progress summaries
                    </p>
                  </div>
                  <Switch
                    checked={settings.weeklyReport}
                    onCheckedChange={(checked) =>
                      handleSettingChange("weeklyReport", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Default Reminder Time
                    </h4>
                    <p className="text-sm text-gray-600">
                      Time for new habit reminders (Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone})
                    </p>
                  </div>
                  <Select
                    value={settings.defaultReminderTime}
                    onValueChange={(value) =>
                      handleSettingChange("defaultReminderTime", value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="07:00">7:00 AM</SelectItem>
                      <SelectItem value="08:00">8:00 AM</SelectItem>
                      <SelectItem value="09:00">9:00 AM</SelectItem>
                      <SelectItem value="10:00">10:00 AM</SelectItem>
                      <SelectItem value="18:00">6:00 PM</SelectItem>
                      <SelectItem value="19:00">7:00 PM</SelectItem>
                      <SelectItem value="20:00">8:00 PM</SelectItem>
                      <SelectItem value="21:00">9:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Test Notification Buttons */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Test Notifications</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Test different types of notifications to verify they work properly
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendTestNotification('inactivity')}
                      className="flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      Test Inactivity Alert
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendTestNotification('achievement')}
                      className="flex items-center gap-2"
                    >
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      Test Achievement
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendTestNotification('insight')}
                      className="flex items-center gap-2"
                    >
                      <Lightbulb className="w-4 h-4 text-blue-500" />
                      Test AI Insight
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Click the notification bell in the header to see your test notifications
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Theme</h4>
                    <p className="text-sm text-gray-600">
                      Choose your preferred theme
                    </p>
                  </div>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) =>
                      handleSettingChange("theme", value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* UI Components */}
            <Card>
              <CardHeader>
                <CardTitle>UI Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Data Consistency Check
                    </h4>
                    <p className="text-sm text-gray-600">
                      Show data consistency monitoring panel on the dashboard
                    </p>
                  </div>
                  <Switch
                    checked={settings.showDataConsistencyCheck}
                    onCheckedChange={(checked) =>
                      handleSettingChange("showDataConsistencyCheck", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      ML Habit Success Predictor
                    </h4>
                    <p className="text-sm text-gray-600">
                      Show AI-powered habit success prediction on the dashboard
                    </p>
                  </div>
                  <Switch
                    checked={settings.showMLSuccessPredictor}
                    onCheckedChange={(checked) =>
                      handleSettingChange("showMLSuccessPredictor", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      AI Questionnaire Setup
                    </h4>
                    <p className="text-sm text-gray-600">
                      Show AI setup button on the dashboard (hidden if already completed)
                    </p>
                  </div>
                  <Switch
                    checked={settings.showAIQuestionnaire}
                    onCheckedChange={(checked) =>
                      handleSettingChange("showAIQuestionnaire", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Export Data</h4>
                    <p className="text-sm text-gray-600">
                      Download your habit data
                    </p>
                  </div>
                  <Button variant="outline">
                    <i className="fas fa-download mr-2"></i>
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Delete Account
                    </h4>
                    <p className="text-sm text-gray-600">
                      Permanently delete your account and data
                    </p>
                  </div>
                  <Button variant="destructive">
                    <i className="fas fa-trash mr-2"></i>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Google Calendar Integration - Temporarily disabled */}
            {/* <GoogleCalendarIntegrationSimple /> */}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={saveSettings} className="px-8">
                <i className="fas fa-save mr-2"></i>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
