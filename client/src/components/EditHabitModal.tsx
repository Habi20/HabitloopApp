import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Habit } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface EditHabitModalProps {
  open: boolean;
  onClose: () => void;
  habit: Habit;
}

export function EditHabitModal({ open, onClose, habit }: EditHabitModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Populate form with habit data when modal opens
  useEffect(() => {
    if (habit && open) {
      form.setValue("title", habit.title || "");
      form.setValue("description", habit.description || "");
      form.setValue("category", habit.category || "");
      form.setValue("targetValue", habit.targetValue || 1);
      form.setValue("unit", habit.unit || "times");
      form.setValue("reminderTime", habit.reminderTime || "");
      form.setValue("frequency", habit.frequency || "daily");
      form.setValue("color", habit.color || "#6366F1");
      form.setValue("icon", habit.icon || "fas fa-check");
    }
  }, [habit, open, form]);

  const updateHabitMutation = useMutation({
    mutationFn: async (data: HabitFormData) => {
      await apiRequest(`habits/${habit.id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Success",
        description: "Habit updated successfully!",
      });
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
        description: "Failed to update habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HabitFormData) => {
    updateHabitMutation.mutate(data);
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

  const handleCategoryChange = (category: string) => {
    const categoryData = categories.find((c) => c.value === category);
    if (categoryData) {
      form.setValue("category", category);
      form.setValue("color", categoryData.color);
      form.setValue("icon", categoryData.icon);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Edit Habit
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
                    <Input placeholder="e.g., Drink water" {...field} />
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
                      placeholder="Optional description of your habit"
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
                  <Select
                    onValueChange={handleCategoryChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center">
                            <i
                              className={`${category.icon} mr-2`}
                              style={{ color: category.color }}
                            ></i>
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reminder time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateHabitMutation.isPending}
                className="flex-1"
              >
                {updateHabitMutation.isPending ? "Updating..." : "Update Habit"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
