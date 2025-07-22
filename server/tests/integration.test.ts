import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { Express } from "express";
import { registerRoutes } from "../routes";
import express from "express";

describe("Full Integration Tests", () => {
  let app: Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  describe("Complete User Journey", () => {
    it("should handle complete habit lifecycle", async () => {
      // 1. Create habit
      const createResponse = await request(app)
        .post("/api/habits")
        .set("Cookie", "session=mock-session")
        .send({
          title: "Integration Test Habit",
          category: "health",
          targetValue: 1,
          frequency: "daily",
        });

      expect(createResponse.status).toBe(200);
      const habitId = createResponse.body.id;

      // 2. Complete habit
      const completeResponse = await request(app)
        .post("/api/completions")
        .set("Cookie", "session=mock-session")
        .send({
          habitId,
          completedAt: new Date().toISOString().split("T")[0],
          value: 1,
        });

      expect(completeResponse.status).toBe(200);

      // 3. Check streak
      const streakResponse = await request(app)
        .get(`/api/streaks/${habitId}`)
        .set("Cookie", "session=mock-session");

      expect(streakResponse.status).toBe(200);

      // 4. Update habit
      const updateResponse = await request(app)
        .put(`/api/habits/${habitId}`)
        .set("Cookie", "session=mock-session")
        .send({
          title: "Updated Integration Test Habit",
        });

      expect(updateResponse.status).toBe(200);

      // 5. Delete habit
      const deleteResponse = await request(app)
        .delete(`/api/habits/${habitId}`)
        .set("Cookie", "session=mock-session");

      expect(deleteResponse.status).toBe(200);
    });
  });

  describe("AI Integration Flow", () => {
    it("should handle complete AI coaching flow", async () => {
      // 1. Generate coaching insight
      const coachingResponse = await request(app)
        .post("/api/coaching/generate-insight")
        .set("Cookie", "session=mock-session");

      expect([200, 404]).toContain(coachingResponse.status);

      // 2. Get recommendations
      const recommendationsResponse = await request(app)
        .get("/api/ai/recommendations")
        .set("Cookie", "session=mock-session");

      expect(recommendationsResponse.status).toBe(200);
      expect(Array.isArray(recommendationsResponse.body)).toBe(true);

      // 3. Process questionnaire
      const questionnaireResponse = await request(app)
        .post("/api/ai/questionnaire")
        .set("Cookie", "session=mock-session")
        .send({
          focusAreas: ["health", "productivity"],
          motivationTime: "morning",
          goals: ["fitness", "mindfulness"],
        });

      expect(questionnaireResponse.status).toBe(200);
    });
  });
});
