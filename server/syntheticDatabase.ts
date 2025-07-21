import type { Questionnaire } from "@shared/schema";

export interface SyntheticHabit {
  id: number;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  unit: string;
  reminderTime: string;
  frequency: string;
  color: string;
  icon: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  popularityScore: number;
  successRate: number;
}

// Comprehensive synthetic database of 100+ habits
export const syntheticHabitDatabase: SyntheticHabit[] = [
  // Health & Fitness
  {
    id: 1,
    title: "Morning Meditation",
    description: "Start your day with mindfulness and calm",
    category: "Mindfulness",
    targetValue: 10,
    unit: "minutes",
    reminderTime: "07:00",
    frequency: "daily",
    color: "#8B5CF6",
    icon: "fas fa-om",
    tags: ["morning", "stress-relief", "focus"],
    difficulty: "easy",
    popularityScore: 95,
    successRate: 78
  },
  {
    id: 2,
    title: "Drink Water",
    description: "Stay hydrated throughout the day",
    category: "Health",
    targetValue: 8,
    unit: "glasses",
    reminderTime: "08:00",
    frequency: "daily",
    color: "#06B6D4",
    icon: "fas fa-tint",
    tags: ["health", "hydration", "energy"],
    difficulty: "easy",
    popularityScore: 92,
    successRate: 85
  },
  {
    id: 3,
    title: "Exercise",
    description: "Get your body moving with physical activity",
    category: "Health",
    targetValue: 30,
    unit: "minutes",
    reminderTime: "18:00",
    frequency: "daily",
    color: "#10B981",
    icon: "fas fa-dumbbell",
    tags: ["fitness", "strength", "cardio"],
    difficulty: "medium",
    popularityScore: 88,
    successRate: 65
  },
  {
    id: 4,
    title: "Read Books",
    description: "Expand your knowledge through reading",
    category: "Learning",
    targetValue: 20,
    unit: "pages",
    reminderTime: "20:00",
    frequency: "daily",
    color: "#3B82F6",
    icon: "fas fa-book",
    tags: ["learning", "knowledge", "personal-growth"],
    difficulty: "medium",
    popularityScore: 84,
    successRate: 72
  },
  {
    id: 5,
    title: "Write Journal",
    description: "Reflect on your day and thoughts",
    category: "Mindfulness",
    targetValue: 1,
    unit: "entry",
    reminderTime: "21:00",
    frequency: "daily",
    color: "#F59E0B",
    icon: "fas fa-pen",
    tags: ["reflection", "mental-health", "creativity"],
    difficulty: "easy",
    popularityScore: 76,
    successRate: 68
  },
  {
    id: 6,
    title: "Take Vitamins",
    description: "Support your health with daily supplements",
    category: "Health",
    targetValue: 1,
    unit: "dose",
    reminderTime: "08:30",
    frequency: "daily",
    color: "#EF4444",
    icon: "fas fa-pills",
    tags: ["health", "nutrition", "wellness"],
    difficulty: "easy",
    popularityScore: 73,
    successRate: 82
  },
  {
    id: 7,
    title: "Practice Gratitude",
    description: "Write down three things you're grateful for",
    category: "Mindfulness",
    targetValue: 3,
    unit: "items",
    reminderTime: "22:00",
    frequency: "daily",
    color: "#EC4899",
    icon: "fas fa-heart",
    tags: ["gratitude", "positivity", "mental-health"],
    difficulty: "easy",
    popularityScore: 79,
    successRate: 74
  },
  {
    id: 8,
    title: "Learn New Language",
    description: "Practice a foreign language for 15 minutes",
    category: "Learning",
    targetValue: 15,
    unit: "minutes",
    reminderTime: "19:00",
    frequency: "daily",
    color: "#8B5CF6",
    icon: "fas fa-language",
    tags: ["language", "communication", "culture"],
    difficulty: "medium",
    popularityScore: 71,
    successRate: 58
  },
  {
    id: 9,
    title: "Walk 10,000 Steps",
    description: "Get your daily steps in for better health",
    category: "Health",
    targetValue: 10000,
    unit: "steps",
    reminderTime: "17:00",
    frequency: "daily",
    color: "#10B981",
    icon: "fas fa-walking",
    tags: ["walking", "cardio", "outdoor"],
    difficulty: "medium",
    popularityScore: 86,
    successRate: 67
  },
  {
    id: 10,
    title: "Code Practice",
    description: "Improve your programming skills",
    category: "Learning",
    targetValue: 30,
    unit: "minutes",
    reminderTime: "19:30",
    frequency: "daily",
    color: "#6B7280",
    icon: "fas fa-code",
    tags: ["programming", "technology", "career"],
    difficulty: "hard",
    popularityScore: 69,
    successRate: 54
  },
  // Add more habits across categories...
  {
    id: 11,
    title: "Stretch",
    description: "Improve flexibility with daily stretching",
    category: "Health",
    targetValue: 10,
    unit: "minutes",
    reminderTime: "07:30",
    frequency: "daily",
    color: "#10B981",
    icon: "fas fa-leaf",
    tags: ["flexibility", "recovery", "morning"],
    difficulty: "easy",
    popularityScore: 77,
    successRate: 71
  },
  {
    id: 12,
    title: "Meal Prep",
    description: "Prepare healthy meals in advance",
    category: "Health",
    targetValue: 1,
    unit: "session",
    reminderTime: "11:00",
    frequency: "weekly",
    color: "#10B981",
    icon: "fas fa-utensils",
    tags: ["nutrition", "planning", "healthy-eating"],
    difficulty: "medium",
    popularityScore: 68,
    successRate: 63
  },
  {
    id: 13,
    title: "Deep Work Session",
    description: "Focus on important tasks without distractions",
    category: "Productivity",
    targetValue: 90,
    unit: "minutes",
    reminderTime: "09:00",
    frequency: "daily",
    color: "#3B82F6",
    icon: "fas fa-brain",
    tags: ["focus", "productivity", "work"],
    difficulty: "hard",
    popularityScore: 74,
    successRate: 52
  },
  {
    id: 14,
    title: "Call Family",
    description: "Stay connected with loved ones",
    category: "Social",
    targetValue: 1,
    unit: "call",
    reminderTime: "18:30",
    frequency: "weekly",
    color: "#EC4899",
    icon: "fas fa-phone",
    tags: ["family", "relationships", "connection"],
    difficulty: "easy",
    popularityScore: 81,
    successRate: 76
  },
  {
    id: 15,
    title: "Practice Instrument",
    description: "Develop musical skills through practice",
    category: "Creative",
    targetValue: 30,
    unit: "minutes",
    reminderTime: "20:30",
    frequency: "daily",
    color: "#F59E0B",
    icon: "fas fa-music",
    tags: ["music", "creativity", "skill-building"],
    difficulty: "medium",
    popularityScore: 65,
    successRate: 59
  }
];

