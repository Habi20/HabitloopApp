
import { MLAdvancedService } from '../mlAdvancedService';
import fs from 'fs';
import path from 'path';

// Mock file system
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('MLAdvancedService', () => {
  let mlService: MLAdvancedService;

  beforeEach(() => {
    jest.clearAllMocks();
    mlService = new MLAdvancedService();
  });

  describe('Model Training', () => {
    it('trains model with synthetic data when no real data exists', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {});
      
      await mlService.trainModel([]);

      expect(mlService.isModelTrained()).toBe(true);
    });

    it('trains model with real user data when available', async () => {
      const userData = [
        {
          userId: 'user1',
          habitId: 1,
          streak: 5,
          completionRate: 0.8,
          timeConsistency: 0.9,
          difficultyRating: 3,
          categoryEngagement: 0.7,
          reminderEffectiveness: 0.6,
          socialSupport: 0.4,
          environmentalFactors: 0.8,
          completed: true
        }
      ];

      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {});

      await mlService.trainModel(userData);

      expect(mlService.isModelTrained()).toBe(true);
    });

    it('handles training failures gracefully', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('File write failed');
      });

      await expect(mlService.trainModel([])).rejects.toThrow('File write failed');
      expect(mlService.isModelTrained()).toBe(false);
    });
  });

  describe('Predictions', () => {
    beforeEach(async () => {
      // Setup trained model
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {});
      await mlService.trainModel([]);
    });

    it('makes accurate predictions for good habits', async () => {
      const goodHabitFeatures = {
        streak: 10,
        completionRate: 0.9,
        timeConsistency: 0.95,
        difficultyRating: 2,
        categoryEngagement: 0.8,
        reminderEffectiveness: 0.85,
        socialSupport: 0.7,
        environmentalFactors: 0.9
      };

      const prediction = await mlService.predict(goodHabitFeatures);

      expect(prediction.success_probability).toBeGreaterThan(0.7);
      expect(prediction.confidence).toBeGreaterThan(0.6);
      expect(prediction.factors).toContain('consistency');
    });

    it('makes predictions for challenging habits', async () => {
      const challengingHabitFeatures = {
        streak: 1,
        completionRate: 0.3,
        timeConsistency: 0.4,
        difficultyRating: 5,
        categoryEngagement: 0.2,
        reminderEffectiveness: 0.3,
        socialSupport: 0.1,
        environmentalFactors: 0.4
      };

      const prediction = await mlService.predict(challengingHabitFeatures);

      expect(prediction.success_probability).toBeLessThan(0.5);
      expect(prediction.recommendations).toContain('Start small');
    });

    it('handles invalid input gracefully', async () => {
      const invalidFeatures = {
        streak: -1, // Invalid negative streak
        completionRate: 1.5, // Invalid rate > 1
        timeConsistency: 'invalid' as any // Invalid type
      };

      await expect(mlService.predict(invalidFeatures)).rejects.toThrow('Invalid input');
    });

    it('provides consistent predictions for same input', async () => {
      const features = {
        streak: 5,
        completionRate: 0.7,
        timeConsistency: 0.8,
        difficultyRating: 3,
        categoryEngagement: 0.6,
        reminderEffectiveness: 0.7,
        socialSupport: 0.5,
        environmentalFactors: 0.8
      };

      const prediction1 = await mlService.predict(features);
      const prediction2 = await mlService.predict(features);

      expect(Math.abs(prediction1.success_probability - prediction2.success_probability)).toBeLessThan(0.1);
    });
  });

  describe('Model Persistence', () => {
    it('saves model to disk after training', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {});

      await mlService.trainModel([]);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('metadata.json'),
        expect.stringContaining('accuracy')
      );
    });

    it('loads existing model from disk', async () => {
      const modelMetadata = {
        trained: true,
        accuracy: 0.85,
        lastUpdated: new Date().toISOString(),
        modelPath: '/test/path'
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(modelMetadata));

      const newService = new MLAdvancedService();
      await newService.initialize();

      expect(newService.isModelTrained()).toBe(true);
      expect(newService.getModelAccuracy()).toBe(0.85);
    });

    it('handles corrupted model files', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('corrupted json{');

      const newService = new MLAdvancedService();
      await newService.initialize();

      expect(newService.isModelTrained()).toBe(false);
    });
  });

  describe('Performance Metrics', () => {
    it('calculates model accuracy correctly', async () => {
      const trainingData = Array.from({ length: 100 }, (_, i) => ({
        userId: `user${i}`,
        habitId: i,
        streak: Math.random() * 30,
        completionRate: Math.random(),
        timeConsistency: Math.random(),
        difficultyRating: Math.floor(Math.random() * 5) + 1,
        categoryEngagement: Math.random(),
        reminderEffectiveness: Math.random(),
        socialSupport: Math.random(),
        environmentalFactors: Math.random(),
        completed: Math.random() > 0.5
      }));

      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {});

      await mlService.trainModel(trainingData);

      const accuracy = mlService.getModelAccuracy();
      expect(accuracy).toBeGreaterThan(0.6); // Minimum acceptable accuracy
      expect(accuracy).toBeLessThanOrEqual(1.0);
    });

    it('tracks prediction confidence levels', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {});
      await mlService.trainModel([]);

      const features = {
        streak: 5,
        completionRate: 0.7,
        timeConsistency: 0.8,
        difficultyRating: 3,
        categoryEngagement: 0.6,
        reminderEffectiveness: 0.7,
        socialSupport: 0.5,
        environmentalFactors: 0.8
      };

      const prediction = await mlService.predict(features);

      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles empty training data', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {});

      await mlService.trainModel([]);

      expect(mlService.isModelTrained()).toBe(true);
    });

    it('handles prediction requests before model training', async () => {
      const features = {
        streak: 5,
        completionRate: 0.7,
        timeConsistency: 0.8,
        difficultyRating: 3,
        categoryEngagement: 0.6,
        reminderEffectiveness: 0.7,
        socialSupport: 0.5,
        environmentalFactors: 0.8
      };

      await expect(mlService.predict(features)).rejects.toThrow('Model not trained');
    });

    it('handles extreme input values', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {});
      await mlService.trainModel([]);

      const extremeFeatures = {
        streak: 999999,
        completionRate: 100,
        timeConsistency: -50,
        difficultyRating: 0,
        categoryEngagement: 2.5,
        reminderEffectiveness: -1,
        socialSupport: 10,
        environmentalFactors: 0
      };

      const prediction = await mlService.predict(extremeFeatures);

      // Should handle extreme values gracefully
      expect(prediction.success_probability).toBeGreaterThanOrEqual(0);
      expect(prediction.success_probability).toBeLessThanOrEqual(1);
    });
  });
});
