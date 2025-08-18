// Core types for the HabitLoop application

export interface Habit {
  id: string;
  name: string;
  title: string;
  category: string;
  description?: string;
  targetValue: number;
  unit: string;
  frequency: string;
  isActive: boolean;
  color: string;
  icon: string;
  streak: number;
  userId: string;
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Completion {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  completedAt: string;
  value: number;
  createdAt: string;
}

export interface StatsData {
  habits: Habit[];
  completions: Completion[];
  totalHabits: number;
  totalCompletions: number;
  currentLevel: number;
  currentXP: number;
}

export interface EmailIntegration {
  connected: boolean;
  email: string;
  provider: string;
}

export interface ModelStatus {
  r2_score: number;
  accuracy: number;
  status: string;
  lastUpdated: string;
  trained: boolean;
  model_path: string;
  last_trained: string | null;
  file_size: number;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  level: number;
  xp: number;
  role: string;
  isGuest: boolean;
  difficulty: string;
  profileImageUrl?: string;
  questionnaire?: any;
  emailSettings?: any;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: (userData?: any) => Promise<void>;
  loginAsHabitLoopUser: (userData: any) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuthStatus: () => Promise<void>;
  refreshUserData: () => Promise<User | undefined>;
  getUserDisplayName: (user: User | null) => string;
  getUserEmail: (user: User | null) => string;
  getUserInitials: (user: User | null) => string;
  getCurrentUser: () => User | null;
  isGuestUser: () => boolean;
  isAuthenticatedUser: () => boolean;
}
