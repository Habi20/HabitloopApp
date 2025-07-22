import type { Habit } from './habits';

export interface PredictionResponse {
  percentage: string;
  confidence: string;
}

export interface CalendarApiResponse {
  prediction: PredictionResponse;
  reminder_frequency: string;
  calendar_event_created: boolean;
  habit_data: Habit;
}

export interface CalendarIntegration {
  habit_id: number;
  habit_title: string;
  success_probability: string;
  confidence: string;
  reminder_frequency: string;
  calendar_event_created: boolean;
  next_reminder: string;
}
