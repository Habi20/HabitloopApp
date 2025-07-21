import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GoogleCalendarIntegrationSimple } from "@/components/GoogleCalendarIntegrationSimple";

export default function Settings() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    notifications: true,
    reminderSound: true,
    weeklyReport: true,
    reminderTime: "09:00",
    theme: "light",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    // Here you would typically save to backend
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  if (authLoading) {
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
                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-600">Receive habit reminders and updates</p>
                  </div>
                  <Switch 
                    checked={settings.notifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Reminder Sound</h4>
                    <p className="text-sm text-gray-600">Play sound with notifications</p>
                  </div>
                  <Switch 
                    checked={settings.reminderSound}
                    onCheckedChange={(checked) => handleSettingChange('reminderSound', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Weekly Report</h4>
                    <p className="text-sm text-gray-600">Get weekly progress summaries</p>
                  </div>
                  <Switch 
                    checked={settings.weeklyReport}
                    onCheckedChange={(checked) => handleSettingChange('weeklyReport', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Default Reminder Time</h4>
                    <p className="text-sm text-gray-600">Time for new habit reminders</p>
                  </div>
                  <Select 
                    value={settings.reminderTime} 
                    onValueChange={(value) => handleSettingChange('reminderTime', value)}
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
                    <p className="text-sm text-gray-600">Choose your preferred theme</p>
                  </div>
                  <Select 
                    value={settings.theme} 
                    onValueChange={(value) => handleSettingChange('theme', value)}
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

            {/* Data & Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Export Data</h4>
                    <p className="text-sm text-gray-600">Download your habit data</p>
                  </div>
                  <Button variant="outline">
                    <i className="fas fa-download mr-2"></i>
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Delete Account</h4>
                    <p className="text-sm text-gray-600">Permanently delete your account and data</p>
                  </div>
                  <Button variant="destructive">
                    <i className="fas fa-trash mr-2"></i>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Google Calendar Integration */}
            <GoogleCalendarIntegrationSimple />

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
