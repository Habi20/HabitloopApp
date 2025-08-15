import { storage } from '../storage';

interface HabitData {
  id: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  unit: string;
  frequency: string;
  color: string;
  icon: string;
  reminderTime?: string;
}

interface CompletionData {
  habitId: string;
  userId: string;
  date: string;
  value: number;
}

// Sample habits for different user types
const HABIT_DATA: Record<string, HabitData[]> = {
  'user-001': [ // Alex Chen - Productivity enthusiast
    {
      id: 'habit-001-1',
      title: 'Morning Planning',
      description: 'Plan the day ahead with clear goals and priorities',
      category: 'Productivity',
      targetValue: 1,
      unit: 'session',
      frequency: 'daily',
      color: '#3B82F6',
      icon: '📋',
      reminderTime: '08:00'
    },
    {
      id: 'habit-001-2',
      title: 'Deep Work Sessions',
      description: 'Focus on important tasks without distractions',
      category: 'Productivity',
      targetValue: 4,
      unit: 'hours',
      frequency: 'daily',
      color: '#10B981',
      icon: '🎯',
      reminderTime: '09:00'
    },
    {
      id: 'habit-001-3',
      title: 'Evening Review',
      description: 'Review accomplishments and plan for tomorrow',
      category: 'Productivity',
      targetValue: 1,
      unit: 'session',
      frequency: 'daily',
      color: '#8B5CF6',
      icon: '📝',
      reminderTime: '20:00'
    }
  ],
  'user-002': [ // Sarah Johnson - Creative habits builder
    {
      id: 'habit-002-1',
      title: 'Creative Drawing',
      description: 'Practice drawing and sketching daily',
      category: 'Creative',
      targetValue: 30,
      unit: 'minutes',
      frequency: 'daily',
      color: '#F59E0B',
      icon: '🎨',
      reminderTime: '14:00'
    },
    {
      id: 'habit-002-2',
      title: 'Read Fiction',
      description: 'Read creative fiction to inspire imagination',
      category: 'Learning',
      targetValue: 20,
      unit: 'pages',
      frequency: 'daily',
      color: '#EF4444',
      icon: '📚',
      reminderTime: '21:00'
    },
    {
      id: 'habit-002-3',
      title: 'Mindful Walking',
      description: 'Take a mindful walk to clear the mind',
      category: 'Health',
      targetValue: 15,
      unit: 'minutes',
      frequency: 'daily',
      color: '#06B6D4',
      icon: '🚶‍♀️',
      reminderTime: '16:00'
    }
  ],
  'user-003': [ // Marcus Rodriguez - Fitness champion
    {
      id: 'habit-003-1',
      title: 'Morning Run',
      description: 'Start the day with a energizing run',
      category: 'Fitness',
      targetValue: 5,
      unit: 'km',
      frequency: 'daily',
      color: '#DC2626',
      icon: '🏃‍♂️',
      reminderTime: '06:00'
    },
    {
      id: 'habit-003-2',
      title: 'Strength Training',
      description: 'Build strength with weight training',
      category: 'Fitness',
      targetValue: 45,
      unit: 'minutes',
      frequency: 'daily',
      color: '#7C3AED',
      icon: '💪',
      reminderTime: '18:00'
    },
    {
      id: 'habit-003-3',
      title: 'Protein Intake',
      description: 'Ensure adequate protein for muscle recovery',
      category: 'Nutrition',
      targetValue: 150,
      unit: 'grams',
      frequency: 'daily',
      color: '#059669',
      icon: '🥩',
      reminderTime: '12:00'
    }
  ],
  'user-004': [ // Emma Thompson - Mindfulness advocate
    {
      id: 'habit-004-1',
      title: 'Morning Meditation',
      description: 'Start the day with mindfulness meditation',
      category: 'Mindfulness',
      targetValue: 20,
      unit: 'minutes',
      frequency: 'daily',
      color: '#8B5CF6',
      icon: '🧘‍♀️',
      reminderTime: '07:00'
    },
    {
      id: 'habit-004-2',
      title: 'Gratitude Journal',
      description: 'Write down three things to be grateful for',
      category: 'Mindfulness',
      targetValue: 3,
      unit: 'entries',
      frequency: 'daily',
      color: '#F59E0B',
      icon: '📖',
      reminderTime: '22:00'
    },
    {
      id: 'habit-004-3',
      title: 'Digital Detox',
      description: 'Take breaks from screens and technology',
      category: 'Health',
      targetValue: 2,
      unit: 'hours',
      frequency: 'daily',
      color: '#10B981',
      icon: '📱',
      reminderTime: '20:00'
    }
  ],
  'user-005': [ // David Kim - Learning machine
    {
      id: 'habit-005-1',
      title: 'Study Programming',
      description: 'Learn new programming concepts and techniques',
      category: 'Learning',
      targetValue: 2,
      unit: 'hours',
      frequency: 'daily',
      color: '#3B82F6',
      icon: '💻',
      reminderTime: '19:00'
    },
    {
      id: 'habit-005-2',
      title: 'Read Technical Books',
      description: 'Read books on technology and science',
      category: 'Learning',
      targetValue: 30,
      unit: 'pages',
      frequency: 'daily',
      color: '#EF4444',
      icon: '📖',
      reminderTime: '21:00'
    },
    {
      id: 'habit-005-3',
      title: 'Practice Algorithms',
      description: 'Solve coding problems and practice algorithms',
      category: 'Learning',
      targetValue: 3,
      unit: 'problems',
      frequency: 'daily',
      color: '#7C3AED',
      icon: '🧮',
      reminderTime: '20:00'
    }
  ],
  'user-006': [ // Lisa Wang - New habit builder
    {
      id: 'habit-006-1',
      title: 'Drink Water',
      description: 'Stay hydrated throughout the day',
      category: 'Health',
      targetValue: 8,
      unit: 'glasses',
      frequency: 'daily',
      color: '#06B6D4',
      icon: '💧',
      reminderTime: '09:00'
    },
    {
      id: 'habit-006-2',
      title: 'Take Breaks',
      description: 'Take regular breaks from work',
      category: 'Health',
      targetValue: 5,
      unit: 'breaks',
      frequency: 'daily',
      color: '#10B981',
      icon: '⏰',
      reminderTime: '10:00'
    },
    {
      id: 'habit-006-3',
      title: 'Evening Stretch',
      description: 'Do light stretching before bed',
      category: 'Health',
      targetValue: 10,
      unit: 'minutes',
      frequency: 'daily',
      color: '#F59E0B',
      icon: '🧘‍♀️',
      reminderTime: '22:00'
    }
  ]
};

