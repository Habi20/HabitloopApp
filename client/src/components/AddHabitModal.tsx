import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useScreenSize, useIsTouchDevice } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMobileModalHeader, getMobileModalBody, getMobileModalFooter, getMobileButtonClasses } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import {
  ResponsiveFormField,
  ResponsiveInput,
  ResponsiveTextarea,
  ResponsiveGrid,
} from "@/components/ui/responsive-form-field";
import { CategorySelector } from "@/components/CategorySelector";

const habitSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  targetValue: z.number().min(1, "Target must be at least 1"),
  unit: z.string().min(1, "Unit is required"),
  reminderTime: z.string().optional(),
  frequency: z.string().default("daily"),
  recurrencePattern: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  selectedDays: z.array(z.number()).optional(),
  color: z.string().default("#6366F1"),
  icon: z.string().default("fas fa-check"),
}).refine((data) => {
  // Require selectedDays for weekly and monthly patterns
  if (data.recurrencePattern === "weekly" || data.recurrencePattern === "monthly") {
    return data.selectedDays && data.selectedDays.length > 0;
  }
  return true;
}, {
  message: "Please select at least one day",
  path: ["selectedDays"],
});

type HabitFormData = z.infer<typeof habitSchema>;

interface AddHabitModalProps {
  open: boolean;
  onClose: () => void;
  selectedRecommendation?: any;
}

