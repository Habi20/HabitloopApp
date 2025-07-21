import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AIInsight {
  id: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
}

interface AIInsightCardProps {
  insight: AIInsight;
  className?: string;
}

export function AIInsightCard({ insight, className }: AIInsightCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/insights/${insight.id}/read`, "PUT");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to mark insight as read",
        variant: "destructive",
      });
    },
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "suggestion":
        return "fas fa-lightbulb";
      case "motivation":
        return "fas fa-heart";
      case "tip":
        return "fas fa-star";
      default:
        return "fas fa-brain";
    }
  };

  const getInsightColors = (type: string) => {
    switch (type) {
      case "suggestion":
        return "from-blue-50 to-indigo-50 border-blue-200";
      case "motivation":
        return "from-green-50 to-emerald-50 border-green-200";
      case "tip":
        return "from-yellow-50 to-orange-50 border-yellow-200";
      default:
        return "from-emerald-50 to-teal-50 border-emerald-200";
    }
  };

  return (
    <Card className={cn(`bg-gradient-to-r ${getInsightColors(insight.type)}`, className)}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
            <i className={`${getInsightIcon(insight.type)} text-white`}></i>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">
              💡 {insight.title}
            </h3>
            <p className="text-gray-700 mb-3">{insight.content}</p>
            {!insight.isRead && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => markAsReadMutation.mutate()}
                disabled={markAsReadMutation.isPending}
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm p-0 h-auto"
              >
                Mark as read →
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