// Generate completion data for the last 30 days
function generateCompletions(userId: string, habitId: string, days: number = 30): CompletionData[] {
  const completions: CompletionData[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Random completion pattern (more likely to complete recent days)
    const completionChance = Math.max(0.3, 1 - (i / days));
    if (Math.random() < completionChance) {
      completions.push({
        habitId,
        userId,
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 3) + 1 // Random value between 1-3
      });
    }
  }
  
  return completions;
}

export async function generateHabitLoopData() {
  console.log('🔄 Generating HabitLoop demo data...');
  
  try {
    for (const [userId, habits] of Object.entries(HABIT_DATA)) {
      console.log(`📝 Creating habits for ${userId}...`);
      
      for (const habitData of habits) {
        // Create habit
        const habit = await storage.upsertHabit({
          userId,
          title: habitData.title,
          description: habitData.description,
          category: habitData.category,
          targetValue: habitData.targetValue,
          unit: habitData.unit,
          frequency: habitData.frequency,
          color: habitData.color,
          icon: habitData.icon,
          reminderTime: habitData.reminderTime,
          isActive: true
        });
        
        console.log(`✅ Created habit: ${habit.title}`);
        
        // Generate completions
        const completions = generateCompletions(userId, habit.id.toString(), 30);
        
        for (const completionData of completions) {
          await storage.upsertCompletion({
            habitId: parseInt(completionData.habitId),
            userId: completionData.userId,
            completedAt: completionData.date,
            value: completionData.value
          });
        }
        
        console.log(`✅ Created ${completions.length} completions for ${habit.title}`);
      }
    }
    
    console.log('🎉 HabitLoop demo data generation completed!');
  } catch (error) {
    console.error('❌ Error generating HabitLoop data:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  generateHabitLoopData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
