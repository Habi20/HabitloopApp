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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleCalendarIntegration } from "@/components/GoogleCalendarIntegration";
import { apiRequest } from "@/lib/queryClient";
import { Lightbulb } from "lucide-react";
// AlertTriangle, Trophy,
export default function Settings() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const { settings, updateSetting, isLoaded: uiSettingsLoaded } = useUISettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'excel'>('csv');

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

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await apiRequest(`export-data?format=${exportFormat}`, 'GET');
      
      if (response.ok) {
        let data: any;
        let blob: Blob;
        let filename: string;
        
        if (exportFormat === 'json') {
          data = await response.json();
          blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          filename = `habitloop-data-${user?.id}-${new Date().toISOString().split('T')[0]}.json`;
        } else {
          data = await response.text();
          blob = new Blob([data], { type: 'text/csv' });
          filename = `habitloop-data-${user?.id}-${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`;
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Data exported successfully! 📁",
          description: `Your habit data has been downloaded as ${exportFormat.toUpperCase()}.`,
        });
        
        setShowExportDialog(false);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: "Invalid confirmation",
        description: "Please enter 'DELETE' to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiRequest('delete-account', 'DELETE', { confirmation: deleteConfirmation });
      
      if (response.ok) {
        toast({
          title: "Account deleted",
          description: "Your account has been permanently deleted.",
        });
        
        // Logout and redirect
        setTimeout(() => {
          logout();
          window.location.href = '/';
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Delete failed');
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
    }
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

                     {/* Email Notifications */}
                     <div className="pt-4 border-t border-gray-200">
                       <h4 className="font-medium text-gray-900 mb-3">Email Notifications</h4>
                       <p className="text-sm text-gray-600 mb-4">
                         Receive email reports about your habit progress
                       </p>
                       
                       <div className="space-y-3">
                         <div className="flex items-center justify-between">
                           <div>
                             <h5 className="font-medium text-gray-800">Daily Reports</h5>
                             <p className="text-sm text-gray-600">Get daily summaries of your habit progress</p>
                           </div>
                           <Switch
                             checked={settings.dailyEmailReports || false}
                    onCheckedChange={(checked) =>
                               handleSettingChange("dailyEmailReports", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                             <h5 className="font-medium text-gray-800">Weekly Reports</h5>
                             <p className="text-sm text-gray-600">Get weekly summaries and insights</p>
                  </div>
                  <Switch
                             checked={settings.weeklyEmailReports || false}
                    onCheckedChange={(checked) =>
                               handleSettingChange("weeklyEmailReports", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                             <h5 className="font-medium text-gray-800">Monthly Reports</h5>
                             <p className="text-sm text-gray-600">Get comprehensive monthly progress reports</p>
                           </div>
                           <Switch
                             checked={settings.monthlyEmailReports || false}
                             onCheckedChange={(checked) =>
                               handleSettingChange("monthlyEmailReports", checked)
                             }
                           />
                         </div>
                       </div>
                       
                       <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                         <p className="text-sm text-blue-700">
                           <strong>Note:</strong> Email reports will only be sent if you have habits added to your profile.
                         </p>
                       </div>
                     </div>
                   </>
                 )}

                {/* Test Notification Buttons - Only show when notifications are enabled */}
                {settings.allNotifications && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Test Notifications</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Test different types of notifications to verify they work properly
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendTestNotification('insight')}
                        className="flex items-center gap-2 whitespace-nowrap min-w-fit w-full sm:w-auto"
                      >
                        <Lightbulb className="w-4 h-4 text-blue-500" />
                        Test AI Insight
                      </Button>
                </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Click the notification bell in the header to see your test notifications
                    </p>
                  </div>
                )}
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
                  <Button 
                    variant="outline" 
                    onClick={() => setShowExportDialog(true)}
                    disabled={isExporting}
                  >
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
                  <Button 
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Google Calendar Integration */}
            <GoogleCalendarIntegration />

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={saveSettings} className="px-8">
                <i className="fas fa-save mr-2"></i>
                Save Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Export Data Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export Data</DialogTitle>
              <DialogDescription>
                Choose the format for your data export. CSV format is recommended for analysis in spreadsheet applications like Excel or Google Sheets.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="export-format" className="text-sm font-medium">
                  Export Format
                </Label>
                <Select
                  value={exportFormat}
                  onValueChange={(value: 'json' | 'csv' | 'excel') => setExportFormat(value)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">
                      <div className="flex items-center">
                        <i className="fas fa-file-csv mr-2 text-green-600"></i>
                        CSV (Recommended)
                      </div>
                    </SelectItem>

                    <SelectItem value="json">
                      <div className="flex items-center">
                        <i className="fas fa-file-code mr-2 text-blue-600"></i>
                        JSON (Raw Data)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
                             <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                 <p className="text-sm text-blue-700">
                   <strong>What you'll get:</strong>
                 </p>
                 <ul className="text-sm text-blue-600 mt-1 list-disc list-inside">
                   <li>Your profile (name, level, XP, difficulty)</li>
                   <li>All your habits with categories and frequencies</li>
                   <li>Your habit completion history</li>
                   <li>Your current and longest streaks</li>
                 </ul>
                 <p className="text-xs text-blue-600 mt-2">
                   💡 CSV format works great in Excel, Google Sheets, and other spreadsheet applications
                 </p>
               </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(false)}
                disabled={isExporting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Exporting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download mr-2"></i>
                    Export Data
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Account</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account and all associated data.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="delete-confirmation" className="text-sm font-medium">
                  Type "DELETE" to confirm
                </Label>
                <Input
                  id="delete-confirmation"
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="mt-1"
                />
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This will permanently delete:
                </p>
                <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                  <li>Your account and profile</li>
                  <li>All your habits and progress</li>
                  <li>All your completion data</li>
                  <li>All your streaks and achievements</li>
                  <li>All your ML predictions and insights</li>
                </ul>
              </div>
    </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmation('');
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmation !== 'DELETE'}
              >
                {isDeleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash mr-2"></i>
                    Delete Account
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
  );
}
