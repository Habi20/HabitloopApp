import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const habitSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  targetValue: z.number().min(1, "Target must be at least 1"),
  unit: z.string().min(1, "Unit is required"),
  reminderTime: z.string().optional(),
  frequency: z.string().default("daily"),
  color: z.string().default("#6366F1"),
  icon: z.string().default("fas fa-check"),
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
  const queryClient = useQueryClient();
  const [showRecommendations, setShowRecommendations] = useState(false);

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
      await apiRequest("/api/habits", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
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
      }
    }
  };

  // Auto-load recommendations when modal opens (only if no specific recommendation selected)
  useEffect(() => {
    if (open && !selectedRecommendation) {
      loadRecommendations();
    } else if (!open) {
      // Reset form when modal closes
      form.reset();
      setShowRecommendations(false);
    }
  }, [open, selectedRecommendation, form]);

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

  if (showRecommendations) {
    const recommendations = JSON.parse(
      localStorage.getItem("habitRecommendations") || "[]"
    );

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              AI Habit Recommendations
            </DialogTitle>
            <p className="text-gray-600">
              Based on your preferences, here are some personalized habit
              suggestions:
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {recommendations.map((rec: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => useRecommendation(rec)}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: rec.color }}
                  >
                    <i className={rec.icon}></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {rec.category}
                  </span>
                  <span>
                    {rec.targetValue} {rec.unit}
                  </span>
                  <span>{rec.reminderTime}</span>
                </div>
              </div>
            ))}

            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRecommendations(false)}
                className="flex-1"
              >
                Create Custom Habit
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Add New Habit
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habit Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning Meditation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What does this habit involve?"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={handleCategoryChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            <div className="flex items-center space-x-2">
                              <i
                                className={`${category.icon} text-sm`}
                                style={{ color: category.color }}
                              ></i>
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reminderTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder Time</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reminder time (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onClose();
                }}
                className="flex-1"
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={loadRecommendations}
                className="flex-1"
              >
                <i className="fas fa-lightbulb mr-2"></i>
                AI Suggestions
              </Button>

              <Button
                type="submit"
                disabled={createHabitMutation.isPending}
                className="flex-1"
              >
                {createHabitMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus mr-2"></i>
                    Create Habit
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
