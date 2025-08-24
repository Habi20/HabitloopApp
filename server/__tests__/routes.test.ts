
// CRITICAL: Environment setup must be first to prevent __filename conflicts
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret';
process.env.OPENAI_API_KEY = 'test-key';

// Setup environment first to avoid __filename conflicts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { registerRoutes } from '../routes/index.js';

// Mock database
jest.mock('pg');
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn()
};
(Pool as unknown as jest.Mock).mockImplementation(() => mockPool);

const app = express();
app.use(express.json());

// Register routes
registerRoutes(app);

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Habits Endpoints', () => {
    it('GET /api/habits returns user habits', async () => {
      const mockHabits = [
        {
          id: 1,
          title: 'Exercise',
          description: 'Daily workout',
          category: 'Health',
          target_value: 30,
          unit: 'minutes'
        }
      ];

      mockPool.query.mockResolvedValue({ rows: mockHabits });

      const response = await request(app)
        .get('/api/habits')
        .set('user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.habits).toEqual(mockHabits);
    });

    it('POST /api/habits creates new habit', async () => {
      const newHabit = {
        title: 'New Habit',
        description: 'Test description',
        category: 'Health',
        targetValue: 1,
        unit: 'session',
        frequency: 'daily'
      };

      mockPool.query.mockResolvedValue({ 
        rows: [{ id: 1, ...newHabit }] 
      });

      const response = await request(app)
        .post('/api/habits')
        .set('user-id', 'test-user')
        .send(newHabit);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.habit.title).toBe(newHabit.title);
    });

    it('POST /api/habits validates required fields', async () => {
      const invalidHabit = {
        title: '', // Missing title
        category: 'Health'
      };

      const response = await request(app)
        .post('/api/habits')
        .set('user-id', 'test-user')
        .send(invalidHabit);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('PUT /api/habits/:id updates habit', async () => {
      const updatedHabit = {
        title: 'Updated Habit',
        description: 'Updated description',
        category: 'Health',
        targetValue: 2,
        unit: 'session',
        frequency: 'daily'
      };

      mockPool.query.mockResolvedValue({ 
        rows: [{ id: 1, ...updatedHabit }] 
      });

      const response = await request(app)
        .put('/api/habits/1')
        .set('user-id', 'test-user')
        .send(updatedHabit);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.habit.title).toBe(updatedHabit.title);
    });
  });

  describe('Completions Endpoints', () => {
    it('POST /api/completions creates completion', async () => {
      const completion = {
        habitId: 1,
        value: 30,
        date: '2025-08-25'
      };

      mockPool.query.mockResolvedValue({ 
        rows: [{ id: 1, ...completion }] 
      });

      const response = await request(app)
        .post('/api/completions')
        .set('user-id', 'test-user')
        .send(completion);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/completions/:id deletes completion', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .delete('/api/completions/1')
        .set('user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Analytics Endpoints', () => {
    it('GET /api/analytics/xp-calculation returns XP data', async () => {
      const mockXPData = {
        totalXP: 1000,
        breakdown: []
      };

      mockPool.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/analytics/xp-calculation')
        .set('user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/analytics/streaks returns streak data', async () => {
      const mockStreakData = {
        habits: [],
        summary: {
          totalCurrentStreak: 5,
          totalLongestStreak: 10
        }
      };

      mockPool.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/analytics/streaks')
        .set('user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
