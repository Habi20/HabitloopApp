import { useMemo } from 'react';
import { getTodaysHabits, shouldHabitAppearToday, filterHabitsForDate } from '../utils/habitFiltering';

/**
 * Custom hook for filtering habits based on frequency and schedule
 * @param habits - Array of habit objects
 * @param targetDate - Optional target date (defaults to today)
 * @returns Filtered habits and utility functions
 */
export function useHabitFiltering(habits: any[], targetDate?: Date) {
  const todaysHabits = useMemo(() => {
    return getTodaysHabits(habits);
  }, [habits]);

  const filteredHabits = useMemo(() => {
    return filterHabitsForDate(habits, targetDate);
  }, [habits, targetDate]);

  const shouldAppearToday = useMemo(() => {
    return (habit: any) => shouldHabitAppearToday(habit, targetDate);
  }, [targetDate]);

  return {
    todaysHabits,
    filteredHabits,
    shouldAppearToday,
    totalHabits: habits.length,
    filteredCount: filteredHabits.length
  };
}

/**
 * Hook specifically for today's habits
 * @param habits - Array of habit objects
 * @returns Today's habits and related data
 */
export function useTodaysHabits(habits: any[]) {
  const { todaysHabits, totalHabits, filteredCount } = useHabitFiltering(habits);
  
  return {
    habits: todaysHabits,
    totalHabits,
    todaysCount: filteredCount,
    hasHabits: todaysHabits.length > 0
  };
}
