import { storage } from './storage';
import type { Habit, HabitCompletion, User } from '@shared/schema';

interface RecommendationTemplate {
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
  baseReasoning: string;
  benefits: string[];
  tips: string[];
  requiredLevel?: number;
  excludeCategories?: string[];
}

export class RecommendationEngine {
  private recommendationTemplates: RecommendationTemplate[] = [
    {
      id: 'rec_meditation',
      title: 'Morning Meditation',
      description: 'Start your day with mindful awareness and mental clarity through guided meditation practice.',
      category: 'mindfulness',
      targetValue: 10,
      unit: 'minutes',
      reminderTime: '07:00',
      frequency: 'daily',
      color: '#8B5CF6',
      icon: '🧘',
      difficulty: 'easy',
      successRate: 85,
      baseReasoning: 'meditation will help establish a calm foundation for your day and improve focus.',
      benefits: ['Reduced stress', 'Better focus', 'Emotional balance', 'Improved sleep'],
      tips: [
        'Start with just 5 minutes and gradually increase',
        'Use a meditation app for guided sessions',
        'Create a quiet, comfortable space'
      ]
    },
    {
      id: 'rec_reading',
      title: 'Daily Reading',
      description: 'Expand your knowledge and vocabulary by reading for personal growth and entertainment.',
      category: 'learning',
      targetValue: 20,
      unit: 'pages',
      reminderTime: '20:00',
      frequency: 'daily',
      color: '#10B981',
      icon: '📚',
      difficulty: 'medium',
      successRate: 78,
      baseReasoning: 'reading is an ideal habit for continuous personal development.',
      benefits: ['Knowledge expansion', 'Vocabulary growth', 'Mental stimulation', 'Better sleep'],
      tips: [
        'Choose books you genuinely enjoy',
        'Keep a book on your nightstand',
        'Set a consistent reading time'
      ]
    },
    {
      id: 'rec_gratitude',
      title: 'Gratitude Journal',
      description: 'Write down three things you are grateful for each day to cultivate positivity and mindfulness.',
      category: 'mindfulness',
      targetValue: 3,
      unit: 'items',
      reminderTime: '21:30',
      frequency: 'daily',
      color: '#F59E0B',
      icon: '📝',
      difficulty: 'easy',
      successRate: 92,
      baseReasoning: 'gratitude practice can significantly boost mood and life satisfaction.',
      benefits: ['Positive mindset', 'Better relationships', 'Reduced anxiety', 'Life satisfaction'],
      tips: [
        'Be specific about what you are grateful for',
        'Include both big and small things',
        'Write in the same place each day'
      ]
    },
    {
      id: 'rec_walk',
      title: 'Evening Walk',
      description: 'Take a relaxing walk in the evening to unwind, get fresh air, and light exercise.',
      category: 'fitness',
      targetValue: 15,
      unit: 'minutes',
      reminderTime: '18:30',
      frequency: 'daily',
      color: '#06B6D4',
      icon: '🚶',
      difficulty: 'easy',
      successRate: 88,
      baseReasoning: 'evening walks provide gentle exercise and stress relief.',
      benefits: ['Improved mood', 'Better sleep', 'Light exercise', 'Fresh air'],
      tips: [
        'Choose a pleasant route you enjoy',
        'Listen to music or podcasts',
        'Invite family or friends to join'
      ]
    },
    {
      id: 'rec_protein',
      title: 'Protein Intake',
      description: 'Ensure adequate protein consumption to support muscle health and sustained energy levels.',
      category: 'nutrition',
      targetValue: 25,
      unit: 'grams',
      reminderTime: '12:00',
      frequency: 'daily',
      color: '#EF4444',
      icon: '🥩',
      difficulty: 'medium',
      successRate: 73,
      baseReasoning: 'increased protein intake would support your health objectives.',
      benefits: ['Muscle maintenance', 'Sustained energy', 'Better satiety', 'Recovery support'],
      tips: [
        'Include protein in every meal',
        'Choose lean sources like chicken, fish, eggs',
        'Consider protein supplements if needed'
      ]
    },
    {
      id: 'rec_water',
      title: 'Hydration Tracking',
      description: 'Monitor and maintain proper daily water intake for optimal health and energy.',
      category: 'nutrition',
      targetValue: 8,
      unit: 'glasses',
      reminderTime: '09:00',
      frequency: 'daily',
      color: '#0EA5E9',
      icon: '💧',
      difficulty: 'easy',
      successRate: 80,
      baseReasoning: 'proper hydration is fundamental for energy and cognitive function.',
      benefits: ['Better energy', 'Clearer skin', 'Improved focus', 'Healthy metabolism'],
      tips: [
        'Keep a water bottle nearby',
        'Set hourly reminders',
        'Add lemon for flavor'
      ]
    },
    {
      id: 'rec_exercise',
      title: 'Daily Exercise',
      description: 'Engage in physical activity to build strength, endurance, and overall health.',
      category: 'fitness',
      targetValue: 30,
      unit: 'minutes',
      reminderTime: '07:30',
      frequency: 'daily',
      color: '#DC2626',
      icon: '💪',
      difficulty: 'hard',
      successRate: 65,
      requiredLevel: 3,
      baseReasoning: 'consistent exercise will significantly improve your physical and mental health.',
      benefits: ['Increased strength', 'Better mood', 'Weight management', 'Disease prevention'],
      tips: [
        'Start with activities you enjoy',
        'Mix cardio and strength training',
        'Track your progress'
      ]
    },
    {
      id: 'rec_sleep',
      title: 'Sleep Schedule',
      description: 'Maintain consistent sleep and wake times for better rest and recovery.',
      category: 'health',
      targetValue: 8,
      unit: 'hours',
      reminderTime: '22:00',
      frequency: 'daily',
      color: '#6366F1',
      icon: '😴',
      difficulty: 'medium',
      successRate: 70,
      baseReasoning: 'regular sleep patterns are crucial for physical and mental recovery.',
      benefits: ['Better recovery', 'Improved mood', 'Enhanced focus', 'Stronger immunity'],
      tips: [
        'Avoid screens before bedtime',
        'Keep your bedroom cool and dark',
        'Create a relaxing bedtime routine'
      ]
    }
  ];

