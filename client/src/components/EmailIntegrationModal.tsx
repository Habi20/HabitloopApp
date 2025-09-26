import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, TrendingUp, Brain, Calendar, CheckCircle, Send } from "lucide-react";

interface EmailIntegrationModalProps {
  open: boolean;
  onClose: () => void;
}

export function EmailIntegrationModal({ open, onClose }: EmailIntegrationModalProps) {
  const { toast } = useToast();
  const { user, getUserEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Simplified test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("email/test", "POST");
      if (!response.ok) {
        throw new Error("Failed to send test email");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Test email sent successfully! Check your inbox.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to send test emails.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send test email. Please try again.",
        });
      }
    },
  });

  const handleSendTestEmail = async () => {
    setIsLoading(true);
    try {
      await testEmailMutation.mutateAsync();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-center">
            Email Integration
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* Description */}
          <p className="text-center text-gray-600 text-lg leading-relaxed">
            Connect your Email account to receive personalized habit notifications and insights
          </p>

          {/* Email Connection Status */}
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-xl mb-3">Email Connection Status</h3>
                  <p className="text-sm text-gray-600 mb-2">Connected to:</p>
                  <p className="font-medium text-lg">{getUserEmail(user) || 'Not connected'}</p>
                </div>
                <div className="text-right">
                  <Badge variant="default" className="bg-green-100 text-green-800 px-3 py-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Active
                  </Badge>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={handleSendTestEmail}
                  disabled={isLoading}
                  className="w-full h-12 text-lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {isLoading ? "Sending..." : "Send Mail Updates"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Features */}
          <div className="space-y-6">
            <h3 className="font-semibold text-xl mb-2">Email Features</h3>
            
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Clock className="w-6 h-6 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Daily Habit Reminders</h4>
                    <p className="text-gray-600 leading-relaxed">Get reminded of your daily habits at your preferred time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <TrendingUp className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Weekly Progress Reports</h4>
                    <p className="text-gray-600 leading-relaxed">Receive detailed weekly summaries of your habit completion</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Brain className="w-6 h-6 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg mb-2">AI Coaching Insights</h4>
                    <p className="text-gray-600 leading-relaxed">Get personalized insights and recommendations via email</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Calendar className="w-6 h-6 text-orange-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Streak Milestone Celebrations</h4>
                    <p className="text-gray-600 leading-relaxed">Celebrate your achievements with milestone notifications</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-pink-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Motivational Messages</h4>
                    <p className="text-gray-600 leading-relaxed">Receive inspiration and encouragement to stay on track</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-8">
            <Button variant="outline" onClick={onClose} className="px-8 py-2">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}