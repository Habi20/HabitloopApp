import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface HabitRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  unit: string;
  reminderTime: string | null;
  frequency: string;
  color: string;
  icon: string;
  difficulty: string;
  successRate: number;
  aiReasoning: string;
  benefits: string[];
  tips: string[];
}

export function useAIRecommendations() {
  const queryClient = useQueryClient();
  const [dismissedRecommendations, setDismissedRecommendations] = useState<string[]>([]);

  // Load dismissed recommendations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('dismissedRecommendations');
    if (stored) {
      try {
        setDismissedRecommendations(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing dismissed recommendations:', error);
      }
    }
  }, []);

  // Fetch AI recommendations
  const { data: allRecommendations = [], isLoading, error } = useQuery<HabitRecommendation[]>({
    queryKey: ['ai-recommendations'],
    queryFn: async () => {
      // First try to get recommendations from user's database profile
      try {
        const userResponse = await apiRequest('user', 'GET');
        const userData = await userResponse.json();
        
        console.log('🔍 User data fetched:', userData.user?.aiRecommendations ? 'Has AI recommendations' : 'No AI recommendations');
        console.log('🔍 AI recommendations count:', userData.user?.aiRecommendations?.length || 0);
        console.log('🔍 AI recommendations (aiRecommendations):', userData.user?.aiRecommendations);
        console.log('🔍 AI recommendations (ai_recommendations):', userData.user?.ai_recommendations);
        console.log('🔍 Full user data keys:', Object.keys(userData.user || {}));
        
        // Check both possible field names for AI recommendations
        const aiRecommendations = userData.user?.aiRecommendations || userData.user?.ai_recommendations;
        
        if (aiRecommendations && aiRecommendations.length > 0) {
          console.log('Using AI recommendations from user profile:', aiRecommendations);
          console.log('First recommendation structure:', aiRecommendations[0]);
          
          const dbRecommendations = aiRecommendations.map((rec: any) => ({
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
          // Store in localStorage for consistency
          localStorage.setItem('habitRecommendations', JSON.stringify(dbRecommendations));
          return dbRecommendations;
        }
      } catch (error) {
        console.error('Error fetching recommendations from user profile:', error);
      }
      
      // Fallback to localStorage (from questionnaire)
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
          
          return mappedRecommendations;
        } catch (error) {
          console.error('Error parsing stored recommendations from localStorage:', error);
        }
      }
      
      // Fallback to default recommendations
      return [
        {
          id: '1',
          title: 'Morning Exercise',
          description: 'Start your day with physical activity',
          category: 'Health',
          targetValue: 1,
          unit: 'times',
          reminderTime: '07:00',
          frequency: 'daily',
          color: '#10B981',
          icon: 'fas fa-dumbbell',
          difficulty: 'medium',
          successRate: 85,
          aiReasoning: 'Based on your health goals and morning motivation',
          benefits: ['Increased energy', 'Better mood', 'Improved fitness'],
          tips: ['Start with 10 minutes', 'Choose activities you enjoy', 'Track your progress']
        },
        {
          id: '2',
          title: 'Read Books',
          description: 'Expand your knowledge through reading',
          category: 'Learning',
          targetValue: 1,
          unit: 'pages',
          reminderTime: '20:00',
          frequency: 'daily',
          color: '#3B82F6',
          icon: 'fas fa-book',
          difficulty: 'easy',
          successRate: 90,
          aiReasoning: 'Matches your learning interests and evening routine',
          benefits: ['Knowledge expansion', 'Better focus', 'Stress reduction'],
          tips: ['Start with 5 pages', 'Choose interesting topics', 'Read before bed']
        }
      ];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get user's existing habits to filter out duplicates
  const { data: habitsResponse } = useQuery({
    queryKey: ['/api/habits'],
    queryFn: async () => {
      const response = await apiRequest('habits', 'GET');
      return response.json();
    },
  });
  
  const habits = habitsResponse?.habits || [];

  // Filter out recommendations that are already added as habits or dismissed
  // Only filter when both recommendations and habits are loaded
  const filteredRecommendations = React.useMemo(() => {
    if (!allRecommendations || allRecommendations.length === 0) {
      return [];
    }
    
    const habitsArray = Array.isArray(habits) ? habits : [];
    const filtered = allRecommendations.filter((rec: HabitRecommendation) => {
      const existingHabit = habitsArray.find(
        (habit: any) =>
          habit.title.toLowerCase() === rec.title.toLowerCase() ||
          (habit.title.toLowerCase().includes(rec.title.toLowerCase()) &&
            habit.category === rec.category)
      );
      const isDismissed = dismissedRecommendations.includes(rec.title);
      
      // Debug logging
      if (existingHabit) {
        console.log(`Filtering out "${rec.title}" - matches existing habit "${existingHabit.title}"`);
      }
      if (isDismissed) {
        console.log(`Filtering out "${rec.title}" - was dismissed`);
      }
      
      return !existingHabit && !isDismissed;
    });
    
    console.log('🔍 AI Recommendations Debug:');
    console.log('- All recommendations:', allRecommendations.length);
    console.log('- Existing habits:', habits.length);
    console.log('- Dismissed recommendations:', dismissedRecommendations.length);
    console.log('- Filtered recommendations:', filtered.length);
    console.log('- Filtered titles:', filtered.map(r => r.title));
    
    return filtered;
  }, [allRecommendations, habits, dismissedRecommendations]);

  // Dismiss a recommendation
  const dismissRecommendation = (title: string) => {
    const newDismissed = [...dismissedRecommendations, title];
    setDismissedRecommendations(newDismissed);
    localStorage.setItem('dismissedRecommendations', JSON.stringify(newDismissed));
  };

  // Clear all dismissed recommendations
  const clearDismissed = () => {
    setDismissedRecommendations([]);
    localStorage.removeItem('dismissedRecommendations');
  };

  // Refresh recommendations
  const refreshRecommendations = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/ai/recommendations'] });
  };

  return {
    recommendations: filteredRecommendations,
    allRecommendations,
    dismissedRecommendations,
    isLoading,
    error,
    dismissRecommendation,
    clearDismissed,
    refreshRecommendations,
  };
}
