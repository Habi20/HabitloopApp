import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RecommendationEngine } from '../recommendationEngine';
import { storage } from '../storage';

// Mock the storage module
jest.mock('../storage', () => ({
  storage: {
    getUser: jest.fn(),
    getUserHabits: jest.fn(),
    getHabitCompletions: jest.fn(),
    calculateLevel: jest.fn()
  }
}));

const mockStorage = storage as jest.Mocked<typeof storage>;

describe('RecommendationEngine', () => {
  let engine: RecommendationEngine;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    engine = new RecommendationEngine();
    jest.clearAllMocks();
  });

  describe('generatePersonalizedRecommendations', () => {
    it('should filter out duplicate habit titles', async () => {
      // Setup mock data
      mockStorage.getUser.mockResolvedValue({
        id: testUserId,
        xp: 100,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockStorage.getUserHabits.mockResolvedValue([
        {
          id: 1,
          userId: testUserId,
          title: 'Morning Meditation',
          description: 'Existing meditation habit',
          category: 'mindfulness',
          targetValue: 10,
          unit: 'minutes',
          reminderTime: '07:00',
          frequency: 'daily',
          color: '#8B5CF6',
          icon: '🧘',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      mockStorage.getHabitCompletions.mockResolvedValue([]);
      mockStorage.calculateLevel.mockReturnValue(2);

      const recommendations = await engine.generatePersonalizedRecommendations(testUserId);

      // Should not include Morning Meditation since user already has it
      const titles = recommendations.map(r => r.title);
      expect(titles).not.toContain('Morning Meditation');
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should limit habits per category to avoid oversaturation', async () => {
      mockStorage.getUser.mockResolvedValue({
        id: testUserId,
        xp: 200,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // User already has 2 mindfulness habits
      mockStorage.getUserHabits.mockResolvedValue([
        {
          id: 1,
          userId: testUserId,
          title: 'Meditation Session',
          category: 'mindfulness',
          targetValue: 10,
          unit: 'minutes',
          reminderTime: '07:00',
          frequency: 'daily',
          color: '#8B5CF6',
          icon: '🧘',
          description: 'Daily meditation',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          userId: testUserId,
          title: 'Breathing Exercise',
          category: 'mindfulness',
          targetValue: 5,
          unit: 'minutes',
          reminderTime: '12:00',
          frequency: 'daily',
          color: '#8B5CF6',
          icon: '🌬️',
          description: 'Breathing practice',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      mockStorage.getHabitCompletions.mockResolvedValue([]);
      mockStorage.calculateLevel.mockReturnValue(3);

      const recommendations = await engine.generatePersonalizedRecommendations(testUserId);

      // Should not recommend more mindfulness habits
      const mindfulnessRecs = recommendations.filter(r => r.category === 'mindfulness');
      expect(mindfulnessRecs.length).toBe(0);
    });

    it('should filter hard habits for low-level users', async () => {
      mockStorage.getUser.mockResolvedValue({
        id: testUserId,
        xp: 50, // Low XP = low level
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockStorage.getUserHabits.mockResolvedValue([]);
      mockStorage.getHabitCompletions.mockResolvedValue([]);
      mockStorage.calculateLevel.mockReturnValue(1); // Level 1 user

      const recommendations = await engine.generatePersonalizedRecommendations(testUserId);

      // Should not include hard difficulty habits for level 1 user
      const hardHabits = recommendations.filter(r => r.difficulty === 'hard');
      expect(hardHabits.length).toBe(0);
    });

    it('should prioritize missing categories', async () => {
      mockStorage.getUser.mockResolvedValue({
        id: testUserId,
        xp: 300,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // User only has fitness habits
      mockStorage.getUserHabits.mockResolvedValue([
        {
          id: 1,
          userId: testUserId,
          title: 'Daily Run',
          category: 'fitness',
          targetValue: 30,
          unit: 'minutes',
          reminderTime: '07:00',
          frequency: 'daily',
          color: '#DC2626',
          icon: '🏃',
          description: 'Morning run',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      mockStorage.getHabitCompletions.mockResolvedValue([]);
      mockStorage.calculateLevel.mockReturnValue(4);

      const recommendations = await engine.generatePersonalizedRecommendations(testUserId);

      // First recommendation should be from a missing category (not fitness)
      expect(recommendations[0].category).not.toBe('fitness');
      expect(['mindfulness', 'learning', 'nutrition', 'health']).toContain(recommendations[0].category);
    });

    it('should generate personalized AI reasoning based on user level and completion rate', async () => {
      mockStorage.getUser.mockResolvedValue({
        id: testUserId,
        xp: 500, // Advanced level
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockStorage.getUserHabits.mockResolvedValue([]);
      mockStorage.getHabitCompletions.mockResolvedValue([
        // High completion rate
        { id: 1, habitId: 1, userId: testUserId, completedAt: '2024-01-01', createdAt: new Date() },
        { id: 2, habitId: 1, userId: testUserId, completedAt: '2024-01-02', createdAt: new Date() },
        { id: 3, habitId: 1, userId: testUserId, completedAt: '2024-01-03', createdAt: new Date() }
      ]);
      mockStorage.calculateLevel.mockReturnValue(6); // Advanced user

      const recommendations = await engine.generatePersonalizedRecommendations(testUserId);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].aiReasoning).toContain('advanced');
      expect(recommendations[0].aiReasoning).toContain('excellent');
    });

    it('should return up to 5 recommendations', async () => {
      mockStorage.getUser.mockResolvedValue({
        id: testUserId,
        xp: 100,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockStorage.getUserHabits.mockResolvedValue([]);
      mockStorage.getHabitCompletions.mockResolvedValue([]);
      mockStorage.calculateLevel.mockReturnValue(2);

      const recommendations = await engine.generatePersonalizedRecommendations(testUserId);

      expect(recommendations.length).toBeLessThanOrEqual(5);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      mockStorage.getUser.mockRejectedValue(new Error('Database error'));

      await expect(engine.generatePersonalizedRecommendations(testUserId))
        .rejects.toThrow('Database error');
    });
  });
});