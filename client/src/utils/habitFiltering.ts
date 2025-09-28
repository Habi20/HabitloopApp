/**
 * Utility functions for filtering habits based on frequency and schedule
 */

/**
 * Check if a habit should appear today based on its frequency and schedule
 * @param habit - The habit object with frequency and selectedDays
 * @param targetDate - Optional target date (defaults to today)
 * @returns boolean indicating if the habit should appear
 */
export function shouldHabitAppearToday(habit: any, targetDate?: Date): boolean {
  const today = targetDate || new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = today.getDate();
  
  switch (habit.frequency) {
    case 'daily':
      return true;
    
    case 'weekly':
      if (!habit.selectedDays || habit.selectedDays.length === 0) {
        return true; // If no specific days, show every day
      }
      // Convert selectedDays (1-7) to dayOfWeek (0-6) format
      // selectedDays: 1=Monday, 2=Tuesday, ..., 7=Sunday
      // dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
      const selectedDays = habit.selectedDays.map((day: number) => day === 7 ? 0 : day);
      return selectedDays.includes(dayOfWeek);
    
    case 'monthly':
      if (!habit.selectedDays || habit.selectedDays.length === 0) {
        return true; // If no specific days, show every day
      }
      return habit.selectedDays.includes(dayOfMonth);
    
    default:
      return true; // Fallback to showing all habits
  }
}

/**
 * Filter habits to show only those that should appear on a specific date
 * @param habits - Array of habit objects
 * @param targetDate - Optional target date (defaults to today)
 * @returns Filtered array of habits
 */
export function filterHabitsForDate(habits: any[], targetDate?: Date): any[] {
  return habits.filter(habit => shouldHabitAppearToday(habit, targetDate));
}

/**
 * Get habits that should appear today
 * @param habits - Array of habit objects
 * @returns Array of habits for today
 */
export function getTodaysHabits(habits: any[]): any[] {
  return filterHabitsForDate(habits);
}

/**
 * Get habits that should appear on a specific day of the week
 * @param habits - Array of habit objects
 * @param dayOfWeek - Day of week (0=Sunday, 1=Monday, etc.)
 * @returns Array of habits for that day
 */
export function getHabitsForDayOfWeek(habits: any[], dayOfWeek: number): any[] {
  const targetDate = new Date();
  // Set to the specific day of the week
  const daysUntilTarget = (dayOfWeek - targetDate.getDay() + 7) % 7;
  targetDate.setDate(targetDate.getDate() + daysUntilTarget);
  
  return filterHabitsForDate(habits, targetDate);
}

/**
 * Get habits that should appear on a specific day of the month
 * @param habits - Array of habit objects
 * @param dayOfMonth - Day of month (1-31)
 * @returns Array of habits for that day
 */
export function getHabitsForDayOfMonth(habits: any[], dayOfMonth: number): any[] {
  const targetDate = new Date();
  targetDate.setDate(dayOfMonth);
  
  return filterHabitsForDate(habits, targetDate);
}

/**
 * Format recurrence pattern for display
 * @param habit - The habit object
 * @returns Formatted string representation
 */
export function formatRecurrencePattern(habit: any): string {
  if (!habit.frequency || habit.frequency === 'daily') {
    return 'Daily';
  }
  
  if (habit.frequency === 'weekly' && habit.selectedDays && habit.selectedDays.length > 0) {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const selectedDayNames = habit.selectedDays
      .map((day: number) => dayNames[day - 1]) // Convert 1-7 to 0-6 for array index
      .filter(Boolean);
    
    if (selectedDayNames.length === 0) return 'Weekly';
    if (selectedDayNames.length === 1) return `Weekly (${selectedDayNames[0]})`;
    if (selectedDayNames.length <= 3) return `Weekly (${selectedDayNames.join(', ')})`;
    return `Weekly (${selectedDayNames.length} days)`;
  }
  
  if (habit.frequency === 'monthly' && habit.selectedDays && habit.selectedDays.length > 0) {
    const sortedDays = [...habit.selectedDays].sort((a, b) => a - b);
    if (sortedDays.length === 0) return 'Monthly';
    if (sortedDays.length === 1) return `Monthly (${sortedDays[0]}${getOrdinalSuffix(sortedDays[0])})`;
    if (sortedDays.length <= 3) return `Monthly (${sortedDays.map(d => d + getOrdinalSuffix(d)).join(', ')})`;
    return `Monthly (${sortedDays.length} days)`;
  }
  
  return 'Daily'; // Fallback
}

/**
 * Get ordinal suffix (1st, 2nd, 3rd, etc.)
 * @param num - Number to get suffix for
 * @returns Ordinal suffix string
 */
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}
