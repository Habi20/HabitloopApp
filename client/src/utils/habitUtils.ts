
import type { Habit, HabitRecommendation } from '@/types/habits';

/**
 * Calculate habit difficulty score based on various factors
 * Returns a normalized score between 0 and 1
 */
export function calculateHabitDifficulty(habit: Habit | HabitRecommendation): number {
  let difficulty = 0.5; // default medium difficulty

  // Category-based difficulty adjustments - aligned with app category standards
  const categoryDifficulty: Record<string, number> = {
    'Health': 0.1,        // Health & Fitness combined
    'Productivity': 0.15,  // Productivity tasks can be challenging
    'Learning': 0.2,       // Learning requires sustained effort
    'Mindfulness': 0.05,   // Generally easier to start
    'Social': 0.1,         // Moderate difficulty
    'Creative': 0.1,       // Creative habits are moderately challenging
  };

  // Normalize category for lookup (handle variations)
  let normalizedCategory = habit.category;
  if (habit.category) {
    // Handle "Health & Fitness" -> "Health"
    if (habit.category.toLowerCase().includes('health')) {
      normalizedCategory = 'Health';
    }
    // Add difficulty if category exists in our mapping
    if (categoryDifficulty[normalizedCategory]) {
      difficulty += categoryDifficulty[normalizedCategory];
    }
  }

  // Target value impact - higher targets are generally harder
  if (habit.targetValue && habit.targetValue > 5) {
    difficulty += 0.2;
  }

  // Frequency impact - daily habits are generally harder to maintain consistently
  if (habit.frequency === "daily") {
    difficulty += 0.1;
  } else if (habit.frequency === "weekly") {
    difficulty -= 0.05;
  }

  // Clamp the value between 0 and 1
  return Math.min(1, Math.max(0, difficulty));
}

/**
 * Convert numeric difficulty to string representation
 */
export function getDifficultyLabel(score: number): "easy" | "medium" | "hard" {
  if (score <= 0.4) return "easy";
  if (score <= 0.7) return "medium";
  return "hard";
}

/**
 * Get difficulty for a recommendation, either from its difficulty property or calculate it
 */
export function getRecommendationDifficulty(recommendation: HabitRecommendation): "easy" | "medium" | "hard" {
  if (recommendation.difficulty) {
    return recommendation.difficulty;
  }
  // Calculate difficulty if not provided
  const score = calculateHabitDifficulty(recommendation);
  return getDifficultyLabel(score);
}

/**
 * Get difficulty color for UI display
 */
export function getDifficultyColor(difficulty: "easy" | "medium" | "hard" | number | undefined): string {
  if (difficulty === undefined) return 'bg-gray-100 text-gray-800';

  const label = typeof difficulty === 'number' ? getDifficultyLabel(difficulty) : difficulty;
  
  switch (label) {
    case 'easy': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'hard': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}



// import type { Habit , HabitRecommendation} from '@/types/habits';

// /**
//  * Calculate habit difficulty score based on various factors
//  * @param habit - The habit object to calculate difficulty for
//  * @param userLevel - Optional user level for personalized difficulty
//  * @param userXP - Optional user XP for personalized difficulty
//  * @returns A difficulty score between 0 and 1 (0 = very easy, 1 = very hard)
//  */
// export function calculateHabitDifficulty(
//   habit: Habit, 
//   userLevel?: number, 
//   userXP?: number
// ): number {
//   let difficulty = 0.5; // default medium difficulty

//   // Target value impact - higher targets are harder
//   if (habit.targetValue) {
//     if (habit.targetValue > 10) difficulty += 0.3;
//     else if (habit.targetValue > 5) difficulty += 0.2;
//     else if (habit.targetValue > 2) difficulty += 0.1;
//   }

//   // Frequency impact - daily habits are generally harder to maintain
//   if (habit.frequency === "daily") difficulty += 0.1;
//   else if (habit.frequency === "weekly") difficulty -= 0.05;

//   // Category-based difficulty adjustments
//   const categoryDifficulty: Record<string, number> = {
//     'health': 0.05,
//     'fitness': 0.15,
//     'productivity': 0.1,
//     'mindfulness': 0.05,
//     'learning': 0.2,
//     'social': 0.1,
//     'finance': 0.15,
//     'career': 0.2,
//     'creativity': 0.1,
//   };

//   if (habit.category && categoryDifficulty[habit.category.toLowerCase()]) {
//     difficulty += categoryDifficulty[habit.category.toLowerCase()];
//   }

//   // User level adjustments - higher level users can handle more difficulty
//   if (userLevel !== undefined) {
//     const levelAdjustment = (userLevel - 5) * -0.02; // Reduce difficulty for higher levels
//     difficulty += levelAdjustment;
//   }

//   // User XP adjustments - more experienced users get slight difficulty reduction
//   if (userXP !== undefined) {
//     const xpAdjustment = Math.min(userXP / 5000, 0.1) * -1; // Max 0.1 reduction
//     difficulty += xpAdjustment;
//   }

//   // Clamp the value between 0.1 and 0.9 (avoid extremes)
//   return Math.min(0.9, Math.max(0.1, difficulty));
// }

// /**
//  * Convert numeric difficulty score to categorical difficulty
//  * @param score - Numeric difficulty score (0-1)
//  * @returns Categorical difficulty level
//  */
// export function getDifficultyCategory(score: number): "easy" | "medium" | "hard" {
//   if (score <= 0.4) return "easy";
//   if (score <= 0.7) return "medium";
//   return "hard";
// }

// /**
//  * Get a color representation for difficulty level
//  * @param difficulty - Either numeric score or categorical difficulty
//  * @returns CSS color class or hex color
//  */
// export function getDifficultyColor(difficulty: number | "easy" | "medium" | "hard"): string {
//   const level = typeof difficulty === 'number' ? getDifficultyCategory(difficulty) : difficulty;
  
//   switch (level) {
//     case 'easy': return 'text-green-600';
//     case 'medium': return 'text-yellow-600';
//     case 'hard': return 'text-red-600';
//     default: return 'text-gray-600';
//   }
// }

// /**
//  * Get difficulty description text
//  * @param difficulty - Either numeric score or categorical difficulty
//  * @returns Human-readable difficulty description
//  */
// export function getDifficultyDescription(difficulty: number | "easy" | "medium" | "hard"): string {
//   const level = typeof difficulty === 'number' ? getDifficultyCategory(difficulty) : difficulty;
  
//   switch (level) {
//     case 'easy': return 'This habit should be manageable to maintain';
//     case 'medium': return 'This habit will require consistent effort';
//     case 'hard': return 'This habit will be challenging and requires strong commitment';
//     default: return 'Difficulty assessment unavailable';
//   }
// }
