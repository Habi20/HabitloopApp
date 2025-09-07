import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Target, Clock, Star } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface HabitRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  unit: string;
  reminderTime: string;
  frequency: string;
  color: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  successRate: number;
  aiReasoning: string;
  benefits: string[];
  tips: string[];
}

interface CarouselProps {
  onHabitAdd?: (habit: HabitRecommendation) => void;
}

export function HabitRecommendationCarousel({ onHabitAdd }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, clearUserSpecificData, refreshQuestionnaireData } = useAuth();

  // Clear stored recommendations when component mounts if they exist
  useEffect(() => {
    const storedRecommendations = localStorage.getItem('habitRecommendations');
    if (storedRecommendations) {
      console.log('Found stored recommendations, will use them');
    }
  }, []);

  // Clear user-specific data when user changes
  useEffect(() => {
    if (user?.id) {
      const storedUserId = localStorage.getItem('currentUserId');
      if (storedUserId && storedUserId !== user.id) {
        console.log('User changed, clearing previous user data');
        clearUserSpecificData();
        // Store current user ID to track changes
        localStorage.setItem('currentUserId', user.id);
      } else if (!storedUserId) {
        // First time user, store their ID
        localStorage.setItem('currentUserId', user.id);
        // Refresh questionnaire data for new user
        refreshQuestionnaireData();
      }
    }
  }, [user?.id, clearUserSpecificData, refreshQuestionnaireData]);

  // Fetch user's existing habits to filter out already added ones
  const { data: existingHabitsResponse } = useQuery({
    queryKey: ['/api/habits'],
    queryFn: async () => {
      try {
        const response = await apiRequest('habits', 'GET');
        const data = await response.json();
        console.log('Habits API response:', data);
        return data;
      } catch (error) {
        console.error('Error fetching existing habits:', error);
        return { success: true, habits: [], count: 0 };
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Ensure existingHabits is always an array
  const existingHabits = Array.isArray(existingHabitsResponse?.habits) 
    ? existingHabitsResponse.habits 
    : [];

  // Debug logging
  console.log('Existing habits response:', existingHabitsResponse);
  console.log('Existing habits array:', existingHabits);
  console.log('Is array?', Array.isArray(existingHabits));

  // Fetch AI-powered recommendations
  const { data: allRecommendations = [], isLoading } = useQuery<HabitRecommendation[]>({
    queryKey: ['/api/ai/recommendations'],
    queryFn: async () => {
      // First try to get recommendations from localStorage (from questionnaire)
      const storedRecommendations = localStorage.getItem('habitRecommendations');
      if (storedRecommendations) {
        try {
          const parsed = JSON.parse(storedRecommendations);
          console.log('Using stored recommendations from localStorage:', parsed);
          
          // Map the stored recommendations to the expected structure
          const mappedRecommendations = parsed.map((rec: any) => ({
            id: rec.id || Math.random().toString(),
            title: rec.title,
            description: rec.description,
            category: rec.category,
            targetValue: rec.targetValue || 1,
            unit: rec.unit || 'times',
            reminderTime: rec.reminderTime || null,
            frequency: rec.frequency || 'daily',
            color: rec.color || '#6366F1',
            icon: rec.icon || 'fas fa-check',
            difficulty: rec.difficulty || 'medium',
            successRate: rec.successRate || 75,
            aiReasoning: rec.aiReasoning || rec.reasoning || 'This habit is personalized based on your preferences and goals.',
            benefits: rec.benefits || rec.keyBenefits || ['Improved focus', 'Better habits', 'Personal growth'],
            tips: rec.tips || rec.successTips || ['Start small', 'Be consistent', 'Track your progress']
          }));
          
          console.log('Mapped recommendations from localStorage:', mappedRecommendations[0]);
          return mappedRecommendations;
        } catch (error) {
          console.error('Error parsing stored recommendations from localStorage:', error);
        }
      }
      
      // Try to get recommendations from user's database profile
      try {
        const userResponse = await apiRequest('user', 'GET');
        const userData = await userResponse.json();
        
        if (userData.user?.aiRecommendations && userData.user.aiRecommendations.length > 0) {
          console.log('Using AI recommendations from user profile:', userData.user.aiRecommendations);
          
          const dbRecommendations = userData.user.aiRecommendations.map((rec: any) => ({
            id: rec.id || Math.random().toString(),
            title: rec.title,
            description: rec.description,
            category: rec.category,
            targetValue: rec.targetValue || 1,
            unit: rec.unit || 'times',
            reminderTime: rec.reminderTime || null,
            frequency: rec.frequency || 'daily',
            color: rec.color || '#6366F1',
            icon: rec.icon || 'fas fa-check',
            difficulty: rec.difficulty || 'medium',
            successRate: rec.successRate || 75,
            aiReasoning: rec.aiReasoning || rec.reasoning || 'This habit is personalized based on your preferences and goals.',
            benefits: rec.benefits || rec.keyBenefits || ['Improved focus', 'Better habits', 'Personal growth'],
            tips: rec.tips || rec.successTips || ['Start small', 'Be consistent', 'Track your progress']
          }));
          
          console.log('Mapped AI recommendations from database:', dbRecommendations[0]);
          return dbRecommendations;
        }
        
        // Also check for questionnaire recommendations (legacy format)
        if (userData.user?.questionnaire?.recommendations) {
          console.log('Using legacy questionnaire recommendations from user profile:', userData.user.questionnaire.recommendations);
          
          const dbRecommendations = userData.user.questionnaire.recommendations.map((rec: any) => ({
            id: rec.id || Math.random().toString(),
            title: rec.title,
            description: rec.description,
            category: rec.category,
            targetValue: rec.targetValue || 1,
            unit: rec.unit || 'times',
            reminderTime: rec.reminderTime || null,
            frequency: rec.frequency || 'daily',
            color: rec.color || '#6366F1',
            icon: rec.icon || 'fas fa-check',
            difficulty: rec.difficulty || 'medium',
            successRate: rec.successRate || 75,
            aiReasoning: rec.aiReasoning || rec.reasoning || 'This habit is personalized based on your preferences and goals.',
            benefits: rec.benefits || rec.keyBenefits || ['Improved focus', 'Better habits', 'Personal growth'],
            tips: rec.tips || rec.successTips || ['Start small', 'Be consistent', 'Track your progress']
          }));
          
          console.log('Mapped legacy recommendations from database:', dbRecommendations[0]);
          return dbRecommendations;
        }
      } catch (error) {
        console.error('Error fetching recommendations from user profile:', error);
      }
      
      // Don't fall back to generic API - only show AI-generated recommendations
      console.log('No AI recommendations found, showing empty state');
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter out recommendations that already exist as habits
  const recommendations = allRecommendations.filter(recommendation => {
    // Safety check: ensure existingHabits is an array and has valid items
    if (!Array.isArray(existingHabits) || existingHabits.length === 0) {
      return true; // Show all recommendations if no existing habits
    }

    // Check if a habit with the same title or very similar description already exists
    const alreadyExists = existingHabits.some((habit: any) => {
      // Safety check: ensure habit has required properties
      if (!habit || typeof habit !== 'object') {
        return false;
      }

      const titleMatch = habit.title && recommendation.title ? 
        habit.title.toLowerCase().trim() === recommendation.title.toLowerCase().trim() 
        : false;
      
      // Also check for similar descriptions (to catch cases where titles might be slightly different)
      const descriptionSimilarity = habit.description && recommendation.description ? 
        habit.description.toLowerCase().includes(recommendation.description.toLowerCase().split(' ').slice(0, 3).join(' ')) ||
        recommendation.description.toLowerCase().includes(habit.description.toLowerCase().split(' ').slice(0, 3).join(' '))
        : false;
      
      return titleMatch || descriptionSimilarity;
    });
    
    if (alreadyExists) {
      console.log(`Filtering out already added habit: ${recommendation.title}`);
    }
    
    return !alreadyExists;
  });

  // Log filtering results for debugging
  if (allRecommendations.length > 0) {
    console.log(`Carousel filtering: ${allRecommendations.length} total recommendations, ${recommendations.length} available after filtering`);
  }

  // Add habit mutation
  const addHabitMutation = useMutation({
    mutationFn: async (recommendation: HabitRecommendation) => {
      // Check if habit already exists to prevent duplicates
      const habitExists = existingHabits.some((habit: any) => 
        habit.title.toLowerCase() === recommendation.title.toLowerCase() ||
        habit.description.toLowerCase() === recommendation.description.toLowerCase()
      );
      
      if (habitExists) {
        throw new Error('Habit already exists');
      }
      
      // Simulate haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Map recommendation to the exact habit schema structure
      const habitData = {
        title: recommendation.title,
        description: recommendation.description,
        category: recommendation.category,
        targetValue: recommendation.targetValue || 1,
        unit: recommendation.unit || 'times',
        reminderTime: recommendation.reminderTime || null,
        frequency: recommendation.frequency || 'daily',
        isActive: true,
        color: recommendation.color || '#6366F1',
        icon: recommendation.icon || 'fas fa-check'
      };
      
      console.log('Adding habit with data:', habitData);
      return await apiRequest('habits', 'POST', habitData);
    },
    onSuccess: (_habitData, variables) => {
      // Success haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
      
      toast({
        title: "Habit Added Successfully! 🎉",
        description: "Your new habit has been added to your tracking list.",
      });
      
      // Call onHabitAdd callback if provided
      if (onHabitAdd) {
        onHabitAdd(variables);
      }
      
      // Remove only the added recommendation from localStorage
      const storedRecommendations = localStorage.getItem('habitRecommendations');
      if (storedRecommendations) {
        try {
          const recommendations = JSON.parse(storedRecommendations);
          const updatedRecommendations = recommendations.filter((rec: any) => 
            rec.title !== variables.title || rec.description !== variables.description
          );
          
          if (updatedRecommendations.length > 0) {
            localStorage.setItem('habitRecommendations', JSON.stringify(updatedRecommendations));
          } else {
            localStorage.removeItem('habitRecommendations');
          }
        } catch (error) {
          console.error('Error updating stored recommendations:', error);
        }
      }
      
             // Invalidate habits query to refresh the habit list and update filtering
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
      
      // Update recommendations cache to remove the added recommendation
      queryClient.setQueryData(['/api/ai/recommendations'], (oldData: HabitRecommendation[] | undefined) => {
        if (!oldData) return oldData;
        
        const updatedRecommendations = oldData.filter(rec => 
          rec.title !== variables.title || rec.description !== variables.description
        );
        
        console.log(`Removed ${variables.title} from recommendations cache. ${updatedRecommendations.length} recommendations remaining.`);
        return updatedRecommendations;
      });
      
      // Move to next recommendation with delay for user to see success
      setTimeout(() => {
        handleNext();
      }, 1000);
    },
    onError: (error) => {
      // Error haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
      if (error instanceof Error && error.message === 'Habit already exists') {
        toast({
          title: "Habit Already Exists",
          description: "This habit is already in your list.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add habit. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Swipe detection
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // Calculate drag offset for visual feedback
    const offset = currentTouch - touchStart;
    const maxOffset = 100; // Maximum drag distance
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset));
    setDragOffset(clampedOffset);
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    setDragOffset(0);
    
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  const handleNext = () => {
    if (isAnimating || recommendations.length === 0) return;
    
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % recommendations.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handlePrevious = () => {
    if (isAnimating || recommendations.length === 0) return;
    
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + recommendations.length) % recommendations.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className="w-full h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 animate-spin" />
            <span>Generating AI recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations.length) {
    return (
      <Card className="w-full h-96">
        <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
          <Sparkles className="w-12 h-12 text-gray-400" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {allRecommendations.length > 0 ? 'All Recommendations Added!' : 'Complete AI Questionnaire'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {allRecommendations.length > 0 
                ? 'You\'ve added all the recommended habits. Great job! 🎉'
                : 'Take the AI questionnaire to get personalized habit recommendations tailored to your preferences and goals.'
              }
            </p>
            {allRecommendations.length > 0 ? (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/habits'}
                  className="text-sm"
                >
                  View My Habits
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                  className="text-sm"
                >
                  Go to Home
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentRecommendation = recommendations[currentIndex];

  // Safety check for currentRecommendation
  if (!currentRecommendation) {
    return (
      <Card className="w-full h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No Recommendation Available</h3>
            <p className="text-sm text-gray-600 mt-1">
              Unable to load the current recommendation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">AI Habit Recommendations</h3>
        </div>
        
        <div className="flex items-center space-x-1">
          {recommendations.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="relative">
        <Card 
          className={`w-full h-96 transition-transform duration-300 cursor-grab active:cursor-grabbing ${
            isAnimating ? 'scale-95' : 'scale-100'
          } ${isDragging ? 'scale-98' : ''}`}
          style={{
            transform: isDragging ? `translateX(${dragOffset}px) scale(0.98)` : undefined,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center space-x-2">
                  <i className={`${currentRecommendation.icon || 'fas fa-check'} text-2xl`}></i>
                  <span>{currentRecommendation.title || 'Habit Recommendation'}</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  {currentRecommendation.description || 'A personalized habit recommendation for you.'}
                </CardDescription>
              </div>
              
              <div className="flex flex-col items-end space-y-1">
                <Badge variant="secondary" className={getDifficultyColor(currentRecommendation.difficulty || 'medium')}>
                  {currentRecommendation.difficulty || 'medium'}
                </Badge>
                <div className={`text-sm font-medium ${getSuccessRateColor(currentRecommendation.successRate || 75)}`}>
                  {currentRecommendation.successRate || 75}% success rate
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Habit Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span>{currentRecommendation.targetValue || 1} {currentRecommendation.unit || 'time'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{currentRecommendation.reminderTime || '09:00'}</span>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-900 text-sm">Why AI Recommends This</h4>
                  <p className="text-purple-800 text-sm mt-1">{currentRecommendation.aiReasoning || 'This habit is personalized based on your preferences and goals.'}</p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h4 className="font-medium text-sm mb-2">Key Benefits</h4>
              <div className="flex flex-wrap gap-2">
                {(currentRecommendation.benefits || []).slice(0, 3).map((benefit, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div>
              <h4 className="font-medium text-sm mb-2">Success Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {(currentRecommendation.tips || []).slice(0, 2).map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Star className="w-3 h-3 mt-1 text-yellow-500 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white shadow-lg"
          onClick={handlePrevious}
          disabled={isAnimating}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white shadow-lg"
          onClick={handleNext}
          disabled={isAnimating}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-4">
        <Button
          onClick={() => addHabitMutation.mutate(currentRecommendation)}
          disabled={addHabitMutation.isPending}
          className="flex-1"
        >
          <Plus className="w-4 h-4 mr-2" />
          {addHabitMutation.isPending ? 'Adding...' : 'Add This Habit'}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={isAnimating}
        >
          Skip
        </Button>
      </div>

      {/* Swipe Instructions */}
      <p className="text-xs text-gray-500 text-center mt-2">
        Swipe left/right or use arrows to browse recommendations
      </p>
    </div>
  );
}