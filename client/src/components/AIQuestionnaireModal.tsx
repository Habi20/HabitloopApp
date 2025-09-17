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
import { getMobileModalHeader, getMobileModalBody, getMobileModalFooter, getMobileButtonClasses, cn } from "@/lib/utils";
import { useScreenSize } from "@/hooks/use-mobile";
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
  const { isMobile } = useScreenSize();
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
      localStorage.setItem("carouselGeneratedAt", new Date().toISOString());
      
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
      <DialogContent 
        className="overflow-hidden"
        mobileVariant="bottom-sheet"
      >
        {/* Header - Mobile optimized */}
        <DialogHeader className={getMobileModalHeader(isMobile)}>
          <DialogTitle className={`${isMobile ? "text-lg" : "text-xl"} font-bold text-gray-900`}>
            Let's personalize your experience
          </DialogTitle>
        </DialogHeader>

        {/* Content - Scrollable body */}
        <div className={getMobileModalBody(isMobile)}>
        
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
            <div className="flex items-center justify-center space-x-2 text-muted-foreground text-sm">
              {step === 1 && (
                <>
                  <i className="fas fa-check-square text-blue-500"></i>
                  <span>Choose the areas that matter most to you (select multiple)</span>
                </>
              )}
              {step === 2 && (
                <>
                  <i className="fas fa-dot-circle text-green-500"></i>
                  <span>Choose one option - this helps us suggest the best times for your habits</span>
                </>
              )}
              {step === 3 && (
                <>
                  <i className="fas fa-dot-circle text-green-500"></i>
                  <span>Choose one option - your mindset affects habit success</span>
                </>
              )}
              {step === 4 && (
                <>
                  <i className="fas fa-dot-circle text-green-500"></i>
                  <span>Choose one option - understanding your motivation style helps personalize recommendations</span>
                </>
              )}
              {step === 5 && (
                <>
                  <i className="fas fa-dot-circle text-green-500"></i>
                  <span>Choose one option - knowing when you struggle helps us plan better</span>
                </>
              )}
              {step === 6 && (
                <>
                  <i className="fas fa-dot-circle text-green-500"></i>
                  <span>Choose one option - your response to setbacks shapes your habit strategy</span>
                </>
              )}
              {step === 7 && (
                <>
                  <i className="fas fa-dot-circle text-green-500"></i>
                  <span>Choose one option - identifying distractions helps us suggest focused habits</span>
                </>
              )}
              {step === 8 && (
                <>
                  <i className="fas fa-dot-circle text-green-500"></i>
                  <span>Choose one option - regular check-ins improve habit maintenance</span>
                </>
              )}
              {step === 9 && (
                <>
                  <i className="fas fa-dot-circle text-green-500"></i>
                  <span>Choose one option - your deeper motivation drives long-term success</span>
                </>
              )}
              {step === 10 && (
                <>
                  <i className="fas fa-dot-circle text-green-500"></i>
                  <span>Choose one option - this helps us calibrate difficulty levels</span>
                </>
              )}
            </div>
          </div>

          {step === 1 && (
            <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="focus-areas-label">
              <div id="focus-areas-label" className="sr-only">Select your focus areas</div>
              {focusAreas.map((area) => (
                <Button
                  key={area}
                  type="button"
                  variant={questionnaire.focusAreas.includes(area) ? "default" : "outline"}
                  onClick={() => toggleFocusArea(area)}
                  className={cn(
                    "h-auto p-4 text-left flex-col items-start relative",
                    questionnaire.focusAreas.includes(area) 
                      ? "ring-2 ring-blue-500 ring-offset-2" 
                      : "hover:ring-2 hover:ring-blue-200"
                  )}
                  aria-pressed={questionnaire.focusAreas.includes(area)}
                  aria-describedby={`focus-area-${area.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <i className={cn(
                      "fas text-sm",
                      questionnaire.focusAreas.includes(area) 
                        ? "fa-check-square text-white" 
                        : "fa-square text-gray-400"
                    )}></i>
                    <span className="font-medium">{area}</span>
                  </div>
                  <span id={`focus-area-${area.toLowerCase().replace(/\s+/g, '-')}`} className="sr-only">
                    {area} focus area
                  </span>
                </Button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3" role="radiogroup" aria-labelledby="motivation-time-label">
              <div id="motivation-time-label" className="sr-only">Select your motivation time</div>
              {motivationTimes.map((time) => (
                <Button
                  key={time.value}
                  type="button"
                  variant={questionnaire.motivationTime === time.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, motivationTime: time.value }))}
                  className={cn(
                    "w-full h-auto p-4 text-left flex-col items-start relative",
                    questionnaire.motivationTime === time.value 
                      ? "ring-2 ring-green-500 ring-offset-2" 
                      : "hover:ring-2 hover:ring-green-200"
                  )}
                  role="radio"
                  aria-checked={questionnaire.motivationTime === time.value}
                  aria-describedby={`motivation-time-${time.value}`}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <i className={cn(
                      "fas text-sm mt-0.5 flex-shrink-0",
                      questionnaire.motivationTime === time.value 
                        ? "fa-dot-circle text-white" 
                        : "fa-circle text-gray-400"
                    )}></i>
                    <div className="flex-1">
                      <span className="font-medium block">{time.label}</span>
                      <span id={`motivation-time-${time.value}`} className="text-sm text-muted-foreground">{time.description}</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3" role="radiogroup" aria-labelledby="mood-label">
              <div id="mood-label" className="sr-only">Select your current mood</div>
              {[
                { value: "excited", label: "Excited and ready!", desc: "I'm enthusiastic about starting new habits" },
                { value: "motivated", label: "Motivated but cautious", desc: "I want to change but know it takes work" },
                { value: "overwhelmed", label: "Overwhelmed", desc: "I have many goals but don't know where to start" },
                { value: "skeptical", label: "Skeptical", desc: "I've tried before and it didn't stick" },
                { value: "determined", label: "Determined", desc: "I'm committed to making lasting changes" }
              ].map((mood) => (
                <Button
                  key={mood.value}
                  type="button"
                  variant={questionnaire.mood === mood.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, mood: mood.value }))}
                  className={cn(
                    "w-full h-auto p-4 text-left flex-col items-start relative",
                    questionnaire.mood === mood.value 
                      ? "ring-2 ring-green-500 ring-offset-2" 
                      : "hover:ring-2 hover:ring-green-200"
                  )}
                  role="radio"
                  aria-checked={questionnaire.mood === mood.value}
                  aria-describedby={`mood-${mood.value}`}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <i className={cn(
                      "fas text-sm mt-0.5 flex-shrink-0",
                      questionnaire.mood === mood.value 
                        ? "fa-dot-circle text-white" 
                        : "fa-circle text-gray-400"
                    )}></i>
                    <div className="flex-1">
                      <span className="font-medium block">{mood.label}</span>
                      <span id={`mood-${mood.value}`} className="text-sm text-muted-foreground">{mood.desc}</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3" role="radiogroup" aria-labelledby="motivation-style-label">
              <div id="motivation-style-label" className="sr-only">Select your motivation style</div>
              {[
                { value: "achievement", label: "Achievement & Progress", desc: "I love checking things off and seeing results" },
                { value: "social", label: "Social Connection", desc: "I'm motivated by sharing with others" },
                { value: "competition", label: "Competition", desc: "I work best when competing with myself or others" },
                { value: "intrinsic", label: "Personal Growth", desc: "I'm driven by becoming the best version of myself" },
                { value: "external", label: "External Rewards", desc: "I like tangible rewards and recognition" }
              ].map((style) => (
                <Button
                  key={style.value}
                  type="button"
                  variant={questionnaire.motivationStyle === style.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, motivationStyle: style.value }))}
                  className={cn(
                    "w-full h-auto p-4 text-left flex-col items-start relative",
                    questionnaire.motivationStyle === style.value 
                      ? "ring-2 ring-green-500 ring-offset-2" 
                      : "hover:ring-2 hover:ring-green-200"
                  )}
                  role="radio"
                  aria-checked={questionnaire.motivationStyle === style.value}
                  aria-describedby={`motivation-style-${style.value}`}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <i className={cn(
                      "fas text-sm mt-0.5 flex-shrink-0",
                      questionnaire.motivationStyle === style.value 
                        ? "fa-dot-circle text-white" 
                        : "fa-circle text-gray-400"
                    )}></i>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block break-words">{style.label}</span>
                      <span id={`motivation-style-${style.value}`} className="text-sm text-muted-foreground block break-words">{style.desc}</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3" role="radiogroup" aria-labelledby="procrastination-time-label">
              <div id="procrastination-time-label" className="sr-only">Select when you procrastinate</div>
              {[
                { value: "morning", label: "Morning", desc: "I struggle to get started in the morning" },
                { value: "afternoon", label: "Afternoon", desc: "After lunch, I lose focus and motivation" },
                { value: "evening", label: "Evening", desc: "I get distracted after work hours" },
                { value: "tasks", label: "Difficult Tasks", desc: "I avoid challenging or uncomfortable activities" },
                { value: "rarely", label: "Rarely", desc: "I don't procrastinate much" }
              ].map((time) => (
                <Button
                  key={time.value}
                  type="button"
                  variant={questionnaire.procrastinationTime === time.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, procrastinationTime: time.value }))}
                  className={cn(
                    "w-full h-auto p-4 text-left flex-col items-start relative",
                    questionnaire.procrastinationTime === time.value 
                      ? "ring-2 ring-green-500 ring-offset-2" 
                      : "hover:ring-2 hover:ring-green-200"
                  )}
                  role="radio"
                  aria-checked={questionnaire.procrastinationTime === time.value}
                  aria-describedby={`procrastination-time-${time.value}`}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <i className={cn(
                      "fas text-sm mt-0.5 flex-shrink-0",
                      questionnaire.procrastinationTime === time.value 
                        ? "fa-dot-circle text-white" 
                        : "fa-circle text-gray-400"
                    )}></i>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block break-words">{time.label}</span>
                      <span id={`procrastination-time-${time.value}`} className="text-sm text-muted-foreground block break-words">{time.desc}</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3" role="radiogroup" aria-labelledby="missed-habit-reaction-label">
              <div id="missed-habit-reaction-label" className="sr-only">Select your reaction to missed habits</div>
              {[
                { value: "bounce-back", label: "Bounce back quickly", desc: "I don't dwell on it and get back on track" },
                { value: "frustrated", label: "Get frustrated", desc: "I feel disappointed but keep trying" },
                { value: "give-up", label: "Consider giving up", desc: "I start questioning if I can do this" },
                { value: "perfectionist", label: "All-or-nothing thinking", desc: "If I miss one day, I feel like I failed" },
                { value: "analyze", label: "Analyze what went wrong", desc: "I figure out why it happened and adjust" }
              ].map((reaction) => (
                <Button
                  key={reaction.value}
                  type="button"
                  variant={questionnaire.missedHabitReaction === reaction.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, missedHabitReaction: reaction.value }))}
                  className={cn(
                    "w-full h-auto p-4 text-left flex-col items-start relative",
                    questionnaire.missedHabitReaction === reaction.value 
                      ? "ring-2 ring-green-500 ring-offset-2" 
                      : "hover:ring-2 hover:ring-green-200"
                  )}
                  role="radio"
                  aria-checked={questionnaire.missedHabitReaction === reaction.value}
                  aria-describedby={`missed-habit-reaction-${reaction.value}`}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <i className={cn(
                      "fas text-sm mt-0.5 flex-shrink-0",
                      questionnaire.missedHabitReaction === reaction.value 
                        ? "fa-dot-circle text-white" 
                        : "fa-circle text-gray-400"
                    )}></i>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block break-words">{reaction.label}</span>
                      <span id={`missed-habit-reaction-${reaction.value}`} className="text-sm text-muted-foreground block break-words">{reaction.desc}</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3" role="radiogroup" aria-labelledby="main-distraction-label">
              <div id="main-distraction-label" className="sr-only">Select your main distraction</div>
              {[
                { value: "phone", label: "Phone & Social Media", desc: "I get pulled into scrolling and notifications" },
                { value: "people", label: "Other People", desc: "Friends, family, or colleagues interrupt my routine" },
                { value: "tv", label: "TV & Entertainment", desc: "I choose watching shows over productive habits" },
                { value: "fatigue", label: "Fatigue & Low Energy", desc: "I'm too tired to maintain good habits" },
                { value: "thoughts", label: "My Own Thoughts", desc: "Overthinking and self-doubt hold me back" }
              ].map((distraction) => (
                <Button
                  key={distraction.value}
                  type="button"
                  variant={questionnaire.mainDistraction === distraction.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, mainDistraction: distraction.value }))}
                  className={cn(
                    "w-full h-auto p-4 text-left flex-col items-start relative",
                    questionnaire.mainDistraction === distraction.value 
                      ? "ring-2 ring-green-500 ring-offset-2" 
                      : "hover:ring-2 hover:ring-green-200"
                  )}
                  role="radio"
                  aria-checked={questionnaire.mainDistraction === distraction.value}
                  aria-describedby={`main-distraction-${distraction.value}`}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <i className={cn(
                      "fas text-sm mt-0.5 flex-shrink-0",
                      questionnaire.mainDistraction === distraction.value 
                        ? "fa-dot-circle text-white" 
                        : "fa-circle text-gray-400"
                    )}></i>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block break-words">{distraction.label}</span>
                      <span id={`main-distraction-${distraction.value}`} className="text-sm text-muted-foreground block break-words">{distraction.desc}</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {step === 8 && (
            <div className="space-y-3" role="radiogroup" aria-labelledby="check-in-preference-label">
              <div id="check-in-preference-label" className="sr-only">Select your check-in preference</div>
              {[
                { value: "daily", label: "Daily", desc: "I want to track progress every day" },
                { value: "weekly", label: "Weekly", desc: "A weekly summary works best for me" },
                { value: "milestone", label: "Milestone-based", desc: "Check in when I reach specific goals" },
                { value: "monthly", label: "Monthly", desc: "I prefer less frequent, comprehensive reviews" },
                { value: "minimal", label: "Minimal", desc: "I like to work independently with little checking" }
              ].map((preference) => (
                <Button
                  key={preference.value}
                  type="button"
                  variant={questionnaire.checkInPreference === preference.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, checkInPreference: preference.value }))}
                  className={cn(
                    "w-full h-auto p-4 text-left flex-col items-start relative",
                    questionnaire.checkInPreference === preference.value 
                      ? "ring-2 ring-green-500 ring-offset-2" 
                      : "hover:ring-2 hover:ring-green-200"
                  )}
                  role="radio"
                  aria-checked={questionnaire.checkInPreference === preference.value}
                  aria-describedby={`check-in-preference-${preference.value}`}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <i className={cn(
                      "fas text-sm mt-0.5 flex-shrink-0",
                      questionnaire.checkInPreference === preference.value 
                        ? "fa-dot-circle text-white" 
                        : "fa-circle text-gray-400"
                    )}></i>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block break-words">{preference.label}</span>
                      <span id={`check-in-preference-${preference.value}`} className="text-sm text-muted-foreground block break-words">{preference.desc}</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {step === 9 && (
            <div className="space-y-3" role="radiogroup" aria-labelledby="habit-why-label">
              <div id="habit-why-label" className="sr-only">Select your main reason for building habits</div>
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
                  type="button"
                  variant={questionnaire.habitWhy === why.value ? "default" : "outline"}
                  onClick={() => setQuestionnaire(prev => ({ ...prev, habitWhy: why.value }))}
                  className={cn(
                    "w-full h-auto p-4 text-left flex-col items-start relative",
                    questionnaire.habitWhy === why.value 
                      ? "ring-2 ring-green-500 ring-offset-2" 
                      : "hover:ring-2 hover:ring-green-200"
                  )}
                  role="radio"
                  aria-checked={questionnaire.habitWhy === why.value}
                  aria-describedby={`habit-why-${why.value}`}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <i className={cn(
                      "fas text-sm mt-0.5 flex-shrink-0",
                      questionnaire.habitWhy === why.value 
                        ? "fa-dot-circle text-white" 
                        : "fa-circle text-gray-400"
                    )}></i>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block break-words">{why.label}</span>
                      <span id={`habit-why-${why.value}`} className="text-sm text-muted-foreground block break-words">{why.desc}</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {step === 10 && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Rate your consistency: {questionnaire.consistencyRating}/5</p>
                <div className="flex justify-center space-x-2 mb-4" role="radiogroup" aria-labelledby="consistency-rating-label">
                  <div id="consistency-rating-label" className="sr-only">Rate your consistency from 1 to 5</div>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant={questionnaire.consistencyRating === rating ? "default" : "outline"}
                      onClick={() => setQuestionnaire(prev => ({ ...prev, consistencyRating: rating }))}
                      className={cn(
                        "w-12 h-12 rounded-full relative",
                        questionnaire.consistencyRating === rating 
                          ? "ring-2 ring-green-500 ring-offset-2" 
                          : "hover:ring-2 hover:ring-green-200"
                      )}
                      role="radio"
                      aria-checked={questionnaire.consistencyRating === rating}
                      aria-label={`Rate ${rating} out of 5`}
                    >
                      <div className="flex items-center justify-center">
                        {questionnaire.consistencyRating === rating && (
                          <i className="fas fa-dot-circle text-white text-xs absolute -top-1 -right-1"></i>
                        )}
                        <span className="font-semibold">{rating}</span>
                      </div>
                    </Button>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground" id="consistency-description">
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
        </div>

        {/* Footer - Mobile optimized */}
        <div className={getMobileModalFooter(isMobile)}>
          <Button
            onClick={onClose}
            className={getMobileButtonClasses('outline', isMobile)}
          >
            {step === 1 ? 'Skip' : 'Cancel'}
          </Button>
          
          {step > 1 && (
            <Button
              onClick={() => setStep(step - 1)}
              className={getMobileButtonClasses('outline', isMobile)}
            >
              Back
            </Button>
          )}
          
          <Button
            onClick={nextStep}
            disabled={!canProceed() || generateRecommendationsMutation.isPending}
            className={getMobileButtonClasses('primary', isMobile)}
          >
            {step === totalSteps ? (
              generateRecommendationsMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Generating...
                </>
              ) : (
                "Complete"
              )
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
