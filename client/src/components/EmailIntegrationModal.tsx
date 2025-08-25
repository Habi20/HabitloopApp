import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { EmailIntegration } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Mail, Clock, TrendingUp, Brain, Calendar, CheckCircle } from "lucide-react";

interface EmailIntegrationModalProps {
  open: boolean;
  onClose: () => void;
}

export function EmailIntegrationModal({ open, onClose }: EmailIntegrationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailSettings, setEmailSettings] = useState({
    dailyReminders: false,
    weeklyProgress: false,
    aiInsights: false,
    streakMilestones: false,
    motivationalMessages: false,
  });

  const { data: emailStatus } = useQuery({
    queryKey: ["/api/email/status"],
    enabled: open,
  });

  const { data: currentSettings } = useQuery({
    queryKey: ["/api/email/settings"],
    enabled: open,
  });

  // Update email settings when data is fetched
  useEffect(() => {
    if (currentSettings && typeof currentSettings === 'object') {
      setEmailSettings(prev => ({ ...prev, ...currentSettings }));
    }
  }, [currentSettings]);

  // Type the email status properly
  const emailStatusData = emailStatus as EmailIntegration | undefined;

  const connectEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("email/connect", "POST");
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.authUrl) {
        window.open(data.authUrl, '_blank', 'width=600,height=600');
        toast({
          title: "Gmail Authorization",
          description: "Complete the authorization in the new window",
        });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Gmail. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiRequest("email/settings", "PUT", settings);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/settings"] });
      toast({
        title: "Settings Updated",
        description: "Email notification preferences saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update email settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("email/test", "POST");
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Check your inbox for the test email",
      });
    },
    onError: () => {
      toast({
        title: "Test Failed",
        description: "Failed to send test email. Please check your connection.",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (setting: string, value: boolean) => {
    const newSettings = { ...emailSettings, [setting]: value };
    setEmailSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  const emailTypes = [
    {
      id: "dailyReminders",
      title: "Daily Habit Reminders",
      description: "Get reminded of your daily habits at your preferred time",
      icon: Clock,
      color: "text-blue-500",
    },
    {
      id: "weeklyProgress",
      title: "Weekly Progress Reports",
      description: "Receive detailed weekly summaries of your habit completion",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      id: "aiInsights",
      title: "AI Coaching Insights",
      description: "Get personalized insights and recommendations via email",
      icon: Brain,
      color: "text-purple-500",
    },
    {
      id: "streakMilestones",
      title: "Streak Milestone Celebrations",
      description: "Celebrate your achievements with milestone notifications",
      icon: CheckCircle,
      color: "text-yellow-500",
    },
    {
      id: "motivationalMessages",
      title: "Motivational Messages",
      description: "Receive inspiration and encouragement to stay on track",
      icon: Calendar,
      color: "text-red-500",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <Mail className="w-6 h-6 mr-2 text-blue-600" />
            Email Integration
          </DialogTitle>
          <p className="text-gray-600">
            Connect your Gmail account to receive personalized habit notifications and insights
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Gmail Connection Status
                  </h3>
                  <div className="flex items-center space-x-2">
                    {emailStatusData?.connected ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-700">Connected to {emailStatusData.email}</span>
                        <Badge variant="secondary" className="ml-2">Active</Badge>
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">Not connected</span>
                        <Badge variant="outline" className="ml-2">Inactive</Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-x-2">
                  {emailStatusData?.connected ? (
                    <Button 
                      variant="outline" 
                      onClick={() => sendTestEmailMutation.mutate()}
                      disabled={sendTestEmailMutation.isPending}
                    >
                      {sendTestEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => connectEmailMutation.mutate()}
                      disabled={connectEmailMutation.isPending}
                    >
                      {connectEmailMutation.isPending ? "Connecting..." : "Connect Gmail"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          {emailStatusData?.connected && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Email Notification Preferences
                </h3>
                <div className="space-y-4">
                  {emailTypes.map((emailType) => {
                    const IconComponent = emailType.icon;
                    return (
                      <div key={emailType.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <IconComponent className={`w-5 h-5 mt-1 ${emailType.color}`} />
                          <div>
                            <h4 className="font-medium text-gray-900">{emailType.title}</h4>
                            <p className="text-sm text-gray-600">{emailType.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={emailSettings[emailType.id as keyof typeof emailSettings]}
                          onCheckedChange={(checked) => handleSettingChange(emailType.id, checked)}
                          disabled={updateSettingsMutation.isPending}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integration Benefits */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Why Connect Email?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Stay Consistent</h4>
                  <p className="text-sm text-gray-600">
                    Never forget your habits with timely email reminders
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Track Progress</h4>
                  <p className="text-sm text-gray-600">
                    Get detailed weekly reports in your inbox
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">AI Guidance</h4>
                  <p className="text-sm text-gray-600">
                    Receive personalized coaching insights via email
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Celebrate Wins</h4>
                  <p className="text-sm text-gray-600">
                    Get notified of your achievements and milestones
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <Card className="border border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Privacy & Security</h4>
              <p className="text-sm text-yellow-700">
                We only use your email to send habit-related notifications. Your email data is encrypted and never shared with third parties. You can disconnect at any time.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}