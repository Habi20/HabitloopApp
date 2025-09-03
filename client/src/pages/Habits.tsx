import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Layout } from "@/components/Layout";
import { AddHabitModal } from "@/components/AddHabitModal";
import { EditHabitModal } from "@/components/EditHabitModal";
import { HabitRecommendationCarousel } from "@/components/HabitRecommendationCarousel";
import { AICoachAssistant } from "@/components/AICoachAssistant";
import { EmailIntegrationModal } from "@/components/EmailIntegrationModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Habits() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showEditHabit, setShowEditHabit] = useState(false);
  const [showAICoach, setShowAICoach] = useState(false);
  const [showEmailIntegration, setShowEmailIntegration] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<
    string[]
  >([]);

  useEffect(() => {
    const storedRecommendations = localStorage.getItem("habitRecommendations");
    const storedDismissed = localStorage.getItem("dismissedRecommendations");

    if (storedRecommendations) {
      setRecommendations(JSON.parse(storedRecommendations));
    }
    if (storedDismissed) {
      setDismissedRecommendations(JSON.parse(storedDismissed));
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "Please log in to continue",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: habits, isLoading: habitsLoading } = useQuery({
    queryKey: ["/api/habits"],
    queryFn: async () => {
      const response = await apiRequest("habits", 'GET');
      return await response.json();
    },
    enabled: !!user,
  });



  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
              await apiRequest(`habits/${habitId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Success",
        description: "Habit deleted successfully",
      });
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
        description: "Failed to delete habit",
        variant: "destructive",
      });
    },
  });

  // const { data: completions } = useQuery({
  //   queryKey: ["/api/completions"],
  //   enabled: !!user,
  // });

  if (authLoading || habitsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const habitsArray = (habits as any)?.habits || [];

  const groupedHabits =
    habitsArray.reduce((acc: Record<string, any[]>, habit: any) => {
      if (!acc[habit.category]) {
        acc[habit.category] = [];
      }
      acc[habit.category].push(habit);
      return acc;
    }, {} as Record<string, any[]>) || {};

  // Filter out recommendations that are already added as habits or dismissed
  const filteredRecommendations = (recommendations as any[]).filter((rec: any) => {
    const existingHabit = habitsArray?.find(
      (habit: any) =>
        habit.title.toLowerCase() === rec.title.toLowerCase() ||
        (habit.title.toLowerCase().includes(rec.title.toLowerCase()) &&
          habit.category === rec.category)
    );
    const isDismissed = dismissedRecommendations.includes(rec.title);
    return !existingHabit && !isDismissed;
  });

  const handleAddHabitFromCarousel = (recommendation: any) => {
    // The carousel already handles adding the habit directly
    // This callback is just for any additional UI updates if needed
    console.log('Habit added from carousel:', recommendation.title);
    
    // Refresh the habits list to show the newly added habit
    queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
  };

  // const handleDismissRecommendation = (index: number) => {
  //   const recommendation = filteredRecommendations[index];
  //   if (recommendation && recommendation.title) {
  //     const newDismissed = [...dismissedRecommendations, recommendation.title];
  //     setDismissedRecommendations(newDismissed);
  //     localStorage.setItem(
  //       "dismissedRecommendations",
  //       JSON.stringify(newDismissed)
  //     );

  //     toast({
  //       title: "Recommendation dismissed",
  //       description:
  //         "You can always retake the questionnaire to get new suggestions.",
  //     });
  //   }
  // };

  const handleEditHabit = (habit: any) => {
    setEditingHabit(habit);
    setShowEditHabit(true);
  };

  return (
    <Layout 
      showSidebar={true}
      sidebarOpen={sidebarOpen}
      onSidebarToggle={setSidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      pageTitle="All Habits"
    >
      <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            {/* Removed duplicate page title - now shown in header */}
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowAICoach(true)} title="AI Coach">
                <i className="fas fa-lightbulb"></i>
                <span className="hidden sm:inline ml-2">AI Coach</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEmailIntegration(true)}
              >
                <i className="fas fa-envelope mr-2"></i>
                Email Notifications
              </Button>
              <Button onClick={() => setShowAddHabit(true)}>
                <i className="fas fa-plus mr-2"></i>
                Add Habit
              </Button>
            </div>
          </div>

          {/* AI Recommendations Carousel */}
          {filteredRecommendations.length > 0 && (
            <div className="mb-8">
              <HabitRecommendationCarousel
                onHabitAdd={handleAddHabitFromCarousel}
              />
            </div>
          )}

          {habitsArray.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <i className="fas fa-list text-4xl mb-4 text-gray-300"></i>
                <h4 className="text-lg font-medium mb-2">No habits yet</h4>
                <p className="mb-4">Create your first habit to get started!</p>
                <Button onClick={() => setShowAddHabit(true)}>
                  Create First Habit
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedHabits).map(
                ([category, categoryHabits]) => (
                  <div key={category}>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <i
                        className={`fas fa-${getCategoryIcon(
                          category
                        )} mr-2 text-${getCategoryColor(category)}`}
                      ></i>
                      {category}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(categoryHabits as any[]).map((habit: any) => (
                        <Card
                          key={habit.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                  {habit.title}
                                </h3>
                                {habit.description && (
                                  <p className="text-gray-600 text-sm mb-2">
                                    {habit.description}
                                  </p>
                                )}
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary">
                                    {habit.category}
                                  </Badge>
                                  {habit.reminderTime && (
                                    <span className="text-xs text-gray-500 flex items-center">
                                      <i className="fas fa-clock mr-1"></i>
                                      {habit.reminderTime}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditHabit(habit)}
                                  className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                                  title="Edit habit"
                                >
                                  <i className="fas fa-edit text-sm"></i>
                                </button>
                                <button
                                  onClick={() =>
                                    deleteHabitMutation.mutate(habit.id)
                                  }
                                  className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200"
                                  disabled={deleteHabitMutation.isPending}
                                  title="Delete habit"
                                >
                                  <i className="fas fa-trash text-sm"></i>
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>
                                Target: {habit.targetValue} {habit.unit}
                              </span>
                              <span className="capitalize">
                                {habit.frequency}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <AddHabitModal
          open={showAddHabit}
          onClose={() => {
            setShowAddHabit(false);
            setSelectedRecommendation(null);
          }}
          selectedRecommendation={selectedRecommendation}
        />

        {editingHabit && (
          <EditHabitModal
            open={showEditHabit}
            onClose={() => {
              setShowEditHabit(false);
              setEditingHabit(null);
            }}
            habit={editingHabit}
          />
        )}

        <AICoachAssistant
          open={showAICoach}
          onClose={() => setShowAICoach(false)}
        />

        <EmailIntegrationModal
          open={showEmailIntegration}
          onClose={() => setShowEmailIntegration(false)}
        />
      </Layout>
    );
  }

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Health: "heart",
    Productivity: "laptop",
    Learning: "book",
    Mindfulness: "om",
    Social: "users",
    Creative: "palette",
  };
  return icons[category] || "check";
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Health: "green-500",
    Productivity: "blue-500",
    Learning: "purple-500",
    Mindfulness: "indigo-500",
    Social: "pink-500",
    Creative: "yellow-500",
  };
  return colors[category] || "gray-500";
}
