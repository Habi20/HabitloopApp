import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Target, Clock, Star } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to map frequency to selectedDays for calendar sync
function getSelectedDaysForFrequency(frequency: string): number[] | null {
  switch (frequency.toLowerCase()) {
    case 'daily':
      return null; // Daily habits don't need selectedDays
    case 'weekly':
      // Default to weekdays (Monday-Friday) for weekly habits
      return [1, 2, 3, 4, 5]; // Mon, Tue, Wed, Thu, Fri
    case 'monthly':
      // Default to 1st and 15th of the month for monthly habits
      return [1, 15];
    default:
      return null; // Fallback to daily behavior
  }
}

interface HabitRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  unit: string;
  reminderTime: string;
  frequency: string;
  recurrencePattern?: string; // Optional for backward compatibility
  selectedDays?: number[]; // Optional for backward compatibility
  color: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  aiReasoning: string;
  benefits: string[];
  tips: string[];
}

interface CarouselProps {
  onHabitAdd?: (habit: HabitRecommendation) => void;
}

export function HabitRecommendationCarousel({ onHabitAdd }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false); // For manual refresh - used in useMemo dependency
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
    queryKey: ['/api/habits', user?.id],
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

  // AI-First Priority System: Only use AI-generated recommendations
  const { data: allRecommendations = [], isLoading } = useQuery<HabitRecommendation[]>({
    queryKey: ['ai-recommendations', user?.id],
    queryFn: async () => {
      // 1. First priority: Get AI recommendations from database
      try {
        const userResponse = await apiRequest('user', 'GET');
        const userData = await userResponse.json();
        
        if (userData.user?.aiRecommendations && userData.user.aiRecommendations.length > 0) {
          console.log('🎯 Using AI recommendations from database (signup questionnaire):', userData.user.aiRecommendations.length);
          
          const dbRecommendations = userData.user.aiRecommendations.map((rec: any) => ({
            id: rec.id || Math.random().toString(),
            title: rec.title,
            description: rec.description,
            category: rec.category,
            targetValue: rec.targetValue || 1,
            unit: rec.unit || 'times',
            reminderTime: rec.reminderTime || null,
            frequency: rec.frequency || 'daily',
            recurrencePattern: rec.recurrencePattern || rec.frequency || 'daily',
            selectedDays: rec.selectedDays || null,
            color: rec.color || '#6366F1',
            icon: rec.icon || 'fas fa-check',
            difficulty: rec.difficulty || 'medium',
            aiReasoning: rec.aiReasoning || rec.reasoning || 'This habit is personalized based on your preferences and goals.',
            benefits: rec.benefits || rec.keyBenefits || ['Improved focus', 'Better habits', 'Personal growth'],
            tips: rec.tips || rec.successTips || ['Start small', 'Be consistent', 'Track your progress']
          }));
          
          // Clear localStorage to prevent conflicts with database recommendations
          localStorage.removeItem('habitRecommendations');
          localStorage.removeItem('carouselGeneratedAt');
          console.log('🧹 Cleared localStorage to prioritize database recommendations');
          
          return dbRecommendations;
        }
        
        // 2. Second priority: Check if questionnaire is completed and generate fresh recommendations
        const questionnaireCompleted = localStorage.getItem('questionnaireCompleted') === 'true';
        const questionnaireData = localStorage.getItem('questionnaireData');
        
        if (questionnaireCompleted && questionnaireData) {
          console.log('🔄 Questionnaire completed but no database recommendations found, generating fresh ones...');
          
          try {
            const parsedQuestionnaire = JSON.parse(questionnaireData);
            const response = await apiRequest('ai/questionnaire', 'POST', parsedQuestionnaire);
            const data = await response.json();
            
            if (data.recommendations && data.recommendations.length > 0) {
              console.log('✅ Generated fresh AI recommendations from questionnaire:', data.recommendations.length);
              
              // Store in localStorage for immediate use
              localStorage.setItem('habitRecommendations', JSON.stringify(data.recommendations));
              
              // Also save to database for future use
              try {
                const saveResponse = await apiRequest('ai/save-recommendations', 'POST', {
                  recommendations: data.recommendations
                });
                if (saveResponse.ok) {
                  console.log('💾 Saved fresh recommendations to database');
                }
              } catch (saveError) {
                console.log('⚠️ Could not save recommendations to database:', saveError);
              }
              
              return data.recommendations;
            }
          } catch (error) {
            console.error('Error generating fresh recommendations:', error);
          }
        }
        
        // 3. Third priority: Use stored recommendations from localStorage (if any)
        const storedRecommendations = localStorage.getItem('habitRecommendations');
        if (storedRecommendations) {
          try {
            const recommendations = JSON.parse(storedRecommendations);
            console.log('📦 Using stored recommendations from localStorage:', recommendations.length);
            return recommendations;
          } catch (error) {
            console.error('Error parsing stored recommendations:', error);
          }
        }
        
        // 4. No AI recommendations available - return empty array
        console.log('❌ No AI recommendations available - carousel will be hidden');
        return [];
      } catch (error) {
        console.error('Error fetching AI recommendations:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter for fresher data
    enabled: !!user, // Only run when user is logged in
  });

  // Smart rotation system: Get 10 different recommendations every time
  const getRotatedRecommendations = () => {
    // Safety check: ensure existingHabits is an array and has valid items
    if (!Array.isArray(existingHabits) || existingHabits.length === 0) {
      // If no existing habits, return first 10 recommendations
      return allRecommendations.slice(0, 10);
    }

    // Filter out exact matches (same title + category)
    const filteredRecommendations = allRecommendations.filter(recommendation => {
      const alreadyExists = existingHabits.some((habit: any) => {
        // Safety check: ensure habit has required properties
        if (!habit || typeof habit !== 'object') {
          return false;
        }

        const titleMatch = habit.title && recommendation.title ? 
          habit.title.toLowerCase().trim() === recommendation.title.toLowerCase().trim() 
          : false;
        
        const categoryMatch = habit.category && recommendation.category ? 
          habit.category.toLowerCase().trim() === recommendation.category.toLowerCase().trim() 
          : false;
        
        // Only filter out if BOTH title AND category match (more specific)
        const exactMatch = titleMatch && categoryMatch;
        
        // Also check for very similar descriptions
        const descriptionSimilarity = habit.description && recommendation.description ? 
          habit.description.toLowerCase().includes(recommendation.description.toLowerCase().split(' ').slice(0, 3).join(' ')) ||
          recommendation.description.toLowerCase().includes(habit.description.toLowerCase().split(' ').slice(0, 3).join(' '))
          : false;
        
        return exactMatch || descriptionSimilarity;
      });
      
      if (alreadyExists) {
        console.log(`Filtering out already added habit: ${recommendation.title} (${recommendation.category})`);
      } else {
        console.log(`✅ Keeping recommendation: ${recommendation.title} (${recommendation.category})`);
      }
      
      return !alreadyExists;
    });

    // If we have 10 or fewer filtered recommendations, return them all
    if (filteredRecommendations.length <= 10) {
      return filteredRecommendations;
    }

    // Implement rotation system for 10 different recommendations
    const rotationKey = 'habitRecommendationRotation';
    const lastRotation = localStorage.getItem(rotationKey);
    const currentTime = Date.now();
    const rotationInterval = 24 * 60 * 60 * 1000; // 24 hours
    
    let startIndex = 0;
    
    // Check if we need to rotate (every 24 hours or if no previous rotation)
    if (!lastRotation || (currentTime - parseInt(lastRotation)) > rotationInterval) {
      // Generate new random starting index
      startIndex = Math.floor(Math.random() * (filteredRecommendations.length - 10 + 1));
      localStorage.setItem(rotationKey, currentTime.toString());
      console.log(`🔄 Rotating recommendations: new start index ${startIndex}`);
    } else {
      // Use previous rotation index
      const lastIndex = parseInt(localStorage.getItem(rotationKey + '_index') || '0');
      startIndex = (lastIndex + 10) % filteredRecommendations.length;
      localStorage.setItem(rotationKey + '_index', startIndex.toString());
      console.log(`🔄 Continuing rotation: start index ${startIndex}`);
    }

    // Get 10 recommendations starting from the rotation index
    const rotatedRecommendations = [];
    for (let i = 0; i < 10; i++) {
      const index = (startIndex + i) % filteredRecommendations.length;
      rotatedRecommendations.push(filteredRecommendations[index]);
    }

    console.log(`🎯 Selected 10 recommendations from ${filteredRecommendations.length} available`);
    return rotatedRecommendations;
  };

  // Manual refresh function - used in button onClick
  // Manual refresh function - generates fresh AI recommendations
  const refreshRecommendations = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    try {
      setIsRefreshing(true);
      console.log('🔄 Manual refresh: generating fresh AI recommendations...');
      
      // Check if questionnaire is completed
      const questionnaireCompleted = localStorage.getItem('questionnaireCompleted') === 'true';
      const questionnaireData = localStorage.getItem('questionnaireData');
      
      if (questionnaireCompleted && questionnaireData) {
        const parsedQuestionnaire = JSON.parse(questionnaireData);
        
        // Force fresh AI generation by calling the recommendations endpoint directly
        const response = await apiRequest('ai/recommendations', 'POST', {
          questionnaireData: parsedQuestionnaire
        });
        const data = await response.json();
        
        if (data.recommendations && data.recommendations.length > 0) {
          console.log('✅ Generated fresh AI recommendations:', data.recommendations.length);
          
          // Store in localStorage
          localStorage.setItem('habitRecommendations', JSON.stringify(data.recommendations));
          
          // Clear rotation data to get fresh rotation
          localStorage.removeItem('habitRecommendationRotation');
          localStorage.removeItem('habitRecommendationRotation_index');
          
          // Clear database recommendations to force fresh generation
          try {
            await apiRequest('ai/clear-recommendations', 'POST');
            console.log('🧹 Cleared database recommendations to force fresh generation');
          } catch (clearError) {
            console.log('⚠️ Could not clear database recommendations:', clearError);
          }
          
          // Force refresh of the query
          queryClient.invalidateQueries({ queryKey: ['ai-recommendations', user?.id] });
          
          // Reset carousel state
          setCurrentIndex(0);
          setRefreshKey(prev => prev + 1);
          
          toast({
            title: "Fresh AI Recommendations Generated! 🤖",
            description: "New AI-powered habit recommendations are ready for you.",
          });
        } else {
          toast({
            title: "No New Recommendations",
            description: "Unable to generate fresh recommendations at this time.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Complete Questionnaire First",
          description: "Please complete the AI questionnaire to get personalized recommendations.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating fresh recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to generate fresh recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const recommendations = React.useMemo(() => getRotatedRecommendations(), [allRecommendations, existingHabits, refreshKey]);

  // Debug logging for carousel state
  console.log('Carousel state:', {
    allRecommendations: allRecommendations.length,
    existingHabits: existingHabits.length,
    filteredRecommendations: recommendations.length,
    isLoading
  });
  
  // Debug: Show existing habits for comparison
  console.log('Existing habits:', existingHabits.map((h: any) => `${h.title} (${h.category})`));
  console.log('Available recommendations:', recommendations.map((r: any) => `${r.title} (${r.category})`));

  // Log filtering results for debugging
  if (allRecommendations.length > 0) {
    console.log(`Carousel filtering: ${allRecommendations.length} total recommendations, ${recommendations.length} available after filtering`);
  }

  // Add habit mutation
  const addHabitMutation = useMutation({
    mutationFn: async (recommendation: HabitRecommendation) => {
      // Check if habit already exists to prevent duplicates (more precise check)
      const habitExists = existingHabits.some((habit: any) => 
        habit.title.toLowerCase().trim() === recommendation.title.toLowerCase().trim() &&
        habit.category.toLowerCase().trim() === recommendation.category.toLowerCase().trim()
      );
      
      if (habitExists) {
        throw new Error(`Habit "${recommendation.title}" already exists in ${recommendation.category} category`);
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
        // Map frequency to recurrencePattern for calendar sync
        recurrencePattern: recommendation.recurrencePattern || recommendation.frequency || 'daily',
        // Set selectedDays based on frequency for proper calendar sync
        selectedDays: recommendation.selectedDays || getSelectedDaysForFrequency(recommendation.frequency || 'daily'),
        isActive: true,
        color: recommendation.color || '#6366F1',
        icon: recommendation.icon || 'fas fa-check'
      };
      
      console.log('Adding habit with data:', habitData);
      return await apiRequest('habits', 'POST', habitData);
    },
    onSuccess: async (_habitData, variables) => {
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
      
      // Remove only the added recommendation from localStorage (more precise filtering)
      const storedRecommendations = localStorage.getItem('habitRecommendations');
      if (storedRecommendations) {
        try {
          const recommendations = JSON.parse(storedRecommendations);
          const updatedRecommendations = recommendations.filter((rec: any) => 
            !(rec.title.toLowerCase().trim() === variables.title.toLowerCase().trim() && 
              rec.category.toLowerCase().trim() === variables.category.toLowerCase().trim())
          );
          
          if (updatedRecommendations.length > 0) {
            localStorage.setItem('habitRecommendations', JSON.stringify(updatedRecommendations));
            console.log(`Updated localStorage: removed ${variables.title}, ${updatedRecommendations.length} remaining`);
          } else {
            localStorage.removeItem('habitRecommendations');
            console.log('All recommendations used, cleared localStorage');
          }
        } catch (error) {
          console.error('Error updating stored recommendations:', error);
        }
      }
      
      // Invalidate habits query to refresh the habit list and update filtering
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habits', user?.id] });
      
      // Update recommendations cache to remove the added recommendation
      queryClient.setQueryData(['ai-recommendations', user?.id], (oldData: HabitRecommendation[] | undefined) => {
        if (!oldData) return oldData;
        
        // More precise filtering to prevent duplicates
        const updatedRecommendations = oldData.filter(rec => 
          !(rec.title.toLowerCase().trim() === variables.title.toLowerCase().trim() && 
            rec.category.toLowerCase().trim() === variables.category.toLowerCase().trim())
        );
        
        console.log(`Removed ${variables.title} from recommendations cache. ${updatedRecommendations.length} recommendations remaining.`);
        return updatedRecommendations;
      });
      
      // Also invalidate the recommendations query to refresh the display
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations', user?.id] });
      
      // Sync with Google Calendar if connected
      try {
        console.log('🔄 Syncing new habit to Google Calendar...');
        const syncResponse = await apiRequest('google-calendar/sync-habits', 'POST');
        if (syncResponse.ok) {
          console.log('✅ New habit synced to Google Calendar');
        } else {
          console.log('⚠️ Failed to sync new habit to calendar (calendar may not be connected)');
        }
      } catch (syncError) {
        console.log('⚠️ Error syncing new habit to calendar:', syncError);
      }
      
      // Move to next recommendation with delay for user to see success
      // But only if there are more recommendations available
      setTimeout(() => {
        if (recommendations.length > 1) {
          handleNext();
        } else {
          // If this was the last recommendation, reset to first
          setCurrentIndex(0);
        }
      }, 1000);
    },
    onError: (error) => {
      // Error haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
      if (error instanceof Error && error.message.includes('already exists')) {
        toast({
          title: "Habit Already Exists",
          description: error.message,
          variant: "destructive",
        });
        
        // Move to next recommendation if it's a duplicate
        setTimeout(() => {
          handleNext();
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to add habit. Please try again.",
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

  // Hide carousel if no AI recommendations available
  if (allRecommendations.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">AI Habit Recommendations</h3>
        </div>
        
        <div className="flex items-center space-x-2">
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
          <div className="text-xs text-gray-500 hidden sm:block">
            {currentIndex + 1} of {recommendations.length}
          </div>
        </div>
      </div>

      <div className="relative">
        <Card 
          className={`w-full h-80 sm:h-96 transition-transform duration-300 cursor-grab active:cursor-grabbing overflow-hidden ${
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
                <CardTitle className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                  <i className={`${currentRecommendation.icon || 'fas fa-check'} text-lg sm:text-2xl flex-shrink-0`}></i>
                  <span className="truncate text-sm sm:text-base">{currentRecommendation.title || 'Habit Recommendation'}</span>
                </CardTitle>
                <CardDescription className="mt-1 line-clamp-2 text-xs sm:text-sm">
                  {currentRecommendation.description || 'A personalized habit recommendation for you.'}
                </CardDescription>
              </div>
              
              <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                <Badge variant="secondary" className={`${getDifficultyColor(currentRecommendation.difficulty || 'medium')} text-xs`}>
                  {currentRecommendation.difficulty || 'medium'}
                </Badge>
                <div className="text-xs text-gray-500 hidden sm:block">
                  Personalized for you
                </div>
                {/* Habit Details moved here */}
                <div className="flex flex-col items-end space-y-1 mt-2">
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <Target className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span>{currentRecommendation.targetValue || 1} {currentRecommendation.unit || 'time'}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span>{currentRecommendation.reminderTime || '09:00'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 overflow-hidden">

            {/* AI Reasoning */}
            <div className="bg-purple-50 p-2 rounded-lg">
              <div className="flex items-start space-x-1 sm:space-x-2">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-medium text-purple-900 text-xs sm:text-sm">Why AI Recommends This</h4>
                  <p className="text-purple-800 text-xs sm:text-sm mt-1 line-clamp-2">{currentRecommendation.aiReasoning || 'This habit is personalized based on your preferences and goals.'}</p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h4 className="font-medium text-xs sm:text-sm mb-1">Key Benefits</h4>
              <div className="flex flex-wrap gap-1">
                {(currentRecommendation.benefits || []).slice(0, 2).map((benefit, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-1 sm:px-2 py-0.5 max-w-full">
                    <span className="truncate block text-xs">{benefit}</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="min-w-0">
              <h4 className="font-medium text-xs sm:text-sm mb-1">Success Tips</h4>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                {(currentRecommendation.tips || []).slice(0, 1).map((tip, index) => (
                  <li key={index} className="flex items-start space-x-1 sm:space-x-2 min-w-0">
                    <Star className="w-3 h-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                    <span className="line-clamp-1 sm:line-clamp-2 break-words overflow-hidden">{tip}</span>
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
      <div className="flex space-x-2 sm:space-x-3 mt-4">
        <Button
          onClick={() => addHabitMutation.mutate(currentRecommendation)}
          disabled={addHabitMutation.isPending}
          className="flex-1 text-xs sm:text-sm"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">{addHabitMutation.isPending ? 'Adding...' : 'Add This Habit'}</span>
          <span className="xs:hidden">{addHabitMutation.isPending ? 'Adding...' : 'Add'}</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={isAnimating}
          className="text-xs sm:text-sm px-2 sm:px-4"
        >
          Skip
        </Button>
        
        <Button
          variant="outline"
          onClick={refreshRecommendations}
          disabled={isAnimating || isRefreshing}
          className="text-xs sm:text-sm px-2 sm:px-3"
          title={isRefreshing ? "Generating fresh AI recommendations..." : "Get new recommendations"}
        >
          {isRefreshing ? (
            <div className="w-3 h-3 sm:w-4 sm:h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          ) : (
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
        </Button>
      </div>

      {/* Swipe Instructions */}
      <p className="text-xs text-gray-500 text-center mt-2 hidden sm:block">
        Swipe left/right or use arrows to browse recommendations
      </p>
      <p className="text-xs text-gray-500 text-center mt-2 sm:hidden">
        Swipe to browse
      </p>
    </div>
  );
}