export function AddHabitModal({
  open,
  onClose,
  selectedRecommendation,
}: AddHabitModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { isMobile } = useScreenSize();
  const isTouchDevice = useIsTouchDevice();

  const form = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      targetValue: 1,
      unit: "times",
      reminderTime: "",
      frequency: "daily",
      recurrencePattern: "daily",
      selectedDays: [],
      color: "#6366F1",
      icon: "fas fa-check",
    },
  });

  // Pre-fill form when a recommendation is selected
  useEffect(() => {
    if (selectedRecommendation) {
      form.setValue("title", selectedRecommendation.title);
      form.setValue("description", selectedRecommendation.description);
      form.setValue("category", selectedRecommendation.category);
      form.setValue("targetValue", selectedRecommendation.targetValue);
      form.setValue("unit", selectedRecommendation.unit);
      form.setValue("reminderTime", selectedRecommendation.reminderTime);
      form.setValue("color", selectedRecommendation.color);
      form.setValue("icon", selectedRecommendation.icon);
      form.setValue("frequency", selectedRecommendation.frequency || "daily");
      setShowRecommendations(false); // Skip recommendation view, go straight to form
    }
  }, [selectedRecommendation, form]);

  const createHabitMutation = useMutation({
    mutationFn: async (data: HabitFormData) => {
              await apiRequest("habits", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits", user?.id] });
      toast({
        title: "Success",
        description: "Habit created successfully!",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HabitFormData) => {
    createHabitMutation.mutate(data);
  };

  const categories = [
    {
      value: "Health",
      label: "Health & Fitness",
      color: "#10B981",
      icon: "fas fa-heart",
    },
    {
      value: "Productivity",
      label: "Productivity",
      color: "#3B82F6",
      icon: "fas fa-laptop",
    },
    {
      value: "Learning",
      label: "Learning",
      color: "#8B5CF6",
      icon: "fas fa-book",
    },
    {
      value: "Mindfulness",
      label: "Mindfulness",
      color: "#6366F1",
      icon: "fas fa-om",
    },
    {
      value: "Social",
      label: "Social",
      color: "#EC4899",
      icon: "fas fa-users",
    },
    {
      value: "Creative",
      label: "Creative",
      color: "#F59E0B",
      icon: "fas fa-palette",
    },
  ];

  const units = [
    { value: "times", label: "times" },
    { value: "minutes", label: "minutes" },
    { value: "pages", label: "pages" },
    { value: "glasses", label: "glasses" },
    { value: "steps", label: "steps" },
    { value: "hours", label: "hours" },
    { value: "exercises", label: "exercises" },
    { value: "km", label: "kilometers" },
  ];

  const timeSlots = [
    "06:00",
    "06:30",
    "07:00",
    "07:30",
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00",
    "22:30",
  ];

  const loadRecommendations = () => {
    const recommendations = localStorage.getItem("habitRecommendations");
    if (recommendations) {
      const parsed = JSON.parse(recommendations);
      if (parsed && parsed.length > 0) {
        setShowRecommendations(true);
      } else {
        toast({
          title: "No AI Recommendations Available",
          description: "Try going to AI Setup → Fill a questionnaire to get personalized habit suggestions.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "No AI Recommendations Available",
        description: "Try going to AI Setup → Fill a questionnaire to get personalized habit suggestions.",
        variant: "destructive",
      });
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setShowRecommendations(false);
    }
  }, [open, form]);

  const useRecommendation = (recommendation: any) => {
    form.setValue("title", recommendation.title);
    form.setValue("description", recommendation.description);
    form.setValue("category", recommendation.category);
    form.setValue("targetValue", recommendation.targetValue);
    form.setValue("unit", recommendation.unit);
    form.setValue("reminderTime", recommendation.reminderTime);
    form.setValue("color", recommendation.color);
    form.setValue("icon", recommendation.icon);
    setShowRecommendations(false);
  };

  const handleCategoryChange = (category: string) => {
    const categoryData = categories.find((c) => c.value === category);
    if (categoryData) {
      form.setValue("category", category);
      form.setValue("color", categoryData.color);
      form.setValue("icon", categoryData.icon);
    }
  };

  // Get user's existing habits to filter out duplicates (same as carousel)
  const { data: habitsResponse } = useQuery({
    queryKey: ['/api/habits'],
    queryFn: async () => {
      const response = await apiRequest('habits', 'GET');
      return response.json();
    },
    enabled: showRecommendations, // Only fetch when showing recommendations
  });
  
  const existingHabits = habitsResponse?.habits || [];

  if (showRecommendations) {
    // Get all recommendations from localStorage
    const allRecommendations = JSON.parse(
      localStorage.getItem("habitRecommendations") || "[]"
    );
    
    // Apply the same filtering logic as the carousel
    const recommendations = allRecommendations.filter((rec: any) => {
      const existingHabit = existingHabits.find(
        (habit: any) =>
          habit.title.toLowerCase() === rec.title.toLowerCase() ||
          (habit.title.toLowerCase().includes(rec.title.toLowerCase()) &&
            habit.category === rec.category)
      );
      
      // Debug logging
      if (existingHabit) {
        console.log(`[AI Suggestions Modal] Filtering out "${rec.title}" - matches existing habit "${existingHabit.title}"`);
      }
      
      return !existingHabit;
    });
    
    console.log(`[AI Suggestions Modal] Filtering: ${allRecommendations.length} total → ${recommendations.length} available`);

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent 
          className="overflow-hidden p-6 sm:p-8"
          mobileVariant="bottom-sheet"
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
              AI Habit Recommendations
            </DialogTitle>
            <p className="text-gray-600 text-sm">
              Based on your preferences, here are some personalized habit
              suggestions:
            </p>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto mb-6">
            {recommendations.map((rec: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 sm:p-5 hover:bg-gray-50 cursor-pointer transition-colors hover:shadow-sm"
                onClick={() => useRecommendation(rec)}
              >
                <div className="flex items-start space-x-4 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: rec.color }}
                  >
                    <i className={rec.icon}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-base sm:text-lg mb-1">{rec.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
                    {rec.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-target text-xs"></i>
                    {rec.targetValue} {rec.unit}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-clock text-xs"></i>
                    {rec.reminderTime}
                  </span>
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setShowRecommendations(false)}
                className="w-full sm:flex-1 h-11 text-sm font-medium"
              >
                Create Custom Habit
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="w-full sm:flex-1 h-11 text-sm font-medium"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="overflow-hidden" // Let the component handle responsive sizing
        mobileVariant="bottom-sheet"
      >
        {/* Header - Mobile optimized */}
        <DialogHeader className={getMobileModalHeader(isMobile)}>
          <DialogTitle className={isMobile ? "text-xl" : "text-lg"}>
            Add New Habit
          </DialogTitle>
        </DialogHeader>

        {/* Form Content - Scrollable body */}
        <div className={getMobileModalBody(isMobile)}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={isMobile ? "space-y-5" : "space-y-4"}>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <ResponsiveFormField
                      label="Habit Title"
                      required
                      error={form.formState.errors.title?.message}
                      variant={isMobile && isTouchDevice ? "floating" : "default"}
                    >
                      <FormControl>
                        <ResponsiveInput
                          placeholder="e.g., Morning Meditation"
                          floatingLabel={isMobile && isTouchDevice}
                          icon={<i className="fas fa-check text-sm" />}
                          {...field}
                        />
                      </FormControl>
                    </ResponsiveFormField>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <ResponsiveFormField
                      label="Description"
                      error={form.formState.errors.description?.message}
                      variant={isMobile && isTouchDevice ? "floating" : "default"}
                    >
                      <FormControl>
                        <ResponsiveTextarea
                          placeholder="What does this habit involve?"
                          rows={isMobile ? 3 : 2}
                          floatingLabel={isMobile && isTouchDevice}
                          icon={<i className="fas fa-align-left text-sm" />}
                          {...field}
                        />
                      </FormControl>
                    </ResponsiveFormField>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CategorySelector
                        value={field.value}
                        onChange={(category) => {
                          field.onChange(category);
                          handleCategoryChange(category);
                        }}
                        onColorChange={(color) => form.setValue('color', color)}
                        onIconChange={(icon) => form.setValue('icon', icon)}
                        disabled={createHabitMutation.isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <ResponsiveGrid cols={isMobile ? 1 : 2} gap="md">
                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <ResponsiveFormField
                        label="Target"
                        required
                        error={form.formState.errors.targetValue?.message}
                        variant={isMobile && isTouchDevice ? "floating" : "default"}
                      >
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-10 w-10 p-0 shrink-0"
                              onClick={() => {
                                const newValue = Math.max(1, (field.value || 1) - 1);
                                field.onChange(newValue);
                              }}
                            >
                              -
                            </Button>
                            <ResponsiveInput
                              type="text"
                              placeholder="1"
                              value={field.value || 1}
                              className="text-center"
                              floatingLabel={isMobile && isTouchDevice}
                              icon={<i className="fas fa-target text-sm" />}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                const numValue = parseInt(value) || 1;
                                field.onChange(Math.max(1, numValue));
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-10 w-10 p-0 shrink-0"
                              onClick={() => {
                                const newValue = (field.value || 1) + 1;
                                field.onChange(newValue);
                              }}
                            >
                              +
                            </Button>
                          </div>
                        </FormControl>
                      </ResponsiveFormField>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <ResponsiveFormField
                        label="Unit"
                        required
                        error={form.formState.errors.unit?.message}
                        variant={isMobile && isTouchDevice ? "floating" : "default"}
                      >
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className={isMobile ? "h-12 text-base" : "h-10 text-sm"}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem 
                                  key={unit.value} 
                                  value={unit.value}
                                  className={isMobile ? "py-3" : "py-2"}
                                >
                                  <span className={isMobile ? "text-base" : "text-sm"}>{unit.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </ResponsiveFormField>
                    </FormItem>
                  )}
                />
              </ResponsiveGrid>

              <FormField
                control={form.control}
                name="reminderTime"
                render={({ field }) => (
                  <FormItem>
                    <ResponsiveFormField
                      label="Reminder Time"
                      error={form.formState.errors.reminderTime?.message}
                      variant={isMobile && isTouchDevice ? "floating" : "default"}
                    >
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={isMobile ? "h-12 text-base" : "h-10 text-sm"}>
                            <SelectValue placeholder="Select reminder time (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem 
                                key={time} 
                                value={time}
                                className={isMobile ? "py-3" : "py-2"}
                              >
                                <span className={isMobile ? "text-base" : "text-sm"}>{time}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </ResponsiveFormField>
                  </FormItem>
                )}
              />

              {/* Recurrence Pattern Selector */}
              <FormField
                control={form.control}
                name="recurrencePattern"
                render={({ field }) => (
                  <FormItem>
                    <ResponsiveFormField
                      label="How Often?"
                      required
                      error={form.formState.errors.recurrencePattern?.message}
                      variant={isMobile && isTouchDevice ? "floating" : "default"}
                    >
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={isMobile ? "h-12 text-base" : "h-10 text-sm"}>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">
                              <div className="flex items-center space-x-2">
                                <i className="fas fa-calendar-day text-blue-500"></i>
                                <span>Daily</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="weekly">
                              <div className="flex items-center space-x-2">
                                <i className="fas fa-calendar-week text-green-500"></i>
                                <span>Weekly</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="monthly">
                              <div className="flex items-center space-x-2">
                                <i className="fas fa-calendar-alt text-purple-500"></i>
                                <span>Monthly</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </ResponsiveFormField>
                  </FormItem>
                )}
              />

              {/* Selected Days Selector - Only show for weekly/monthly */}
              {form.watch("recurrencePattern") === "weekly" && (
                <FormField
                  control={form.control}
                  name="selectedDays"
                  render={({ field }) => (
                    <FormItem>
                      <ResponsiveFormField
                        label="Select Days"
                        required
                        error={form.formState.errors.selectedDays?.message}
                        variant={isMobile && isTouchDevice ? "floating" : "default"}
                      >
                        <FormControl>
                          <div className="grid grid-cols-7 gap-2">
                            {[
                              { value: 1, label: "Mon", short: "M" },
                              { value: 2, label: "Tue", short: "T" },
                              { value: 3, label: "Wed", short: "W" },
                              { value: 4, label: "Thu", short: "T" },
                              { value: 5, label: "Fri", short: "F" },
                              { value: 6, label: "Sat", short: "S" },
                              { value: 7, label: "Sun", short: "S" },
                            ].map((day) => (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => {
                                  const currentDays = field.value || [];
                                  const newDays = currentDays.includes(day.value)
                                    ? currentDays.filter((d: number) => d !== day.value)
                                    : [...currentDays, day.value];
                                  field.onChange(newDays);
                                }}
                                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                                  field.value?.includes(day.value)
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                <div className="hidden sm:block">{day.label}</div>
                                <div className="sm:hidden">{day.short}</div>
                              </button>
                            ))}
                          </div>
                        </FormControl>
                      </ResponsiveFormField>
                    </FormItem>
                  )}
                />
              )}

              {form.watch("recurrencePattern") === "monthly" && (
                <FormField
                  control={form.control}
                  name="selectedDays"
                  render={({ field }) => (
                    <FormItem>
                      <ResponsiveFormField
                        label="Select Days of Month"
                        required
                        error={form.formState.errors.selectedDays?.message}
                        variant={isMobile && isTouchDevice ? "floating" : "default"}
                      >
                        <FormControl>
                          <div className="grid grid-cols-7 gap-2 max-h-40 overflow-y-auto">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const currentDays = field.value || [];
                                  const newDays = currentDays.includes(day)
                                    ? currentDays.filter((d: number) => d !== day)
                                    : [...currentDays, day];
                                  field.onChange(newDays);
                                }}
                                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                                  field.value?.includes(day)
                                    ? "bg-purple-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </FormControl>
                      </ResponsiveFormField>
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
        </div>

        {/* Footer - Fixed at bottom with mobile optimization */}
        <div className={getMobileModalFooter(isMobile)}>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              onClose();
            }}
            className={getMobileButtonClasses('outline', isMobile)}
            disabled={createHabitMutation.isPending}
          >
            Cancel
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            onClick={loadRecommendations}
            className={getMobileButtonClasses('secondary', isMobile)}
          >
            <i className="fas fa-lightbulb mr-2"></i>
            {isMobile ? "AI Suggestions" : "AI Suggestions"}
          </Button>
          
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={createHabitMutation.isPending}
            className={getMobileButtonClasses('primary', isMobile)}
          >
            {createHabitMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                {isMobile ? "Creating..." : "Creating..."}
              </>
            ) : (
              <>
                <i className="fas fa-plus mr-2"></i>
                {isMobile ? "Create Habit" : "Create Habit"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
