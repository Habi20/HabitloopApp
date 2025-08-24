
// CRITICAL: Environment setup must be first to prevent __filename conflicts
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret';
process.env.OPENAI_API_KEY = 'test-key';

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mlAdvancedService, QuestionnaireData } from '../ml/services/mlAdvancedService.js';
import fs from 'fs';
import path from 'path';

// Mock file system
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('MLAdvancedService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Model Training', () => {
    it('trains model with synthetic data when no real data exists', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {});
      
      const result = await mlAdvancedService.trainModelsWithSyntheticData();
      expect(result.success).toBe(true);
    });

    it('handles training failures gracefully', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('File write failed');
      });

      const result = await mlAdvancedService.trainModelsWithSyntheticData();
      expect(result.success).toBe(false);
      expect(result.error).toContain('File write failed');
    });
  });

  describe('Predictions', () => {
    it('makes predictions with questionnaire data', async () => {
      const questionnaireData: QuestionnaireData = {
        focus_areas: ['Health'],
        motivation_time: 'Morning',
        current_habits: ['Exercise'],
        main_goals: 'Weight Loss',
        mood_description: 'Energetic',
        motivation_type: 'Intrinsic',
        procrastination_time: 'Evening',
        best_habit_time: 'Morning',
        missed_habit_feeling: 'Guilty',
        biggest_distraction: 'Social Media'
      };

      const habitData = {
        title: 'Exercise',
        category: 'Health',
        targetValue: 30,
        unit: 'minutes',
        frequency: 'daily',
        difficulty: 'medium'
      };

      const prediction = await mlAdvancedService.predictHabitSuccess('user-001', habitData, questionnaireData);
      
      expect(prediction).toHaveProperty('success_probability');
      expect(prediction).toHaveProperty('confidence_level');
      expect(prediction).toHaveProperty('recommendations');
      expect(prediction).toHaveProperty('key_factors');
      expect(prediction).toHaveProperty('difficulty_assessment');
    });

    it('handles invalid input gracefully', async () => {
      const invalidData: QuestionnaireData = {
        focus_areas: [],
        motivation_time: '',
        current_habits: [],
        main_goals: '',
        mood_description: '',
        motivation_type: '',
        procrastination_time: '',
        best_habit_time: '',
        missed_habit_feeling: '',
        biggest_distraction: ''
      };
      
      await expect(mlAdvancedService.predictHabitSuccess('user-001', invalidData, invalidData))
        .rejects.toThrow();
    });
  });

  describe('Personalized Recommendations', () => {
    it('generates personalized recommendations', async () => {
      const questionnaireData: QuestionnaireData = {
        focus_areas: ['Health', 'Productivity'],
        motivation_time: 'Morning',
        current_habits: ['Exercise'],
        main_goals: 'Weight Loss',
        mood_description: 'Energetic',
        motivation_type: 'Intrinsic',
        procrastination_time: 'Evening',
        best_habit_time: 'Morning',
        missed_habit_feeling: 'Guilty',
        biggest_distraction: 'Social Media'
      };

      const recommendations = await mlAdvancedService.getPersonalizedRecommendations('user-001', questionnaireData);
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.every(rec => typeof rec === 'string')).toBe(true);
    });
  });

  describe('Model Status', () => {
    it('returns model status information', async () => {
      const status = await mlAdvancedService.getModelStatus();
      
      expect(status).toHaveProperty('trained');
      expect(status).toHaveProperty('model_path');
      expect(status).toHaveProperty('version');
      expect(typeof status.trained).toBe('boolean');
    });
  });
});