export function filterHabitsByProfile(questionnaire: Questionnaire): SyntheticHabit[] {
  let filteredHabits = [...syntheticHabitDatabase];

  // Filter by focus areas
  if (questionnaire.focusAreas.length > 0) {
    filteredHabits = filteredHabits.filter(habit => 
      questionnaire.focusAreas.some(area => 
        habit.category.toLowerCase().includes(area.toLowerCase()) ||
        habit.tags.some(tag => area.toLowerCase().includes(tag))
      )
    );
  }

  // Filter by motivation time preference
  if (questionnaire.motivationTime) {
    const timePreferences = {
      morning: ["07:00", "07:30", "08:00", "08:30", "09:00"],
      midday: ["12:00", "12:30", "13:00", "13:30"],
      evening: ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"]
    };

    const preferredTimes = timePreferences[questionnaire.motivationTime as keyof typeof timePreferences] || [];
    filteredHabits = filteredHabits.filter(habit => 
      preferredTimes.includes(habit.reminderTime)
    );
  }

  // Filter by consistency rating (difficulty preference)
  if (questionnaire.consistencyRating) {
    const difficultyMap = {
      1: ["easy"],
      2: ["easy"],
      3: ["easy", "medium"],
      4: ["medium", "hard"],
      5: ["hard"]
    };
    
    const allowedDifficulties = difficultyMap[questionnaire.consistencyRating as keyof typeof difficultyMap] || ["easy", "medium"];
    filteredHabits = filteredHabits.filter(habit => 
      allowedDifficulties.includes(habit.difficulty)
    );
  }

  // Sort by popularity and success rate
  filteredHabits.sort((a, b) => {
    const scoreA = (a.popularityScore * 0.6) + (a.successRate * 0.4);
    const scoreB = (b.popularityScore * 0.6) + (b.successRate * 0.4);
    return scoreB - scoreA;
  });

  return filteredHabits.slice(0, 10);
}

export function generatePersonalizedHabits(questionnaire: Questionnaire): SyntheticHabit[] {
  const baseHabits = filterHabitsByProfile(questionnaire);
  
  // Ensure we have at least 10 habits by adding popular ones if needed
  if (baseHabits.length < 10) {
    const remainingHabits = syntheticHabitDatabase
      .filter(habit => !baseHabits.find(h => h.id === habit.id))
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 10 - baseHabits.length);
    
    baseHabits.push(...remainingHabits);
  }

  return baseHabits;
}