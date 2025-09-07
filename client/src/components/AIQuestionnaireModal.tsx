import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
// import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";

interface AIQuestionnaireModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function AIQuestionnaireModal({ open, onClose, onComplete }: AIQuestionnaireModalProps) {
  const { toast } = useToast();

  const [, setLocation] = useLocation();
  
  const [questionnaire, setQuestionnaire] = useState({
    focusAreas: [] as string[],
    motivationTime: "",
    currentHabits: [] as string[],
    goals: [] as string[],
    mood: "",
    motivationStyle: "",
    procrastinationTime: "",
    habitTime: "",
    missedHabitReaction: "",
    mainDistraction: "",
    checkInPreference: "",
    habitWhy: "",
    consistencyRating: 3,
    habitDerailments: [] as string[],
  });

  const [step, setStep] = useState(1);
  const totalSteps = 10;

  const focusAreas = [
    "Health & Fitness",
    "Learning",
    "Productivity", 
    "Mindfulness",
    "Social",
    "Creative"
  ];

  const motivationTimes = [
    { value: "morning", label: "Early morning (6-9 AM)", description: "Fresh start with high energy" },
    { value: "midday", label: "Mid-day (12-3 PM)", description: "Post-lunch motivation boost" },
    { value: "evening", label: "Evening (6-9 PM)", description: "Wind down with purposeful activities" },
  ];

  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      console.log("Sending questionnaire data:", JSON.stringify(questionnaire, null, 2));
      const response = await apiRequest("ai/questionnaire", "POST", questionnaire);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Received recommendations:", data);
      
      // Store recommendations for later use
      localStorage.setItem("habitRecommendations", JSON.stringify(data.recommendations));
      
      // Mark questionnaire as completed
      localStorage.setItem("questionnaireCompleted", "true");
      localStorage.setItem("questionnaireData", JSON.stringify(questionnaire));
      
      toast({
        title: "Questionnaire Completed!",
        description: "Your personalized habits are ready. Let's set them up!",
      });
      
      // Call onComplete callback if provided
      onComplete?.();
      
