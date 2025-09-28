import { storage } from '../storage';

export interface CategoryPerformance {
  category: string;
  performance: number; // 0-100
  completionRate: number;
  consistencyScore: number;
  totalHabits: number;
  completedHabits: number;
  averageStreak: number;
  lastCompletion: Date | null;
}

/**
 * Calculate performance metrics for each habit category
 */
export async function calculateCategoryPerformance(userId: string): Promise<CategoryPerformance[]> {
  try {
    // Get user's habits and completions
    const habits = await storage.getUserHabits(userId);
    const completions = await storage.getHabitCompletions(userId);
    
    if (!habits || habits.length === 0) {
      return [];
    }

    // Group habits by category
    const categoryGroups = habits.reduce((groups: { [key: string]: any[] }, habit) => {
      const category = habit.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(habit);
      return groups;
    }, {});

    const categoryPerformances: CategoryPerformance[] = [];

    // Calculate performance for each category
    for (const [category, categoryHabits] of Object.entries(categoryGroups)) {
      const categoryHabitIds = categoryHabits.map(h => h.id);
      
      // Get completions for this category
      const categoryCompletions = completions.filter(c => 
        categoryHabitIds.includes(c.habitId)
      );

      // Calculate metrics
      const totalHabits = categoryHabits.length;
      const completedHabits = categoryHabits.filter(habit => {
        const habitCompletions = categoryCompletions.filter(c => c.habitId === habit.id);
        return habitCompletions.length > 0;
      }).length;

      // Calculate completion rate (percentage of habits with at least one completion)
      const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

      // Calculate consistency score (based on recent completions)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const recentCompletions = categoryCompletions.filter(c => {
        const completionDate = new Date(c.completedAt);
        return completionDate >= thirtyDaysAgo;
      });

      // Calculate average streak for this category
      const averageStreak = calculateAverageStreak(categoryHabits, categoryCompletions);

      // Calculate consistency score (0-100)
      const consistencyScore = calculateConsistencyScore(
        categoryHabits, 
        categoryCompletions, 
        recentCompletions.length
      );

      // Calculate overall performance (weighted combination)
      const performance = calculateOverallPerformance(
        completionRate,
        consistencyScore,
        averageStreak,
        totalHabits
      );

      // Get last completion date
      const lastCompletion = categoryCompletions.length > 0 
        ? new Date(Math.max(...categoryCompletions.map(c => new Date(c.completedAt).getTime())))
        : null;

      categoryPerformances.push({
        category,
        performance: Math.round(performance),
        completionRate: Math.round(completionRate),
        consistencyScore: Math.round(consistencyScore),
        totalHabits,
        completedHabits,
        averageStreak: Math.round(averageStreak * 10) / 10,
        lastCompletion
      });
    }

    // Sort by performance (highest first)
    return categoryPerformances.sort((a, b) => b.performance - a.performance);

  } catch (error) {
    console.error('Error calculating category performance:', error);
    return [];
  }
}

/**
 * Calculate average streak for habits in a category
 */
function calculateAverageStreak(habits: any[], completions: any[]): number {
  if (habits.length === 0) return 0;

  let totalStreak = 0;
  let habitsWithStreak = 0;

  for (const habit of habits) {
    const habitCompletions = completions
      .filter(c => c.habitId === habit.id)
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

    if (habitCompletions.length > 0) {
      const streak = calculateHabitStreak(habitCompletions);
      totalStreak += streak;
      habitsWithStreak++;
    }
  }

  return habitsWithStreak > 0 ? totalStreak / habitsWithStreak : 0;
}

/**
 * Calculate streak for a single habit
 */
function calculateHabitStreak(completions: any[]): number {
  if (completions.length === 0) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let streak = 0;
  let currentDate = new Date(today);

  // Check if today was completed
  const todayCompleted = completions.some(c => {
    const completionDate = new Date(c.completedAt);
    const completionDay = new Date(completionDate.getFullYear(), completionDate.getMonth(), completionDate.getDate());
    return completionDay.getTime() === today.getTime();
  });

  if (!todayCompleted) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Count consecutive days
  while (true) {
    const dayCompleted = completions.some(c => {
      const completionDate = new Date(c.completedAt);
      const completionDay = new Date(completionDate.getFullYear(), completionDate.getMonth(), completionDate.getDate());
      return completionDay.getTime() === currentDate.getTime();
    });

    if (dayCompleted) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate consistency score for a category
 */
function calculateConsistencyScore(
  habits: any[], 
  completions: any[], 
  recentCompletions: number
): number {
  if (habits.length === 0) return 0;

  // Base score from recent activity
  const recentActivityScore = Math.min(50, recentCompletions * 5);

  // Consistency bonus (more habits = more consistency potential)
  const habitCountBonus = Math.min(30, habits.length * 3);

  // Completion frequency bonus
  const totalCompletions = completions.length;
  const completionFrequencyScore = Math.min(20, totalCompletions * 2);

  return Math.min(100, recentActivityScore + habitCountBonus + completionFrequencyScore);
}

/**
 * Calculate overall performance score
 */
function calculateOverallPerformance(
  completionRate: number,
  consistencyScore: number,
  averageStreak: number,
  totalHabits: number
): number {
  // Weighted combination
  const completionWeight = 0.4;
  const consistencyWeight = 0.3;
  const streakWeight = 0.2;
  const habitCountWeight = 0.1;

  // Normalize streak (max 30 days = 100 points)
  const normalizedStreak = Math.min(100, (averageStreak / 30) * 100);

  // Normalize habit count (max 10 habits = 100 points)
  const normalizedHabitCount = Math.min(100, (totalHabits / 10) * 100);

  const performance = 
    (completionRate * completionWeight) +
    (consistencyScore * consistencyWeight) +
    (normalizedStreak * streakWeight) +
    (normalizedHabitCount * habitCountWeight);

  return Math.min(100, Math.max(0, performance));
}

/**
 * Get the top performing categories for "Excel at" display
 */
export async function getTopPerformingCategories(userId: string, limit: number = 3): Promise<string[]> {
  const performances = await calculateCategoryPerformance(userId);
  
  // Filter categories with meaningful performance (> 20%)
  const meaningfulCategories = performances.filter(p => p.performance > 20);
  
  // Return top categories
  return meaningfulCategories
    .slice(0, limit)
    .map(p => p.category);
}
