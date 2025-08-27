import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUISettings } from "@/hooks/useUISettings";
import { Layout } from "@/components/Layout";
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
import { Lightbulb } from "lucide-react";
// AlertTriangle, Trophy,
export default function Settings() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const {
    settings,
    updateSetting,
    isLoaded: uiSettingsLoaded,
  } = useUISettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const sendTestNotification = async (
    type: "inactivity" | "achievement" | "insight"
  ) => {
    try {
      const response = await apiRequest("notifications/test", "POST", { type });
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
    <Layout
      showSidebar={true}
      sidebarOpen={sidebarOpen}
      onSidebarToggle={setSidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      pageTitle="Settings"
    >
      <div className="max-w-4xl mx-auto">
        {/* Removed duplicate page title - now shown in header */}

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
                    All Notifications
                  </h4>
                  <p className="text-sm text-gray-600">
                    Enable or disable all notifications and insights
                  </p>
                </div>
                <Switch
                  checked={settings.allNotifications}
                  onCheckedChange={(checked) =>
                    handleSettingChange("allNotifications", checked)
                  }
                />
              </div>

              {settings.allNotifications && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">AI Insights</h4>
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
                        Default Reminder Time
                      </h4>
                      <p className="text-sm text-gray-600">
                        Time for new habit reminders (Your timezone:{" "}
                        {Intl.DateTimeFormat().resolvedOptions().timeZone})
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
                </>
              )}

              {/* Test Notification Buttons - Only show when notifications are enabled */}
              {settings.allNotifications && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Test Notifications
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Test different types of notifications to verify they work
                    properly
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendTestNotification("insight")}
                      className="flex items-center gap-2"
                    >
                      <Lightbulb className="w-4 h-4 text-blue-500" />
                      Test AI Insight
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Click the notification bell in the header to see your
                    test notifications
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advanced Features Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    Enable Advanced Features
                  </h4>
                  <p className="text-sm text-gray-600">
                    Unlock additional features like Google Calendar Integration
                    and more
                  </p>
                </div>
                <Switch
                  checked={settings.advancedFeatures || false}
                  onCheckedChange={(checked) =>
                    handleSettingChange("advancedFeatures", checked)
                  }
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Advanced features are disabled by default to keep the
                interface simple. Enable to access additional customization
                options.
              </p>
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
                    Show AI setup button on the dashboard (hidden if already
                    completed)
                  </p>
                </div>
                <Switch
                  checked={settings.showAIQuestionnaire}
                  onCheckedChange={(checked) =>
                    handleSettingChange("showAIQuestionnaire", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Habit Carousel</h4>
                  <p className="text-sm text-gray-600">
                    Show AI-generated habit recommendations carousel on
                    dashboard
                  </p>
                </div>
                <Switch
                  checked={settings.showHabitCarousel || true}
                  onCheckedChange={(checked) =>
                    handleSettingChange("showHabitCarousel", checked)
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
                  <h4 className="font-medium text-gray-900">Delete Account</h4>
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
    </Layout>
  );
}