      onClose();
      setLocation("/habits");
    },
    onError: (error) => {
      console.error("Error generating recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleFocusArea = (area: string) => {
    setQuestionnaire(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return questionnaire.focusAreas.length > 0;
      case 2: return questionnaire.motivationTime !== "";
      case 3: return questionnaire.mood !== "";
      case 4: return questionnaire.motivationStyle !== "";
      case 5: return questionnaire.procrastinationTime !== "";
      case 6: return questionnaire.missedHabitReaction !== "";
      case 7: return questionnaire.mainDistraction !== "";
      case 8: return questionnaire.checkInPreference !== "";
      case 9: return questionnaire.habitWhy !== "";
      case 10: return questionnaire.consistencyRating > 0;
      default: return true;
    }
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Only generate recommendations if all questions are answered
      if (canProceed()) {
        generateRecommendationsMutation.mutate();
      } else {
        toast({
          title: "Incomplete Questionnaire",
          description: "Please answer all questions before generating recommendations.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
              <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Let's personalize your experience
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Step {step} of {totalSteps}</span>
                <span>{Math.round((step / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {step === 1 && "What areas do you want to focus on?"}
              {step === 2 && "When are you most motivated?"}
              {step === 3 && "How are you feeling about building new habits?"}
              {step === 4 && "What motivates you most?"}
              {step === 5 && "When do you tend to procrastinate?"}
              {step === 6 && "How do you typically react when you miss a habit?"}
              {step === 7 && "What's your main distraction?"}
              {step === 8 && "How often would you like progress check-ins?"}
              {step === 9 && "What's your main reason for building these habits?"}
              {step === 10 && "How consistent are you with current routines?"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {step === 1 && "Choose the areas that matter most to you"}
              {step === 2 && "This helps us suggest the best times for your habits"}
              {step === 3 && "Your mindset affects habit success"}
              {step === 4 && "Understanding your motivation style helps personalize recommendations"}
              {step === 5 && "Knowing when you struggle helps us plan better"}
              {step === 6 && "Your response to setbacks shapes your habit strategy"}
              {step === 7 && "Identifying distractions helps us suggest focused habits"}
              {step === 8 && "Regular check-ins improve habit maintenance"}
              {step === 9 && "Your deeper motivation drives long-term success"}
              {step === 10 && "This helps us calibrate difficulty levels"}
            </p>
          </div>

          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {focusAreas.map((area) => (
                <Button
                  key={area}
                  variant={questionnaire.focusAreas.includes(area) ? "default" : "outline"}
                  onClick={() => toggleFocusArea(area)}
                  className="h-auto p-4 text-left flex-col items-start"
                >
                  <span className="font-medium">{area}</span>
                </Button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {motivationTimes.map((time) => (
                <Button
                  key={time.value}
                  variant={questionnaire.motivationTime === time.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, motivationTime: time.value }))}
                  className="w-full h-auto p-4 text-left flex-col items-start"
                >
                  <span className="font-medium">{time.label}</span>
                  <span className="text-sm text-muted-foreground">{time.description}</span>
                </Button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {[
                { value: "excited", label: "Excited and ready!", desc: "I'm enthusiastic about starting new habits" },
                { value: "motivated", label: "Motivated but cautious", desc: "I want to change but know it takes work" },
                { value: "overwhelmed", label: "Overwhelmed", desc: "I have many goals but don't know where to start" },
                { value: "skeptical", label: "Skeptical", desc: "I've tried before and it didn't stick" },
                { value: "determined", label: "Determined", desc: "I'm committed to making lasting changes" }
              ].map((mood) => (
                <Button
                  key={mood.value}
                  variant={questionnaire.mood === mood.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, mood: mood.value }))}
                  className="w-full h-auto p-4 text-left flex-col items-start"
                >
                  <span className="font-medium">{mood.label}</span>
                  <span className="text-sm text-muted-foreground">{mood.desc}</span>
                </Button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              {[
                { value: "achievement", label: "Achievement & Progress", desc: "I love checking things off and seeing results" },
                { value: "social", label: "Social Connection", desc: "I'm motivated by sharing with others" },
                { value: "competition", label: "Competition", desc: "I work best when competing with myself or others" },
                { value: "intrinsic", label: "Personal Growth", desc: "I'm driven by becoming the best version of myself" },
                { value: "external", label: "External Rewards", desc: "I like tangible rewards and recognition" }
              ].map((style) => (
                <Button
                  key={style.value}
                  variant={questionnaire.motivationStyle === style.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, motivationStyle: style.value }))}
                  className="w-full h-auto p-4 text-left flex-col items-start"
                >
                  <span className="font-medium">{style.label}</span>
                  <span className="text-sm text-muted-foreground">{style.desc}</span>
                </Button>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              {[
                { value: "morning", label: "Morning", desc: "I struggle to get started in the morning" },
                { value: "afternoon", label: "Afternoon", desc: "After lunch, I lose focus and motivation" },
                { value: "evening", label: "Evening", desc: "I get distracted after work hours" },
                { value: "tasks", label: "Difficult Tasks", desc: "I avoid challenging or uncomfortable activities" },
                { value: "rarely", label: "Rarely", desc: "I don't procrastinate much" }
              ].map((time) => (
                <Button
                  key={time.value}
                  variant={questionnaire.procrastinationTime === time.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, procrastinationTime: time.value }))}
                  className="w-full h-auto p-4 text-left flex-col items-start"
                >
                  <span className="font-medium">{time.label}</span>
                  <span className="text-sm text-muted-foreground">{time.desc}</span>
                </Button>
              ))}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              {[
                { value: "bounce-back", label: "Bounce back quickly", desc: "I don't dwell on it and get back on track" },
                { value: "frustrated", label: "Get frustrated", desc: "I feel disappointed but keep trying" },
                { value: "give-up", label: "Consider giving up", desc: "I start questioning if I can do this" },
                { value: "perfectionist", label: "All-or-nothing thinking", desc: "If I miss one day, I feel like I failed" },
                { value: "analyze", label: "Analyze what went wrong", desc: "I figure out why it happened and adjust" }
              ].map((reaction) => (
                <Button
                  key={reaction.value}
                  variant={questionnaire.missedHabitReaction === reaction.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, missedHabitReaction: reaction.value }))}
                  className="w-full h-auto p-4 text-left flex-col items-start"
                >
                  <span className="font-medium">{reaction.label}</span>
                  <span className="text-sm text-muted-foreground">{reaction.desc}</span>
                </Button>
              ))}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3">
              {[
                { value: "phone", label: "Phone & Social Media", desc: "I get pulled into scrolling and notifications" },
                { value: "people", label: "Other People", desc: "Friends, family, or colleagues interrupt my routine" },
                { value: "tv", label: "TV & Entertainment", desc: "I choose watching shows over productive habits" },
                { value: "fatigue", label: "Fatigue & Low Energy", desc: "I'm too tired to maintain good habits" },
                { value: "thoughts", label: "My Own Thoughts", desc: "Overthinking and self-doubt hold me back" }
              ].map((distraction) => (
                <Button
                  key={distraction.value}
                  variant={questionnaire.mainDistraction === distraction.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, mainDistraction: distraction.value }))}
                  className="w-full h-auto p-4 text-left flex-col items-start"
                >
                  <span className="font-medium">{distraction.label}</span>
                  <span className="text-sm text-muted-foreground">{distraction.desc}</span>
                </Button>
              ))}
            </div>
          )}

          {step === 8 && (
            <div className="space-y-3">
              {[
                { value: "daily", label: "Daily", desc: "I want to track progress every day" },
                { value: "weekly", label: "Weekly", desc: "A weekly summary works best for me" },
                { value: "milestone", label: "Milestone-based", desc: "Check in when I reach specific goals" },
                { value: "monthly", label: "Monthly", desc: "I prefer less frequent, comprehensive reviews" },
                { value: "minimal", label: "Minimal", desc: "I like to work independently with little checking" }
              ].map((preference) => (
                <Button
                  key={preference.value}
                  variant={questionnaire.checkInPreference === preference.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, checkInPreference: preference.value }))}
                  className="w-full h-auto p-4 text-left flex-col items-start"
                >
                  <span className="font-medium">{preference.label}</span>
                  <span className="text-sm text-muted-foreground">{preference.desc}</span>
                </Button>
              ))}
            </div>
          )}

          {step === 9 && (
            <div className="space-y-3">
              {[
                { value: "health", label: "Better Health", desc: "I want to feel stronger, healthier, and more energetic" },
                { value: "productivity", label: "Increased Productivity", desc: "I want to accomplish more and reach my goals" },
                { value: "happiness", label: "Greater Happiness", desc: "I want to feel more fulfilled and content" },
                { value: "growth", label: "Personal Growth", desc: "I want to become the best version of myself" },
                { value: "relationships", label: "Better Relationships", desc: "I want to improve my connections with others" },
                { value: "confidence", label: "More Confidence", desc: "I want to feel more capable and self-assured" }
              ].map((why) => (
                <Button
                  key={why.value}
                  variant={questionnaire.habitWhy === why.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, habitWhy: why.value }))}
                  className="w-full h-auto p-4 text-left flex-col items-start"
                >
                  <span className="font-medium">{why.label}</span>
                  <span className="text-sm text-muted-foreground">{why.desc}</span>
                </Button>
              ))}
            </div>
          )}

          {step === 10 && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Rate your consistency: {questionnaire.consistencyRating}/5</p>
                <div className="flex justify-center space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant={questionnaire.consistencyRating === rating ? "default" : "outline"}
                      onClick={() => setQuestionnaire(prev => ({ ...prev, consistencyRating: rating }))}
                      className="w-12 h-12 rounded-full"
                    >
                      {rating}
                    </Button>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {questionnaire.consistencyRating === 1 && "I struggle to stick with routines"}
                  {questionnaire.consistencyRating === 2 && "I'm inconsistent but trying"}
                  {questionnaire.consistencyRating === 3 && "I'm moderately consistent"}
                  {questionnaire.consistencyRating === 4 && "I'm quite consistent with most things"}
                  {questionnaire.consistencyRating === 5 && "I'm very disciplined and consistent"}
                </div>
              </div>
              
              <div>
                <p className="font-medium mb-3">What typically derails your habits? (Optional)</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "Lack of time",
                    "Forgetting",
                    "Loss of motivation",
                    "Competing priorities",
                    "Perfectionism",
                    "Social pressure",
                    "Stress or anxiety"
                  ].map((derailment) => (
                    <Button
                      key={derailment}
                      variant={questionnaire.habitDerailments.includes(derailment) ? "default" : "outline"}
                      onClick={() => setQuestionnaire(prev => ({
                        ...prev,
                        habitDerailments: prev.habitDerailments.includes(derailment)
                          ? prev.habitDerailments.filter(d => d !== derailment)
                          : [...prev.habitDerailments, derailment]
                      }))}
                      className="text-left justify-start h-auto p-3"
                    >
                      {derailment}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}

            <Button 
              onClick={nextStep}
              disabled={!canProceed() || generateRecommendationsMutation.isPending}
              className="flex-1"
            >
              {step === totalSteps ? (
                generateRecommendationsMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Generating...
                  </>
                ) : (
                  "Done"
                )
              ) : (
                "Next"
              )}
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="flex space-x-2 justify-center">
            {[1, 2].map(i => (
              <div 
                key={i}
                className={`w-2 h-2 rounded-full ${i <= step ? 'bg-primary' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
