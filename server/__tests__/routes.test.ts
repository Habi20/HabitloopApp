
import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { routes } from '../routes';

// Mock database
jest.mock('pg');
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn()
};
(Pool as jest.Mock).mockImplementation(() => mockPool);

const app = express();
app.use(express.json());
app.use('/api', routes);

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
        description: 'Updated description'
      };

      mockPool.query.mockResolvedValue({ 
        rows: [{ id: 1, ...updatedHabit }],
        rowCount: 1
      });

      const response = await request(app)
        .put('/api/habits/1')
        .set('user-id', 'test-user')
        .send(updatedHabit);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.habit.title).toBe(updatedHabit.title);
    });

    it('DELETE /api/habits/:id removes habit', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .delete('/api/habits/1')
        .set('user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('handles database errors gracefully', async () => {
      mockPool.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/habits')
        .set('user-id', 'test-user');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Database error');
    });
  });

  describe('Completions Endpoints', () => {
    it('POST /api/completions creates completion', async () => {
      const completion = {
        habitId: 1,
        completedAt: '2024-01-15',
        value: 1
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

    it('prevents duplicate completions for same day', async () => {
      mockPool.query.mockResolvedValue({ 
        rows: [{ id: 1, habit_id: 1, completed_at: '2024-01-15' }] 
      });

      const completion = {
        habitId: 1,
        completedAt: '2024-01-15',
        value: 1
      };

      const response = await request(app)
        .post('/api/completions')
        .set('user-id', 'test-user')
        .send(completion);

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already completed');
    });
  });

  describe('ML Endpoints', () => {
    it('GET /api/ml/status returns model status', async () => {
      const response = await request(app)
        .get('/api/ml/status')
        .set('user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('trained');
    });

    it('POST /api/ml/predict returns predictions', async () => {
      const predictionData = {
        habitId: 1,
        features: {
          streak: 5,
          timeOfDay: 'morning',
          difficulty: 'medium'
        }
      };

      const response = await request(app)
        .post('/api/ml/predict')
        .set('user-id', 'test-user')
        .send(predictionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.prediction).toHaveProperty('success_probability');
    });

    it('handles invalid prediction input', async () => {
      const invalidData = {
        // Missing required fields
        features: {}
      };

      const response = await request(app)
        .post('/api/ml/predict')
        .set('user-id', 'test-user')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication', () => {
    it('requires authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/habits');
        // No user-id header

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('unauthorized');
    });

    it('validates user exists', async () => {
      mockPool.query.mockResolvedValue({ rows: [] }); // No user found

      const response = await request(app)
        .get('/api/habits')
        .set('user-id', 'invalid-user');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('user not found');
    });
  });

  describe('Edge Cases', () => {
    it('handles malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/habits')
        .set('user-id', 'test-user')
        .set('Content-Type', 'application/json')
        .send('invalid json{');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid JSON');
    });

    it('handles SQL injection attempts', async () => {
      const maliciousInput = {
        title: "'; DROP TABLE habits; --",
        category: 'Health'
      };

      mockPool.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post('/api/habits')
        .set('user-id', 'test-user')
        .send(maliciousInput);

      // Should sanitize input and not execute malicious SQL
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO habits/),
        expect.arrayContaining([expect.stringContaining('DROP TABLE')])
      );
    });

    it('handles database timeouts', async () => {
      mockPool.query.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 100)
        )
      );

      const response = await request(app)
        .get('/api/habits')
        .set('user-id', 'test-user');

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('timeout');
    }, 10000);
  });
});
