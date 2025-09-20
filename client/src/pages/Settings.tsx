import { useState } from "react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleCalendarIntegration } from "@/components/GoogleCalendarIntegration";
import { apiRequest } from "@/lib/queryClient";
import { useScreenSize } from "@/hooks/use-mobile";
import { getMobileModalHeader, getMobileModalBody, getMobileButtonClasses } from "@/lib/utils";

export default function Settings() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { settings, updateSetting, isLoaded: uiSettingsLoaded } = useUISettings();
  const { toast } = useToast();
  const { isMobile } = useScreenSize();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'excel'>('csv');
  const [isSaving, setIsSaving] = useState(false);

  const isSuperAdmin = user?.id === 'admin-001' || user?.role === 'super_admin';

  const handleSettingChange = async (key: keyof typeof settings, value: any) => {
    setIsSaving(true);
    try {
      await updateSetting(key, value);
      
      // Show immediate feedback that setting was changed
      toast({
        title: "Setting updated",
        description: "Your preference has been saved automatically.",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error saving setting:", error);
      toast({
        title: "Save failed",
        description: "Failed to save your preference. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Settings are auto-saved via updateSetting, so this is just a confirmation
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
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
      console.error("Export error:", error);
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
    if (deleteConfirmation !== "DELETE") {
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
      console.error("Delete error:", error);
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
      <div className="flex items-center justify-center min-h-screen">
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <p className="text-sm sm:text-base text-gray-600">Manage your preferences and integrations</p>
        </div>

        {/* Main Settings Layout - 3 Column Desktop, Single Column Mobile */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column - Notifications */}
          <div className="xl:col-span-1">
            <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                <span>Notifications</span>
                {isSaving && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Saving...</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                     All Notifications
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600">
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

                        {/* Email Notifications - Compact */}
                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-3">Email Reports</h4>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-800">Daily</span>
                              <Switch
                                checked={settings.dailyEmailReports || false}
                       onCheckedChange={(checked) =>
                                  handleSettingChange("dailyEmailReports", checked)
                       }
                     />
                   </div>

                   <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-800">Weekly</span>
                     <Switch
                                checked={settings.weeklyEmailReports || false}
                       onCheckedChange={(checked) =>
                                  handleSettingChange("weeklyEmailReports", checked)
                       }
                     />
                   </div>

                   <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-800">Monthly</span>
                              <Switch
                                checked={settings.monthlyEmailReports || false}
                                onCheckedChange={(checked) =>
                                  handleSettingChange("monthlyEmailReports", checked)
                                }
                              />
                            </div>
                          </div>
                        </div>
                    </>
                  )}

                 {/* Test Notification Buttons - Only show when notifications are enabled and user is super admin */}
                 {settings.allNotifications && isSuperAdmin && (
                   <div className="pt-4 border-t border-gray-200">
                     <h4 className="font-medium text-gray-900 mb-3">Test Notifications</h4>
                     <div className="flex flex-wrap gap-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => sendTestNotification('insight')}
                         className="text-xs"
                       >
                         <i className="fas fa-brain mr-1"></i>
                         Test Insight
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => sendTestNotification('achievement')}
                         className="text-xs"
                       >
                         <i className="fas fa-trophy mr-1"></i>
                         Test Achievement
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => sendTestNotification('inactivity')}
                         className="text-xs"
                       >
                         <i className="fas fa-bell mr-1"></i>
                         Test Reminder
                       </Button>
                     </div>
                   </div>
                 )}
            </CardContent>
          </Card>

          {/* Data & Privacy - Only show for super admin */}
          {isSuperAdmin && (
            <Card className="mt-6">
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
          )}
          </div>

          {/* Right Column - Google Calendar Integration (2 columns on desktop) */}
          <div className="xl:col-span-2">
            <GoogleCalendarIntegration />
          </div>
        </div>

        {/* Save Button - Compact */}
        <div className="mt-6 flex justify-end items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isSaving ? (
              <>
                <i className="fas fa-spinner fa-spin text-blue-500"></i>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <i className="fas fa-check-circle text-green-500"></i>
                <span>Auto-saved</span>
              </>
            )}
          </div>
          <Button onClick={handleSaveSettings} className="px-6" disabled={isSaving}>
            <i className="fas fa-save mr-2"></i>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {/* Export Data Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className={getMobileModalBody(isMobile)}>
            <DialogHeader className={getMobileModalHeader(isMobile)}>
              <DialogTitle>Export Your Data</DialogTitle>
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
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowExportDialog(false)}
                  disabled={isExporting}
                  className={getMobileButtonClasses('outline', isMobile)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className={getMobileButtonClasses('primary', isMobile)}
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
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className={getMobileModalBody(isMobile)}>
            <DialogHeader className={getMobileModalHeader(isMobile)}>
              <DialogTitle className={`${isMobile ? "text-xl" : "text-lg"} text-red-600`}>
                Delete Account
              </DialogTitle>
              <DialogDescription className={isMobile ? "text-sm" : "text-base"}>
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
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteConfirmation('');
                  }}
                  disabled={isDeleting}
                  className={getMobileButtonClasses('outline', isMobile)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                  className={getMobileButtonClasses('primary', isMobile)}
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
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