  async generatePersonalizedRecommendations(userId: string): Promise<any[]> {
    try {
      const user = await storage.getUser(userId);
      const existingHabits = await storage.getUserHabits(userId);
      const completions = await storage.getHabitCompletions(userId);

      // Analyze user profile
      const userCategories = existingHabits.map(h => h.category.toLowerCase());
      const userTitles = existingHabits.map(h => h.title.toLowerCase());
      const userLevel = user ? storage.calculateLevel(user.xp || 0) : 1;
      const totalHabits = existingHabits.length;
      const completionRate = completions.length > 0 ? completions.length / (totalHabits * 30) : 0;

      // Filter recommendations
      let filteredRecommendations = this.recommendationTemplates.filter(template => {
        // Exclude exact title matches
        if (userTitles.includes(template.title.toLowerCase())) return false;
        
        // Exclude categories with 2+ existing habits
        const categoryCount = userCategories.filter(cat => cat === template.category.toLowerCase()).length;
        if (categoryCount >= 2) return false;
        
        // Level-based filtering
        if (template.requiredLevel && userLevel < template.requiredLevel) return false;
        if (userLevel < 3 && template.difficulty === 'hard') return false;
        if (userLevel > 5 && template.difficulty === 'easy' && Math.random() > 0.3) return false;
        
        return true;
      });

      // Prioritize based on missing categories
      const allCategories = ['fitness', 'mindfulness', 'learning', 'nutrition', 'health'];
      const missingCategories = allCategories.filter(cat => !userCategories.includes(cat));
      
      filteredRecommendations = filteredRecommendations.sort((a, b) => {
        const aIsMissing = missingCategories.includes(a.category);
        const bIsMissing = missingCategories.includes(b.category);
        if (aIsMissing && !bIsMissing) return -1;
        if (!aIsMissing && bIsMissing) return 1;
        return b.successRate - a.successRate;
      });

      // Generate personalized recommendations
      const personalizedRecommendations = filteredRecommendations.slice(0, 5).map(template => ({
        id: template.id,
        title: template.title,
        description: template.description,
        category: template.category,
        targetValue: template.targetValue,
        unit: template.unit,
        reminderTime: template.reminderTime,
        frequency: template.frequency,
        color: template.color,
        icon: template.icon,
        difficulty: template.difficulty,
        successRate: template.successRate,
        aiReasoning: this.generatePersonalizedReasoning(template, userLevel, completionRate),
        benefits: template.benefits,
        tips: template.tips
      }));

      return personalizedRecommendations;
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      throw error;
    }
  }

  private generatePersonalizedReasoning(template: RecommendationTemplate, userLevel: number, completionRate: number): string {
    const levelDescription = userLevel > 3 ? 'advanced' : 'beginner';
    const completionDescription = completionRate > 0.7 ? 'excellent' : completionRate > 0.4 ? 'good' : 'developing';
    
    return `Based on your ${levelDescription} level and ${completionDescription} completion rate, ${template.baseReasoning}`;
  }
}

export const recommendationEngine = new RecommendationEngine();