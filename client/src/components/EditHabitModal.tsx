import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/contexts/AuthContext";
import { Habit } from "@/types";
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: ["/api/habits", user?.id] });
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
      <DialogContent 
        className="overflow-hidden" // Let the component handle responsive sizing
        mobileVariant="bottom-sheet"
      >
        {/* Header - Mobile optimized */}
        <DialogHeader className={getMobileModalHeader(isMobile)}>
          <DialogTitle className={isMobile ? "text-xl" : "text-lg"}>
            Edit Habit
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
                          placeholder="e.g., Drink water"
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
                          placeholder="Optional description of your habit"
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
                    <ResponsiveFormField
                      label="Category"
                      required
                      error={form.formState.errors.category?.message}
                      variant={isMobile && isTouchDevice ? "floating" : "default"}
                    >
                      <FormControl>
                        <Select
                          onValueChange={handleCategoryChange}
                          value={field.value}
                        >
                          <SelectTrigger className={isMobile ? "h-12 text-base" : "h-10 text-sm"}>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem 
                                key={category.value} 
                                value={category.value}
                                className={isMobile ? "py-3" : "py-2"}
                              >
                                <div className="flex items-center">
                                  <i
                                    className={`${category.icon} mr-2`}
                                    style={{ color: category.color }}
                                  ></i>
                                  <span className={isMobile ? "text-base" : "text-sm"}>{category.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </ResponsiveFormField>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                            <SelectValue placeholder="Select reminder time" />
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
            </form>
          </Form>
        </div>

        {/* Footer - Fixed at bottom with mobile optimization */}
        <div className={getMobileModalFooter(isMobile)}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={getMobileButtonClasses('outline', isMobile)}
            disabled={updateHabitMutation.isPending}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateHabitMutation.isPending}
            className={getMobileButtonClasses('primary', isMobile)}
          >
            {updateHabitMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                {isMobile ? "Updating..." : "Updating..."}
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                {isMobile ? "Update Habit" : "Update Habit"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
